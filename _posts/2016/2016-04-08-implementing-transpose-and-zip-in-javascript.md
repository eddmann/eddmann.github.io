---
layout: post
title: 'Implementing Transpose and Zip in JavaScript'
meta: "Looking into the application of 'transpose' and 'zip' on collections in JavaScript"
---

In a recent [Full Stack Radio](http://www.fullstackradio.com/39) podcast, discussion around the application of `transpose` and `zip` on collections made me wonder how I would go about implementing such a feature in JavaScript. <!--more-->
The concept behind 'transpose' is to turn a multi-dimensional array's rows into columns and vice-versa.
I typically think of a 'zip' as a limited form of this, handling only two collections, but having the added bonus of permitting collections of different length.
This can be resolved by either padding out the arrays with empty values, or only including elements up-to the shortest collections length.

I decided that I would be a little lenient in my implementation and create a single function that could handle nth-collections of differing lengths.
The first implementation below achieves this by only including elements up-to the shortest collections length.

```js
const shortest = (a, b) => (a.length < b.length ? a : b);

const zip = (...arrs) =>
  arrs.reduce(shortest).map((_, idx) => arrs.map(arr => arr[idx]));

zip(['a', 'b', 'c'], [1, 2, 3]);
// [['a', 1], ['b', 2], ['c', 3]]
```

The implementation below instead pads out arrays which are not of the maximum length with empty values.

```js
const longest = (a, b) => (a.length > b.length ? a : b);

const zipLongest = (...arrs) =>
  arrs.reduce(longest).map((_, idx) => arrs.map(arr => arr[idx]));

zipLongest(['a', 'b', 'c', 'd'], [1, 2, 3]);
// [['a', 1], ['b', 2], ['c', 3], ['d', undefined]]
```

An interesting use-case that was discussed was being able to easily create a collection which includes the element along with their successor/predecessor.
This can be useful in cases were (upon iteration) a decision is dependent on the elements neighboring values.

```js
const alpha = ['a', 'b', 'c', 'd', 'e', 'f'];

// elements with successor
zip(alpha, alpha.slice(1));

// elements with predecessor
zip(alpha, [undefined, ...alpha.slice(0, alpha.length - 1)]);
```
