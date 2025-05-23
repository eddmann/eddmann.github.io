---
layout: post
title: 'Advent of Code 2015 - Day 11 - Corporate Policy'
meta: 'Solving the Advent of Code 2015 Day 11 puzzle using TypeScript.'
tags: ['advent-of-code', 'advent-of-code-2015', 'typescript']
---

On the eleventh day of Advent of Code 2015, we are asked to help Santa pick a new _memorable_ password, as his last one has expired.

<!--more-->

## Part 1

For part one, we are asked to determine what Santa's next password should be, based on his previous expired one.

Santa's password is generated by incrementing a seed password using a process similar to how rotors step within an [Enigma machine](https://en.wikipedia.org/wiki/Enigma_machine).
We increase the rightmost letter by one step.
If it is _z_, it wraps around to _a_, and then we repeat with the next letter to the left until one does not wrap around.

```typescript
const ALPHA = 'abcdefghijklmnopqrstuvwxyz';

const nextPossiblePassword = (password: string): string => {
  if (password === '') return '';

  const remaining = password.slice(0, -1);
  const next = ALPHA.indexOf(password.substr(-1)) + 1;

  return next < ALPHA.length
    ? remaining + ALPHA[next]
    : nextPossiblePassword(remaining) + ALPHA[0];
};
```

For the above implementation, I decided to take a recursive approach, leveraging an alphabet sequence string to deduce order.
I explored the option of using ordinal character codes instead but decided to stick with this implementation for readability.

With a possible new password now generated, Santa requires that it passes three password policy rules he has enforced.
To ensure the password is valid, it must not contain any restricted letters, have at least two occurrences of non-overlapping pairs (e.g., _aacc_, _aabcc_), and include an alphabet sequence triplet (e.g., _abc_, _cbd_).

```typescript
const isValidPassword = (password: string): boolean => {
  const hasRestrictedLetter = /[iol]/.test(password);
  const hasTwoNonOverlappingPairs = /([a-z])\1.*([a-z])\2/.test(
    password
  );
  const hasAlphaSequence = [
    ...password.matchAll(/(?=([a-z]{3}))/g),
  ].some(([, seq]) => ALPHA.includes(seq));

  return (
    !hasRestrictedLetter &&
    hasTwoNonOverlappingPairs &&
    hasAlphaSequence
  );
};
```

Harnessing regular expression back-references, we can test for non-overlapping pairs like we did in previous days' solutions.
To validate the alphabet sequence triplet criteria, I opted to reuse the alphabet sequence string and capture all triplet sub-sequences from the password using a positive lookahead regular expression.

With the ability to generate and validate possible passwords, we are required to iteratively perform this operation until the next valid password has been found.

```typescript
const generateNextPassword = (seed: string): string => {
  let next = seed;
  while (true) {
    next = nextPossiblePassword(next);
    if (isValidPassword(next)) return next;
  }
};
```

I initially explored the option of using a tail-recursive approach to iterate over this process but found that JavaScript engines do not [fully support this yet](https://dev.to/snird/recursion-optimization-in-js-where-is-it-ptc-tco-and-fud-4fka).
From here, I debated whether returning a [Generator](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Generator) would add much value to the solution.
In the end, I landed on a simple stateful loop that iteratively applies and validates the generation process until the next password is found.

Finally, we can call this function with the supplied expired password to return Santa's next valid password 🌟.

```typescript
const part1 = (input: string): string => generateNextPassword(input);
```

## Part 2

For part two, we are asked to apply this process an additional time and generate Santa's next following password.
All the work for carrying out this task has been done in part one 🎉, meaning all that is required is to supply the password generated in part one into an additional generation call 🌟.

```typescript
const part2 = (input: string): string =>
  generateNextPassword(part1(input));
```
