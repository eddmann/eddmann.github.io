---
layout: post
title: 'Implementing a Stack in Java using Arrays and Linked Lists'
meta: 'Discover two alternative methods for implementing the commonplace stack data structure in Java using arrays and linked lists to achieve efficient data manipulation.'
tags: java data-structures
---

The stack is a fundamental data structure used extensively in algorithm design and program implementation.
At an abstract level, it can be described very simply, as it only allows for the addition (pushing) of new elements and the removal (popping) of existing elements from the top of the stack.
This description can be abbreviated to LIFO, which stands for Last-In-First-Out.
Although you will most likely not have to implement such a structure for practical use cases, it can be very useful to 'look under the hood' to gain a better understanding of what is going on.
Doing so will make you more aware of when this data structure can be best used.

<!--more-->

The following examples solve the same problem, and as such I have created a simple interface that each implementation must fulfil.
Contractual agreements like this are great when you do not want the implementation details to affect the API that is available, allowing the user to use them interchangeably.

```java
interface Stack<T> {
    Stack<T> push(T ele);
    T pop();
}
```

## Array-based implementation

The first implementation I would like to discuss stores the stack contents in an underlying fixed-size array.
Using such a method provides constant time 'O(1)' lookup of all items in the collection; however, in the stack's case this benefit is not warranted.
An initial array (of size 2) is first initialised, and when new elements are added, the running total is incremented.
Additions to the array occur in constant amortised time 'O(1)', as they are inserted at the end.
If the array reaches its limit, we then have to perform the linear time 'O(n)' task of creating a new array of double the size and copying the contents over.
Using the `System.arraycopy` method call is a more [performant](http://stackoverflow.com/questions/8526907/is-javas-system-arraycopy-efficient-for-small-arrays) alternative to building the new array ourselves.
When an element is removed (popped) from the stack, a check is performed to see if the array is now a quarter full.
If so, the array is resized again, but this time it is halved.
As resizing the array is a very costly operation, we want to do it as infrequently as possible.
Using the double and quarter rules provides a good balance in typical use cases.

One point to note from this example is the often-overlooked initial capacity parameter with which you can initialise an [ArrayList](http://docs.oracle.com/javase/7/docs/api/java/util/ArrayList.html).
Implemented conceptually in the same manner, doing so can greatly increase performance if you have an estimate (heuristics) of how large the list is going to grow.

```java
public class StackArray<T> implements Stack<T> {

    private T[] arr;

    private int total;

    public StackArray()
    {
        arr = (T[]) new Object[2];
    }

    private void resize(int capacity)
    {
        T[] tmp = (T[]) new Object[capacity];
        System.arraycopy(arr, 0, tmp, 0, total);
        arr = tmp;
    }

    public StackArray<T> push(T ele)
    {
        if (arr.length == total) resize(arr.length * 2);
        arr[total++] = ele;
        return this;
    }

    public T pop()
    {
        if (total == 0) throw new java.util.NoSuchElementException();
        T ele = arr[--total];
        arr[total] = null;
        if (total > 0 && total == arr.length / 4) resize(arr.length / 2);
        return ele;
    }

    @Override
    public String toString()
    {
        return java.util.Arrays.toString(arr);
    }

}
```

## Linked-List implementation

The second example is more in line with what you might expect from a language implementation.
Using a linked list is tailor-made to store the contents of a stack, handling the required actions with excellent performance.
Unlike the array implementation, using a linked list provides constant time 'O(1)' guarantees when adding an element, as no underlying array requires resizing.
Furthermore, it also provides constant time 'O(1)' guarantees when removing (popping) an element, as only a reference requires modification.
This implementation differs in that it creates a new node instance for each addition, each storing its supplied value and a reference to the following node.
These links allow us to maintain the stack and eventually traverse the entire collection once it is emptied.
There are no upfront memory costs when using a linked list, as you only consume the space required for each node when a new value is pushed to the stack.
However, the overhead of each node being an object instance should be taken into consideration.
Another limitation of a linked list is its linear 'O(n)' traversal time.
Nevertheless, this is not an issue in this case as we are only concerned with the first (most recent) element.

```java
public class StackLinkedList<T> implements Stack<T> {

    private int total;

    private Node first;

    private class Node {
        private T ele;
        private Node next;
    }

    public StackLinkedList() { }

    public StackLinkedList<T> push(T ele)
    {
        Node current = first;
        first = new Node();
        first.ele = ele;
        first.next = current;
        total++;
        return this;
    }

    public T pop()
    {
        if (first == null) throw new java.util.NoSuchElementException();
        T ele = first.ele;
        first = first.next;
        total--;
        return ele;
    }

    @Override
    public String toString()
    {
        StringBuilder sb = new StringBuilder();
        Node tmp = first;
        while (tmp != null) {
            sb.append(tmp.ele).append(", ");
            tmp = tmp.next;
        }
        return sb.toString();
    }

}
```

## Example Usage

Below is an example demonstrating the array implementation in action.
As you can see, I have declared the variable instance as the Stack interface type, which allows me to easily switch out the implementation if future requirements warrant it.

```java
Stack<String> greeting = new StackArray<>();

greeting.push("!").push("World").push("Hello, ");

System.out.println(greeting.pop() + greeting.pop() + greeting.pop()); // Hello, World!
```
