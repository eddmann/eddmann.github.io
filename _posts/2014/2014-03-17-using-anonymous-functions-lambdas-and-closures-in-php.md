---
layout: post
title: 'Using Anonymous Functions (Lambdas) and Closures in PHP'
meta: 'Explanation and example-usage of the two concepts in PHP.'
---

Having spent some significant time with more functional-oriented languages such as Scala, I have been keen to explore and take advantage of some of these concepts in my current day-to-day language (PHP).
Delving into the subject however seems to highlight some confusion between the to two discussed concepts.
An anonymous function (aka. lambda) originating from the [Lambda calculus](http://en.wikipedia.org/wiki/Lambda_calculus), is a function that has no assigned name and can be considered a value in itself.
Functions of this category are first-class value types, on par with integers, booleans etc, allowing you to pass them as arguments or returned by functions (aka. higher-order functions).
A closure on the other hand is a function that captures the state of the surrounding context/environment upon definition, retaining these references even if the variable falls out of lexical scope.
Both do not depend on the other on an implementation level, however, you typically see the two used in conjunction. <!--more-->
Below is an example of a trivial addition lambda and use-case.

```php
$add = function($a, $b)
{
    return $a + $b;
};

get_class($add); // Closure

$add(1, 2); // 3
```

Upon inspection of the resulting instances class type it may look incorrect.
However, in PHP it can be a little confusing to disambiguate between the differences of lambdas and closures, as both create an object of the type 'Closure'.
Initially this was an implementation detail that could change in future releases, however, as time has past this fact can now be relied upon.
Below is an example of using a Closure to implement increment functionality.
Take notice of the inclusion of the 'use' keyword which allows us to disambiguate between the two concepts in code.

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

In the above case we create a 'regular' function which is supplied with the desired incremental step.
When called, a new closure is returned which keeps a referential hold on the '$inc' value and specified step.
'$inc' and '$step' are local function variables that are bound/closed over the returned closure function to retain the reference.

## Validation Library Example

These trivial examples are all well and good for an article example, but what may help is a concrete use-case where the power of the two concepts can be truly understood.
Combined, the two provide you with the ability to allow clients to easily extend a defined implementation, supplying their own behavior, without the overhead of exploiting OO inheritance.

So as to provide a real-life use case I have abstracted out the dynamic method implementation into a trait that can then be reused.
Simplify explained the following example allows a user to register a lambda/closure with the specified instance, which is invoked if no concrete method of the same name exists within the class.

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

The use of object binding ('bindTo') allows us (similar to JavaScript) to give the function a context, making sure '$this' and 'static' access the correct environment.
Below is the example validation library that uses the trait above, allowing the client to expand the rules available on an instance basis (works well with a singleton IoC).
Note the used validation 'isRuleName' pattern, and ability to validate the negation of a specified rule.

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

The library above provides a very minimalist set of validation rules that any real-world use-case would soon demand more from.
Typically, the OO hat would come on, and you would continue to extend the class definition with your own custom validaters.
However, with the inclusion of the 'DynamicMethod' trait we are able to simply extend the functionality through use of functions.
Below shows an example of creating email validation functionality by way of registering a lambda with the instance.

```php
$v->register('isEmail', function()
{
    return filter_var($this->subject, FILTER_VALIDATE_EMAIL);
});

$v->check('joe@bloggs.com')
    ->is('present', 'email', '!number')
    ->valid(); // bool(true)
```

As you can see, we are able to access the instance variables/environment in a similar manner to methods that are defined in the class itself.
We are also able to run the validation check in a similar manner too.
We are then able to expand on this example by using a closure which uses the current states '$domains' array to not only run the previous check but also make sure that the domain is present in a specified white-list.

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

Looking at the example library above I hope that you are able to notice some of the strengths that come from taking advantage of these concepts.
