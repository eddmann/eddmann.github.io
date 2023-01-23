---
layout: post
title: 'Throttling and Debouncing Function Invocation in JavaScript'
link: https://tech.mybuilder.com/throttling-and-debouncing-function-invocation-in-javascript/
meta: 'Looking into Throttling and Debouncing Function Invocation in JavaScript'
---

Whilst working on resolving a recent JavaScript event handler bug, it deemed necessary to implement a form of throttling to make sure a race-condition would not occur.
Throughout the fix I found myself seeking a clear definition of what both `throttling` and `debouncing` a function actually entailed; as it can be very easy to mix the two subtly different concepts.

<!--more-->

### Throttling

Throttling is beneficial when you wish to prevent sequential function invocation within a defined time-frame.
In the case of the scrolling example below, as the scroll handler is being fired many times sequentially - we have decided to throttle the invocation of the event handler to every 500ms.
An trivial implementation of such a throttling function is provided below.

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

### Debouncing

Debouncing is beneficial when you wish to prevent a function from being invoked, if it is still being called within a defined time-frame.
This provides you with the confidence that the specified function will be invoked once upon completion of however many sequential call-attempts have been made.
In the case of the scrolling example below, as the scroll handler is being fired many times sequentially - we have decided to debounce the invocation of the function to occur 500ms after the final call has been made.
An trivial implementation of such a debouncing function is provided below.

```js
const debounce = (fn, delay) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
};
```

### Scrolling Example

You can clearly differentiate between the two techniques whilst experimenting with the example below.
This highlights how and when the function invocations occur, based on the choice of throttling or debouncing.

<a class="jsbin-embed" href="http://jsbin.com/luxopeforu/embed?console,output">JS Bin on jsbin.com</a><script src="http://static.jsbin.com/js/embed.min.js?3.40.2"></script>
