---
layout: post
title: 'Implementing Heapsort in Java and C'
meta: 'Discover how to implement the efficient heapsort algorithm in Java and C with detailed code examples and explanations on building a tree-based heap data structure for sorting.'
tags: ['java', 'c', 'algorithms']
---

In this post, we will delve into the mechanics of heapsort by building a tree-based heap data structure and then methodically extracting a sorted array.
We will then implement said algorithm in both Java and C to get a feel for how the process is modelled in code.

<!--more-->

## How it works

Heapsort is a sorting algorithm which can be split into two distinct steps.

The first step is to build a tree-based heap data structure from the supplied input.
Conforming to the [heap property](http://en.wikipedia.org/wiki/Binary_heap) requires the structure to ensure that all parent nodes are greater than or equal to their children (with the highest at the root), or the inverse.
Being called a max-heap and a min-heap respectively, this step in itself has many interesting use cases outside of simply sorting an input.
Implementing the heap as an array allows us to reuse the input array for both the heap and the resulting output.
All binary trees can be represented in array form, but as a heap is always weighted towards completeness, it can be stored very efficiently.

The second step simply builds up the sorted array, with the next element removed from the heap structure (reconstructing the heap after each iteration) until no elements remain.
The implementation works in both minimum and maximum forms, with only the direction in the second step requiring alteration.
Being a comparison-based algorithm, it caters for a user-supplied comparison operation, determining which of the two subject elements should occur first in the output.
However, despite the option for in-place sorting, it is not stable, resulting in the possibility of initially ordered equal keys being reordered.

## Java Implementation

Below is an implementation of the Heapsort algorithm written in Java.
I was able to add the flexibility provided by generalising the sorting algorithm to any class that implemented the [Comparable](http://docs.oracle.com/javase/7/docs/api/java/lang/Comparable.html) interface.

```java
public class Heap {

    private static int total;

    private static void swap(Comparable[] arr, int a, int b)
    {
        Comparable tmp = arr[a];
        arr[a] = arr[b];
        arr[b] = tmp;
    }

    private static void heapify(Comparable[] arr, int i)
    {
        int lft = i * 2;
        int rgt = lft + 1;
        int grt = i;

        if (lft <= total && arr[lft].compareTo(arr[grt]) > 0) grt = lft;
        if (rgt <= total && arr[rgt].compareTo(arr[grt]) > 0) grt = rgt;
        if (grt != i) {
            swap(arr, i, grt);
            heapify(arr, grt);
        }
    }

    public static void sort(Comparable[] arr)
    {
        total = arr.length - 1;

        for (int i = total / 2; i >= 0; i--)
            heapify(arr, i);

        for (int i = total; i > 0; i--) {
            swap(arr, 0, i);
            total--;
            heapify(arr, 0);
        }
    }

    public static void main(final String[] args)
    {
        Integer[] arr = new Integer[] { 3, 2, 1, 5, 4 };

        System.out.println(java.util.Arrays.toString(arr));
        sort(arr);
        System.out.println(java.util.Arrays.toString(arr));
    }

}
```

Looking at the implementation above you will notice that the first step the sorting method takes is to create a heap structure from the input.
Calling the `heapify` method on the first half of the input array guarantees (by recursion) that the heap data structure is built and the heap property is fulfilled.
Once this step has been completed, we loop through each item in the heap, swapping the first and last heap elements, reducing and reconstructing the structure after each iteration.

## C Implementation

Below is a C implementation, similar to the above Java example.
Using macros, I was able to abstract away some of the repetitive code used to count and swap items in the subject array.
In this case, I decided against adding confusion to the resulting implementation with the introduction of void pointer generalisation, and instead focused only on integer input.

```c
#include <stdio.h>

#define COUNT(arr) (sizeof(arr) / sizeof(arr[0]))

#define SWAP(arr, a, b) \
  do { \
    int tmp = arr[a]; \
    arr[a] = arr[b]; \
    arr[b] = tmp; \
  } while (0)

#define PRINT(arr, size) \
  do { \
    for (int i = 0; i < size; i++) printf("%d ", arr[i]); \
    printf("\n"); \
  } while (0)

int total;

void heapify(int arr[], int i)
{
    int lft = i * 2;
    int rgt = lft + 1;
    int grt = i;

    if (lft <= total && arr[lft] > arr[grt]) grt = lft;
    if (rgt <= total && arr[rgt] > arr[grt]) grt = rgt;
    if (grt != i) {
        SWAP(arr, i, grt);
        heapify(arr, grt);
    }
}

void sort(int arr[], int size)
{
    total = size - 1;

    for (int i = total / 2; i >= 0; i--)
        heapify(arr, i);

    for (int i = total; i > 0; i--) {
        SWAP(arr, 0, i);
        total--;
        heapify(arr, 0);
    }
}

int main(int argc, char *argv[])
{
    int arr[] = { 3, 2, 1, 5, 4 };
    int size = COUNT(arr);

    PRINT(arr, size);
    sort(arr, size);
    PRINT(arr, size);
}
```

As discussed above, this implementation is very similar to its Java counterpart.
One small _hack_ that I found very useful in C's macro system was the use of a 'do/while' loop to create multi-line definitions with the least compiler issues.

## Resources

- [Heap Sort: Kent State University](http://www.personal.kent.edu/~rmuhamma/Algorithms/MyAlgorithms/Sorting/heapSort.htm)
- [Heap Sort: Playing Cards Video](http://www.youtube.com/watch?v=WYII2Oau_VY)
