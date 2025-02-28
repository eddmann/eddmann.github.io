---
layout: post
title: 'Advent of Code 2015 - Day 3 - Perfectly Spherical Houses in a Vacuum'
meta: 'Solving the Advent of Code 2015 Day 3 puzzle using TypeScript'
tags: advent-of-code advent-of-code-2015 typescript
---

On the third day of Advent of Code 2015 we are asked to help determine (based on supplied directions) how many houses Santa (and Robo-Santa) will deliver presents to.

<!--more-->

## Part 1

Based on a directional system that caters for _north (^), south (v), east (>), or west (<)_ we are asked to navigate our way between houses (on a two-dimensional grid) recording how many receive presents along the way.
The first step is to parse the input data into a type-safe form.

```typescript
const directions = ['^', 'v', '<', '>'] as const;
type Direction = typeof directions[number];

const parseDirections = (input: string): Direction[] =>
  [...input].filter((d: Direction): d is Direction => directions.includes(d));
```

This filters out any invalid direction ensuring that the resulting values are within the defined `Direction` union-type.
Like before, we could have alternatively provided more stricter parsing rules and thrown an exception upon an invalid direction occurrence - but for this input the provided behaviour will suffice.

From here, we create a small function which iterates through the provided directions, storing each house `Position` (represented as X-Y coordinate tuples) encountered along the way.

```typescript
type Position = [x: number, y: number];
const coordinates: { [K in Direction]: Position } = {
  '^': [1, 0],
  v: [-1, 0],
  '>': [0, 1],
  '<': [0, -1],
};

const deliverPresents = (directions: Direction[]): CompoundSet<Position> => {
  let current: Position = [0, 0];
  const houses = new CompoundSet<Position>([current]);

  for (const direction of directions) {
    const [x, y] = current;
    const [dx, dy] = coordinates[direction];
    houses.add((current = [x + dx, y + dy]));
  }

  return houses;
};
```

We are only interested in the presence of a house being visited as opposed to how many times we encounter said house, which lends itself well to the Set data-structure.
JavaScript does support storing compound data-types (such as `Position`) in a native Set, however, equality is based on reference as opposed to value semantics.
In many circumstances (such as this one) this is not the behaviour we desire, instead favouring equality based on value.
There is a propsal in JavaScript to add [Records and Tuples](https://github.com/tc39/proposal-record-tuple) to the language, but until this is made available I decided to create a [small `CompoundSet` implementation](https://eddmann.com/posts/implementing-a-compound-set-in-typescript/) which catered for this need.

To answer part one we can now invoke this function, returning the resulting Sets' size 🌟.

```typescript
const part1 = (input: string): number =>
  deliverPresents(parseDirections(input)).size;
```

## Part 2

In part two we are now asked to tally the total number of houses Santa and Robo-Santa would deliver presents too based on the supplied directions.
In this instance the input directions are split (odd/even) between Santa and Robo-Santa.

```typescript
const part2 = (input: string): number => {
  const directions = parseDirections(input);

  const santa = directions.filter((_, i) => i % 2 === 0);
  const robot = directions.filter((_, i) => i % 2 === 1);

  return new CompoundSet([...deliverPresents(santa), ...deliverPresents(robot)])
    .size;
};
```

To answer part two I opted to initially split the directions into the two seperate sub-direction listings.
This was easy to do with a filter as we are provided the current index position as the second argument within JavaScript.
The sub-problems have now taken the same shape as part one, and as such, we can use the above function again to determine which houses are delivered presents.
Finally, we merge the sub-problems back together producing the union set to determine the total size 🌟.
