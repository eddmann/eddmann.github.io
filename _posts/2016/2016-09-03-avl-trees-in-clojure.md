---
layout: post
title: 'AVL Trees in Clojure'
meta: 'Implementing the self-balancing AVL binary search tree in Clojure'
---

An AVL tree is a self-balancing binary search tree, where-by the height of a node's children differ by at most one.
In the event that this property is violated a re-balancing process takes place. <!--more-->
In the past I have discussed how to implement a [Binary Search Tree in Clojure](/posts/binary-search-trees-in-clojure/), providing average time complexity of O(log n).
However, in the event that the order of insertion is sequential (either every value greater than, or every value less than the last), time complexity increases to be linear, the same as a linked-list.
Self-balancing trees such as the AVL variant provide us with the familiar worst-case of O(log n), thanks to it's re-balancing phase.

### Balance Factor

Using the previous Binary Search Tree implementation as a base, we are able to expand upon this to include the AVL property.
For the sake of performance you would typically store the height of each nodes children within the structure, however, as I wish to re-use the existing implementation I will instead calculate their height upon `factor` invocation.
The balance factor per. node is calculated by the difference between the two child node's heights, as shown below.

```clojure
(defn height
  ([tree] (height tree 0))
  ([tree count]
    (if tree
      (max (height (:left tree) (inc count))
           (height (:right tree) (inc count)))
      count)))

(defn factor [{:keys [left right]}]
  (- (height left) (height right)))
```

The above two functions provide us with the described behavior, allowing us to supply a root node and return it's balance factor.

### Rotations

So as to complete the final re-balancing step we must also be able to rotate a given node both left and right within the tree structure.

```clojure
(defn rotate-left [{:keys [el left right] :as tree}]
  (if right
    (->Node (:el right) (->Node el left (:left right)) (:right right))
    tree))

(defn rotate-right [{:keys [el left right] :as tree}]
  (if left
    (->Node (:el left) (:left left) (->Node el (:right left) right))
    tree))
```

This can be achieved as shown above, taking advantage of an immutable approach.

### Re-balancing Phase

With the balance factor and rotation actions now available, we are able to begin work on the four different situations a node could be placed in that would require a tree rotation.

![Left Right, Left Left Cases](/uploads/avl-trees-in-clojure/lr-ll-cases.png)

```clojure
(defn is-left-case? [tree]
  (< (factor tree) -1))

(defn is-left-right-case? [tree]
  (and (is-left-case? tree) (> (factor (:right tree)) 0)))
```

![Right Left, Right Right Cases](/uploads/avl-trees-in-clojure/rl-rr-cases.png)

```clojure
(defn is-right-case? [tree]
  (> (factor tree) 1))

(defn is-right-left-case? [tree]
  (and (is-right-case? tree) (< (factor (:left tree)) 0)))
```

With these conditions now locatable, we can apply the desired tree rotations which can be seen visualised in the diagrams above.

```clojure
(defn balance [{:keys [el left right] :as tree}]
  (cond
    (is-right-left-case? tree) (rotate-right (->Node el (rotate-left left) right))
    (is-left-right-case? tree) (rotate-left (->Node el left (rotate-right right)))
    (is-right-case? tree) (rotate-right tree)
    (is-left-case? tree) (rotate-left tree)
    :else tree))
```

### Example Usage

Finally, we are able to create a new AVL insertion/deletion variant, that is a composition of the Binary Search Tree functions and the newly created `balance` one.

```clojure
(def avl-insert (comp balance insert))
(def avl-remove (comp balance remove))
(def seq->avl (partial reduce avl-insert nil))
```

These created data-structures can then be visualised using the following function.

```clojure
(defn tabs [n]
  (clojure.string/join(repeat n "\t")))

(defn visualise
  ([tree] (visualise tree 0))
  ([{:keys [el left right] :as tree} depth]
    (if tree
      (str (visualise right (inc depth)) (tabs depth) el "\n" (visualise left (inc depth)))
      (str (tabs depth) "~\n"))))

(visualise (seq->avl [1 2 3]))
;              ~
;       3
;              ~
; 2
;              ~
;       1
;              ~
```
