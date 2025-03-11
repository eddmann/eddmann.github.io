---
layout: post
title: 'Validating 32-bit Integers using PHP'
meta: 'Learn how to validate 32-bit signed integers in PHP with platform-agnostic methods, including filter_var and bitmasking techniques.'
tags: ['php']
---

Last week, I was required to validate that a supplied integer would fit correctly into a 32-bit address space.
The available size of an integer within PHP is platform-dependent and could either be 32 or 64 bits based on the architecture you are using.
This function had to cater for these differences, and as such, I decided to explore a couple of different options for producing this validation.

<!--more-->

```php
function is_32bit_signed_int($value)
{
    $options = ['min_range' => -2147483647, 'max_range' => 2147483647];

    return false !== filter_var($value, FILTER_VALIDATE_INT, compact('options'));
}
```

The first implementation uses the `filter_var` function to validate that the provided input can be correctly coerced into an integer.
To apply the size restrictions, we ensure that the value is bounded within the range that a valid signed 32-bit integer can hold.

```php
function is_32bit_signed_int($value)
{
    return (abs($value) & 0x7FFFFFFF) === abs($value);
}
```

The first solution works well, but I wanted to explore how I could perform this operation using a form of bitmask.
Taking into consideration how PHP represents negative values (using two's complement) and endianness, we bitmask the absolute representation of the value within the maximum size that a signed 32-bit integer can handle.
If this value is identical to the absolute representation without the bitmask applied, then we can be assured that the value is able to fit correctly into a 32-bit integer.
