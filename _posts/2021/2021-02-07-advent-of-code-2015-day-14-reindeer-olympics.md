---
layout: post
title: 'Advent of Code 2015 - Day 14 - Reindeer Olympics'
meta: 'Solving the Advent of Code 2015 Day 14 puzzle using TypeScript'
tags: advent-of-code advent-of-code-2015 typescript
---

On the fourteen day of Advent of Code 2015 Santa wants to find out who is the fastest reindeer.

<!--more-->

### Part 1

We are provided with a listing of all the nine reindeer; stating how fast they can travel per second, how many seconds they can fly for at the given speed and how many seconds they require subsequently to rest.
We are tasked with first determining the distance of the reindeer who would travel the furthest in _2503 seconds_.
To begin, we parse the reindeer input we have been supplied.

```typescript
type Reindeer = {
  speed: number;
  fly: number;
  rest: number;
};

const parseReindeer = (input: string): Reindeer[] =>
  input.split('\n').map(line => {
    const [speed, fly, rest] = line.match(/(\d+)/g).map(toInt);
    return { speed, fly, rest };
  });
```

As we are not required to provide the name of the reindeer, we can omit this from the parsed representation.
For our initial solution we are going to create a [Generator](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Generator) which will yield the current distance travelled every second that is elasped.

```typescript
function* simulate({
  speed,
  fly,
  rest,
}: Reindeer): Generator<number> {
  let elapsed = fly;
  let isFlying = true;
  let distance = 0;

  while (true) {
    if (elapsed < 1) {
      isFlying = !isFlying;
      elapsed = isFlying ? fly : rest;
    }

    if (isFlying) distance += speed;
    elapsed--;

    yield distance;
  }
}
```

With this iterative approach we simulate the logic around alternating between flying and resting states.

```typescript
const nth = <T>(g: Generator<T>, n: number): T => {
  for (const v of g) {
    if (--n < 1) return v;
  }
};
```

To produce a more succinct solution I have decided to include a small utility function which iterates through the generator returning the `nth` value.
With the building blocks now in place we can now proceed to answer the question to part one 🌟.

```typescript
const part1 = (input: string): number =>
  Math.max(...parseReindeer(input).map(r => nth(simulate(r), 2503)));
```

### Part 2

For part two, we are again asked to simulate the distance travelled for _2503 seconds_, however, a point is now awarded each second to the reindeer that has travelled the furthest distance at that time.
Once all reindeer points have been awarded we are asked to return the winning reindeers total points.

Like in part one, we can re-use the `simulate` Generator function, expect now per iteration we record all the total distances travelled and award the winning reindeer with a point.
From here, we return the highest recorded reindeers points to answer the qestion 🌟.

```typescript
const part2 = (input: string): number => {
  const reindeer = parseReindeer(input).map(simulate);
  const points = new Map<number, number>();

  repeat(2503, () => {
    const distances = reindeer.map(g => g.next().value);
    const winner = distances.indexOf(Math.max(...distances));
    points.set(winner, (points.get(winner) || 0) + 1);
  });

  return Math.max(...points.values());
};
```

For this solution I was able to harness the `repeat` function we created for [Day 10](https://eddmann.com/posts/advent-of-code-2015-day-10-elves-look-elves-say/).
This abstracts away the need to implement a stateful loop and focuses on the problem at hand.
I have also decided to omit the reindeers name and identify each reindeer based on theirposition within the listing.

### Alternative Solution

Since implementing the above solution I have been exploring how we could skip the iterative simulation step all together and apply a little math to produce the answer.
As such, we are able to replace the `simulate` Generator with a function that takes in the reindeer details and seconds elapsed like so:

```typescript
const simulate = (
  { speed, fly, rest }: Reindeer,
  seconds: number
): number => {
  const [quotient, remainder] = [
    Math.floor(seconds / (fly + rest)),
    seconds % (fly + rest),
  ];
  return (quotient * fly + Math.min(remainder, fly)) * speed;
};
```

Within the function above we deduce the total seconds flown (taking into consideration required rest) and multiply that by the speed per second to return the total distance covered.
We can then answer part one in a similiar fashion to how we did the original solution - expect this time we can omit the need to compute each iteration.

```typescript
const part1 = (input: string): number =>
  Math.max(...parseReindeer(input).map(r => simulate(r, 2503)));
```

To answer part two we can reduce over each second elapsed and upon each step update the points mapping according to the winner.

```typescript
const part2 = (input: string): number => {
  const reindeer = parseReindeer(input);

  const points = [...Array(2503).keys()].reduce((points, seconds) => {
    const distances = reindeer.map(r => simulate(r, seconds + 1));
    const winner = distances.indexOf(Math.max(...distances));
    return points.set(winner, (points.get(winner) || 0) + 1);
  }, new Map<number, number>());

  return Math.max(...points.values());
};
```

This solution again leverages the position of the reindeer in the listing for identity.
