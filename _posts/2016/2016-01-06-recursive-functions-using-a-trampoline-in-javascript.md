---
layout: post
title: 'Recursive Functions using a Trampoline in JavaScript'
meta: 'Learn how to implement recursive functions using trampolining in JavaScript, enabling tail-call optimisation even in environments without native support.'
tags: javascript functional-programming
---

An interesting technique for managing perceived tail-call optimised algorithms in an environment that does not provide such capabilities is to use a concept called a _trampoline_.
The following two examples provide all their work within the recursive function invocation and are in tail-call position.
However, in environments without such optimisations (before ES2015), a single stack frame is not reused and instead incurs the burden of O(n) memory complexity.

<!--more-->

## Odd and Even

The mutually recursive implementation documented below is a trivial manner in which to calculate whether a given value is odd or even.
It should be noted that modulo arithmetic would be a more performant approach, but it would not highlight the issue at hand.

```js
const odd = n => (n === 0 ? false : even(n - 1));
const even = n => (n === 0 ? true : odd(n - 1));

odd(100000);
// RangeError: Maximum call stack size exceeded
```

As you can see, we unfortunately hit the call stack limit with a sufficiently large value.
However, with a technique called 'trampolining' we are able to return to the desired single call stack frame, with the larger heap taking the load.

```js
const trampoline = fn => {
  while (typeof fn === 'function') {
    fn = fn();
  }
  return fn;
};
```

The above implementation does not handle the use case where the desired returned value is a function itself.
This can be easily addressed, however, with a more advanced implementation, of which I will write about in a [future article](/posts/even-higher-trampolining-in-javascript/).

```js
const odd = n => () => n === 0 ? false : even(n - 1);
const even = n => () => n === 0 ? true : odd(n - 1);

trampoline(odd(100000));
```

Simply by wrapping the two recursive calls in functions we are able to supply the initial call to the trampoline function and enjoy the fruits of our labour.

## Factorial

Another example of what could be deemed tail-call optimised is the factorial implementation documented below.

```js
const factorial = (n, acc = 1) => (n < 2 ? acc : factorial(n - 1, n * acc));

// factorial(100000);
// RangeError: Maximum call stack size exceeded
```

However, this is similarly not the case - but with a little function wrapper addition and invocation via the _trampoline_ method we are able to maintain the succinct nature of the algorithm whilst gaining the benefit of a single stack frame.
The only point to note is that a computational result such as this will require the concept of a `BigInt` to be achieved.

```js
const factorial =
  (n, acc = 1) =>
  () =>
    n < 2 ? acc : factorial(n - 1, n * acc);

trampoline(factorial(100000)); // BigInt required
```
