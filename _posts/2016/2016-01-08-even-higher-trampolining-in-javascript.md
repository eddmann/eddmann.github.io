---
layout: post
title: 'Even Higher Trampolining in JavaScript'
meta: "Expanding on a previous article's trampoline implementation using a simple abstraction"
---

The concept of 'trampolining' seems to have been a running trend throughout this week.
I noted in the initial article discussing an implementation using JavaScript that I would document a revised version that would handle the use-case of a function being the desired return type. <!--more-->
Taking an idea found in the Clojure documentation for this said function, I decided to provide a simple abstraction over the process which wraps the 'thunk' or 'result' in a two-element array data-structure.
This allows us to pass along the additional knowledge of whether the users desired action is to continue ('cont') or complete ('done') back to the trampoline, so we can make the correct decision.
This approach also has the added bonus of being more expressive in its intent, thanks to these additional functions being used.

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
