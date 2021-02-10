---
layout: post
title: 'Advent of Code 2015 - Day 17 - No Such Thing as Too Much'
meta: 'Solving the Advent of Code 2015 Day 17 puzzle using TypeScript'
---

On the seventeenth day of Advent of Code 2015 the elves bought 150 litres of eggnog that we are asked to fit in the supplied containers for refrigeration.

<!--more-->

### Part 1

We are supplied a list of all the different sized containers we have available to us as input; and for part one asked how many combinations of these will fit the 150 litre requirement.
At its core today centres around the [Subset sum problem](https://en.wikipedia.org/wiki/Subset_sum_problem), where-by given a [Multiset](https://en.wikipedia.org/wiki/Multiset) we are required to find all the possible subsets that sum to a given number (in this case 150).
We begin by parsing the supplied containers into a form we can then process.

```typescript
const parseContainers = (input: string) =>
  input.split('\n').map(toInt);
```

There are several popular ways to solve the Subset sum problem, all with their own complexity characteristics.
Due to the input being so small I have opted for the native combinations approach, with a small optimisation to prune subsets that have already exceeded the desired total.
In the future I hope to spend some time investigating how you can employ Dynamic Programming to help improve performance.

```typescript
const subsetSum = (numbers: number[], target: number): number[][] => {
  const recur = (remaining: number[], subset: number[]) => {
    const total = subset.reduce(sum, 0);
    if (total === target) return [subset];
    if (total >= target) return [];

    return remaining.flatMap((n, i) =>
      recur(remaining.slice(i + 1), [...subset, n])
    );
  };

  return recur(numbers, []);
};
```

The above implementation uses a recursive closure to iterate through all the possible subsets.
An optimisation I omitted would be to check upon each iteration that the sum of the current total and remaining numbers is not less than the target.
If this is the case we can prune these branches, as we know that no following subset will meet the desired criteria.

Following on from this, I also spent a little time implementing the same recursive implementation using Generators.
I find that recursive problems such as this can be succinctly defined in this manor.

```typescript
function* subsetSum(
  numbers: number[],
  target: number
): Generator<number[]> {
  function* recur(remaining: number[], subset: number[]) {
    const total = subset.reduce(sum, 0);
    if (total === target) yield subset;
    if (total >= target) return;

    for (let i = 0; i < remaining.length; i++) {
      yield* recur(remaining.slice(i + 1), [...subset, remaining[i]]);
    }
  }

  yield* recur(numbers, []);
}
```

With the ability to now determine all the possible subsets which sum to the given number we can answer the first part of today's problem 🌟.

```typescript
const part1 = (input: string): number =>
  subsetSum(parseContainers(input), 150).length;
```

### Part 2

For part two we are asked to investigate the possible subsets further, determining how many combinations of the least amount of containers can we use.
Again, due to the search-space being so small we can harness the same functionality implemented in part one and construct an occurrences map per subset length.
With this occurrence mapping we can then workout the smallest subset length present and then return this count to answer part two 🌟.

```typescript
const part2 = (input: string): number => {
  const sizes = subsetSum(parseContainers(input), 150).reduce(
    (sizes, subset) =>
      sizes.set(subset.length, (sizes.get(subset.length) || 0) + 1),
    new Map<number, number>()
  );

  return sizes.get(Math.min(...sizes.keys()));
};
```

Like in the part one there are more performant solutions to achieving this end result.
In the future I hope to explore the Subset sum problem in more detail and explore these options.
