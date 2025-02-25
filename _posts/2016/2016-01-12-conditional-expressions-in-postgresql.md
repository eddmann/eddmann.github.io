---
layout: post
title: 'Conditional Expressions in PostgreSQL'
meta: 'An interesting use-case for conditional expressions in PostgreSQL'
---

There maybe a case were you need to make sure only a single row value is `true` in a collection of results.
A common pattern for doing such a task is to set all values to `false` within this collection, and then set the desired one to `true`.

<!--more-->

```sql
UPDATE templates SET active = FALSE WHERE group_id = 1;
UPDATE templates SET active = TRUE WHERE id = 2;
```

However, between the above two queries no 'template' is active, and if the second query does not get run directly after the first the system can be left in a state of flux.
We can of course wrap the two queries in a transaction which will make sure that the block is executed atomically.
But we could alternatively also take advantage of conditional expressions in PostgreSQL and execute the following query.

```sql
UPDATE templates SET active = (COND WHEN id = 2 TRUE ELSE FALSE END) WHERE group_id = 1;
```
