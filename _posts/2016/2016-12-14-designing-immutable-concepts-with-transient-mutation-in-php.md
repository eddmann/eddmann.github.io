---
title: 'Designing Immutable Concepts with Transient Mutation in PHP'
link: https://tech.mybuilder.com/designing-immutable-concepts-with-transient-mutation-in-php/
meta: 'Looking into designing Immutable concepts with Transient Mutation in PHP'
---

In a recent project we felt it beneficial to introduce the Money pattern.
There are many good [resources](http://martinfowler.com/eaaCatalog/money.html) on this pattern, so I will delegate to those for further definition.
We decided that encapsulating this into a [immutable value object](http://hangar.runway7.net/punditry/immutability-value-objects) allowed for a cleaner API and removed the fear of any unexpected mutation bugs.
However, we noticed a spike in memory and processor usage when wishing to perform many successive actions on such values i.e. summation.

<!--more-->

In such a case, new 'temporary' `Money` objects would be instantiated upon each applied addition.
As many of these objects were simply a stepping stone to generating the final result, they were just left for the Garbage collector to clean-up.

### Using Transient Mutation

Instead of running all the way back to mutation, we remembered a pattern found in Clojure called [Transients](http://clojure.org/reference/transients).

> If a tree falls in the woods, does it make a sound?
> If a pure function mutates some local data in order to produce an immutable return value, is that ok?

This is an interesting proposition; as long as the resulting value is immutable, is it of concern to the caller how it is derived?
Providing we could explicitly control when mutation was permitted, we could safely reap the benefits that mutable constructs give us.
We ended up settling on adding a single method `withMutation` to the API.
The caller would provide a `callable` that would in-turn be passed a mutable copy of the `Money` instance.
This allowed the user to interact with the API in a mutable manner, but the caveat being only within the scope of the callable.
The value that was finally returned would subsequently be made immutable again.
In respect to the caller, the action that had occurred would seem immutable in-nature.

### The Implementation

Below is a trait-based generalisation of the concept we introduced into our Money pattern implementation.

```php?start_inline=1
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

As you can see, we provide a `isMutable` flag to decide between (im)mutable modes.
We are then able to use `withMutable` in any process that would benefit from explicit mutable constructs.
Below you can see how we improved upon the performance characteristics of the `sum` example initially discussed.

```php?start_inline=1
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

Providing such capabilities gives the user the freedom to use mutation when applicable in a controlled setting.
This helps reduce wasted memory and processor usage, whilst keeping all mutation decisions within the abstraction.
