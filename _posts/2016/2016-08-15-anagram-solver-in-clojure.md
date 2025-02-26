---
layout: post
title: 'Anagram Solver in Clojure'
meta: 'Explore multiple efficient methods to solve anagrams using Clojure, including Hash-Map, Trie, and Prime Number approaches.'
tags: clojure functional-programming algorithms
---

This past week, a discussion around solving anagrams was brought up.
I thought it would be interesting to devise a couple of methods for computationally achieving such a task.
Providing an anagram string and a dictionary file, I wished to return all possible matching words from the dictionary.

<!--more-->

I decided this experimental exercise was a great opportunity to use Clojure.
Whilst thinking of ways to tackle this problem, I initially knew of two different means of storing an effective dictionary for anagram lookup.
I was able to generalise into a higher-order function the process of taking each word within the supplied dictionary file and adding it into the initial `dictionary` data structure using the `add-word` function.
To avoid generation performance penalties each time this function was invoked, I decided to memoize the function.

```clojure
(defn- reader->words [rdr]
  (let [single-word? #(nil? (re-find #"[^a-z]" %))
        max-five-letters? #(< (count %) 6)]
    (->> (line-seq rdr)
         (map clojure.string/lower-case)
         (filter (and single-word? max-five-letters?)))))

(def ^:private generate-dictionary
  (memoize (fn [dictionary add-word filename]
    (with-open [rdr (clojure.java.io/reader filename)]
      (reduce add-word dictionary (reader->words rdr))))))
```

You will notice that I added some constraints upon the words we wished to include from the supplied dictionary.
This was to simplify the large English dictionary provided with Unix platforms such as Mac OS `/usr/share/dict/words`.

## Hash-Map

The first solution used a simple hash-map, devising the key based on the alphabetical sorting of the supplied word.
This meant that each matching anagram would generate the same unique key and then be stored within the hash-map's Set value.

```clojure
(defn- word->key [word]
  (clojure.string/join (sort word)))

(defn- add-to-map [hmap word]
  (let [key (word->key word)
        words (get hmap key #{})]
    (assoc hmap key (conj words word))))

(defn map-anagrams [filename word]
  (get (generate-dictionary {} add-to-map filename) (word->key word) #{}))
```

## Trie

The above solution provided a simple design, along with quick lookup times.
However, I felt that a better-suited data structure could help ease memory requirements.
Using a [Trie](https://en.wikipedia.org/wiki/Trie) data structure allowed us to more effectively store the computed keys for the lookup dictionary.
Clojure provides an efficient way to interact with nested associated data structures using the familiar hash-map.
Instead of the key being converted back into a sorted string, it was maintained as a vector and used as a sequence of keys, forming the path to the matching anagram words.

```clojure
(defn- word->key [word]
  (conj (vec (sort word)) :words))

(defn- add-to-trie [trie word]
  (let [key (word->key word)
        words (get-in trie key #{})]
    (assoc-in trie key (conj words word))))

(defn trie-anagrams [filename word]
  (get-in (generate-dictionary {} add-to-trie filename) (word->key word) #{}))
```

## Hash-Map using Prime Numbers

After some [internet research](http://stackoverflow.com/a/28948975), I noticed a different way to generate unique word keys regardless of character ordering.
Taking advantage of the fact that prime numbers are 'multiplicatively unique', I created a character-to-prime number lookup function.
The product of each character's corresponding prime number resulted in a unique integer value being generated.
I was then able to use a more efficient `int-map` dictionary data structure, providing better lookup and storage costs than the initial implementation.

```clojure
(defn sieve [s]
  (cons (first s)
        (lazy-seq (sieve (filter #(not= 0 (mod % (first s))) (rest s))))))

(def ^:private alpha->prime
  (apply hash-map
    (interleave "abcdefghijklmnopqrstuvwxyz" (sieve (iterate inc 2)))))

(defn- word->key [word]
  (reduce #(* %1 (alpha->prime %2)) 1 word))

(defn prime-map-anagrams [filename word]
  (get (generate-dictionary (clojure.data.int-map/int-map) add-to-map filename)
       (word->key word)
       #{}))
```

## Sub-string Anagrams

Finally, I wished to extend the initial problem and provide the ability to include sub-string anagrams in the result.
I achieved this by creating a small function that took a word and created its power set (set of all possible subsets).
With this implementation, I was then able to create a higher-order function that took the desired finder implementation and fetched both full and sub-string anagrams from the lookup dictionary.

```clojure
(defn- power-set [word]
  (let [add-char-seqs #(clojure.set/union %1 (map (partial str %2) %1))]
    (reduce add-char-seqs #{""} word)))

(defn sub-anagrams [finder filename word]
  (apply clojure.set/union (map (partial finder filename) (power-set word))))
```
