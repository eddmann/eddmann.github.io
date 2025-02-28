---
layout: post
title: 'Advent of Code 2015 - Day 22 - Wizard Simulator 20XX'
meta: 'Solving the Advent of Code 2015 Day 22 puzzle using TypeScript'
tags: advent-of-code advent-of-code-2015 typescript
---

On the twenty second day of Advent of Code 2015 we are asked to help 'Little Henry Case' beat the boss in another video game he is stuck on.

<!--more-->

## Part 1

Like the [previous day](https://eddmann.com/posts/advent-of-code-2015-day-21-rpg-simulator-20xx/) the game is turn-based, however, this time we are able to spend _mana_ in-exchnage for spells we can cast per-round.
Certain spells have the ability to cause effects which can last between rounds.
Due to this, we are unable to formulise the battle into a single calculation, so instead must simulate a given battle in its entirety.
For part one, we are asked to work out what is the minimum about of _mana_ we can spend and still win the battle.

Based on the rules laid out within the [problem specification](https://adventofcode.com/2015/day/22), we begin by modeling how spells will be represented.

```typescript
type Spell = {
  name: string;
  cost: number;
  damage: number;
  armor: number;
  heal: number;
  mana: number;
  turns: number;
};

const spells: Spell[] = [
  { name: 'Magic Missile', cost: 53, damage: 4, armor: 0, heal: 0, mana: 0, turns: 1 },
  { name: 'Drain', cost: 73, damage: 2, armor: 0, heal: 2, mana: 0, turns: 1 },
  { name: 'Shield', cost: 113, damage: 0, armor: 7, heal: 0, mana: 0, turns: 6 },
  { name: 'Poison', cost: 173, damage: 3, armor: 0, heal: 0, mana: 0, turns: 6 },
  { name: 'Recharge', cost: 229, damage: 0, armor: 0, heal: 0, mana: 101, turns: 5 },
];
```

This approaches opts to normalise all the possible spell behaviours, creating no-op actions by-way of zero values.
From here, we model how we wish to store the state of a battle throughout game play.

```typescript
type BattleState = {
  playerHp: number;
  playerMana: number;
  playerArmor: number;
  bossHp: number;
  bossDamage: number;
  manaSpent: number;
  activeEffects: Spell[];
};
```

There are a couple of rules around which spells are available for a player to cast at a given point in the battle.
These include if they have enough mana to purchase the spell, and if the spell is an effect that it is either not active or on its last turn.
We will next translate these rules into a function which we can supply the current `BattleState` to and return the possible `Spell` listing.

```typescript
const hasBattleEnded = (state: BattleState) =>
  state.bossHp <= 0 || state.playerHp <= 0;

const getAvailableSpells = (state: BattleState): Spell[] => {
  if (hasBattleEnded(state)) return [];

  return spells.filter(spell => {
    const active = state.activeEffects.find(effect => spell.name === effect.name);
    return spell.cost <= state.playerMana && (!active || active.turns === 1);
  });
};
```

This leads us onto being able to start codifying the steps that a given battle round takes.
We will start by building out all the desired steps as isolated immutable state transitions.
First we will handle how we apply effects before each particpants turn.

```typescript
type BattleTransition = (state: BattleState) => BattleState;

const enactEffects: BattleTransition = state => {
  if (hasBattleEnded(state)) return state;

  return {
    ...state,
    playerMana: state.playerMana + sumProp(state.activeEffects, 'mana'),
    playerArmor: sumProp(state.activeEffects, 'armor'),
    bossHp: state.bossHp - sumProp(state.activeEffects, 'damage'),
    activeEffects: state.activeEffects.reduce(
      (effects, effect) => effect.turns > 1 ? [...effects, { ...effect, turns: effect.turns - 1 }] : effects,
      []
    ),
  };
};
```

We have used the same `sumProp` function found in the [previous days](https://eddmann.com/posts/advent-of-code-2015-day-21-rpg-simulator-20xx/) solution to help tally a collections property values.
Next, we will handle how a player's turn updates the battle state.
We supply a given `Spell` we wish the player to cast for this round, and return a `BattleTransition` similiar to enacting effects.

```typescript
const playerTurn = (spell: Spell): BattleTransition => state => {
  if (hasBattleEnded(state)) return state;

  const isSpellEffect = spell.turns > 1;

  return {
    ...state,
    playerHp: state.playerHp + (isSpellEffect ? 0 : spell.heal),
    playerMana: state.playerMana - spell.cost,
    bossHp: state.bossHp - (isSpellEffect ? 0 : spell.damage),
    manaSpent: state.manaSpent + spell.cost,
    activeEffects: isSpellEffect ? [...state.activeEffects, spell] : state.activeEffects,
  };
};
```

Following on from the players turn we can now model how a bosses turn updates the battle state.

```typescript
const bossTurn: BattleTransition = state => {
  if (hasBattleEnded(state)) return state;

  return {
    ...state,
    playerHp: state.playerHp - Math.max(state.bossDamage - state.playerArmor, 1),
  };
};
```

With the core steps in-place, modeled uniformly as `BattleTransition` types we can begin to think about how we wish stitch these together.
When reading the problem definition I thought it would be an ideal fit to employ composable state transitions.
To wire these together I've opted to use a small `pipe` helper function which works in the opposite mannor to a conventional `compose`.
Instead of being called _right-to-left_, the pipe function composes the provided functions _left-to-right_, which reads more naturally.

```typescript
const pipe = <R>(fn1: (a: R) => R, ...fns: Array<(a: R) => R>) =>
  fns.reduce((prevFn, nextFn) => value => nextFn(prevFn(value)), fn1);
```

Using this `pipe` function we can build up the steps required to complete a _round_.

```typescript
type BattleRound = (spell: Spell) => BattleTransition;

const roundOfBattle: BattleRound = spell =>
  pipe(enactEffects, playerTurn(spell), enactEffects, bossTurn);
```

With the round simulation modeled, we can go about working on a solution to how we determine the minimum mana required to win the battle.
To do this we will use a recursive function which takes in a `BattleConfiguration` and `BattleRound` function like so.

```typescript
type BattleConfiguration = Pick<BattleState, 'playerHp' | 'playerMana' | 'bossHp' | 'bossDamage'>;

const isPlayerWinner = (state: BattleState) =>
  hasBattleEnded(state) && state.playerHp > 0;

const minManaSpent = (
  configuration: BattleConfiguration,
  round: BattleRound
): number => {
  let minMana = Infinity;

  const recur = (state: BattleState): void => {
    if (state.manaSpent > minMana) return;

    if (getAvailableSpells(state).length === 0) {
      if (isPlayerWinner(state)) minMana = state.manaSpent;
      return;
    }

    for (const spell of getAvailableSpells(state)) {
      recur(round(spell)(state));
    }
  };

  recur({
    ...configuration,
    playerArmor: 0,
    manaSpent: 0,
    activeEffects: [],
  });

  return minMana;
};
```

The `BattleConfiguration` is a [subset type](https://www.typescriptlang.org/docs/handbook/utility-types.html#picktype-keys) of the `BattleState`, allowing us to supply the battle properties that define the participants characteristics.
The `BattleRound` function allows us to supply the `roundOfBattle` function we created earlier, to simulate each given rounds state transition.
To locate the minimum amount of mana required we store the current minium mana for a winning battle and _prune_ out any branches that exceed this amount until no enactable branches are remaining.
This allows us to limit the scope of the problem greatly, as upon the first winning game we have ourselves a baseline to _prune_ out any game that exceeds that mana spent.

With this in-place we can parse the bosses characteristics from the supplied input and execute the `minManaSpent` function to find the desired answer 🌟.

```typescript
const part1 = (input: string): number => {
  const [bossHp, bossDamage] = input.match(/(\d+)/gm).map(toInt);

  return minManaSpent(
    { playerHp: 50, playerMana: 500, bossHp, bossDamage },
    roundOfBattle
  );
};
```

## Part 2

For part two we are required to expand upon the game we created in part one.
We are to now create a _Hard Mode_, in-which at the start of each round the players health is now reduced by one HP.
Based on this addition we need to work out what the revised minimum mana spent can be to still win the battle.

We will first create the additional `BattleTransition` step, defining how the Hard Mode modifies the battle state.

```typescript
const applyHardMode: BattleTransition = state => ({
  ...state,
  playerHp: state.playerHp - 1,
});
```

From this, we can create a new _round of battle_ function which pipes the `BattleState` to the `applyHardMode` function before continuing on with the original game.

```typescript
const hardRoundOfBattle: BattleRound = spell =>
  pipe(applyHardMode, roundOfBattle(spell));
```

We can then use the same setup as we did for part one, instead supplying the new `hardRoundOfBattle` function instead.
In doing so we get the desired answer to the question 🌟.

```typescript
const part2 = (input: string): number => {
  const [bossHp, bossDamage] = input.match(/(\d+)/gm).map(toInt);

  return minManaSpent(
    { playerHp: 50, playerMana: 500, bossHp, bossDamage },
    hardRoundOfBattle
  );
};
```

I found today's core-problem to not take too long to devise (the minimum pruning technique), however, simulating the game took the majority of the time.
As mentioned when reading the problem definition I felt there could be a means to provide an elegant composable solution to representing the steps required to perform a round of battle.
I'm happy with how the `BattleTransition` type has been employed, lending itself well to the `pipe` operation.
Reading both the `roundOfBattle` and `hardRoundOfBattle` functions clearly express their intent and the stages of a round.
