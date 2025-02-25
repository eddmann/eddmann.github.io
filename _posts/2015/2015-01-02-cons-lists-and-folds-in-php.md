---
layout: post
title: 'Cons Lists and Folds in PHP'
meta: 'Looking into implementing Cons cell Lists and Fold operations in PHP'
---

Cons cells are used to (cons)truct a data object which represents an ordered pair.
The elements in this pair can be identified as 'car' and 'cdr' accordingly.
Using this simple representation we are able to not only hold ordered pairs, but also create more complex data-structures, such as a List. <!--more-->
Below is an example interface that we will be using to implement the two different kinds of Cons cell required to create this List data-structure.

```php
interface ConsCell
{
    public function head();
    public function tail();

    public function foldr(Closure $fn, $acc);
    public function foldl(Closure $fn, $acc);

    public function map(Closure $fn);
    public function filter(Closure $fn);
}
```

As you can see we have also included a couple of other useful methods that will be used to traverse the list.
Providing a defined closure which will be invoked on each element returning either a predicate or new value.

## Nil

The first such type of cell that is used to represent this structure is the empty list.
Commonly called Nil, it is treated as a [sentinel](http://en.wikipedia.org/wiki/Sentinel_node) node, distinguishing the end of the list and used as a recursive base-case.

```php
class Nil implements ConsCell
{
    public function head() { throw new RuntimeException('No head present'); }
    public function tail() { throw new RuntimeException('No tail present'); }

    public function foldr(Closure $fn, $acc) { return $acc; }
    public function foldl(Closure $fn, $acc) { return $acc; }

    public function map(Closure $fn) { return $this; }
    public function filter(Closure $fn) { return $this; }
}
```

## Cons

The other type of cell that is required stores the first element in its left-hand value ('car') and the next Cons cell in its right ('cdr').
In this implementation we use alternative, more meaningful names for the 'car' and 'cdr' values.
Following the head and tail naming convention instead.

```php
class Cons implements ConsCell
{
    private $head, $tail;

    public function __construct($head, ConsCell $tail)
    {
        $this->head = $head;
        $this->tail = $tail;
    }

    public function head() { return $this->head; }
    public function tail() { return $this->tail; }

    public function foldr(Closure $fn, $acc)
    {
        return $fn($this->head(), $this->tail()->foldr($fn, $acc));
    }

    public function foldl(Closure $fn, $acc)
    {
        return $this->tail()->foldl($fn, $fn($this->head(), $acc));
    }

    public function map(Closure $fn)
    {
        return $this->foldr(function ($head, $acc) use ($fn) {
            return new Cons($fn($head), $acc);
        }, new Nil);
    }

    public function filter(Closure $fn)
    {
        return $this->foldr(function ($head, $acc) use ($fn) {
            return $fn($head) ? new Cons($head, $acc) : $acc;
        }, new Nil);
    }

    public static function from(array $xs)
    {
        return ($x = array_shift($xs)) ? new Cons($x, Cons::from($xs)) : new Nil;
    }
}
```

As you can see, the Cons implementation does the majority of the work in-regards to the methods we use to traverse the list.
After supplying how each of the different folds are to be implemented, we are able to use these to create the map and filter methods.
A fold is used to analyse a recursive data-structure and create a returning value from this completed process.
The 'foldr' method is used to do the more common action of iterating over each element in the list (in order) from left to right.
The 'foldl' method on the other hand can be considered the opposite, going right to left instead.
These methods can be typically achieved using 'array_reduce' in PHP, with 'array_reverse' invoked first in the case of 'foldl'.

## Other Use-cases

We are able to use the 'foldl' method to easily add a 'reverse' method to our List implementation, as shown below.

```php
class Nil implements ConsCell
{
    // ..

    public function reverse() { return $this; }
}

class Cons implements ConsCell
{
    // ..

    public function reverse()
    {
        return $this->foldl(function ($head, $acc) {
            return new Cons($head, $acc);
        }, new Nil);
    }
}
```

We can also implement a 'toArray' method which converts the List representation into an PHP array - which makes it easier to reason about the resulting output.

```php
class Nil implements ConsCell
{
    // ..

    public function toArray() { return []; }
}

class Cons implements ConsCell
{
    // ..

    public function toArray()
    {
        return array_merge([$this->head()], $this->tail()->toArray());
    }
}
```

## Examples

Lets first try out a combination of a couple of the List methods, invoked via chaining.

```php
$isEven = function ($x) { return $x % 2 === 0; };
$starify = function ($x) { return "*$x*"; };

Cons::from(range(1, 10))
    ->filter($isEven)
    ->map($starify)
    ->reverse()
    ->toArray(); // ['*10*','*8*','*6*','*4*','*2*']
```

In the example above we are creating a Cons list which represents the numbers from 1 to 10.
We then subsequently filter out any elements that are not even, apply some pretty printing to each of the resulting elements and then reverse this output.
Finally, we convert the Cons representation into an array to be easily output.

```php
$isFibonacci = function ($x) {
    $isWholeNumber = function ($y) { return abs($y - round($y)) < 0.0001; };

    return
        $isWholeNumber(sqrt(5 * pow($x, 2) + 4)) ||
        $isWholeNumber(sqrt(5 * pow($x, 2) - 4));
};
$count = function ($x, $acc) { return 1 + $acc; };

Cons::from(range(1, 100))
    ->filter($isFibonacci)
    ->foldr($count, 0); // 10
```

The example above tallies up the total number of Fibonacci numbers there are between 1 and 100.
Using the 'filter' method with a supplied predicate function and the 'foldr' reduce method, we are correctly returned the total of 10.
