---
layout: post
title: 'Merge sort in Scala using Tail-recursion and Streams'
meta: 'Discover two optimised implementations of merge sort in Scala using tail recursion and streams, complete with detailed code examples and explanations.'
tags: scala algorithm functional-programming
---

In a previous [post](/posts/merge-sort-comparison-in-java-and-scala/) I made a rudimentary comparison of Java and Scala using the [Merge sort](http://en.wikipedia.org/wiki/Merge_sort) algorithm as a case study.
There I described a trivial Scala implementation which did not take into consideration tail recursion, resulting in an unavoidable stack overflow when faced with a sufficiently sized list.
In this post I wish to describe two very different implementations that resolve this glaring omission.

<!--more-->

## Tail-recursion

A method call can be categorised as tail-recursive if there is no action to undertake after the method returns, aside from returning its own value.
In such an example, a compiler rewrite (in effect mimicking [Goto](http://en.wikipedia.org/wiki/Goto)) can replace the caller in-place for the callee without any side effects.
As a result, no new stack frame is required (re-using the existing one) per recursive call, providing similar efficiency to a common iteration loop.

The 'merge' method, which is the point of stack overflow consideration in our example, has been refactored below to instead use an accumulator parameter, now completing all required work before the next call.
The compiler is then able to parse these recursive method calls and run the described optimisation.
In this case, the Scala compiler does not require that an annotation be present as it can deduce this requirement; however, for clarity I have included it.

```scala
implicit def IntIntLessThan(x: Int, y: Int) = x < y

def mergeSort[T](xs: List[T])(implicit pred: (T, T) => Boolean): List[T] = {
    val m = xs.length / 2
    if (m == 0) xs
    else {
        @scala.annotation.tailrec
        def merge(ls: List[T], rs: List[T], acc: List[T] = List()): List[T] = (ls, rs) match {
            case (Nil, _) => acc ++ rs
            case (_, Nil) => acc ++ ls
            case (l :: ls1, r :: rs1) =>
                if (pred(l, r)) merge(ls1, rs, acc :+ l)
                else merge(ls, rs1, acc :+ r)
        }
        val (l, r) = xs splitAt m
        merge(mergeSort(l), mergeSort(r))
    }
}

println(mergeSort(List(4, 2, 1, 3)))
```

A small, example-driven inclusion that I have also made is in the use of an implicit method to provide the less-than predicate.
Implicits are an extremely powerful feature that deserves its own post.
Simply put, the compiler is able to implicitly deduce that I wish to use this comparator method based on its type signature `(Int, Int) => Boolean`.

## Streams

Another example which eliminates the chance of a stack overflow when calling the 'merge' method is with the use of [Streams](http://www.scala-lang.org/api/current/index.html#scala.collection.immutable.Stream).
From the provided 'numbers' method you can gain a simple understanding that a Stream is basically a lazily evaluated sequence that only does the work (the generator method) when it is required.
This property does not particularly help us in this case, as we are required to know the finite length of the list for the divide step.
What we can take advantage of is the implicit conversion that occurs with the call #:: to a [ConsWrapper](http://www.scala-lang.org/api/current/index.html#scala.collection.immutable.Stream$$ConsWrapper).
Calling this operator creates a new 'Cons' object via the application `cons.apply[A](hd: A, tl -> Stream[A]): Cons[A]`, and due to the second argument being called-by-name, it does not get evaluated at this time on the stack.
As all objects on the JVM are created on the much larger heap, we in essence are indirectly transferring this work.

```scala
def mergeSort[T](pred: (T, T) => Boolean)(xs: Stream[T]): Stream[T] = {
    val m = xs.length / 2
    if (m == 0) xs
    else {
        def merge(ls: Stream[T], rs: Stream[T]): Stream[T] = (ls, rs) match {
            case (Stream.Empty, _) => rs
            case (_, Stream.Empty) => ls
            case (l #:: ls1, r #:: rs1) =>
                if (pred(l, r)) l #:: merge(ls1, rs)
                else r #:: merge(ls, rs1)
        }
        val (l, r) = xs splitAt m
        merge(mergeSort(pred)(l), mergeSort(pred)(r))
    }
}

def numbers(remain: Int): Stream[Int] =
    if (remain == 0) Stream.Empty
    else Stream.cons(util.Random.nextInt(100), numbers(remain - 1))

println(mergeSort((x: Int, y: Int) => x < y)(numbers(4)).toList)
```

I should note, however, that although the above example is very crafty in its attempt to eliminate a stack overflow, it does, of course, move this issue over to the heap.
As a result, it is recommended to use the first example (tail-recursive optimisations) and enjoy the ninja-esque skills of the second one.
