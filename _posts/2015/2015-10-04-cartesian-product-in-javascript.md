---
layout: post
title: 'Cartesian Product in JavaScript'
meta: 'Simple, functional manner in which to find the Cartesian product using JavaScript ES2015'
---

This weekend I have had the chance to explore Cartesian products.
The Cartesian product (cross-product) is essentially an operation which returns a product set from multiple supplied sets. <!--more-->
When applied to more than a pair of sets it can be typically described as the n-fold Cartesian product.
Below is a simple JavaScript implementation which codifies this operation in an immutable, functional manner.

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
