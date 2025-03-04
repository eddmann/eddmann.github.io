---
layout: post
title: 'Using Anonymous Functions (Lambdas) and Closures in PHP'
meta: 'Learn how to harness the power of anonymous functions and closures in PHP with clear examples on lambdas, dynamic methods, and validation libraries.'
tags: php functional-programming
---

Having spent some significant time with more functional-oriented languages such as Scala, I have been keen to explore and take advantage of some of these concepts in my current day-to-day language (PHP).
Delving into the subject, however, seems to highlight some confusion between the two concepts discussed.
An anonymous function (also known as a lambda), originating from the [Lambda calculus](http://en.wikipedia.org/wiki/Lambda_calculus), is a function that has no assigned name and can be considered a value in itself.
Functions of this category are first-class value types, on a par with integers, booleans, etc., allowing you to pass them as arguments or return them from functions (also known as higher-order functions).
A closure, on the other hand, is a function that captures the state of the surrounding context or environment upon definition, retaining these references even if the variable falls out of lexical scope.
Neither depends on the other at an implementation level; however, you typically see the two used in conjunction. <!--more-->
Below is an example of a trivial addition lambda and its use-case.

```php
$add = function($a, $b)
{
    return $a + $b;
};

get_class($add); // Closure

$add(1, 2); // 3
```

Upon inspection of the resulting instance's class type, it may appear incorrect.
However, in PHP it can be a little confusing to disambiguate between the differences of lambdas and closures, as both create an object of the type `Closure`.
Initially, this was an implementation detail that could change in future releases; however, as time has passed, this fact can now be relied upon.
Below is an example of using a closure to implement increment functionality.
Note the inclusion of the `use` keyword, which allows us to distinguish between the two concepts in code.

```php
function inc($step = 1)
{
    $inc = 0;

    return function() use (&$inc, $step)
    {
        return $inc += $step;
    };
}

$inc = inc();

get_class($inc); // Closure

$inc(); // 1
```

In the above case, we create a regular function that is supplied with the desired incremental step.
When called, a new closure is returned that keeps a referential hold on the `$inc` value and the specified step.
The `$inc` and `$step` variables are local function variables that are bound or closed over the returned closure to retain the reference.

## Validation Library Example

Although these trivial examples serve well in an post context, a concrete use-case may better illustrate the power of these two concepts.
Combined, the two provide you with the ability to allow clients to easily extend a defined implementation by supplying their own behaviour, without the overhead of using object-oriented inheritance.

To provide a real-life use-case, I have abstracted the dynamic method implementation into a trait that can then be reused.
Simply put, the following example allows a user to register a lambda or closure with the specified instance, which is invoked if no concrete method of the same name exists within the class.

```php
trait DynamicMethod {

    private $methods = [];

    public function register($name, Closure $closure)
    {
        $this->methods[$name] = $closure->bindTo($this, get_class());
    }

    public function __call($name, array $args)
    {
        if (isset($this->methods[$name])) {
            return call_user_func_array($this->methods[$name], $args);
        }

        throw new BadFunctionCallException("'$name' does not exist.");
    }

}
```

The use of object binding (using `bindTo`) allows us (similarly to JavaScript) to provide the function with a context, ensuring that `$this` and `static` access the correct environment.
Below is an example validation library that uses the trait above, allowing the client to expand the rules available on an instance basis (this works well with a singleton IoC).
Note the use of the validation `isRuleName` pattern, and the ability to validate the negation of a specified rule.

```php
class Validate {
    use DynamicMethod;

    private $subject, $rules;

    public function check($subject)
    {
        $this->subject = $subject;
        $this->rules = [];

        return $this;
    }

    public function is(/* $rules... */)
    {
        $this->rules = array_merge($this->rules, func_get_args());

        return $this;
    }

    public function valid()
    {
        foreach ($this->rules as $rule) {
            list($bool, $name) = static::process($rule);

            if ($bool != call_user_func_array([ $this, $name ], [])) {
                return false;
            }
        }

        return true;
    }

    private static function process($rule)
    {
        $bool = true;

        if (strpos($rule, '!') === 0) {
            $rule = substr($rule, 1);
            $bool = false;
        }

        $rule = str_replace(' ', '', ucwords(str_replace('_', ' ', $rule)));

        return [ $bool, 'is' . $rule ];
    }

    public function isPresent()
    {
        return !! $this->subject;
    }

    public function isAlpha()
    {
        return preg_match('/^[A-z]+$/', $this->subject);
    }

    public function isNumber()
    {
        return preg_match('/^[0-9]+$/', $this->subject);
    }

}

$v = new Validate;

$v->check('1234')
    ->is('present', 'number', '!alpha')
    ->valid(); // bool(true)
```

The library above provides a very minimalist set of validation rules from which any real-world use-case would soon demand more.
Typically, the object-oriented approach would be adopted, and you would continue to extend the class definition with your own custom validators.
However, with the inclusion of the `DynamicMethod` trait, we are able to simply extend the functionality through the use of functions.
Below is an example of creating email validation functionality by registering a lambda with the instance.

```php
$v->register('isEmail', function()
{
    return filter_var($this->subject, FILTER_VALIDATE_EMAIL);
});

$v->check('joe@bloggs.com')
    ->is('present', 'email', '!number')
    ->valid(); // bool(true)
```

As you can see, we are able to access the instance variables and environment in a similar manner to methods that are defined in the class itself.
We are also able to run the validation check in a similar manner.
We can then expand on this example by using a closure which utilises the current state of the `$domains` array to not only run the previous check, but also to ensure that the domain is present in a specified permit list.

```php
$domains = [ 'bloggs.com', 'bloggs.co.uk' ];

$v->register('isPermittedEmail', function() use ($domains)
{
    if ($this->isEmail()) {
        list($name, $domain) = explode('@', $this->subject);

        return in_array($domain, $domains);
    }

    return false;
});

$v->check('joe@bloggs.co.uk')
    ->is('present', 'permitted_email')
    ->valid(); // bool(true)
```

Looking at the example library above, I hope that you are able to notice some of the strengths that come from utilising these concepts.
