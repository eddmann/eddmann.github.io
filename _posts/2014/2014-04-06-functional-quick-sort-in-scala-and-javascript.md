---
layout: post
title: 'Functional Quick sort in Scala and JavaScript'
meta: 'A comprehensive guide to implementing functional Quick sort in Scala and JavaScript, complete with detailed code examples and explanations.'
tags: functional-programming algorithms scala javascript
---

Functional languages provide you with the ability to concisely define the intent of a piece of code, without low-level issues getting in the way.
This can be clearly seen when implementing the Quick sort algorithm.
Often referred to as 'partition-exchange' sort, this divide and conquer algorithm recursively divides a list into two sub-lists, based on a chosen pivot element.

<!--more-->

## Scala

This description can be clearly expressed in the Scala implementation shown below.

```scala
def qsort(xs: List[Int]): List[Int] = xs match {
    case Nil => Nil
    case head :: tail => {
        val (low, high) = tail.partition(_ < head)
        qsort(low) ::: head :: qsort(high)
    }
}
```

So as to highlight the key points in this post, the example has been restricted to only sorting lists of integers.
As well as this, the leftmost element is chosen as the pivot, causing worst-case behaviour on already sorted arrays.

## JavaScript

Having been impressed by how well documented the intentions of the programme were when writing in a functional style, I decided to attempt to implement the same example in JavaScript.
Before I was able to achieve this, however, I needed to set up a couple of array helper functions, as shown below.

```js
Array.prototype.partition = function (fn) {
  var xs = [],
    ys = [],
    len = this.length,
    i,
    e;

  for (i = 0; i < len; i++) {
    e = this[i];
    (fn(e) ? xs : ys).push(e);
  }

  return [xs, ys];
};

Array.prototype.head = function () {
  return this[0];
};

Array.prototype.tail = function () {
  return this.slice(1);
};

Array.prototype.isEmpty = function () {
  return !this.length;
};
```

As you can see, the functions defined are similar to functionality already present in Scala's standard libraries.
Variable unpacking is planned for inclusion in ECMAScript 6, though at this time, I decided to use a workaround within the current JavaScript specification that achieves a similar effect.

```js
function unpack(fn, el) {
  return fn.apply(null, el);
}
```

Finally, with the required helper functionality in place, we are then able to define the Quick sort algorithm in JavaScript, using the same rules as the Scala implementation.

```js
Array.prototype.qsort = function () {
  if (this.isEmpty()) return [];

  var head = this.head();

  return unpack(
    function (low, high) {
      return [].concat(low.qsort(), head, high.qsort());
    },
    this.tail().partition(function (_) {
      return _ < head;
    })
  );
};
```
