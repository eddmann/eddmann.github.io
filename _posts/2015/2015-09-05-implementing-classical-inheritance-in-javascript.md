---
layout: post
title: 'Implementing Classical Inheritance in JavaScript'
meta: 'Demystifying the syntactic sugar that is required to provide Classical Inheritance in JavaScript'
---

Developers who are well versed in class-based languages such as Java and C++ may find JavaScript's prototypical and in my heart true object-oriented nature confusing.
With the addition of the `class` keyword in ES6 it has become extremely easy to crossover these class-based principles into JavaScript.
However, it should be noted that this is nothing more than syntactic sugar over an extremely expressive and flexible language construct. <!--more-->
In fact it is very easy to build our own Class implementation, using specially constructed 'class' functions as templates for the 'new' instances we wish to use.
Below is an example implementation highlighting how to simply create a classical inheritance hierarchy within JavaScript.

```js
var Class = function (parent, properties) {
  if (properties === undefined) {
    properties = parent;
    parent = Class;
  }

  var pp = parent.prototype;

  function C() {
    this.init.apply(this, arguments);
  }
  C.prototype = Object.assign(Object.create(pp), properties);
  C.prototype.constructor = C;
  C.prototype.super = function (name) {
    return pp[name].bind ? pp[name].bind(this) : pp[name];
  };

  return C;
};
```

Looking at the example above you will notice that we take into consideration the possibility of either a new class being defined (one parameter) or an inherited class being supplied.
The new 'class functions' prototype is composed of its parents, along with any new properties supplied.
The constructed function which is returned will be invoked as a constructor function throughout its lifetime, creating new instances of the defined class.
We also include a simple `super` function which allows the user to call its parents method implementation.

We are now able to use this implementation in a contrived representation of both a User and Admin class.
You will notice how we call the parent classes (User) `init` and `getName` implementation within the Admin class.

```js
var User = Class({
  init: function (name) {
    this.name = name;
  },
  getName: function () {
    return this.name;
  },
});

var Admin = Class(User, {
  init: function (name, level) {
    this.super('init')(name);
    this.level = level;
  },
  getName: function () {
    return this.super('getName')() + ' (' + this.level + ')';
  },
});
```

We are then able to create a couple of 'class instances' and type-check them accordingly.

```js
var foo = new User('Foo'),
  bar = new Admin('Bar', 5),
  baz = new Admin('Baz', 10);

foo.getName(); // Foo
bar.getName(); // Bar (5)
baz.getName(); // Baz (10)

foo instanceof User; // true
bar instanceof Admin; // true
baz instanceof Class; // true
```
