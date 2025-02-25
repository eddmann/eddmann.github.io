---
layout: post
title: 'Promisifying Error-First Asynchronous Callbacks in JavaScript'
meta: 'Abstracting asynchronous error-first callbacks found in Node into a Promise'
---

I have been writing a lot about Promises in JavaScript the past couple of weeks.
What happens however, when you wish to use an asynchronous function which does not return a Promise, such as those found in Node?
It is actually pretty simple to abstract away the error-first asynchronous function callback into a Promise we can handle.

<!--more-->

```js
const promisify =
  fn =>
  (...args) =>
    new Promise((res, rej) =>
      fn(...args, (err, val) => (err ? rej(err) : res(val)))
    );
```

We are now able to wrap a function which uses the error-first callback paradigm into a Promise, as demoed below.

```js
promisify(fs.readFile)('./hello.txt', 'utf8')
  .then(console.log)
  .catch(console.error);
// Hello, world!
```
