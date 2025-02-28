---
layout: post
title: 'Advent of Code 2015 - Day 24 - It Hangs in the Balance'
meta: 'Solving the Advent of Code 2015 Day 24 puzzle using TypeScript'
tags: advent-of-code advent-of-code-2015 typescript
---

On the twenty fourth day of Advent of Code 2015 we are asked to help Santa balance his sleigh based on all the presents he has to carry.

<!--more-->

## Part 1

We are told that the presents need to be evenly divided into three groups based on their weight (which is provided as input).
Along with this, we are required to ensure that the first grouping (which goes in the passenger compartment of the sleigh) needs to include the minimal amount of packages possible.
So as to resolve conflict upon multiple package combinations meeting the first groupings critieria, we are to consider the grouping which has the smallest _quantum entanglement_ (aka product of their weights) to be the winner.
For part one we are required to determine what the _quantum entanglement_ of the first group will be based on this criteria.

To begin we will parse the provide package weights into a form we can process hence forth.

```typescript
type Weight = number;

const parsePackageWeights = (input: string): Weight[] =>
  input.split('\n').map(toInt);
```

From here, we will create a function which based on a given total weight and available packages yields all the possible matching groups.
This function will return groupings in size order, for example, all groupings of two will be yielded before any groups of three are considered (this is important for the final solution).

```typescript
type Group = Weight[];

const groupsOfWeight = function* (
  packages: Weight[],
  weightPerGroup: Weight
): Generator<Group> {
  for (let groupSize = 1; groupSize <= packages.length; groupSize++) {
    for (const group of combinations(packages, groupSize)) {
      if (group.reduce(sum, 0) === weightPerGroup) {
        yield group;
      }
    }
  }
};
```

With the ability to now determine valid package groupings, we will create a function which recursively validates that based on a supplied total group weight and available packages that the number of groups can be met.
This will be required to ensure that once we have determined a candidate compartment package grouping, that the remaining packages can be split evenly within the remaining groupings.

```typescript
const sub = <T>(xs: T[], ys: T[]) => xs.filter(x => !ys.includes(x));

const canGroup = (
  packages: Weight[],
  numOfGroups: number,
  weightPerGroup: Weight
): boolean => {
  if (numOfGroups === 0) return packages.length === 0;

  for (const group of groupsOfWeight(packages, weightPerGroup)) {
    if (canGroup(sub(packages, group), numOfGroups - 1, weightPerGroup)) {
      return true;
    }
  }

  return false;
};
```

This now leads us to being able to determine what the _ideal_ first grouping will be.

```typescript
const idealFirstGroupQE = (
  packages: Weight[],
  numOfGroups: number
): number => {
  const weightPerGroup = packages.reduce(sum, 0) / numOfGroups;

  let minQE = Infinity;
  let prevGroupSize = Infinity;

  for (const group of groupsOfWeight(packages, weightPerGroup)) {
    if (minQE !== Infinity && prevGroupSize < group.length) break;

    const candidateQE = group.reduce(product, 1);
    if (
      candidateQE < minQE &&
      canGroup(sub(packages, group), numOfGroups - 1, weightPerGroup)
    ) {
      minQE = candidateQE;
    }

    prevGroupSize = group.length;
  }

  return minQE;
};
```

Using the characteristics discussed above surrounding the yielded package grouping sizes, we first determine what the _weight per group_ will have to be.
From here we iterate through possible groupings, checking that the remaining available packages can be evenly distributed into the other groups.
So as to not have to needlessly perform this check, we only do so if the groupings _quantum entanglement_ is less than the one we have already recorded.
Once we have found a minimum _quantum entanglement_ and the yielded group size increases, we can decern that this is the smallest possible value.

Finally, we can put all these building blocks together and return the desired answer we are looking for 🌟.

```typescript
const part1 = (input: string): number =>
  idealFirstGroupQE(parsePackageWeights(input), 3);
```

## Part 2

For part two we are required to cater for an additional package grouping (four groupings as opposed to the original three).
Based on how our solution has been modeled we can simply supply an updated `numOfGroups` and return this revised value 🌟.

```typescript
const part2 = (input: string): number =>
  idealFirstGroupQE(parsePackageWeights(input), 4);
```

## Alternative Solution

The solution above provides a _belt n' braces_ approach to handling the provided package weight input.
It considers all possible combinations based on a given group sizing, and that the remaining packages can be grouped up correctly.
However, experimenting with the input brought me to an additional solution that returns the correct answers, but without the need for this additional validation.

Based on the input supplied we do not need to consider the above concerns and can instead simply return the first grouping that we see.
This returns the correct answer for both parts; but as this takes advantage of the provided input (as opposed to handling any arbitrary input) I do not feel this is a desired solution.

```typescript
const idealFirstGroupQE = (
  packages: Weight[],
  numOfGroups: number
): number => {
  const weightPerGroup = packages.reduce(sum, 0) / numOfGroups;

  for (const group of groupsOfWeight(packages, weightPerGroup)) {
    return group.reduce(product, 1);
  }
};
```
