---
layout: post
title: 'Implementing ROT13 and ROT(n) Caesar Ciphers in Python'
meta: 'Multiple implementations to encode and decode Caesar Cipher based messages.'
---

The Caesar cipher (shift cipher) is an extremely simple encryption technique.
Substitutions of this kind rely on the invariant - replace each plain-text letter by the letter some fixed number of positions across the alphabet.
The recipient is then able to successfully decode the encoded message if they are aware of the chosen position system.

<!--more-->

ROT13 (aka. rotate by 13 places) is an implementation of this cipher, replacing each letter with the letter 13 positions after it in the given symbol table (typically the alphabet).
As the basic Latin alphabet is 26 letters long, the same algorithm implementation can be used to decode an encoded subject matter.

## Basic Implementation

Using Python 3.4 as the implementation language we are able to simply use the provided (_batteries included_) 'encode' method as shown below.

```python
def rot13(s):
    from codecs import encode
    return encode(s, 'rot13')
```

## Mapping Implementation

The above implementation is extremely useful, however, it does not give us a feel for how the algorithm works from first principles.
The example below highlights the same functionality (limited to the Latin alphabet) by way of a mapping over each character in the subject string.
Each character is passed into the 'lookup' function that returns the valid replacement value, not altering non-alphabet characters.
I would like to point out Python's ability to succinctly express the between conditions, using a standard math-chaining comparison syntax.

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

Using Python's string translation functionality I was able to make a more generic implementation, allowing you to specify the position length.
I decided on using partial function application to allow for rotation functions to be composed and reused.
For example the use-case below follows a single invocation of the initially implemented function.
We could have instead assigned this function to a variable (say 'rot13') and call at will.

```python
def rot_alpha(n):
    from string import ascii_lowercase as lc, ascii_uppercase as uc
    lookup = str.maketrans(lc + uc, lc[n:] + lc[:n] + uc[n:] + uc[:n])
    return lambda s: s.translate(lookup)

rot_alpha(13)('Hello World') # Uryyb Jbeyq
```

## Generic Shift Implementation

The final fixed piece of the implementation is that it only handles Latin alphabet symbols.
Say we would like to use ROT5 for number encoding, this would require an individual implementation.
The example below removes this constraint, allowing the user to pass in each of the symbol strings they wish to permit for encoding.
These passed in values are used to create an encoded lookup table, based on the position length (similar to the previous example).
Finally, the lookup table is used by Python's string translation method to return the processed value.

```python
def rot(*symbols):
    def _rot(n):
        encoded = ''.join(sy[n:] + sy[:n] for sy in symbols)
        lookup = str.maketrans(''.join(symbols), encoded)
        return lambda s: s.translate(lookup)
    return _rot
```

Below highlights the discussed number encoding by five positions.
We are able to compose a new function based on the partial application nature of the 'rot' function.
Latin alphabet encoding is also present with the five position length invariant.
I would like to note that a separate decode implementation is required (-N), as unlike ROT13 the encode algorithm is not it's own inverse.

```python
rot5_num = rot('0123456789')(5)
rot5_num('1234') # 6789

rot_alpha = rot(ascii_lowercase, ascii_uppercase)
rot5_alpha_enc = rot_alpha(5)
rot5_alpha_dec = rot_alpha(-5)

enc = rot5_alpha_enc('Hello World') # Mjqqt Btwqi
rot5_alpha_dec(enc) # Hello World
```
