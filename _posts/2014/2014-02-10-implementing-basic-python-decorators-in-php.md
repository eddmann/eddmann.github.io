---
layout: post
title: 'Implementing Basic Python Decorators in PHP'
meta: 'Implementing Python Decorators as a thought-experiment in PHP'
---

Having just stepped into the world of Python I think it is only human-nature to compare, if not contemplate solutions to, discovered given strengths in a more familiar language.
My familiar language being of-course PHP, I thought it would be a good thought experiment to see if I could design a basic decorator implementation in the language.
Decorators, as discussed in [another post](/posts/using-basic-auth-and-decorators-in-pythons-flask/), are an easy concept to explain.
Simply put they wrap specified functions with other functions, providing a means to compose new functions in a succinct manner.

<!--more-->

## The Implementation

PHP provides a means to rename existing user-land functions and subsequently redefine them, by-way of an extension called [runkit](http://php.net/manual/en/book.runkit.php).
For the remainder of the post I will be assuming that you have a sufficient setup configured as a prerequisite.
Below is a simple function that uses the 'runkit' extension to rename the existing function declaration to a meaningful wrapped name, then includes this new functions name in a call to the wrapper function.
This new logic is used to redefine the pre-existing original function name.

```php
function decorate($func, $wrap)
{
    $orig = $wrap . '_' . $func;
    runkit_function_rename($func, $orig);
    $body = sprintf(
        "return call_user_func_array('%s', array_merge([ '%s' ], [ func_get_args() ]));",
        $wrap, $orig
    );
    runkit_function_add($func, '', $body);
}
```

## Example Usage

Now that we have defined the 'decorate' method, lets put it to the test with an arbitrary example.
Below highlights an example which specifies a basic 'hello' function which we will soon hope to decorate.

```php
function hello($name)
{
    echo "Hello, $name!\n";
}
```

We will now define a couple of decorator functions used to log and time the specified functions activity.
You will notice looking at the examples below that the functions require a function name and argument array to be supplied which is used to chain the calls together.

```php
function logger($func, $args)
{
    $name = explode('_', $func); // last function invoked.
    echo end($name) . '(' . implode(', ' , $args) . ")\n";
    return call_user_func_array($func, $args);
}

function timer($func, $args)
{
    $start = microtime(true);
    $result = call_user_func_array($func, $args);
    echo sprintf("%s: %f\n", $func, microtime(true) - $start);
    return $result;
}
```

With the sample function and decorators now defined we can compose a new function from these individual pieces.

```php
decorate('hello', 'timer');
decorate('hello', 'logger');

echo hello('Bob');
// hello(Bob)
// Hello, Bob!
// timer_hello: 0.000007
```

Looking at the example above you can see that we recompose the definition of the original 'hello' function to be wrapped by the 'timer' and 'logger' functions.
With this new function we then call it with the argument 'Bob' which in-turn invokes the logger and timer functions, before calling the original code.

## Resources

- [runkit](http://php.net/manual/en/book.runkit.php)
- [Python: Decorators](http://wiki.python.org/moin/PythonDecorators)
