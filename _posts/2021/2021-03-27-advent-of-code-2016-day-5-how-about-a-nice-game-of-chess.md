---
layout: post
title: 'Advent of Code 2016 - Day 5 - How About a Nice Game of Chess?'
meta: 'Solving the Advent of Code 2016 Day 5 puzzle using Python.'
tags: advent-of-code advent-of-code-2016 python
---

On the fifth day of Advent of Code 2016, we are asked to calculate the password for a security door in Easter Bunny HQ.

<!--more-->

## Part 1

The eight-character password for the security door is generated one character at a time by finding the MD5 hash of the door ID (our input) and an increasing integer index (starting with 0).
A hash indicates the next character in the password if its hexadecimal representation starts with five zeroes, with the sixth character being the next password character.

We will begin by creating a small helper function that simplifies Python's capabilities to hash values using MD5.
Out-of-the-box, you are required to perform some additional steps both before and after generating the hash to return the desired hexadecimal representation.

```python
def md5(value):
    return hashlib.md5(value.encode('utf-8')).hexdigest()
```

We can now use this helper function to build a lazy _infinite list_ that increments from zero and yields hashes in the sequence that match the desired prefix.

```python
def generate_hashes(door_id, padding=5):
    for index in itertools.count(0):
        if (next_hash := md5(door_id + str(index))).startswith('0' * padding):
            yield next_hash
```

With the ability to now perform this generation, we can _take_ the first eight hashes from the sequence and reduce these down to their sixth characters.
Concatenating this listing into string form returns the desired answer 🌟.

```python
PASSWORD_LENGTH = 8

def part1(input):
    return ''.join(h[5] for h in itertools.islice(generate_hashes(input), PASSWORD_LENGTH))
```

## Part 2

For part two, instead of filling in the password from left to right, the hash now also indicates the position within the password to fill.
Based on the same process for generating hashes as in part one, the sixth character now represents the position (0-7), and the seventh character is the character to put in that position.

We can achieve this by generating hashes from the sequence until all password character _slots_ have been filled.
Python is able to rather nicely map these requirements into code form.
Once all _slots_ have been taken, we can return the desired answer, as shown below 🌟.

```python
def part2(input):
    password = [None] * PASSWORD_LENGTH

    for h in generate_hashes(input):
        if (index := int(h[5], 16)) in range(PASSWORD_LENGTH) and password[index] is None:
            password[index] = h[6]
        if None not in password:
            break

    return ''.join(password)
```

I found that by taking advantage of hashes all being represented in base-16, we can succinctly parse and validate the sixth character position upon each iteration.
