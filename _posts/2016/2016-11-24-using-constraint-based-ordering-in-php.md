---
title: 'Using Constraint-based Ordering in PHP'
link: https://tech.mybuilder.com/using-constraint-based-ordering-in-php/
meta: 'Looking into using Constraint-based Ordering in PHP'
---

An interesting problem arose last week when we wished to generate a listing of recently completed jobs (along with their shortlist fees).
Upon review of some earlier attempts, we did not like the aesthetics present when many of a particular shortlist fee were clustered together (i.e. two or more adjacent jobs with the same shortlist fee).
What we were instead looking for was to create a constraint-based ordering that when applied to the recently completed jobs, would give an even distribution of shortlist fees (data-set permitting).

<!--more-->

### Initial Solution

The first approach I took to achieving this end-goal was to apply a low-high ordering pattern.
So as to make the process easier, I decided that initially sorting the jobs based on shortlist fee would alleviate us from any intensive comparison checks later on.
I was then able to use a single pass through the list to create a result that guaranteed 'as good of' a low-high constraint applied as possible.

```php?start_inline=1
function orderFeesByLowHigh(array $fees)
{
    sort($fees);

    $listing = [];

    for ($l = 0, $h = count($fees) - 1; $l < count($fees) / 2; $l++, $h--) {
        $listing[] = $fees[$l];
        if ($l != $h) $listing[] = $fees[$h];
    }

    return $listing;
}
```

### Taking Another Approach

Upon reflection however, I did not feel that the resulting list looked 'random' enough, and over the weekend thought maybe incorporating a middle value would hinder a better outcome.
I decided to try and implement such an approach in a more functional manner, thinking about the declarative steps that were required to create the result.
I was able to break down the process into three seperate actions, as shown in the example below:

<img src="/uploads/posts/using-constraint-based-ordering-in-php/idea.png" style="width:auto;" />

Unfortuantly PHP does not include the ability to `partition` or `interleave` arrays, so I created a couple of simple implementations to aid my solution.

```php?start_inline=1
function partition(array $arr, $total)
{
    if ($total < 2) return [$arr];

    $size = ceil(count($arr) / $total);

    return array_merge(
        [array_slice($arr, 0, $size)],
        partition(array_slice($arr, $size), $total - 1));
}

function interleave(/* array */ ...$arrs)
{
    if (empty($arrs)) return [];

    return array_merge(
        array_map('head', $arrs),
        interleave(...array_filter(array_map('tail', $arrs))));
}

function head(array $arr) { return reset($arr); }
function tail(array $arr) { return array_slice($arr, 1); }
```

With these helper functions now in our toolkit, I was able to easily express the problem we were trying to solve in the following implementation.

```php?start_inline=1
function orderFeesByLowMidHigh(array $fees)
{
    sort($fees);

    return interleave(...partition($fees, 3));
}
```

Following the sort present in the previous implementation, we then wish to partition the fees into three seperate chunks.
With these chunks we then interleave the encompassing fees into the resulting listing.
I feel the output generated from this function yielded a more aesthetically pleasing result and did not look as much of a pattern as the previous low-high solution.
This could be due to the combination of not only a middle fee, but also where the fee is taken from.
In the imperative low-high solution we always take the next lowest and highest fees, which can be very disjoint from one another and noticeable to someone browsing the list.
