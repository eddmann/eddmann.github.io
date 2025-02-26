---
layout: post
title: 'Insertion Sort in Clojure'
meta: 'Learn how to implement the Insertion Sort algorithm in Clojure using a functional approach.'
tags: clojure algorithms functional-programming
---

The next sorting algorithm I have decided to explore is the Insertion Sort.
This sorting technique can be completed in-place.
However, using Clojure, we will instead use `reduce` to accumulate the final sorted collection.
Each element is iteratively inserted into a 'new' collection, which maintains a sorted invariant, as shown in the implementation documented below.

<!--more-->

```clojure
(defn insertion-sort [xs]
  (letfn [(insert [col x]
            (loop [[y & ys] col acc []]
              (cond
                (nil? y) (conj acc x)
                (<= x y) (vec (concat acc [x y] ys))
                :else (recur ys (conj acc y)))))]
    (reduce insert [] xs)))

(insertion-sort [3 2 1]) ; [1 2 3]
```

The `reduce` function provides us with the necessary infrastructure for accumulating and iterating over each element within the provided collection.
The use of a private helper function allows us to correctly insert the target element into the resulting collection.
