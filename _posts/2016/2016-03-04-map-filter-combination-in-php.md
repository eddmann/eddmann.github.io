---
layout: post
title: 'Map-Filter Combination in PHP'
meta: 'Combining the common-place Map-Filter process in PHP'
---

Following on from my discussion on [Mapping, Filtering and Reducing in PHP](/posts/mapping-filtering-and-reducing-in-php/), over the past couple of months I have been using a little trick I would like to discuss.
Although a `map-filter` combination can be achieved in a single `reduce`, reading the PHP documentation I found out that `array_filter` supplied without a predicate function will remove all `false` values from the collection.
This means that you can simply map over a collection and return `false` if the desired predicate does not match - leaving the filter to do the clean-up.

<!--more-->

```php
function array_map_filter($fn, ...$arr)
{
    return array_filter(array_map($fn, ...$arr));
}
```

```php
$users = [
    [ 'id' => 1, 'name' => 'Joe' ],
    [ 'id' => 2, 'name' => 'Bob' ],
    [ 'id' => 3, 'name' => 'Sally' ],
];

array_map_filter(function ($user) {
    return $user['id'] == 2 ? false : $user['name'];
}, $users); // [ 'Joe', 'Sally' ]
```
