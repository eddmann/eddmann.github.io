---
layout: post
title: 'Implementing and Using Memoization in PHP'
meta: 'Learn how to implement memoization in PHP with simple examples and recursive calls, improving performance through caching.'
tags: ['php']
---

Memoization is a simple optimisation technique to understand and, in most cases, implement.
The base idea is to speed up function calls by avoiding the re-calculation of previously processed input results (very cache-like).
Storing these results in a key-value lookup store can result in major speed increases when repetitive function calls occur.

<!--more-->

[Dynamic programming](http://en.wikipedia.org/wiki/Dynamic_programming) algorithms such as the [Knapsack problem](http://en.wikipedia.org/wiki/Knapsack_problem) benefit greatly from using this technique.
However, the trade-off is that due to its caching underpinnings, functions with side-effects and reliance on external factors such as the current time may return incorrect results.
I have spent some time looking into languages such as [Groovy](http://groovy.codehaus.org/) which include this [functionality](http://mrhaki.blogspot.co.uk/2011/05/groovy-goodness-cache-closure-results.html) out of the box, and I wished to see if it was possible to create an implementation in PHP.
Further research found [php-memoize](http://github.com/arraypad/php-memoize) which looks like a great C module, showing promise in implementing the concept at a language library level.
Although I am impressed with the discussed module, I wished to see if it was possible to create an implementation in PHP userspace.

## Implementation

Below depicts a simple example implementation of a memoization function which takes advantage of PHP's first-class function support.

```php
$memoize = function($func)
{
    return function() use ($func)
    {
        static $cache = [];

        $args = func_get_args();
        $key = md5(serialize($args));

        if ( ! isset($cache[$key])) {
            $cache[$key] = call_user_func_array($func, $args);
        }

        return $cache[$key];
    };
};
```

Using a static `$cache` array allows us to keep a persistent lookup table between calls of the returned function.
In conjunction with this, hashing the serialised arguments array allows us to create a unique key we can set and lookup in the associative array per call.
The method supports either anonymous or string-identified functions, using the `call_user_func_array` method.

## Profiling

Now that we have an implementation, it is time to benchmark its performance, to see the resulting gains.
Below is a simple function which prints out the time duration taken for the supplied function to run.

```php
$timer = function($func)
{
    return function() use ($func)
    {
        $start = microtime(true);
        $result = call_user_func_array($func, func_get_args());
        echo sprintf("%f\n", microtime(true) - $start);
        return $result;
    };
};
```

We can now use the above function to benchmark the performance of the `sleepz` function declared below.

```php
function sleepz($time)
{
    sleep($time);
    return true;
}

$sleepz = $timer('sleepz');

// No Memoize
$sleepz(1); // 1.001020

$sleepz = $timer($memoize('sleepz'));

// 1st Memoize
$sleepz(1); // 1.001016

// 2nd Memoize
$sleepz(1); // 0.000028
```

As you can deduce from the output, the second call to the memoized function is significantly quicker than the first.
Comparing the non-memoized and first memoized function calls results in very similar time durations, as they are doing the same work.
Once the function call result has been stored in the memoized cache, the second call simply needs to look up the result and return the contents.
At an API level, this call looks the same as any other, but thanks to the cache, performance gains occur.

## Recursive Calls

One issue that appears when you spend a little time with the above implementation is recursive function calls.
Unlike in other languages, this high-level implementation is unable to rewrite internal function calls.
However, to get around this, we are able to use PHP's first-class function support.
Declaring the use of a reference to the function assignment variable successfully allows us to recursively call the memoized implementation.
This detail now requires the code logic to be present in an anonymous function.
As this is a thought exercise rather than a production-ready implementation, I am happy with the capabilities currently available in the language.

```php
$factorial = $memoize(function($n) use (&$factorial)
{
    return ($n < 2) ? 1 : $n * $factorial($n - 1);
});

$fibonacci = $memoize(function($n) use (&$fibonacci)
{
    return ($n < 2) ? $n : $fibonacci($n - 1) + $fibonacci($n - 2);
});

$factorial(10); // 3628800

$fibonacci(10); // 55
```

## Resources

- [Memoization](http://en.wikipedia.org/wiki/Memoization)
- [Dynamic programming](http://en.wikipedia.org/wiki/Dynamic_programming)
- [php-memoize](http://github.com/arraypad/php-memoize)
