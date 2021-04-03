---
layout: post
title: 'Advent of Code 2016 - Day 10 - Balance Bots'
meta: 'Solving the Advent of Code 2016 Day 10 puzzle using Python'
tags: advent-of-code advent-of-code-2016 python
---

On the tenth day of Advent of Code 2016 we come across a factory in which many robots are zooming around handing small microchips to each other.

<!--more-->

Upon entry into the factory we notice that each bot only proceeds when it has two microchips, and once it does, it gives each one to a different bot or puts it in a marked _output_ bin.
Sometimes, bots take microchips from _input_ bins, too.

### Part 1

We are supplied the bot instructions as our input, and are required to work out what numbered bot is responsible for comparing value-61 microchips with value-17 microchips?
To begin we will provide the functionality to parse the input (value) and bot/output allocation instructions.

```python
def parse_values(instructions):
    return [(int(val.group(1)), val.group(2))
            for line in instructions
            if (val := re.match(r'value (\d+) goes to (bot \d+)', line))]
```

This allows us to return input (value) instructions as a tuple, containing the value and bot number to supply this to.

```python
def parse_allocations(instructions):
    return [alloc.groups()
            for line in instructions
            if (alloc := re.match(r'(bot \d+) gives low to (\w+ \d+) and high to (\w+ \d+)', line))]
```

This allows us to return high/low value allocations as a tuple, containing the sender bot and output/bot high and low microchip recipients.

With the ability to now parse the instruction set into a form we can process, we can begin to model how we wish to process each bot allocation.
I initially modelled this as a queue in which we processed each valid instruction and subsequent allocations, until there where no more actions to take place.
This worked well, however, since the initial solution I thought it would be interesting to explore taking advantage of partial function application instead.

```python
def setup_bins(allocations):
    bins = collections.defaultdict(lambda: lambda x: x)

    def config_bot(low_recipient, high_recipient):
        def awaiting_first_chip(a):
            def awaiting_second_chip(b):
                l, h = sorted((a, b))
                bins[low_recipient] = bins[low_recipient](l)
                bins[high_recipient] = bins[high_recipient](h)
                return (l, h)
            return awaiting_second_chip
        return awaiting_first_chip

    for bot, low, high in allocations:
        bins[bot] = config_bot(low, high)

    return bins
```

So as to simplify the design we store both outputs and bots in the same Dictionary called _bins_.
Each entry consists of a single-arity function which returns either a value (the bot has performed their allocation) or a subsequent single-arity function which needs to be applied in a later action.
We use Python's default Dictionary capabilities to return an identity function on non-exist keys, to uniformly _apply_ the output bin allocations.
All bot allocation instructions are translated into _configured bots_ within the Dictionary, and this is then returned to the callee.

From here, we are then able to setup the bins and provide all the initial value instructions to the bots.
Subsequently, all the bot allocation functions will be applied as stated, and we will be returned with a final bin representation.
This final bin representation can then be inspected to see which bot compares bot-17 and bot-61's microchips 🌟.

```python
def part1(input):
    instructions = input.splitlines()
    bins = setup_bins(parse_allocations(instructions))

    for val, bot in parse_values(instructions):
        bins[bot] = bins[bot](val)

    return next(bot for bot, allocated in bins.items() if allocated == (17, 61))
```

### Part 2

For part two, we are are required to instead multiply together the values of one chip in each of outputs 0, 1, and 2?
This can be achieved using the same initial process as in part one, expect now we inspect the bins for the resulting `output N` values.
These values are then multiplied and this value leads to our answer 🌟.

```python
def part2(input):
    instructions = input.splitlines()
    bins = setup_bins(parse_allocations(instructions))

    for val, bot in parse_values(instructions):
        bins[bot] = bins[bot](val)

    return math.prod(bins['output {}'.format(i)] for i in range(3))
```
