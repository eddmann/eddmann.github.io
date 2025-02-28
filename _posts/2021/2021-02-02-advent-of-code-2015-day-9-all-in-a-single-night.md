---
layout: post
title: 'Advent of Code 2015 - Day 9 - All in a Single Night'
meta: 'Solving the Advent of Code 2015 Day 9 puzzle using TypeScript.'
tags: advent-of-code advent-of-code-2015 typescript
---

On the ninth day of Advent of Code 2015, Santa wants us to examine some new locations (and distances) he is required to visit.

<!--more-->

## Part 1

We are provided with a list of distances between locations that Santa wishes to visit exactly once, starting and finishing at any location.
For part one, we are asked to determine the shortest distance for the shortest route that meets this criterion.
Like before, we start off by parsing the provided input into a structure that we can use going forward.

```typescript
type Location = string;
type Distance = number;
type Distances = {
  locations: Set<Location>;
  distances: Map<Location, Map<Location, Distance>>;
};

const parseLocationsAndDistances = (input: string): Distances =>
  input.split('\n').reduce(
    ({ distances, locations }, line) => {
      const [, from, to, distance] = line.match(
        /(.+) to (.+) = (\d+)/
      );

      distances.set(
        from,
        (distances.get(from) || new Map()).set(to, toInt(distance))
      );
      distances.set(
        to,
        (distances.get(to) || new Map()).set(from, toInt(distance))
      );
      locations.add(from);
      locations.add(to);

      return { distances, locations };
    },
    { locations: new Set(), distances: new Map() } as Distances
  );
```

From this function, we are returned a `Set` of all the unique locations that Santa wishes to visit, along with a `Map` of all the distances (weights) between each of these locations.
My initial thought was that this was possibly a form of the [Travelling Salesman Problem](https://en.wikipedia.org/wiki/Travelling_salesman_problem) and that we would need to employ such an algorithm to achieve the end result.
However, upon inspection of the input, we can see that all locations are directly accessible from each other and that the listing is small.
With this in mind, we can instead opt to calculate the distances of all possible _permutations_ of the location listing with minimal computational overhead.

JavaScript does not provide permutation functionality _out of the box_ like languages such as Python do.
As such, we are required to roll our own; I opted to leverage generators in the implementation below.

```typescript
function* permutations<T>(col: T[]): Generator<T[]> {
  if (col.length < 2) {
    return yield col;
  }

  const [first, ...rest] = col;
  for (const permutation of permutations(rest)) {
    for (let i = 0; i < col.length; i++) {
      yield [
        ...permutation.slice(0, i),
        first,
        ...permutation.slice(i),
      ];
    }
  }
}
```

Using this function, we can then create a higher-order function that aggregates all the possible trip distances into a final reduced value using a supplied `reducer` function.

```typescript
const aggregateTripDistances = <T>(
  { locations, distances }: Distances,
  initialValue: T,
  reducer: (accumulator: T, distance: Distance) => T
) => {
  let accumulator = initialValue;

  for (const [first, ...rest] of permutations([...locations])) {
    const [distance] = rest.reduce(
      ([distance, previous], location) => [
        distance + distances.get(previous).get(location),
        location,
      ],
      [0, first] as [Distance, Location]
    );
    accumulator = reducer(accumulator, distance);
  }

  return accumulator;
};
```

Finally, we can answer part one by calling this function, supplying the `Math.min` aggregate function to keep track of the shortest distance we have seen 🌟.

```typescript
const part1 = (input: string): number =>
  aggregateTripDistances(
    parseLocationsAndDistances(input),
    Infinity,
    Math.min
  );
```

## Part 2

For part two, we are instead asked to determine the longest distance for the longest route based on the same location listing.
Using the same building blocks provided for part one's solution, we can instead supply the `Math.max` aggregate function to return the desired answer 🌟.

```typescript
const part2 = (input: string): number =>
  aggregateTripDistances(
    parseLocationsAndDistances(input),
    -Infinity,
    Math.max
  );
```

## Alternative Solution

Instead of designing an aggregate function that applies a given reduction function, we could instead take the approach below.
First, we generate a list of all the possible trip distance totals based on permutations of the location set.

```typescript
const calcTripDistances = ({
  locations,
  distances,
}: Distances): number[] =>
  [...permutations([...locations])].map(([first, ...rest]) => {
    const [distance] = rest.reduce(
      ([distance, previous], location) => [
        distance + distances.get(previous).get(location),
        location,
      ],
      [0, first] as [Distance, Location]
    );
    return distance;
  });
```

Then, we can supply this list as arguments to both the `Math.min` and `Math.max` functions.
Using this approach works well for this input.
However, we should be considerate that as all arguments are required to be put on the call stack within the chosen JavaScript VM, [there is a limit](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/apply#using_apply_and_built-in_functions) to how many list items this will cater for.

```typescript
const part1 = (input: string): number =>
  Math.min(...calcTripDistances(parseLocationsAndDistances(input)));
```

```typescript
const part2 = (input: string): number =>
  Math.max(...calcTripDistances(parseLocationsAndDistances(input)));
```
