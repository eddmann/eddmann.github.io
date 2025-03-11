---
layout: post
title: 'Bubble Sort in Clojure... again'
meta: 'Exploring an alternative approach to implementing the Bubble Sort algorithm in Clojure, leveraging lists and vectors for efficiency.'
tags: ['clojure', 'algorithms', 'functional-programming']
---

Following on from my [previous solution](../2016-02-19-bubble-sort-in-clojure/index.md) to implementing the Bubble Sort algorithm in Clojure, I thought it would be interesting to experiment with a different approach.
Taking advantage of lists and vectors' respective cheap head and tail insertions, we can use these two properties to good effect, as shown below.

<!--more-->

```clojure
(defn- bubble
  ([xs] (bubble xs [] false))
  ([[x y & xs] ys changed]
   (if (nil? y)
     [(conj ys x) changed]
     (if (> x y)
       (recur (cons x xs) (conj ys y) true)
       (recur (cons y xs) (conj ys x) changed)))))

(defn bubble-sort [xs]
  (loop [[ys changed] (bubble xs)]
    (if changed
      (recur (bubble ys))
      ys)))

(bubble-sort [3 2 1]) ; [1 2 3]
```

Replacing the `reduce` used previously with a concise recursive function, you can see how the pass phase is completed - using a `changed` flag to signal an alteration occurring within the iteration.
The implementation is again split into a main and helper function, which allows us to clearly see the separation between the conditional pass loop and the bubble action.
