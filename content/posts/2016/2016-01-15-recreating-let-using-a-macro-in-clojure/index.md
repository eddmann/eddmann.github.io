---
layout: post
title: "Recreating 'Let' using a Macro in Clojure"
meta: "Learn how to recreate the 'let' special form using a clever Clojure macro with lambda trickery and underlying calculus fundamentals."
summary: "Inspired by a good friend's recent Gist on how the functionality of the special form `let` could be achieved using a little Lambda trickery, I decided to write a simple macro that would do this transformation."
tags: ['clojure']
---

Inspired by a good friend's recent [Gist](https://gist.github.com/keyvanakbary/190eb819632db0d6c303) on how the functionality of the special form `let` could be achieved using a little Lambda trickery, I decided to write a simple macro that would do this transformation.
It is very interesting to see how concepts such as this can be built up from underlying calculus fundamentals.

```clojure
(defmacro lets [bindings & body]
  `((fn [~@(take-nth 2 bindings)] ~@body) ~@(take-nth 2 (rest bindings))))

(lets [foo "bar" baz 123]
  (println foo baz)) ; bar 123
```

```clojure
(clojure.walk/macroexpand-all '(lets [foo "bar" baz 123] (println foo baz)))
; ((fn* ([foo baz] (println foo baz))) "bar" 123)
```

You can see how simple the macro actually is, with the inclusion of only two unquote-splicing actions.
I was hoping to also include some of the guards that are present in the [`let`](https://github.com/clojure/clojure/blob/clojure-1.7.0/src/clj/clojure/core.clj#L4301) macro using [`assert-args`](https://github.com/clojure/clojure/blob/clojure-1.7.0/src/clj/clojure/core.clj#L1718) but sadly this has been made private within the core library.
