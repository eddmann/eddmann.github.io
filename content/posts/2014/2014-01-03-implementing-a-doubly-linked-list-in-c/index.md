---
layout: post
title: 'Implementing a Doubly Linked List in C'
meta: 'A comprehensive guide to implementing a doubly linked list in C, covering structure, memory management and forward declarations.'
tags: ['c', 'data-structures']
---

Following on from the discussion on implementing a [singly linked list](../../2013/2013-12-30-implementing-a-singly-linked-list-in-c/index.md) in C, a logical follow-up data structure is the doubly linked list.

<!--more-->

In a similar fashion to the singly linked list, the structure is composed of a set of sequentially linked nodes, each now containing references (pointers) not only to the next node but also to the previous one.
This structure is useful if the use case requires the ability to traverse the list both forwards and backwards, or to quickly determine preceding and following elements from a given node.
The head and tail nodes can be terminated with either [sentinel nodes](http://en.wikipedia.org/wiki/Sentinel_node) (referred to as _circularly linked_ if only one is used) or, as in the implementation shown below, `NULL`.
One notable implementation difference between the two structures is that by storing both the previous and next references, the complexity and running time of certain operations (with removal from the tail being the most obvious) can be significantly simplified.

```c
#include <stdio.h>
#include <stdlib.h>
#include <stdbool.h>

typedef struct node {
    int item;
    struct node *prev, *next;
} node;

node *head, *tail;

void insert(int item, bool at_tail)
{
    node *ptr = (node*) malloc(sizeof(node));
    ptr->item = item;
    ptr->prev = ptr->next = NULL;

    if (NULL == head) {
        head = tail = ptr;
    } else if (at_tail) {
        tail->next = ptr;
        ptr->prev = tail;
        tail = ptr;
    } else {
        ptr->next = head;
        head->prev = ptr;
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
        tail = ptr->prev;
        if (NULL == tail) head = tail;
        else tail->next = NULL;
        free(ptr);
        ptr = NULL;
        return item;
    } else {
        node *ptr = head;
        int item = ptr->item;
        head = ptr->next;
        if (NULL == head) tail = head;
        else head->prev = NULL;
        free(ptr);
        ptr = NULL;
        return item;
    }
}

void list()
{
    node *ptr = head;

    while (NULL != ptr) {
        printf("%d ", ptr->item);
        ptr = ptr->next;
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

Looking at the implementation above, you will notice the omission of list traversal when removing a node from the tail, as the reference to the previous node is already at hand.
The `list` function only takes into consideration forward iteration over the list, however, it would be very easy to modify the code to perform backwards traversal.
It is good practice to not only free the memory that is no longer required, but also to set any related pointers to `NULL`, as these pointers would otherwise still refer to memory that has been deallocated.

One C implementation detail I would like to discuss is the use of `typedef struct` when declaring the node structure.
In C, there are two different namespaces: one for `struct` tags and one for `typedef` names.
Referring to a `struct` can be very verbose, and to avoid this we can declare both a node `struct` and a plain node in the `typedef` namespace.
Both refer to the same type, allowing us to omit the `struct` keyword.
However, using only the `typedef` declaration would not allow us to perform a [forward declaration](http://en.wikipedia.org/wiki/Forward_declaration), which gives us the ability to use an identifier before providing the complete definition to the compiler.

## Resources

- [Difference between 'struct' and 'typedef struct' in C++?](http://stackoverflow.com/questions/612328/difference-between-struct-and-typedef-struct-in-c)
- [Forward declaration](http://en.wikipedia.org/wiki/Forward_declaration)
