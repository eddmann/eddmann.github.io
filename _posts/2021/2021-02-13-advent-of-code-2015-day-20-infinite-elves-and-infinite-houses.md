---
layout: post
title: 'Advent of Code 2015 - Day 20 - Infinite Elves and Infinite Houses'
meta: 'Solving the Advent of Code 2015 Day 20 puzzle using TypeScript'
---

On the twentieth day of Advent of Code 2015 we are asked to help work out how many presents the Elves will deliver to specific houses.

<!--more-->

### Part 1

To keep the Elves busy, Santa has them deliver some presents by hand, door-to-door.
He sends them down a street with infinite houses numbered sequentially: 1, 2, 3, 4, 5, and so on.
Each Elf is assigned a number, too, and delivers presents to houses based on that number.
There are infinitely many Elves, numbered starting with 1.
Each Elf delivers presents equal to ten times his or her number at each house.

For part one we are asked to determine what is the lowest house number which will receive at least _29000000 presents_.
To tackle this problem we could opt for a brute-force approach storing each house in-memory and iterating through each Elves deliveries.
However, upon closer inspection you will see that each house is visited by the Elves which share their factors.
As such, we can devise a [Factors function](https://rosettacode.org/wiki/Factors_of_an_integer) which optimally determines which Elves visited a given house number.

```typescript
const elvesWhoVisited = (houseNo: number): number[] => {
  const elves = houseNo > 1 ? [1, houseNo] : [1];

  for (let elf = 2; elf <= Math.sqrt(houseNo); elf++) {
    if (houseNo % elf === 0) {
      elves.push(elf);
      if (elf ** 2 !== houseNo) elves.push(houseNo / elf);
    }
  }

  return elves;
};
```

With the ability to determine which Elves visited a given house we can increment through each house number (starting at 1) until we reach a house where-by the presents the Elves delivered (10 times their own number) is greater than the supplied input.
We can then return this house number to answer part one 🌟.

```typescript
const part1 = (input: string): number => {
  const numOfPresents = toInt(input);
  const presentsPerHouse = 10;

  let houseNo = 1;
  while (true) {
    const elves = elvesWhoVisited(houseNo);
    if (elves.reduce(sum) * presentsPerHouse >= numOfPresents) break;
    houseNo += 1;
  }

  return houseNo;
};
```

### Part 2

For part two, there is an imposed limit on the amount of houses a given Elf can deliver presents to (which is now 50).
Along with this restriction, the total presents per house an Elf delvers is now 11.
We are asked to now determine what is the new lowest house number which will receive at least _29000000 presents_.

To achieve this we can borrow a lot of the logic implemented for part one; except now we must filter out only the Elves which have not exceeded the 50 house quota.
In doing this we can return the desired answer 🌟.

```typescript
const part2 = (input: string): number => {
  const numOfPresents = toInt(input);
  const presentsPerHouse = 11;
  const maxDeliveriesPerElf = 50;

  let houseNo = 1;
  while (true) {
    const elves = elvesWhoVisited(houseNo).filter(
      elf => houseNo / elf <= maxDeliveriesPerElf
    );
    if (elves.reduce(sum) * presentsPerHouse >= numOfPresents) break;
    houseNo += 1;
  }

  return houseNo;
};
```
