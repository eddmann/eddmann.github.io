---
layout: post
title: 'Advent of Code 2015 - Day 2 - I Was Told There Would Be No Math'
meta: 'Solving the Advent of Code 2015 Day 2 puzzle using TypeScript.'
tags: advent-of-code advent-of-code-2015 typescript
---

The second day of Advent of Code 2015 brings us a small maths problem by way of Elves _running low_ on wrapping paper.
With the present dimensions (perfect right rectangular prisms) provided, we are to answer several related questions.

<!--more-->

## Part 1

Based on the supplied present dimensions, we are required to calculate how many square feet of wrapping paper should be ordered to wrap these presents.
We are also asked to include _a little extra_ (the area of the smallest side) per present.

Similar to Day 1, we will start off by parsing the provided input, this time into tuples.

```typescript
type PresentDimensions = [length: number, width: number, height: number];

const parsePresentDimensions = (input: string): PresentDimensions[] =>
  input
    .split('\n')
    .map(line => line.split('x').map(toInt) as PresentDimensions);
```

I have decided to be a little more relaxed with my parsing validation this time around, instead opting to assume that each input line will be of the correct form.
This allows me to just map over the resulting split, converting each dimension into an integer using a small helper method.

With the input now parsed, we can go about calculating how much wrapping paper we will require.

```typescript
const part1 = (input: string): number =>
  parsePresentDimensions(input)
    .map(([l, w, h]) => {
      const area = [l * w, w * h, h * l];
      return 2 * area.reduce(sum) + Math.min(...area);
    })
    .reduce(sum);
```

Mapping over each of the dimensions, we are able to calculate how much wrapping paper is required (the surface area) per present, including the desired additional extra paper.
With this mapped result, we can then sum these together (using another helper method I have included to help aid clarity in the solutions) to produce the desired answer 🌟.
We could have alternatively achieved this with a single _reduce_, but I opted for the initial _map_ for readability.

## Part 2

With the same input, we are now instead asked to determine the total feet of ribbon the Elves should order to tie and bow a ribbon around all the provided presents.
The total feet required per present is equal to the cubic feet of volume of the given dimensions.

```typescript
const part2 = (input: string): number =>
  parsePresentDimensions(input)
    .map(dimensions => {
      const [x, y] = dimensions.sort((a, b) => a - b);
      return 2 * (x + y) + dimensions.reduce(product);
    })
    .reduce(sum);
```

Using a similar _map_, we are able to calculate the required ribbon per present and then _reduce_ this into the total sum required 🌟.

Alternatively, as there are three dimensions and we wish to find the sum of the smallest two, we can add all the dimensions together and subtract the maximum dimension value.

```typescript
const part2 = (input: string): number =>
  parsePresentDimensions(input)
    .map(d => 2 * (d.reduce(sum) - Math.max(...d)) + d.reduce(product))
    .reduce(sum);
```

This removes the need to perform the sort and produces a succinct one-liner.
