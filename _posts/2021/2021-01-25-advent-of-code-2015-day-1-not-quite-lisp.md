---
layout: post
title: 'Advent of Code 2015 - Day 1 - Not Quite Lisp'
meta: 'Solving the Advent of Code 2015 Day 1 puzzle using TypeScript'
---

This past Decemeber a [fellow colleague](https://github.com/tomcant) introduced us to [Advent of Code](https://adventofcode.com/).
What initially started out as completing each daily 2020 puzzle _in my own time_ soon turned into a daily obession, and in-turn an incredible learning experience shared amongst the team.

Having completed the 2020 calendar at the end of last year, over the past couple of weeks we have began working through the previous calendars.
Over the coming months I hope to record each of my solutions, with the goal of completing all the previous puzzles just-in-time for the 2021 calendar to commence.

<!--more-->

### Part 1

And so the journey begins...

The first part of todays puzzle centres around determining what floor Santa will be on based on following the supplied directions.
Parsing the input is trivial, but as we have the power of TypeScript behind us we can also provide an element of type-safetly.

```typescript
enum Direction {
  Up = '(',
  Down = ')',
}

const parseDirections = (input: string): Direction[] =>
  [...input].filter((d: string): d is Direction =>
    Object.values(Direction).includes(d as Direction)
  );
```

In this instance we simply remove any invalid directions that do not conform to our expected input.
Alternatively, we could have thrown an exception so as to not silently ignore invalid input.

With the input now parsed into an excpected form we can go about determining which floor Santa will land up on.

```typescript
const part1 = (input: string): number =>
  parseDirections(input).reduce(
    (floor, direction) => floor + (direction === Direction.Up ? 1 : -1),
    0
  );
```

This can be achieved using a single reduction which keeps track of what floor Santa is currently on.
Once we have reduced over all the directions we can return the resulting floor 🌟.

Upon reflection of my initial solution I noticed that this could be simplied into just subtracting the total _Down_ directions from the _Up_ directions.
Opting for the `split` method over the `RegExp` method to count occurrences you would usually be required to decrement the result by one to get the correct answer. However, using the same method for both cancels this out for the final answer.

```typescript
const part1 = (input: string): number =>
  input.split('(').length - input.split(')').length;
```

### Part 2

In the second part of todays puzzle we are asked to answer a different question based on same supplied input.
We are now required to work out at which directions position (one-indexed) that Santa first enters the Basement (`-1`).

```typescript
const part2 = (input: string): number => {
  let floor = 0;

  for (const [position, direction] of parseDirections(input).entries()) {
    floor += direction === Direction.Up ? 1 : -1;
    if (floor < 0) return position + 1;
  }

  throw new Error('Santa never enters the basement');
};
```

To solve this problem I opted to replace the reduction with a conventional _for loop_ which allows us to return the first time we see Santa enter the basement (negative floor value).
As the array index supplied by `Array.prototype.entries()` is zero-indexed we are required to increment this value by one to produce the desired position 🌟.
