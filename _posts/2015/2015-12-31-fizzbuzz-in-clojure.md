---
layout: post
title: "FizzBuzz in Clojure"
meta: "Multiple ways to solve the FizzBuzz code kata in Clojure"
---

This past Christmas break I had the chance to finally pick up [The Joy of Clojure](https://www.manning.com/books/the-joy-of-clojure) book and delve into the world of Lisp.
Along with the common-place Merge-sort algorithm I find it beneficial to explore a new language and its capabilities by solving the [FizzBizz](http://rosettacode.org/wiki/FizzBuzz) code kata.
In this post I will be explaining a couple of the implementations that I created.
<!--more-->

Each of the four solutions below share the following predicate functions.

{% highlight clojure %}
(def fizz? #(zero? (mod % 3)))
(def buzz? #(zero? (mod % 5)))
(def fizzbuzz? #(and (fizz? %) (buzz? %)))
{% endhighlight %}

And can return the desired results by mapping it over a supplied range.

{% highlight clojure %}
(map fizzbuzz (range 1 101))
{% endhighlight %}

## Solution 1

This solution is the most trivial taking advantage of 'cond' over multiple 'if' statements.
So as to remove some boilerplate the anonymous function short-hand has been used.

{% highlight clojure %}
(def fizzbuzz
  #(cond
    (fizzbuzz? %) "FizzBuzz"
    (fizz? %) "Fizz"
    (buzz? %) "Buzz"
    :else %))
{% endhighlight %}

## Solution 2

The solution below uses the 'let' statement in combination with 'str' to produce an output string.
If the output string is empty however, the provided number is returned instead.

{% highlight clojure %}
(defn fizzbuzz [n]
  (let [s (str (if (fizz? n) "Fizz") (if (buzz? n) "Buzz"))]
    (if (empty? s) n s)))
{% endhighlight %}

## Solution 3

Conceptionaly similar to the 'cond' implementation - 'some-fn' allows us to create a function which includes a list of predicates along with their desired return values.
In the case of a match not being found the supplied number is returned instead.

{% highlight clojure %}
(defn fizzbuzz [n]
  (let [to-words (some-fn #(when (fizzbuzz? %) "FizzBuzz")
                          #(when (fizz? %) "Fizz")
                          #(when (buzz? %) "Buzz"))]
    (or (to-words n) n)))
{% endhighlight %}

## Solution 4

The final solution uses a couple of great Clojure features, including multi-arity overloading to supply a default lookup map, as well as an array map which maintains insertion order.
Each entry in the map is deconstructed into its predicate and return word (key, value) and then used to test against the supplied number.
If the predicate passes, the entry is kept and finally joined together to return the output using 'apply' and  'str' functions.

{% highlight clojure %}
(defn fizzbuzz
  ([n] (fizzbuzz n (array-map fizz? "Fizz" buzz? "Buzz")))
  ([n lookup]
    (if-let [matches (seq (keep (fn [[pred? word]] (when (pred? n) word)) lookup))]
      (apply str matches)
      n)))
{% endhighlight %}
