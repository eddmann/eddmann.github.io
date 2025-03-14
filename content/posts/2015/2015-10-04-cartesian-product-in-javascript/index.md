---
layout: post
title: 'Cartesian Product in JavaScript'
meta: 'Discover how to compute the Cartesian product in a functional and immutable manner using JavaScript ES2015.'
summary: 'This weekend I have had the chance to explore Cartesian products. The Cartesian product (cross-product) is essentially an operation that returns a product set from multiple supplied sets.'
tags: ['javascript', 'functional-programming']
---

This weekend I have had the chance to explore Cartesian products.
The Cartesian product (cross-product) is essentially an operation that returns a product set from multiple supplied sets.
When applied to more than a pair of sets, it is typically described as the n-fold Cartesian product.
Below is a simple JavaScript implementation that codifies this operation in an immutable, functional manner.

```js
const flatten = arr => [].concat.apply([], arr);

const product = (...sets) =>
  sets.reduce(
    (acc, set) => flatten(acc.map(x => set.map(y => [...x, y]))),
    [[]]
  );

product(
  ['small', 'medium', 'large'],
  ['red', 'green', 'blue'],
  ['shirt', 'jeans', 'shoes']
);
// [["small", "red", "shirt"], ["small", "red", "jeans"] ...
```
