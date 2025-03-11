---
layout: post
title: 'Implementing a Dynamic Vector (Array) in C'
meta: 'Learn how to implement a dynamic, resizable vector (array) in C using efficient memory management techniques and simplified macros.'
tags: ['c', 'data-structures']
---

An array (vector) is a commonplace data type, used to hold and describe a collection of elements.
These elements can be fetched at runtime by one or more indices (identifying keys).
A distinguishing feature of an array compared to a list is that arrays allow constant-time random access, unlike lists which provide sequential access.
Resizable arrays allow for an unspecified upper bound of collection elements at runtime, and are conceptually similar to lists.

<!--more-->

Dynamic arrays are more complicated and less commonly used compared to their counterpart, the list, which is dynamic by nature.
Using C as the language of implementation, this post will guide you through building a simple vector data structure.
The structure will take advantage of a fixed-size array, with a counter invariant that keeps track of how many elements are currently present.
If the underlying array becomes exhausted, the addition operation will reallocate the contents to a larger size by means of a copy.

## The Make File

'Make' is a popular utility used throughout software development to build executable artefacts (programmes and libraries) from provided source code.
Through a simple DSL, associations from descriptive short names (targets) and a series of related commands to execute are made.
Running the 'make' command executes the first target found, so this must be carefully considered when designing the file.
Below is a sample Makefile which provides the vector project with simple build, debug and clean targets.

```make
CC=gcc
CFLAGS=
RM=rm -rf
OUT=vector

all: build

build: main.o vector.o
    $(CC) $(CFLAGS) -o $(OUT) main.c vector.c
    $(RM) *.o

debug: CFLAGS+=-DDEBUG_ON
debug: build

main.o: main.c vector.h
    $(CC) $(CFLAGS) -c main.c

vector.o: vector.c vector.h
    $(CC) $(CFLAGS) -c vector.c

clean:
    $(RM) *.o $(OUT)
```

Looking at the code example above, you will notice a few variables that are used to define specific aspects when running the targets (such as the compiler command and flags used).
To keep things modular, the compilation of the 'main' and 'vector' source-code files has been split, with file dependencies specific to each target specified after the short name.
The 'debug' target appends a macro definition flag which is used to include any debug information present in the source code.

## The Header File

Defining a header file allows the programmer to separate specific aspects of the programme's source code into reusable files.
These files commonly contain forward declarations of identifiers and functions.
This allows a user to include the code's header file in their own work, thereby separating the definition from the implementation.
Including a header file produces the same results as copying the full contents into the caller's file.
Below shows the header file implemented for the vector example.

```c
#ifndef VECTOR_H
#define VECTOR_H

#define VECTOR_INIT_CAPACITY 4

#define VECTOR_INIT(vec) vector vec; vector_init(&vec)
#define VECTOR_ADD(vec, item) vector_add(&vec, (void *) item)
#define VECTOR_SET(vec, id, item) vector_set(&vec, id, (void *) item)
#define VECTOR_GET(vec, type, id) (type) vector_get(&vec, id)
#define VECTOR_DELETE(vec, id) vector_delete(&vec, id)
#define VECTOR_TOTAL(vec) vector_total(&vec)
#define VECTOR_FREE(vec) vector_free(&vec)

typedef struct vector {
    void **items;
    int capacity;
    int total;
} vector;

void vector_init(vector *);
int vector_total(vector *);
static void vector_resize(vector *, int);
void vector_add(vector *, void *);
void vector_set(vector *, int, void *);
void *vector_get(vector *, int);
void vector_delete(vector *, int);
void vector_free(vector *);

#endif
```

We wrap the contents of this file in an _include_ guard to ensure that, even when included in multiple source files, it is processed only once.
A 'vector' type is defined which provides access to the capacity and the current total number of elements in the collection.
Along with this, an 'items' variable is declared, which is a pointer to void pointers, allowing us to store a heterogeneous collection of elements in the vector.
The 'vector_resize' function is defined as static, ensuring that it is only accessible within the file in which it is defined.

## The Implementation File

Using the header file definition, the following file is used to implement these methods.
As discussed in the previous section, void pointers are used to reference the collection elements.
Void pointers are pointers that point to arbitrary data with no specific type.
As a consequence, you are unable to directly dereference a pointer of this type and must first cast it to the appropriate type.

