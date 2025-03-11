---
layout: post
title: 'Implementing a Compound Set in TypeScript'
meta: 'Learn how to implement a Compound Set data structure in TypeScript using a Map to handle complex data types effectively.'
tags: ['typescript', 'data-structures']
---

Since being introduced to Advent of Code, one feature missing from JavaScript that I have seen available in other languages (such as Python and Clojure) is Sets that handle [Compound data-types](https://www.oreilly.com/library/view/javascript-design/0735711674/0735711674_ch03lev1sec3.html).
To focus each puzzle solution on the problem at hand and not _re-invent the wheel_, I decided to implement a `CompoundSet` data structure to fill this void.

<!--more-->

JavaScript does include the ability to create Sets with [primitive data types](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set).
However, in certain use cases (such as storing X-Y coordinates), it is useful to be able to store more complex data types (such as Tuples).
Although this is technically possible, the _gotcha_ is that equality is based on reference as opposed to value semantics.
So storing the Compound data type within the Set will be valid, except checking for existence will require the exact same value reference to be supplied.

There is a proposal to introduce [Records and Tuples](https://github.com/tc39/proposal-record-tuple) in a future version of JavaScript, which will alleviate this problem.
But until that is introduced, I decided to create a `CompoundSet` implementation backed by a native `Map` like so:

```typescript
class CompoundSet<T> {
  private set: Map<string, T>;

  constructor(initial: T[] = []) {
    this.set = new Map(initial.map(val => [this.toKey(val), val]));
  }

  has(val: T): boolean {
    return this.set.has(this.toKey(val));
  }

  add(val: T): this {
    this.set.set(this.toKey(val), val);
    return this;
  }

  delete(val: T): this {
    this.set.delete(this.toKey(val));
    return this;
  }

  [Symbol.iterator]() {
    return this.set.values();
  }

  get size() {
    return this.set.size;
  }

  private toKey(val: T): string {
    return JSON.stringify(val);
  }
}
```

This implementation is not exhaustive and does not provide all the functionality that a native Set offers.
It does, however, include enough behaviour to be a _drop-in replacement_ for solving the daily puzzles I have been working through.
Encoding the value as a JSON string provides us with the primitive type required for the Map key, which we can subsequently use to check for existence (by value).
Using an internal Map, we can ensure that we persist the original value, which can be used when iterating over the Set.

I have found this data structure to be very useful whilst completing my first Advent of Code calendar in 2020.
In the future, I hope to explore how we could use a similar approach to provide a `CompoundMap` implementation.
