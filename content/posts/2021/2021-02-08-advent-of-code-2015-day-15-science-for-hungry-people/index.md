---
layout: post
title: 'Advent of Code 2015 - Day 15 - Science for Hungry People'
meta: 'Solving the Advent of Code 2015 Day 15 puzzle using TypeScript.'
tags: ['advent-of-code', 'advent-of-code-2015', 'typescript']
---

On the fifteenth day of Advent of Code 2015, we are tasked with finding the right balance of ingredients to make the perfect milk-dunking cookie recipe.

<!--more-->

## Part 1

We are provided with a listing of the four available ingredients, along with five properties for each.
These properties are capacity, durability, flavour, texture, and calories.
Our resulting recipe leaves room for exactly 100 teaspoons of ingredients.

For part one, we are asked to find the ingredient mixture that has the highest total _cookie score_.
The total score of a cookie can be found by adding up each of the properties (negative totals become 0) and then multiplying together everything except calories.

We start by parsing the ingredients into a form we can work with going forward.

```typescript
type Property = number;
type Ingredient = Property[];

const parseIngredients = (input: string): Ingredient[] =>
  input.split('\n').map(line => line.match(/(-?\d+)/g).map(toInt));
```

For this exercise, we are not too bothered with the names of the ingredients and properties, and as such, we can simply store all the given property values.
From here, we are required to iterate over all the possible combinations of teaspoon quantities per ingredient that sum up to the 100 teaspoons available.
Initially, I solved this with a hardcoded triple for-loop 😬, but upon reflection, I have decided to generalise the solution to cater for any arity of ingredients.

```typescript
type Quantity = number;
type Mixture = Quantity[];

function* mixtures(
  teaspoons: Quantity,
  ingredients: number
): Generator<Mixture> {
  if (ingredients < 2) {
    return yield [teaspoons];
  }

  for (let quantity = 0; quantity <= teaspoons; quantity++) {
    for (const mixture of mixtures(
      teaspoons - quantity,
      ingredients - 1
    )) {
      yield [quantity, ...mixture];
    }
  }
}
```

The above implementation harnesses a Generator to recursively combine all the quantities of each ingredient that could be possible.
For comparison, I also decided to implement a solution that uses plain old arrays like so.

```typescript
const mixtures = (
  teaspoons: Quantity,
  ingredients: number
): Mixture[] => {
  if (ingredients < 2) return [[teaspoons]];

  return [...Array(teaspoons + 1).keys()].reduce(
    (mixes, quantity) =>
      mixes.concat(
        mixtures(
          teaspoons - quantity,
          ingredients - 1
        ).map(mixture => [quantity, ...mixture])
      ),
    []
  );
};
```

With the ability to now iterate over all the possible quantities of ingredients, we can now codify how to calculate the score of a given cookie.

```typescript
const calcCookieScore = (
  ingredients: Ingredient[],
  mixture: Mixture
): { score: number; calories: number } => {
  const properties = transpose(ingredients).map(property =>
    Math.max(
      zip(property, mixture).reduce((sum, [p, m]) => sum + p * m, 0),
      0
    )
  );
  const calories = properties.pop();

  return { score: properties.reduce(product), calories };
};
```

Providing the ingredients and desired mixture, we first `transpose` the ingredients array (matrix) into rows of all the property values.
The function in question has been implemented like so.

```typescript
const transpose = <T>(a: T[][]) =>
  a[0].map((_, c: number) => a.map((r: T[]) => r[c]));
```

We then [`zip`](../2021-02-06-advent-of-code-2015-day-13-knights-of-the-dinner-table/index.md) these properties with the desired mixture and apply the formula for calculating the score.
Finally, we _pop_ the calories off the bottom and return the score (product of all the properties' individual scores, excluding calories) and the calories themselves.

With these building blocks in place, we can then calculate all the possible scores and return the highest to answer part one 🌟.

```typescript
const RECIPE_TEASPOONS = 100;

const part1 = (input: string): number => {
  const ingredients = parseIngredients(input);

  const scores = [
    ...mixtures(RECIPE_TEASPOONS, ingredients.length),
  ].map(mixture => calcCookieScore(ingredients, mixture).score);

  return max(scores);
};
```

Note: due to the size of the scores array that is produced, we are again required to use the [`max`](../2021-02-06-advent-of-code-2015-day-13-knights-of-the-dinner-table/index.md) function produced in a previous day's solution over `Math.max`.

## Part 2

For part two, we are asked to determine what mixture produces the highest cookie score again, except this time the mixture's calories should equal 500.
In a similar manner to part one, we can calculate all the possible cookie scores; however, now we only return this score if the calories are equal to 500.
We can then locate the highest-scoring cookie from this partial listing to answer part two 🌟.

```typescript
const part2 = (input: string): number => {
  const ingredients = parseIngredients(input);

  const scores = [
    ...mixtures(RECIPE_TEASPOONS, ingredients.length),
  ].map(mixture => {
    const { score, calories } = calcCookieScore(ingredients, mixture);
    return calories === 500 ? score : 0;
  });

  return max(scores);
};
```
