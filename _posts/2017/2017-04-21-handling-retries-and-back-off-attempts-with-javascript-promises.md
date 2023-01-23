---
layout: post
title: 'Handling Retries and Back-off Attempts with JavaScript Promises'
canonical: https://tech.mybuilder.com/handling-retries-and-back-off-attempts-with-javascript-promises/
meta: 'Looking into handling Retries and Back-off Attempts with JavaScript Promises'
---

Promises are an invaluable abstraction around 'eventual' results within asynchronous operations.
I recently had the need to be able to retry a Promise-based action in the event of a failure.
It turned out to be very easy to implement such a process using simple recursive constructs.

<!--more-->

Initially I only required the ability to retry a desired amount of times, before eventually failing if still unsuccessful.
You can see how easy it was to describe this problem in Promise-form within the function below.

```js
const retry = (retries, fn) =>
  fn().catch(err => (retries > 1 ? retry(retries - 1, fn) : Promise.reject(err)));
```

However, what I eventually required was the ability to 'back-off' and provide an increasing grace-period between the operation attempts.
Again, it was very easy to describe this within a Promise as shown below.

```js
const pause = duration => new Promise(res => setTimeout(res, duration));

const backoff = (retries, fn, delay = 500) =>
  fn().catch(err =>
    retries > 1 ? pause(delay).then(() => backoff(retries - 1, fn, delay * 2)) : Promise.reject(err)
  );
```

As you can see, both implementations use a recursive structure with decrementing `retries` to hit the base-case.
What I find so impressive with the Promise abstraction is how easy it is to codify complex problems such as this with minimal code.

### Demo

Below you can see a JSBin demo which uses an intentionally unreliable Promise to exercise the two functions retrying behaviour.

<a class="jsbin-embed" href="http://jsbin.com/topagew/1/embed?js,output">JS Bin on jsbin.com</a><script src="http://static.jsbin.com/js/embed.min.js?3.41.10"></script>
