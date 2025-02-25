---
layout: post
title: "Understanding De Morgan's Laws to simplify propositions"
meta: "Using De Morgan's Laws to simplify certain propositions, better describing their intent"
---

Yesterday I watched a conference talk about [Formal Logic](https://www.youtube.com/watch?v=saMtzIaDCJM) and De Morgan's laws were discussed.
Wikipedia does a very good job of [explaining the laws](https://en.wikipedia.org/wiki/De_Morgan%27s_laws) in-depth, but essentially they are transformation rules that allow you to simplify certain propositions.
Whilst programming, predicate logic of this form appears very frequently, and it is very useful to know how you can rewrite a predicate to better describe its intent.

<!--more-->

```js
// Negation of conjunction
(!a && !b) == !(a || b);

// Negation of disjunction
(!a || !b) == !(a && b);
```
