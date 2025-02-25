---
layout: post
title: 'Implementing ROT13 and ROT(n) Caesar Ciphers in Python'
meta: 'Discover multiple techniques to encode and decode messages using ROT13 and ROT(n) Caesar ciphers in Python, with practical examples and clear explanations.'
tags: python algorithms encryption
---

The Caesar cipher (shift cipher) is an extremely simple encryption technique.
Substitutions of this kind rely on an invariant - replacing each plain-text letter with the letter at a fixed number of positions across the alphabet.
The recipient is then able to decode the encoded message successfully if they are aware of the chosen shift.

<!--more-->

ROT13 (also known as rotate by 13 places) is an implementation of this cipher.
It replaces each letter with the letter 13 positions later in the given symbol table (typically the alphabet).
As the basic Latin alphabet is 26 letters long, the same algorithm can be used to decode an encoded message.

## Basic Implementation

Using Python 3.4 as the implementation language, we are able to simply use the provided (_batteries included_) 'encode' method as shown below.

```python
def rot13(s):
    from codecs import encode
    return encode(s, 'rot13')
```

## Mapping Implementation

The above implementation is extremely useful.
However, it does not give us a feel for how the algorithm works from first principles.
The example below highlights the same functionality (limited to the Latin alphabet) by mapping each character in the subject string.
Each character is passed into the `lookup` function that returns the valid replacement value without altering non-alphabet characters.
I would like to highlight Python's ability to succinctly express range conditions using standard chained comparisons.

```python
def rot13_alpha(s):
    def lookup(v):
        o, c = ord(v), v.lower()
        if 'a' <= c <= 'm':
            return chr(o + 13)
        if 'n' <= c <= 'z':
            return chr(o - 13)
        return v
    return ''.join(map(lookup, s))

rot13_alpha('Hello World') # Uryyb Jbeyq
```

## Generic Alphabet Shift Implementation

Using Python's string translation functionality, I was able to create a more generic implementation that allows you to specify the shift length.
I decided on using partial function application to allow for rotation functions to be composed and reused.
For example, the use-case below follows a single invocation of the initially implemented function.
We could have instead assigned this function to a variable (say `rot13`) and called it at will.

```python
def rot_alpha(n):
    from string import ascii_lowercase as lc, ascii_uppercase as uc
    lookup = str.maketrans(lc + uc, lc[n:] + lc[:n] + uc[n:] + uc[:n])
    return lambda s: s.translate(lookup)

rot_alpha(13)('Hello World') # Uryyb Jbeyq
```

## Generic Shift Implementation

The final implementation limitation is that it only handles Latin alphabet symbols.
If we would like to use ROT5 for number encoding, this would require a separate implementation.
The example below removes this constraint, allowing the user to pass in each of the symbol strings they wish to permit for encoding.
These passed-in values are used to create an encoded lookup table based on the shift length (similar to the previous example).
Finally, the lookup table is used by Python's string translation method to return the processed value.

```python
def rot(*symbols):
    def _rot(n):
        encoded = ''.join(sy[n:] + sy[:n] for sy in symbols)
        lookup = str.maketrans(''.join(symbols), encoded)
        return lambda s: s.translate(lookup)
    return _rot
```

The following example highlights number encoding by five positions.
We are able to compose a new function based on the partial application nature of the `rot` function.
Latin alphabet encoding is also present with the five position length invariant.
I would like to note that a separate decode implementation is required (-N), as unlike ROT13 the encode algorithm is not its own inverse.

```python
rot5_num = rot('0123456789')(5)
rot5_num('1234') # 6789

rot_alpha = rot(ascii_lowercase, ascii_uppercase)
rot5_alpha_enc = rot_alpha(5)
rot5_alpha_dec = rot_alpha(-5)

enc = rot5_alpha_enc('Hello World') # Mjqqt Btwqi
rot5_alpha_dec(enc) # Hello World
```
