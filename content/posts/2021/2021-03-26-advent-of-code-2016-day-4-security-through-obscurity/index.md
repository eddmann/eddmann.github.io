---
layout: post
title: 'Advent of Code 2016 - Day 4 - Security Through Obscurity'
meta: 'Solving the Advent of Code 2016 Day 4 puzzle using Python.'
tags: ['advent-of-code', 'advent-of-code-2016', 'python']
---

On the fourth day of Advent of Code 2016, we are asked to validate and decrypt a listing of room names.

<!--more-->

## Part 1

The input consists of a listing of encrypted room names, each with a sector ID and accompanying checksum.
For part one, we are required to filter down to only the valid rooms (based on their checksum) and return the sum of these sector IDs.
A room is _real_ (not a decoy) if the checksum is the five most common letters in the encrypted name, in order, with ties broken by alphabetisation.

We will begin by parsing each room entry into a tuple, consisting of the room name (without any `-`), sector ID (as an integer), and checksum.

```python
def parse_rooms(input):
    return [(name.replace('-', ''), int(id), checksum)
            for (name, id, checksum) in re.findall(r'([a-z\-]+)(\d+)\[([a-z]+)\]', input)]
```

With the rooms now parsed, we can continue on to validating if a subject room is real or a decoy.

```python
def is_real_room(name, checksum):
    generated = ''.join(c for c, _ in sorted(
        Counter(name).most_common(), key=lambda o: (-o[1], o[0])))
    return generated.startswith(checksum)
```

The function above uses the [Counter collection](https://docs.python.org/3/library/collections.html#collections.Counter) provided within Python to tally up the letter occurrences present in the room name.
From here, we then sort the listing, initially based on occurrence `-o[1]`, and then ties based on alphabetisation `o[0]`.
As we have generated the checksum for the entire room name, we only wish to assert that this value starts with the provided checksum.

Finally, we can combine these two functions together to _filter-map_ the listing down to the valid room sector IDs.
The sum of these sector IDs can then be returned to result in the desired answer 🌟.

```python
def part1(input):
    return sum(id for (name, id, checksum) in parse_rooms(input)
               if is_real_room(name, checksum))
```

## Part 2

For part two, we are required to now deduce the sector ID for the decoded room name that contains _northpole_.
The encrypted room names have been constructed using a [Caesar cipher](https://en.wikipedia.org/wiki/Caesar_cipher), based on cycling each letter forward through the alphabet a number of times equal to the room's sector ID.
This can be achieved using Python's string character translation support like so.

```python
def decode(name, id):
    az = string.ascii_lowercase
    shift = id % len(az)
    return name.translate(str.maketrans(az, az[shift:] + az[:shift]))
```

Alternatively, we could also achieve the same result by calculating the resulting ASCII character number per letter, like so.

```python
def decode(name, id):
    return ''.join(chr(((ord(c) - ord('a')) + id) % 26 + ord('a')) for c in name)
```

Using this new function, we can now iterate through the rooms, decoding each name as we go, until we finally land on the one that includes _northpole_.
From here, we can return this room's sector ID and answer the second part of today's problem 🌟.

```python
def part2(input):
    return next(id for (name, id, _) in parse_rooms(input)
                if 'northpole' in decode(name, id))
```
