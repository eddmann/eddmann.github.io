---
layout: post
title: 'Advent of Code 2016 - Day 7 - Internet Protocol Version 7'
meta: 'Solving the Advent of Code 2016 Day 7 puzzle using Python'
tags: advent-of-code advent-of-code-2016 python
---

On the seventh day of Advent of Code 2016 we are required to work out which IPv7 addresses support TLS (transport-layer snooping) and SSL (super-secret listening).

<!--more-->

### Part 1

We are supplied a list of IPv7 addresses which consist of supernets (sequences outside square brackets) and hypernets (sequences within square brackets).
For part one we are required to tally up how many IPv7 addresses support TLS.

> An IP supports TLS if it has an Autonomous Bridge Bypass Annotation, or ABBA.
> An ABBA is any four-character sequence which consists of a pair of two different characters followed by the reverse of that pair, such as xyyx or abba.
> However, the IP also must not have an ABBA within any hypernet sequences, which are contained by square brackets.

We will begin by parsing the IPv7 addresses into a form we can process going forward.

```python
def parse_ips(input):
    def parse_ip(ip):
        supernets = re.split(r"\[[^\]]+\]", ip)
        hypernets = re.findall(r"\[([^\]]+)\]", ip)
        return supernets, hypernets
    return map(parse_ip, input.splitlines())
```

Now having access to a structured tuple which includes all the supernets and hypernets for a given address, we can now construct a predicate function which asserts if the IP supports TLS.

```python
def has_tls_support(ip):
    supernets, hypernets = ip
    abba = r"(.)((?!\1).)\2\1"
    return any(re.search(abba, s) for s in supernets) and not any(re.search(abba, h) for h in hypernets)
```

We construct a regular expression which captures an initial character (_a_), followed by a different character (_b_), and then ensures that the sequence then follows the captured groupings _b_ then _a_.
This expression can then be searched for within both the IP supernets and hypernets - ensuring that it is present in at least one supernet, but no hypernets.
With this predicate function now in-place we can map over all the parsed IP addresses and tally up all the ones that support TLS.
In doing so we have answered part one of today's puzzle 🌟.

```python
def part1(input):
    return sum(has_tls_support(ip) for ip in parse_ips(input))
```

### Part 2

For part two, we are instead asked to tally up how many of these parsed IPv7 addresses support SSL.

> An IP supports SSL if it has an Area-Broadcast Accessor, or ABA, anywhere in the supernet sequences (outside any square bracketed sections), and a corresponding Byte Allocation Block, or BAB, anywhere in the hypernet sequences.
> An ABA is any three-character sequence which consists of the same character twice with a different character between them, such as xyx or aba.
> A corresponding BAB is the same characters but in reversed positions: yxy and bab, respectively.

In a similiar fashion to how we checked for TLS support, we will create a small predicate function which handles the base-case of a single IP.

```python
def has_ssl_support(ip):
    supernets, hypernets = ip
    aba = iter(ab
               for s in supernets
               for ab in re.findall(r"(?=(.)((?!\1).)\1)", s))
    return any(b + a + b in h for a, b in aba for h in hypernets)
```

We use a regular expression again to find all occurrences of _aba_ within the provided subnets, returning the captured _a_ and _b_ values from each match.
These values are then used to check if a hypernet is present which includes the pattern _bab_.
We are required to wrap the expression in a positive lookahead so as to cater for overlapping matches such as `zazbz` which contains both `zaz` and `zbz`.
This highlights the power of Python's list comprehension capabilities.

Finally, we can tweak the part one solution to filter down the IP address listing to tally up all the addresses that support SSL.
In doing so we have answered part two of today's puzzle 🌟.

```python
def part2(input):
    return sum(has_ssl_support(ip) for ip in parse_ips(input))
```
