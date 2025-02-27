---
layout: post
title: 'Allocating Secret Santas with a Substitution Cipher using Clojure'
meta: 'Documenting how I went about allocating Secret Santas with a substitution cipher using Clojure'
---

Over Christmas I found myself delving back into a bit of Clojure, one such problem I stumbled upon solving was allocating [Secret Santas](https://en.wikipedia.org/wiki/Secret_Santa).
In this post I will discuss how I went about grouping a given list of names based on certain criteria, and then correctly pairing up each person.
From here, I will then highlight how I expanded upon the solution to allow these allocations to be distributed, hidden from prying eyes with a simple [ROT13](https://en.wikipedia.org/wiki/ROT13) substitution cipher.

<!--more-->

## Allocating Secret Santas

The first problem that I had to tackle was loading in a given text file which contained all the given participants and their gender, in CSV form.

```
james,m
robert,m
david,m
michael,m
mary,f
sally,f
jane,f,
anne,f
```

The solution I wanted to develop catered for the use-case that certain criteria had to be met to make participants eligible to pair with each other.
In this case the invariant was that participants could only buy gifts for the same gender.

```clojure
(use '[clojure.string :only [split split-lines]])

(defn- participants [file]
  (map #(split % #",") (split-lines (slurp file))))

(defn- group [participants]
  (map (partial map first) (partition-by second participants)))
```

To achieve this I first [`slurped`](https://clojuredocs.org/clojure.core/slurp) in the file contents, treating each given line as a new participant.
I then went about breaking each entry into their name and gender.
This in-turn then allowed me to group the given list based on gender (the [`second`](https://clojuredocs.org/clojure.core/second) and finally return only the grouped participant names.

Now that we had the grouped names we could begin pairing up each participant.

```clojure
(defn- allocate [buyers]
  (let [receivers (map vector buyers (shuffle buyers))]
    (if (every? (partial apply distinct?) receivers)
      receivers
      (recur buyers))))
```

I solved this with a recursive approach which simply zipped the buyers with another randomly shuffled buyer.
In the event that a buyer had been paired with themselves, the action would be repeated.

```clojure
(defn secret-santa [file]
  (mapcat allocate (group (participants file))))
```

Once complete I was able to compose these building blocks together.
As participants were allocated within groups I used [`mapcat`](https://clojuredocs.org/clojure.core/mapcat) to ensure that the result was a flat listing of all the pairings.

## Hiding the Pairings using a Substitution Cipher

Now that I could pair up a given list of grouped participants, I then thought about how this could be easily distributed via a print-out without anyone else knowing each others picks.
I decided that a simple [substitution cipher](https://en.wikipedia.org/wiki/Substitution_cipher) such as ROT13 would do the trick.
I felt it would provide just enough friction to make it hard to work out based on a quick gaze, for example.

```clojure
(def ^:private lower-case
  (seq "abcdefghijklmnopqrstuvwxyz"))

(defn- rot13 [text]
  (let [cipher (->> (cycle lower-case) (drop 13) (take 26) (zipmap lower-case))]
    (apply str (replace cipher text))))
```

To achieve this I first created a simple ROT13 implementation which catered for lower-case alphabet substitutions.
This lead me to think that although the value would be a cipher, the length did not change and based on the provided names this could possibly disclosure a pairing.

```clojure
(defn- rand-str [length]
  (apply str (take length (repeatedly #(rand-nth lower-case)))))

(defn- padded-rot13 [length text]
  (let [padding (/ (- length (count text)) 2)]
    (str (rand-str (Math/ceil padding))
         (rot13 text)
         (rand-str (Math/floor padding)))))
```

To resolve this issue I decided to pad each given name with equal amounts of random alphabet values based on the maximum participants name length.
This padding was applied to both the beginning and end of the cipher, enclosing the real name in the middle.

```clojure
(defn secret-santa-cipher [file]
  (let [santas (secret-santa file)
        max-name (apply max (map count (map first santas)))
        cipher (partial padded-rot13 max-name)]
    (map (fn [[buyer receiver]] [buyer (cipher receiver)]) santas)))
```

Finally, I was able to decorate the `secret-santa` function with the ability to return cipher text.
This ensured that all paired up receivers were hidden and required a little work to uncover.

I envision being able to use the solution this coming December, printing and cutting out each of the pairings to distribute to participants.
