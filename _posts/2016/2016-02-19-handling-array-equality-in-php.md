---
layout: post
title: 'Handling Array Equality in PHP'
meta: 'Learn how PHP handles array equality and how to correctly compare arrays based on values and ordering.'
tags: php
---

If you want to check if two arrays contain the same values, regardless of order, you will encounter some issues using the operators `==` and `===`.

<!--more-->

With the equal operator `==`, you can check for equality based on type-coerced values and keys (regardless of order).

```php
[1, 2, 3] == [1, 2, 3]; // true
[1, 2, 3] == [1, 2, '3']; // true
[1, 2, 3] == [1, 3, 2]; // false
[1, 2, 3] == [0 => 1, '2' => 3, 1 => 2]; // true
```

With the identical operator `===`, you can check for equality based on type and the exact ordering of the keys.

```php
[1, 2, 3] === [1, 2, 3]; // true
[1, 2, 3] === [1, 2, '3']; // false
[1, 2, 3] === [1, 3, 2]; // false
[1, 2, 3] === [0 => 1, 2 => 3, 1 => 2]; // false
```

This is not always desirable.
When treating the collection as a set, you do not wish to validate the position of the elements, only their presence.
However, this can be resolved by using the following functions.

```php
function array_values_equal($a, $b) {
    $x = array_values($a);
    $y = array_values($b);

    sort($x);
    sort($y);

    return $x == $y;
}

function array_values_identical($a, $b) {
    $x = array_values($a);
    $y = array_values($b);

    sort($x);
    sort($y);

    return $x === $y;
}

array_values_equal(['1', 2, 3], [3, 2, 1]); // true
array_values_identical([1, 2, 3], [3, 2, 1]); // true
```
