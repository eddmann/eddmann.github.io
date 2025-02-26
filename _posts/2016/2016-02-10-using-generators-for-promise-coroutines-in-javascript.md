---
layout: post
title: 'Using Generators for Promise Coroutines in JavaScript'
meta: 'Learn how to use ES2015 Generators to coordinate promise coroutines in JavaScript, providing an alternative to async/await.'
tags: javascript
---

In a [previous article](/posts/fetching-link-titles-using-promises-and-async-await-in-javascript/), I demonstrated how a new feature from ES2016 (`async`/`await` functions) could be used to help coordinate promises and execution.
However, we can instead use Generators (introduced in ES2015) to provide this feature, minus the syntactic sugar these two new keywords provide.

<!--more-->

```js
const spawn =
  fn =>
  (...args) => {
    const gen = fn(...args);
    const cont = res =>
      res.done
        ? res.value
        : Promise.resolve(res.value).then(
            val => cont(gen.next(val)),
            err => cont(gen.throw(err))
          );

    return cont(gen.next());
  };
```

By passing in a Generator function and yielding in place of `await`, we can take advantage of the control Generators provide for resuming execution.
This allows us to wait for the resolution or rejection of the yielded promise before continuing to the next yield or final value.

## Example

Below is a contrived example of using coroutines to coordinate the returned result of a collection of random promises (similar to a `Promise.all` use case).

```js
const randomPromise = value =>
  new Promise((res, rej) =>
    setTimeout(Math.random() > 0.3 ? res : rej, 1000, value)
  );

const run = spawn(function* (values) {
  const results = [];

  for (const val of values.map(randomPromise)) {
    try {
      results.push(yield val);
    } catch (e) {
      results.push(`${e} ✗`);
    }
  }

  return results;
});

console.time('run');
run(['foo', 'bar', 'baz'])
  .then(x => {
    console.log(x);
    console.timeEnd('run');
  })
  .catch(console.error);
// [ 'foo', 'bar ✗', 'baz' ]
// run: 1012ms
```
