---
layout: post
title: 'Advent of Code 2015 - Day 6 - Probably a Fire Hazard'
meta: 'Solving the Advent of Code 2015 Day 6 puzzle using TypeScript.'
tags: ['advent-of-code', 'advent-of-code-2015', 'typescript']
---

On the sixth day of Advent of Code 2015, we are tasked with trying to win the holiday house decorating contest - by designing the best light sequence 💡.

<!--more-->

## Part 1

We are first told that the lights are configured in a _1000x1000 grid_ and that, based on instructions that Santa has provided, we should operate each light in different ways.
Like before, we start off by parsing the provided instructions (actions and grid position ranges) into a form we can enact going forward.

```typescript
type Light = { row: number; col: number };
type Range = { from: Light; to: Light };
enum Action {
  On,
  Off,
  Toggle,
}
type Instruction = [Action, Range];

const parseInstructions = (input: string): Instruction[] =>
  input.split('\n').map(line => {
    const [, action, fr, fc, tr, tc] = line.match(
      /(.+) (\d+),(\d+) through (\d+),(\d+)/
    );
    return [
      action === 'turn on'
        ? Action.On
        : action === 'turn off'
        ? Action.Off
        : Action.Toggle,
      {
        from: { row: toInt(fr), col: toInt(fc) },
        to: { row: toInt(tr), col: toInt(tc) },
      },
    ];
  });
```

We initially define a couple of types to help map the domain problem into our code solution.
Using a Regular Expression, we are able to translate every instruction line into the given action and grid position range (`from`, `to`).
I have opted for using a ternary operator in such a way that it can provide three choices.
I would usually shy away from doing this in _professional code_ due to readability and possible errors.

With the instructions now parsed, we can look into solving the first part of today's problem.
For this, we will be using a two-dimensional array, which I have decided to define as a generic function for creation in both parts.
Providing the size and default value allows us to build a type-safe array, which the client can then use.

```typescript
const create2DArray = <T>(rows: number, cols: number, defaultValue: T): T[][] =>
  Array.from(Array(rows), () => Array(cols).fill(defaultValue));
```

Based on the three actions (`On`, `Off`, and `Toggle`), we are required to iterate through the instructions and manipulate the specified lights (based on a given range) using a double `for` loop like so:

```typescript
const part1 = (input: string): number => {
  const lights = create2DArray(1000, 1000, false);

  for (const [action, { from, to }] of parseInstructions(input)) {
    for (let row = from.row; row <= to.row; row++) {
      for (let col = from.col; col <= to.col; col++) {
        lights[row][col] =
          action === Action.On
            ? true
            : action === Action.Off
            ? false
            : !lights[row][col];
      }
    }
  }

  return lights.flat().filter(Boolean).length;
};
```

Once we have followed the instructions, we can flatten the two-dimensional array into a single dimension and tally up all the lights that are still lit to reach the desired answer 🌟.

Alternatively, we could replace the two-dimensional array with a more performant [`UInt8Array`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Uint8Array) one-dimensional array.
In doing so, we lose the ability to express the light state as a `Boolean` and instead map these states to `1` or `0` accordingly.

```typescript
const part1 = (input: string): number => {
  const lights = new Uint8Array(1000 * 1000);

  for (const [action, { from, to }] of parseInstructions(input)) {
    for (let row = from.row; row <= to.row; row++) {
      for (let col = from.col; col <= to.col; col++) {
        lights[1000 * row + col] =
          action === Action.On
            ? 1
            : action === Action.Off
            ? 0
            : 1 - lights[1000 * row + col];
      }
    }
  }

  return lights.reduce(sum);
};
```

Accessing the desired row and column is now achieved using a small formula `1000 * row + col`.
To toggle the light state, we use the `1 - n` trick to flip the state between `1` and `0`.
Finally, we can sum up all the lights that are on with a single reduction, thanks to the values we are now storing (integers) and using a one-dimensional array.

## Part 2

In part two, we are required to iterate through the provided instructions again, but instead of just turning the light on or off, we now control their brightness.
As such, we now wish to store integer values in our two-dimensional array.
Thanks to the help of [Generics](https://www.typescriptlang.org/docs/handbook/generics.html) and the supplied default value, this is made type-safe.

```typescript
const part2 = (input: string): number => {
  const lights = create2DArray(1000, 1000, 0);

  for (const [action, { from, to }] of parseInstructions(input)) {
    for (let row = from.row; row <= to.row; row++) {
      for (let col = from.col; col <= to.col; col++) {
        lights[row][col] = Math.max(
          0,
          lights[row][col] +
            (action === Action.On ? 1 : action === Action.Off ? -1 : 2)
        );
      }
    }
  }

  return lights.flat().reduce(sum);
};
```

Following a very similar form to part one, the only code that has really changed is the action we wish to enact based on the given instruction's light range.
Having iterated through the provided instructions, we can again flatten the grid and return the light brightness sum to reach our desired answer 🌟.

Following suit with part one's alternative implementation, we can again opt to use a `Uint8Array` instead and use a small mathematical formula to locate a given row and column.

```typescript
const part2 = (input: string): number => {
  const lights = new Uint8Array(1000 * 1000);

  for (const [action, { from, to }] of parseInstructions(input)) {
    for (let row = from.row; row <= to.row; row++) {
      for (let col = from.col; col <= to.col; col++) {
        lights[1000 * row + col] = Math.max(
          0,
          lights[1000 * row + col] +
            (action === Action.On ? 1 : action === Action.Off ? -1 : 2)
        );
      }
    }
  }

  return lights.reduce(sum);
};
```

The benefits of using this approach are for performance, as the interpreter is able to determine the type and size of the array up-front.
In the case of the two-dimensional array, we produce this array somewhat dynamically, and the engine is not able to be sure of what exact type we will be storing throughout its lifetime (as JavaScript arrays are heterogeneous).

Upon review, due to how similar both part one and two were, we could have possibly distilled the logic for iterating through an instruction set and applying a given action into a more generalised higher-order function.
In doing so, it could have abstracted away how we stored the lighting grid and how we produced the desired resulting sum.
As the callee, we could then just supply different actions (possibly of the type `(Light) => Light`) to form the basis of each part's concrete solution.
