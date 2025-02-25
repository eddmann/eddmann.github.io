---
layout: post
title: "How the 'new' keyword works in JavaScript"
meta: "Demystifying how the 'new' keyword works under-the-hood in JavaScript"
---

The `new` keyword in JavaScript can sometimes slip up new and experienced programmers alike.
We typically associate this word with Classical-based Object-oriented languages (such as Java etc.), where as in JavaScript it works a little different. <!--more-->
In fact due to the languages prototypical behavior any function can be used as a constructor call, which adds more fuel to the confusion.
To demystify the process that occurs this article will take you through the four operations that occur when the `new` keyword is invoked on a Function.
After describing these steps we will then work through codifying a user-land function that mimics its' behavior.

1. It creates a plain ol' object
2. It assigns the supplied Functions `prototype` object property as the new objects `[[prototype]]` link. All Functions are created with a prototype object property which initially just has a constructor member which links back to the Function itself.
3. It invokes the Function constructor (with supplied arguments), binding `this` to the newly created object.
4. It checks to see if a non-primitive value has been returned from the function call, if so it will disregard the created object and return this, else the newly formed object is returned.

## User-land Solution

Now that we know the basic steps that occur when the `new` keyword is called, we can create a user-land function that mimic this behavior.

```js
let isObj = o => typeof o == 'object' || typeof o == 'function';

function new_(cons, ...args) {
  let obj = Object.create(cons.prototype); // step 1 and 2
  let ret = cons.apply(obj, args); // step 3
  return isObj(ret) ? ret : obj; // step 4
}
```
