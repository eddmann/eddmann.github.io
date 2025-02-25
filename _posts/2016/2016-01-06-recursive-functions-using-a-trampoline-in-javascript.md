---
layout: post
title: 'Recursive Functions using a Trampoline in JavaScript'
meta: 'Using the concept of a Trampoline to maintain a single call stack frame in JavaScript'
---

An interesting technique for managing perceived tail-call optimised algorithms in an environment that does not provide such capabilities is to use a concept called a 'trampoline'.
The following two examples provide all their work within the recursive function invocation and are in tail-call position.
However in environments without such optimisations (before ES2015), a single stack-frame is not reused and instead has the pain of O(n) memory complexity.

<!--more-->

## Odd and Even

The mutually recursive implementation documented below is a trivial manner in which to calculate if a given value is odd or even.
It should be noted that modulo arithmetic would be a more performant approach, but would not highlight the issue at hand.

```js
const odd = n => (n === 0 ? false : even(n - 1));
const even = n => (n === 0 ? true : odd(n - 1));

odd(100000);
// RangeError: Maximum call stack size exceeded
```

As you can see we sadly hit the call stack size with a sufficiently sized value.
However, with a technique called 'trampolining' we are able to return to the desired single call stack frame, with the larger heap taking the load.

```js
const trampoline = fn => {
  while (typeof fn === 'function') {
    fn = fn();
  }
  return fn;
};
```

The above implementation does not handle the use-case that the desired returned value is a function itself.
This can be easily addressed however with a more advanced implementation, of which I will write about in a [future article](/posts/even-higher-trampolining-in-javascript/).

```js
const odd = n => () => n === 0 ? false : even(n - 1);
const even = n => () => n === 0 ? true : odd(n - 1);

trampoline(odd(100000));
```

Simply by wrapping the two recursive calls in functions we are able to supply the initial call to the trampoline function and enjoy the fruits of our labor.

## Factorial

Another example of which could be deemed tail-call optimised is the factorial implementation documented below.

```js
const factorial = (n, acc = 1) => (n < 2 ? acc : factorial(n - 1, n * acc));

// factorial(100000);
// RangeError: Maximum call stack size exceeded
```

However, this is similarly not the case - but with a little function wrapper addition and invocation via the 'trampoline' method we are able to maintain the succinct manner of the algorithm whilst gaining the single stack-frame.
The only point to note is a computational result such as this will require the concept of a BigInt to achieve.

```js
const factorial =
  (n, acc = 1) =>
  () =>
    n < 2 ? acc : factorial(n - 1, n * acc);

trampoline(factorial(100000)); // BigInt required
```
