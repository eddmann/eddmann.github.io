---
layout: post
title: 'Advent of Code 2015 - Day 8 - Matchsticks'
meta: 'Solving the Advent of Code 2015 Day 8 puzzle using TypeScript.'
tags: ['advent-of-code', 'advent-of-code-2015', 'typescript']
---

On the eighth day of Advent of Code 2015, Santa wants to know how much space his newly digitised list will take up when stored.

<!--more-->

## Part 1

Based on the supplied input list of string literals, part one asks us to tally up the additional space this literal interpretation takes as opposed to their in-memory representations.
When parsing each string literal, we need to take into consideration any escape sequences and hexadecimal notation.
This problem feels like it could be solved using Regular Expression patterns; however, upon examination, we may be able to harness a couple of built-in JavaScript functions to do a lot of the heavy lifting.

```typescript
const part1 = (input: string): number =>
  input
    .split('\n')
    .reduce(
      (total, line) => total + (line.length - eval(line).length),
      0
    );
```

Using the _dreaded_ [`eval`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/eval) function, we are able to leverage JavaScript in evaluating each provided string literal, returning to us the in-memory representation.
Although I would refrain from using this approach with untrusted input, in a small puzzle like this, it provides a very succinct solution.
Reducing over the input listing, tallying up the length differences along the way, we are able to produce the desired answer 🌟.

## Part 2

In part two, we are asked to apply an additional encoding on the provided string literals, returning the total difference between the encoded and original input.

```typescript
const part2 = (input: string): number =>
  input
    .split('\n')
    .reduce(
      (total, line) =>
        total + (JSON.stringify(line).length - line.length),
      0
    );
```

Again, we are able to harness another built-in function, [`JSON.stringify`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify), which will provide us with the desired escape sequences and quotes.
Reducing over the input listing, we can tally up these length differences and return the answer we require 🌟.

To summarise, today's solutions depend greatly on functionality provided by the chosen language (JavaScript).
In the future, I hope to spend a little more time exploring how we could leverage Regular Expressions to solve this problem in a more translatable manner.
