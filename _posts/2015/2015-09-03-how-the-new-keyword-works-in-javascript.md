---
layout: post
title: "How the 'new' keyword works in JavaScript"
meta: "Learn how the 'new' keyword operates under-the-hood in JavaScript with a clear, step-by-step explanation and a user-land implementation."
tags: javascript
---

The `new` keyword in JavaScript can sometimes slip up new and experienced programmers alike.
We typically associate this word with classical-based object-oriented languages (such as Java, etc.), whereas in JavaScript it works a little differently. <!--more-->
In fact, due to the language's prototypical behaviour, any function can be used as a constructor call, which adds more fuel to the confusion.
To demystify the process that occurs, this article will take you through the four operations that occur when the `new` keyword is invoked on a Function.
After describing these steps, we will then work through codifying a user-land function that mimics its behaviour.

1. It creates a plain ol' object.
2. It assigns the supplied Function's `prototype` object property as the new object's `[[prototype]]` link. All functions are created with a prototype object property which initially just has a constructor member that links back to the function itself.
3. It invokes the function constructor (with supplied arguments), binding `this` to the newly created object.
4. It checks to see if a non-primitive value has been returned from the function call. If so, it will disregard the created object and return that value; otherwise, the newly formed object is returned.

## User-land Solution

Now that we know the basic steps that occur when the `new` keyword is called, we can create a user-land function that mimics this behaviour.

```js
let isObj = o => typeof o == 'object' || typeof o == 'function';

function new_(cons, ...args) {
  let obj = Object.create(cons.prototype); // step 1 and 2
  let ret = cons.apply(obj, args); // step 3
  return isObj(ret) ? ret : obj; // step 4
}
```
