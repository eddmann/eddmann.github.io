---
layout: post
title: 'Optional Value Control-flows in PHP using Traits and Magic-methods'
meta: 'Discover elegant techniques to handle optional values in PHP using traits, magic methods, and composition to streamline control flows and reduce boilerplate code.'
tags: php
---

Recently, I have been interested in experimenting with different ways to handle optional values.
There are many examples that exist demonstrating the use of the Maybe/Optional structure within the PHP landscape.
I would instead like to focus my attention on only looking into the concept of `orElse`, which I have found to be a prominent control-flow when using these types of values.

<!--more-->

Typically, in an imperative mindset we are accustomed to evaluating a value, and based on its existence — defined as falsy in this context — we follow a different course of action.
This can be clearly seen in the following two examples:

```php
$cart = $repository->findById(1);
if ($cart === null) $cart = new ShoppingCart;

$cart = $repository->findById(1) ?: new ShoppingCart;
```

These two examples both attempt to fetch a shopping cart from a repository, which, by looking at the defined guards, may not exist.
As a result of this, we are required to write extra boilerplate code to handle the possibility of failure, using either a conditional block with reassignment or the ternary null trick provided within PHP.

### Using Traits

I was interested to see if there were any other ways of more clearly expressing this intent, following the popular control-flow concept provided within Optional types.

```php
trait OrElse
{
    public function __call($name, array $args)
    {
        $isOrElse =
            preg_match('/OrElse$/i', $name) === 1 &&
            count($args) > 0;

        if ($isOrElse) {
            $orElse = array_pop($args);
            $result = $this->{substr($name, 0, -6)}(...$args);

            if ($result == false) {
                return is_callable($orElse) ? $orElse() : $orElse;
            }

            return $result;
        }
    }
}
```

This trait takes advantage of PHP's dynamic message passing nature, essentially wrapping calls with the boilerplate code typically required.
Any unknown method calls are checked to see if they end in `OrElse` and include at least one argument.
If this is the case, the last argument is removed from the supplied parameters array and the intended method (excluding `OrElse`) is invoked with the remaining arguments.
Finally, the boilerplate guard logic that we typically see handling the occurrence of falsy values is encapsulated into this single location.
If a falsy value is returned from the method invocation, the user-defined literal or function value is returned instead.
The code initially described could now be rewritten as follows, assuming that the repository includes the trait in its definition.

```php
$cart = $repository->findByIdOrElse(1, new ShoppingCart);
$cart = $repository->findByIdOrElse(1, function () { return new ShoppingCart; });
```

You can see from the examples above how we have been able to be more expressive within the method call, describing its intent more clearly.
This method now reads as one that expects the possibility of a non-existent or alternative return value.
The second example is a rewrite of the first, taking into consideration the fact that all method parameters are interpreted during invocation — resulting in the possibility of a new cart being created but never required.
Instead, the value is wrapped in a function which is lazily called by the trait implementation if needed.

### Using Composition

If you are against the idea of altering the behaviour of the class by adding a trait — and instead wish to perform such actions ad hoc — the following example shows how the same can be achieved through composition.

```php
class OrElse
{
    use OrElseTrait { __call as orElseCall; }

    private $object;

    public function __construct($object)
    {
        $this->object = $object;
    }

    public function __call($name, array $args)
    {
        if (method_exists($this->object, $name)) {
            return $this->object->$name(...$args);
        }

        return $this->orElseCall($name, $args);
    }
}
```

Using a proxy class, we are able to direct any existing method calls to the supplied object, handling non-existent methods via the `OrElse` trait.
This implementation can then be used in the following manner.

```php
$orElseRepository = new OrElse($repository);
$cart = $orElseRepository->findByIdOrElse(1, new ShoppingCart);
```

### Using Basic Functions

Finally, a completely different way to control the flow of returned values is by coding up a simple function as follows.

```php
function _or(...$args)
{
    foreach ($args as $arg) {
        if ($result = is_callable($arg) ? $arg() : $arg) {
            return $result;
        }
    }
}
```

This function simply iterates over all its arguments, evaluating each until one returns a truthy value, which it subsequently returns.
This is by far the least obstructive manner in which to implement such control flow capabilities, but in my opinion does not read as nicely as the above two examples.
This example can be used to achieve the same results as before, using the following approach.

```php
$cart = _or($repository->findById(1), new ShoppingCart);
```

I hope you have enjoyed this thought experiment into how we can extract and use concepts from different paradigms in our day-to-day code.
Also, it may have sparked some interest in seeing how you can take advantage of PHP Traits along with magic method invocation.
