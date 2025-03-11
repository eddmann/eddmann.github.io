---
layout: post
title: 'Advent of Code 2016 - Day 1 - No Time for a Taxicab'
meta: 'Solving the Advent of Code 2016 Day 1 puzzle using Python.'
tags: ['advent-of-code', 'advent-of-code-2016', 'python']
---

Having enjoyed documenting my progress in completing the Advent of Code 2015 advent calendar in TypeScript, I have decided to do the same for 2016.
However, for this year, I wish to instead explore Python.

<!--more-->

I have decided on Python as I've been very impressed with how concise and expressive some of the solutions for the 2015 calendar I have seen on the AoC subreddit have been.

## Part 1

The initial problem for the 2016 calendar requires us to navigate our way from our 'airdropped' location to Easter Bunny HQ.
In doing so, we are required to work out how many blocks away the location is (using [Manhattan distance](https://en.wikipedia.org/wiki/Taxicab_geometry)).

We begin by parsing the provided directions into tuples of the form `(direction, steps)`.

```python
def parse_instructions(input):
    return [[i[0], int(i[1:])] for i in input.split(', ')]
```

With the instructions now parsed, we can (from our starting position of `0,0`) navigate our way to the final destination.

```python
COMPASS = [(0, 1), (1, 0), (0, -1), (-1, 0)]


def part1(input):
    dir = 0
    pos = (0, 0)

    for turn, steps in parse_instructions(input):
        dir = (dir + (1 if turn == 'R' else -1)) % len(COMPASS)
        pos = tuple(map(lambda p, d: p + d * steps, pos, COMPASS[dir]))

    return sum(map(abs, pos))
```

We are able to calculate the revised directional coordinates that need to be applied to the current position upon each instruction using the provided `COMPASS` lookup table.
Once we have applied all the moves, we return the _Manhattan distance_ of the final position to get the desired answer 🌟.

## Part 2

For part two, we are required to instead work out the first position that we visit twice.
This can be achieved by storing the _seen_ positions within a set and short-circuiting the instruction application upon seeing a position again 🌟.

```python
def part2(input):
    dir = 0
    pos = (0, 0)
    seen = {pos}

    for turn, steps in parse_instructions(input):
        dir = (dir + (1 if turn == 'R' else -1)) % len(COMPASS)
        for _ in range(steps):
            pos = tuple(map(operator.add, pos, COMPASS[dir]))
            if pos in seen:
                return sum(map(abs, pos))
            seen.add(pos)

    raise Exception('No repeated position')
```

## Alternative Solutions

Like the 2015 calendar, I found that for the first couple of day's solutions, I had the time to devise several different ways to solve the problem.

Having a chance to explore the Python standard library, I was able to take advantage of [_Deque_](https://docs.python.org/3/library/collections.html#collections.deque), which is a double-ended queue implementation.
This allows me to efficiently [_rotate_](https://docs.python.org/3/library/collections.html#collections.deque.rotate) the queued items in a very succinct manner.

```python
def part1(input):
    dir = collections.deque([(0, 1), (1, 0), (0, -1), (-1, 0)])
    pos = (0, 0)

    for turn, steps in parse_instructions(input):
        dir.rotate(1 if turn == 'R' else -1)
        pos = tuple(map(lambda p, d: p + d * steps, pos, dir[0]))

    return sum(map(abs, pos))
```

Having explored storing the positional state (x and y coordinates) in tuples several times, I was very excited to see that instead, we could take advantage of [Complex numbers](https://docs.python.org/3/library/cmath.html) and model them in this form.
Using this method, we were able to move away from the directional lookup table concept and instead just apply left and right rotations using multiplication directly.

```python
TURNS = {'R': 0+1j, 'L': 0-1j}


def manhattan_distance(pos):
    return abs(int(pos.real)) + abs(int(pos.imag))


def part1(input):
    dir = 1+0j
    pos = 0+0j

    for turn, steps in parse_instructions(input):
        dir *= TURNS[turn]
        pos += dir * steps

    return manhattan_distance(pos)
```

This is by far my favourite way to solve this problem, as it highlights some of the powerful features that Python has to offer.
I look forward to continuing my journey in solving the 2016 calendar in future posts.
