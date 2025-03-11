---
layout: post
title: 'Advent of Code 2015 - Day 16 - Aunt Sue'
meta: 'Solving the Advent of Code 2015 Day 16 puzzle using TypeScript.'
tags: ['advent-of-code', 'advent-of-code-2015', 'typescript']
---

On the sixteenth day of Advent of Code 2015, we are tasked with working out which Aunt Sue (there are 500!?) sent us a gift, so we can send them a thank you card.

<!--more-->

## Part 1

For part one, we are provided with a list of all the Aunt Sues (identified 1-500) and _things_ that we remember about each one.
We have been gifted a _My First Crime Scene Analysis Machine_, so we are able to get readings from the provided wrapping paper.
To determine which Aunt Sue sent the gift, we must compare these readings with all the properties we know about them.

To begin, we parse the input into a form we can subsequently work with.

```typescript
type Aunt = { id: number; properties: { [name: string]: number } };

const parseAunts = (input: string): Aunt[] =>
  input.split('\n').map(line => ({
    id: toInt(line.match(/\d+/)[0]),
    properties: Object.fromEntries(
      [...line.matchAll(/(\w+): (\d+)/g)].map(([_, k, v]) => [
        k,
        toInt(v),
      ])
    ),
  }));
```

With each Aunt's properties now parsed, we move on to creating several number-based comparator [curried](https://en.wikipedia.org/wiki/Currying) functions, which will come in handy going forward.

```typescript
type Comparator = (value: number) => boolean;

const equalTo = (x: number): Comparator => (y: number) => x === y;
const lessThan = (x: number): Comparator => (y: number) => y < x;
const greaterThan = (x: number): Comparator => (y: number) => y > x;
```

In doing this, we are then able to provide the supplied reading and comparator logic to a function that will find the given Aunt who matches all these conditions.

```typescript
const findAuntWithReadings = (
  aunts: Aunt[],
  readings: { [name: string]: Comparator }
): Aunt =>
  aunts.find(({ properties }) =>
    Object.entries(properties).every(([k, v]) => readings[k](v))
  );
```

The function above iterates over all the supplied Aunts' properties and returns the first one that meets all the readings criteria.
For part one, we are asked to find the Aunt who matches the _exact_ reading values - supplying these readings to the function above returns the desired Aunt's identifier 🌟.

```typescript
const part1 = (input: string): number =>
  findAuntWithReadings(parseAunts(input), {
    children: equalTo(3),
    cats: equalTo(7),
    samoyeds: equalTo(2),
    pomeranians: equalTo(3),
    akitas: equalTo(0),
    vizslas: equalTo(0),
    goldfish: equalTo(5),
    trees: equalTo(3),
    cars: equalTo(2),
    perfumes: equalTo(1),
  }).id;
```

## Part 2

For part two, we are required to tweak the readings criteria and supply several greater/less-than comparators in place of the equality checks, as follows:

```typescript
const part2 = (input: string): number =>
  findAuntWithReadings(parseAunts(input), {
    children: equalTo(3),
    cats: greaterThan(7),
    samoyeds: equalTo(2),
    pomeranians: lessThan(3),
    akitas: equalTo(0),
    vizslas: equalTo(0),
    goldfish: lessThan(5),
    trees: greaterThan(3),
    cars: equalTo(2),
    perfumes: equalTo(1),
  }).id;
```

With these amendments made, we can use the same functions as implemented in part one to return the revised found Aunt's identifier 🌟.
