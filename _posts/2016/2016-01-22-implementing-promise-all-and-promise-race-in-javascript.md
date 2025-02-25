---
layout: post
title: 'Implementing Promise.all and Promise.race in JavaScript'
meta: 'Explaining solutions to implementing Promise.all and Promise.race in JavaScript'
---

Throughout the past couple of months much of the JavaScript development I have been involved with has revolved around [Promises](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise).
Promises are a simple abstraction to handle deferred and asynchronous computations.
This lunchtime I decided to see how one would go about implementing two concepts that are present in the Promise standard ([`all`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/all) and [`race`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/race)).

<!--more-->

## Promise.all

This function is used to compose multiple supplied promises into a single returned promise that provides the resulting values in array form.
Looking at the implementation documented below you can see how relativity easy it is to compose these promises together, adding logic in-between resolutions to accumulate the final value returned.

```js
const all = (...promises) => {
  const results = [];

  const merged = promises.reduce(
    (acc, p) => acc.then(() => p).then(r => results.push(r)),
    Promise.resolve(null)
  );

  return merged.then(() => results);
};
```

We are able to use this solution in a couple of contrived examples, initially highlighting the 'happy path' of three separate promises being resolved, before moving on to handling the case were a promise is rejected.

```js
const p1 = Promise.resolve('foo');
const p2 = 'bar';
const p3 = new Promise((res, rej) => {
  setTimeout(res, 100, 'baz');
});

all(p1, p2, p3).then(([a1, a2, a3]) => console.log(a1, a2, a3));
// "foo" "bar" "baz"

const p4 = Promise.reject('qux');

all(p1, p2, p3, p4)
  .then(([a1, a2, a3]) => console.log(a1, a2, a3))
  .catch(e => console.log(e));
// "qux"
```

## Promise.race

Following on from the `all` implementation we are able to implement the `race` function that is also present in the standard.
This function returns the first complete (resolved or rejected) promise from a supplied collection.
Wrapping the supplied promises within a new promise who's resolved and rejected function are called based on their actions, allows you to see how the race condition works.

```js
const race = (...promises) =>
  new Promise((res, rej) => {
    promises.forEach(p => p.then(res).catch(rej));
  });
```

We are able to highlight this implementation in an example, first depicting the 'happy path', followed by a rejection which is returned due to 'winning the race'.

```js
const p1 = new Promise((res, rej) => {
  setTimeout(res, 100, 'foo');
});
const p2 = new Promise((res, rej) => {
  setTimeout(res, 200, 'bar');
});

race(p1, p2).then(a => console.log(a)); // "foo"

const p3 = new Promise((res, rej) => {
  setTimeout(rej, 50, 'baz');
});

race(p1, p2, p3)
  .then(a => console.log(a))
  .catch(e => console.log(e)); // "baz"
```
