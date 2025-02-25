---
layout: post
title: 'Accessors (Getter/Setter) and Singleton Traits in PHP'
meta: 'Learn how to implement accessors (getter/setter) and singleton traits in PHP to reduce boilerplate code and accelerate development.'
tags: php
---

Traits were introduced into the PHP language in 5.4, and from this point many interesting use-cases have appeared.
One such instance is the reduction in boilerplate code when prototyping a new idea.
Though these should be implemented within the project before completion, I have found that using the two traits below helps to speed up the development life-cycle.

<!--more-->

## Accessors (Getter/Setter)

With encapsulation being an incredibly important aspect of object-oriented programming, accessors and mutator methods provide the user with an interface to interact with a class instance in a controlled manner.
However, during the early stages of development, creating these methods can be very cumbersome and time-consuming.
Sure, you can let your IDE do all the boilerplate insertion, or maybe we should all move to a language such as C# which has great syntactic sugar for these properties.
The trait below, however, dynamically sets and gets instance properties based on the common method naming pattern.
For example, `setFirstName` will set the `firstName` property, whereas `getFirstName` will return the instance's value.

```php
trait Accessors {

    public function __call($method, $args)
    {
        if ( ! preg_match('/(?P<accessor>set|get)(?P<property>[A-Z][a-zA-Z0-9]*)/', $method, $match) ||
             ! property_exists(__CLASS__, $match['property'] = lcfirst($match['property']))
        ) {
            throw new BadMethodCallException(sprintf(
                "'%s' does not exist in '%s'.", $method, get_class(__CLASS__)
            ));
        }

        switch ($match['accessor']) {
            case 'get':
                return $this->{$match['property']};
            case 'set':
                if ( ! $args) {
                    throw new InvalidArgumentException(sprintf("'%s' requires an argument value.", $method));
                }
                $this->{$match['property']} = $args[0];
                return $this;
        }
    }

}
```

Looking at the code above, you will notice that we use PHP's `__call` magic method to determine if the user's invoked method is of interest to us.
To maintain control of this trait's _magic_, the call only looks for properties that exist within the class that the trait has been used in.
However, you are able to replace `__CLASS__` with `$this` to provide the entire class's properties with these capabilities, but I found this restriction beneficial when refactoring the code-base.
Below is an example use-case for including this trait.

```php
class User {
    use Accessors;
    private $name, $age;
}

$user = new User();
$user->setName('Joe Bloggs');
$user->setAge(24);

sprintf("Name: %s, Age: %s\n", $user->getName(), $user->getAge()); // Name: Joe Bloggs, Age: 24
```

## Singleton

Another trait that I have found very useful in the initial stages of development is for implementing the [Singleton pattern](http://en.wikipedia.org/wiki/Singleton_pattern).
Below is an example implementation which, on the first `getInstance` invocation, creates a class instance with the provided arguments.

```php
trait Singleton {

    protected static $instance;

    final public static function getInstance()
    {
        if ( ! isset(self::$instance)) {
            $class = new ReflectionClass(__CLASS__);
            self::$instance = $class->newInstanceArgs(func_get_args());
        }

        return self::$instance;
    }

    final private function __clone() { }

    final private function __wakeup() { }

}
```

The code snippet above uses PHP's [ReflectionClass](http://www.php.net/manual/en/class.reflectionclass.php) to enable classes that incorporate it to still define a unique constructor method.
Below is an example that highlights the trait in action.

```php
class Logger {
    use Singleton;

    private $init;

    public function __construct($init)
    {
        $this->init = $init;
    }

    public function getInitTime()
    {
        return $this->init;
    }

}

$logger = Logger::getInstance(time());

$logger->getInitTime(); // 1390901816
```
