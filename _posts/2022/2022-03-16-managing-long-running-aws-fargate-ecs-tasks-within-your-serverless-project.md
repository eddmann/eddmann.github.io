---
layout: post
title: 'Managing long-running AWS Fargate ECS tasks within your Serverless project'
meta: 'Documents a recent Serverless Framework plugin I have built to aid in bridging the gap between running behaviour within both AWS Lambda and AWS Fargate compute platforms'
tags: aws fargate ecs serverless lambda
---

I am a big proponent of the Serverless movement.
The ability to concentrate efforts on only the code and infrastructure concerns which directly add business value is very powerful.
Function-as-a-Service (FaaS) offerings like AWS Lambda impose limitations which help aid in designing more fault tolerant/scalable systems; leaning towards event-driven architectures.
However, there are times when we need to execute behaviour which exceed common-place FaaS duration limits (i.e. AWS Lambda's 15-minute limit).
In this case we ideally do not want to resort to a lower-level of compute (i.e. a VPS such as EC2), but instead be able to define and run such behaviour alongside our FaaS counterparts.
In this post I would like to discuss a [Serverless Framework plugin](https://github.com/eddmann/serverless-fargate) I have written which aids in bridging this gap, by-way of ECS and [AWS Fargate](https://aws.amazon.com/fargate/).

<!--more-->

## Why?

Over the past couple of weeks I have been working on a personal project with some behaviour that by-design does not fit into the 15-minute duration limit imposed by AWS Lambda.
Instead of being able to reengineer the problem into an event-driven architecture, it still is required to be run as a long-polling background process.
In a conventional compute setting you would employ a [service](https://kubernetes.io/docs/concepts/services-networking/service/)/[daemon](https://kubernetes.io/docs/concepts/workloads/controllers/daemonset/) (by-way of your choice of container orchestration platform) or possibly even manage an EC2 instance which runs a process control system such as [Supervisor](http://supervisord.org/).
In doing so however, you lose the level of abstraction you are gifted by Serverless and the Serverless Framework.
With the desire to maintain this level of abstraction I investigated the possibility of using ECS/AWS Fargate, building additional functionality into the Serverless Framework (by-way of a plugin) to bridge the divide between defining FaaS and container-based compute.

## What is AWS Fargate?

Fargate is a service offered by AWS which allows you to run containerised workloads at a similar level of abstraction as AWS Lambda does for functions.
In the case of AWS Lambda you provide the code (or more recently even a container image), where-as in the case of AWS Fargate you provide the container image you wish to run.
This then provides you with all the same Serverless benefits; a pay-as-you-go model, no up-front capacity planning and built-in host-level VM separation for security concerns.

This level of compute is able to be used for both [ECS](https://aws.amazon.com/ecs/) and [EKS](https://aws.amazon.com/eks/) container orchestration platforms.
Upon review, I opted to use ECS and this seemed to impose the least friction in both means of definition and execution of the desired behaviour.
Before we delve into the Serverless plugin itself, it would be useful to provide an overview of the consistent building blocks that are used to construct it.

- **Cluster** - an isolated logical grouping of tasks or services which comprise your application.
- **Task definition** - defines one or more containers (with port, parameter configuration) that form your application.
- **Task** - instance(s) of a _Task definition_.
- **Service** - manages the desired amount of a given task you wish to ensure are running at any one time.
- **Scheduled task** - handles executing a _Task_ at a given time using [AWS EventBridge](https://aws.amazon.com/eventbridge/).

## The Serverless plugin

Based on my new understanding of how ECS and Fargate worked, I chose to take a step back and decide how (as an end user) I would like to declare a given _task_ at the level of the Serverless Framework.
I wanted to take advantage of how the Serverless Framework was able to push built images to ECR, thanks to their [Lambda container-runtime support](https://www.serverless.com/blog/container-support-for-lambda).
This meant that we could delegate this responsibility to the Framework, and reference images in a similar manner to how the user has grown accustom to.
I also wanted to ensure that the execution task role created for the _tasks_ honoured any `iamManagedPolicies` and `iamRoleStatements` declarations found within the provider, again, adding parity with provisioned Lambda functions.
The resulting definition can be found within the [GitHub repository](https://github.com/eddmann/serverless-fargate#example), detailing all the available configuration options.

The completed Serverless Framework plugin takes the declared _service/scheduled tasks_ and generates the underlying CloudFormation resources needed to provision the compute upon deployment.
Using the Framework definition validation (backed by [JSON Schema](https://json-schema.org/)) I was able to validate complex configuration which has been supplied with ease.
Upon deployment both the Lambda functions and Fargate tasks are provisioned within a single CloudFormation _stack_, with _task_ ARN's being returned as outputs for extended use elsewhere.

## Example usage

To highlight all the capabilities of the plugin, I created a [contrived example](https://github.com/eddmann/serverless-fargate/tree/main/example) which is present within the Serverless plugin repository.
This documents how you can create three separate runtimes (PHP, Node and Python) and run long-running behaviour alongside Lambda functions.
Additionally, if you do not wish to mix container task and function layer runtimes (ensuring runtime parity), this can be achieved like so.

```yaml
service: serverless-fargate

provider:
  name: aws
  ecr:
    images:
      app:
        path: ./
        file: Dockerfile

plugins:
  - serverless-fargate

fargate:
  vpc:
    securityGroups: sg-1234
    subnets: subnet-1234
  tasks:
    service:
      image: app
      entryPoint: node
      command: service.js

functions:
  web:
    image:
      name: app
      command: web.handler
    events:
      - httpApi: GET /
```

Thanks to the extensible nature of the Serverless Framework plugin ecosystem the DSL we have been able to construct almost feels native.
The above definition shows how a single application artifact image can be built, and then subsequently run, in both a Lambda function and Fargate task setting.
For Fargate tasks, we are still able to use [Lambda compatible runtime images](https://github.com/aws/aws-lambda-base-images), but instead only need to override the entry point and desired command.
This allows you to maintain parity between application behaviour that requires different execution duration characteristics.

The only excess configuration which does not naturally fit into the Serverless model is the required VPC.
This is optional in a Lambda function based definition, but due to AWS Fargate containers running within `awsvpc` network mode we are required to supply a relevant VPC.
If Fargate tasks could optionally not require the need for being placed into a VPC (similar to Lambda functions) this would truly honour the same Serverless methodology.

## Conclusion

To conclude, I am very excited with how this plugin has progressed since its inception.
Having been now able to employ its use in the personal project I initially had the need for, has highlighted how powerful it can be.
Going forward I would like to add additional compute support for [Fargate Spot](https://docs.aws.amazon.com/AmazonECS/latest/bestpracticesguide/ec2-and-fargate-spot.html) instances.
There are a couple of interesting technicalities to handling spot instances, which could be abstracted away by means of a plugin.
I hope to document this work in a future blog post.
