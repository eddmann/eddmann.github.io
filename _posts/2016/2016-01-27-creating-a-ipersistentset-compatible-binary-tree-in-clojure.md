---
layout: post
title: 'Creating a IPersistentSet compatible Binary Tree in Clojure'
meta: 'Implementing IPersistentSet as a Binary Tree in Clojure'
---

Following on from my article on Binary Search Trees [last week](/posts/binary-search-trees-in-clojure/), I decided to see how I could use types and interfaces to implement the glue that is required to make the Binary Tree implementation compatible with the `clojure.lang.IPersistentSet` interface. <!--more-->
In doing so, this would allow any library or function requiring an `IPersistentSet` to use the Binary Tree data-structure.

## Prerequisites

At the end of the previous article we were left with a handful of useful functions which worked with the Binary Search Tree data-structure we had developed.
For a recap, below are the definitions for each of the functions.

```clojure
(defrecord Node [el left right])

(defn insert [tree value] ...)
(defn remove [tree value] ...)
(defn contains? [tree value] ...)
(defn to-list [tree] ...)
(defn search [tree value] ...)
```

## Implementing the IPersistentSet interface

In the code laid out below we are providing a wrapper around the functions that we have already developed - for the contract that is needed to become a `IPersistentSet`.
Creating a new type called `BinaryTree` which holds a root tree node, allows us to easily handle the use-case of an empty set, along with logical proxying to the existing functions.

```clojure
(deftype BinaryTree [tree]
  clojure.lang.IPersistentSet
  (cons [this value] (BinaryTree. (insert tree value)))
  (disjoin [this value] (BinaryTree. (remove tree value)))
  (empty [this] (BinaryTree. nil))
  (equiv [this that] (if (instance? BinaryTree that)
                       (= tree (.tree that))
                       false))
  (seq [this] (to-list tree))
  (get [this value] (search tree value))
  (contains [this value] (contains? this value))
  clojure.lang.IFn
  (invoke [this value] (get this value)))
```

## Example

We are now able to supply a `BinaryTree` in any place that desires a `IPersistentSet` compatible type.
When the function is invoked Clojure polymorphically dispatches to the correct types function implementation.

```clojure
(def xs (into (BinaryTree. nil) (range 10))) ; #{0 1 2 3 4 5 6 7 8 9}
(disj xs 4) ; #{0 1 2 3 5 6 7 8 9}
(= xs xs) ; true
(= (disj xs 4) (disj xs 2)) ; false
(get xs 5) ; #user.Node{:el 5, :left nil, :right #user.Node...
(xs 5) ; #user.Node{:el 5, :left nil, :right #user.Node...
```
