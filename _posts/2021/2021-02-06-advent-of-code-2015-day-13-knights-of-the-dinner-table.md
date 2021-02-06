---
layout: post
title: 'Advent of Code 2015 - Day 13 - Knights of the Dinner Table'
meta: 'Solving the Advent of Code 2015 Day 13 puzzle using TypeScript'
---

On the thirteenth day of Advent of Code 2015 we are tasked with finding the optimal seating arrangement for our family _holiday feast_.

<!--more-->

### Part 1

We are provided with a listings of all our family members and their relationships with each other.
These relationships come in the form of a happiness score which can be either positive or negative.
We are tasked with determining the happiness total of the optimial seating arrangment.

My initial reaction to this problem is that it shows a great similarity to [Day 9](https://eddmann.com/posts/advent-of-code-2015-day-9-all-in-a-single-night/).
Like before, we initially begin by parsing the provided input into a form we can use.

```typescript
type FamilyMember = string;
type Neighbours = string;
type Happiness = number;
type Relationships = {
  family: Set<FamilyMember>;
  relationships: Map<Neighbours, Happiness>;
};

const parseFamilyRelationships = (input: string): Relationships =>
  input.split('\n').reduce(
    ({ family, relationships }, line) => {
      const [, member, feeling, score, nextTo] = line.match(
        /(\w+) .+ (.+) (\d+) .+ (\w+)/
      );
      return {
        family: family.add(member),
        relationships: relationships.set(
          `${member},${nextTo}`,
          feeling === 'gain' ? +score : -score
        ),
      };
    },
    {
      family: new Set<FamilyMember>(),
      relationships: new Map<Neighbours, Happiness>(),
    }
  );
```

Like in Day 9, we reduce over the listing building up both a _set_ of all the family members and a _map_ of the relationship happiness scores.
Unlike the previous day, I have decided to opt for a single-level map which provides the associations in the form of `Neighbours` strings.
As an aside, I've really enjoyed being able to map the problem domain into types of which I can construct the behaviour from.
I find great value in being able to type-aliase primitives such as numbers and strings to the domain language.

With the input now parsed we can move on to calculating the seating happiness scores.
The input listing is not that large so again we can use the `permutations` function we implemented in Day 9 to iterate over every possible seating arrangement.
For each given arrangement we then calculate its total happiness score.

```typescript
const calcSeatingHappiness = ({
  family,
  relationships,
}: Relationships): Happiness[] =>
  [...permutations([...family])].map(a =>
    zip(a, [...a.slice(1), a[0]]).reduce(
      (score, [a, b]) =>
        score +
        relationships.get(`${a},${b}`) +
        relationships.get(`${b},${a}`),
      0
    )
  );
```

Instead of _piggy-backing_ on the reduction to include the previous family member (like we did in Day 9) I decided to implement a `zip` function which returned a tuple of each seat neighbours (gracefully handling the circular nature of the table).
These neighbouring tuples are then reduced over to produce the total happiness score for that given arrangement.

```typescript
const zip = <A, B>(a: A[], b: B[]): [A, B][] =>
  a.map((x, idx) => [x, b[idx]]);
```

Whilst solving this problem I encoutered an issue when using JavaScripts `Math.max` and the size of the possible arrangement happiness scores.
Due to the nature in which `Math.max` (and `Math.min`) uses a multi-arity argument approach to supplying input, their is a finite amount of arguments that it can take till it exceeds the call-stack limit.
For this problem I encounted this issue and as such was required to implement an alternative approach.

```typescript
const max = (xs: number[]) =>
  xs.reduce((m, x) => (x > m ? x : m), -Infinity);
```

With this custom `max` implementation we can now compose all the building blocks together and return the desired answer 🌟.

```typescript
const part1 = (input: string): number =>
  max(calcSeatingHappiness(parseFamilyRelationships(input)));
```

### Part 2

To solve part two we are required to add ourselves to the seating arrangement; with neutral (`0`) happiness scores for all family members.
Once added we are required to then determine what the new optimial seating arrangement happiness score will be.
We can sovle this in a similiar mannor to how we did for part one 🌟.

```typescript
const part2 = (input: string): number => {
  const { family, relationships } = parseFamilyRelationships(input);

  const scores = calcSeatingHappiness({
    relationships: [...family].reduce(
      (relationships, member) =>
        relationships.set(`Me,${member}`, 0).set(`${member},Me`, 0),
      relationships
    ),
    family: family.add('Me'),
  });

  return max(scores);
};
```
