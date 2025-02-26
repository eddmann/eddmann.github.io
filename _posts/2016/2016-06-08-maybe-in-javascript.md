---
layout: post
title: 'Maybe in JavaScript'
meta: 'Explore the Maybe type in JavaScript, including its implementation and practical examples for safe handling of null and undefined values.'
tags: javascript functional-programming
---

Recently, I have been delving into the concepts of [Functors](http://learnyouahaskell.com/functors-applicative-functors-and-monoids) and [Monads](http://learnyouahaskell.com/a-fistful-of-monads).
There are many good [resources](https://curiosity-driven.org/monads-in-javascript) available online that will do a far better job of explaining these concepts than I could.
However, I do wish to document an example of a Maybe type I have implemented in JavaScript.
Again, there are many excellent external [resources](http://sean.voisen.org/blog/2013/10/intro-monads-maybe/) that highlight the characteristics and power of using such a type, so I will direct your attention to those if you wish to learn more.

<!--more-->

### Implementation

The Maybe type encapsulates the concept of Some (contains a value) and None (no value present).
With these two abstractions, we can safely handle cases where no value is present, avoiding NullPointerException errors and excessive null checks.

<!--prettier-ignore-->
```js
const Maybe = (function () {
  const Some = function (x) { this.x = x; };
  Some.prototype.fmap = function (fn) { return Maybe.of(fn(this.x)); };
  Some.prototype.bind = function (fn) { return fn(this.x); };
  Some.prototype.toString = function () { return `Some(${this.x})`; };

  const None = function () {};
  None.fmap = () => None;
  None.bind = () => None;
  None.toString = () => 'None';

  return {
    of: (x) => x === null || x === undefined ? None : new Some(x),
    lift: (fn) => (...args) => Maybe.of(fn(...args)),
    Some,
    None
  };
})();
```

The implementation above uses two small prototypical class definitions to define Some and None.
We then return the ability to take a value of a plain type and put it into a Maybe container, along with the capability to lift a function into the Maybe space.

### Division by Zero Example

The first example of using the Maybe type I will demonstrate is in the case of handling division by zero errors.
If the denominator is zero, instead of throwing an exception or returning null (as shown in the basic `div` implementation), we lift the function into the Maybe type and return a Some or None.
This may not seem like much of a win at this point, but when we later look at examples of composing these expressions together, you will see its full power.

<!--prettier-ignore-->
```js
const div = (a, b) => b === 0 ? null : a / b;
const mdiv = Maybe.lift(div);

div(10, 0); // null
mdiv(100, 0); // None
mdiv(10, 2); // Some(5)
```

### Property Retrieval Example

Another case where `undefined` values may appear in JavaScript is when retrieving properties from objects that may (or may not) be present.
Again, we highlight how the basic `get` function returns the object property or undefined if not present, whereas lifting it into the Maybe type provides us with the Some and None abstractions.

<!--prettier-ignore-->
```js
const get = curry((prop, obj) => obj[prop]);
const mget = (prop) => Maybe.lift(get(prop));

const user = {
  name: 'Joe Bloggs',
  age: 25,
  address: {
    street: 'Cinder Drive'
  }
};

get('agez')(user); // undefined
mget('agez')(user); // None
mget('age')(user); // Some(25)
```

We can then compose multiple `mget` functions together, handling application on the Maybe containers using `fmap` and `bind`.

```js
const fmap = curry((fn, functor) => functor.fmap(fn));
const bind = curry((fn, monad) => monad.bind(fn));
```

You will notice that `fmap` double-wraps the resulting value.
This is because, as a Functor definition, its action is to wrap the resulting value (from our provided function) back into the given container.
However, in the case of the `bind` Monad definition, it does not wrap the value back into the container upon completion but instead relies on the function itself to return the correctly typed value.

<!--prettier-ignore-->
```js
const getStreet = compose(fmap(mget('street')), mget('address'));
getStreet({ address: {} }); // Some(None)
getStreet(user); // Some(Some(Cinder Drive))

const getStreet = compose(bind(mget('street')), mget('address'));
getStreet({ address: {} }); // None
getStreet(user); // Some(Cinder Drive)
```

### Mimicking Do Notation in JavaScript

When looking at Haskell examples, you will notice how succinct the do notation is at handling the containers used.
We can take advantage of JavaScript's ability to parse functions as strings to rewrite a language similar to this notation into one that can be executed.
This allows us to clearly express the intent of the code rather than cluttering it with the plumbing required to make it work with the containers.

<!--prettier-ignore-->
```js
const doM = (function() {
  const tokenize = (exp) => exp
    .toString()
    .split(/[\n;]/)
    .slice(1, -1)
    .map((s) => s.trim())
    .filter(Boolean);

  const evaluate = (tokens) => {
    if (tokens.length === 0) return '';

    let token = tokens.shift(), match;
    if (match = token.match(/^return (.+)$/))
      return `return Maybe.of(${match[1]});` + evaluate(tokens);
    if (match = token.match(/^(.+) <= (.+)$/))
      return `return ${match[2]}.bind(function(${match[1]}) { ${evaluate(tokens)} });`;

    return evaluate(tokens);
  };

  return compose(x => x(), Function, evaluate, tokenize);
})();

doM(() => {
  address <= mget('address')(user)
  street <= mget('street')(address)
  return street
}); // Some(Cinder Drive)
```
