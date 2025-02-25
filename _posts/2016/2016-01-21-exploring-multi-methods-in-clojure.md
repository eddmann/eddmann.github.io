---
layout: post
title: 'Exploring Multi-Methods in Clojure'
meta: 'Discover how to implement multi-methods in Clojure with practical examples including FizzBuzz, factorial, Rock-Paper-Scissors, and odd-even evaluation.'
tags: clojure
---

Currently reading through the [Joy of Clojure](https://www.manning.com/books/the-joy-of-clojure) book, I have recently been introduced to Clojure's multi-method support.
I decided that it would be interesting to see this feature in action, so I opened up LightTable and codified some example use-cases.

<!--more-->

## FizzBuzz

The implementation below carries on from where my article about [FizzBuzz in Clojure](/posts/fizzbuzz-in-clojure/) left off.
Using the two documented `fizz?` and `buzz?` helpers, followed by the [`juxt`](https://clojuredocs.org/clojure.core/juxt) core function, we are able to codify the problem in a highly descriptive manner.

```clojure
(def fizz? #(zero? (mod % 3)))
(def buzz? #(zero? (mod % 5)))

(defmulti fizzbuzz (juxt fizz? buzz?))
(defmethod fizzbuzz [true false] [n] "Fizz")
(defmethod fizzbuzz [false true] [n] "Buzz")
(defmethod fizzbuzz [true true] [n]  "FizzBuzz")
(defmethod fizzbuzz :default [n] (str n))

(->> (range 1 10) (map fizzbuzz)) ; (1 2 "Fizz" 4 "Buzz" "Fizz" 7 8 "Fizz")
```

## Factorial

We are also able to use multi-methods in a similar manner to the pattern-matching found in languages such as Scala and Haskell.
The implementation below recursively computes the supplied argument's factorial value, handling the base-case of 0 using the function `identity` as the dispatch call.

```clojure
(defmulti factorial identity)
(defmethod factorial 0 [_] 1)
(defmethod factorial :default [n] (* n (factorial (dec n))))

(factorial 5) ; 120
```

## Rock-Paper-Scissors

We are able to expand upon the rules-based approach laid out in the previous examples by documenting the Rock-Paper-Scissors game in code.
This multi-method allows us to compute all the possible winning moves for both players.

```clojure
(defmulti beats? vector)
(defmethod beats? [:paper :rock] [_ _] true)
(defmethod beats? [:scissors :paper] [_ _] true)
(defmethod beats? [:rock :scissors] [_ _] true)
(defmethod beats? :default [_ _] false)

(def winning-moves
  (for [one [:rock :paper :scissors]
        two [:rock :paper :scissors]
        :let [one-wins (beats? one two)
              two-wins (beats? two one)]
        :when (or one-wins two-wins)]
    (if one-wins ["1" one two] ["2" one two])))
; [2 :rock :paper] [1 :rock :scissors] [1 :paper :rock]
; [2 :paper :scissors] [2 :scissors :rock] [1 :scissors :paper]
```

## Odd or Even

Finally, we can use the core `odd?` function to polymorphically return a string depicting the supplied value's odd-even status.

```clojure
(defmulti odd-even odd?)
(defmethod odd-even true [n] (str n " is Odd"))
(defmethod odd-even false [n] (str n " is Even"))

(odd-even 5) ; 5 is Odd
```
