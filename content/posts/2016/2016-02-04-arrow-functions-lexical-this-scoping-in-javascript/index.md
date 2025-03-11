---
layout: post
title: "Arrow Functions Lexical 'this' Scoping in JavaScript"
meta: "Exploring the lexical scoping of 'this' in Arrow Functions and previous alternative solutions in JavaScript."
tags: ['javascript']
---

One feature of ES2015 that I feel can be a stumbling block (but is extremely useful) is Arrow Functions' lexical scoping of `this`.
Before this addition, every new function defined its own `this`, meaning we were required to explicitly bind or locally store the `this` reference that we desired in many use cases. <!--more-->
The two techniques used to overcome this problem are highlighted below, using a locally stored `this` reference or a bound function.

```js
function Counter() {
  var _this = this;
  _this.counter = 0;
  this.inc = function () {
    _this.counter++;
  };
}
```

```js
function Counter() {
  this.counter = 0;
  this.inc = function () {
    this.counter++;
  }.bind(this);
}
```

The contrived example usage below shows passing the counter's `inc` method to a higher-order function and asserting the desired `this` behaviour.

```js
var c = new Counter();

setInterval(c.inc, 1000);
setInterval(function () {
  console.log(c.counter);
}, 1500);
// 1, 2, 3, 4, 5
```

With the introduction of Arrow Functions, the `this` value is instead captured based on the enclosing context, resulting in more readable code.

```js
function Counter() {
  this.counter = 0;
  this.inc = () => {
    this.counter++;
  };
}
```
