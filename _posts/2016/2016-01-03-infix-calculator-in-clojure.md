---
layout: post
title: 'Infix Calculator in Clojure'
meta: 'Discover how to implement an infix calculator in Clojure using the Shunting Yard algorithm and Reverse Polish Notation evaluation to process expressions efficiently.'
tags: clojure algorithms
---

Following on from my previous post, I have continued my exploration into Clojure by implementing a simple infix calculator - using the Shunting Yard algorithm and RPN evaluation.
The documented implementation is split into three distinct parts, of which I will describe piece-by-piece before composing them together to result in the final calculator.

<!--more-->

## Tokenization

The first problem to solve is to correctly split up the supplied infix expression into the tokenised output.
The implementation below _reduces_ over each of the characters in the expression, producing an output list which correctly merges co-located digits.

```clojure
(defn tokenize [expr]
  (let [to-chars #(clojure.string/split (clojure.string/replace % " " "") #"")
        is-digit? #(and % (re-find #"^\d+$" %))]
    (reverse
      (reduce
        (fn [[t & ts :as tokens] token]
          (if (and (is-digit? token) (is-digit? t))
            (cons (str t token) ts)
            (cons token tokens)))
        '(), (to-chars expr)))))
```

## Shunting Yard Algorithm

To produce the desired Reverse Polish Notation required to evaluate the expression into its final result, we can use the Shunting Yard algorithm invented by Edsger Dijkstra.
The implementation below follows a similar pattern to a previous one I documented in JavaScript, however I feel that Clojure has been able to more succinctly codify its intent.

```clojure
(defn shunting-yard [tokens]
  (let [ops {"+" 1, "-" 1, "*" 2, "/" 2}]
    (flatten
      (reduce
        (fn [[rpn stack] token]
          (let [less-op? #(and (contains? ops %) (<= (ops token) (ops %)))
                not-open-paren? #(not= "(" %)]
            (cond
              (= token "(") [rpn (cons token stack)]
              (= token ")") [(vec (concat rpn (take-while not-open-paren? stack))) (rest (drop-while not-open-paren? stack))]
              (contains? ops token) [(vec (concat rpn (take-while less-op? stack))) (cons token (drop-while less-op? stack))]
              :else [(conj rpn token) stack])))
        [[] ()]
        tokens))))
```

Looking at the implementation above, you will notice that we have been able to use a two-element vector to represent the output notation and stack, which are then joined at the end to return the final output.

## RPN Evaluation

With the expression now represented in RPN, we can use the following implementation to evaluate this token sequence, returning the final result.

```clojure
(defn rpn [tokens]
  (let [ops {"+" +, "-" -, "*" *, "/" /}]
    (first
      (reduce
        (fn [stack token]
          (if (contains? ops token)
            (cons ((ops token) (second stack) (first stack)) (drop 2 stack))
            (cons (read-string token) stack)))
        [] tokens))))
```

## Calculator

With all the pieces now created, we can compose the calculator function from these constituent parts.
We are able to document the transformation from expression to result using the following `log` function, which can be thought of as an identity function with the side-effect of printing out the supplied parameter.

```clojure
(def log #(do (println %) %))
```

With this function now declared, we can create the `calc` function which is a composition of the implemented functions above.

```clojure
(def calc (comp rpn shunting-yard tokenize))
```

```clojure
(def calc-debug (comp rpn log shunting-yard log tokenize))
(calc-debug "3 + 4 * 5 / (3 + 2)")
; (3 + 4 * 5 / ( 3 + 2 ))
; (3 4 5 * 3 2 + / +)
; 7
```
