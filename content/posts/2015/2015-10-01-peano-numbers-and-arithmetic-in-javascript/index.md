---
layout: post
title: 'Peano Numbers and Arithmetic in JavaScript'
meta: 'Discover how to represent natural numbers using Peano numbers in JavaScript through functional programming techniques and recursive arithmetic operations.'
tags: ['javascript', 'functional-programming']
---

Whilst completing the [Functional Programming Principles in Scala](https://www.coursera.org/course/progfun) course a couple of years ago one of the exercises was in the realm of Peano numbers.
This subject fascinated me, demonstrating how we were able to represent non-negative natural numbers without any pre-existing concepts - relying solely on logical expressions and recursive algorithms. <!--more-->
Peano numbers allow us to represent all natural numbers using a defined zero value and a successor function.

```js
const zero = () => false;
const isZero = a => a == zero();

const succ = a => () => a;
const pred = a => a();
```

Following these rules we have created the concept of zero (represented as false within our host language), along with the successor function which wraps and returns this value in a new lambda upon each invocation.
We have also supplied accompanying zero comparator and predecessor functions, which will assist us in upcoming examples.

## Arithmetic

Using this representation as a basis we are able to expand on the example by describing the four common-place arithmetic operations.

```js
const add = (a, b) => (isZero(a) ? b : add(pred(a), succ(b)));
const sub = (a, b) => (isZero(a) || isZero(b) ? a : sub(pred(a), pred(b)));
const mul = (a, b) => (isZero(a) ? zero() : add(mul(pred(a), b), b));
const div = (a, b) => (isZero(a) ? zero() : succ(div(sub(a, b), b)));
```

Looking at the definitions above, you can see how we have been able to represent these operations using recursion and the functions defined beforehand.

## Logic

We are also able to represent logical operations just as easily, which return the host language's boolean value type.

```js
const equal = (a, b) =>
  isZero(a) ? isZero(b) : isZero(b) ? false : equal(pred(a), pred(b));
const less = (a, b) =>
  isZero(a) ? !isZero(b) : isZero(b) ? false : less(pred(a), pred(b));
const greater = (a, b) => !(equal(a, b) || less(a, b));
```

## Example

Finally, we are able to combine all these operations into succinct examples.

```js
const toNumber = a => (isZero(a) ? 0 : 1 + toNumber(pred(a)));
const _0 = zero(),
  _1 = succ(_0),
  _2 = succ(_1),
  _3 = succ(_2),
  _4 = succ(_3),
  _5 = succ(_4);

toNumber(mul(add(_2, _3), sub(_5, _3))); // 10
toNumber(div(add(_2, _2), _2)); // 2

equal(add(_1, _1), div(_4, _2)); // true
less(div(_4, _2), _4); // true
greater(mul(_4, _2), _5); // true
```
