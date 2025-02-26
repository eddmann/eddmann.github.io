---
layout: post
title: 'Scheduling EC2 Instances using Lambda and CloudWatch Events'
meta: 'Learn how to schedule EC2 instances using AWS Lambda and CloudWatch Events to optimise costs and automate server management.'
tags: aws ec2 lambda cloudwatch serverless
---

Over the past couple of months, MyBuilder has been transitioning from primarily a dedicated server stack (with orchestration through [Puppet](https://puppet.com/)) to cloud infrastructure by way of [Amazon Web Services](https://aws.amazon.com/).
We have been a proponent of AWS for quite some time, taking advantage of services such as S3 and CloudFront in our current setup.
We are also not unfamiliar with EC2, spreading some of our application requirements onto several instances over the past couple of years.
However, we have not been fully embracing the 'Cloud nature' of the product and are still treating each server as something between a [Snowflake](https://martinfowler.com/bliki/SnowflakeServer.html) and a [Phoenix](https://martinfowler.com/bliki/PhoenixServer.html).

<!--more-->

As the team and business needs expand, we felt this was an opportune time to embrace more of its offerings.
I've recently discussed the reasoning behind this thought process on a [podcast](http://threedevsandamaybe.com/lets-aws-everything/) I co-host.
Throughout this transition period, I wish to document our experiences moving solely over to the platform, sprinkling in a little Lambda along the way.

### Starting and Stopping Instances

One of the key advantages of the Infrastructure as a Service (IaaS) movement is the ability to provision resources as and when you require them.
A good use case for this added functionality is the ability to start and stop development resources based on typical workweek patterns, providing additional cost savings.
In the video below, I highlight how you can start and stop EC2 instances in a scheduled (Cron-like) manner using Lambda, Node.js, and CloudWatch Events.

<p><iframe width="100%" height="367px" src="https://www.youtube.com/embed/roAerKVfq-Y?rel=0" frameborder="0" allowfullscreen></iframe></p>

The associated code used in this video can be found [here](https://gist.github.com/eddmann/a9e404eb62056f77610f752606a2e504).

### Scaling Instances

I would now like to expand upon this example by taking advantage of another IaaS benefit - scaling a given resource based on your current demands.
In a similar manner to the first demonstration, I will now explain how you can scale an EC2 instance up and down based on a given schedule.

<p><iframe width="100%" height="367px" src="https://www.youtube.com/embed/_gJyK1-NGq8?rel=0" frameborder="0" allowfullscreen></iframe></p>

The associated code used in this video can be found [here](https://gist.github.com/eddmann/ce2c65e4000d07c421ad266d449550ab).

I hope these two short videos have highlighted some of the power that can be gained from using Function as a Service (FaaS) platforms such as Lambda in a server-management setting.
Both use cases would not have been possible in our previous dedicated server setup and give a small glimpse into the world of automating cloud-based server resources.
