---
layout: post
title: 'Advent of Code 2016 - Day 2 - Bathroom Security'
meta: 'Solving the Advent of Code 2016 Day 2 puzzle using Python'
tags: advent-of-code advent-of-code-2016 python
---

On the second day of Advent of Code 2016 we are asked to work out what a bathroom code is based on the supplied instructions.

<!--more-->

### Part 1

For part one we are required to follow our input (instructions _UDLR_ per keycode) based on a _3x3 1-9_ keypad.
We begin by generating a dictionary lookup of the supplied keypad based on _x, y_ cordinates to their related key.
In a similiar mannor to how we used Complex numbers to represent x, y coordinates in the previous solution, we will be doing the same here.

```python
def generate_keypad(input):
    return {complex(x, y): key
            for y, line in enumerate(input.splitlines())
            for x, key in enumerate(line.split())
            if key != '.'}
```

So as to correctly handle any intentional whitespace going forward we will represent this intent using a `.`.
From here, we can then create a function which will take in the keypad, along with the initial key position and instructions and return the resulting keycode.

```python
DIRECTIONS = {'U': 0+-1j, 'D': 0+1j, 'L': -1+0j, 'R': 1+0j}


def calc_keycode(keypad, initial_key, instructions):
    pos = next(pos for pos, key in keypad.items() if key == initial_key)
    code = ''

    for instruction in instructions:
        for direction in instruction:
            if ((next_pos := pos + DIRECTIONS[direction]) in keypad):
                pos = next_pos
        code += keypad[pos]

    return code
```

Using an [assignment expression](https://www.python.org/dev/peps/pep-0572/) we are able to succinctly express that we only wish to apply positional moves that are within the supplied keypad bounds.
Once we have exhausted the given code instructions directions we append this to the resulting code.
Finally, we return the complete code to the callee.

With these building block in-place we can compose them together to produce the desired answer 🌟.

```python
def part1(input):
    keypad = generate_keypad("""1 2 3
                                4 5 6
                                7 8 9""")

    return calc_keycode(keypad, initial_key="5", instructions=input.splitlines())
```

### Part 2

For part two we are required to instead discern what the keycode will be based on a revised keypad.
Fortunatly, based on the building blocks we already have in-place we can simply update the `generate_keypad` argument.
In doing so we produce the answer we desire to complete part two 🌟.

```python
def part2(input):
    keypad = generate_keypad(""". . 1 . .
                                . 2 3 4 .
                                5 6 7 8 9
                                . A B C .
                                . . D . .""")

    return calc_keycode(keypad, initial_key="5", instructions=input.splitlines())
```

### Alternative Solution

Instead of representing the coordinate as a Complex number, I additionally explored creating a more aptly modelled value object which managed this state in an immutable manor.
Using [Data Classes](https://docs.python.org/3/library/dataclasses.html) and the `__add__` dunder method I was able to design the following:

```python
@dataclass(frozen=True)
class Point2D:
    x: int
    y: int

    def __add__(self, other):
        if not isinstance(other, Point2D):
            return NotImplemented
        return Point2D(self.x + other.x, self.y + other.y)
```

The only other aspects of the original solution that required modification were in the instantiation of these objects.

```python
DIRECTIONS = {'U': Point2D(0, -1), 'D': Point2D(0, 1),
              'L': Point2D(-1, 0), 'R': Point2D(1, 0)}


def generate_keypad(input):
    return {Point2D(x, y): key
            for y, line in enumerate(input.splitlines())
            for x, key in enumerate(line.split())
            if key != '.'}
```

Providing such a model is preferred over _piggy-backing_ on Complex numbers, as this clearly expresses its purpose and intent.
