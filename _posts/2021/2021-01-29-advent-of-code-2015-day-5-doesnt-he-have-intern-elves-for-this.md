---
layout: post
title: "Advent of Code 2015 - Day 5 - Doesn't He Have Intern-Elves For This?"
meta: 'Solving the Advent of Code 2015 Day 5 puzzle using TypeScript'
---

On the fifth day of Advent of Code 2015 Santa needs help figuring out which strings in his text file are _naughty or nice_ - a.k.a best load up a [Regular Expression tester](https://regex101.com/)!

<!--more-->

### Part 1

For part one we are supplied several rules which when combined constitute the supplied string being _nice_.
String validation rules such as this lend themselves well to Regular Expression pattern matching.

```typescript
const part1 = (input: string): number => {
  const isNice = (line: string) => {
    const totalVowels = line.match(/[aeiou]/g)?.length || 0;
    const hasRepeatedLetter = /([a-z])\1/.test(line);
    const hasRestrictedSequence = /(ab|cd|pq|xy)/.test(line);

    return totalVowels >= 3 && hasRepeatedLetter && !hasRestrictedSequence;
  };

  return input.split('\n').filter(isNice).length;
};
```

To tally up all the provided strings (seperated by new-lines) we define a predicate function (`isNice`) used within a filter; returning the resulting lists length.

The predicate function itself validates three seperate rules.
The first of which tallies up all the vowels that are present within the string, of-which we verify that at least three are present.
For the second rule we ensure that their exists at least one repeated letter pair (such as `aa` or `bb`).
To achieve this we use a [back-reference](https://www.regular-expressions.info/backref.html), that based on a supplied numbered group (in this case a single letter `[a-z]`) will ensure that the captured value is present in-place of the back-reference location.
The final rule ensures that no restricted letter sequences are present in the string.

When we combine all these sub-rules together we are able to validate if a string is indeed nice.
From here we can filter down the listing and find the answer total we are looking for 🌟.

### Part 2

For the next part we are asked to revise the rules which dictate how we determine a nice string, and evalulate the list again.

```typescript
const part2 = (input: string): number => {
  const isNice = (line: string) => {
    const hasRepeatedPairWithoutOverlap = /([a-z]{2})[a-z]*\1/.test(line);
    const hasTripletWithRepeatedStartAndEnd = /([a-z])[a-z]\1/.test(line);

    return hasRepeatedPairWithoutOverlap && hasTripletWithRepeatedStartAndEnd;
  };

  return input.split('\n').filter(isNice).length;
};
```

We now need to harness back-references in both defined pattern matches.
In the first instance we now wish to ensure that at least one repeated pair sequence exists (i.e. `abcdeab`, `abab`), however, cases of overlapping must be excluded (such as `aaa` or `bbb`).
To achieve this we capture groups of two letters, and then ensure that zero or more letters appear before we see this capture groups value again.
The second rule requires that the string must include a letter triplet which contains the same letter at the start and end.
Again, we can harness a back-reference to capture the starting letter, ensure that a single letter appears in the middle and finally validate that the captured value is present at the end.

When we combine these sub-rules together we are then able to validate the string listing again, tallying up how many strings are now deemed nice 🌟.
