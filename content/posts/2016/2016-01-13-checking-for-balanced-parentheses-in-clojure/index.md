---
layout: post
title: 'Checking for Balanced Parentheses in Clojure'
meta: 'Discover a simple and efficient method to check for balanced parentheses in Clojure using recursion and the cond macro.'
tags: ['clojure', 'algorithms']
---

This lunchtime I decided to implement a solution to the balanced parentheses (brackets) problem in Clojure.
Looking at the code below, you can see that I took advantage of the `cond` macro to more clearly express the recursive algorithm's intent.
I have also provided a couple of test assertions which are stored in the vars metadata and called using the core library's `test` function.

<!--more-->

```clojure
(defn balanced?
  {:test #(do
            (assert (true? (balanced? "(hello(world))")))
            (assert (false? (balanced? "he)llo()world"))))}
  ([expr] (balanced? (clojure.string/split expr #"") 0))
  ([[x & xs] count]
    (cond (neg? count) false
          (nil? x) (zero? count)
          (= x "(") (recur xs (inc count))
          (= x ")") (recur xs (dec count))
          :else (recur xs count))))

(test #'balanced?) ; :ok
```