```c
#include <stdio.h>
#include <stdlib.h>

#include "vector.h"

void vector_init(vector *v)
{
    v->capacity = VECTOR_INIT_CAPACITY;
    v->total = 0;
    v->items = malloc(sizeof(void *) * v->capacity);
}

int vector_total(vector *v)
{
    return v->total;
}

static void vector_resize(vector *v, int capacity)
{
    #ifdef DEBUG_ON
    printf("vector_resize: %d to %d\n", v->capacity, capacity);
    #endif

    void **items = realloc(v->items, sizeof(void *) * capacity);
    if (items) {
        v->items = items;
        v->capacity = capacity;
    }
}

void vector_add(vector *v, void *item)
{
    if (v->capacity == v->total)
        vector_resize(v, v->capacity * 2);
    v->items[v->total++] = item;
}

void vector_set(vector *v, int index, void *item)
{
    if (index >= 0 && index < v->total)
        v->items[index] = item;
}

void *vector_get(vector *v, int index)
{
    if (index >= 0 && index < v->total)
        return v->items[index];
    return NULL;
}

void vector_delete(vector *v, int index)
{
    if (index < 0 || index >= v->total)
        return;

    v->items[index] = NULL;

    for (int i = index; i < v->total - 1; i++) {
        v->items[i] = v->items[i + 1];
        v->items[i + 1] = NULL;
    }

    v->total--;

    if (v->total > 0 && v->total == v->capacity / 4)
        vector_resize(v, v->capacity / 2);
}

void vector_free(vector *v)
{
    free(v->items);
}
```

Looking at the code example above, you will notice that the 'vector_resize' function is called when certain conditions are met during addition or deletion.
If the current vector capacity is exhausted when an addition is requested, the size is doubled and the vector contents reallocated.
Similarly, upon deletion, if the vector is a quarter full, the contents are reallocated to a vector of half the current size.
These conditions for resizing work well in practice to balance memory capacity and the computation time required to fulfil each resize.

## The Test Case

With all the pieces in place, we are now able to test the implementation.
Below is an example using the direct functions: adding a few strings (character sequences) to a collection, printing the contents, modifying the contents, and then printing it out again.
One unfortunate detail that cannot be avoided when using void pointers is the necessary cast.

```c
#include <stdio.h>
#include <stdlib.h>

#include "vector.h"

int main(void)
{
    int i;

    vector v;
    vector_init(&v);

    vector_add(&v, "Bonjour");
    vector_add(&v, "tout");
    vector_add(&v, "le");
    vector_add(&v, "monde");

    for (i = 0; i < vector_total(&v); i++)
        printf("%s ", (char *) vector_get(&v, i));
    printf("\n");

    vector_delete(&v, 3);
    vector_delete(&v, 2);
    vector_delete(&v, 1);

    vector_set(&v, 0, "Hello");
    vector_add(&v, "World");

    for (i = 0; i < vector_total(&v); i++)
        printf("%s ", (char *) vector_get(&v, i));
    printf("\n");

    vector_free(&v);
}
```

To simplify the use of the vector implementation, the header file defines a few macro functions which can be used in place of the base function calls.
Below is an example that highlights these definitions in practice, reducing some of the verbosity present in the previous example.

```c
#include <stdio.h>
#include <stdlib.h>

#include "vector.h"

int main(void)
{
    int i;

    VECTOR_INIT(v);

    VECTOR_ADD(v, "Bonjour");
    VECTOR_ADD(v, "tout");
    VECTOR_ADD(v, "le");
    VECTOR_ADD(v, "monde");

    for (i = 0; i < VECTOR_TOTAL(v); i++)
        printf("%s ", VECTOR_GET(v, char*, i));
    printf("\n");

    VECTOR_DELETE(v, 3);
    VECTOR_DELETE(v, 2);
    VECTOR_DELETE(v, 1);

    VECTOR_SET(v, 0, "Hello");
    VECTOR_ADD(v, "World");

    for (i = 0; i < VECTOR_TOTAL(v); i++)
        printf("%s ", VECTOR_GET(v, char*, i));
    printf("\n");

    VECTOR_FREE(v);
}
```

Despite still having to provide a casting data type when retrieving a collection element, the macros clean-up and simplify the process a great deal.

## Resources

- [Why use Pointers? Dynamic Memory Allocation](http://www.sparknotes.com/cs/pointers/whyusepointers/section3.rhtml)
- [Void Pointers in C](http://www.circuitstoday.com/void-pointers-in-c)
- [Implementation of a Vector data structure in C](http://codingrecipes.com/implementation-of-a-vector-data-structure-in-c)
- [What does "static" mean in a C program?](http://stackoverflow.com/questions/572547/what-does-static-mean-in-a-c-program)
