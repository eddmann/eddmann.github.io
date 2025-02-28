---
layout: post
title: 'Advent of Code 2015 - Day 10 - Elves Look, Elves Say'
meta: 'Solving the Advent of Code 2015 Day 10 puzzle using TypeScript.'
tags: advent-of-code advent-of-code-2015 typescript
---

On the tenth day of Advent of Code 2015, the Elves are playing a game of [look-and-say](https://en.wikipedia.org/wiki/Look-and-say_sequence), in which we are asked to find several terms in the sequence.

<!--more-->

## Part 1

For part one, we are asked to determine the length of the result of the 40th term in the sequence (starting with the provided input).
Based on a famous integer sequence, we begin by implementing how the next term can be produced from a supplied value.

```typescript
const lookAndSay = (input: string): string =>
  input
    .match(/(\d)\1*/g)
    .reduce((next, digit) => next + digit.length + digit[0], '');
```

For this implementation, I have decided to take advantage of Regular Expression back-references again to capture all the grouped adjacent digits - treating integers as strings in the process.
From here, we can reduce over these groups, forming the next value in the sequence.

Now that we have the ability to produce the next term in the sequence, we need a means to iterate over this process for a given number of times.
For this, I decided to create a small generic utility function, which is influenced by the [`iterate`](https://clojuredocs.org/clojure.core/iterate) function provided in Clojure (except this one is not lazy).

```typescript
const repeat = <T>(
  times: number,
  fn: (x: T) => T,
  initialValue?: T
): T => {
  let accumulator = initialValue;
  while (times--) accumulator = fn(accumulator);
  return accumulator;
};
```

Providing an optional initial value, this function abstracts away the mutational looping required to apply this process in a performant manner.
With these two functions now present, we can compose them together and find the 40th term, which is required to answer this part's question 🌟.

```typescript
const part1 = (input: string): number =>
  repeat(40, lookAndSay, input).length;
```

## Part 2

For part two, we are required to instead find the length of the 50th term in the sequence.
Again, we can compose the two above functions together to find the desired answer 🌟.

```typescript
const part2 = (input: string): number =>
  repeat(50, lookAndSay, input).length;
```
