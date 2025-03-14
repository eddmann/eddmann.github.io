---
layout: post
title: 'Notes: Monolith to Microservices by Sam Newman'
meta: "In-depth notes and guidance on Sam Newman's Monolith to Microservices book, exploring incremental migrations, domain-driven design, and best practices for successful microservices transitions."
tags: ['notes', 'microservices']
---

I've recently finished reading [Monolith to Microservices](https://www.oreilly.com/library/view/monolith-to-microservices/9781492047834/) by Sam Newman.
This post contains my notes from the book, which I wrote while reading to help digest the material.
It also serves as a future reference.

<!--more-->

![Book cover of "Monolith to Microservices" by Sam Newman. Features an illustration of a jellyfish with intricate details, and the O'Reilly logo at the top.](cover.jpg)

## Just Enough Microservices

> Microservices are independently deployable services modelled around a business domain.

### Independent deployability

This allows us to change a microservice and deploy it into production without having to utilise or change any other services.
This property requires loose coupling ('change one service without having to change anything else').
We use stable contracts to help guide how we find the service boundaries.

### Modelled around a business domain

> "Any organisation that designs a system... will inevitably produce a design whose structure is a copy of the organisation's communication structure" - Melvin Conway

We used to organise people in terms of their core competence.
However, changes in functionality are primarily about changes in business functionality.
With this grouping (i.e. three-tier architecture with UI team, backend team and DBAs), the business functionality is spread across all three teams, increasing the chance that a change will cross layers and require coordination.
This is an architecture in which we have high cohesion of related technology but low cohesion of business functionality.

This does not organise people for the change we want to optimise for (business functionality).
As such, we now wish to group people in poly-skilled teams to reduce hand-offs and silos.
Instead, our business domain becomes the primary force driving our system architecture.
We now have teams which manage vertical (end-to-end) slices of business functionality over horizontal slices of core competence (technology).
It's up to the poly-skilled teams how the code is structured, how state is stored, and how it is presented.
The only external concern is the stable contract for the business functionality exposed.

### Microservices...

- Are a type of SOA and distributed system, opinionated about how service boundaries are drawn and where independent deployability is paramount.
- Microservice architecture is based on multiple collaborating microservices.
- Are technology agnostic, as they communicate over a common network protocol, exposing business behaviour over one or more network endpoints via well-defined, stable interfaces or contracts.
- The concept of size is one of the least interesting things about this type of architecture.
  Measurement of size is a bit ambiguous.
  Could it be SLOC?
  Instead, we should focus on having as 'small a public interface as possible'.
- We should be focused on service boundaries and how many services we can incrementally handle as a company or team, over the size of each service.
  It is easier to break something up than put it back together.
- We want delivery teams aligned around product lines, and the services aligned around the business domain.
  This makes it easy to assign ownership to these product-oriented delivery teams.
- Are not just for the backend.
  We should be considering the UI too (micro-frontends).
  This aligns with how we wish to align our teams around end-to-end business functionality.
- 'buy you options' – There is an implied cost to going with this architecture, but the cost may be worth the options you get from it.
- Microservice architectures give you more concrete boundaries in a system around which ownership lines can be drawn.
- Provide you with:
  - Scale and robustness of the systems and teams implementing them.
  - Services which can be worked on in parallel.
  - Clearer understanding of decomposed parts of the system.
  - Process isolation, which allows for varying technology choices.
  - Isolated deployments – why expand the blast radius and have to re-deploy unrelated functionality each time.
  - Fault isolation – failures in one service are less likely to impact other services, improving the overall resilience of the system.
- They suffer from:
  - the failure and varying increased latency of network communication
  - distributed architecture headaches – good-bye to single-process transactions
- Treat the service interfaces that your microservice exposes like a user interface.
  Use _outside-in_ thinking to shape the interface design in partnership with the people who will call your service.

### Monoliths...

- Are defined by a unit of deployment.
  When all functionality in a system has to be deployed together, we consider it a monolith.
- Are a simple form of distributed system, as it likely reads from an external database and presents data on a client's web browser.
  There are three different processes communicating over a network right there.
  The difference is the extent to which the system is distributed compared to microservice architectures.
  More processes or computers means more network communication, increasing the chance of encountering distributed system problems.
- Simpler deployment topology can avoid many of the pitfalls associated with distributed systems.
  It can result in much simpler developer workflows.
  Monitoring, troubleshooting, and activities like end-to-end testing can be greatly simplified as well.
- If we want to reuse code within a distributed system, we have to decide whether we want to copy code, break out libraries, or push the shared functionality into a service.
  With a monolith, our choices are much simpler – all the code is there!
- Vulnerable to implementation and deployment coupling.
- Vulnerable to delivery contention (deployment trains) – different developers wanting to change the same piece of code, different teams wanting to push functionality live at different times.
  Can suffer from confusion around who owns what and who makes which decision.
- The most common type is a _single-process system_ – in which all of the code is deployed as a single process.
- A subset of a _single-process system_ monolith is a **modular monolith** – a single process consisting of separate modules, each of which can be worked on independently, but which still need to be combined for deployment.
  This is a good, often overlooked choice ([Shopify](https://shopify.engineering/deconstructing-monolith-designing-software-maximizes-developer-productivity) is a good example).
  If the module boundaries are well defined, it can allow for a high degree of parallel working, while sidestepping the challenges of a distributed microservice architecture, along with much simpler deployment concerns.
  The modular monolith can suffer from challenges around shared state (i.e. with a database) and how it can be decomposed in the future due to shared cross-cutting concerns.
- A **distributed monolith** is a system that consists of multiple services, but for whatever reason, the entire system has to be deployed together.
  It has all the disadvantages of SOA or distributed systems and all the disadvantages of a monolith.
  This form of monolith typically occurs when not enough focus was placed on concepts like information hiding and cohesion of business functionality.

### Coupling and Cohesion

![Comparison of cohesion and coupling: left side shows a complex web, labeled "Without" and right side shows organised, grouped elements, labeled "With"](cohesion-vs-coupling.png)

**Coupling** refers to the degree of interdependence between _modules_, i.e. a change in one requires a change in another.
Desirable low coupling means that modules in a system have minimal dependence on each other.

**Cohesion** refers to the degree to which the elements inside a _module_ belong together.
Desirable high cohesion means that a module is focused on a single or closely related set of tasks – 'the code that changes together, stays together'.

There tends to be an inverse relationship with these two forces – as cohesion increases within a module, coupling tends to decrease.
The same is true the other way around: if we have two pieces of tightly related code, cohesion is low as the related functionality is spread across both.
We also have tight coupling, as when this related code changes, both things need to change.

Low coupling and high cohesion is a desirable trait for reduced maintenance and modification cost of a given _module_.

These concepts are really important in distributed system design, as getting this balance wrong has a higher cost than within a single-process monolith.
We want to optimise our architecture around ease of making changes to business functionality, so we want the functionality grouped in such a way that we can make changes in as few places as possible.

Information hiding (also known as decision hiding) is an important design principle to address coupling concerns.
The core idea is to separate the parts of the code that change frequently from the ones that are static.
We want the _module_ boundary to be stable, and it should hide those parts of the module implementation that we expect to change more often.
The smaller the public interface of a module, the less chance there is of coupling with other modules, as there is less for them to 'couple' with.

There are several different types of coupling to consider:

- **Implementation coupling** – refers to the degree to which the implementation details of one module are known to, or dependent upon, another module.
  This type of coupling occurs when a module relies on the specific internal workings of another module, rather than interacting with it through a well-defined interface.
  A common example of this comes in the form of sharing a database.
- **Temporal coupling** – refers to a runtime situation where the correct execution of one module depends on the timing or sequence of actions performed by another module.
  It is often linked with a primary challenge encountered in synchronous calls within distributed systems.
  For example, dependence on a synchronous external module response within your own response to a caller.
- **Deployment coupling** – refers to a situation where the deployment of one module is dependent on the deployment of another.
  In a single-process monolith with multiple linked modules, altering a line in one module means deploying the entire monolith, even if most modules remain unchanged.
  Deployments inherently pose risk, but smaller, more focused releases help minimise this risk.
- **Domain coupling** – there is no escaping some degree of domain coupling, as to make any useful system, _modules_ will have to interact with each other in some form.
  These interactions between modules model the interactions found in the real domain (i.e. if you want to place an order, you need to know what items were in a customer's shopping basket.
  If you want to ship a product, you need to know where to ship it).
  In a microservice architecture, this information may be contained in different services, so they will have to communicate with each other.
  You must be aware of the level of detail each module or service needs to know about each other to do its work.

### Domain-Driven Design

- DDD provides us with a means to help model our services around a business domain.
- You _discover_ sub-domains within a domain and _design_ bounded contexts.
- We use Event Storming to help shape the domain models with non-developer colleagues.
- Aggregates...
  - are a transactional boundary.
  - protect their own invariants, encapsulating the behaviour and state required to do so.
  - are something that should be considered as a whole, not decomposable into separate accessible parts.
    It is the self-contained unit.
  - have a life-cycle around them.
  - can have relationships with other aggregates via _aggregate root_ identity.
  - are designed for many different reasons and can be reshaped over time.
  - are a tactical DDD pattern.
  - act as a self-contained state machine that focuses on a single domain concept in our system.
- Microservices will handle the life-cycle and data storage of one or more different types of aggregate.
- Bounded contexts...
  - are a strategic pattern used to design a boundary within or encompassing a sub-domain.
  - encapsulate a specific part of the domain model and ensure that within this boundary, terms and concepts have a single, specific meaning (ubiquitous language).
  - hide implementation details which are internal concerns, providing a public interface to other bounded contexts.
  - can use anti-corruption layers (ACL) to ensure internal consistency when communicating with other bounded contexts.
  - contain one or more aggregates.
  - are the boundary in which a given domain model is deemed valid.
- Both the aggregate and the bounded context give us units of cohesion with well-defined interfaces to the wider system.
- When starting out with microservices, it is advised to target services which encompass entire bounded contexts.
  We can later look to decompose these into smaller services, but this is an internal implementation decision.
  The public API to the consumer does not need to change.

## Planning a Migration

Microservices are not the goal!
You should be considering migrating to a microservice architecture to achieve capabilities that your current system architecture cannot provide.
The decision should be rooted in the challenges you are facing, and the changes you want to bring about.

### Key Questions

- **What are you hoping to achieve?**
  Set out a set of outcomes aligned with the business's objectives, highlighting the benefits to the system's end users.
- **Have you considered alternatives to using microservices?**
  Quite often, you can get what you need by using a much easier, more _boring_ technique.
- **How will you know if the transition is working?**
  We will need regular checkpoints, quantitative and qualitative measures to ensure we are still on the right path.
  So as to help avoid the sunk cost fallacy.

### The Good Choice

Microservices could be a _good_ choice to...

#### Improve Team Autonomy

Many organisations have achieved more effective growth and scaling than their peers by keeping groups small, fostering close bonds, and minimising bureaucracy.
Models like Amazon's 'two-pizza team' and Spotify's approach support this strategy.
When teams own microservices and have full control over them, they gain greater autonomy and empowerment within the larger organisation.

##### However you could...

Assign ownership of different parts of the codebase to various teams, such as through a modular monolith approach.
This could also be done by empowering individual team members to make decisions based on their expertise in specific areas of the codebase (e.g., X specialises in display ads, while Y has extensive knowledge of the checkout flow).

#### Reduce Time to Market

By making and deploying changes to individual microservices independently, without waiting for coordinated releases, we can deliver new functionality to our customers more quickly.

##### However you could...

Numerous factors affect the speed of software delivery.
It is recommended to conduct a path-to-production modelling exercise, as it could reveal that the primary obstacle isn't what you anticipate.

#### Scale Cost-Effectively for Load

Dividing our processing into individual microservices allows for independent scaling of each process.
This approach potentially enables cost-effective scaling, focusing resources on scaling only the parts of our processing that currently limit our ability to handle loads.
Additionally, we can scale down or deactivate microservices experiencing lower loads, optimising resource usage as needed.

##### However you could...

Scale vertically and just _get a bigger box_ for a quick, short-term improvement.
Another option to explore is horizontal scaling of the existing monolith, which is a relatively simple step to take and should be considered before investigating microservices for this purpose.

#### Improve Robustness

Segmenting our application into independently deployable processes offers various mechanisms to enhance the resilience of our applications.
With this approach, an issue in one area of functionality doesn't necessarily affect the entire system.
We can prioritise our efforts on the parts of the application requiring the most robustness.
Microservices don't inherently guarantee robustness; however, they provide opportunities to design a system that can better withstand network partitions, service outages, and similar challenges.

_Robustness_ refers to a system's capacity to respond to anticipated variations, while _resilience_ involves an organisation's capability to adapt to unforeseen circumstances.
For instance, anticipating a potential machine failure, we enhance system robustness by introducing redundancy through load balancing.
Resilience, however, encompasses the organisational process of preparing for unforeseeable challenges, acknowledging that not all potential problems can be predicted.

##### However you could...

Deploy multiple copies of the monolith, possibly behind a load balancer or another load distribution mechanism such as a queue.
In doing so, we introduce redundancy to our system, improving robustness.

#### Scale the Number of Developers

In _The Mythical Man-Month_, Frederick Brooks argues that adding more people to a project can improve delivery only if the work can be divided into distinct tasks with minimal interdependencies.
He illustrates this concept with the analogy of harvesting crops: multiple harvesters can work simultaneously in a field because their tasks don't require constant interaction.
However, software development differs in that tasks vary, and outputs from one task often serve as inputs for others.

By establishing clear boundaries and designing an architecture that minimises interdependencies between microservices, we create functionality that can be developed independently with a low degree of coupling.
This approach aims to increase developer scalability by reducing delivery contention.

##### However you could...

An alternative approach could be to consider implementing a modular monolith, whereby different teams own each module.
As long as the interface with other modules remains stable, they could continue to make changes in isolation.

#### Embrace New Technology

Monoliths typically constrain our technological options, binding us to a single programming language, deployment platform, operating system, and database.
Conversely, a microservice architecture offers the flexibility to diversify these choices for each service.
By confining technological changes within individual service boundaries, we can evaluate the benefits of new technologies in isolation and mitigate the impact if issues arise.

Mature microservice organisations often restrict the number of technology stacks they support.
However, the ability to experiment with new technologies safely can provide them with a competitive edge, both in terms of delivering superior results for customers and in fostering developer satisfaction as they gain expertise in new skills.

##### However you could...

We could easily embrace new languages within the same runtime environment.
For instance, the JVM can seamlessly accommodate code written in multiple languages within a single running process.
However, integrating new types of databases poses greater challenges, as it often requires decomposing a previously monolithic data model to facilitate an incremental migration.

### The Bad Choice

Microservices could be a **bad** choice when you...

#### Have an Unclear Domain

Incorrectly defining service boundaries can result in significant costs.
It may necessitate a higher frequency of cross-service modification, create overly interdependent components, and, overall, prove to be more detrimental than maintaining a single monolithic system.

Decomposing a system into microservices prematurely can incur significant costs, particularly for those unfamiliar with the domain.
It's generally easier to transition an existing codebase into microservices than to start with microservices from scratch.

#### Are a Startup

Microservices are particularly beneficial for startups transitioning into scale-ups, tackling challenges that arise post-initial success.
It's easier to partition an existing _brownfield_ system than to do so upfront with a new _greenfield_ system.
Focus on success initially, splitting only around clear boundaries and maintaining a more monolithic approach for the rest.
Startups often experiment with various ideas to find a fit with customers, which can result in significant shifts in the product domain (an unclear domain, as above).

#### Customer-Installed and Managed Software

If your software is packaged and shipped to customers for self-operation, microservices might not be the most suitable option.
Adopting a microservice architecture shifts significant complexity to the operational domain.
It's unrealistic to assume that customers will possess the necessary skills or platforms to manage microservice architectures.

#### Do Not Have a Good Reason!

The primary reason to avoid adopting microservices is the lack of a clear understanding of your objectives.
Simply following the trend without a solid purpose is unwise and can lead to unfavourable outcomes.

#### Focus on Reuse

Making reuse a primary objective for microservice migration is often considered a misstep.
It's not a direct outcome that people desire; rather, it's something they hope will lead to other benefits.
While we anticipate that reuse may accelerate feature delivery or reduce costs, it's essential to monitor these primary objectives directly rather than fixating solely on reuse.
Otherwise, there's a risk of optimising the wrong aspect of the development process.

### Importance of Incremental Migration

> "If you do a big-bang rewrite, the only thing you're guaranteed of is a big bang"
> — Martin Fowler

It's recommended to gradually dismantle monoliths, extracting them bit by bit.
An incremental approach allows for learning about microservices iteratively.
Attempting a complete overhaul at once can hinder effective feedback on what's working well or not.
Embrace the likelihood of making mistakes and focus on minimising their impact.

Each step provides valuable insights.
Start with small areas of functionality, implement them as microservices, deploy them into production, and assess their effectiveness.
It's crucial to understand that the extraction of a microservice isn't finalised until it's actively utilised in production.

### Cost of Change

> "Some decisions are consequential and irreversible or nearly irreversible - _one-way doors_ - and these decisions must be made methodically, carefully, slowly, with great deliberation and consultation.
> If you walk through and don't like what you see on the other side, you can't get back to where you were before.
> We can call these _Type 1_ decisions.
> But most decisions aren't like that - they are changeable, reversible - they're two-way doors.
> If you've made a suboptimal _Type 2_ decision, you don't have to live with the consequences for that long.
> You can reopen the door and go back through.
> Type 2 decisions can and should be made quickly by high judgement individuals or small groups."
> — Jeff Bezos

Mistakes are inevitable and should be embraced, but it's crucial to understand how to minimise their costs.
The terms 'Type 1' and 'Type 2' may not be descriptive enough, so using 'Irreversible' for Type 1 and 'Reversible' for Type 2 can provide clarity.
Viewing Irreversible and Reversible decisions as two ends of a spectrum helps gauge their impact on potential course corrections.
Planning often takes place on the whiteboard, where the cost of change and mistakes is minimal.
Sketching out the proposed design and testing various use cases across potential service boundaries can provide valuable insights.
When it comes to decomposing an existing monolithic system, we need to have some form of logical decomposition to work with, and this is where _domain-driven design_ can come in handy.

### Using a Domain Model

Bounded contexts are excellent starting points for defining microservice boundaries.
A domain model provides a logical view of an existing system, but there is no guarantee that the underlying existing code structure aligns with this model.
Additionally, a domain model won't indicate which bounded contexts store data in a given database, for example.
Despite this, developing a domain model is crucial for structuring a microservice transition.
It's important to gather just enough information from the domain model to make informed decisions about where to begin the decomposition.

For example, Invoicing might seem like an easy initial step.
If our aim is to enhance time to market and the Invoicing feature seldom undergoes changes, it might not be the most productive use of our time.
We seek quick wins for early progress, momentum, and feedback, which leads us to choose easier components to extract.
However, we also need to ensure that the decomposition provides meaningful benefits.
Balancing these considerations is crucial in our decision-making process.

#### Event Storming

Event Storming, created by Alberto Brandolini, is a collaborative exercise where technical and non-technical stakeholders come together to define a shared domain model.
This process starts from the _bottom up_, with participants identifying 'Domain Events' - things that happen in the system.
These events are then grouped into aggregates, which are subsequently organised into bounded contexts.
The goal of Event Storming is to understand the logical events occurring in the system, rather than to build an event-driven system.
The value lies not only in the model itself but also in the shared understanding developed through this collective exercise.

### Reorganising Teams

Aligning architecture and organisation can be pivotal in maximising the benefits of a microservice architecture.
Traditionally, IT organisations were structured based on core competencies, with backend/frontend developers, testers, and DBAs each forming separate teams.
This setup often led to multiple hand-offs between teams during software development and deployment, resulting in delays.
Similarly, organisational silos could impede efficiency, as involving multiple teams in software creation or changes could prolong the process.

These silos have been breaking down.
Rather than concentrating on specific technologies or activities, teams focus on different aspects of the product, mirroring the shift from technical-oriented services to services organised around vertical slices of business functionality.

The DevOps movement has prompted many organisations to move away from centralised operations teams, empowering delivery teams with greater responsibility for operational considerations.
The roles of centralised teams have evolved significantly.
Previously focused on executing tasks themselves, these teams now primarily support and enable delivery teams.
This support may involve embedding specialists within teams, developing self-service tooling, or providing training.
Their responsibility has transitioned from execution to facilitation, fostering the emergence of more independent and autonomous delivery teams.

But remember!
Draw inspiration from the experiences of other organisations, but avoid assuming that their solutions will seamlessly apply to your context.
As Jessica Kerr stated regarding the Spotify model (from the well-known 'Scaling Agile' paper), focus on replicating the underlying questions rather than blindly adopting their answers.
Ensure that any changes you implement are grounded in a deep understanding of your company, its requirements, its personnel, and its cultural nuances.

### How Will You Know if the Transition Is Working?

To ensure that you gain visiblity into seeing if it is working, you can...

- **Regular checkpoints**
  Set up checkpoints to provide your team with opportunities to evaluate whether you're progressing in the desired direction.
- **Quantitative measurements**
  Numerical data or metrics employed to assess and evaluate particular facets of a system, process, or result.
  The metrics chosen for monitoring progress depend on the objectives being pursued.
  However, it's important to recognise that metrics can have pitfalls due to the saying 'You get what you measure'.
  Metrics can be manipulated, either unintentionally or intentionally.
- **Qualitative measurements**
  Derived from subjective observations, descriptions, or interpretations.
  Regardless of the data at hand, software development is a human-driven endeavour, underscoring the importance of incorporating feedback from those directly involved in measuring success.

### Avoiding the Sunk Cost Fallacy

The Sunk Cost Fallacy, also termed the Concorde Fallacy, refers to the tendency for individuals to continue investing resources (time, money, effort) into a project or decision, even if it's clear that the expected outcome is unlikely to justify the additional investment.
This behaviour occurs because people focus on the resources already invested ('sunk costs') rather than objectively assessing the future benefits and costs of continuing or discontinuing the endeavour.

Breaking down tasks into smaller steps helps mitigate the sunk cost fallacy and facilitates easier course adjustments.
Utilising the checkpoint mechanism enables reflection on progress.
While it's not necessary to change direction immediately at the first sign of trouble, disregarding evidence of success or failure is riskier than not gathering evidence at all.

## Splitting the Monolith

We want to transition to a microservice architecture incrementally, allowing us to learn and adapt as needed, without a complete rewrite.
To do this, we have to ensure that we can continue to work with, and make use of, our existing monolithic applications.
If we can modify the current system, it offers the most flexibility.
However, constraints like the lack of source code, obsolete technology skills, or high modification costs might limit this.
Additionally, the monolith could be in poor condition or heavily used by others, complicating changes.

When migrating functionality to new microservices, it's not always clear what to do with the existing code.
Should we move the code as is or re-implement the functionality?
If the monolithic codebase is well-structured, moving the code itself can save significant time.

### Refactoring the Monolith

Experience has shown that the biggest barrier to using existing monolithic code in new microservices is that monolithic codebases are typically not organised around business domain concepts.
Instead, they are categorised technically (e.g. Model, View, Controller).
This makes it challenging to move business domain functionality, as it can be difficult to locate the code to move.

In the book 'Working Effectively with Legacy Code', Michael Feathers defines a seam as a place where you can change a program's behaviour without editing the existing behaviour.
Essentially, you define a seam around the code you want to change, develop a new implementation, and then swap it in.
While Michael's concept of seams can be applied broadly, it fits particularly well with bounded contexts.

#### Modular Monolith

After understanding the existing codebase, you could consider extracting the newly identified seams as separate modules to create a modular monolith.
This approach allows for independent module development, providing many benefits while avoiding many of the challenges of a microservice architecture.

#### Incremental Rewrites

In practice, it is found that few teams refactor their monoliths before transitioning to microservices.
More commonly, teams identify the responsibilities of the new microservice and create a _clean-room_ implementation of that functionality.
This approach risks the problems of big bang rewrites.
To avoid this, rewrite only small pieces of functionality at a time and regularly deliver the updates to customers.
If re-implementing the service takes a few days or weeks, it's manageable.
But if it starts taking several months, it's time to reassess the approach.

### Pattern: Strangler Fig Application

[ref](https://martinfowler.com/bliki/StranglerFigApplication.html)

One widely used technique for system rewrites is known as the _strangler fig application_.
Inspired by a type of fig tree that starts growing on a host tree's upper branches and gradually replaces it, this approach in software involves the new system initially wrapping around and relying on the existing one.
Over time, the new system can grow independently until it completely supplants the old one.
This method supports incremental migration to a new system, allowing for pauses in the process while still utilising the progress made so far.
Each step in this approach is designed to be reversible, minimising the risks associated with incremental changes.

The pattern is comprised of three steps:

- Identify parts of the existing system to migrate.
  - You may consider extracting larger groups of functionality to streamline the process, but this approach involves a delicate balance.
    Extracting larger slices increases workload while potentially easing integration challenges.
- Implement this functionality in a new microservice.
  - This may involve actually copying the code from the monolith (if possible), or else re-implementing the functionality in question.
- Reroute calls from the monolith over to the new microservice.
  - You need to be able to clearly map the inbound call to the functionality you wish to change.
  - HTTP is very amenable to redirection, for example, URI path redirection.
  - Your proxy could also transform the protocol i.e. SOAP-based HTTP interface remapped to gRPC.
    However, this puts _smarts_ in the pipes, which are preferred to be placed in the clients.
    Instead, push the mapping into the service itself, as a shared proxy layer can slow down the process of making and deploying changes.
  - Use of a service mesh can help remove the shared proxy layer, with each service using its own dedicated proxy.
  - Message-driven architectures (i.e. through a message broker) can use a content-based router to send messages to the relevant system.
    So as not to make a _smart_ pipe, both services could receive all messages and ignore any they do not wish to handle.
    Coordination between handling changes is required between the two systems, which can be tricky to orchestrate (over a shared router).
  - Feature toggles can be used to activate the redirection.

**Note:** Until the call to the moved functionality is redirected, the new functionality isn't technically live, even if it is deployed into a production environment.

Separating _deployment_ from _release_ is important as it allows validation in the production environment before customer use, minimising rollout risks.
Allowing changes to functionality during the migration complicates potential rollbacks.
It's simpler to avoid changes until migration is fully complete.
The longer the migration process, the more challenging it becomes to enforce a 'feature freeze' in that system area though.
Smaller migrations reduce the urgency to modify functionality before completing the process.

### Pattern: UI Composition

The user interface offers valuable opportunities to integrate functionality from both the existing monolith and new microservices.
UI composition effectively facilitates system re-platforming by enabling migration of complete vertical slices of functionality.
It does, however, require the ability to modify the existing user interface to incorporate that functionality.
This can be achieved using:

- **Page Composition** – Allows us to switch functionality at the entire page level.
- **Widget Composition** – Allows us to switch functionality within a page.
  - This can be achieved with ESI or the use of micro-frontends within SPAs.
  - Micro-frontends involve dividing a user interface into separate components that can be developed and deployed independently (similar to microservices).
  - Web Components is a standard which can be used, although it has slow adoption.

### Pattern: Branch by Abstraction

[ref](https://martinfowler.com/bliki/BranchByAbstraction.html)

For the strangler fig pattern to be effective, we need to intercept calls at the perimeter of our monolith.
However, if the functionality we aim to extract is deep within the existing system, significant changes are necessary.
These changes can disrupt other developers working concurrently on the codebase.
To balance these tensions, developers typically work on separate source code branches when reworking parts of the codebase.
This approach minimises disruption but introduces challenges when merging changes back into the main branch.
The _branch by abstraction_ pattern offers an alternative by modifying the existing codebase to safely integrate new implementations alongside existing ones in the same version, reducing disruption to other developers while allowing for incremental changes.

Branch by abstraction consists of five steps:

- Create an abstraction for the functionality to be replaced.
- Change clients of the existing functionality to use the new abstraction.
- Create a new implementation of the abstraction with the reworked functionality.
  In our case, this new implementation will call out to our new microservice.
- Switch over the abstraction to use our new implementation.
- Clean up the abstraction and remove the old implementation.

There is a variation of this pattern called _verify branch by abstraction_, whereby if calls to the new implementation fail, then the system is able to automatically fall back to the old implementation.

### Pattern: Parallel Run

- Call both the old and new implementations simultaneously and compare their results.
- Only one serves as the source of truth – usually the old one until the new one is verified.
- Ensures the new implementation meets functional and non-functional requirements, such as response time and error rates.
- You can use a Spy (from unit testing) to assert the behaviour of a service without incurring additional side-effects.
  For instance, if you wish to parallel run a Notification service, you would not want to send out two emails.
- Where you position the Spy is important.
  If you place it within the monolith, you do not account for the impact of the remote call (such as timeouts, failures, latency), so you test less.
  However, it makes the verification step easier as it is all within the same process.
- It is recommended to have the Spy as close to the delimitating factor as possible, so as to test as much of the behaviour as you can.
  This requires out-of-process verification to be performed (typically on a schedule).
- Parallel Run is a form of _Progressive Delivery_, which focuses on gradual and controlled rollout of new features.
  This minimises risk and ensures stability during deployment.
  Other variants of this approach are:
  - Canary Releasing – directs a subset of users to the new functionality.
  - Dark Launching – deploys and tests new functionality invisibly to users.

### Pattern: Decorating Collaborator

This approach enables triggering new behaviour within the monolith without changing it, using the decorator pattern to simulate direct calls from the monolith to our services.
Instead of intercepting calls, we let them proceed normally and then call external microservices based on the results through mechanisms like proxies.
This pattern works best when necessary information can be extracted from the inbound request or the monolith's response, but it becomes complex when additional information is needed for the new service.
For instance, requiring more data from the monolith to complete the microservice's action.

### Pattern: Change Data Capture

With change data capture, rather than trying to intercept and act on calls made into the monolith, we react to changes made in a datastore.
For change data capture to work, the underlying capture system must be coupled to the monolith's datastore.
There are several ways of reacting to these changes within your microservices:

- **Database triggers** – special types of stored procedures that automatically execute or 'trigger' in response to certain events on a particular table.
- **Transaction log pollers** – continuously monitor the out-of-process transaction log of a database to capture and react to changes as they happen.
- **Batch delta copier** – regularly schedule scans of the database to find (and react to) the data that has changed.

This approach is suited when you need to react to data changes in the monolith but cannot intercept these changes at the system's perimeter (strangler or decorator) or modify the underlying codebase.

## Decomposing the Database

Microservices work best when we practise information hiding, which means having their own data store.
With a shared database, it can be unclear as to who 'controls' the data and where the business logic that manipulates this data resides.

Shared databases are considered appropriate within a microservice architecture only for:

- Read-only static reference data.
- Situations where a service directly exposes a database as a defined endpoint, designed and managed to accommodate multiple consumers (as discussed in several of the patterns below).

### Pattern: Database View

To provide a single source of data for multiple services while mitigating coupling concerns, a read-only view can be used.
This view presents a service with a limited projection from the underlying schema, implementing a form of information hiding.
Database views should be maintained by the team managing the source schema, similar to other service interfaces.
This approach is limited to query results and requires services to have access to the source database.

### Pattern: Database Wrapping Service

The database wrapping service pattern hides the database behind a thin service wrapper, converting database dependencies into service dependencies.
This allows control over what is shared and hidden, which is useful when the underlying schema is too complex to separate.
By enforcing access only through the wrapping service, further growth of the database can be controlled and ownership boundaries clarified.
Unlike simple database views, this pattern allows for more sophisticated data projections and supports write operations via API calls.
However, it does require consumers to switch from direct database access to using the API.

### Pattern: Database-as-a-Service Interface

[ref](https://martinfowler.com/bliki/ReportingDatabase.html)

Sometimes, clients need a database to query for large data sets because their tools require a SQL endpoint.
For this we can create a dedicated, read-only database that is updated whenever the underlying database changes.
This is similar to exposing a stream of events or a synchronous API.
A mapping engine is used as an abstraction layer between internal and external databases, ensuring the public-facing database remains consistent even if the internal database structure changes.

### Pattern: Aggregate Exposing Monolith

Microservices should be viewed as a combination of behaviour and state, similar to aggregates.
When exposing an aggregate from the monolith, the monolith retains control over permitted state changes, acting as more than just a database wrapper.
This approach involves exposing operations that let external parties query the current state of an aggregate and request new state transitions.
We can restrict which aspects of an aggregate's state are exposed and limit which state transition operations can be requested externally.

When the data is still 'owned' by the monolith, this pattern effectively provides your new services with the necessary access.
For extracted services, having the new service call back to the monolith for data access is usually not much more work than directly accessing the monolith's database, but it is a better long-term solution (over Database Views, for example).

### Pattern: Change Data Ownership

If the microservice has assumed responsibility for that behaviour or data, we should invert the dependency, making the monolith treat the new service as the source of truth.
This means the monolith will call the microservice's endpoint to read data and request changes.

### Pattern: Synchronise Data in Application

The strangler fig pattern offers the flexibility to revert back to the monolith if issues arise after transitioning to the new service.
However, challenges can occur when the new service must maintain data synchronisation with the monolith.

This approach ensures database synchronisation through code, with either the monolith or the new service handling writes to both databases.
It works best when either the new service or the monolith exclusively manages writes at any given time, which is conducive to a straightforward switchover strategy like the strangler fig pattern.
However, during scenarios like canary deployments where requests might interact with both the monolith and the new service concurrently, maintaining synchronisation becomes complex, making this pattern less suitable.

### Pattern: Tracer Write

With the Tracer Write pattern, the data's source of truth is gradually shifted, allowing for coexistence of two sources during migration.
A new service is chosen to host the relocated data, while the current system maintains a local record.
Updates are synchronised by ensuring changes are mirrored to both the current system and the new service through its service interface.
Existing code is then adapted to exclusively utilise the new service.
Once all functionality relies on the new service as the primary source, the old source can be phased out.

### Transactions

A transaction is a sequence of operations performed as a single, indivisible unit of work.
Transactions ensure that all operations succeed or none do, maintaining integrity and consistency, which simplifies system development and maintenance.

#### ACID Transactions

Typically, when we talk about database transactions, we talk about ACID transactions.

- **Atomicity**:
  - All operations within a transaction complete together or not at all.
  - If any change fails, the entire transaction is aborted.
  - Atomicity is often the first issue encountered when splitting transactional boundaries.
- **Consistency**:
  - Ensures the database remains in a valid, consistent state after changes.
- **Isolation**:
  - Multiple transactions can operate concurrently without interference.
  - Interim state changes are invisible to other transactions.
- **Durability**:
  - Completed transactions are permanent and resilient to system failures.

When we split our database apart, we can still use ACID transactions.
However, the scope of these transactions is reduced to a specific service, not across services.

#### Distributed Transactions: Two-Phase Commit

The two-phase commit (2PC) algorithm is used for transactional changes in distributed systems, involving two phases: voting and commit.
During the voting phase, a coordinator checks if all workers can perform a state change.
If any worker cannot, the operation aborts.
If all agree, the commit phase begins, and changes are made.

There are several limitations to this approach:

- It cannot guarantee simultaneous commits, causing potential inconsistencies.
- It requires locking resources, increasing the risk of deadlocks.
- It has numerous failure modes, some needing manual resolution.
- It introduces high latency and complexity, especially with many participants or long transactions.

This means of distributed transaction should be avoided when coordinating state changes across microservices, due to complexity and the above limitations.
If possible, avoid splitting data that requires atomic and consistent management.
Keep such data in a single database and manage it within a single service or monolith.
If data must be separated across services, look to the Saga pattern instead.

#### Distributed Transactions: Saga

Unlike a two-phase commit, a saga coordinates multiple state changes without long-term resource locking.
It achieves this by modelling steps as independent activities, promoting explicit business process modelling.
Originally proposed for long-lived transactions (LLTs), sagas split LLTs into shorter, independent (ACID) transactions to minimise database contention.
This approach extends to coordinating changes across multiple services, breaking down business processes into sequential calls within a single saga.
It's crucial to note that while sagas lack the atomicity of traditional ACID transactions across the entire saga, each sub-transaction maintains ACID properties individually, enabling reasoned state management.

In sagas, handling failures involves two recovery approaches: _backward recovery_ and _forward recovery_.
Backward recovery reverts failures through compensating actions that undo committed transactions.
Forward recovery retries transactions from the failure point, ensuring that the entire saga progresses towards completion despite encountering possible transient failures.

It's practical to employ varied failure recovery approaches.
Certain failures may necessitate rollback (backward recovery), while others can proceed forward (forward recovery).
For example, in the context of order processing, after receiving payment and packaging the item, the final step is dispatching.
If dispatch fails due to operational reasons, like a lack of delivery capacity, rolling back the entire order seems unnecessary.
Instead, retrying the dispatch and involving human intervention if retries fail is a more logical approach to resolve the issue.

##### Orchestrated

Orchestrated sagas employ a central coordinator, or orchestrator, to dictate the sequence of operations and trigger compensating actions when needed (similar to a musical conductor).
This command-and-control approach provides clear visibility into saga execution.
Explicitly modelling business processes within the orchestrator enhances system understanding and facilitates onboarding.
However, this approach increases domain coupling, as the orchestrator must be aware of all involved services.
It also risks centralising logic that should ideally reside within individual services, potentially leading to service anaemia.
To mitigate these issues, consider distributing orchestration responsibilities among different services for different workflows, promoting service autonomy and reuse of functionality across various business processes.

##### Choreographed

Choreographed sagas distribute responsibility among multiple collaborating services, contrasting with the command-and-control nature of orchestrated sagas.
It is analogous to a dance, whereby everyone knows what they need to do, communicating and moving with each other; there is no single conductor telling them what to do.
Services communicate through events broadcast throughout the system, where each service reacts autonomously to events it receives without direct knowledge of other services.
This decentralised approach reduces coupling and avoids centralised logic.
However, understanding the overall business process becomes challenging without an explicit model.
Additionally, tracking saga state for necessary actions like compensating transactions becomes complex without a central coordinator.
To address this, systems can use correlation IDs in events, allowing a dedicated service to track saga states and manage necessary actions programmatically.

## Growing Pains

Don't think of adopting microservices as flipping a switch.
Think about it as turning a dial.
As you increase your use of microservices, you'll unlock their benefits but also encounter new challenges.
Addressing these requires fresh thinking, new skills, different techniques, and possibly new technology.

### (Code) Ownership at Scale

The different forms of code ownership are...

#### Strong code ownership

Every service has designated owners.
Changes by non-owners must be submitted to the owners for approval.
Using pull requests is one way to manage this process.

Strong code ownership is common in large-scale microservice architectures with multiple teams and over 100 developers.
This model promotes product-oriented teams, allowing them to focus on specific business domains.
Such teams maintain customer focus, build domain expertise, and often work with embedded product owners.

#### Weak code ownership

Most services have designated owners, but anyone can still make direct changes.
Source control allows open access, with the expectation that changes to others' services are discussed with the owners beforehand.

#### Collective code ownership

No one owns anything, and anyone can change anything they want.
For collective ownership to work, the team must be well-connected and share a common understanding of good changes and the technical direction for each service.

For small teams, collective code ownership works well.
However, for rapidly growing teams, it becomes problematic.
Collective ownership requires time for consensus to form and evolve, which is difficult with increasing team size and rapid hiring.

### Breaking Changes

A microservice is part of a larger system, consuming and/or exposing functionality.
We aim for independent deployability, ensuring changes don't break consumers, with this exposed functionality acting as a _contract_.

#### Eliminate accidental breaking changes

An explicit schema for your microservice helps detect _structural breakages_.
For example, changing a method from taking two integers to one is an obvious breaking change.
_Semantic breakages_ can also occur however; if a method that added two integers now multiplies them, it breaks the contract (expected behaviour) as well.
Make contract changes obvious to developers with explicit schemas and thorough test coverage.

#### Think twice before making a breaking change

Prefer expanding your contract by adding new methods or resources without removing the old ones.
Support both old and new functionality whenever possible.
This provides you with a means of you and your consumers gracefully moving over to the revised contract behaviour.

#### Give consumers time to migrate

Microservices should be independently deployable.
Changes must not impact existing consumers, allowing them to use the old contract while the new one is available.
Give consumers time to migrate to the new version by either running two versions side-by-side or, preferably, supporting both contracts within a single version.

### Reporting

In a monolithic system, a single database makes data analysis straightforward with a ready-made schema for reporting.
Microservice architecture scatters data across isolated schemas, complicating these efforts.
Stakeholders often rely on tools and processes that require direct SQL access to a single database, usually tied to the schema design of your monolithic database.
To avoid disrupting their workflow, you may need to present a single database for reporting, potentially matching the old schema to minimise changes.
If your monolith uses a dedicated data source like a data warehouse or data lake, ensure microservices copy data there to maintain reporting.

### Monitoring and Troubleshooting

> “We replaced our monolith with microservices so that every outage could be more like a murder mystery.” Honest Status Page (@honest_update)

Monitoring a monolithic application is straightforward: with fewer machines and a binary failure mode, the system is either up or down.
High CPU usage (e.g. 100%) clearly indicates a problem.
In contrast, a microservice architecture involves numerous services and instances, where a single service failure doesn't necessarily mean the whole system is down.
Therefore, the level of importance of a 100% CPU could be deemed a lower severity in this case.

#### Log aggregation

With a few long-lived machines, logs could be fetched directly from the machines.
However, in a microservice architecture with many more, often short-lived processes, a log aggregation system is essential.
It captures and forwards all logs to a central location for searching and alert generation.

#### Tracing

Analysing call sequences and identifying the source of failures or latency spikes in microservices is challenging when viewing each service in isolation.
Collating these flows is invaluable.
This can be achieved by generating correlation IDs for all incoming calls and tying the different service requests together using it.
Along with logs, we can also trace the time taken for calls, etc. using distributed tracing tools like Jaeger.

#### Testing in production

Functional automated tests provide feedback on software quality before deployment, but we need ongoing feedback in production.
New deployments or environmental changes can break features that previously worked.
By using _synthetic transactions_ to simulate user behaviour, we can define expected outcomes and set up alerts for failures.
Start by adapting existing end-to-end test cases for production use, ensuring these tests don't adversely impact the production environment.

#### Observability

Traditional monitoring and alerting focus on predicting known issues, like disk-space running out, unresponsive services, or latency spikes.
However, as systems become more complex, it's harder to foresee all potential problems.
Therefore, it's crucial to enable open-ended enquiries into our systems when issues arise, to quickly stabilise operations and gather data for future fixes.
Comprehensive data collection, including tracing and logs, allows us to investigate unexpected problems using real information rather than conjecture.

### Local Developer Experience

As the number of services grows, the developer experience can deteriorate.
Resource-intensive runtimes like the JVM limit the number of microservices that can run on a single machine, slowing down local builds and execution.
Developers may request more powerful machines, but this is only a temporary fix if services continue to grow.
Teams practising collective ownership of multiple services are more affected, as they often need to switch between services.
In contrast, teams with strong ownership of fewer services focus on their own and develop methods to stub out external services.

To reduce the number of locally run services, developers commonly stub out unnecessary services or point to instances running elsewhere.
A fully remote setup can leverage more capable infrastructure for numerous services.
Monitoring how the developer experience evolves with increasing services is crucial.
Implement feedback mechanisms and invest continuously to maintain developer productivity.

### Running Too Many Things

As the number of services and instances grows, managing deployments and configurations becomes more complex.
Traditional methods for handling monolithic applications often don't scale well with numerous microservices.
Desired state management becomes crucial.
This involves specifying and maintaining the required number and location of service instances.
Manual processes might work for monoliths but won't scale with tens or hundreds of microservices, each with different desired states.
This is when you should look into tooling such as Kubernetes or follow a Serverless-first mindset and go with FaaS offerings such as AWS Lambda.

### End-to-End Testing

When employing automated functional tests, there's a delicate balance to maintain.
The broader the functionality tested, the greater the confidence in your application, but this also increases test duration and complexity in diagnosing failures.
In a microservice architecture, end-to-end tests span multiple services, requiring deployment and configuration across these services, and encountering challenges like false negatives due to environmental issues.

To manage this effectively:

- **Limit Test Scope:** Keep tests covering multiple services within the team managing those services to avoid crossing team boundaries.
- **Consumer-Driven Contracts (CDCs):** Use CDCs where consumers define service expectations via executable specifications (tests), ensuring these tests pass when service changes occur.
  Tools like Pact facilitate this approach.
- **Automated Release and Progressive Delivery:** Implement progressive delivery techniques like canary releases to incrementally roll out new software versions, monitoring key performance indicators (KPIs) to automate decision-making on continuing or rolling back deployments.
- **Refine Quality Feedback Cycles:** Continuously adapt testing strategies based on holistic insights into development processes.
  This involves adding new tests to cover emerging production issues and removing redundant tests to optimise feedback cycles.

### Global vs. Local Optimisation

Embracing decentralised decision-making within teams, including full lifecycle ownership of microservices, necessitates balancing local autonomy with global alignment.
A common challenge arises when multiple teams independently address the same issue without realising it, leading to inefficiencies over time.

This issue typically surfaces in multi-team organisations, particularly those granting teams greater autonomy.
It often becomes apparent after periods of rapid scaling, where increased developer numbers strain ad hoc information sharing, fostering information silos.
Collective ownership of services can mitigate these challenges by promoting consistent problem-solving approaches.

Ultimately, this challenge revolves around distinguishing between reversible and irreversible decisions.
Decisions with higher change costs require broader consensus.
Teams must recognise when decisions lean towards irreversibility and involve stakeholders outside their team to ensure effective collective ownership and scalability.

### Robustness and Resiliency

In distributed systems, failure modes such as lost network packets, timeouts, and machine failures are common, contrasting with the relative simplicity of monolithic setups.
These challenges are most pronounced in production environments, where replicating these conditions during testing is challenging.
As the number of services and service calls grows, systems face heightened vulnerability to resilience issues like cascading failures and back pressure, particularly in tightly interconnected environments.

#### Potential Solutions

Some potential solutions could be:

- **Understanding Service Calls:** Begin by assessing potential failure scenarios for each service call and defining response strategies.
- **Implementing Solutions:** Strategies include isolating services to reduce interdependencies, employing asynchronous communication to prevent temporal coupling, setting sensible timeouts to manage slow services, and using patterns like circuit breakers for rapid failure mitigation.
- **Operational Practices:** Running multiple service instances and utilising platforms with desired state management help mitigate risks associated with service failures.

Resilience goes beyond pattern implementation; it involves cultivating an organisational culture prepared to address unforeseen challenges and adapt practices as needed.
A practical step is documenting production issues promptly and learning from them.

### Orphaned Services

Organisations struggle with fundamental challenges in asset management, often uncertain about what they possess, its location, and responsible oversight.
Microservices, when highly specialised, can persist without updates for long durations, leading to 'orphaned services' lacking active ownership.
Addressing this requires implementing collective ownership practices, fostering shared responsibility among teams and utilising collaborative tools for effective service management.
