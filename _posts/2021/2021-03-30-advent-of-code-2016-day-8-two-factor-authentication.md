---
layout: post
title: 'Advent of Code 2016 - Day 8 - Two-Factor Authentication'
meta: 'Solving the Advent of Code 2016 Day 8 puzzle using Python.'
tags: advent-of-code advent-of-code-2016 python
---

On the eighth day of Advent of Code 2016, we are required to work out what a _smashed_ LCD screen would have displayed.

<!--more-->

## Part 1

The magnetic strip on the card we have _swiped_ encodes a series of instructions for the screen; these instructions are our puzzle input.
We are told that the screen is 50 pixels wide and 6 pixels tall, all of which begin in the off state.
For part one, we are required to work out how many pixels would be _lit_ based on applying the given instructions.

To begin, we will create a small function that will return a boolean two-dimensional matrix we can use to represent the LCD screen in code.

```python
def empty_screen(width=50, height=6):
    return [[False] * width for _ in range(height)]
```

From here, we can then go about building the logic surrounding the three operations that can be applied to the screen.

> `rect AxB` turns on all of the pixels in a rectangle at the top-left of the screen, which is A wide and B tall.

```python
def rect(screen, width, height):
    rect = [(x, y) for y in range(height) for x in range(width)]
    return [[(x, y) in rect or col for x, col in enumerate(row)]
            for y, row in enumerate(screen)]
```

> `rotate row y=A by B` shifts all of the pixels in row A (0 is the top row) right by B pixels.
> Pixels that would fall off the right end appear at the left end of the row.

```python
def rotate_row(screen, row_y, step):
    return [[screen[y][(x - step) % len(screen[row_y])] if y == row_y else col for x, col in enumerate(row)]
            for y, row in enumerate(screen)]
```

> `rotate column x=A by B` shifts all of the pixels in column A (0 is the left column) down by B pixels.
> Pixels that would fall off the bottom appear at the top of the column.

```python
def rotate_col(screen, col_x, step):
    return [[screen[(y - step) % len(screen)][col_x] if x == col_x else col for x, col in enumerate(row)]
            for y, row in enumerate(screen)]
```

Thanks to Python's list comprehension capabilities, we are able to represent this behaviour in an immutable fashion, passing in the current screen and being returned a new representation with the operation applied.
With these operations now available, we can create an `apply` function, which, based on an instruction string, delegates to the desired operation, passing in all provided arguments.

```python
def apply(screen, instruction):
    action, *args = re.match(
        r'(rect|rotate (?:r|c))[^\d]+(\d+)[^\d]+(\d+)', instruction).groups()
    args = map(int, args)

    if action == 'rect':
        return rect(screen, *args)
    if action == 'rotate r':
        return rotate_row(screen, *args)
    if action == 'rotate c':
        return rotate_col(screen, *args)

    raise Exception('Unable to handle {}'.format(action))
```

Given that we now have the ability to apply a single operation on a screen input, we can expand upon this with a _reduction_ and reduce the instruction listing down to the final screen output.
With this screen output, we can then tally up all the pixels that are _lit_ (i.e., `True`) and return the desired answer 🌟.

```python
def part1(input):
    screen = reduce(apply, input.splitlines(), empty_screen())
    return sum(c for r in screen for c in r)
```

## Part 2

For part two, we are required to display and interpret the code that is present within the final screen output we produced in part one.
Thanks again to Python's list comprehensions, this is a trivial exercise, allowing us to represent _lit_ pixels as `#` and _off_ as `.`.
When we display this output within the terminal, we can see the code that the screen is trying to display 🌟.

```python
def part2(input):
    screen = reduce(apply, input.splitlines(), empty_screen())
    return '\n'.join(''.join('#' if c else '.' for c in r) for r in screen)
```

I really enjoyed today's problem, especially the surprise in part two where we were able to see the code being displayed.
