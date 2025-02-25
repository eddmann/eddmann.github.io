---
layout: post
title: 'Reverse Polish Notation (RPN) in Scala'
meta: 'Learn how to evaluate Reverse Polish Notation (RPN) expressions in Scala using both mutable stack and functional programming approaches with practical code examples.'
tags: scala functional-programming
---

Continuing on with my exploration of the Scala language, I decided to solve the widely documented problem of evaluating a mathematical [Reverse Polish notation](http://en.wikipedia.org/wiki/Reverse_Polish_Notation) string.
Popularised by its use in the [HP-10C](http://en.wikipedia.org/wiki/HP-10C_series) series of calculators from the 1980s, the notation requires that every operator follow its operands (otherwise called postfix notation).

<!--more-->

For simplification, both discussed solutions use the partially-applied 'parse' function below, which is simply an alias for Java's 'parseDouble' method.

```scala
def parse = java.lang.Double.parseDouble _
```

## Mutable Stack

A typical solution to this problem is to use a mutable stack, which, based on the current token, either pushes the parsed number or the operator result back onto the stack.
Once you have iterated over each of the split string tokens, you will be left with a single item, which is your result.
Although this solution uses mutability (a big functional no-no), I was able to take advantage of Scala's first-class function support for the operator map.
As addition and multiplication operations both have the symmetric property, I was able to ignore the stack's last-in-first-out (LIFO) nature in this case.
However, regarding the minus and divide operations, I was required to swap the parameter values around before evaluating and returning the result.

```scala
def rpn(str: String) = {

    val ops = Map(
        "+" -> ((_: Double) + (_: Double)),
        "*" -> ((_: Double) * (_: Double)),
        "-" -> ((x: Double, y: Double) => y - x),
        "/" -> ((x: Double, y: Double) => y / x)
    )

    val stack = new scala.collection.mutable.Stack[Double]

    str.split(' ').foreach(token =>
        stack.push(
            if (ops.contains(token)) ops(token)(stack.pop, stack.pop)
            else parse(token)
        ))

    stack.pop

}
```

## Pattern-Matching

Following on from the above mutable approach, I was able to implement a solution that follows the side-effect-free functional paradigm.
In this instance, I am instead performing a left-fold over the split string, then using pattern matching to evaluate each token and the current state of the stack (list).
By this use of pattern matching, I am similarly, in effect, 'popping' off the last two operands when I encounter an operator token.

```scala
def rpn(str: String) = {

    str.split(' ').toList.foldLeft(List[Double]())(
        (list, token) => (list, token) match {
            case (x :: y :: zs, "*") => (y * x) :: zs
            case (x :: y :: zs, "+") => (y + x) :: zs
            case (x :: y :: zs, "-") => (y - x) :: zs
            case (x :: y :: zs, "/") => (y / x) :: zs
            case (_, _) => parse(token) :: list
        }).head

}
```

Finally, both implementations, when run with the following RPN string argument, will return a double value of 8.0.

```scala
rpn("4 2 * 8 + 2 /") // 8.0
```
