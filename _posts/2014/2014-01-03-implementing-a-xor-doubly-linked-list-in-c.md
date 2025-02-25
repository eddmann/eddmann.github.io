---
layout: post
title: 'Implementing a XOR Doubly Linked-List in C'
meta: 'Learn how to implement a memory efficient XOR doubly linked-list in C for effective low-level memory management.'
tags: c data-structures
---

This post examines the implementation of a XOR doubly linked-list in C.
It provides a detailed explanation of how pointer arithmetic combined with the XOR operation can reduce memory usage in a linked list.
The discussion covers both the benefits and the challenges of managing memory at a low level in C.

<!--more-->

## What about Java?

After experimenting with the [XOR swap method in Java](/posts/experimenting-with-the-xor-swap-method-in-java/) I had hoped to follow it up with an exploration of the XOR doubly linked-list.
Java objects, however, are not directly accessible through pointer reference.
This is by no means a limitation, as it allows the garbage collector to efficiently and safely handle memory allocation.
Sometimes it is desired to have such access, and you can take advantage of [JNI](http://en.wikipedia.org/wiki/Java_Native_Interface) to call assembly, or C/C++ code from within Java.
Another option is to use the [sun.misc.Unsafe](http://mishadoff.github.io/blog/java-magic-part-4-sun-dot-misc-dot-unsafe/) class, which provides many _unsafe_ operations, one of which is to retrieve object memory address locations.

## Time for some C

Despite these alternatives, I felt compelled to continue my exploration of C.
I implemented this data structure using a language with robust (albeit scary) low-level memory-management support.
From previous posts you are aware that a doubly linked list stores items with pointers in both directions.
This allows for traversal both forwards and backwards, albeit at the expense of having to store two pointers per element.
Through the magic of the bitwise XOR operation, however, we are able to store each node's previous and next pointers in the memory allocated to just one.

```c
#include <stdio.h>
#include <stdlib.h>
#include <stdint.h>
#include <stdbool.h>

typedef struct node {
    int item;
    struct node *np;
} node;

node *head, *tail;

node *xor(node *a, node *b)
{
    return (node*) ((uintptr_t) a ^ (uintptr_t) b);
}

void insert(int item, bool at_tail)
{
    node *ptr = (node*) malloc(sizeof(node));
    ptr->item = item;

    if (NULL == head) {
        ptr->np = NULL;
        head = tail = ptr;
    } else if (at_tail) {
        ptr->np = xor(tail, NULL);
        tail->np = xor(ptr, xor(tail->np, NULL));
        tail = ptr;
    } else {
        ptr->np = xor(NULL, head);
        head->np = xor(ptr, xor(NULL, head->np));
        head = ptr;
    }
}

int delete(bool from_tail)
{
    if (NULL == head) {
        printf("Empty list.\n");
        exit(1);
    } else if (from_tail) {
        node *ptr = tail;
        int item = ptr->item;
        node *prev = xor(ptr->np, NULL);
        if (NULL == prev) head = NULL;
        else prev->np = xor(ptr, xor(prev->np, NULL));
        tail = prev;
        free(ptr);
        ptr = NULL;
        return item;
    } else {
        node *ptr = head;
        int item = ptr->item;
        node *next = xor(NULL, ptr->np);
        if (NULL == next) tail = NULL;
        else next->np = xor(ptr, xor(NULL, next->np));
        head = next;
        free(ptr);
        ptr = NULL;
        return item;
    }
}

void list()
{
    node *curr = head;
    node *prev = NULL, *next;

    while (NULL != curr) {
        printf("%d ", curr->item);
        next = xor(prev, curr->np);
        prev = curr;
        curr = next;
    }

    printf("\n");
}

int main(int argc, char *argv[])
{
    for (int i = 1; i <= 10; i++)
        insert(i, i < 6);

    list(); // 10 9 8 7 6 1 2 3 4 5

    for (int i = 1; i <= 4; i++)
        delete(i < 3);

    list(); // 8 7 6 1 2 3
}
```

Firstly, I would like to credit [this](http://www.geeksforgeeks.org/xor-linked-list-a-memory-efficient-doubly-linked-list-set-2/) post and [this](http://stackoverflow.com/a/3532455) StackOverflow answer, which helped shape my implementation.
Since in C we are unable to perform XOR operations on pointers directly, we must first convert them to integers using the `uintptr_t` data type and then cast back, as can be seen in the 'xor' function.
At its root, the implementation works by storing the resulting XOR value from the previous and next pointer locations for each node.
From this value we are then able to 'undo' the operation using the supplied known pointer, returning the other pointer's value.
If the node appears at the head or tail of the list, the known pointer's value is XORed with 0 (`NULL`), effectively doing nothing.
Below are the different operations that are used to build up and then traverse the list:

- previous ^ next = value (stored in node)
- value ^ previous = next (forward)
- value ^ next = previous (backward)

Looking at the `list` method, you can see that we are able to traverse the list in either direction by calculating the next pointer using the current value and the previous node's value (starting with NULL).
An issue with this implementation is that it only works if you start traversal from the head or tail, as you are required to know the previous pointer's value.
This diminishes one of the main advantages of using a doubly linked list, which is the ability to remove any given node by its reference alone.

## Resources

- [XOR Linked List in Java](http://www.params.me/2011/06/xor-linked-list-in-java.html)
- [Address of a Java Object](http://javapapers.com/core-java/address-of-a-java-object/)
- [Resurrecting sun.misc.Unsafe](http://codethink.no-ip.org/wordpress/archives/712)
- [XOR Linked List - A Memory Efficient Doubly Linked List](http://www.geeksforgeeks.org/xor-linked-list-a-memory-efficient-doubly-linked-list-set-2/)
- [C code for XOR linked list](http://stackoverflow.com/questions/3531972/c-code-for-xor-linked-list)
