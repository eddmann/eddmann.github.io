---
layout: post
title: "An 'array_column' re-indexing trick in PHP"
meta: "Learn how to use PHP's array_column function to re-index an array's keys effortlessly."
tags: php
---

The `array_column` function has been a welcome addition to the PHP language, allowing us to remove the need for common-place `array_map` invocations that simply pluck specific values from arrays.
However, I recently discovered that you can provide a third argument that allows you to define what the returning array's keys will be.
This, combined with `null` for the value argument, allows you to easily re-index an array based on a key value whilst maintaining the original array's values and ordering.

<!--more-->

```php
$arr = [
    ['id' => 123, 'name' => 'Joe'],
    ['id' => 345, 'name' => 'Sally']
];

array_column($arr, null, 'id'); // [ 123 => ['id' => 123, 'name' => 'Joe'] ...
array_column($arr, 'name', 'id'); // [ 123 => 'Joe', 345 => 'Sally' ...
```
