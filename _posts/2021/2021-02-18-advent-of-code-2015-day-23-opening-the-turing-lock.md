---
layout: post
title: 'Advent of Code 2015 - Day 23 - Opening the Turing Lock'
meta: 'Solving the Advent of Code 2015 Day 23 puzzle using TypeScript'
tags: advent-of-code advent-of-code-2015 typescript
---

On the twenty third day of Advent of Code 2015 we are asked to help 'Little Jane Marie' run a program on a computer she got for Christmas.

<!--more-->

## Part 1

The computer has two registers (_a_ and _b_), along with six different instructions.
For part one we are asked to execute the provided program and determine what the value of the _b_ register will be after the termination.
To begin, we will parse the provided input instruction listing into a form we can process going forward.

```typescript
const registers = ['a', 'b'] as const;
type Register = typeof registers[number];
type Registers = { [R in Register]: number };

type Instruction =
  | { op: 'hlf' | 'tpl' | 'inc'; register: Register }
  | { op: 'jie' | 'jio'; register: Register; offset: number }
  | { op: 'jmp'; offset: number };
```

We start by modeling the `Instruction` and `Registers` as types within TypeScript.
This provides an additional level of safety around building the solution.
From here, we can validate and parse the provided input like so.

```typescript
const isRegister = (input: string): input is Register =>
  registers.includes(input as Register);

const parseInstructions = (input: string): Instruction[] =>
  input.split('\n').map(line => {
    const [op, ...args] = line.replace(',', '').split(' ');

    switch (op) {
      case 'hlf':
      case 'tpl':
      case 'inc':
        if (!isRegister(args[0])) throw new Error(`Unknown register ${args[0]}`);
        return { op, register: args[0] };
      case 'jie':
      case 'jio':
        if (!isRegister(args[0])) throw new Error(`Unknown register ${args[0]}`);
        return { op, register: args[0], offset: toInt(args[1]) };
      case 'jmp':
        return { op, offset: toInt(args[0]) };
      default:
        throw new Error(`Unknown instruction ${op}`);
    }
  });
```

In doing this we have guaranteed at a runtime and type-level that the parsed input is of the given types.
With the instruction now available we can go about implementing the _computer_ itself.

```typescript
const execute = (
  instructions: Instruction[],
  registers: Registers
): Registers => {
  let pointer = 0;

  while (pointer < instructions.length) {
    const ins = instructions[pointer];

    switch (ins.op) {
      case 'hlf':
        registers[ins.register] /= 2;
        pointer += 1;
        break;
      case 'tpl':
        registers[ins.register] *= 3;
        pointer += 1;
        break;
      case 'inc':
        registers[ins.register] += 1;
        pointer += 1;
        break;
      case 'jie':
        pointer += registers[ins.register] % 2 === 0 ? ins.offset : 1;
        break;
      case 'jio':
        pointer += registers[ins.register] === 1 ? ins.offset : 1;
        break;
      case 'jmp':
        pointer += ins.offset;
        break;
      default:
        const unhandled: never = ins;
        throw new Error(`Unhandled instruction`);
    }
  }

  return registers;
};
```

I opted for a stateful loop approach which maps each of the given operations to an associated action.
Thanks to [exhaustive type-checking](https://dev.to/babak/exhaustive-type-checking-with-typescript-4l3f) within the `switch` construct, we are able to be sure that all possible operations have been catered for.
With the ability to now parse and execute the given program we can go about answering part one 🌟.

```typescript
const part1 = (input: string): number =>
  execute(parseInstructions(input), { a: 0, b: 0 }).b;
```

## Part 2

For part two we are required to revise the initial _a_ register value to 1, and then return the _b_ value again.
This can be done with a single modification, and upon execution we have the desired answer we are looking for 🌟.

```typescript
const part2 = (input: string): number =>
  execute(parseInstructions(input), { a: 1, b: 0 }).b;
```
