---
title: 'Optional Value Control-flows in PHP using Traits and Magic-methods'
link: https://tech.mybuilder.com/optional-value-control-flows-in-php-using-traits-and-magic-methods/
meta: 'Exploring optional value control-flows using multiple PHP features'
---

Recently I have been interested in experimenting with different ways to handle optional values.
Their are many examples that exist demonstrating the use of the Maybe/Optional structure within the PHP landscape.
I would instead like to focus my attention on only looking into the concept of 'orElse', which I have found to be a prominent control-flow whilst using these types of value.

<!--more-->

Typically, in an imperative mind-set we are accustom to evaluating a value, and based on its existence — defined as falsely in this regard — follow a different course of action, and by-way result.
This can be clearly seen in the following two examples:

```php?start_inline=1
$cart = $repository->findById(1);
if ($cart === null) $cart = new ShoppingCart;

$cart = $repository->findById(1) ?: new ShoppingCart;
```

These two examples both attempt to fetch a shopping cart from a repository, which by looking at the defined guards may not exist.
As a result of this, we are required to write extra boilerplate code to handle the presence of failure - using either a conditional block with reassignment or the ternary null trick provided within PHP.

### Using Traits

I was interested to see if there were any other ways of more clearly expressing this intent, following the discussed popular control-flow provided within Optional types.

```php?start_inline=1
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
Any unknown method calls are checked to see if they end in 'OrElse' and include at least a single argument.
If this is the case, the last argument is popped off the supplied parameters array and the intended method (excluding OrElse) is invoked with the remaining arguments.
Finally, the boilerplate guard logic that we typically see handling the occurrence of falsely values is encapsulated into this single location.
If a falsely value is returned from the method invocation the user defined literal or function value is returned instead.
The code initially described could now be rewritten as follows, assuming that the repository included the trait in its definition.

```php?start_inline=1
$cart = $repository->findByIdOrElse(1, new ShoppingCart);
$cart = $repository->findByIdOrElse(1, function () { return new ShoppingCart; });
```

You can see from looking at the examples above how we have been able to be more expressive within the method call, describing its intent more clearly. This method now reads as one that expects the possibility of an non-existent/alternative return value. The second example is a rewrite of the first, taking into consideration the fact that all method parameters are interpreted during invocation — resulting in the possibility of a new cart being created but never required. Instead the value is wrapped in a function which is lazily called by the trait implementation if needs be.

### Using Composition

If you are against the idea of altering the behavior of the class by adding a trait — and instead wish to do such actions ad-hoc — the following example shows how the same can be achieved through composition.

```php?start_inline=1
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

Using a proxy class we are able to direct any existing method calls to the supplied object, handling non-existent methods by-way of the OrElse trait.
This implementation can then be used, in the following manner.

```php?start_inline=1
$orElseRepository = new OrElse($repository);
$cart = $orElseRepository->findByIdOrElse(1, new ShoppingCart);
```

### Using Basic Functions

Finally, a completely different way to control the flow of returned values is by coding up a simple function like so.

```php?start_inline=1
function _or(...$args)
{
    foreach ($args as $arg) {
        if ($result = is_callable($arg) ? $arg() : $arg) {
            return $result;
        }
    }
}
```

This function simply iterates over all its arguments, evaluating each until one returns a truthy value which it subsequently returns.
This is by far the least obstructive manner in which to implement such control flow capabilities, but in my opinion does not read as nicely as the above two examples.
This example can be used to achieve the same results as before, using the following approach.

```php?start_inline=1
$cart = _or($repository->findById(1), new ShoppingCart);
```

I hope you have enjoyed this thought experiment into how we can extract and use concepts from different paradigms in our day-to-day code.
Also, it may have sparked some interest in seeing how you can take advantage of PHP Traits along with Magic method invocation.
