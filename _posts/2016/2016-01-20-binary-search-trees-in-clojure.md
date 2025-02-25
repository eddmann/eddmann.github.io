---
layout: post
title: 'Binary Search Trees in Clojure'
meta: 'A comprehensive exploration of binary search trees implemented in Clojure, detailing insertion, removal, traversal, and invariant assertion techniques.'
tags: clojure data-structures
---

This weekend I was able to spend some more time exploring Clojure.
I decided that it would be interesting to reimplement some of the [Binary Search Tree work](https://eddmann.com/posts/insertion-removal-and-inversion-operations-on-binary-search-trees-in-php/) I had previously done in PHP.
We start by creating a simple record definition which describes the contents of a Node.

<!--more-->

```clojure
(defrecord Node [el left right])
```

## Insertion

Using this Node record, we are now able to construct an insertion function which uses Clojure's parameter deconstruction to great effect.
The use of the `cond` macro clearly documents an extremely succinct algorithm for inserting a new node into a provided tree.

```clojure
(defn insert [{:keys [el left right] :as tree} value]
  (cond
   (nil? tree) (Node. value nil nil)
   (< value el) (Node. el (insert left value) right)
   (> value el) (Node. el left (insert right value))
   :else tree))
```

## Removal

Removing a given value from the tree requires a little more work than its insertion counterpart.
However, `cond` (again) allows us to clearly document these actions, handling the three different states the given node could be in.
Note that the third state requires the use of the documented `min` function below.

```clojure
(defn remove [{:keys [el left right] :as tree} value]
  (cond
   (nil? tree) nil
   (< value el) (Node. el (remove left value) right)
   (> value el) (Node. el left (remove right value))
   (nil? left) right
   (nil? right) left
   :else (let [min-value (min right)]
           (Node. min-value left (remove right min-value)))))
```

## Minimum and Maximum Value

As a Binary Search Tree's invariant is that every node's left branch is less and the right branch is greater, we can implement simple functions which return the minimum and maximum values present in the tree.

```clojure
(defn min [{:keys [el left]}]
  (if left
    (recur left)
    el))
```

```clojure
(defn max [{:keys [el right]}]
  (if right
    (recur right)
    el))
```

## Contains

Following a similar traversal pattern to that found in the insertion algorithm, we are able to check if a given value is present in the tree using the following function.

```clojure
(defn contains? [{:keys [el left right] :as tree} value]
  (cond
   (nil? tree) false
   (< value el) (recur left value)
   (> value el) (recur right value)
   :else true))
```

## Count and Height

Statistical analysis on the created tree can be carried out in the form of checking the height of the tree (depth), along with the total node count.

```clojure
(defn count [{:keys [left right] :as tree}]
  (if tree
    (+ 1 (count left) (count right))
    0))
```

```clojure
(defn height
  ([tree] (height tree 0))
  ([tree count]
    (if tree
      (max (height (:left tree) (inc count))
           (height (:right tree) (inc count)))
      count)))
```

## Asserting the Invariant

We are able to assert that the given tree maintains the invariance required to be a BST by using the following function.

```clojure
(defn bst?
  ([tree] (bst? tree Integer/MIN_VALUE Integer/MAX_VALUE))
  ([{:keys [el left right] :as tree} min max]
    (cond
     (nil? tree) true
     (or (< el min) (> el max)) false
     :else (and (bst? left min (dec el))
                (bst? right (inc el) max)))))
```

## Creating and Displaying the Tree

Using the following function, we are able to create a new tree from a supplied sequence.
This function utilises a `reduce` to insert each value into the tree, building up the final result along the way.

```clojure
(def to-tree #(reduce insert nil %))
```

There are many ways to concatenate sequences within Clojure.
However, I feel that the approach below clearly expresses the desired intent.
Using a combination of 'syntax-quote' and 'unquote-splicing', we are able to build up a list of the supplied tree's contents.

```clojure
(defn to-list [{:keys [el left right] :as tree}]
  (when tree
    `(~@(to-list left) ~el ~@(to-list right))))
```

## Example

Finally, we are able to use all these functions in a contrived example, highlighting each of them in action.

```clojure
(def tree (to-tree '(5 8 2 3 4 1)))

(bst? tree) ; true
(count tree) ; 6
(height tree) ; 4
(max tree) ; 8
(min tree) ; 1
(to-list (remove tree 3)) ; (1 2 4 5 8)
(contains? tree 2) ; true
```
