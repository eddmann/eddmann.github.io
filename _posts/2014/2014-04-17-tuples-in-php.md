---
layout: post
title: 'Tuples in PHP'
meta: 'Experimenting with a Tuple (optionally typed) implementation in PHP.'
---

Since exploring languages such as Scala and Python which provide the tuple data-structure, I have been keen to experiment with how to clearly map it into a PHP solution.
Tuples are simply a finite, ordered sequence of elements - usually with good language support to both pack (construction) and unpack (deconstruction) of the values.
I have found that many use-cases of the common place array structure in PHP could be better suited to n-tuple's.
Familiar examples such as coordinate pairs (points) and records from a relational database (i.e. maybe the user id and name) could succinctly take advantage of the structure.

<!--more-->

I discussed briefly that what makes tuples so powerful in the highlighted languages is their good support for handling their contents, for example unpacking a user tuple into separate id and name variables.
PHP supports this form of unpacking in regard to arrays using the 'list' function, which I frequently use to return multiple values from a function/method invocation.

## Implementation

With a basic understanding of what a tuple now is, I set about creating a thought-experiment in PHP, deciding on taking advantage of the [SPLFixedArray](http://www.php.net/manual/en/class.splfixedarray.php) class.
As a tuple is of a finite length, using the fixed array class will (in theory) provide performance enhancements, along with removing the need to implement the [ArrayAccess](http://www.php.net/manual/en/class.arrayaccess.php) interface.
Before I began designing the below example, I did some research on prior work in the field and noticed a great implementation found [here](http://forrst.com/posts/Tuples_for_PHP-O3A).
This implementation also provided the option for values to be strictly typed, specifying each positions valid type (by way of a prototype).
I was very impressed by this idea and decided to include it in my implementation, allowing for creation of more relaxed tuples using the 'mixed' data-type.

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

Looking at the example implementation above you will notice that I take full advantage of the SPLFixedArray class.
The only array access method I override is 'offsetSet', which first checks based on the provided prototype the validity of the value.
The two interesting inclusions in this class that I would like to highlight are the static 'create' and 'type' methods.

## Creating a Tuple

Using the 'create' method you are able to create a partially applied class instantiation (providing the prototype).
This allows you to use the implementation as shown below, creating a 'point' constructor (stored in a variable) which can be called with the desired values to form a concrete tuple instance.

```php
$point = Tuple::create('double', 'double');

$point(1.0, 2.5); // Tuple(1, 2.5)

$point(1.5, 3.0)[1]; // 3.0
```

## Creating a Typed Tuple

As explained above I was very impressed by the implementations use of data-types, as such, I explored how I could create new tuple data-types based on the prototype (that could be ideally type-hinted).
I was able to achieve this by way of the 'eval' function (our good friend), dynamically creating a new class based on the provided details.
To provide the user with a more friendly way to create the data-type (inspired by Python) I also create a function (going by the same name) that returns a new instance of the class when invoked.
Below is a similar example to the one displayed above, this time however, we are creating and using a new tuple data-type called Point.

```php
Tuple::type('Point', [ 'double', 'double' ]);

Point(1.0, 2.5); // Point(1, 2.5)
```

This new data-type can then be used to type-hint against parameters in a function/method, as shown below.
Note the use of the 'list' function to unpack the point into its constituent parts, before being returned in a new Point tuple.

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
