---
layout: post
title: 'Advent of Code 2016 - Day 6 - Signals and Noise'
meta: 'Solving the Advent of Code 2016 Day 6 puzzle using Python.'
tags: advent-of-code advent-of-code-2016 python
---

On the sixth day of Advent of Code 2016, we are required to determine the error-corrected message that is being sent to Santa.

<!--more-->

## Part 1

Based on the message signal provided (our input), we can determine the error-corrected message by identifying the most frequent character for each position.
Using a _one-liner_, we can decode the correct message and return this as our desired answer 🌟.

```python
def part1(input):
    return ''.join(Counter(col).most_common()[0][0]
                   for col in zip(*input.splitlines()))
```

This solution highlights the power of Python's list comprehension and standard library, transposing the message characters and using the `Counter` collection to tally their frequencies.

## Part 2

For part two, we are instead required to use a _modified repetition code_, taking the least common occurrence per character position.
Thanks to the `Counter` collection again, we can trivially modify the occurrence being extracted (now the least common) and return it in a similar fashion 🌟.

```python
def part2(input):
    return ''.join(Counter(col).most_common()[-1][0]
                   for col in zip(*input.splitlines()))
```

I really do not feel you could be more expressive and concise in a solution than how we have been able to model today's problem in Python.
