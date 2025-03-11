---
layout: post
title: 'Tuples in PHP'
meta: 'A comprehensive guide on implementing tuples in PHP using SPLFixedArray, featuring both partially applied and dynamically typed tuple examples for robust and efficient code.'
tags: ['php', 'data-structures']
---

Since exploring languages such as Scala and Python which provide the tuple data structure, I have been keen to experiment with how to clearly map it into a PHP solution.
Tuples are simply a finite, ordered sequence of elements - usually with good language support to both pack (construction) and unpack (deconstruction) the values.
I have found that many use cases of the commonplace array structure in PHP could be better suited to n-tuples.
Familiar examples such as coordinate pairs (points) and records from a relational database (e.g. a user id and name) could succinctly take advantage of the structure.

<!--more-->

I discussed briefly that what makes tuples so powerful in the highlighted languages is their excellent support for handling their contents.
For example, one can unpack a user tuple into separate id and name variables.
PHP supports this form of unpacking for arrays using the `list` function, which I frequently use to return multiple values from a function or method invocation.

## Implementation

With a basic understanding of what a tuple is, I set about creating a thought experiment in PHP, deciding to take advantage of the [SPLFixedArray](http://www.php.net/manual/en/class.splfixedarray.php) class.
As a tuple is of a finite length, using the fixed array class will (in theory) provide performance enhancements, along with removing the need to implement the [ArrayAccess](http://www.php.net/manual/en/class.arrayaccess.php) interface.
Before I began designing the example below, I did some research on prior work in the field and noticed a great implementation found [here](http://forrst.com/posts/Tuples_for_PHP-O3A).
This implementation also provided the option for values to be strictly typed, specifying each position's valid type by means of a prototype.
I was very impressed by this idea and decided to include it in my implementation, enabling the creation of tuples with relaxed typing using the 'mixed' data type.

```php
class Tuple extends SplFixedArray {

    protected $prototype;

    public function __construct(array $prototype, array $data = [])
    {
        parent::__construct(count($prototype));

        $this->prototype = $prototype;

        foreach ($data as $offset => $value) {
            $this->offsetSet($offset, $value);
        }
    }

    public function offsetSet($offset, $value)
    {
        if ( ! $this->isValid($offset, $value)) {
            throw new RuntimeException;
        }

        return parent::offsetSet($offset, $value);
    }

    protected function isValid($offset, $value)
    {
        $type = $this->prototype[$offset];

        if ($type === 'mixed' || gettype($value) === $type || $value instanceof $type) {
            return true;
        }

        return false;
    }

    public function __toString()
    {
        return get_class($this) . '(' . implode(', ', $this->toArray()) . ')';
    }

    public static function create(/* $prototype... */)
    {
        $prototype = func_get_args();

        return function() use ($prototype)
        {
            return new static($prototype, func_get_args());
        };
    }

    public static function type($name, array $prototype)
    {
        if (class_exists($name) || function_exists($name)) {
            throw new RuntimeException;
        }

        $eval = sprintf(
            'class %s extends Tuple { ' .
                'public function __construct(array $data) { ' .
                    'return parent::__construct(%s, $data); ' .
                '}' .
            '}',
            $name, "['" . implode("','", $prototype) . "']"
        );

        $eval .= sprintf(
            'function %s() { return new %s(func_get_args()); }',
            $name, $name
        );

        eval($eval);
    }

}
```

Looking at the example implementation above, you will notice that I make full use of the `SPLFixedArray` class.
The only array access method that I override is `offsetSet`, which first checks the validity of the value against the provided prototype.
The two interesting inclusions in this class that I would like to highlight are the static `create` and `type` methods.

## Creating a Tuple

Using the `create` method, you are able to create a partially applied class instantiation (by providing the prototype).
This allows you to use the implementation as shown below, creating a 'point' constructor (stored in a variable) which can be called with the desired values to form a concrete tuple instance.

```php
$point = Tuple::create('double', 'double');

$point(1.0, 2.5); // Tuple(1, 2.5)

$point(1.5, 3.0)[1]; // 3.0
```

## Creating a Typed Tuple

As explained above, I was very impressed by the implementation's use of data types.
As such, I explored how I could create new tuple data types based on the prototype, which could ideally be type-hinted.
I was able to achieve this by using the `eval` function (our good friend), dynamically creating a new class based on the provided details.
To provide the user with a friendlier way to create the data type (inspired by Python), I also created a function (using the same name) that returns a new instance of the class when invoked.
Below is a similar example to the one displayed above; this time, however, we are creating and using a new tuple data type called _Point_.

```php
Tuple::type('Point', [ 'double', 'double' ]);

Point(1.0, 2.5); // Point(1, 2.5)
```

This new data type can then be used to type-hint parameters in a function or method, as shown below.
Note the use of the `list` function to unpack the point into its constituent parts before returning a new _Point_ tuple.

```php
function process(Point $point)
{
    list($x, $y) = $point;

    return Point($x * 2, $y * 2);
}

process(Point(1.0, 2.5)); // Point(2, 5)
```

## Resources

- [What is a Tuple?](http://whatis.techtarget.com/definition/tuple)
- [Tuples in PHP](https://coderwall.com/p/bah4oq)
- [Forrst - Tuples for PHP](http://forrst.com/posts/Tuples_for_PHP-O3A)
