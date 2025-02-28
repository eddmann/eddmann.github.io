---
layout: post
title: 'Advent of Code 2016 - Day 9 - Explosives in Cyberspace'
meta: 'Solving the Advent of Code 2016 Day 9 puzzle using Python.'
tags: advent-of-code advent-of-code-2016 python
---

On the ninth day of Advent of Code 2016, we are asked to calculate the decompressed length of a file.

<!--more-->

## Part 1

We are supplied with a compressed file format as our input, of which we are required to calculate the decompressed length.
The format is structured as follows:

> The format compresses a sequence of characters.
> Whitespace is ignored.
> To indicate that some sequence should be repeated, a marker is added to the file, like (10x2).
> To decompress this marker, take the subsequent 10 characters and repeat them 2 times.
> Then, continue reading the file after the repeated data.
> The marker itself is not included in the decompressed output.

Based on these rules, we can now create a function that calculates the length based on a supplied file.

```python
def decompressed_length(file, acc):
    if not file:
        return 0

    marker = re.match(r"^\((\d+)x(\d+)\)", file)
    if marker:
        length, times = map(int, marker.groups())
        start, end = marker.end(), marker.end() + length
        return times * acc(file[start:end]) + decompressed_length(file[end:], acc)

    return 1 + decompressed_length(file[1:], acc)
```

The function above recursively decompresses the file, applying the provided accumulator function based on any markers it encounters.
Once the file has been exhausted, the function call stack will bubble up, and we will return the total decompressed file length.

Using the above implementation, we can supply the built-in `len` function as our accumulator to be applied upon the occurrence of markers.
In doing so, we will be returned with the desired answer 🌟.

```python
def part1(input):
    return decompressed_length(input, len)
```

## Part 2

For part two, we are required to expand upon part one's decompression implementation and cater for an _improved_ compression format.
In version two, the only difference is that markers within decompressed data are also decompressed.
So instead of simply computing the length of a marker sub-section, we are required to decompress this string as well.

Fortunately, as we supply how we wish to accumulate markers within the `decompressed_length` function, we can instead supply a means of recursively decompressing the file until we reach the final length.
With this new `recursive_len` function, we can now calculate the decompressed length again, returning the desired answer 🌟.

```python
def part2(input):
    def recursive_len(file):
        return decompressed_length(file, recursive_len)

    return decompressed_length(input, recursive_len)
```
