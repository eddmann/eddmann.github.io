---
layout: post
title: 'Serverless Transactional Outbox Pattern: Two Practical Approaches'
meta: 'Explore two serverless implementations of the Transactional Outbox pattern using AWS technologies like DynamoDB Streams, EventBridge, and Fargate. Learn how to ensure reliable, atomic event publishing in distributed systems built on microservices and service-oriented architecture (SOA).'
summary: 'In this post, I explore how to implement the Transactional Outbox pattern using serverless technologies. I compare two practical approaches: one using DynamoDB Streams for event publishing, and the other using a relational database with a polling worker. Each approach has trade-offs, but both ensure atomicity between data changes and event publication.'
tags: ['serverless', 'aws', 'microservices']
---

If you've ever wrestled with getting reliable, atomic event publishing out of your service-oriented architecture - especially in a serverless context - you'll know it's challenging.
I recently found myself pondering the classic [Transactional Outbox pattern](https://microservices.io/patterns/data/transactional-outbox.html), and set out to explore how it might be implemented using modern serverless tooling.

In this post, I'll walk through two hands-on approaches:

- Using DynamoDB Streams for Change Data Capture (CDC)
- Leveraging a Relational Database with a polling worker

Both methods aim to ensure that state changes and their corresponding events are committed atomically - no more "Oops, the write succeeded but the event didn't publish!" moments.
You can find both of these implementations on [GitHub](https://github.com/eddmann/serverless-transactional-outbox-pattern).

Let's dive in!

## Why Transactional Outbox? 🤔

In service-oriented architectures like microservices, reliably publishing domain events is critical for building loosely coupled, event-driven systems.
However, distributed transactions are inherently difficult, and a key challenge is the _dual-write_ problem.

This problem arises when a single operation needs to perform both a database write (e.g., saving a record) and an event publication (e.g., sending a message to a message broker), typically involving two separate systems.
If one of these actions succeeds while the other fails - for instance, the database commit succeeds but the message publish fails - it can lead to data inconsistencies, such as:

- A record saved without a corresponding event notification
- An event published about a change that never actually occurred

The Transactional Outbox pattern sidesteps this by writing the event as data within the same transaction as your business entity.
Later, a separate process reads (or listens for) new events and publishes them to your event bus (e.g., [AWS EventBridge](https://aws.amazon.com/eventbridge/)).

This ensures that your system's state and emitted events remain consistent, even across system boundaries.

## Approach 1: DynamoDB Streams – Change Data Capture

I decided to start with DynamoDB, as it's a natural fit for serverless architectures.
My aim was to atomically create a product and an associated event, then let [DynamoDB Streams](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Streams.html) trigger the actual event publishing.

### How It Works

1. **Create Product Lambda:** Uses a DynamoDB [TransactWrite](https://docs.aws.amazon.com/amazondynamodb/latest/APIReference/API_TransactWriteItems.html) to insert both the product and the outbox event atomically.
2. **Outbox Event Table:** Dedicated DynamoDB table for storing outbox events.
3. **Event-Publishing Lambda:** Subscribed to the outbox table's stream; publishes new events to EventBridge.

#### 1. Atomic Write with TransactWrite

Here's the core of `create-product.js`:

```js
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const {
  DynamoDBDocumentClient,
  TransactWriteCommand,
} = require('@aws-sdk/lib-dynamodb');
const { randomUUID } = require('crypto');

module.exports.handle = async () => {
  const title = randomUUID(); // Just for demo purposes

  const event = {
    specversion: '1.0',
    id: randomUUID(),
    source: 'product',
    type: 'product.created',
    data: { title },
    time: new Date().toISOString(),
    dataschema: '',
    correlationid: randomUUID(),
  };

  await dynamo.send(
    new TransactWriteCommand({
      TransactItems: [
        {
          Put: {
            TableName: process.env.PRODUCT_TABLE_NAME,
            Item: { id: randomUUID(), title },
          },
        },
        {
          Put: {
            TableName: process.env.EVENT_OUTBOX_TABLE_NAME,
            Item: { id: randomUUID(), event: JSON.stringify(event) },
          },
        },
      ],
    })
  );

  return {
    statusCode: 201,
    body: JSON.stringify({ title }, null, 2),
  };
};
```

**What's happening here?**
I'm using DynamoDB's cross-table transaction support to ensure that both the product and its event are written together.
Either both succeed, or neither does - a lovely property!

#### 2. Event Outbox Table with Streams

The DynamoDB table for the outbox is configured with a stream:

```yaml
EventOutboxTable:
  Type: AWS::DynamoDB::Table
  Properties:
    AttributeDefinitions:
      - AttributeName: id
        AttributeType: S
    KeySchema:
      - AttributeName: id
        KeyType: HASH
    BillingMode: PAY_PER_REQUEST
    StreamSpecification:
      StreamViewType: NEW_IMAGE
```

We specify `NEW_IMAGE` in the stream configuration because we're only interested in the new version of the item that was just inserted into the outbox table.
In this use case, we don't need to compare the new and old versions of the record - only the new event payload matters for publishing.

#### 3. Lambda Publisher

`event-outbox.js` listens to the outbox table's stream and pushes new events to EventBridge:

```js
const {
  EventBridgeClient,
  PutEventsCommand,
} = require('@aws-sdk/client-eventbridge');

module.exports.handle = async streamEvent => {
  for (const record of streamEvent.Records) {
    if (record.eventName !== 'INSERT') continue;
    const event = JSON.parse(record.dynamodb.NewImage.event.S);

    await client.send(
      new PutEventsCommand({
        Entries: [
          {
            EventBusName: process.env.EVENT_BUS_ARN,
            Source: event.source,
            DetailType: event.type,
            Detail: record.dynamodb.NewImage.event.S,
          },
        ],
      })
    );
  }
};
```

**Nice and simple:** the Lambda is only triggered for new inserts, which represent new events needing to be published.

An added benefit of this approach is that we don't need to manage any continuously running polling task.
Instead, we get to leverage AWS's event-driven model, where the Lambda is automatically invoked when changes occur - similar to how SQS-triggered Lambdas work.
This reduces operational overhead and aligns well with serverless best practices.

## Approach 2: Relational Database – Polling Worker

For those of us still happily running Postgres or similar, I wanted to see how the outbox pattern could be realised with a traditional relational database - again, with serverless in mind.

### How It Works

1. **Create Product Lambda:** Inserts both a product and an outbox event in a single transaction.
2. **Outbox Table:** Holds the events to be published, with a `published_at` marker.
3. **Polling Worker:** Runs in Fargate, periodically checks for unpublished events, and publishes them to EventBridge.

#### 1. Atomic Write in Postgres

Here's the gist of `create-product.js`:

```js
const { Pool } = require('pg');
const { randomUUID } = require('crypto');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

module.exports.handle = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const title = randomUUID();

    await client.query('INSERT INTO product (title) VALUES ($1)', [title]);

    const event = {
      specversion: '1.0',
      id: randomUUID(),
      source: 'product',
      type: 'product.created',
      data: { title },
      time: new Date().toISOString(),
      dataschema: '',
      correlationid: randomUUID(),
    };

    await client.query('INSERT INTO event_outbox (event) VALUES ($1)', [
      JSON.stringify(event),
    ]);
    await client.query('COMMIT');

    return { statusCode: 201, body: JSON.stringify({ title }, null, 2) };
  } finally {
    client.release(true);
  }
};
```

Both inserts happen within a single transaction - so we're safe from partial failures.

#### 2. Polling Worker

The outbox worker (run as a Fargate task) keeps an eye on the outbox table, grabbing and publishing any unpublished events.

```js
const {
  EventBridgeClient,
  PutEventsCommand,
} = require('@aws-sdk/client-eventbridge');
const { Client } = require('pg');

(async () => {
  const db = new Client({ connectionString: process.env.DATABASE_URL });
  await db.connect();
  const eb = new EventBridgeClient();

  while (true) {
    const result = await db.query(
      'SELECT id, event FROM event_outbox WHERE published_at IS NULL LIMIT 1 FOR UPDATE'
    );

    if (result.rowCount === 0) {
      console.log('.');
      await new Promise(res => setTimeout(res, 10_000));
      continue;
    }

    const { id, event } = result.rows[0];
    await eb.send(
      new PutEventsCommand({
        Entries: [
          {
            EventBusName: process.env.EVENT_BUS_ARN,
            Source: event.source,
            DetailType: event.type,
            Detail: JSON.stringify(event),
          },
        ],
      })
    );
    await db.query(
      'UPDATE event_outbox SET published_at = CURRENT_TIMESTAMP WHERE id = $1',
      [id]
    );
  }
})();
```

**A few thoughts:**

The worker is designed to only pick up events that haven't yet been published, as indicated by the `published_at IS NULL` condition.
After a successful publish to EventBridge, it marks the event as published by setting the `published_at` timestamp.
This simple approach ensures that each event is processed only once.

To safely support concurrent workers, the solution relies on PostgreSQL's `FOR UPDATE` clause.
This mechanism locks the selected rows during processing, so only one worker can claim and publish a given event at a time.
It effectively prevents duplicate or conflicting work without needing additional coordination infrastructure.

One important trade-off with this approach is that it requires a continuously running process.
This characteristic diverges from the typical "scale to zero" model associated with serverless compute options like AWS Lambda.
However, since the polling worker runs in a Fargate-managed container, it retains many of the serverless benefits - such as no infrastructure management and automatic scaling - even if the process itself does not scale down to zero.

#### Database Table Setup

For reference, here's the SQL I used:

```sql
CREATE TABLE event_outbox (
  id SERIAL PRIMARY KEY,
  event JSONB NOT NULL,
  published_at TIMESTAMP
);
CREATE INDEX event_outbox_unpublished_index ON event_outbox (id) WHERE (published_at IS NULL);

CREATE TABLE product (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL
);
```

## Reflections & Next Steps

As is often the case, I found the devil was in the details - especially around atomicity and failure recovery.
Both approaches have their quirks:

- **DynamoDB Streams** are great for a full serverless experience, but you need to be mindful of stream retention and error handling.
- **Polling Workers** offer more control and visibility (and fit well with existing RDBMS investments), but introduce operational overhead.

Regardless of the approach, it's important to ensure that your downstream consumers are **idempotent** - able to handle duplicate events gracefully.
While the polling worker leverages PostgreSQL's `FOR UPDATE` to prevent duplicate processing at the producer level, the event bus itself (such as EventBridge) does not guarantee deduplication or ordering.
These concerns should be addressed within each consumer to maintain robustness.

Beyond the two discussed implementations, there are several other viable approaches I feel would be worth exploring:

- **Relational Database - Lambda Trigger**: Within Postgres, we could use `LISTEN`/`NOTIFY` to invoke a [Lambda function](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/PostgreSQL-Lambda.html) once the transaction has been successfully committed, publishing the event to EventBridge.
- **Single-Table DynamoDB Streams - Change Data Capture**: A single-table DynamoDB design could store an `event` field within each inserted or updated record.
  The stream processor would inspect this field and publish the appropriate event.

It was rewarding to get both approaches working hands-on, and I'm keen to explore the additional proposed approaches in the future.
If you're experimenting yourself, I recommend checking out [neon.tech](https://neon.tech/) for quick Postgres setups, and reviewing AWS's [prescriptive guidance](https://docs.aws.amazon.com/prescriptive-guidance/latest/cloud-design-patterns/transactional-outbox.html) for broader architectural insights.
