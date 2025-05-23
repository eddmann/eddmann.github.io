---
layout: post
title: 'Solving the Advent of Code 2021 calendar using C in under half-a-second'
meta: 'Exploring the journey of solving the Advent of Code 2021 calendar in under half a second using the C programming language.'
tags: ['python', 'c', 'advent-of-code']
---

Since being introduced to the world of [Advent of Code](https://adventofcode.com/) just prior to the 2020 calendar starting, I subsequently spent the majority of 2021 completing (and documenting) the [2015]({{< tag "advent-of-code-2015" >}}), [2016]({{< tag "advent-of-code-2016" >}}) and [2017](https://github.com/eddmann/advent-of-code/tree/master/2017/rust) calendars.
For the 2021 calendar, I decided that it would be interesting (and challenging) to complete the calendar in C, with an initial solution written in Python to meet the daily aspect of the challenge.
Additionally, with C being such a performant language, I also wanted to set the goal of ensuring that the entire C calendar was solvable on a single CPU core in under half a second (inspired by [this](https://www.dannyvankooten.com/blog/2021/solving-advent-of-code-2020-under-1-second/) blog post).
In this post, I wish to discuss how I went about achieving this goal (_spoiler_: `410315 μs (0.410 s)` on average) and the hurdles I faced along the way.

<!--more-->

## The Rules

A month prior to the calendar commencing, I decided to lay out some rules that I would follow whilst completing each solution in C.

1. The runtime benchmark would be taken from execution on my current MacBook Pro, running an [Intel Core i7-9750H CPU @ 2.60GHz](https://www.cpubenchmark.net/cpu.php?cpu=Intel+Core+i7-9750H+%40+2.60GHz&id=3425).
2. Each solution written would follow the C11 standard and compile using the GCC compiler with the following flags: `-std=gnu11 -march=native -Ofast -Wall -Werror`.
3. No third-party libraries (data structures and algorithms) could be used within a solution, making each solution self-contained.
   I did make one exception, that being the inclusion of a [dynamic array](https://github.com/eddmann/advent-of-code/blob/master/2021/c/shared/dynarray.c) implementation, which eased variable input sizes.
4. Each solution would clean up any memory allocation it had requested.
   Sure, the OS would clean up these allocations once the executable terminates, but in constrained memory environments (i.e. microcontrollers), this would be a necessity and a possible next project 😉.
5. Each day's solution parts would be computationally self-reliant, meaning that computation completed by part one **could not** be reused in part two.
   This, in effect, made the task of keeping under half a second even harder, as performance gains found in reusing previous state were prohibited.

As discussed in the introduction, I did not complete each day's solution in C from the outset.
Instead, I opted to initially complete each solution in Python (a more forgiving dynamic language) first and then set out to complete the C equivalent.
This allowed me to review possible strategies in a _batteries-included_ language that provides rapid development first and then port these over to C.

## Things I Learnt

The Advent of Code 2021 calendar had some very tricky problems in it.
Some required a lot of thinking and research to reduce down to an adequate runtime to meet the half-a-second target.
Over the course of a couple of months, I managed to finally achieve this goal, reaching an average runtime of `410315 μs (0.410 s)` 🎉.
Below are key learnings I took away from the experience of initially programming in C and then trying to make them more performant.

- C has very unforgiving error messages, runtime [Segmentation faults](https://en.wikipedia.org/wiki/Segmentation_fault) are not easy to debug.
  When solving the 2017 calendar in Rust (another system-level language), I think I took for granted how well that language aids the developer in tracking down and correcting bugs.
- Debugging using tools such as [gdb](https://www.sourceware.org/gdb/) was very useful, but as I had not invested the time in integrating this within an IDE, using the terminal for such tasks was rather painful.
  This meant that I opted for one too many `getc(stdin)` and `printf` statements to track execution throughout the course of the calendar.
- [Valgrind](https://valgrind.org/) is your friend!
  When handling cleanup after each solution, having the ability to profile the heap memory usage throughout execution using Valgrind was a lifesaver.
- Due to some data structures required to adequately solve some days, I unintentionally learnt a lot about how hash tables and priority queues are built from first principles.
  Although this was interesting, it did take away from focusing on the problem at hand.
  This made me envious of languages such as C++ and Python, which already include tried and true implementations of such structures.
- On top of the C11 standard, I also wished to follow a uniform coding style.
  This led me to employ the use of the [clang-format](https://www.kernel.org/doc/html/latest/process/clang-format.html) tool and follow the style laid out in [How to C in 2016](https://matt.sh/howto-c), for example, using types found in [stdint.h](https://pubs.opengroup.org/onlinepubs/9699919799/basedefs/stdint.h.html).
- Parsing input using `sscanf` is not as bad as I feared it would be.
  In fact, for some solutions, I actually found it easier to parse the input in the C version than I did the Python equivalent 🤯.
- Using the C macro system to help reduce boilerplate required to bootstrap each solution was very useful.
  Being able to reuse behaviour within the [`AOC_MAIN`](https://github.com/eddmann/advent-of-code/blob/master/2021/c/shared/aoc.h) macro aided greatly in making each solution's implementation very concise to the problem.
- It took a little while to get used to handling memory allocations on the stack vs. the heap - another concept that higher-level languages with more abstract memory models hide from you.
  However, after the initial learning curve, it became an interesting decision to make on a per-solution basis as to what the best option was.

## The Solutions

Throughout the course of December, and the subsequent months when revising the C solutions, I documented how each problem was tackled.
Below are notes on interesting aspects of each solution and techniques used to increase performance for the end goal.

### Day 1: Sonar Sweep

Solution: [Python](https://github.com/eddmann/advent-of-code/tree/master/2021/python/src/day01), [C `runtime: 732 μs`](https://github.com/eddmann/advent-of-code/tree/master/2021/c/day01)

The first day provided me with a good use case for Python's list comprehensions and allowed me to make use of the `zip` function to apply the desired windows.
For the C solution, I opted to use conventional _for_ loops.
It gave me my first experience with the dynamic array implementation, allowing me to initially parse the input measurements into a form I wanted to use for the computation.

### Day 2: Dive!

Solution: [Python](https://github.com/eddmann/advent-of-code/tree/master/2021/python/src/day02), [C `runtime: 444 μs`](https://github.com/eddmann/advent-of-code/tree/master/2021/c/day02)

The Python version was small enough to fit in each part's solution functions.
In hindsight, I would have opted to use an exhaustive _match_ case statement over _if_ statements.
The C solution required my first _struct_ to store the course instructions and followed a simplified mutable pattern similar to the Python variant.
It also provided me with my first experience using `scanf` to extract the desired input.

### Day 3: Binary Diagnostic

Solution: [Python](https://github.com/eddmann/advent-of-code/tree/master/2021/python/src/day03), [C `runtime: 761 μs`](https://github.com/eddmann/advent-of-code/tree/master/2021/c/day03)

I had a lot of fun using bitwise operations and the handy [_Counter_](https://docs.python.org/3/library/collections.html#collections.Counter) data structure in the Python solution.
Finding the `bit_length` method within the standard library was also very useful.
For the C solution, I followed a similar approach; however, for determining the bit width, I thought it would be fun to drop down into some assembly.
Having targeted the x86 architecture, I was able to use the `bsrl` CPU operation to determine the bit length.

### Day 4: Giant Squid

Solution: [Python](https://github.com/eddmann/advent-of-code/tree/master/2021/python/src/day04), [C `runtime: 2715 μs`](https://github.com/eddmann/advent-of-code/tree/master/2021/c/day04)

The Python solution made use of `any` and `all` iterable functions to clearly map intent within the code.
This again used the powerful `zip` function, this time to transpose the lists board rows.
For the C solution, I tried to accommodate variable-size input, resulting in dynamic allocation of the boards.
This led to quite a lot of cleanup being required after the computation step.
I did find a `goto` to be useful, however, to apply the required cleanup operation before returning.
Typically, I would short-circuit and return early in the looping construct if the condition had been met.
This means leaning heavily on the garbage collector in other languages to free any reclaimable memory.

### Day 5: Hydrothermal Venture

Solution: [Python](https://github.com/eddmann/advent-of-code/tree/master/2021/python/src/day05), [C `runtime: 1799 μs`](https://github.com/eddmann/advent-of-code/tree/master/2021/c/day05)

This was another interesting problem and allowed me to use Python's `zip_longest` and `range` to determine the intermediate steps of the given lines, with the _Counter_ data structure recording overlaps.
I also took advantage of `True` values being counted as `1` within a Python `sum` function call.
For the C solution, I used a [variable-length](https://en.wikipedia.org/wiki/Variable-length_array) grid to store the counts, opting to check for `+grid[x][y] == 2` to ensure we only counted coordinate overlaps a single time.
With the inclusion of variable-length arrays, I started to explore the use of stack and heap allocated memory within different scenarios.

### Day 6: Lanternfish

Solution: [Python](https://github.com/eddmann/advent-of-code/tree/master/2021/python/src/day06), [C `runtime: 61 μs`](https://github.com/eddmann/advent-of-code/tree/master/2021/c/day06)

Having spent some time determining the pattern cycle, the resulting solutions modelled in Python and C were very similar and not very complex.
Fishes with a lifetime of 0 will have a timer of 8 on the next iteration (i.e. newborns).
Fishes in the current generation with a timer of 7 today will have a timer of 6 on the next day.
So, the number of fishes that are reset today (timer of 0) must be added to those with a timer of 7.

### Day 7: The Treachery of Whales

Solution: [Python](https://github.com/eddmann/advent-of-code/tree/master/2021/python/src/day07), [C `runtime: 11267 μs`](https://github.com/eddmann/advent-of-code/tree/master/2021/c/day07)

This was another Python solution that leaned heavily on list comprehensions and the standard library, using [triangle numbers](https://en.wikipedia.org/wiki/Triangular_number) to keep the formula simple.
As expected, there was a lot more C code required for this one; even though it follows the Python solution, the lack of list comprehensions required a lot of state manipulation.

### Day 8: Seven Segment Search

Solution: [Python](https://github.com/eddmann/advent-of-code/tree/master/2021/python/src/day08), [C `runtime: 351 μs`](https://github.com/eddmann/advent-of-code/tree/master/2021/c/day08)

This problem was one of my favourites from the 2021 calendar.
I had a lot of fun using sets, _match_ statements, and exploring Python's type-hinting capabilities.
The general solution I went with was that, based on the characteristics of _one_ and _four_, you can determine the decoded output.
For the C solution, instead of sets, I simply counted the pattern similarities, which did not seem to be too much of a performance bottleneck.
As we knew the expected input values, I was able to bake these into the _struct_ used, greatly simplifying parsing the input.
Not making everything dynamic has its wins!

### Day 9: Smoke Basin

Solution: [Python](https://github.com/eddmann/advent-of-code/tree/master/2021/python/src/day09), [C `runtime: 1011 μs`](https://github.com/eddmann/advent-of-code/tree/master/2021/c/day09)

This was the first map-based problem of the calendar.
I opted to use breadth-first search (BFS) for this solution and found that, in the case of the Python solution, being able to use negative indices to access the end of the array was very handy.
For the C version, I used BFS too, but for the visited set, I opted to use a 2D array of booleans instead - this was a trade-off between memory and lookup time.

### Day 10: Syntax Scoring

Solution: [Python](https://github.com/eddmann/advent-of-code/tree/master/2021/python/src/day10), [C `runtime: 436 μs`](https://github.com/eddmann/advent-of-code/tree/master/2021/c/day10)

This problem revolved around picking the right data structure, in this case, a stack.
Although there were some additional extras at the end (sorting and median calculation) to add another level of complexity.
This was very easy to map out and solve within Python, opting to store the score weights within a Dictionary.
Fortunately, in the C implementation, the dynamic array I used had the ability to function as an efficient stack.
I was additionally able to sort this array using the C standard library's [`qsort`](https://en.wikipedia.org/wiki/Qsort) function.
As the dynamic array is internally stored as a regular C array (with some offset metadata), these functions can be used without any additional consideration required.

### Day 11: Dumbo Octopus

Solution: [Python](https://github.com/eddmann/advent-of-code/tree/master/2021/python/src/day11), [C `runtime: 250 μs`](https://github.com/eddmann/advent-of-code/tree/master/2021/c/day11)

This was another grid-based problem, where-by treating the grid as a Dictionary within Python made it easy to iterate over and apply the neighbouring checks.
In the C version, I opted to use a bounded multidimensional array to represent the grid.
In this problem, I also found how elegant it was to parse integer values using character offsets (i.e. `'number as char' - '0'`).

### Day 12: Passage Pathing

Solution: [Python](https://github.com/eddmann/advent-of-code/tree/master/2021/python/src/day12), [C `runtime: 5340 μs`](https://github.com/eddmann/advent-of-code/tree/master/2021/c/day12)

This problem lent itself well to using BFS again, supplying a predicate function to determine if the cave was explorable.
The default value capabilities within Python Dictionaries (i.e. `defaultdict(list)`) are super useful!
For the C version, I used an `id` function to translate the path identifiers into deterministic integers (instead of using a hash function).
With this, I employed a recursive approach to solving the problem at hand, using a boolean flag `small_cave_seen_twice` for switching between the two parts.
I am not a huge fan of this approach; however, it gets the job done.

### Day 13: Transparent Origami

Solution: [Python](https://github.com/eddmann/advent-of-code/tree/master/2021/python/src/day13), [C `runtime: 3667 μs`](https://github.com/eddmann/advent-of-code/tree/master/2021/c/day13)

The Python version again leaned heavily on computed sets and list comprehension.
It also showed how a functional reduction step could be used to model the problem.
In the C version, as _space_ is always getting smaller (due to the folds), we can continue to use the same `paper_t` structure but update the width/height that we are concerned with at the time.

### Day 14: Extended Polymerization

Solution: [Python](https://github.com/eddmann/advent-of-code/tree/master/2021/python/src/day14), [C `runtime: 67 μs`](https://github.com/eddmann/advent-of-code/tree/master/2021/c/day14)

This was a fun dynamic programming problem.
As always, I opted to first go down the naive implementation route for part 1, only to be bitten by that decision in part 2.
Having realised that I do not actually care about creating the _exact_ final string, I was able to break the problem down recursively using memoisation (the `@cache` decorator is great) and the _Counter_ data structure.
For the C version, I opted to use a bottom-up (tabulation) approach instead, storing pairs as indexed array values, using a similar method to how you would handle rows/columns in a single-dimensional array.
Modelling this problem in this way was made easier thanks to a couple of small macro functions I made to handle the index conversion.

### Day 15: Chiton

Solution: [Python](https://github.com/eddmann/advent-of-code/tree/master/2021/python/src/day15), [C `runtime: 16857 μs`](https://github.com/eddmann/advent-of-code/tree/master/2021/c/day15)

This was another grid traversal problem.
I initially used BFS but then opted to add a priority queue and use [Dijkstra's algorithm](https://en.wikipedia.org/wiki/Dijkstra%27s_algorithm) for better performance.
Within the Python version, I found that treating a standard list as a priority queue (using `heapq` methods) felt a little odd; it seemed as though it could have been abstracted into a different data structure entirely.
I also enjoyed working out the formula to calculate the scaled risk levels.
For the C version, I decided to follow a similar path, except this time I was required to build my own heap-based priority queue implementation.
Instead of storing the risk levels as x/y tuples like in the Python version, I opted to store them using a single-dimensional array representation.

### Day 16: Packet Decoder

Solution: [Python](https://github.com/eddmann/advent-of-code/tree/master/2021/python/src/day16), [C `runtime: 102 μs`](https://github.com/eddmann/advent-of-code/tree/master/2021/c/day16)

This proved to be a very wordy problem - but as always, I am amazed at how much thought goes into a problem and how much can be packed into such a small input!
For the Python variant, I opted for a recursive approach, which returned the resulting reduction and pointer to the consumed sub-expression.
In the C version, I created the concept of a `bitstream`, which stored the transformed hexadecimal-to-binary character stream, along with a mutating position index pointer.
This meant that when I called `parse_uint`, it would update the bitstream to the next available position in the stream, as if we were consuming that part of the stream.
I preferred the approach in the C version.
Building up the tree with sub-packet structures allowed me to construct the tree a single time and call either `calc_version_total` or `eval`, depending on the part.
This contrasts with the Python version, which I was a little lazy with and side-carted solving the initial parts' version total.

### Day 17: Trick Shot

Solution: [Python](https://github.com/eddmann/advent-of-code/tree/master/2021/python/src/day17), [C `runtime: 1679 μs`](https://github.com/eddmann/advent-of-code/tree/master/2021/c/day17)

I opted for brute force to solve this problem, finding Python's `product` and `range` combination resulted in very concise code to produce the velocity.
Fortunately, I modelled this solution in a way that would map well to a C equivalent.
The key difference, of course, is the omission of list comprehensions, which means lots of looping!
Having looked through the subreddit after solving this problem, there seems to be a non-brute-force means of solving it using some equations of motion.

### Day 18: Snailfish

Solution: [Python](https://github.com/eddmann/advent-of-code/tree/master/2021/python/src/day18), [C `runtime: 9027 μs`](https://github.com/eddmann/advent-of-code/tree/master/2021/c/day18)

This problem essentially boiled down to a binary tree.
I opted to mix it up with the Python solution and use an object-oriented approach.
This provided a good use case for the _match_ statement with pattern matching to construct each _Number_ recursively.
Along with this, implementing the `__add__` and `__radd__` magic methods allowed me to handle the resulting abstraction as if they were true numbers.
For the C version, I stored the tree in a single-dimensional array, keeping track of the depth of each node.
This made it easy to perform the split and explode operations.
I was also interested in using the `memmove` function to insert and remove numbers from the tree in a performant manner.
I found handling raw memory like this to be so powerful but scary at the same time.

### Day 19: Beacon Scanner

Solution: [Python](https://github.com/eddmann/advent-of-code/tree/master/2021/python/src/day19), [C `runtime: 116330 μs`](https://github.com/eddmann/advent-of-code/tree/master/2021/c/day19)

This was, without question, one of the hardest Advent of Code problems I have encountered!
Fortunately, I had experimented with 3D matrices and matrix transformations whilst working on my [Rubik's Cube solving project](../../2021/2021-07-06-building-a-rubik-cube-solver-using-rust-wasm-threejs-and-react/index.md) mid-last year.
So, I had a feeling to experiment with this when initially reading the problem.
For my Python solution, iteratively mapping successive scanners based on orientation - although naive and slow - eventually produced a result.
I enjoyed storing the orientations as small lambda functions to make it trivial to apply rotations per scanner beacon.
Implementing this problem in C was a whole other ballgame.
I knew my naive approach was not going to cut it, even in a system-level language such as C.
So instead, I resorted to reviewing how some clever people on the Advent of Code [subreddit](https://www.reddit.com/r/adventofcode/comments/rjpf7f/2021_day_19_solutions/) were able to achieve it.
Thanks to some key insights, I was able to use this to construct my own implementation, which heavily relies on linked lists.

### Day 20: Trench Map

Solution: [Python](https://github.com/eddmann/advent-of-code/tree/master/2021/python/src/day20), [C `runtime: 11983 μs`](https://github.com/eddmann/advent-of-code/tree/master/2021/c/day20)

This was yet another 2D matrix problem.
For the Python version, I opted to build the image using a dictionary.
Using a dictionary in this way provides an easy means to navigate through and expand the map going forward.
For the C solution, I decided to use a fixed upper-bound multidimensional array instead, using an accompanying size value to limit the size per enhancement step.

### Day 21: Dirac Dice

Solution: [Python](https://github.com/eddmann/advent-of-code/tree/master/2021/python/src/day21), [C `runtime: 29 μs`](https://github.com/eddmann/advent-of-code/tree/master/2021/c/day21)

This was another fun dynamic programming problem, in which I decided to use memoisation (and the `@cache` decorator) to solve the problem using Python.
For the C solution, another bottom-up tabulation strategy was employed, as this felt simpler than trying to implement function call memoisation in C.
To make the solution performant as well as space-efficient, I based my approach on [ideas](https://www.reddit.com/r/adventofcode/comments/rl6p8y/comment/hpet9io/) discussed on the subreddit.

### Day 22: Reactor Reboot

Solution: [Python](https://github.com/eddmann/advent-of-code/tree/master/2021/python/src/day22), [C `runtime: 50313 μs`](https://github.com/eddmann/advent-of-code/tree/master/2021/c/day22)

Instead of explicitly building up the 3D space and slicing cuboids, I employed a neat negation trick.
To achieve this, I added all intersections to the resulting cuboid listing, along with the cuboid itself if it was _on_.
Intersections with positive regions generated negative ones, and intersections with negative regions generated positive ones.
This cancelled out any existing geometry the new cuboid was intersecting.
This solution mapped well to both Python and C variants and met my performance needs.

### Day 23: Amphipod

Solution: [Python](https://github.com/eddmann/advent-of-code/tree/master/2021/python/src/day23), [C `runtime: 146356 μs`](https://github.com/eddmann/advent-of-code/tree/master/2021/c/day23)

This was another head-scratcher of a day, with many intermediate rule states to map.
For the Python solution, I employed Dijkstra's algorithm, which, although slow (taking over 10 seconds to complete), was very readable.
I found that modelling the next valid states as generators was very concise in Python.
For the C variant, I knew I would need to perform better state pruning to meet the desired runtime constraints.
Again, this led me down an Advent of Code subreddit rabbit hole - in which, along with pruning superfluous moves, I also instead employed the A\* algorithm.
The lower-bound heuristic used calculated the cost required if every pod could move through each other to be placed in their correct room.
For this solution to work, I had to build my own hash table and priority queue tailored to this specific problem.
It took a while to develop, but the resulting speed gains were worth it.

### Day 24: Arithmetic Logic Unit

Solution: [Python](https://github.com/eddmann/advent-of-code/tree/master/2021/python/src/day24), [C `runtime: 82 μs`](https://github.com/eddmann/advent-of-code/tree/master/2021/c/day24)

This problem revolved around the stack data structure.
After spending far too long going through the assembly code, I finally figured out the pattern!
Both Python and C solutions follow the same idea, using a higher-order function to pass in either the maximum or minimum accumulation functions.

### Day 25: Sea Cucumber

Solution: [Python](https://github.com/eddmann/advent-of-code/tree/master/2021/python/src/day25), [C `runtime: 28627 μs`](https://github.com/eddmann/advent-of-code/tree/master/2021/c/day25)

For the final day, I was able to use a dictionary again to model the growing 2D matrix.
For the C version, I used a fixed-size multidimensional array with a high enough size upper bound to complete the computation.
This demonstrates once again how useful Python's list comprehensions are, coupled with functions such as `count` found in the [itertools](https://docs.python.org/3/library/itertools.html) library.
