---
layout: post
title: 'Advent of Code 2015 - Day 7 - Some Assembly Required'
meta: 'Solving the Advent of Code 2015 Day 7 puzzle using TypeScript.'
tags: ['advent-of-code', 'advent-of-code-2015', 'typescript']
---

On the seventh day of Advent of Code 2015, we are tasked with helping little Bobby Tables assemble a circuit (wires and bitwise logic gates) that Santa brought him for Christmas.

<!--more-->

## Part 1

Our input is an instruction booklet that describes how to connect these parts together.
By following the instructions laid out in the booklet, we are asked to determine what signal is ultimately provided to wire `a`.
As before, we will start by parsing the input into a usable form within our solution.

```typescript
type Wire = string;
type Instruction = string;
type Circuit = Map<Wire, Instruction>;

const parseCircuit = (input: string): Circuit =>
  input.split('\n').reduce((circuit, line) => {
    const [instruction, wire] = line.split(' -> ');
    return circuit.set(wire, instruction);
  }, new Map());
```

The parser above converts the instruction listing into a `Circuit` mapping between the defined `Wire` and associated actionable `Instruction` (i.e. bitwise operation, assignment).
With the input now parsed, we can move on to working out how we wish to emulate this circuit and record the outputted signals.
Reviewing the input leads us to the conclusion that we cannot expect the instructions to be in dependency order like the provided example is - i.e. `b` is declared and assigned almost at the end of the listing but is referenced many times before this.
Taking this on board, and as we only wish to determine what a single wire signal is, my initial solution is to begin at wire `a`'s instruction and recursively build up the resulting signal.
This approach caters for the unsorted ordering and only performs the instructions required to answer the question.

```typescript
const getEmulatedSignal = (circuit: Circuit, wire: Wire): number => {
  const emulate = memoize((wire: Wire): number => {
    if (/^(\d)+$/.test(wire)) {
      return toInt(wire);
    }

    const instruction = circuit.get(wire).split(' ');

    switch (true) {
      case instruction.includes('AND'):
        return emulate(instruction[0]) & emulate(instruction[2]);
      case instruction.includes('OR'):
        return emulate(instruction[0]) | emulate(instruction[2]);
      case instruction.includes('LSHIFT'):
        return emulate(instruction[0]) << emulate(instruction[2]);
      case instruction.includes('RSHIFT'):
        return emulate(instruction[0]) >> emulate(instruction[2]);
      case instruction.includes('NOT'):
        return ~emulate(instruction[1]) & 0xffff;
      default:
        return emulate(instruction[0]);
    }
  });

  return emulate(wire);
};
```

