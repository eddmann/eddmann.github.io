---
layout: post
title: 'Allocating and Notifying Secret Santas via Email using Clojure'
meta: 'Discover how to build a Clojure console application with Leiningen that allocates Secret Santas and sends email notifications using Gmail SMTP.'
tags: clojure secret-santa
---

My close family have been doing Secret Santa over the past couple of years, and although there are plenty of free services out there to solve the problem of allocating and notifying participants, I thought it would be a great opportunity to explore building a solution using Clojure and Lein.

<!--more-->

The [final solution](https://github.com/eddmann/secret-santa) allows you to supply [Gmail SMTP credentials](https://www.digitalocean.com/community/tutorials/how-to-use-google-s-smtp-server) for the given email account you wish to send the notifications from, and a CSV file defining the participants.
You can also optionally exclude participants from being allocated (i.e. if they were their Secret Santa last year) and split allocations groups based on gender.

```
name,email,exclude,gender
Bob,bob@email.com,Jim,m
Sally,sally@email.com,Jane,f
...
```

```bash
$ GMAIL_USERNAME=x GMAIL_PASSWORD=x java -jar secret-santa-1.0.0-standalone.jar participants.txt
```

### The Solution

I opted for a recursive brute-force approach to allocating participants, which randomly shuffled the mapping until deemed valid.

```clojure
(ns secret-santa.allocate)

(defn- group [participants]
  (map last (group-by :gender participants)))

(defn- valid? [[buyer receiver]]
  (and (not= (:name buyer) (:name receiver))
       (not= (:exclude buyer) (:name receiver))))

(defn- random [buyers]
  (let [allocations (map vector buyers (shuffle buyers))]
    (if (every? valid? allocations)
      allocations
      (recur buyers))))

(defn allocate [participants]
  (mapcat random (group participants)))
```

With the ability to now allocate participants, I could then move on to parsing a given listing and subsequently handle notifying them.

```clojure
(ns secret-santa.core
  (:use [postal.core :only [send-message]]
        [environ.core :refer [env]]
        [clojure.data.csv :as csv]
        [secret-santa.allocate :only [allocate]])
  (:gen-class))

(defn- csv->participants [file]
  (letfn [(csv-data->maps [csv-data]
            (map zipmap
                 (->> (first csv-data) (map keyword) repeat)
                 (rest csv-data)))]
    (->> (slurp file)
         csv/read-csv
         csv-data->maps)))

(defn- send-mail [buyer-email receiver-name]
  (send-message {:host "smtp.gmail.com"
                 :user (env :gmail-username)
                 :pass (env :gmail-password)
                 :ssl true}
                {:from (env :gmail-username)
                 :to buyer-email
                 :subject "Secret santa! 🎅"
                 :body (str "You're secret santa for " receiver-name)}))

(defn -main [file & args]
  (let [participants (csv->participants file)]
    (doseq [[buyer receiver] (allocate participants)]
      (println (str "Sent " (:name buyer)))
      (send-mail (:email buyer) (:name receiver)))))
```

Thanks to [data.csv](https://github.com/clojure/data.csv) I was able to elegantly translate the CSV into a suitable internal form.
From there, I could pass this onto the allocation logic described above and then finally notify the participants via email.
Using the [environ](https://github.com/weavejester/environ) library I was able to provide the desired Gmail SMTP credentials at runtime (via the environment).

### Testing

I was able to provide basic test coverage around the allocation logic using [clojure.test](https://clojure.github.io/clojure/clojure.test-api.html).

```clojure
(ns secret-santa.allocate-test
  (:require [clojure.test :refer :all]
            [secret-santa.allocate :refer [allocate]]))

(deftest it-does-not-allocate-self
  (let [participants [{:name "Bob"}
                      {:name "Jim"}]
        expected [[{:name "Bob"} {:name "Jim"}]
                  [{:name "Jim"} {:name "Bob"}]]]
    (is (= expected (allocate participants)))))

(deftest it-allocates-satisfying-exclusions
  (let [participants [{:name "Bob" :exclude "Jim"}
                      {:name "Jim" :exclude "Sally"}
                      {:name "Sally" :exclude "Bob"}]
        expected [[{:name "Bob" :exclude "Jim"} {:name "Sally" :exclude "Bob"}]
                  [{:name "Jim" :exclude "Sally"} {:name "Bob" :exclude "Jim"}]
                  [{:name "Sally" :exclude "Bob"} {:name "Jim" :exclude "Sally"}]]]
    (is (= expected (allocate participants)))))

(deftest it-allocates-by-gender
  (let [participants [{:name "Bob" :gender "m"}
                      {:name "Jim" :gender "m"}
                      {:name "Sally" :gender "f"}
                      {:name "Jane" :gender "f"}]
        expected [[{:name "Bob" :gender "m"} {:name "Jim" :gender "m"}]
                  [{:name "Jim" :gender "m"} {:name "Bob" :gender "m"}]
                  [{:name "Sally" :gender "f"} {:name "Jane" :gender "f"}]
                  [{:name "Jane" :gender "f"} {:name "Sally" :gender "f"}]]]
    (is (= expected (allocate participants)))))
```

With this, I created a simple CI pipeline using GitHub Actions, which used the provided `Makefile` and Docker setup to ensure that the tests passed.
Upon success, the application was built (using `uberjar`) and then uploaded as an artifact to GitHub.

```yaml
name: TestAndBuild

on: push

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - run: make test
  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - run: make build
      - uses: actions/upload-artifact@v2
        with:
          name: secret-santa.jar
          path: target/uberjar/secret-santa-1.0.0-standalone.jar
```

In the future, I hope to explore [property-based testing](https://clojure.org/guides/test_check_beginner), which I feel will improve upon the confidence garnered from the static test suite present at this time.
