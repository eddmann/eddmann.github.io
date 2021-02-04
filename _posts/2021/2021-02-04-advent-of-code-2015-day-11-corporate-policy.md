---
layout: post
title: 'Advent of Code 2015 - Day 11 - Corporate Policy'
meta: 'Solving the Advent of Code 2015 Day 11 puzzle using TypeScript'
---

On the eleventh day of Advent of Code 2015 we are asked to help Santa pick a new _memorable_ password, as his last one has expired.

<!--more-->

### Part 1

For part one we are asked to work out what Santas next password should be, based on his previous expired one.

Santas password is generated based on incrementing a seed password using a process similiar to how Rotors are stepped within an [Engima machine](https://en.wikipedia.org/wiki/Enigma_machine).
We increase the rightmost letter one step, if it is _z_, it wraps around to _a_, and then repeat with the next letter to the left until one does not wrap around.

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

For the above implementation I decided to take a recursive approach, leveraging an alphabet sequence string to deduce order.
I explored the option of using an ordinal character codes instead but decided to stick with this implementation for readablility.

With a possible new password now generated, Santa requires that it passes three password policy rules he has enforced.
To ensure the password is valid it must not contain any restricted letters, have at-least two occurances of non-overlapping pairs (i.e. aacc, aabcc) and include an alphabet sequence triplet (i.e. abc, cbd).

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

Harnessing Regular Expression back-references we are able to test for non-overlapping pairs like we did in previous days solutions.
To validate th alphabet sequence triplet criteria, I opted to reuse the alphabet sequence string and capture all triplet sub-sequences from the password using a positive-lookahead Regular Expression.

With the ability to now generate and validate possible passwords, we are required to iteratively perform this operation until the next valid password has been found.

```typescript
const generateNextPassword = (seed: string): string => {
  let next = seed;
  while (true) {
    next = nextPossiblePassword(next);
    if (isValidPassword(next)) return next;
  }
};
```

I initially explored the option of using a tail-recursive approach to iterating over this process but found that JavsScript engines do not [fully support this yet](https://dev.to/snird/recursion-optimization-in-js-where-is-it-ptc-tco-and-fud-4fka).
From here I then debated if returning a [Generator](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Generator) would add much value to the solution.
In the end I landed on a simple stateful loop which iteratively applies and validates the generation process until the next password is found.

Finally, we can call this function with the supplied expired password to return Santas next valid password 🌟.

```typescript
const part1 = (input: string): string => generateNextPassword(input);
```

### Part 2

For part two we are asked to apply this process an additonal time and generate Santas next following password.
All the work for carrying out this task has been done in part one 🎉, meaning all that is required it to supply the password generated in part one into an additional generation call 🌟.

```typescript
const part2 = (input: string): string =>
  generateNextPassword(part1(input));
```
