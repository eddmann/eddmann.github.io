---
layout: post
title: 'Throttling and Debouncing Function Invocation in JavaScript'
meta: 'Learn the differences between throttling and debouncing in JavaScript, with practical examples and implementations for optimising function invocation in event handling.'
tags: ['javascript']
---

Whilst working on resolving a recent JavaScript event handler bug, it became necessary to implement a form of throttling to ensure a race condition would not occur.
Throughout the fix, I found myself seeking a clear definition of what both `throttling` and `debouncing` a function actually entailed, as it can be very easy to mix up these subtly different concepts.

<!--more-->

## Throttling

Throttling is beneficial when you wish to prevent sequential function invocation within a defined time frame.
In the case of the scrolling example below, as the scroll handler is being fired many times sequentially, we have decided to throttle the invocation of the event handler to every 500ms.
A trivial implementation of such a throttling function is provided below.

```js
const throttle = (fn, delay) => {
  let timer;
  return (...args) => {
    if (!timer) {
      fn(...args);
      timer = setTimeout(() => (timer = false), delay);
    }
  };
};
```

## Debouncing

Debouncing is beneficial when you wish to prevent a function from being invoked if it is still being called within a defined time frame.
This provides you with the confidence that the specified function will be invoked once upon completion of however many sequential call attempts have been made.
In the case of the scrolling example below, as the scroll handler is being fired many times sequentially, we have decided to debounce the invocation of the function to occur 500ms after the final call has been made.
A trivial implementation of such a debouncing function is provided below.

```js
const debounce = (fn, delay) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
};
```
