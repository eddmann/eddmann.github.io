---
layout: post
title: 'Implementing Streams in PHP'
meta: 'Multiple ways of implementing the Stream data-structure using PHP'
---

Typically, when we think about a list of elements we assume there is both a start and finite end.
In this example the list has been precomputed and stored for subsequent traversal and transformation.
If instead, we replaced the finite ending with a promise to return the next element in the sequence, we would have the architecture to provide infinite lists. <!--more-->
Not only would these lists be capable of generating infinite elements, but they would also be lazy, only producing the next element in the sequence when absolutely required.
This concept is called a [Stream](<http://en.wikipedia.org/wiki/Stream_(computing)>), commonly also referred to as a lazy list, and is a foundational concept in languages such as Haskell.
Streams are not interacted with in the same manner as finite lists, as they cannot be operated on as a whole.
Instead they should be thought of as 'codata' (infinite) or an Object-oriented [Iterable](http://en.wikipedia.org/wiki/Iterator), as a opposed to just simply 'data' (finite).
As well as being able to create a Stream based on a supplied promise, we are also able to compose new Streams using 'map' and 'filter' methods.
In this article I will discuss two examples of implementing the Stream data-structure, using both class-based and generator approaches in PHP.

## Class-based Approach

The first implementation I will be discussing uses a 'Classical' approach, relying on a tail-promise function to return the next element in the Stream.

```php
class Stream implements Iterator
{
    const NIL_SENTINEL = null;

    private $head, $tail;
    private $current, $key;

    public function __construct($head, $tail = null)
    {
        $this->head = $head;
        $this->tail = $tail ?: function () { return self::nil(); };
    }

    public function map(callable $f)
    {
        if ($this->isNil()) return $this;

        return new self(call_user_func($f, $this->head), function () use ($f) {
            return $this->tail()->map($f);
        });
    }

    public function filter(callable $f)
    {
        if ($this->isNil()) return $this;

        if (call_user_func($f, $this->head)) {
            return new self($this->head, function () use ($f) {
                return $this->tail()->filter($f);
            });
        }

        return $this->tail()->filter($f);
    }

    public function take($n)
    {
        if ($this->isNil() || $n == 0) return self::nil();

        return new self($this->head, function () use ($n) {
            return $this->tail()->take($n - 1);
        });
    }

    public static function range($start = 1, $end = INF)
    {
        if ($start == $end) return new self($start);

        return new self($start, function () use ($start, $end) {
            return self::range($start + 1, $end);
        });
    }

    public function current()
    {
        return $this->current->head;
    }

    public function next()
    {
        $this->current = $this->current->tail();
        $this->key++;
    }

    public function key()
    {
        return $this->key;
    }

    public function valid()
    {
        return ! $this->current->isNil();
    }

    public function rewind()
    {
        $this->current = $this;
        $this->key = 0;
    }

    private function isNil()
    {
        return $this->head === self::NIL_SENTINEL;
    }

    private function tail()
    {
        return call_user_func($this->tail, $this->head);
    }

    private static function nil()
    {
        return new self(self::NIL_SENTINEL);
    }
}
```

Looking at the above implementation you can see how much boilerplate code is required to make the Stream iterable.
Through use of the tail promise we are able to defer execution of calculating the next element in the Stream until absolutely required.
The inclusion of a 'nil' sentinel simplifies the design, as we are not required to use polymorphism and separate Nil and Cons implementations.
So as to not detract from the following examples intent, we will be using the following function to display the returned iterators.

```php
function sprint($xs)
{
    echo '[' . implode(', ', iterator_to_array($xs)) . "]\n";
}
```

Using this helper function we are now able to experiment with this initial implementation.

```php
$isEven = function ($x) { return $x % 2 == 0; };

sprint(Stream::range()->filter($isEven)->take(5)); // [2, 4, 6, 8, 10]

$fibonacci = call_user_func(function () {
    $y = 1;

    return $f = function ($x) use (&$f, &$y) {
        $z = $y;
        $y += $x;

        return new Stream($z, function ($x) use (&$f) { return $f($x); });
    };
});

sprint((new Stream(0, $fibonacci))->take(5)); // [0, 1, 1, 2, 3]
```

To implement the Fibonacci sequence stream using this approach we are required to use a self-invoked function to wrap the previous value state required.
Along with this we also need to provide a reference to the returned function itself, so as to invoke it again as the tail promise.
These details, coupled with the requirement to return a new Stream instance in the tail-promise, seems to unnecessary cloud the solutions intent.

## Generator Approach

Fortunately, as of PHP 5.5 we are able to take advantage of Generators and create a more succinct implementation which easily describes its purpose.
Generators allow us to implement the Stream without the need to handle the deferred tail execution and implement the class-based Iterator interface.

```php
function stream($x, callable $f)
{
    while (true) {
        yield $x;
        $x = call_user_func($f, $x);
    }
}

function map(callable $f, Generator $g)
{
    while ($g->valid()) {
        yield call_user_func($f, $g->current());
        $g->next();
    }
}

function filter(callable $f, Generator $g)
{
    while ($g->valid()) {
        if (call_user_func($f, $g->current())) yield $g->current();
        $g->next();
    }
}

function take($n, Generator $g)
{
    while ($n--) {
        yield $g->current();
        $g->next();
    }
}

function srange($start = 1, $end = INF)
{
    return take($end - $start + 1, stream($start, function ($x) { return $x + 1; }));
}
```

As you can see we have been able to instead flatten the class-based approach into top-level functions.
Each function is aided by type-hints, describing what it is tasked to do far more clearly.
Using the generators 'valid' method we are able to implement all but the 'take' method using imperative while loops.
This implementation is able to compute the previous examples, as shown below.

```php
$isEven = function ($x) { return $x % 2 == 0; };

sprint(take(10, filter($isEven, srange()))); // [2, 4, 6, 8, 10]

$fibonacci = call_user_func(function () {
    $y = 1;

    return function ($x) use (&$y) {
        $z = $y;
        $y += $x;
        return $z;
    };
});

sprint(take(10, stream(0, $fibonacci))); // [0, 1, 1, 2, 3]
```

As you can see by looking at the above examples, the Fibonacci sequence code has been simplified greatly.
We have been able to remove the need to return a new Stream instance each time, and instead able to focus solely on the generation of the next value.
Although both implementations solve the problem at hand, by now you will certainly see the stronger case put forth by the generator approach.
Not only is it less code, it also provides us with a clearer way to expressively compose the functions together.
