---
layout: post
title: 'Simple Function Driven-Development'
meta: 'Discover the power of simplicity in PHP with function driven development techniques, optimised caching, and templating for efficient backend design.'
tags: ['php']
---

I recently had the chance to rewrite the backend of my [personal website](http://github.com/eddmann/eddmann).
I was surprised at how accustomed I had become to using heavy-weight web frameworks (with plenty of accompanying dependencies) in larger projects I am involved in, that I instead decided to do the complete opposite.
As a result, I built a very simple single-page Markdown file-based blogging platform (inc. pagination, caching) that only takes a few moments to read.
I find myself sometimes being blinded by the need to abstract everything with the object-oriented philosophy, never taking the time to consider that in many cases it pays off to keep things simple.
Simple, single-purpose functions that can be used for multiple use-cases within your application are a very good mind-set to try and incorporate.
In this post I wish to discuss a couple of the functions that I created to keep the file so simple.

<!--more-->

## Configuration

This function was inspired by Laravel's ability to parse associative arrays using dot notation i.e. ('foo.bar' -> $arr['foo']['bar']).
As you can see this is an extremely easy to read function that simply requires the supplied configuration file once (using a static variable).
It then attempts to split up the supplied key, traversing through the configuration array to end at the result.

```php
function config($key = '', $file = 'config.php')
{
    static $config = null;

    if ($config === null) {
        $config = require $file;
    }

    $parsed = explode('.', $key);

    $result = $config;

    while ($parsed) {
        $result = $result[array_shift($parsed)];
    }

    return $result;
}
```

## Cache

Being a file-based blogging platform with meta-data and Markdown content to parse, caching the results is a very desired process to include.
Again, a very general implementation has been implemented for greater flexibility.
The key is hashed and its value stored in a file of that name.
If there is a cache miss (i.e. first time accessing that key) the value closure will be executed and the result stored in the described file.
Provided is also a check to make sure a false boolean was not returned, allowing us to have control within the closure of whether to cache the result or not.

```php
function cache($key, callable $value, $directory = './cache/')
{
    ! is_dir($directory) && mkdir($directory);

    $path = $directory . '/' . md5($key);

    if ( ! file_exists($path)) {
        $result = $value();

        if ($result !== false) {
            file_put_contents($path, $result);
        } else {
            return false;
        }
    }

    return file_get_contents($path);
}
```

## Template

This simple function allows you to easily parse template files with the provided available variables.
I have found this to be very useful in splitting up business logic from complex presentations (separation of concerns) in multiple examples.
I have been a little relaxed with my use of the dreaded `eval` function, but as we are the only ones who will be working with the templates (no user-input), I feel this can be omitted.

```php
function tmpl($file, $vars = [], $directory = './templates/')
{
    ob_start();

    extract($vars);

    eval('?>' . file_get_contents($directory . $file));

    return ob_get_clean();
}
```

## Example

To piece all these functions together into a collective example I have decided to demonstrate with a cached Fibonacci calculation, the desired number being stored in a configuration file.
Below is the example multi-level configuration file we will be using, defining that we wish to calculate the 50th Fibonacci number.

```php
# config.php

return [
    'fibonacci' => [
        'calculate' => 50
    ]
];
```

The below template is a simple example of splitting the presentation from code logic.

```php
# fibonacci.tmpl.php

echo "The $n fibonacci number is: $result\n";
```

Finally, to piece it all together we fetch the desired number from the configuration file and return the result from the cache (calling the value closure on the initial cache miss).
The last step is to simply pass the template the two variables for displaying.

```php
$n = config('fibonacci.calculate');

$result = cache('fibonacci_' . $n, function() use ($n)
{
    $a = 1; $b = 1; $result = 0;

    for ($i = 1; $i <= $n - 2; $i++) {
        $result = $a + $b;
        $b = $a;
        $a = $result;
    }

    return $result;
});

echo tmpl('fibonacci.tmpl.php', compact('n', 'result'));
```
