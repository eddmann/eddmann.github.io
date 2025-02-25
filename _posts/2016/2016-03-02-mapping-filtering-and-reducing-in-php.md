---
layout: post
title: 'Mapping, Filtering and Reducing in PHP'
meta: 'Exploring how to transform common-place imperative code, with these higher-order functions.'
---

Over the past couple of years I have transitioned from boilerplate-heavy, imperative code, to begin using the more intuitive `map`, `filter` and `reduce` higher-order functions.
In this article I hope to highlight the transformation that occurs, along with simplification, when moving away from the imperative and onto the declarative.
We shall be performing a simple process which transforms a collection of user entries into a filtered collection of their names.
Although trivial in nature, it is a great place to highlight the power of the paradigm shift.

<!--more-->

Below you will find the initial collection of user entires we wish to process.
The objective is to create a function which returns only the users names, excluding however, the one associated to a supplied id.

```php
$users = [
    [ 'id' => 1, 'name' => 'Joe' ],
    [ 'id' => 2, 'name' => 'Bob' ],
    [ 'id' => 3, 'name' => 'Sally' ],
];
```

### Imperative Approach

Looking at this problem with an imperative mindset leads us to iterating through the collection, adding names to a temporary collection which match the desired predicate.
This boilerplate code is sprinkled throughout many code-bases, and although correct, I feel can be improved upon in its intent and expression.

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

### Mapping and Filtering

The first higher-order functions we shall be using to tackle this problem are the `map` and `filter`.
As their names suggests, mapping over a collection applies the given function to each of its' elements, were as filtering returns the matching elements based on a supplied predicate function.
Using these two functions we are able to break apart the problem very clearly into its two individual pieces.
Unfortunately however, within PHP we do have to provide quiet verbose declarations, but the intent I feel is still more clearly highlighted.

```php
function getNames(array $users, $excludeId)
{
    $filtered = array_filter($users, function ($u) use ($excludeId) {
        return $u['id'] != $excludeId;
    });

    return array_map(function ($u) { return $u['name']; }, $filtered);
}
```

### Reducing

The solution above is a significant improvement in my opinion, but can be made even better with the introduction of `reduce`.
Simply put `reduce` can be considered the backbone of both `map` and `filter`, as both functions can be created from it.
In this instance the supplied function is applied to each of the elements in the collection.
This may sound similar to a `map`, however the addition of an accumulator value (initial value supplied) which is supplied and returned upon each element application, allows you to craft the result you desire.
Using this higher-order function provides you with far more flexibility in the resulting transformation.
Were as mapping focuses on transforming individual elements, and filtering removes elements from the collection, reducing can do both and so much more.

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

Again sadly PHP's syntax leaves a lot to be desired in regard to declaration of lambda functions and immutable arrays.
However, again the intent of the code to me has been significantly improved from the original imperative solution.
