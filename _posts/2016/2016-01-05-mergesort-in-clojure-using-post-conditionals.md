---
layout: post
title: 'Mergesort in Clojure using Post Conditionals'
meta: 'A simple merge-sort implementation in Clojure using post conditionals to maintain sort invariant'
---

Whilst currently reading through [The Joy of Clojure](https://www.manning.com/books/the-joy-of-clojure) book I was introduced to the concept of pre and post-conditionals, similar to another language I have heard about called [Eiffel](<https://en.wikipedia.org/wiki/Eiffel_(programming_language)>).
To experiment with this feature I decided to create a simple merge-sort algorithm implementation which provided the post invariant that its returned values were sorted by the provided predicate.

<!--more-->

```clojure
(defn sorted? [pred? col]
  (every? #(apply pred? %) (partition 2 1 col)))

(defn merge
  ([pred? left right]
   {:post [(sorted? pred? %)]}
   (loop [[l & lr :as ls] left [r & rr :as rs] right acc []]
     (if (and l r)
       (if (pred? l r)
         (recur lr rs (conj acc l))
         (recur ls rr (conj acc r)))
       (concat acc ls rs)))))

(defn half [col]
  (split-at (/ (count col) 2) col))

(defn merge-sort
  ([col] (merge-sort < col))
  ([pred? col]
    {:post [(sorted? pred? %)]}
    (if (< (count col) 2)
      col
      (let [[left right] (half col)]
        (merge pred? (merge-sort pred? left) (merge-sort pred? right))))))
```

I really liked the manner in which I could use the 'partition' function to succinctly map the task of splitting on each co-located pair of values within a collection in code.
We are able to then put this implementation into practice by optionally providing a predicate (else defaulting to ascending order).

```clojure
(def numbers (shuffle (range 1 11))) ; [1 9 7 2 10 3 6 5 4 8]

(merge-sort numbers) ; (1 2 3 4 5 6 7 8 9 10)
(merge-sort > numbers) ; (10 9 8 7 6 5 4 3 2 1)
```
