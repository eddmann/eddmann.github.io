---
layout: post
title: "Understanding De Morgan's Laws to Simplify Propositions"
meta: "Learn how De Morgan's Laws help simplify logical propositions in programming by transforming predicates for better readability and intent."
tags: logic
---

Yesterday, I watched a conference talk about [Formal Logic](https://www.youtube.com/watch?v=saMtzIaDCJM), where De Morgan's Laws were discussed.
Wikipedia provides a very good [explanation of the laws](https://en.wikipedia.org/wiki/De_Morgan%27s_laws) in-depth.
Essentially, they are transformation rules that allow you to simplify certain propositions.
Whilst programming, predicate logic of this form appears very frequently.
It is very useful to know how you can rewrite a predicate to better describe its intent.

<!--more-->

```js
// Negation of conjunction
(!a && !b) == !(a || b);

// Negation of disjunction
(!a || !b) == !(a && b);
```
