---
layout: post
title: 'Promisifying Error-First Asynchronous Callbacks in JavaScript'
meta: 'Learn how to abstract asynchronous error-first callbacks in Node.js into Promises for cleaner, modern JavaScript code.'
tags: ['javascript']
---

I have been writing a lot about Promises in JavaScript over the past couple of weeks.
What happens, however, when you wish to use an asynchronous function that does not return a Promise, such as those found in Node.js?
It is actually quite simple to abstract away the error-first asynchronous function callback into a Promise we can handle.

<!--more-->

```js
const promisify =
  fn =>
  (...args) =>
    new Promise((res, rej) =>
      fn(...args, (err, val) => (err ? rej(err) : res(val)))
    );
```

We are now able to wrap a function that uses the error-first callback paradigm into a Promise, as demonstrated below.

```js
promisify(fs.readFile)('./hello.txt', 'utf8')
  .then(console.log)
  .catch(console.error);
// Hello, world!
```
