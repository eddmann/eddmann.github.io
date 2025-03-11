---
layout: post
title: 'Advent of Code 2015 - Day 18 - Like a GIF For Your Yard'
meta: 'Solving the Advent of Code 2015 Day 18 puzzle using TypeScript.'
tags: ['advent-of-code', 'advent-of-code-2015', 'typescript']
---

On the eighteenth day of Advent of Code 2015, we are asked to re-arrange the light show we created on [a previous day](../2021-01-30-advent-of-code-2015-day-6-probably-a-fire-hazard/index.md).

<!--more-->

## Part 1

We are supplied with an initial 100x100 grid of light states (on or off) and told that Santa has provided us with rules to follow to produce this new light show.
These rules follow [Conway's Game of Life](https://en.wikipedia.org/wiki/Conway's_Game_of_Life), as follows:

- A light that is on stays on when 2 or 3 neighbours are on and turns off otherwise.
- A light that is off turns on if exactly 3 neighbours are on and stays off otherwise.

We begin by parsing the provided initial light state grid into a form we can process.

```typescript
type Light = [x: number, y: number];
type OnLights = CompoundSet<Light>;

const parseGrid = (
  input: string
): [upperBounds: number, lights: OnLights] => {
  const rows = input.split('\n');
  return [
    rows.length,
    rows.reduce((on, line, x) => {
      return [...line].reduce(
        (on, light, y) => (light === '#' ? on.add([x, y]) : on),
        on
      );
    }, new CompoundSet<Light>()),
  ];
};
```

We iterate through the initial grid, building up a [CompoundSet](../2021-01-27-implementing-a-compound-set-in-typescript/index.md) of all the lights that are currently on (identified by their x and y coordinates).
To manage the bounds within future calculations, we return the upper-bounds value of the grid (in this case, 100) to the caller as well.

From here, we create a function that, when supplied with the upper-bounds and the current light coordinates, returns all the possible neighbouring light positions.

```typescript
type Neighbours = (l: Light) => Light[];

const neighboursFor = (upperBounds: number): Neighbours => ([
  x,
  y,
]: Light): Light[] => {
  const neighbours: Light[] = [];

  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      const [nx, ny] = [x + dx, y + dy];
      if (dx === 0 && dy === 0) continue;
      if (nx < 0 || ny < 0) continue;
      if (nx >= upperBounds || ny >= upperBounds) continue;
      neighbours.push([nx, ny]);
    }
  }

  return neighbours;
};
```

There is a little guard logic above to ensure that any adjacent subject light is within the bounds of the grid.
By partially applying this function with the desired upper-bounds, we can begin codifying the animation state transitions.

```typescript
const animate = (neighboursFor: Neighbours) => (
  lights: OnLights
): OnLights => {
  const onWithNeighbours = new CompoundSet<Light>(
    [...lights].reduce(
      (lights, light) => [...lights, light, ...neighboursFor(light)],
      []
    )
  );

  return new CompoundSet<Light>(
    [...onWithNeighbours].filter(light => {
      const active = neighboursFor(light).filter(l => lights.has(l))
        .length;
      return active === 3 || (active === 2 && lights.has(light));
    })
  );
};
```

Based on the provided set of lights that are currently _on_, we determine the listing of all these lights, including any valid neighbouring light positions.
Combined, these are all the possible lights that could be returned from this state transition as on.
From here, we filter down to only include lights that meet the rules explained above.

Combining all this functionality together (and with the help of the `repeat` function we created on a previous day), we can iterate over this animation for 100 transitions and return the desired count of the lights that are on 🌟.

```typescript
const part1 = (input: string): number => {
  const [upperBounds, lights] = parseGrid(input);
  return repeat(100, animate(neighboursFor(upperBounds)), lights)
    .size;
};
```

## Part 2

For part two, we are told that it appears the lights we bought have _stuck corners_, whereby these lights are always left on.
We are told to apply this new characteristic and repeat the 100 iterations from the initial grid state again.

```typescript
const cornersStuckOn = (upperBounds: number) => (
  lights: OnLights
): OnLights =>
  lights
    .add([0, 0])
    .add([0, upperBounds - 1])
    .add([upperBounds - 1, 0])
    .add([upperBounds - 1, upperBounds - 1]);
```

In a similar fashion to how we partially applied the `neighboursFor` function above, we do the same to ensure that the supplied lights that are on maintain the _stuck corners_.
With this new functionality, we can compose all the building blocks together, returning the desired new count of lights that are on 🌟.

```typescript
const part2 = (input: string): number => {
  const [upperBounds, lights] = parseGrid(input);
  const stuck = cornersStuckOn(upperBounds);
  const action = animate(neighboursFor(upperBounds));
  return repeat(100, (l: OnLights) => stuck(action(l)), stuck(lights))
    .size;
};
```

Upon reflection, I found this solution to be rather slow.
I opted for readability and clear problem-solving over an optimised answer response.
In the future, I hope to explore this problem further and improve its performance characteristics.
