---
layout: post
title: 'Designing Immutable Concepts with Transient Mutation in PHP'
meta: 'Explore how transient mutation can optimise immutable concepts in PHP, improving performance while maintaining immutability.'
tags: ['php']
---

In a recent project, we found it beneficial to introduce the Money pattern.
There are many good [resources](http://martinfowler.com/eaaCatalog/money.html) on this pattern, so I will defer to those for further definition.
We decided that encapsulating this into an [immutable value object](http://hangar.runway7.net/punditry/immutability-value-objects) allowed for a cleaner API and removed the fear of unexpected mutation bugs.
However, we noticed a spike in memory and processor usage when performing many successive actions on such values, such as summation.

<!--more-->

In such cases, new 'temporary' `Money` objects would be instantiated upon each applied addition.
Since many of these objects were merely stepping stones to generating the final result, they were simply left for the garbage collector to clean up.

## Using Transient Mutation

Instead of reverting entirely to mutation, we recalled a pattern found in Clojure called [Transients](http://clojure.org/reference/transients).

> If a tree falls in the woods, does it make a sound?
> If a pure function mutates some local data in order to produce an immutable return value, is that ok?

This is an interesting proposition.
As long as the resulting value is immutable, does it matter to the caller how it is derived?
Provided we could explicitly control when mutation was permitted, we could safely reap the benefits of mutable constructs.
We ultimately settled on adding a single method, `withMutation`, to the API.
The caller would provide a `callable`, which would, in turn, be passed a mutable copy of the `Money` instance.
This allowed the user to interact with the API in a mutable manner, but only within the scope of the callable.
The final returned value would then be made immutable again.
To the caller, the operation would appear to have been performed immutably.

## The Implementation

Below is a trait-based generalisation of the concept we introduced into our Money pattern implementation.

```php
trait WithMutable
{
    private $mutable = false;

    protected function isMutable()
    {
        return $this->mutable;
    }

    public function withMutable(callable $fn)
    {
        $x = clone $this;

        $x->mutable = true;
        $x = call_user_func($fn, $x);
        $x->mutable = false;

        return $x;
    }
}
```

As you can see, we provide an `isMutable` flag to switch between immutable and mutable modes.
We can then use `withMutable` in any process that benefits from explicit mutable constructs.
Below, you can see how we improved the performance characteristics of the `sum` example discussed earlier.

```php
class Money
{
    use WithMutable;

    private $pence;

    public function __construct($pence)
    {
        $this->pence = $pence;
    }

    public function add(Money $that)
    {
        return $this->update($this->pence + $that->pence);
    }

    private function update($pence)
    {
        if ($this->isMutable()) {
            $this->pence = $pence;
            return $this;
        }

        return new static($pence);
    }

    public static function sum(/* Money[] */ ...$monies)
    {
        return array_pop($monies)->withMutable(function ($sum) use ($monies) {
            foreach ($monies as $money) {
                $sum->add($money);
            }

            return $sum;
        });
    }
}
```

Providing such capabilities gives the user the freedom to use mutation when appropriate in a controlled setting.
This helps reduce wasted memory and processor usage while keeping all mutation decisions encapsulated within the abstraction.
