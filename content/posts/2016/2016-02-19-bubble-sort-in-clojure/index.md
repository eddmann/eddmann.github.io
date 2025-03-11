---
layout: post
title: 'Bubble Sort in Clojure'
meta: 'Learn how to implement the Bubble Sort algorithm in Clojure using a functional approach.'
tags: ['clojure', 'algorithms', 'functional-programming']
---

Following on with my exploration into implementing common sorting algorithms in Clojure, today we have the Bubble Sort.
This sort works by iteratively passing through the supplied sequence, swapping the current element with the next if it is comparably greater.
The operation is complete when a pass through the sequence does not result in a swap occurring.

<!--more-->

```clojure
(defn- bubble [ys x]
  (if-let [y (peek ys)]
    (if (> y x)
      (conj (pop ys) x y)
      (conj ys x))
    [x]))

(defn bubble-sort [xs]
  (let [ys (reduce bubble [] xs)]
    (if (= xs ys)
      xs
      (recur ys))))

(bubble-sort [3 2 1]) ; [1 2 3]
```

Looking at the implementation above, you will notice we use a `reduce` operation with a private `bubble` function, which provides us with the pass through the sequence.
Upon each pass, the result is checked against the input to see if a swap has occurred.
In the case of them both being equal, we have completed the sorting process.
