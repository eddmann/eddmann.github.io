---
layout: post
title: 'Mapping, Filtering and Reducing in PHP'
meta: 'Learn how to use PHP higher-order functions map, filter, and reduce to simplify and improve code readability.'
tags: ['php', 'functional-programming']
---

Over the past couple of years, I have transitioned from boilerplate-heavy, imperative code to using the more intuitive `map`, `filter`, and `reduce` higher-order functions.
In this article, I hope to highlight the transformation that occurs, along with the simplification, when moving away from the imperative and onto the declarative.
We shall be performing a simple process that transforms a collection of user entries into a filtered collection of their names.
Although trivial in nature, it is a great way to highlight the power of the paradigm shift.

<!--more-->

Below you will find the initial collection of user entries we wish to process.
The objective is to create a function that returns only the users' names while excluding the one associated with a supplied ID.

```php
$users = [
    [ 'id' => 1, 'name' => 'Joe' ],
    [ 'id' => 2, 'name' => 'Bob' ],
    [ 'id' => 3, 'name' => 'Sally' ],
];
```

## Imperative Approach

Looking at this problem with an imperative mindset leads us to iterating through the collection, adding names to a temporary collection that match the desired predicate.
This boilerplate code is sprinkled throughout many codebases, and although correct, I feel it can be improved in its intent and expression.

```php
function getNames(array $users, $excludeId)
{
    $names = [];

    foreach ($users as $u) {
        if ($u['id'] != $excludeId) {
            $names[] = $u['name'];
        }
    }

    return $names;
}
```

## Mapping and Filtering

The first higher-order functions we shall use to tackle this problem are `map` and `filter`.
As their names suggest, mapping over a collection applies the given function to each of its elements, whereas filtering returns the matching elements based on a supplied predicate function.
Using these two functions, we are able to break apart the problem very clearly into its two individual pieces.
Unfortunately, within PHP, we do have to provide quite verbose declarations, but I feel the intent is still more clearly highlighted.

```php
function getNames(array $users, $excludeId)
{
    $filtered = array_filter($users, function ($u) use ($excludeId) {
        return $u['id'] != $excludeId;
    });

    return array_map(function ($u) { return $u['name']; }, $filtered);
}
```

## Reducing

The solution above is a significant improvement, in my opinion, but it can be made even better with the introduction of `reduce`.
Simply put, `reduce` can be considered the backbone of both `map` and `filter`, as both functions can be created from it.
In this instance, the supplied function is applied to each of the elements in the collection.
This may sound similar to `map`; however, the addition of an accumulator value (initial value supplied), which is passed and returned upon each element application, allows you to craft the result you desire.
Using this higher-order function provides far more flexibility in the resulting transformation.
Whereas mapping focuses on transforming individual elements, and filtering removes elements from the collection, reducing can do both and much more.

```php
function getNames(array $users, $excludeId)
{
    return array_reduce($users, function ($acc, $u) use ($excludeId) {
        if ($u['id'] == $excludeId) {
            return $acc;
        }

        return array_merge($acc, [ $u['name'] ]);
    }, []);
}
```

Again, PHP's syntax leaves a lot to be desired regarding the declaration of lambda functions and immutable arrays.
However, I believe the intent of the code has been significantly improved from the original imperative solution.
