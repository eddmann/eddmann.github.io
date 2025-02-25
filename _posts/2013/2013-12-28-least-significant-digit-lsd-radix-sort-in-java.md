---
layout: post
title: 'Least Significant Digit (LSD) Radix Sort in Java'
meta: 'Discover how to implement a queue-based Least Significant Digit (LSD) Radix Sort in Java with detailed code examples and explanations.'
tags: java algorithm
---

Radix sort is an O(digits·keys) sorting algorithm that relies on grouping integer keys to efficiently process and naturally order the specified dataset.
Based on structure and positional notation, many other data types that can be represented in integer form (e.g. ASCII characters) can benefit from the algorithm.
Sorting occurs by comparing digits in the same position of the items.
Two alternative versions of the algorithm exist, each tackling the problem from the opposite direction.
In this post, I will describe an iterative least significant digit implementation which, as the name suggests, begins processing from the right-most digit position.
This implementation results in a [stable](http://en.wikipedia.org/wiki/Stable_sort#Stability) sort, whereas the other implementation, which tackles the most significant digit first, cannot guarantee stability.
In a stable sorting algorithm, the initial ordering of equal keys remains unchanged in the result.

<!--more-->

```java
public static void radixSort(int[] arr)
{
    Queue<Integer>[] buckets = new Queue[10];
    for (int i = 0; i < 10; i++)
        buckets[i] = new LinkedList<Integer>();

    boolean sorted = false;
    int expo = 1;

    while (!sorted) {
        sorted = true;

        for (int item : arr) {
            int bucket = (item / expo) % 10;
            if (bucket > 0) sorted = false;
            buckets[bucket].add(item);
        }

        expo *= 10;
        int index = 0;

        for (Queue<Integer> bucket : buckets)
            while (!bucket.isEmpty())
                arr[index++] = bucket.remove();
    }

    assert isSorted(arr);
}
```

The above code shows an example of a queue-based least significant digit radix sort implementation.
Starting from the right-most digit, the process occurs over multiple passes, distributing each item into calculated buckets based on its positional key.
After each pass through the collection, the items are retrieved in order from each bucket.
This process is repeated up to and including the pass corresponding to the length of the longest key.

```java
private static boolean isSorted(int[] arr)
{
    for (int i = 1; i < arr.length; i++)
        if (arr[i - 1] > arr[i])
            return false;

    return true;
}
```

To ensure that the resulting dataset is correctly sorted, an assertion is included.
This feature is particularly useful in development, as it allows you to verify the correctness of a specific invariant.
This assertion can be activated at runtime by including the '-ea' option in the 'java' command.

## Resources

- [Radix Sort](http://www.dcs.gla.ac.uk/~pat/52233/slides/RadixSort1x1.pdf)
- [NIST: Radix Sort](http://xlinux.nist.gov/dads/HTML/radixsort.html)
- [What is natural ordering when we talk about sorting?](http://stackoverflow.com/questions/5167928/what-is-natural-ordering-when-we-talk-about-sorting)
