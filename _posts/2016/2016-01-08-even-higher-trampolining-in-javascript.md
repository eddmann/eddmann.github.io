---
layout: post
title: 'Even Higher Trampolining in JavaScript'
meta: 'Discover advanced trampolining techniques in JavaScript with an enhanced abstraction for managing function return types, improving both clarity and performance.'
tags: javascript functional-programming
---

The concept of _trampolining_ seems to have been a running trend throughout this week.
I noted in my initial post on implementing trampolining in JavaScript that I would document a revised version capable of handling the case when a function is the desired return type. <!--more-->
Taking an idea found in the Clojure documentation for this function, I decided to provide a simple abstraction over the process which wraps the _thunk_ or _result_ in a two-element array data structure.
This allows us to pass along the additional knowledge of whether the user's desired action is to continue ('cont') or complete ('done') back to the trampoline, so that we can make the correct decision.
This approach also has the added bonus of being more expressive in its intent, thanks to the additional functions being used.

```js
const trampoline = bounce => {
  let [isRunning, value] = bounce;

  while (isRunning) {
    [isRunning, value] = value();
  }

  return value;
};
trampoline.cont = thunk => [true, thunk];
trampoline.done = result => [false, result];
```

```js
const odd = n =>
  n == 0 ? trampoline.done(false) : trampoline.cont(() => even(n - 1));
const even = n =>
  n == 0 ? trampoline.done(true) : trampoline.cont(() => odd(n - 1));

trampoline(odd(4));
```
