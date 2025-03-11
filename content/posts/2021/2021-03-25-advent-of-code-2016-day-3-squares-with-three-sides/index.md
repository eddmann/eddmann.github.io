---
layout: post
title: 'Advent of Code 2016 - Day 3 - Squares With Three Sides'
meta: 'Solving the Advent of Code 2016 Day 3 puzzle using Python.'
tags: ['advent-of-code', 'advent-of-code-2016', 'python']
---

On the third day of Advent of Code 2016, we are asked to work out how many valid triangles are present in a given listing.

<!--more-->

## Part 1

Our input consists of a listing of triplets, of which we are initially asked to tally how many triplets are valid triangles.
We begin by parsing the input, ensuring that all triplets have been parsed into integer form.

```python
def parse_triplets(input):
    return [[int(n) for n in line.split()] for line in input.splitlines()]
```

From here, we now can discern how to identify a valid triangle.
This can be achieved by validating that the sum of any two sides must be larger than the remaining side.
We can simplify any conditional logic required by sorting the triplet values first and then checking that the two smallest values are greater than the largest value.

```python
def is_triangle(triplet):
    a, b, c = sorted(triplet)
    return a + b > c
```

To answer part one, we can combine these two functions using list comprehension and sum up the `True` values 🌟.

```python
def part1(input):
    return sum(is_triangle(triplet) for triplet in parse_triplets(input))
```

## Part 2

For part two, we are now instead required to interpret the input in a different form.
Triplets are now grouped based on transposing (flipping the rows and columns) of the listing.

To complete this task, we will need a means to split up a flat listing into triplets.
Combining `range`, list slicing, and subsequently yielding each _chunk_ is a very succinct means to achieve this result.

```python
def chunks(l, n):
    for i in range(0, len(l), n):
        yield l[i:i + n]
```

With this new function available, we can transpose the parsed triplets (using `zip`) and _flatten_ each available column triplet chunk.
This leaves us with a single-level listing (the same form as our input), from which we can validate if the triplets are indeed triangles.
In a similar manner to part one, we can sum up the `True` values and return the desired answer 🌟.

```python
def part2(input):
    return sum(is_triangle(triplet)
               for col in zip(*parse_triplets(input))
               for triplet in chunks(col, 3))
```
