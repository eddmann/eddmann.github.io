---
layout: post
title: 'Partial Application (Currying) and Composition using JavaScript ES6'
meta: 'Discover how to implement partial application, currying and composition in JavaScript ES6 using modern, succinct techniques for cleaner, more functional code.'
tags: javascript functional-programming
---

Completion of a recent project sparked discussion surrounding JavaScript ES6 within the team, in part due to the welcome addition of [Webpack](http://webpack.github.io/) into our stack.
[ECMAScript 6](http://en.wikipedia.org/wiki/ECMAScript) is an upcoming standard which will eventually be used as a reference for all future JavaScript implementations (client and server-side).

<!--more-->

At this time many of the popular browsers support a subset of the [new features](https://github.com/lukehoban/es6features) present in the proposed standard.
This is great for experimentation but can be seen as an issue if you wish to target your currently supported browser list.
However, with the use of transpilers such as [Traceur](https://github.com/google/traceur-compiler) or [Babel](https://babeljs.io/) (formerly 6to5), we can write code using the latest standards which in-turn gets automatically transformed into a representation compatible with ECMAScript 5 runtimes.

On a completely separate topic, as Sten's [previous article](https://tech.mybuilder.com/folds/) may have shown, the team is currently also very interested in functional programming and the concepts that accompany it.
I too find this paradigm very interesting to investigate, and through the recent completion of a [Front-end Masters course](https://frontendmasters.com/courses/functional-javascript/) on the subject I found a way to meld my desire to explore ES6 along with some of these functional concepts.

## Partial Application and Currying

The ability to partially apply (or even more strictly [curry](http://en.wikipedia.org/wiki/Currying)) functions is incredibly important within this paradigm, allowing us to reuse functions in many different ways.
There are many examples of implementing such behaviour in JavaScript, all typically following an imperative mindset.
The implementation shown below instead uses recursion along with some of the new features present in ES6 to succinctly codify the definition of what partial application truly is.

```js
let curry = (fn, ...args) => {
  let _curry = args =>
    args.length < fn.length
      ? (..._args) => _curry([...args, ..._args])
      : fn(...args);

  return _curry(args);
};
```

Reading the small example above you will first notice the use of the 'var' replacement ['let'](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/let) keyword, which provides you with block-scoped binding and no implicit variable hoisting.
The variadic function definition uses the new [arrow syntax](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/Arrow_functions) along with the [rest operator](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/rest_parameters) to collect any arguments that are supplied along with the function to eventually apply.
Following this, a private recursive function is called, which in its base case applies all the collected arguments to the specified function and returns the result.
If this condition has not yet been met, a new function is instead returned with a call to the internal function, supplying it with the accumulated and new arguments using the [spread operator](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Spread_operator).
This example also takes advantage of the arrow function's behaviour to return the result if only one statement has been defined, removing the need for unnecessary 'return' keywords.

## Composition

Another functional building block is the ability to create new functionality by way of function composition.
In a similar manner to how we implemented partial application, we are also able to use ES6's new features to aid us in creating a composition function.

```js
let compose = (...fns) =>
  fns.reduce(
    (f, g) =>
      (...args) =>
        f(g(...args))
  );
```

The one-line implementation shown above clearly highlights how explicit we are able to be when using the new arrow and rest-spread syntax.
In this example each supplied function is initially stored in an array using the 'rest' operator.
This value is subsequently reduced down to a single function by applying the result of the subject function with the accumulation of the others.
I feel this clearly shows how declarative we are now able to be in JavaScript, aided in part by these new ES6 features.
