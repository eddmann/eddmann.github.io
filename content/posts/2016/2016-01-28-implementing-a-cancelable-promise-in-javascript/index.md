---
layout: post
title: 'Implementing a Cancellable Promise in JavaScript'
meta: 'Learn how to implement a cancellable Promise in JavaScript to prevent React state updates on unmounted components.'
tags: ['javascript']
---

I was recently working on a React component that complained about its state being set when it was not mounted.
This was due to an uncompleted promise being resolved after the component had already been unmounted.
To solve this issue, I used the concept of a cancellable promise, which could be cancelled before the component was unmounted.

<!--more-->

```js
const cancelable = promise => {
  let hasCancelled = false;

  return {
    promise: promise.then(v => {
      if (hasCancelled) {
        throw { isCancelled: true };
      }

      return v;
    }),
    cancel: () => (hasCancelled = true),
  };
};
```

With the above implementation, we can now produce some contrived examples to highlight its use.

```js
const log = console.log.bind(console);

const delayed = (v, t) =>
  cancelable(new Promise((res, _) => setTimeout(res, t, v)));

const x = delayed('foo', 500);
setTimeout(() => x.cancel(), 250);

x.promise.then(log).catch(log); // { isCancelled: true }

const y = delayed('bar', 250);
y.promise.then(log).catch(log); // bar
```
