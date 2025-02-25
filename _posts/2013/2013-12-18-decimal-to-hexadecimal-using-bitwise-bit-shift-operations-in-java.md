---
layout: post
title: 'Decimal to Hexadecimal using Bitwise, Bit Shift Operations in Java'
meta: 'Learn how to convert decimal numbers to hexadecimal using bitwise and bit shift operations in Java. Discover a custom method for random web colour generation and detailed insights into low-level data conversion techniques.'
tags: java
---

I recently wanted to create a simple function in JavaScript which allowed me to generate a random background colour for a small [experiment](http://workshop.eddmann.com/copacabana/) I was working on.
The implementation I came up with worked very well, but the decimal-hexadecimal representation conversion was all wrapped up in one `toString(16)` function call.
I was very interested in creating this method myself, and I decided to use the Java language for the attempt.
The discussed functionality is already present in the Java language, within the `java.lang.Integer` class, as `toHexString`.

<!--more-->

Hexadecimal uses a positional base-16 system, where each digit can represent four binary digits (bits).
Taking a look at the [documentation](http://docs.oracle.com/javase/tutorial/java/nutsandbolts/datatypes.html), you will see that a Java integer is able to hold a 32-bit signed, two's complement value between -2^31 and 2^31-1.
These observations allow us to deduce that the smallest and largest integer values can be represented using a maximum of eight hexadecimal digits.
The two's complement representation is a widely used scheme in computing, using the most significant bit to determine if the value is negative.
To convert a negative number to and from a two's complement representation, a simple inversion of each binary bit followed by an addition of one is required.
With this knowledge, we can now implement the solution shown below.

## Decimal to Hexadecimal

```java
public static String toHexString(int decimal)
{
    String codes = "0123456789ABCDEF";

    StringBuilder builder = new StringBuilder(8);

    builder.setLength(8);

    for (int i = 7; i >= 0; i--) {
        builder.setCharAt(i, codes.charAt(decimal & 0xF));
        decimal >>= 4;
    }

    return builder.toString();
}
```

In the above implementation, I first create a `StringBuilder` instance with an initial capacity of 8 (instead of the default 16).
I then subsequently set the current length of the instance to 8, which pads the string with null values ('\u0000').
Once this is complete, I loop over the builder instance starting with the rightmost character, the lowest position in a positional numeral system.
Within the loop, I use a bitwise 'AND' mask which returns the current lowest positioned 4 bits from the subject integer.
I could alternatively have used the decimal '15', or the bitwise representation '0b1111'.
A value between 0 and 15 is returned from the operation, which is then used to look up the corresponding character in the 'codes' string and set it in the builder instance.
To complete a full iteration of the loop, I perform a signed right shift on the subject integer, shifting the pattern 4 bits to the right to process the next position.
Finally, once the loop has finished, I return the string representation of the builder instance.

## Example Usage

```java
int min = Integer.MIN_VALUE; // -2147483648
int max = Integer.MAX_VALUE; // 2147483647

String minHex = toHexString(min); // 80000000
String maxHex = toHexString(max); // 7FFFFFFF

System.out.printf(
    "valid: min %c, max %c",
    (min == (int) Long.parseLong(minHex, 16) ? '\u2714' : '\u2717'),
    (max == Integer.parseInt(maxHex, 16) ? '\u2714' : '\u2717')
); // valid: min ✔, max ✔
```

The above examples show the solution being used to represent the minimum and maximum possible integer values.
One issue that did arise was when converting the minimum value back to a decimal representation.
I was required to perform a perplexing parse as a long, and then cast it back down to the desired integer.
This is because Java parses integers as signed values, so inserting anything higher than 0x7FFFFFFF will throw an error.
If you parse it as a long, however, the value will still be signed but the cast will overflow the integer back to its correct value.

## Random Web Colours

Now, back to the reason why I wanted to convert decimal representations into hexadecimal in the first place.
Web colours are represented by a six-digit hex triplet.
Each pair of digits represents the red, green and blue components of the colour.
With this knowledge, we simply need to generate a random number between 0 (0x000000) and 16777215 (0xFFFFFF), inclusive.
We can then convert this decimal representation into hexadecimal using our built implementation.
There are two important points to note about the code below.
Firstly, the first two characters of the string returned are removed.
This is because hex triplets only use six positions, which means the most significant two are not required.
Additionally, Java's `nextInt` method is inclusive of 0 and exclusive of the provided maximum value, so we must add one to the desired range to obtain the correct result.

```java
public static String randomWebColour()
{
    return "#" + toHexString(new java.util.Random().nextInt(16777216)).substring(2);
}
```

## Resources

- [Primitive Data Types - Java Documentation](http://docs.oracle.com/javase/tutorial/java/nutsandbolts/datatypes.html)
- [Bitwise and Bit Shift Operators - Java Documentation](http://docs.oracle.com/javase/tutorial/java/nutsandbolts/op3.html)
- [Two's Complement Tutorial](http://www.cs.cornell.edu/~tomf/notes/cps104/twoscomp.html)
- [Java negative int to hex and back fails](http://stackoverflow.com/questions/845230/java-negative-int-to-hex-and-back-fails)
