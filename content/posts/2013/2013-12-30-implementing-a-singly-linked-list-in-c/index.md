---
layout: post
title: 'Implementing a Singly Linked-List in C'
meta: 'Learn how to implement a singly linked list in C with this detailed guide, featuring code examples and explanations on insertion, deletion, and boolean usage in C.'
tags: ['c', 'data-structures']
---

Over the past couple of days I have become very interested in brushing up on my limited C knowledge.
As I discussed in my previous [post](../2013-12-29-experimenting-with-the-xor-swap-method-in-java/index.md) on using the XOR swap method, everyday languages are becoming very high-level, and as a result taking away some of the fun.
In the next couple of posts I wish to implement some of the commonplace data structures found in development, but unlike previous attempts, these will be in straight C.

<!--more-->

The first such data structure I wish to discuss is the singly linked list.

```c
#include <stdio.h>
#include <stdlib.h>
#include <stdbool.h>

struct node {
    int item;
    struct node *next;
} *head, *tail;

struct node* insert(int item, bool at_tail)
{
    struct node *ptr = (struct node*) malloc(sizeof(struct node));
    ptr->item = item;
    ptr->next = NULL;

    if (NULL == head) {
        head = tail = ptr;
    } else if (at_tail) {
        tail->next = ptr;
        tail = ptr;
    } else {
        ptr->next = head;
        head = ptr;
    }

    return ptr;
}

int delete(bool from_tail)
{
    if (NULL == head) {
        return -1;
    } else if (from_tail) {
        if (head == tail) return delete(false);
        struct node *ptr = head;
        while (ptr->next != tail) ptr = ptr->next;
        int item = ptr->next->item;
        tail = ptr;
        free(tail->next);
        tail->next = NULL;
        ptr = NULL;
        return item;
    } else {
        struct node *ptr = head;
        int item = ptr->item;
        head = ptr->next;
        if (NULL == head) tail = head;
        free(ptr);
        ptr = NULL;
        return item;
    }
}

void list()
{
    struct node *ptr = head;

    while (NULL != ptr) {
        printf("%d ", ptr->item);
        ptr = ptr->next;
    }

    printf("\n");
}
```

As you can see from the implementation above, both insertion and removal methods allow the user to specify if they wish to affect the head or tail.
Surprisingly, it was not until the ISO-C99 standard that C got a native boolean data type (\_Bool).
The 'stdbool.h' header file defines library macros (true, false) which resolve to the \_Bool type.
With the above implementation we are also able to print out the contents of the full linked list at that present time.

```c
int main()
{
    for (int i = 1; i <= 10; i++)
        insert(i, i < 6);

    list(); // 10 9 8 7 6 1 2 3 4 5

    for (int i = 1; i <= 4; i++)
        delete(i < 3);

    list(); // 8 7 6 1 2 3
}
```

The above method bootstraps the implementation together, providing us with an example of inserting items initially at the tail and then at the head.
We then delete four items from the list in a similar manner to the insertion step, deleting half from the tail and the other half from the head.

```bash
$ gcc linkedlist.c -o linkedlist && ./linkedlist
```

We can then use the command above, which simply compiles the file and subsequently executes it.

## Resources

- [Using boolean values in C](http://stackoverflow.com/questions/1921539/using-boolean-values-in-c)
- [Is bool a native C type?](http://stackoverflow.com/questions/1608318/is-bool-a-native-c-type/1608350)
