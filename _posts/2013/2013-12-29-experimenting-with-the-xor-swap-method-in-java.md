---
layout: post
title: 'Experimenting with the XOR Swap Method in Java'
meta: 'Explore the implementation and theory behind the XOR swap method in Java, a unique technique for swapping variable values without a temporary variable, complete with code examples and detailed explanations.'
tags: java algorithm
---

The exclusive disjunction (or XOR) swap algorithm is a little trick to swap values of the same data type without the use of a temporary variable.
Typically, low-level data types like integers are used in practice, but in theory any value represented by fixed-length [bit-strings](http://en.wikipedia.org/wiki/Bit_array) will work.
Though it is considered bad practice in most use cases, it does help to highlight implementation details which can seem foreign to [higher-level](http://en.wikipedia.org/wiki/High-level_programming_language) programmers.
Due to the high levels of abstraction implemented to aid the development of complex systems, we sometimes lose the beauty of working with the underlying bits and bytes.
An example of such an abstraction is the [garbage collector](http://javabook.compuware.com/content/memory/how-garbage-collection-works.aspx) found in the JVM, which handles memory management concerns that, in lower-level languages, would require significant attention.

<!--more-->

## Decimal to Binary Representation

To display each value's binary representation in the experiment, we could simply use the [Integer.toBinaryString](<http://docs.oracle.com/javase/7/docs/api/java/lang/Integer.html#toBinaryString(int)>) method.
However, as this is a learning exercise, below are two alternative implementations.

```java
public static String toBin(int decimal)
{
    if (decimal == 0) return "0";

    StringBuilder sb = new StringBuilder();

    while (decimal > 0) {
        sb.append(decimal & 1);
        decimal >>= 1;
    }

    return sb.reverse().toString();
}
```

The first example uses a bitwise AND and shift operation to inspect each bit of the integer value.
This implementation handles the use case of being initially supplied with a decimal value of zero.
The resulting value is built using a StringBuilder and reversed before the string instance is created.
This is required as we wish to represent the least significant digit at the rightmost position.

```java
public static String toBin(int decimal)
{
    return (decimal > 0)
        ? toBin(decimal / 2) + (decimal % 2)
        : "";
}
```

The second example uses division and modulus to recursively build up a string representation.

## The Algorithm

Directing attention back to the algorithm, no stipulations are placed on the value; however, due to [aliasing](<http://en.wikipedia.org/wiki/Aliasing_(computing)>) concerns, the two variables must be stored in different (distinct) memory address spaces.
With this knowledge in hand, we can now produce an example of the algorithm.

```java
int x, y;
x = 1, y = 2; // x=01, y=10
x = x ^ y;    // x=11, y=10
y = x ^ y;    // x=11, y=01
x = x ^ y;    // x=10, y=01
```

After initialising the two integers, we combine (XOR) the two values, storing the resulting value back into the first variable.
As the XOR operation is [commutative](http://en.wikipedia.org/wiki/Commutative_property), we are free to change the operand ordering of any or all three of the statements.
We then move on to XOR the resulting first value and the initial second value, storing the result in the second variable's location.
Using an XOR in this manner effectively cancels out all the information we have gained from the second variable in the initial operation, leaving us with only the first value.
Finally, we XOR the two values yet again, but this time storing the resulting value back into the first variable, which, due to cancellation, leaves us with only the second value.

## Resources

- [XOR swap algorithm](http://en.wikipedia.org/wiki/XOR_swap_algorithm)
- [Bit array](http://en.wikipedia.org/wiki/Bit_array)
- [Java Memory Management](http://javabook.compuware.com/content/memory/how-garbage-collection-works.aspx)
