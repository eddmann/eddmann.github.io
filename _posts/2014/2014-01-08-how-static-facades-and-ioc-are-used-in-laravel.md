---
layout: post
title: 'How Static Facades and IoC are used in Laravel'
meta: 'Demystifying the magic behind Static Facades and IoC in Laravel: Discover how Laravel employs static facades and inversion of control to enhance flexibility and maintainability.'
tags: laravel php
---

When you first take a look at [Laravel](http://laravel.com/) you may ask yourself, what is with all the static?
It is a valid question, as on the surface it can seem like the framework is heavily static method based.
However, this could be no further from the truth.
A deeper exploration reveals that the static calls we make really mask a great number of instance objects.
In this post I hope to provide a simple explanation as to what is really going on, and along the way build a basic implementation to practise these newfound findings.

<!--more-->

## Inversion of Control Container

A concept that gets thrown around a lot when the topic of discussion turns to Laravel is the [Inversion of Control](http://en.wikipedia.org/wiki/Inversion_of_control) (IoC) container.
Simply put, it provides you with a key-value store for resolving the instance of a class you wish to use.
The typical object-orientated flow of static assignment is then replaced with a builder object, which binds objects at run-time.
Though this may seem on the surface to over-complicate matters, removing the benefits of compile-time static analysis, it provides us with great control over how and what object instances are used.
Using this technique allows us to easily replace instances with other conforming implementations - a good example of this can be seen for mocking objects when testing.
Now that we have conceptualised the technique from a high level, I know that personally nothing beats a clean, focused example.

```php
class App {

    private static $instances = [];

    public static function set($name, $instance)
    {
        if (is_string($instance)) {
            $instance = new $instance();
        }

        static::$instances[$name] = $instance;
    }

    public static function get($name)
    {
        $instance = static::$instances[$name];

        if ($instance instanceof Closure) {
            $instance = $instance();
        }

        return $instance;
    }

}
```

For brevity, the solution shown above uses a static implementation.
We are only going to require a single container for this example.
The two defined methods wrap the interaction with the associative array, allowing the user to either add or retrieve an instance (by name) from the container.
When adding an item, a name and instance (or means to create an instance) must be supplied.
When retrieving an instance, the key's value is checked to see if it is a closure or anonymous function.
If so, it is called before being returned.
This provides you with the flexibility of supplying the container with more complex requirements when creating an instance, including constructor arguments.
For simplicity, the option to provide a class name by string has been included.
Supplying a class name creates a new instance of the class (by way of an empty constructor), with the instance being shared between retrieval requests (similar to a singleton).
We can then use this implementation in the manner shown below.

```php
interface MessageInterface {

    public function greeting();

}

class EnglishMessage implements MessageInterface {

    public function greeting() { return 'Hello!'; }

}

App::set('message', function() { return new EnglishMessage(); });
// or
App::set('message', 'EnglishMessage');

echo App::get('message')->greeting(); // Hello!
```

It may seem like an over-complication to include an interface in this example.
However, the design choice will become clear in the following discussion.
We are now able to retrieve the desired class instance by name alone, ignoring any implementation details required to instantiate and return the instance.
This abstraction also allows us to define an alternative implementation, shown below with replacing the existing example instance.

```php
class FrenchMessage implements MessageInterface {

    public function greeting() { return 'Bonjour!'; }

}

App::set('message', 'FrenchMessage');

echo App::get('message')->greeting(); // Bonjour!
```

The same call to the message instance at run-time will now use the alternative 'FrenchMessage' class instance.
No tedious code modification is required as the process occurs dynamically.
One issue that you may highlight, though, is the loss of succinct class declaration.
With the added requirement of having to retrieve the instance from the container before acting upon it, code can start to look very verbose.

## Facades

PHP provides us with a very elegant way of solving this problem, allowing us to define how missing class methods should be handled in code.
With this power, we are able to add the same level of indirection present in the IoC container, 'facading' the verbose resolution with the clean static syntax.
Below is a simple implementation which addresses this requirement.

```php
abstract class Facade {

    protected static function getName()
    {
        throw new Exception('Facade does not implement getName method.');
    }

    public static function __callStatic($method, $args)
    {
        $instance = App::get(static::getName());

        if ( ! method_exists($instance, $method)) {
            throw new Exception(get_called_class() . ' does not implement ' . $method . ' method.');
        }

        return call_user_func_array([ $instance, $method ], $args);
    }

}
```

The example implementation above defines an abstract 'Facade' class which provides the dynamic static invocation required by each facade.
There is a requirement for each facade created to override the 'getName' method, simply returning the related name of the container instance.
As static methods cannot rightfully be made abstract, we instead throw an exception which informs the user of this restriction.
Being the only concrete method defined in the class, any resolved container instance with a method called 'getName' will not be successfully called as it will not invoke `__callStatic`.
In a more developed implementation, this method name could be changed to something that would reduce the risk of conflicting with instance method names.
The other method that is defined is the [magic](http://www.php.net/manual/en/language.oop5.magic.php) `__callStatic` method, providing the ability to handle missing static method calls.
Using the name that is returned in the concrete facade class, we are able to retrieve the correct instance from the container.
From here, we simply check to see if the instance contains the method.
If this is not the case, we throw a suitable error for the user.
Finally, we call the method on the instance, passing in any arguments that were specified and return the result.
The example below expands on the previous message implementation to take advantage of the more elegant looking facade type.

```php
class Message extends Facade {

    protected static function getName() { return 'message'; }

}

echo Message::greeting(); // Hello!

App::set('message', 'FrenchMessage');

echo Message::greeting(); // Bonjour!

try {
    echo Message::goodbye();
} catch (Exception $ex) {
    echo $ex->getMessage();
} // Message does not implement goodbye method.
```

So now we have been able to create an implementation which has all the flexibility provided to us by dynamic class instantiation and invocation, while retaining the succinct properties of static classes.

## Resources

- [Laravel: IoC Container](http://laravel.com/docs/ioc)
- [Laravel: Facades](http://laravel.com/docs/facades)
- [Inversion of Control Containers and the Dependency Injection pattern](http://martinfowler.com/articles/injection.html)
- [PHP: Magic Methods](http://www.php.net/manual/en/language.oop5.magic.php)
