---
layout: post
title: 'Advent of Code 2015 - Day 4 - The Ideal Stocking Stuffer'
meta: 'Solving the Advent of Code 2015 Day 4 puzzle using TypeScript'
---

On the fourth day of Advent of Code 2015 Santa needs help mining some AdventCoins 💵.

<!--more-->

### Part 1

Mining AdventCoin is very similiar in principle to how Bitcoin is mined.
Difficulty of mining _a block_ is based on how many leading-zeros must appear when hashing the desired block contents with a generated nonce value.
In the case of AdventCoin the hashing algorithm used is MD5.

```typescript
import { createHash } from 'crypto';

const hash = (input: string): string =>
  createHash('md5').update(input).digest('hex');

const calcLowestNonce = (input: string, totalLeadingZeros: number): number => {
  const prefix = '0'.repeat(totalLeadingZeros);

  let nonce = 1;
  while (!hash(input + nonce).startsWith(prefix)) nonce++;

  return nonce;
};
```

We begin by creating a small function `calcLowestNonce` which uses brute-force to determine the lowest matching nonce value based on the supplied input.
Once found we then return this nonce value to the callee.

To answer part one we are required to find the first valid nonce value which has five leading-zeros, using the above function we are able to return this answer like so 🌟.

```typescript
const part1 = (input: string): number => calcLowestNonce(input, 5);
```

### Part 2

The second part expands upon the first problem and asks us to instead find the lowest nonce value which includes six leading-zeros.

```typescript
const part2 = (input: string): number => calcLowestNonce(input, 6);
```

Tweaking the `totalLeadingZero` argument to our `calcLowestNonce` function provides us with this answer 🌟.

By-design this problem is computational-hard to produce and requires forms of brute-force to be solved.
As such, there are no real optimisations that can be made - other than possibly designing a [Hardware ASIC miner](https://en.bitcoin.it/wiki/ASIC) for AdventCoin!
