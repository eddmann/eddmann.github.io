---
layout: post
title: 'Our Wedding website, three years in the making...'
meta: 'Because every Wedding RSVP website needs to follow DDD, CQRS, Hexagonal Architecture, Event Sourcing, and be deployed on AWS Lambda.'
tags: php serverless ddd event-sourcing
---

Like many developers, over-engineering personal projects in the spirit of learning is something I am well aware of doing.
So, when it came time to decide how we were going to collect RVSP's for our upcoming wedding I already had ideas.
What resulted was a solution which follows DDD, CQRS, Hexagonal architecture, Event sourcing, and is deployed on AWS Lambda using PHP.

<!--more-->

<img src="/uploads/our-wedding-website-three-years-in-the-making/our-wedding-website-1.png" />

### How we got here...

The initial idea was formed back in late-2019, were I had been very interested in seeing how I could explore new concepts (DDD, ES, CQRS) and tooling (Containerisation) within a single project.
Based on some great resources ([EventSourcery](https://eventsourcery.com/) in particular), I was able to architect a system which followed DDD principles, applying ES and CQRS; based on PHP, PostgreSQL and Symfony.
Futher more, the original system was deployed within a Kubernetes environment (with a [small dose](https://github.com/eddmann/aws-k8s-cluster-terraform) of Terraform); with images being packaged and shipped within a GitLab CI Pipeline.
With everything in-place the website went live and the invites got sent out... then Covid happened.
Due to the pandemic we opted to delay our wedding date (several times) finally settling on this upcoming Summer 🤞.
This meant that the original system would lay dormant for almost several years!

During the past several years however much has happened, one of the biggest of which is getting the opportunity to develop a [brand-new insurance product](https://mybuilder-plus.com/) at MyBuilder.
Due to the nature of the business it was in, and coupled with a rich domain to model, we decided to apply DDD and ES.
It was throughout this time that I was able to take ideas and tooling initially formed within this wedding website and get experience applying them at a large production-level.
Another interesting piece to the puzzle was that we were targeting deployment to AWS Lambda, making heavy use of Terraform in the process.

### The now

Fast-forward to late-2021, we were now at a stage where we could finally send out new invites, and this meant dusting off the old website!
Again, like many developers, I could not simply deploy a personal project that I had written almost two years prior.
Instead, with the experience I had now garned by applying these concepts/tooling in a production setting, I was able to rewrite the website and infrastructure from the ground up.
An significant change was the transition to deploying to AWS Lambda, and harnessing many different AWS services in the process.
At MyBuilder we had great joy in using Terraform Cloud to handle provising our infrastructure, and this was now reflected in the revised implementation.

Throughout the past several years I have found it useful to reference a bare-bones implementation of the concepts/tooling put in-place by-way of the wedding website, when experimenting and on-boarding new people to related projects at MyBuilder.
I never did open-source the code for the original website, but felt that personally it would be great to have an accessible, documented reference implementation of the learnings I have gained.
As such, I settled on initially publishing an overview of the project (what your reading now) and the two repositories that make up the system.
The two repositories include relevant README's surrounding core concepts and principles applied, with accompanying diagrams that help explain keys elements.

### The application

<a href="https://github.com/eddmann/our-wedding-website"><img src="/uploads/our-wedding-website-three-years-in-the-making/our-wedding-website-2.png" /></a>

The [application](https://github.com/eddmann/our-wedding-website) itself models a basic domain which handles returning RSVP's for wedding invitations sent out.
It includes the ability to login (via a supplied invite code) and select attendance/food-choices based on if you are a day or evening guest.
Futhermore, there is an admin backend which allows us to review guest responses, and email notifications sent out when an invite has been submitted.
There is just enough complexity (although a CRUD system would have probably sufficed 😬) within this desired behaviour to demonstrate all the concepts/principles put in-place.

The system applies Event sourcing to persist (and project) application state, with the domain modelled following Domain-driven design principles.
The application conforms to the Hexagonal architecture (Domain, Application, Infrastructure and Ui layering), with interaction with the Domain being constrained to CQRS.
There are three distinct Message buses, one for dispatching Commands, one for emitting Aggregate Events and another for emitting Domain events.

From an implementational point-of-view, the application is built using PHP 8.1, Symfony 5.4 and associated Symfony components (Symfony Messenger, Webpack Encore etc).
It uses Deptrac to ensure we adhere to the strict Hexagonal architectural layering boundaries we have imposed, Psalm to provide static type-checking support, and PHPUnit to validate the desired behaviour has been implemented.
The testing strategy employed has been documented within the [project's README](https://github.com/eddmann/our-wedding-website#testing), and closely resembles the layering employed within the appplication itself.

### The infrastructure

<a href="https://github.com/eddmann/our-wedding-infra"><img src="/uploads/our-wedding-website-three-years-in-the-making/our-wedding-infra.png" /></a>

From an [infrastructure](https://github.com/eddmann/our-wedding-infra) perspective the service is provisioned using a combination of Terraform (Cloud) and Serverless Framework, targeting AWS as the cloud provider.
The application is hosted on AWS Lambda with transient infrastructure (which change based on each deployment) such as functions/API-gateways, being provisioned at the application repository level using the Serverless Framework.
Foundational infrastructure concerns (such as networking, databases, queues etc.) are provisioned using Terraform within the infrastructure repository, with separation between stage-environment and shared concerns.

Sharing between Terraform and Serverless Framework is unidirectional, with the application resources that Serverless Framework creates being built upon the foundation that Terraform resources provision.
Parameters, secrets and shared resources which are controlled by Terraform are accessible to this application via SSM parameters and Secrets Manager secrets; providing clear responsibility separation.

Local development is managed by Docker, with a Makefile used to help coordinate common tasks.
The general philosophy that has been employed is that there should be parity between actions that are carried out within CI (now using GitHub Actions) and within Local development.
This can be seen by reviewing the [test CI workflow](https://github.com/eddmann/our-wedding-website/blob/main/.github/workflows/test.yml) which delegates to the `can-publish` Makefile target to assert correctness; the same action can be taken within the Local development without any changes.
In doing this, consistency is maintained and eliminates any surprises which could occur when merging in changes to the service.

### What's next

With the project now released, I hope that in time to come I will have the opportunity to deep-dive and write about specific design/tooling aspects releated to the system further.
Until then however, if you want to find out more, be sure to checkout the [two](https://github.com/eddmann/our-wedding-website) [repositories](https://github.com/eddmann/our-wedding-infra), along with accompanying README's which provide more detail.