Based on the currently supplied wire identifier, we provide a base case asserting that if the string value is a number, we simply return the integer equivalent.
All instructions laid out will eventually hit this base case, ensuring that the recursion will stop and the call stack tails can be evaluated.
Upon experimenting with this approach, I noticed that performance was a significant issue when attempting to run this on the actual input instruction booklet.
Due to naively recursing over all instructions, previously evaluated instructions would be unnecessarily recalculated multiple times down different branches.
To resolve this, I employed a small generic [memoization](https://en.wikipedia.org/wiki/Memoization) function, which wrapped the closure and opaquely provided a caching mechanism for subsequent calls to the same resolved wire signal.

You will also notice the use of a `0xffff` mask when applying the _NOT_ operation on the value.
As explained in the problem statement, the signals are unsigned 16-bit values; however, JavaScript bitwise operators use 32 bits.
To produce the desired results, we must apply the 16-bit mask provided.

```typescript
const part1 = (input: string): number =>
  getEmulatedSignal(parseCircuit(input), 'a');
```

With the logic in place, we can combine the two functions and determine the resulting signal from wire `a` 🌟.

## Part 2

For part two, we are required to replace the original input's wire `b` value with the resulting signal that we emulated in part one for wire `a`.
From this, we are then asked to determine the new resulting signal for wire `a`.

```typescript
const part2 = (input: string): number => {
  const circuit = parseCircuit(input);
  circuit.set('b', getEmulatedSignal(circuit, 'a').toString());
  return getEmulatedSignal(circuit, 'a');
};
```

By modifying the parsed circuit mapping before getting the newly emulated signal, we obtain the desired answer 🌟.

## Alternative Solution

Since solving this problem, I re-evaluated the provided input and noticed that it did not include any [circular dependencies](https://en.wikipedia.org/wiki/Circular_dependency)!
As such, it could be treated as a [Directed Acyclic Graph](https://en.wikipedia.org/wiki/Directed_acyclic_graph) (DAG), which would allow us to perform a [Topological Sort](https://en.wikipedia.org/wiki/Topological_sorting) to return the correctly ordered instruction listing.
This would allow us to emulate the circuit without the need for recursion.
I set out to re-implement the solution using this newfound knowledge and approach.

I began by creating the function below, which parses the instruction listing in a very different manner than before.
Instead of simply returning the parsed instructions in an unordered map back to the callee, this function returns an array of the _correctly_ ordered instruction execution.
Correctness, in this case, means that all required wire signal values will have already been emulated before attempting to evaluate the given wire instruction.
As such, we can just iterate through the instruction listing once to return the entire signal value outputs.

```typescript
type Wire = string;
type Instruction = string[];

const createInstructionExecutionOrder = (
  input: string
): [Wire, Instruction][] => {
  const dependencies = new Map<Wire, Wire[]>();
  const instructions = new Map<Wire, Instruction>();

  for (const line of input.split('\n')) {
    const [instruction, wire] = line.split(' -> ');
    dependencies.set(wire, instruction.match(/([a-z]+)/g) || []);
    instructions.set(wire, instruction.split(' '));
  }

  const visited = new Set<Wire>();
  const ordered: Wire[] = [];

  [...dependencies.keys()].forEach(function dfs(wire: Wire) {
    if (visited.has(wire)) return;
    visited.add(wire);
    dependencies.get(wire).forEach(dfs);
    ordered.push(wire);
  });

  return ordered.reduce(
    (wires, wire) => [...wires, [wire, instructions.get(wire)]],
    []
  );
};
```

Treating the instruction booklet as a DAG allows us to perform the Topological Sort (opting for the [depth-first search approach](https://en.wikipedia.org/wiki/Topological_sorting#Depth-first_search)) and return the ordered instructions.
With this in hand, we now need a means to emulate and return the signal value for a given wire's instruction - based on the signal mapping that we have built up to that point.

```typescript
type Signals = Map<Wire, number>;

const emulate = (signals: Signals, instruction: Instruction): number => {
  const get = (token: string): number =>
    signals.has(token) ? signals.get(token) : toInt(token);

  switch (true) {
    case instruction.includes('AND'):
      return get(instruction[0]) & get(instruction[2]);
    case instruction.includes('OR'):
      return get(instruction[0]) | get(instruction[2]);
    case instruction.includes('LSHIFT'):
      return get(instruction[0]) << get(instruction[2]);
    case instruction.includes('RSHIFT'):
      return get(instruction[0]) >> get(instruction[2]);
    case instruction.includes('NOT'):
      return ~get(instruction[1]) & 0xffff;
    default:
      return get(instruction[0]);
  }
};
```

We use a local `get` helper function to attempt to retrieve the instruction identifier value from the signal mapping; otherwise, we assume it must be an integer value that we must parse.
From here, we can then perform a single reduction over the instruction execution listing, building up the resulting signal mapping along the way.

```typescript
const part1 = (input: string): number => {
  const signals: Signals = createInstructionExecutionOrder(input).reduce(
    (signals, [wire, instruction]) =>
      signals.set(wire, emulate(signals, instruction)),
    new Map()
  );

  return signals.get('a');
};
```

It is then from this built map that we can get the signal value which has been emulated for wire `a`.
Likewise, we can solve part two in a similar manner, except we must first replace the signal value of wire `b` with part one's answer.

```typescript
const part2 = (input: string): number => {
  const instructions = createInstructionExecutionOrder(
    input.replace(/^\d+ -> b$/gm, `${part1(input).toString()} -> b`)
  );
  const signals: Signals = instructions.reduce(
    (signals, [wire, instruction]) =>
      signals.set(wire, emulate(signals, instruction)),
    new Map()
  );

  return signals.get('a');
};
```

I really enjoyed exploring the Topological Sorting algorithm to implement the second solution to today's problem.
By performing this initial ordering, we can greatly simplify the emulation logic and remove the need for any memoization or recursive calls.
