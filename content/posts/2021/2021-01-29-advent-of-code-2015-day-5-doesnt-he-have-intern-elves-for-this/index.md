---
layout: post
title: "Advent of Code 2015 - Day 5 - Doesn't He Have Intern-Elves For This?"
meta: 'Solving the Advent of Code 2015 Day 5 puzzle using TypeScript.'
tags: ['advent-of-code', 'advent-of-code-2015', 'typescript']
---

On the fifth day of Advent of Code 2015, Santa needs help figuring out which strings in his text file are _naughty or nice_ - a.k.a best load up a [Regular Expression tester](https://regex101.com/)!

<!--more-->

## Part 1

For part one, we are supplied with several rules which, when combined, determine whether the given string is _nice_.
String validation rules such as these lend themselves well to Regular Expression pattern matching.

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

To tally up all the provided strings (separated by new lines), we define a predicate function (`isNice`) used within a filter, returning the resulting list's length.

The predicate function itself validates three separate rules.
The first of which tallies up all the vowels that are present within the string, ensuring that at least three are present.
For the second rule, we ensure that there exists at least one repeated letter pair (such as `aa` or `bb`).
To achieve this, we use a [back-reference](https://javascript.info/regexp-backreferences), which, based on a supplied numbered group (in this case, a single letter `[a-z]`), ensures that the captured value is present in place of the back-reference location.
The final rule ensures that no restricted letter sequences are present in the string.

When we combine all these sub-rules, we can validate whether a string is indeed nice.
From here, we can filter down the listing and find the answer total we are looking for 🌟.

We can alternatively leverage more features provided to us by Regular Expressions and solve the problem within a single pattern like so:

```typescript
const part1 = (input: string): number =>
  input.match(
    /^(?=(?:.*[aeiou].*){3,})(?=.*(.)\1.*)(?!.*(?:ab|cd|pq|xy).*).*/gm
  ).length;
```

Using the [multiline mode](https://javascript.info/regexp-multiline-mode), we change the behaviour of `^` so that instead of matching only the start of a string, it matches the start of each line.
Combined with three [lookahead](https://javascript.info/regexp-lookahead-lookbehind) patterns, we validate each line as follows:

- `(?=(?:.*[aeiou].*){3,})` - We look for the presence of at least three `aeiou` character matches anywhere on the line.
- `(?=.*(.)\1.*)` - We ensure that a repeated letter pair appears anywhere on the line.
- `(?!.*(?:ab|cd|pq|xy).*)` - Finally, we ensure that none of the restricted letter sequences appear on the line (using a negative lookahead).

Using lookaheads in this manner provides us with a form of `AND` logic, allowing us to evaluate the entire line multiple times.
Although this demonstrates how powerful Regular Expressions can be, I still prefer the first solution due to its readability.

## Part 2

For the next part, we are asked to revise the rules that dictate how we determine a nice string and evaluate the list again.

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
In the first instance, we must ensure that at least one repeated pair sequence exists (e.g., `abcdeab`, `abab`); however, cases of overlapping must be excluded (such as `aaa` or `bbb`).
To achieve this, we capture groups of two letters and then ensure that zero or more letters appear before we see this captured group's value again.
The second rule requires that the string includes a letter triplet that contains the same letter at the start and end.
Again, we use a back-reference to capture the starting letter, ensure that a single letter appears in the middle, and finally validate that the captured value is present at the end.

When we combine these sub-rules, we can validate the string listing again, tallying up how many strings are now deemed nice 🌟.

Again, we can alternatively leverage more features provided to us by Regular Expressions and solve the problem within a single pattern like so:

```typescript
const part2 = (input: string): number =>
  input.match(/^(?=.*(..).*\1)(?=.*(.).\2.*).*/gm).length;
```

Using multiline mode, lookahead patterns, and back-references, we evaluate each line based on the given rules as follows:

- `(?=.*(..).*\1)` - We first ensure that at least one repeated pair sequence exists somewhere within the line.
- `(?=.*(.).\2.*)` - We also ensure that there exists a letter triplet that contains the same letter at the start and end within the line.

Combined, these patterns form our validation logic, allowing us to match and return the total number of lines that conform to the rule set.
