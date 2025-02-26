---
layout: post
title: "Using the 'IS (NOT) DISTINCT FROM' SQL Comparators"
meta: "Learn how to use the 'IS (NOT) DISTINCT FROM' SQL comparators to handle NULL values effectively in SQL queries."
tags: sql
---

In a recent SQL statement, I stumbled upon an issue regarding the handling of `NULL` values within a given predicate.
Coming from languages such as PHP, which are very liberal in their type coercion (`NULL` can be treated as a falsy value), I was surprised to find how the inclusion of such a value resulted in a sort of predicate short-circuiting. <!--more-->
This occurs because `NULL`, in its strictest sense, is an unknown value.
As such, the entire condition is deemed unknown in the event of its presence.
However, if you wish to weaken this constraint within a comparison, you can take advantage of `IS DISTINCT FROM`, which instead treats `NULL` as a known value.
This difference can be best highlighted in a small logic table, where we first describe how the presence of a `NULL` value takes over the entire predicate result.

```sql
NULL != NULL = NULL
NULL != TRUE = NULL
TRUE != NULL = NULL
```

Using the `IS DISTINCT FROM` comparator instead, we can treat `NULL` as a known value, which then returns the desired Boolean result.

```sql
NULL IS DISTINCT FROM NULL = FALSE
NULL IS DISTINCT FROM TRUE = TRUE
TRUE IS DISTINCT FROM NULL = TRUE
```
