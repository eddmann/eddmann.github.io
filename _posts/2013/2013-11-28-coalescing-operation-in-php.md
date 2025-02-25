---
layout: post
title: 'Coalescing Operation in PHP (for Default Values)'
meta: 'Learn how to utilise the coalescing operation in PHP for default values to write cleaner, more efficient code.'
tags: php
---

Over the past week or so, I have been reading discussions on the [PHP internals](http://news.php.net/php.internals) mailing list about proposed updates to what the ?: operator currently does.
If you are like me, you may not have even known that you could use the ternary operator (since 5.3) as a coalescing operator.

<!--more-->

It, however, is a simple example of syntactic sugar to reduce code noise, allowing you to specify an alternative (default) value if the supplied variable is [falsey](http://php.net/manual/en/language.types.boolean.php).
In effect, assuming that the variable '$a' is defined as null, the examples below will all equate to the same result: 'b'.

```php
$a = $a ?: 'b';
if ( ! $a) $a = 'b';
$a || $a = 'b';
$a or $a = 'b';
```

However, issues arise when the variable has not already been declared, and in such a case, notice messages will be displayed.
This occurs due to attempting to use the non-existent variable outright, without first checking with the 'isset' or 'empty' functions.
This is one of the key areas being addressed in the proposed update.
The examples below, more verbose than desired, address this issue at present.

```php
$a = empty($a) ?: 'b';
isset($a) && ! $a or $a = 'b';
(isset($a) && ! $a) || $a = 'b';
```

Regarding the middle example, we are taking advantage of the lower [operator precedence](http://php.net/manual/en/language.operators.precedence.php) of OR/AND, thereby removing the need for brackets (as seen in the last example).
I should point out, however, that mixing the two can be a recipe for debugging difficulties, and it would be best practice to continue expressing such statements using && and ||.
