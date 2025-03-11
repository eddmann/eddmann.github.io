---
layout: post
title: 'Undefined Variable Checks in JavaScript'
meta: 'Learn how to check for the existence of a variable in JavaScript without encountering a ReferenceError.'
tags: ['javascript']
---

This morning, I stumbled upon an issue surrounding checking for the existence of a variable in JavaScript. <!--more-->
I was under the impression that I could perform this check as follows:

```js
const isPresent = foo !== undefined;
// ReferenceError: foo is not defined
```

Looking at the code above, you will notice that this did not work, and instead, a `ReferenceError` exception was thrown.
This is due to the JavaScript specification stating that an exception of this kind should be thrown when trying to dereference a variable that has not yet been declared.
Upon review, however, I was able to resolve this issue by being more specific in our check, like so:

```js
const isPresent = window.foo !== undefined;
```

This implementation works as the initial variable that we are dereferencing (`window`) exists, and instead, the check is now performed on the `window` value (an object) instead.
An object in JavaScript returns `undefined` when trying to access a non-existent property.
This check, however, can seem a little limited in scope.
Instead, the more generic (and recommended) way for checking if a variable has been defined or not is as follows:

```js
const isPresent = typeof foo !== 'undefined';
```
