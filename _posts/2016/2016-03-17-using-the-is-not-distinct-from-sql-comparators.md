---
layout: post
title: "Using the 'IS (NOT) DISTINCT FROM' SQL comparators"
meta: "Making use of the 'IS (NOT) DISTINCT FROM' SQL comparators to handle NULL values"
---

In a recent SQL statement I stumbled upon an issue in-regard to handling `NULL` values within a given predicate.
Coming from languages (such as PHP) which are very liberal in their type coercion (`NULL` can be treated as a falsey value), I was surprised to find how the inclusion of such a value resulted in a sort of predicate short-circuiting. <!--more-->
This occurs as `NULL` in its strictest sense is an unknown value, and as such the entire condition should be deemed unknown in the event of its presence.
However, if you wish to weaken this constraint within a comparison you are able to take advantage of `IS DISTINCT FROM` which instead treats `NULL` as a known value.
This difference can be best highlighted in a small logic table, where we first describe how the presence of a `NULL` value takes over the entire predicate result.

```sql
NULL != NULL = NULL
NULL != TRUE = NULL
TRUE != NULL = NULL
```

Using the `IS DISTINCT FROM` comparator instead, we are able to treat `NULL` as a known value, which then returns the desired boolean result.

```sql
NULL IS DISTINCT FROM NULL = FALSE
NULL IS DISTINCT FROM TRUE = TRUE
TRUE IS DISTINCT FROM NULL = TRUE
```
