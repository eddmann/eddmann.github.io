---
layout: post
title: 'Arabic to Roman Numerals converter in JavaScript'
meta: 'Converting from Hindu-Arabic to Roman Numerals, taking advantage of ES2015 features'
---

Having an hour to spare recently I decided to solve the common problem of converting from Hindu-Arabic to Roman numerals. <!--more-->
Below are two different solutions to solving this problem, taking advantage of many ES2015 additions in the process.
Both implementations use the lookup table provided below to handle translation of the seven symbols, along with the subtractive form used to avoid four characters being repeated in a row.

```js
const chart = [
  ['M', 1000],
  ['CM', 900],
  ['D', 500],
  ['CD', 400],
  ['C', 100],
  ['XC', 90],
  ['L', 50],
  ['XL', 40],
  ['X', 10],
  ['IX', 9],
  ['V', 5],
  ['IV', 4],
  ['I', 1],
];
```

## Solution 1

```js
const toRoman = decimal =>
  chart.reduce(
    (acc, numeral) => {
      const [roman, remainder] = acc;
      const [letter, value] = numeral;
      return [roman + letter.repeat(remainder / value), remainder % value];
    },
    ['', decimal]
  )[0];
```

The solution above uses the higher-order fold function to `reduce` the supplied Arabic number into a Roman numeral equivalent.
Combined with using a two element array as a form of tuple that we are able to deconstruct at each level, this forms a very descriptive implementation.

## Solution 2

```js
const toRoman = decimal => {
  function recur(remainder, chart) {
    if (remainder == 0) return '';
    const [[numeral, value], ...tail] = chart;
    return numeral.repeat(remainder / value) + recur(remainder % value, tail);
  }

  return recur(decimal, chart);
};
```

The second solution follows a typical head-tail recursive pattern, taking advantage of the call-stack to return the built-up translation.
Deconstruction has been taken even further in this example, highlighting how it is possible to pull out not only a single element but elements within elements from an array subject.
