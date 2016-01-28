---
layout: post
title: "Using Multiple Arrays with array_map in PHP"
meta: "Examples of supplying array_map with multiple arrays to be used within the callback"
---

Today I stumble upon some code that I did not realise was possible with an `array_map` function in PHP.
You are able to supply multiple arrays, which in turn will get 'zipped up' and passed to the supplied callback as parameters.
This allows for some rather elegant solutions to the 'index issue' and accessing keys from within the callback - both of which are easily achieved in an impertivive mindset.
<!--more-->

## Current Index

Using the `range` function we are able to supply a sequence of indexes based on the collection.
This allows us to access the current index from within the callback function.

{% highlight php startinline %}
$users = [ 'Joe', 'Bob', 'Sam' ];

array_map(function ($name, $position) {
    return compact('position', 'name');
}, $users, range(1, count($users)));

// [ position => 1, name => 'Joe' ]
// [ position => 2, name => 'Bob' ]
// [ position => 3, name => 'Sam' ]
{% endhighlight %}

## Key-Value Access

One use-case that a `foreach` provides is the ability to destructure an associative array, allowing you to access the key and value.
In its basic form an `array_map` seems to be missing this capability, however, with the ability to supply multiple arrays this is not the case.

{% highlight php startinline %}
$users = [ 123 => 'Joe', 456 => 'Bob', 789 => 'Sam' ];

array_map(function ($id, $name) {
    return compact('id', 'name');
}, array_keys($users), array_values($users));

// [ id => 123, name => 'Joe' ]
// [ id => 456, name => 'Bob' ]
// [ id => 789, name => 'Sam' ]
{% endhighlight %}
