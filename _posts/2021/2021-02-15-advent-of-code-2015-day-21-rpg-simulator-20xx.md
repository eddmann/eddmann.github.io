---
layout: post
title: 'Advent of Code 2015 - Day 21 - RPG Simulator 20XX'
meta: 'Solving the Advent of Code 2015 Day 21 puzzle using TypeScript'
---

On the twenty first day of Advent of Code 2015 we are asked to help 'Little Henry Case' beat the boss in a new video game he got for Christmas.

<!--more-->

### Part 1

The game is a turn-based, in which we buy available shop items before fighting a given boss (with a configuration that is provided as input).
The rules can be read by visiting the [problem specification](https://adventofcode.com/2015/day/21).
For part one, we are asked to work out what is the least amount of gold we can spend and still win the fight.
We will begin by getting a copy of the shop items that are available for purchase.

```typescript
const ITEMS = `
Weapons:    Cost  Damage  Armor
Dagger        8     4       0
Shortsword   10     5       0
Warhammer    25     6       0
Longsword    40     7       0
Greataxe     74     8       0

Armor:      Cost  Damage  Armor
Leather      13     0       1
Chainmail    31     0       2
Splintmail   53     0       3
Bandedmail   75     0       4
Platemail   102     0       5

Rings:      Cost  Damage  Armor
Damage +1    25     1       0
Damage +2    50     2       0
Damage +3   100     3       0
Defense +1   20     0       1
Defense +2   40     0       2
Defense +3   80     0       3
`.trim();
```

We can now go about parsing these items into a form we can use for future work.

```typescript
type Item = {
  name: string;
  cost: number;
  damage: number;
  armor: number;
};
type ShopItems = { weapons: Item[]; armor: Item[]; rings: Item[] };

const parseItemSection = (section: string): Item[] =>
  [
    ...section.matchAll(/(\w+(?:\s\+\d)?)\s+(\d+)\s+(\d+)\s+(\d+)/g),
  ].map(([, name, cost, damage, armor]) => ({
    name,
    cost: toInt(cost),
    damage: toInt(damage),
    armor: toInt(armor),
  }));

const parseShopItems = (items: string): ShopItems => {
  const [weapons, armor, rings] = items.split('\n\n');
  return {
    weapons: parseItemSection(weapons),
    armor: parseItemSection(armor),
    rings: parseItemSection(rings),
  };
};
```

With the shop items now parsed, we can move onto parsing the Boss configuration that has been provided as input.

```typescript
type Participant = { hp: number; damage: number; armor: number };

const parseBossConfiguration = (input: string): Participant => {
  const [hp, damage, armor] = input.match(/(\d+)/gm);
  return {
    hp: toInt(hp),
    damage: toInt(damage),
    armor: toInt(armor),
  };
};
```

Reading through the shop item purchase criteria, I have decided that an elegant way in which to produce all possible valid configurations is via an [cartesian product](https://en.wikipedia.org/wiki/Cartesian_product).
For this I will be using the below generalised implementation.

```typescript
const cartesianProduct = <T>(...a: T[][]): T[][] =>
  a.reduce((a, b) => a.flatMap(d => b.map(e => [d, e].flat())), [[]]);
```

We will also need a means to sum up a given array of objects property.
This can be achieved in a type-safe manor using the code below.

```typescript
const sumProp = <T>(els: T[], prop: keyof T) =>
  els.reduce((sum, el) => sum + +el[prop], 0);
```

With these two utility helper functions in-hand we can go about creating a function to return all the possible valid player configurations.

```typescript
type PlayerConfiguration = Participant & { cost: number };

const NO_ITEM: Item = { name: 'None', cost: 0, damage: 0, armor: 0 };

const generatePlayerConfigurations = ({
  weapons,
  armor,
  rings,
}: ShopItems): PlayerConfiguration[] => {
  const optionalArmor = [...armor, NO_ITEM];
  const optionalRing = [...rings, NO_ITEM];

  return cartesianProduct(
    weapons,
    optionalArmor,
    optionalRing,
    optionalRing
  )
    .filter(([, , r1, r2]) => {
      if (r1 === NO_ITEM && r2 !== NO_ITEM) return false;
      return r1.name !== r2.name;
    })
    .map(items => ({
      hp: 100,
      cost: sumProp(items, 'cost'),
      damage: sumProp(items, 'damage'),
      armor: sumProp(items, 'armor'),
    }));
};
```

As the armour and both rings are optional, we add a dummy `NO_ITEM` item option which provides us with the _non-existent_ purchase.
Unfortuantly, the rules surrounding how rings may be purchased makes this not a _true_ cartesian product.
Instead, we must additional ensure that we do not purchase the same ring twice, and cater for the option of no ring being purchased at all.
With these configurations not excluded we can return an array of `PlayerConfiguration` which along with the total damage, armor and hit points (we always start with 100), also includes the total cost of the configuration.

Leading on from this, we now need a means in which to simulate a given battle scenario.
Looking at how a battle is conducted we can determine using a single formula how many turns it would take for a given participant to beat the other.

```typescript
const isPlayerWinner = (
  player: Participant,
  boss: Participant
): boolean => {
  const playerTurnsForWin = Math.ceil(
    boss.hp / Math.max(player.damage - boss.armor, 1)
  );
  const bossTurnsForWin = Math.ceil(
    player.hp / Math.max(boss.damage - player.armor, 1)
  );

  return playerTurnsForWin <= bossTurnsForWin;
};
```

We can calculate the total turns it would take for both the player and boss to win; and then providing the players turn total is less than or equal to the bosses (as the player goes first) we can be sure the player has won.
With the ability to now simulate a battle in place, we can go about solving the question laid out in part one.
Generating all the possible valid player configurations we can filter down to only the ones that the player wins.
From here, we return the minimal cost of those player configurations, leading us to our answer 🌟.

```typescript
const part1 = (input: string): number => {
  const items = parseShopItems(ITEMS);
  const boss = parseBossConfiguration(input);

  return Math.min(
    ...generatePlayerConfigurations(items)
      .filter(player => isPlayerWinner(player, boss))
      .map(({ cost }) => cost)
  );
};
```

### Part 2

For part two, we are asked to determine what is the most amount of gold we could spend and still lose the fight.
We can re-use all the functionality we built up for part one, except this time we wish to only include games the player loses.
From these lost games we can determine the highest costing player configuration 🌟.

```typescript
const part2 = (input: string): number => {
  const items = parseShopItems(ITEMS);
  const boss = parseBossConfiguration(input);

  return Math.max(
    ...generatePlayerConfigurations(items)
      .filter(player => !isPlayerWinner(player, boss))
      .map(({ cost }) => cost)
  );
};
```
