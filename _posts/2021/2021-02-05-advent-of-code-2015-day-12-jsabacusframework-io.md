---
layout: post
title: 'Advent of Code 2015 - Day 12 - JSAbacusFramework.io'
meta: 'Solving the Advent of Code 2015 Day 12 puzzle using TypeScript'
tags: advent-of-code advent-of-code-2015 typescript
---

On the twelfth day of Advent of Code 2015 Santa's Accounting-Elves need help balancing the books after a recent order.

<!--more-->

## Part 1

The supplied input comes in the form of a serialised JSON document, of which we are initially asked to sum up all the numbers present.
For this, we are required to traverse through the deserialised document structure and sum up all the numbers.

```typescript
const sumJsonNumbers = (
  x: any,
  isSkipped = (_: any) => false
): number => {
  if (isSkipped(x)) {
    return 0;
  }

  if (typeof x === 'number') {
    return x;
  }

  if (typeof x === 'object') {
    return Object.values(x)
      .map(y => sumJsonNumbers(y, isSkipped))
      .reduce(sum, 0);
  }

  return 0;
};
```

With some pre-warning that part two will require us to inspect the provided document in some form, I have opted to provide the ability to optional include a predicate function which will skip the provided sub-section.
As stated in the problem we can expect all number values to be typed as such and none are present in string form.
Using this above function we can now invoke the function with the supplied deserialised JSON document to return the desired answer 🌟.

```typescript
const part1 = (input: string): number =>
  sumJsonNumbers(JSON.parse(input));
```

## Part 2

As eluded to in part one, we are now required to instead of simply summing up _all_ numbers present, we must apply some predicate logic.
We are now asked ignore any object (and all of its children) which has any property with the value "red".

```typescript
const part2 = (input: string): number =>
  sumJsonNumbers(
    JSON.parse(input),
    x =>
      typeof x === 'object' &&
      !Array.isArray(x) &&
      Object.values(x).includes('red')
  );
```

The predicate function itself checks to ensure that the current document value is not an Array (as Arrays are represented as Objects in JavaScript) and then attempts to see if any of the Objects values include the value "red".
We can then invoke the `sumJsonNumbers` function again, returning the required answer for part two 🌟.

## Alternative Solution

Alternatively, we could tackle this problem in a more simplified mannor.
Instead of deserialising the JSON document and recursing over its contents, we could just employ a Regular Expression to extract all numbers present.

```typescript
const part1 = (input: string): number =>
  (input.match(/(-?\d)+/g) || []).reduce(
    (sum, val) => sum + toInt(val),
    0
  );
```

For solving part two, we could then harness a lesser-known second argument to [`JSON.parse`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/parse) and ensure that when attempting to deserialise the input we _revive_ its contents only if it matches a the given predicate.

```typescript
const part2 = (input: string): number =>
  part1(
    JSON.stringify(
      JSON.parse(input, (_, value) =>
        typeof value === 'object' &&
        !Array.isArray(value) &&
        Object.values(value).includes('red')
          ? ''
          : value
      )
    )
  );
```

We can then subsequently re-serialise this reduced JSON document and supply it to our part one solution to determine the answer.
