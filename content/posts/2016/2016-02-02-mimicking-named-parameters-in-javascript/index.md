---
layout: post
title: 'Mimicking Named Parameters in JavaScript'
meta: 'Learn how to use object destructuring in ES2015 to implement a form of named parameters in JavaScript for cleaner, more readable code.'
summary: "Whilst working today, I came across a test helper function that required a few too many parameters. Debating whether to break the function up, I decided that an elegant solution would be to take advantage of ES2015 object destructuring and produce a form of 'Named Parameters'."
tags: ['javascript']
---

Whilst working today, I came across a test helper function that required a few too many parameters.
Debating whether to break the function up, I decided that an elegant solution would be to take advantage of ES2015 object destructuring and produce a form of 'Named Parameters'.
We are all very familiar with code in the past that looks like this:

```js
const foo = opts => {
  opts = Object.assign({ x: 10, y: 20 }, opts);
  return `${opts.x}, ${opts.y}`;
};
foo({ x: 5 }); // 5, 20
```

Although it provides us with the public API that we desire, the internal implementation requires boilerplate that I feel takes away from the problem the function is trying to solve.
However, with the introduction of ES2015, we are able to take advantage of object destructuring and rewrite this code to be:

```js
const foo = ({ x = 10, y = 20 }) => `${x}, ${y}`;
foo({ y: 15 }); // 10, 15
```

We can also produce dynamic default values based on other supplied inputs, such as in this contrived example:

```js
const foo = ({ x = 10, y = 2 * x }) => `${x}, ${y}`;
foo({ x: 4 }); // 4, 8
```
