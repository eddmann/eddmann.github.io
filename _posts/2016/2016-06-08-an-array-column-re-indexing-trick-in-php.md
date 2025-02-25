---
layout: post
title: "An 'array_column' re-indexing trick in PHP"
meta: 'Using array_column in PHP to re-index an arrays keys'
---

The `array_column` function has been a welcome addition to the PHP language, allowing us to remove the need for common-place `array_map` invocations that just pluck specific values from arrays.
However, I just found out that you can provide a third argument that allows you to define what the returning arrays keys will be.
This combined with `null` for the value argument allows you to easily re-index an array based on a key value whilst maintaining the original arrays values and ordering.

<!--more-->

```php
$arr = [
    ['id' => 123, 'name' => 'Joe'],
    ['id' => 345, 'name' => 'Sally']
];

array_column($arr, null, 'id'); // [ 123 => ['id' => 123, 'name' => 'Joe'] ...
array_column($arr, 'name', 'id'); // [ 123 => 'Joe', 345 => 'Sally' ...
```
