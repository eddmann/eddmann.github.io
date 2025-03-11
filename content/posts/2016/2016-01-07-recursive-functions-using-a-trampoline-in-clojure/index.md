---
layout: post
title: 'Recursive Functions using a Trampoline in Clojure'
meta: 'Explore how Clojure utilises the trampoline to maintain a single call stack frame for efficient recursion and to avoid stack overflows.'
tags: ['clojure', 'functional-programming']
---

Following on from yesterday's post that discussed ['Trampolining' in JavaScript](../2016-01-06-recursive-functions-using-a-trampoline-in-javascript/index.md), I thought it would be interesting to see what Clojure has to offer.

<!--more-->

## Odd and Even

Using a mutually recursive algorithm such as the odd/even value checker below shows that we are still faced with stack-overflow issues when supplying a sufficiently sized input.

```clojure
(declare is-even?)

(defn is-odd? [n]
  (if (zero? n)
    false
    (is-even? (dec n))))

(defn is-even? [n]
  (if (zero? n)
    true
    (is-odd? (dec n))))

(is-odd? 10000)
; Caused by: java.lang.StackOverflowError: null
```

However, with a little function wrapper addition and the use of the _trampoline_, we are able to return to a single call stack frame being used.
This is in contrast to the O(n) memory complexity otherwise encountered.

```clojure
(declare is-even?)

(defn is-odd? [n]
  (if (zero? n)
    false
    #(is-even? (dec n))))

(defn is-even? [n]
  (if (zero? n)
    true
    #(is-odd? (dec n))))

(trampoline (is-odd? 10000))
```

Thanks to the anonymous function shorthand macro and the core `trampoline` function, there is not a lot of boilerplate required to make this algorithm more efficient.

## Factorial

We can also take advantage of the trampoline when faced with self-recursive tail-position calls.
This is useful in an environment which does not implicitly optimise for such cases.

```clojure
(defn factorial
  ([n] (factorial n 1))
  ([n acc] (if (< n 2) acc (factorial (dec n) (*' n acc)))))

(factorial 10000)
; Caused by: java.lang.StackOverflowError: null
```

It should be noted that with such a large input value, you may face an integer overflow exception before any stack overflow occurs.
To accommodate this, the use of a `BigInt` (using the `*'` function) has been incorporated.

```clojure
(defn factorial
  ([n] #(factorial n 1))
  ([n acc] (if (< n 2) acc #(factorial (dec n) (*' n acc)))))

(trampoline (factorial 10000))
```

Clojure does not provide implicit tail-call optimisation like other languages hosted on the JVM (Scala).
However, you are able to assist the compiler in explicitly specifying such a need with the use of the `recur` function.
The implementation below is very similar to the original, differing only in its use of 'recur' over the explicit function name in the tail-call positioned recursive call.

```clojure
(defn factorial
  ([n] (factorial n 1))
  ([n acc] (if (< n 2) acc (recur (dec n) (*' n acc)))))
```
