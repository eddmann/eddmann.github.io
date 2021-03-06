---
title: "Asynchronous Calls within Flux"
link: http://tech.mybuilder.com/asynchronous-calls-within-flux/
meta: "Exploration into handling asynchronous calls within the Flux architecture"
---

The Flux architecture abides by a single unidirectional data-flow throughout the entire application.
This provides us with a host of benefits, ranging from easier to reason about code, to clearer testing strategies.
However, one issue we faced in our recently updated interface tradesmen use to communicate with customers, was how to handle asynchronous calls within these constraints.
Throughout this post I wish to guide you through the iterative design decisions made, along with the resulting abstractions and boundaries.
<!--more-->
