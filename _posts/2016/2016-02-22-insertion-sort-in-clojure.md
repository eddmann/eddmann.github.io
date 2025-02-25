---
layout: post
title: 'Insertion-sort in Clojure'
meta: 'Implementing the Insertion-sort algorithm in Clojure'
---

The next sorting algorithm I have decided to explore is the Insertion-sort.
This sorting technique can be completed in-place, however, using Clojure we will instead be using a `reduce` to accumulate the final sorted collection.
Each element is iteratively inserted into a 'new' collection which maintains a sorted invariant as shown in the implementation documented below.

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

The `reduce` provides us with the infrastructure required around accumulating and iterating over each element within the provided collection.
The use of a private helper function gives us the ability to correctly insert the target element within the resulting collection.
