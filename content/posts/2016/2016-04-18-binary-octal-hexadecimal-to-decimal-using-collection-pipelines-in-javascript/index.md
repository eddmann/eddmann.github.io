---
layout: post
title: 'Binary/Octal/Hexadecimal to Decimal using Collection Pipelines in JavaScript'
meta: 'Learn how to convert binary, octal, and hexadecimal numbers to decimal using collection pipelines in JavaScript.'
tags: ['javascript', 'functional-programming']
---

In a recent [tweet](https://twitter.com/adamwathan/status/720432624548900864) from Adam Wathan, highlighting one of the examples in his [upcoming book](http://adamwathan.me/refactoring-to-collections/), he demonstrated breaking down the process of converting from binary to decimal representation using a pipeline of transformations.
I thought it would be interesting to see how I would go about performing this process in JavaScript.

<!--more-->

## Binary

I began by implementing the binary to decimal function, following the signature present in PHP's `bindec` function.

```js
const bindec = binary =>
  binary
    .split('')
    .reverse()
    .reduce((acc, bin, exp) => (bin === '0' ? acc : acc + Math.pow(2, exp)), 0);

bindec('1100100'); // 100
```

Looking at the implementation above, you will notice how we are able to break up the problem into a list of transformations.
Starting by splitting up the string binary representation into characters, we then reverse this sequence and reduce the collection down into the single decimal result.

## Octal

From here, I decided to see how easy it would be to re-create the `octdec` function.

```js
const octdec = octal =>
  octal
    .split('')
    .reverse()
    .reduce(
      (acc, oct, exp) => (oct === '0' ? acc : acc + oct * Math.pow(8, exp)),
      0
    );

octdec('144'); // 100
```

Again, following a similar shape to the transformations present in the previous example, we only have to update the logic present in the reduce phase.

## Hexadecimal

Finally, I decided to explore an implementation to convert hexadecimal representations into decimal.
This transformation pipeline requires an additional mapping phase to transform the alphabetical representations (A to F) into their decimal equivalents.

```js
const hexdec = hexadecimal =>
  hexadecimal
    .split('')
    .reverse()
    .map(''.indexOf.bind('0123456789ABCDEF'))
    .reduce(
      (acc, hex, exp) => (hex === 0 ? acc : acc + hex * Math.pow(16, exp)),
      0
    );

hexdec('64'); // 100
```
