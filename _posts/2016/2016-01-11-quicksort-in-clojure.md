---
layout: post
title: 'QuickSort in Clojure'
meta: 'Exploring the clojure.core library by implementing the QuickSort algorithm'
---

This past weekend I had the chance to delve more into Clojure's [core library](https://clojuredocs.org/clojure.core).
I experimented with some interesting aspects of the library by implementing the QuickSort algorithm in a couple of different ways.

<!--more-->

## Random Number Generation

```clojure
(defn numbers [n]
  (take n (repeatedly #(rand-int 100))))
```

Using the above function we are able to take advantage of lazy sequences to create an infinite list of random integers.
This infinite list is made finite (using `take`) when supplying the function with the desired amount of numbers required.

## Solution 1

The first implementation documented declaratively describes the QuickSort algorithm, using collection filtering to split the input based on the selected pivot.

```clojure
(defn quick-sort [[pivot & coll]]
  (when pivot
    (concat (quick-sort (filter #(< % pivot) coll))
            [pivot]
            (quick-sort (filter #(>= % pivot) coll)))))
```

## Solution 2

The second implementation removes the duplication created by the two filtering predicates, specifying a single `greater?` function which is used by both filtering and subsequently removing (the inverse) from the supplied collection.
We also employ the use of the lazy concatenation function which returns a lazy sequence which is only evaluated when required.

```clojure
(defn quick-sort [[pivot & coll]]
  (when pivot
    (let [greater? #(> % pivot)]
      (lazy-cat (quick-sort (remove greater? coll))
                [pivot]
                (quick-sort (filter greater? coll))))))
```

## Solution 3

The final implementation uses the `group-by` function provided by the core library.
Using this function neatly allows us to partition the collection into two separate lists in an extremely expressive manner.
We are then able to destructure the returned map, assigning the true and false values to more clearly named lesser and greater variables.

```clojure
(defn quick-sort [[pivot & coll]]
  (when pivot
    (let [{lesser false greater true} (group-by #(> % pivot) coll)]
      (lazy-cat (quick-sort lesser)
                [pivot]
                (quick-sort greater)))))
```
