---
layout: post
title: 'Parallel Summation in Java'
meta: 'Learn how to implement parallel summation in Java using threads for enhanced performance and speed optimisation.'
tags: java algorithm
---

Summation is the common operation of adding a sequence of numbers together, resulting in their total.
The trivial implementation is to iterate over the full collection of numbers, keeping a running total as you progress.
For small sequences, a single-threaded implementation will suffice.
However, when the size increases, the use of other available CPU cores helps to provide the necessary speed optimisations.
As addition is an associative operation, it makes no difference to the end result in which order we process the collection.
This behaviour works well for our implementation design. <!--more-->
Below is an example implementation which splits the summation of a sequence of numbers into (close to) equal collections.
Each collection is processed in parallel within its own thread.

```java
public class Summation extends Thread {

    private int[] arr;

    private int low, high, partial;

    public Summation(int[] arr, int low, int high)
    {
        this.arr = arr;
        this.low = low;
        this.high = Math.min(high, arr.length);
    }

    public int getPartialSum()
    {
        return partial;
    }

    public void run()
    {
        partial = sum(arr, low, high);
    }

    public static int sum(int[] arr)
    {
        return sum(arr, 0, arr.length);
    }

    public static int sum(int[] arr, int low, int high)
    {
        int total = 0;

        for (int i = low; i < high; i++) {
            total += arr[i];
        }

        return total;
    }

    public static int parallelSum(int[] arr)
    {
        return parallelSum(arr, Runtime.getRuntime().availableProcessors());
    }

    public static int parallelSum(int[] arr, int threads)
    {
        int size = (int) Math.ceil(arr.length * 1.0 / threads);

        Summation[] sums = new Summation[threads];

        for (int i = 0; i < threads; i++) {
            sums[i] = new Summation(arr, i * size, (i + 1) * size);
            sums[i].start();
        }

        try {
            for (Summation sum : sums) {
                sum.join();
            }
        } catch (InterruptedException e) { }

        int total = 0;

        for (Summation sum : sums) {
            total += sum.getPartialSum();
        }

        return total;
    }

}
```

Looking at the implementation above, you will notice that I have taken advantage of static functionality to combine both the sum and thread instances required to complete the task.
Calling 'parallelSum' with a single argument (being the specified array), the system is queried on how many available processing cores are present.
We then create 'Summation' instances that are supplied with the low and high range of indexes within the subject array they are required to process.
These are then started and subsequently joined into the main thread for the final round of partial sum addition to complete the process.

So as to see the benefits of parallelising such an operation, an example benchmark has been provided below.
The implementation is provided in this case with 100,000,000 random integers between 1 and 100, and timed on its performance to run as both a single and parallel operation.

```java
import java.util.Random;

public static void main(String[] args)
{
    Random rand = new Random();

    int[] arr = new int[100000000];

    for (int i = 0; i < arr.length; i++) {
        arr[i] = rand.nextInt(101) + 1; // 1..100
    }

    long start = System.currentTimeMillis();

    Summation.sum(arr);

    System.out.println("Single: " + (System.currentTimeMillis() - start)); // Single: 44

    start = System.currentTimeMillis();

    Summation.parallelSum(arr);

    System.out.println("Parallel: " + (System.currentTimeMillis() - start)); // Parallel: 25
}
```

Looking at the results above, you will see that using the parallelised approach provides us with noticeable speed gains.
An interesting observation I made when running the benchmark was that increasing the number of threads to two did not significantly improve the speed.
