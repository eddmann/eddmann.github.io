---
layout: post
title: 'Allocating Secret Santas using an AWS Step Function workflow and every available Lambda runtime'
meta: 'Documents my exploration into the many available Lambda runtimes, by way of orchestrating a Step Function workflow for allocating Secret Santas.'
tags: ['aws', 'lambda', 'step-function', 'santa-lang']
---

Over the past several years, I have taken the opportunity of allocating Secret Santas for members of my family as an excuse to explore different [programming languages](../../2020/2020-10-23-allocating-and-notifying-secret-santas-via-email-using-clojure/index.md) and [technologies](../../2021/2021-11-03-building-a-secret-santa-allocator-and-sms-sender-using-a-raspberry-pi-pico-micropython-and-sim800l-module/index.md).
This year has been no different, with me opting to _over-engineer_ the problem of allocating and notifying participants by diving into [AWS Step Functions](https://aws.amazon.com/step-functions/) and the many runtimes available on Lambda.
In this post, I wish to document how I went about designing the Step Function workflow and breaking up the problem into many specific-purpose Lambda behaviours.
The final implementation can be found in [this GitHub repository](https://github.com/eddmann/step-function-secret-santa).

<!--more-->

I should reiterate that this is heavily over-engineered for solving the problem at hand, with the main driver being to provide me with enough of a problem domain to explore the many different features/states (i.e. Map, Choice, Parallel) of Step Functions and runtimes available on Lambda.

## Step Function Workflows?

I have had the opportunity to explore employing a Step Function workflow for several personal projects over the years, providing a high level of orchestration/durability between task/state transitions.
One of the key elements I have found is knowing when to model such decisions/executions at the workflow level or leave them within the code itself.
Fortunately, this problem could be broken up into several logically separate problems (parsing, allocating, notifying), which allowed me to experiment with handling [failure](https://docs.aws.amazon.com/step-functions/latest/dg/concepts-error-handling.html) and [mapping](https://docs.aws.amazon.com/step-functions/latest/dg/amazon-states-language-map-state.html) input in [parallel](https://docs.aws.amazon.com/step-functions/latest/dg/amazon-states-language-parallel-state.html) with [choice](https://docs.aws.amazon.com/step-functions/latest/dg/amazon-states-language-choice-state.html) branching.

## Lambda Runtimes?

I am a big proponent of Lambda, but due to the languages and runtimes I have been exposed to in the past, I have not had the opportunity to explore many of the available runtimes Lambda has to offer.
Breaking up this problem into many Lambda behaviours felt like a great opportunity to change that.

However, with the availability of the [Custom Runtime API](https://docs.aws.amazon.com/lambda/latest/dg/runtimes-custom.html), the list of _available_ runtimes is **endless**.
As such, I decided to limit the scope to all six distinct [supported runtimes](https://docs.aws.amazon.com/lambda/latest/dg/lambda-runtimes.html) AWS has to offer, along with a single custom runtime hosted on `provided.al2`.
This gave me the chance to experience and implement functionality in each language runtime using more than just a simple _Hello World_ example.

### Custom Runtime

Instead of using a pre-built custom runtime, I opted to additionally take the opportunity of integrating my [own personal language](https://github.com/eddmann/santa-lang-ts), which I have been developing over the year, into a Lambda context.
I am sure I will be discussing my experience developing this language more in later posts, but at a high level, it is a tree-walking interpreted programming language that is targeted primarily at solving Advent of Code problems.
The current working implementation is hosted on Node.js.
Due to this, I was able to garner inspiration from other custom runtime [bootstrap processes](https://github.com/lambci/node-custom-lambda/blob/master/v12.x/bootstrap.js) and how they handle the Lambda request lifecycle.
I was able to package up the [bootstrap](https://github.com/eddmann/santa-lang-ts/blob/main/src/lambda/src/index.ts) into a single executable thanks to [pkg](https://www.npmjs.com/package/pkg) and distribute it as a [layer](https://github.com/eddmann/santa-lang-ts/blob/main/Makefile#L50) for my workflow to use.

This _side project_ provided me with a great appreciation for the Custom Runtime API that AWS has developed, using HTTP as the common denominator for communication between the desired execution and host Lambda environment.

## The Workflow

For managing and deploying the workflow, I opted to use the [Serverless Framework](https://www.serverless.com/) and the de facto [Serverless Step Functions](https://www.serverless.com/plugins/serverless-step-functions) plugin.
This allowed me to co-locate the workflow and Lambda definitions, which I felt was very beneficial.

The resulting allocation and notification process was built up as follows:

[![The Step Function workflow](workflow.svg)](https://github.com/eddmann/step-function-secret-santa)

| Function                                                                                                            | Purpose                                                                                                            | Language                                                                                   |
| ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------ |
| [Parse Participants](https://github.com/eddmann/step-function-secret-santa/tree/main/src/parse-participants/)       | Converts the CSV input supplied by the client's API Gateway request into a JSON form used throughout the workflow. | C# `dotnet6`                                                                               |
| [Validate Participants](https://github.com/eddmann/step-function-secret-santa/tree/main/src/validate-participants/) | Ensures that all supplied participant data is present and valid.                                                   | JavaScript `nodejs16.x`                                                                    |
| [Allocate](https://github.com/eddmann/step-function-secret-santa/tree/main/src/allocate/)                           | Allocates each participant to a random recipient.                                                                  | [santa-lang](https://github.com/eddmann/santa-lang-ts/tree/main/src/lambda) `provided.al2` |
| [Validate Allocations](https://github.com/eddmann/step-function-secret-santa/tree/main/src/validate-allocations/)   | Ensures that the supplied allocations are valid, taking into consideration participant exclusions.                 | Java `java11`                                                                              |
| [Store Allocations](https://github.com/eddmann/step-function-secret-santa/tree/main/src/store-allocations/)         | Stores the allocations within a plain-text file S3 object for review.                                              | Go `go1.x`                                                                                 |
| [Notify Email](https://github.com/eddmann/step-function-secret-santa/tree/main/src/notify-email/)                   | Sends an email (via Mailgun) to the given participant with their allocated recipient's name.                       | Python `python3.9`                                                                         |
| [Notify SMS](https://github.com/eddmann/step-function-secret-santa/tree/main/src/notify-sms/)                       | Sends an SMS (via Twilio) to the given participant with their allocated recipient's name.                          | Ruby `ruby2.7`                                                                             |

Many of the runtimes required their own specific packaging steps, either for pulling down dependencies and/or compilation.
As such, I opted to define/document these within [Makefile targets](https://github.com/eddmann/step-function-secret-santa/blob/main/Makefile), which use Docker as the primary means of providing the required execution environment to deterministically package the artefacts.

## Conclusion

I really enjoyed building out this behaviour using AWS Step Functions and Lambda runtimes.
In the timeframe I gave myself, I was unable to develop a sufficient local execution environment to test the workflow using [Step Functions Local](https://docs.aws.amazon.com/step-functions/latest/dg/sfn-local.html), but in future projects, I hope to explore this further.

The more I explored Step Functions and the available features/integrations, the more I realised that much of the behaviour I wished to achieve could be developed using high-level integrations that are already provided instead of relying solely on Lambda.
For example, I could instead possibly store the allocations within S3 using the built-in [AWS SDK support](https://docs.aws.amazon.com/step-functions/latest/dg/supported-services-awssdk.html) and send the SMS and emails via SNS and SES alike.

As the intent of this project was a combination of exploring Step Functions and Lambda runtimes, leaning on Lambda and a runtime to achieve these tasks felt right.
However, in a future incarnation, perhaps the goal could be to just leverage Step Functions altogether.
There is always next year... 😉
