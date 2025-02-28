---
layout: post
title: 'Advent of Code 2015 - Day 19 - Medicine for Rudolph'
meta: 'Solving the Advent of Code 2015 Day 19 puzzle using TypeScript.'
tags: advent-of-code advent-of-code-2015 typescript
---

On the nineteenth day of Advent of Code 2015, Rudolph is sick, and we have been tasked with helping develop the _custom-made_ medicine required.

<!--more-->

## Part 1

We are tasked with helping calibrate the machine that is capable of constructing any Red-Nosed Reindeer molecule required to make the medicine.
As input, we are provided with an initial medicine molecule and a list of replacements that we need to apply.
For part one, we need to determine how many distinct molecules can be created using the replacements provided.
We begin, as always, by parsing this input into a form we can work with.

```typescript
type Replacement = [from: string, to: string];
type Molecule = string;

const parseReplacementsAndMolecule = (
  input: string
): { replacements: Replacement[]; molecule: Molecule } => {
  const [replacements, molecule] = input.split('\n\n');

  return {
    replacements: replacements
      .split('\n')
      .map(r => r.split(' => ', 2) as Replacement),
    molecule,
  };
};
```

With a listing of all the replacements and the initial molecule now available, we can use these values to determine all the possible molecule variants.

```typescript
const getMoleculeVariants = function* (
  m: Molecule,
  [from, to]: Replacement
): Generator<Molecule> {
  const pattern = new RegExp(from, 'g');

  let o: RegExpExecArray | null;
  while ((o = pattern.exec(m))) {
    yield m.substr(0, o.index) + to + m.substr(o.index + from.length);
  }
};
```

Given the molecule and the desired replacement, we return a Generator that provides the caller with all the possible variants (based on individual occurrences) within the string.
This allows us to maintain the current position within the Generator and not muddle this logic into the caller's responsibility.

We can then combine these two functions and determine how many distinct molecule variants there are 🌟.

```typescript
const part1 = (input: string): number => {
  const { replacements, molecule } = parseReplacementsAndMolecule(
    input
  );

  const variants: Molecule[] = replacements.reduce(
    (molecules, replacement) => [
      ...molecules,
      ...getMoleculeVariants(molecule, replacement),
    ],
    []
  );

  return new Set<Molecule>(variants).size;
};
```

I initially used a `Set` within the reduction, but due to the ease of combining arrays within JavaScript, I found it more readable to first get all possible variants and then return the `Set` (the deduplication process) at the end.

## Part 2

For part two, with the machine now calibrated, we are required to help with the fabrication process.
Molecule fabrication always begins with just a single electron, _e_, and involves applying replacements one at a time, just like during calibration.
We are required to determine how many steps it will take to go from _e_ to the provided molecule.

My initial thought was to begin at _e_ and apply all possible variants until we landed on the desired molecule (as the problem states).
However, the distinct number of possibilities grows too fast, making this an unviable solution.
After a little thought, I decided to flip this problem around and, based on the molecule provided, determine how many replacements would be required to get back to _e_.
I opted for a _greedy approach_, sorting the replacements in descending length order.
By doing so, we can then count the steps required and return the desired total to answer part two 🌟.

```typescript
const part2 = (input: string): number => {
  const { replacements, molecule } = parseReplacementsAndMolecule(
    input
  );
  const replacementsByLength = replacements.sort(
    ([, x], [, y]) => y.length - x.length
  );

  let variant = molecule;
  let steps = 0;

  while (variant !== 'e') {
    for (const [from, to] of replacementsByLength) {
      for (const r of getMoleculeVariants(variant, [to, from])) {
        variant = r;
        steps += 1;
        break;
      }
    }
  }

  return steps;
};
```

The input has been constructed in such a way that there is no possibility for ambiguity, with only one path back to _e_.
An interesting optimisation I made was that in a previous solution, I broke out of both the variant and replacement loops upon finding a match.
This ensured that we performed the largest replacement possible at every step.
However, I experimented with what we now have above and instead allowed it to continue to the next possible replacement.
This appears to have sped up the solution while still returning the correct answer.

I really enjoyed today's challenge and would highly recommend checking out the discussion on the [/r/adventofcode](https://www.reddit.com/r/adventofcode/comments/3xflz8/day_19_solutions/) subreddit.
It details some interesting ways in which people have solved the problem by hand!
