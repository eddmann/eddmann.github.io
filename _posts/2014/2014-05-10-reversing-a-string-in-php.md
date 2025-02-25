---
layout: post
title: 'Reversing a String in PHP'
meta: 'Explore innovative methods to reverse strings in PHP, from basic built-in functions to advanced recursive and Unicode-support techniques.'
tags: php
---

Since recently setting up a forum for [Three Devs and a Maybe](http://forum.threedevsandamaybe.com/), we have started to partake in a weekly [code-kata](<http://en.wikipedia.org/wiki/Kata_(programming)>).
What could be more fitting to start with than the common interview question, reversing a string in a given language.
In this case the language is PHP, and below are some of the many ways contrived to solve the problem.

<!--more-->

## Basic Implementations

The implementation below is the simplest, as it takes advantage of PHP's extensive built-in functions to reverse the supplied string.

```php
function reverse($str)
{
    return strrev($str);
}
```

Similarly, we can compose a `reverse` function by joining (alias for [`implode`](http://php.net/function.join)) a reversed array of the string characters.

```php
function reverse($str)
{
    return join('', array_reverse(str_split($str)));
}
```

The most imperative approach to reverse a string is by looping over each character with indexes at each end, swapping their contents upon each iteration.
PHP's ability to access individual characters in an array-like manner turns out to be very useful in this case.

```php
function reverse($str)
{
    for ($i = 0, $j = strlen($str) - 1; $i < $j; $i++, $j--) {
        $tmp = $str[$i];
        $str[$i] = $str[$j];
        $str[$j] = $tmp;
    }

    return $str;
}
```

Although not best practice, the desired result can be compacted into a single `for` loop declaration, as shown below.

```php
function reverse($str)
{
    for ($i = strlen($str) - 1, $out = ''; $i >= 0; $out .= $str[$i--]) {}

    return $out;
}
```

Another impractical approach using the `array_walk` function can be found below.
An interesting implementation detail is that a copy of `$out` is being passed into the closure function.

```php
function reverse($str)
{
    list($out, $len) = [ str_split($str), strlen($str) - 1 ];

    array_walk($out, function(&$ele, $idx) use ($out, $len) // copy, not ref.
    {
        $ele = $out[$len - $idx];
    });

    return join('', $out);
}
```

## Recursive Implementations

The second group of implementations employs recursion to achieve the desired result.
The first of these methods is a simple recursive invocation of the function, removing the head character upon each call.
Once the string has reached one character, the base case has been hit and the remaining string is simply returned.

```php
function reverse($str)
{
    if (strlen($str) < 2) {
        return $str;
    }

    return reverse(substr($str, 1)) . $str[0];
}
```

The implementation below takes advantage of the [divide and conquer](http://en.wikipedia.org/wiki/Divide_and_conquer_algorithm) algorithm paradigm, flipping the left and right substrings upon each recursive invocation.
Similar to the previous example, if the base case of a single character string is met, the remaining string is simply returned.

```php
function reverse($str)
{
    if (strlen($str) < 2) {
        return $str;
    }

    $mid = (int) strlen($str) / 2;
    $lft = substr($str, 0, $mid);
    $rgt = substr($str, $mid);

    return reverse($rgt) . reverse($lft);
}
```

## Unicode-Support Implementations

PHP's built-in support for Unicode strings is somewhat lacking; as such, extra steps are required to correctly reverse a string of this type.
As Unicode character representations can consist of multiple bytes (i.e. UTF-8), we are unable to naively use `strlen` and `str_split` (which assume a character is always a single byte).
The implementation below uses `preg_split` support for Unicode characters to correctly split the string into characters for us to reverse.

```php
function reverse($str)
{
    return join('', array_reverse(preg_split('//u', $str, -1, PREG_SPLIT_NO_EMPTY)));
}
```

Using some [endianness](http://en.wikipedia.org/wiki/Endianness) conversion trickery we are able to use PHP's built-in `strrev` function.
The implementation below uses 'iconv' to achieve the desired results.

```php
function reverse($str)
{
    return iconv('UTF-16LE', 'UTF-8', strrev(iconv('UTF-8', 'UTF-16BE', $str)));
}
```

Similar in nature to the previous example, we are instead now using the `mb` library to perform the conversion.

```php
function reverse($str)
{
    return mb_convert_encoding(strrev(mb_convert_encoding($str, 'UTF-16BE', 'UTF-8')), 'UTF-8', 'UTF-16LE');
}
```
