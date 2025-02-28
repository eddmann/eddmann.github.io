---
layout: post
title: 'Advent of Code 2016 - Day 11 - Radioisotope Thermoelectric Generators'
meta: 'Solving the Advent of Code 2016 Day 11 puzzle using Python'
tags: advent-of-code advent-of-code-2016 python
---

On the eleventh day of Advent of Code 2016 we are tasked with moving all the supplied Generators and Microchips to a top-floor using a single elevator.

<!--more-->

Having since read through some of the AoC subreddit I can see that this is an _infamous_ AoC day puzzle.
The puzzle description itself is [rather detailed](https://adventofcode.com/2016/day/11) so I would delegate to this to get an understanding of the problem at hand.
In summary, we are required to move all the Generators and Microchips to a top-floor, of a four floor building.
To achieve this we are provided a single elevator which can go up or down one-level at a time, moving one or two objects in the process.
There are a couple of rules surrounding how a floor can be left upon each transition (which the problem defintion lays out).
This initially reminded me of the [Chicken Crossing](https://www.mathsisfun.com/chicken_crossing_solution.html) puzzle.

## Part 1

For part one we are required to work out what the minimum number of steps required is to bring all of the objects to the fourth floor.
We will begin (like we always do) by parsing the supplied input (the initial object floor states) into a representation we can process going forward.

```python
def parse_floors(input):
    return [set(re.findall(r'(\w+)(?:-compatible)? (microchip|generator)', line))
            for line in input.splitlines()]
```

This will return a list of all the floors initial states (zero-indexed) as sets in the form `NAME microchip` and `NAME generator`.
From here we can begin to model the rules surrounding a valid floor transition.

```python
def is_valid_transition(floor):
    return len(set(type for _, type in floor)) < 2 or \
           all((obj, 'generator') in floor
               for (obj, type) in floor
               if type == 'microchip')
```

At a high level, a floor is deemed valid if it is empty, only contains a single type (generators/microchips) of object, or if there are multiple types that every microchip has their associated generator on that floor.
With the ability to now verify if a supplied floor is valid or not, we can continue on to modeling a means to generate all the possible transitions based on a supplied state.

```python
def next_states(state):
    moves, elevator, floors = state

    possible_moves = chain(combinations(floors[elevator], 2), combinations(floors[elevator], 1))

    for move in possible_moves:
        for direction in [-1, 1]:
            next_elevator = elevator + direction
            if not 0 <= next_elevator < len(floors):
                continue

            next_floors = floors.copy()
            next_floors[elevator] = next_floors[elevator].difference(move)
            next_floors[next_elevator] = next_floors[next_elevator].union(move)

            if (is_valid_transition(next_floors[elevator]) and is_valid_transition(next_floors[next_elevator])):
                yield (moves + 1, next_elevator, next_floors)
```

The function above takes in a state (total moves performed, position of elevator and floor objects) as a tuple and yields all the possible valid state transitions we could perform from this position.
Thanks to Python's out-of-the-box combinatorics support we can leverage this to simplify our solution.
With the ability to generate the next possible states from a given initial state, we now need a means or verifying if we have met our end goal state.

```python
def is_all_top_level(floors):
    return all(not floor
               for number, floor in enumerate(floors)
               if number < len(floors) - 1)
```

From here, we can now create a [BFS](https://en.wikipedia.org/wiki/Breadth-first_search) implementation which traverses all the possible state transitions until it finally meets our end goal state.
Using BFS we can be sure that this results in the shortest possible move total.

```python
def min_moves_to_top_level(floors):
    seen = set()
    queue = deque([(0, 0, floors)])

    while queue:
        state = queue.popleft()
        moves, _, floors = state

        if is_all_top_level(floors):
            return moves

        for next_state in next_states(state):
            if (key := count_floor_objects(next_state)) not in seen:
                seen.add(key)
                queue.append(next_state)
```

But wait, what is this `count_floor_objects` function?!
So... to cut a long story short, I initially went about running this above solution _pruning_ any exact floor states that we had already encountered to help performance.
This sadly did not provide a solution reaching the end goal in a adequate amount of time 😢.
After pondering on other techniques to help effectively prune the search space, I resorted to finding some clues online.
The clue I found asked the question _'what classifies a unique floor state?'_.
After even more pondering and experimentation I finally landed on what this clue meant.

```python
def count_floor_objects(state):
    _, elevator, floors = state
    return elevator, tuple(tuple(Counter(type for _, type in floor).most_common()) for floor in floors)
```

Providing that the floor state is valid (which all are when returned from `next_states`) we do not care about the _name_ of the actual objects.
What this means is that a floor can simply be represented as a unique state based on the total number of generators and microchips that are on that floor (each pair are replaceable).
In doing this we cut the search-space down dramatically 🎉.

With all the building blocks now in-place we can parse the input and call `min_moves_to_top_level`.
In doing so we are returned the desired answer to this super-tough problem 🌟!

```python
def part1(input):
    return min_moves_to_top_level(parse_floors(input))
```

## Part 2

Fortunalty, part two is only a small _spin_ on what is asked in part one.
We are now asked to calculate the minimum number of moves required based on the input state, along with two additional object-pairs found on the first floor.
With a small addition we can answer this question using the same `min_moves_to_top_level` function 🌟.

```python
def part2(input):
    floors = parse_floors(input)
    floors[0] = floors[0].union([('elerium', 'generator'), ('elerium', 'microchip'),
                                 ('dilithium', 'generator'), ('dilithium', 'microchip')])
    return min_moves_to_top_level(floors)
```

What a day!
