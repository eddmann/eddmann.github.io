---
layout: post
title: 'Implementing a Cancelable Promise in JavaScript'
meta: 'Creating a Promise in JavaScript that can be cancelled'
---

I recently was working on a React component which complained about its state being set when it was not mounted.
This was due to a uncompleted promise being resolved when the component had since been unmounted.
To solve this issue I was able to use the concept of a cancelable promise which would be canceled before the component was unmounted.

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

With the above implementation we are now able to produce some contrived examples to highlight its use.

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
