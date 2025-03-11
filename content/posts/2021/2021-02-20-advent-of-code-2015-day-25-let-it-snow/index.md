---
layout: post
title: 'Advent of Code 2015 - Day 25 - Let It Snow'
meta: 'Solving the Advent of Code 2015 Day 25 puzzle using TypeScript.'
tags: ['advent-of-code', 'advent-of-code-2015', 'typescript']
---

On the twenty-fifth day of Advent of Code 2015, we are asked to help Santa boot up his weather machine.

<!--more-->

## Part 1

The weather machine requires a _code_ to be entered for copy protection purposes.
As the manual has been misplaced, we are required to determine what this code will be based on the rules laid out in the [problem definition](https://adventofcode.com/2015/day/25).

The problem outlined first centres around calculating a [Triangle number](https://en.wikipedia.org/wiki/Triangular_number) and then, with this value, using [Modular exponentiation](https://en.wikipedia.org/wiki/Modular_exponentiation) to return the desired code.
We will begin by building the functionality to determine what the given row/column triangle number will be in the table.

```typescript
const calcTriangleNumberAt = (row: number, col: number): number => {
  const side = row + col - 1;
  return (side * (side + 1)) / 2 - row;
};
```

The value we are looking for is on the hypotenuse of an isosceles right-angled triangle.
We begin by working out what the length of the side is.
From here, we then calculate how many numbers are in that triangle.
Based on this value, we can then return the resulting number.

Now that we have the _exponent_ value required, we can move on to building the functionality to calculate the code itself.
We use _Modular exponentiation_ to solve this, which is used regularly within public-key cryptography.
As JavaScript does not have this functionality built-in, we are required to write our own implementation.

```typescript
const expMod = (base: number, exp: number, mod: number): number => {
  if (exp === 0) return 1;
  if (exp % 2 === 0) return Math.pow(expMod(base, exp / 2, mod), 2) % mod;
  return (base * expMod(base, exp - 1, mod)) % mod;
};
```

With these two functions available to us, we can parse the provided row and column input and calculate the desired answer 🌟.
Note that based on our resulting modular exponentiation, we must multiply this by the first code supplied before returning it.

```typescript
const part1 = (input: string): number => {
  const [row, col] = input.match(/(\d+)/g).map(toInt);
  const firstCode = 20151125;

  const base = 252533;
  const exp = calcTriangleNumberAt(row, col);
  const mod = 33554393;

  return (expMod(base, exp, mod) * firstCode) % mod;
};
```

## Part 2

For part two... there is nothing more to do.
We can give ourselves a pat on the back as we have helped save Christmas! 🎉
