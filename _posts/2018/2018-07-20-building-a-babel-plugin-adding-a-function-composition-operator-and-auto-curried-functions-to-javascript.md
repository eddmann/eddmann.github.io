---
layout: post
title: 'Building a Babel Plugin: Adding a Function Composition Operator and Auto-Curried Functions to JavaScript'
meta: 'Learn how to build a Babel plugin that adds a function composition operator and auto-curried functions to JavaScript through detailed AST manipulation.'
tags: babel javascript
---

In a recent Software Engineering Daily [podcast](https://softwareengineeringdaily.com/2018/06/21/babel-with-henry-zhu/) Henry Zhu discussed the [Babel](https://babeljs.io/) project, and shed some light on how the transpiler works under the hood.
He touched upon how [Plugins](https://babeljs.io/docs/en/plugins.html) can be created to alter the resulting compiled code.
I was very interested in experimenting with this capability.
In this post I wish to highlight the process by which Babel transforms your code, developing several interesting plugins along the way.

<!--more-->

## How does Babel work?

There are three main stages to the Babel lifecycle, and these are:

- **Parse** - takes the supplied code and produces an [Abstract Syntax Tree](https://en.wikipedia.org/wiki/Abstract_syntax_tree) (AST) from it.
- **Transform** - traverses this created AST, applying any plugin modifications along the way.
- **Generate** - takes this transformed AST and converts it back into code form.

As you can see, plugins target the second stage of this lifecycle.
The AST is traversed using the [Visitor pattern](https://sourcemaking.com/design_patterns/visitor), which allows us to build plugins that only target specific node types, manipulating them as we desire.
I highly recommend that you take a look at the [Babel Handbook](https://github.com/jamiebuilds/babel-handbook) to gain a more in-depth insight into how these underlying concepts work.

Now that we have a basic understanding of how Babel works, we can move on to building some example plugins!
For this we will be using an excellent online [AST Explorer](https://astexplorer.net/), which allows us to not only build the plugin, but also inspect both the intermediate (AST) and compiled form.

## Adding a Function Composition Operator

In languages such as Haskell and F#, you can simply compose two functions together using infix `.` and `>>` operators respectively.
In the case of F#, this allows you to visualise the call stack going left-to-right, as opposed to in-out.

As it is not yet possible (by official means) to add user-defined syntax to JavaScript using Babel, we will instead repurpose the infix `&` bitwise AND operator token.
Using this plugin we wish to be able to provide and generate the code example shown below.

```js
const format = toUpperCase & trim & emphasise;
// converts to
const format = x => emphasise(trim(toUpperCase(x)));
```

We can achieve this by using the following documented plugin.

```js
export default ({ types: t }) => ({
  visitor: {
    BinaryExpression(path) {
      if (!t.isBinaryExpression(path.node, { operator: '&' })) {
        return;
      }

      const flatten = node =>
        t.isBinaryExpression(node, { operator: '&' })
          ? [...flatten(node.left), ...flatten(node.right)]
          : [node];

      const [head, ...tail] = flatten(path.node);

      path.replaceWith(
        t.arrowFunctionExpression(
          [t.identifier('x')],
          tail.reduce(
            (expr, call) => t.callExpression(call, [expr]),
            t.callExpression(head, [t.identifier('x')])
          )
        )
      );
    },
  },
});
```

As you can see, we only wish to target `BinaryExpression` nodes which reference the `&` operator.
Once found, we then traverse this expression, returning all nested expression values.
This allows us to compose many functions together optimally, as highlighted in the example use-case above.
We are then able to build a new nested `CallExpression`, and replace the `BinaryExpression` node itself with a single `ArrowFunctionExpression`.

You can see this plugin in action by visiting the accompanying [AST Explorer snippet](https://astexplorer.net/#/gist/a5bd7b8c733fd52e3b51d3f713b5a3d3/014e51be5e9b20cf37b4903eb97f1e61277e9f47).

## Auto-Curried Functions

Another feature that can be found in languages such as Haskell and F# is the concept of all functions (by default) being [curried](https://en.wikipedia.org/wiki/Currying).
This can be observed as all functions with multiple parameters being broken up into a chained series of single-parameter functions.
This results in the ability to easily create new functions from existing ones, with minimal boilerplate.

We will now try and apply this idea to JavaScript.
This will mean that all created functions (regardless of parameter arity) are internally made using a series of single-parameter functions.
From here, we will then expand upon this and cater for partial application - converting calls that provide more than one argument into their curried counterparts.
These use-cases are best shown with examples.

```js
function add(a, b) {
  return a + b;
}
// converts to
function add(a) {
  return function (b) {
    return a + b;
  };
}
```

```js
var subtract = function (a, b) {
  return a - b;
};
// converts to
var subtract = function (a) {
  return function (b) {
    return a - b;
  };
};
```

```js
const multiply = (a, b) => a * b;
// converts to
const multiply = a => b => a * b;
```

```js
add(1, 2);
// converts to
add(1)(2);
```

As you can see, there are three different ways of declaring a function in JavaScript.
We will start by addressing the first two, `FunctionDeclaration` and `FunctionExpression`.

```js
export default ({ types: t }) => ({
  visitor: {
    'FunctionDeclaration|FunctionExpression'(path) {
      const { node } = path;

      if (node.params.length <= 1) {
        return;
      }

      const build = ([head, ...tail]) => {
        if (!head) return node.body;
        return t.blockStatement([
          t.returnStatement(t.functionExpression(null, [head], build(tail))),
        ]);
      };

      const [head, ...tail] = node.params;

      path.replaceWith(t[node.type](node.id, [head], build(tail)));
    },
  },
});
```

We are able to target several different node types within the same visitor function.
When we encounter one of these nodes, we first ensure that there is more than one parameter present within the function - as there is no need to modify it if this is not the case.
After this check, we recursively build up a nested `FunctionExpression` which breaks each parameter up into a separate function call.
Finally, we replace the node with one of the same type, ensuring that any function identifier is included within this declaration.

The third way in which a function can be declared in JavaScript is with an `ArrowFunctionExpression`.
In this instance, we are able to provide a simpler means of producing the intended output.

```js
export default ({ types: t }) => ({
  ArrowFunctionExpression(path) {
    const { node } = path;

    if (node.params.length <= 1) {
      return;
    }

    const [head, ...tail] = node.params.reverse();

    path.replaceWith(
      tail.reduce(
        (expr, param) => t.arrowFunctionExpression([param], expr),
        t.arrowFunctionExpression([head], node.body)
      )
    );
  },
});
```

For this change we only need to do a single right fold over the parameters, building a new nested `ArrowFunctionExpression` that replaces the current node.

Finally, we can now look into how we should handle the transformation of function invocations that provide more than one argument.
Modifying these allows us to ensure that our new curried paradigm is compatible with existing code.
We can achieve this as follows.

```js
export default ({ types: t }) => ({
  CallExpression(path) {
    const { node } = path;

    if (node.arguments.length <= 1) {
      return;
    }

    if (t.isMemberExpression(node.callee)) {
      return;
    }

    const [head, ...tail] = node.arguments;

    path.replaceWith(
      tail.reduce((exp, arg) => t.callExpression(exp, [arg]), t.callExpression(node.callee, [head]))
    );
  },
});
```

We first need to ensure that the `CallExpression` has more than the intended one argument.
If this is the case, we then need to check that the call does not originate from an object member invocation (`object.fn()`) as we do not wish to modify this form.
With these checks now complete, we can simply perform a left fold over the arguments, building up a final `CallExpression` that handles one argument at a time.

You can see this plugin in action by visiting the accompanying [AST Explorer snippet](https://astexplorer.net/#/gist/a5bd7b8c733fd52e3b51d3f713b5a3d3/a663f9b0d674301574a5d5c63504a6fb870c33dd).

## Conclusion

I hope this post has given you some practical insight into how a Babel plugin is created using AST manipulation.
As highlighted throughout the post, you can experiment with both the [Function Composition Operator](https://astexplorer.net/#/gist/a5bd7b8c733fd52e3b51d3f713b5a3d3/014e51be5e9b20cf37b4903eb97f1e61277e9f47) and [Auto-Curried Functions](https://astexplorer.net/#/gist/a5bd7b8c733fd52e3b51d3f713b5a3d3/a663f9b0d674301574a5d5c63504a6fb870c33dd) plugins on AST Explorer.
