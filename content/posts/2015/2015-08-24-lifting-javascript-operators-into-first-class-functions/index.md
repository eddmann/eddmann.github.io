---
layout: post
title: 'Lifting JavaScript Operators into First-class Functions'
meta: 'Experiment with lifting JavaScript operators into first-class functions for enhanced functional programming in JavaScript.'
summary: "I have always enjoyed how succinctly you are able to use commonly found operators as first-class functions in languages such as Clojure. As a quick thought experiment, I decided to see if it would be possible to use JavaScript's capabilities to dynamically create functions to mimic such behaviour."
tags: ['javascript', 'functional-programming']
---

I have always enjoyed how succinctly you are able to use commonly found operators as first-class functions in languages such as [Clojure](http://clojure.org/).
As a quick thought experiment, I decided to see if it would be possible to use JavaScript's capabilities to [dynamically create functions](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function) to mimic such behaviour.
This experiment resulted in the code you see below, permitting the lifting of operators into functions which can be passed around and used as expected.

```js
let assoc = (ops, fn) =>
  ops.split(' ').reduce((obj, op) => {
    obj[op] = fn(op);
    return obj;
  }, {});

let infix = assoc('+ - * /', op => Function('a', 'b', `return a ${op} b`));
let prefix = assoc('! ++ --', op => Function('a', `return ${op} a`));
let postfix = assoc('()', op => Function('a', `return a ${op}`));

let ƒ = op => infix[op] || prefix[op] || postfix[op];

[1, 2, 3, 4].reduce(ƒ('+'));
```
