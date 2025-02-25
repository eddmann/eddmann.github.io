---
layout: post
title: "Arrow Functions Lexical 'this' Scoping in JavaScript"
meta: "Describing the Arrow Functions lexical 'this' scoping, with previous alternative solutions"
---

One feature of ES2015 that I feel can be a stumbling block (but extremely useful) is Arrow Functions lexical scoping of `this`.
Before this addition, every new function defined its own `this` - meaning we were required to explicitly bind or locally store the `this` reference that we desired in many use-cases. <!--more-->
The two technique used to overcome this problem are highlighted below, using a locally stored `this` reference or a bound function.

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

The contrived example usage below shows passing the counters `inc` method to a high-order function and asserting the desired `this` behavior.

```js
var c = new Counter();

setInterval(c.inc, 1000);
setInterval(function () {
  console.log(c.counter);
}, 1500);
// 1, 2, 3, 4, 5
```

With the introduction of Arrow functions, the `this` value is instead captured based on the enclosing context, resulting in more readable code.

```js
function Counter() {
  this.counter = 0;
  this.inc = () => {
    this.counter++;
  };
}
```
