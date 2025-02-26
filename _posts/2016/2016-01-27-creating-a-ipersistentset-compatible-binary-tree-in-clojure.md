---
layout: post
title: 'Creating a IPersistentSet compatible Binary Tree in Clojure'
meta: 'Learn how to implement IPersistentSet using a Binary Tree in Clojure, making it compatible with existing Clojure functions and libraries.'
tags: clojure functional-programming data-structures
---

Following on from my article on Binary Search Trees [last week](/posts/binary-search-trees-in-clojure/), I decided to explore how I could use types and interfaces to implement the glue required to make the Binary Tree implementation compatible with the `clojure.lang.IPersistentSet` interface. <!--more-->
By doing so, any library or function requiring an `IPersistentSet` would be able to use the Binary Tree data structure seamlessly.

## Prerequisites

At the end of the previous article, we had a handful of useful functions that worked with the Binary Search Tree data structure we had developed.
For a recap, below are the definitions for each of these functions.

```clojure
(defrecord Node [el left right])

(defn insert [tree value] ...)
(defn remove [tree value] ...)
(defn contains? [tree value] ...)
(defn to-list [tree] ...)
(defn search [tree value] ...)
```

## Implementing the IPersistentSet Interface

In the code below, we provide a wrapper around the functions that we have already developed, ensuring they conform to the contract required for an `IPersistentSet`.
Creating a new type called `BinaryTree`, which holds a root tree node, allows us to easily handle the use case of an empty set while logically proxying to the existing functions.

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

## Example Usage

We can now use a `BinaryTree` anywhere that requires an `IPersistentSet`-compatible type.
When a function is invoked, Clojure polymorphically dispatches to the correct type's function implementation.

```clojure
(def xs (into (BinaryTree. nil) (range 10))) ; #{0 1 2 3 4 5 6 7 8 9}
(disj xs 4) ; #{0 1 2 3 5 6 7 8 9}
(= xs xs) ; true
(= (disj xs 4) (disj xs 2)) ; false
(get xs 5) ; #user.Node{:el 5, :left nil, :right #user.Node...
(xs 5) ; #user.Node{:el 5, :left nil, :right #user.Node...
```
