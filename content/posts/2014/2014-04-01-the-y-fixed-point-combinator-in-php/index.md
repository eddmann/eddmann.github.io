---
layout: post
title: 'The Y (Fixed-Point) Combinator in PHP'
meta: 'Discover how to implement the Y-combinator in PHP to achieve elegant recursion, memoization, and closure bindings for functional programming.'
tags: ['php', 'functional-programming']
---

A combinator is a type of higher-order function that can be used to express functions without the explicit use of variables.
A fixed point is a value that remains unchanged by a function, satisfying the equation which can be found [here](http://en.wikipedia.org/wiki/Fixed-point_combinator#Y_combinator).
Using the Y-combinator allows us to essentially convert non-recursive code into a recursive counterpart (without directly using named recursion or iteration).
To work its magic, the recursive function is computed as the fixed point of the non-recursive function.

<!--more-->

You may be asking yourself why this is at all relevant in an imperative language such as PHP?
Well, with the introduction of Closures (since PHP 5.3) the language has slowly started to embrace many functional concepts.
One such concept, however, still requires some work to correctly implement in practice, namely recursive closures.
In a previous memoization [post](../2014-01-13-implementing-and-using-memoization-in-php/index.md) I highlighted a factorial implementation using such an approach, which required some PHP reference hackery to pass in the closure variable, as this would not typically be available in the function scope.
With a little research I stumbled upon the concept of Haskell's 'fix' function which is generally known by the name 'Y-combinator'.
I was keen to provide a thought experiment into how this could be implemented in the PHP language along with some interesting example use cases.

## Basic Implementation

Below is my first attempt at implementing the Y combinator in PHP, cheating a little by temporarily storing the fixed-point function in a variable to remove code duplication.

```php
function Y($F)
{
    $x = function($f) use ($F)
    {
        return $F(function() use ($f)
        {
            return call_user_func_array($f($f), func_get_args());
        });
    };

    return $x($x);
}
```

This function can then be applied to solve the Fibonacci sequence, as shown below.
As you can see, the implementation provides us with the ability to reference the function by parameter instead of name (call-by-name), which in (typed) lambda calculus is not possible.

```php
$fibonacci = Y(function($fib)
{
    return function($n) use ($fib)
    {
        return $n > 1
            ? $fib($n - 1) + $fib($n - 2)
            : $n;
    };
});
```

## Adding Memoization

With the basic concept now implemented, we can simply expand on this example to include the ability to memoize function call results.
Providing an initial empty cache, we first check to see if the hashed function call arguments have already been processed in the past; if so, we skip the function invocation step and return the answer.

```php
function YMemo($F, $cache = [])
{
    $x = function($f) use ($F, &$cache)
    {
        return $F(function() use ($f, &$cache)
        {
            $hash = md5(serialize(func_get_args()));

            if ( ! isset($cache[$hash])) {
                $cache[$hash] = call_user_func_array($f($f, $cache), func_get_args());
            }

            return $cache[$hash];
        });
    };

    return $x($x);
}
```

As the added memoization is an implementation detail, the user-facing API has not changed and the function can again be expressed in the same manner as before (now with significant run-time speed increases).

```php
$fibonacci = YMemo(function($fib)
{
    return function($n) use ($fib)
    {
        return $n > 1
            ? $fib($n - 1) + $fib($n - 2)
            : $n;
    };
});
```

## Using Closure Bindings

Included more for its aesthetic appeal (syntactic sugar), we can take advantage of [Closure Bindings](http://www.php.net/manual/en/closure.bind.php) within PHP (since 5.4) to remove the need to explicitly pass in the fixed-point function.
Although this clearly violates the properties of a true Y-combinator, we are instead able to now simply invoke `$this` with the supplied arguments, providing a more user-friendly implementation.

```php
function Yish($F)
{
    $x = function($f) use ($F)
    {
        return $F->bindTo(function() use ($f)
        {
            return call_user_func_array($f($f), func_get_args());
        });
    };

    return $x($x);
}
```

We can use the example of the Fibonacci sequence again, to this time make use of the closure-bound implementation.

```php
$fibonacci = Yish(function($n)
{
    return $n > 1
        ? $this($n - 1) + $this($n - 2)
        : $n;
});
```

## Resources

- [Haskell - Fix and Recursion](http://en.wikibooks.org/wiki/Haskell/Fix_and_recursion)
- [Y-Combinator in PHP](http://php100.wordpress.com/2009/04/13/php-y-combinator/)
- [Fixed-point combinators in JavaScript](http://matt.might.net/articles/implementation-of-recursive-fixed-point-y-combinator-in-javascript-for-memoization/)
