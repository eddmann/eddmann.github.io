---
layout: post
title: 'Advent of Code 2016 - Day 6 - Signals and Noise'
meta: 'Solving the Advent of Code 2016 Day 6 puzzle using Python'
---

On the sixth day of Advent of Code 2016 we are required to work what the error-corrected message is attempted to be sent to Santa.

<!--more-->

### Part 1

Based on the message signal provided (our input), we can work out the error-corrected message being sent by finding the most frequent character for each position.
In a _one-liner_ we are able to decode the correct message and return this as our desired answer 🌟.

```python
def part1(input):
    return ''.join(Counter(col).most_common()[0][0]
                   for col in zip(*input.splitlines()))
```

This solution highlights how powerful Python's list comprehension and standard library is, transposing the message characters and using the Counter collection again to tally up their frequencies.

### Part 2

For part two, we are instead required to use a _modified repetition code_, taking the least common occurrence per character position.
Thanks to the Counter collection again, we can trivially modify the occurrence being plucked out (now the least common) and return in a similar fashion 🌟.

```python
def part2(input):
    return ''.join(Counter(col).most_common()[-1][0]
                   for col in zip(*input.splitlines()))
```

I really do not feel you could be more expressive and consise in a solution than how we have been able to model today's problem in Python.
