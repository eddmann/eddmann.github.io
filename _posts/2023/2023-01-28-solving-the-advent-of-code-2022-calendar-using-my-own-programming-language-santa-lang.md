---
layout: post
title: 'Solving the Advent of Code 2022 calendar using my own programming language, santa-lang'
meta: 'This article documents my experience solving the Advent of Code 2022 calendar using my own programming language, santa-lang'
tags: advent-of-code santa-lang
---

December has come and gone, and the dust has settled on completing the Advent of Code 2022 calendar.
As highlighted in my [previous post](https://eddmann.com/posts/designing-santa-lang-a-language-for-solving-advent-of-code-puzzles/), I wanted to complete this year's puzzles using my own programming language, santa-lang, which I have tailored to help aid in solving such problems.
In this article I want to discuss this experience, how the language aided in solution development, and where additions/changes were made to improve it along the way.

<!--more-->

## Where we left off

The design of the language had been formed based on my previous experience in solving [several years worth](https://github.com/eddmann/advent-of-code) of Advent of Code calendars, in multiple different languages
During the development phase I had employed regular checkpoints to re-solve previous calendar puzzles in santa-lang, to validate the path I was taking.
The 2022 calendar would be the first set of unknown puzzles that the language would have faced, more so, it would be the first time using the language to primarily solve these puzzles in.
I was initially wary of not being capable of completing each day in the language, perhaps even having to resort to another one.

Fortunately this was not the case, and the _TDLR_ of this article would be that I was able to successfully implement each puzzle solution using santa-lang as my primary language 🎉.
Throughout the calendar I made a conscious effort to note down interesting aspects of the experience, of which I have since categorised and wish to present below.

## The journey

As an aside, no discussion of the Advent of Code 2022 calendar would be complete without sharing my [day 22 cube](https://www.reddit.com/r/adventofcode/comments/zsct8w/comment/j17pijh/)!

<img src="/uploads/solving-the-advent-of-code-2022-calendar-using-my-own-programming-language-santa-lang/day22-cube.jpg" alt="Day 22 Cube" />

Now that is out of the way, we can begin...

### Running with the runner

Most of this article's discussion will no doubt be centred around the language and standard library.
Upon reviewing my notes I realised that I had not given much thought towards [the runner](https://eddmann.com/posts/designing-santa-lang-a-language-for-solving-advent-of-code-puzzles/#the-aoc-runner) itself 😢.
In hindsight, I think the reason for this was probably the biggest complement I could give, it just worked!
I spent the majority of my time using the CLI runtime, and with the combination of the test runner and in-built means of downloading the puzzle input, I was able to get _up n' problem-solving_ very quickly each day.
The _REPL_ developed over the course of the calendar, from developing each parts solution, to validating both the test and puzzle input was a frictionless experience.
As a consequence I did not need to revise it, which in turn, meant I did not write many notes about it.
It is for this reason that I want to highlight this success first!

### Sometimes you need mutation

One of the design goals for the language was - _No mutation, opting for readability and correctness over out right speed_.
Throughout the course of completing the calendar there arose certain situations where readability would be negatively impacted if I did not employ some form of mutation 😱.
This need was only directed at the ability to re-define `let` bindings, as opposed to provide a means to mutate data-structures.
I did go back and forth on the idea of including such a feature, balancing the purity of the language over its practical nature to help solve puzzles.
I ended up being reassured however, based on how Clojure handles [transient data structures](https://clojure.org/reference/transients).

> If a tree falls in the woods, does it make a sound? If a pure function mutates some local data in order to produce an immutable return value, is that ok?

Mutation as a whole is not a _bad thing_, in-fact it is an incredibly useful tool.
Although this statement is directed at data-structures, the rationale that location and scope play a significant role in its viability is very apt.
Typically, concerns with mutation arise when its use occurs (often implicitly) across a large scope.
As such, if we keep the mutation scope small, we can harness the benefits it gives us, without being hindered by the negatives.

One such example of its use was in solving [day 19](https://github.com/eddmann/advent-of-code/blob/master/2022/santa-lang/aoc2022_day19.santa), whilst employing the [Branch and Bound](https://en.wikipedia.org/wiki/Branch_and_bound) algorithm design paradigm.

```
let collect_max_geodes = |minutes, blueprint| {
  let mut max_geodes = 0;

  let recur = |state| {
    max_geodes = max(max_geodes, state["geodes"]);
    next_robot_states(blueprint, state)
      |> filter(|next_state| estimate_geode_collection(blueprint, next_state) > max_geodes)
      |> each(recur);
  };

  // ..

  max_geodes;
}
```

You can see that the mutable `let` binding is local (co-located) to the pure function in which it resides.
It has a very small/focused scope, which only spans several lines of code and aids in the overall readability of the solution.

Another important consideration I made when deciding to add this feature to the language was to ensure that its intent was explicit.
In contrast to C-like languages of the past, I favoured immutability by default and explicitly (using the `mut` keyword) _'opted in'_ to mutation.
This helps instruct the reader that its use is a _special case_, and different from the conventional immutable behaviour.

Finally, I feel like a saying that comes up in the Python world a lot, _['We are all responsible users'](https://docs.python-guide.org/writing/style/#we-are-all-responsible-users)_, is an compelling point to reflect upon.
A language is a tool, with certain syntax/runtime-level guardrails devised to assist in solving problems; but at the end of the day, it is up to the code author to be responsible with the functionality that is available to them.
Any language, no matter how _strict_ or _pure_, can be abused if the code author does not make responsible choices.

### Recursion over stateful loops

As I had intentionally omitted standard loop constructs (`for`, `while`) from the language (which are inherently mutable), I found myself leaning heavily on recursion to provide the same means to an end.
The calendar had many maze puzzles, in which we were required to find (in varying masqueraded forms) the _shortest path_ between two states; this meant employing the [Breadth-first search](https://en.wikipedia.org/wiki/Breadth-first_search) (BFS) algorithm.
Unlike [Depth-first search](https://en.wikipedia.org/wiki/Depth-first_search) (DFS) which is inherently recursive by nature (taking advantage of call stack properties), BFS _work_ is stored in a FIFO queue.
Below is a snippet of my [day 24](https://github.com/eddmann/advent-of-code/blob/master/2022/santa-lang/aoc2022_day24.santa) solution which documents the key characteristics of the BFS algorithm, and how recursion is used as a looping construct.

```
let recur = |queue, seen| {
  let [time, position] = first(queue);

  if position == end {
    return time;
  }

  let next_positions = [[0, 1], [0, -1], [-1, 0], [1, 0], [0, 0]]
    // ..
    |> map(|bounded_position| [time + 1, bounded_position])
    |> filter(|next_position| seen `excludes?` next_position);

  recur(
    rest(queue) + next_positions,
    seen + next_positions
  );
};

recur([[initial_time, start]], {});
```

**Note:** I have been lazy within this implementation and excluded the base-case that the queue is empty; assuming that the algorithm will eventually find the end position before exhausting the queue.

As you can see, this follows what you would typically see in a conventional looping implementation.
We dequeue an item, check if it matches our desired end state, find the next unseen items to be visited and repeat.

When developing the initial solution which employed this algorithm ([day 12](https://github.com/eddmann/advent-of-code/blob/master/2022/santa-lang/aoc2022_day12.santa)) I found upon running it on a sufficiently large input set, that I was faced with a host language (JavaScript) `Maximum call stack size exceeded` exception.
This introduced me to the world of _tail-call optimisation_ - which can be defined as:

> Tail-call optimization is where you are able to avoid allocating a new stack frame for a function because the calling function will simply return the value that it gets from the called function.
> The most common use is tail-recursion, where a recursive function written to take advantage of tail-call optimization can use constant stack space.

Looking at the BFS implementation above you can see this follows the pattern described, in which we are doing no other work within the current stack frame before returning the recursive invocation.
As such, we can optimally reuse the same stack frame for the next recursive call, without incurring any performance penalty.
It was here that I put aside my calendar solution,and headed to the language evaluator to implement _tail-call optimisation_.
This was a lot of fun to do, and it highlighted how the evaluator itself could be improved to help significantly speed up the code written in the subject language without any modification.

### Functions, functions, functions

When reviewing my notes, one topic I knew I could not miss was touching upon the desired goal of having _cheap functions_.
Opting for a similar syntax to how Rust defines functions was an ideal choice.
The syntax itself is lightweight and readable, which in-turn makes it _cheap_ to use.
An example of this would be defining the identify function like so `|a| a`.

I did not know how much traction infix function invocation would would get throughout the course of the calendar.
Turns out I used it a lot!
Although you have the option to invoke functions like `vec_add(a, b)`, some expressions read better when defined in infix form like `` a `vec_add` b ``.
The ability to do this with user-land/standard library functions and not only special operators was especially powerful.

Placeholder syntax is something I had been introduced to by-way of Scala several years back and had greatly enjoyed.
This functionality gave the ability to succinctly express the _open_ argument positions, for example combined with infix function invocation - `includes?(collection)` vs `` collection `includes?` _ ``, or `` _ `includes?` 2 ``.
Additionally, I was able to exercise use of placeholder arguments within conventional function calls like `get(_, collection)`, when the intent read better.
This syntax is very concise and feels more like a custom DSL for the given puzzle problem as opposed to a function definition.

With the formation of these _cheap functions_, I was subsequently able to compose `>>` and thread `|>` them together to complete the puzzle problem at hand.
Again, I was unsure how much usage function composition would get as the puzzles were very specific, however, I was able to treat much of the standard library as building blocks to _cheaply_ compose together higher-level functionality.
This can be seen many times throughout the course of the calendar whilst parsing the puzzle input.

```
// aoc2022_day01.santa
let parse_inventories = split("\n\n") >> map(ints >> sum);

// aoc2022_day20.santa
let parse_numbers = |decryption_key| {
  ints >> map(_ * decryption_key) >> zip(0.., _);
}
```

Finally, function threading was something introduced to me by Clojure whilst solving the [2020 calendar](https://github.com/eddmann/advent-of-code/tree/master/2020/clojure), and I relied heavily on it in this calendar too.
It is pure syntactic sugar over nested function invocations but the conciseness and readable merits it adds are undeniable.
I could show many, many examples of its use, but one place where it played a key role was in solving [day 24](https://github.com/eddmann/advent-of-code/blob/master/2022/santa-lang/aoc2022_day24.santa).

```
// ..
let trip = travel(blizzards, boundary);
trip(start, end, 0) |> trip(end, start) |> trip(start, end);
```

Threading combined with partial application provided a crisp means in which to define the problems intent, _traveling_ from the start to the end, back to the start and then finally to the end again.

### Don't sleep on Lazy sequences

Lazy sequences allow you express a class of problems very succinctly.
I had included the concept of infinite lazy ranges (`1..`) in the initial language design, but a pattern soon emerged where-by I wished to perform some form of operation multiple times (dependent on the previous output) and compute the _nth-term_.
It was for this that I decided to add the `iterate` function to the language, inspired by Clojure's [implementation](https://clojuredocs.org/clojure.core/iterate) of the same name.
Defining a [referentially transparent](https://en.wikipedia.org/wiki/Referential_transparency) function (input and output) for handling a single operation, we can supply this to _iterate_ and expand it to however many _iterations_ we wish to achieve, either until a certain _nth-term_ (`get`) or term predicate holds true (`find`).
Its use is documented widely throughout the calendar, none more so than in [day 9](https://github.com/eddmann/advent-of-code/blob/master/2022/santa-lang/aoc2022_day09.santa).
Here we were required to perform a single `knot_tail` operation in part 1, and then expand upon this to find the _9th term_ in part 2.

```
part_one: {
  parse_motions(input)
    |> knot_head
    |> knot_tail
    |> visits;
}

part_two: {
  parse_motions(input)
    |> knot_head
    |> iterate(knot_tail)
    |> get(9)
    |> visits;
}
```

In [day 14](https://github.com/eddmann/advent-of-code/blob/master/2022/santa-lang/aoc2022_day14.santa) we were asked to apply a _pour_ operation until some predicate held true based on the current term (in this case `sand`).

```
part_one: {
  // ..
  iterate(pour(top, rock + void), {})
    |> find(|sand| lowest_height(sand) == lowest_height(rock))
}

part_two: {
  // ..
  iterate(pour(top, rock + floor), {})
    |> find(_ `includes?` top)
}
```

Another form of lazy sequence that was added during the month was `cycle`.
There were several problems which required _cycling_ through a defined finite list.
In a typical stateful implementation you would pass along the list and current index, which is subsequently _module_ to cycle back through the list upon exhaustion.
Employing `cycle` however abstracts away these requirements, where-by we can use conventional `first`/`rest` collection primitives to consume the list as we desire.
Below is one such use-case in [day 17](https://github.com/eddmann/advent-of-code/blob/master/2022/santa-lang/aoc2022_day17.santa), where we were required to perform a Tetris-style simulation based on rock/jet patterns.

```
let parse_jet_pattern = split("") >> map(|d| if d == "<" { [0, -1] } else { [0, 1] }) >> cycle;
```

### Removing boilerplate with Sequence transformations

One aspect of the initial language design phase was the importance of `map`, `filter`, `fold` and `reduce` to transform sequences, due to the omission of typical stateful looping constructs.
I rely heavily on these primitives in daily development, and how they abstract away boilerplate code and the intricacies of looping and branching into commonly agreed/understood behaviours.
The ability to be able to perform such transformation over both finite and infinite sequences was very useful.

Whilst working my way through the calendar I noticed several transformation patterns that later were able to be distilled down into their own constructs.
The first was the concept of _mapping_ and then immediately _filtering_ over the transformed collection.
Instead of having to chain these two operation together I took inspiration from Rust and added a `filter_map` function, which includes _truthy_ mapped values in the resulting sequence.
This again can be seen in my [day 17](https://github.com/eddmann/advent-of-code/blob/master/2022/santa-lang/aoc2022_day17.santa) solution, which required us to find a state cycle within the Tetris-style simulation.

```
let cycle_state = iterate(drop_rock, [jets, rocks, {}])
  |> filter_map(cycle_detector())
  |> first;
```

In a similar manner, I noticed that I used _map_ and then immediately _find_ in several solution, this too was more succinctly written as `find_map` (again found in Rust) which performed the combination of the two.
Use of this can be seen in [day 15](https://github.com/eddmann/advent-of-code/blob/master/2022/santa-lang/aoc2022_day15.santa), when attempting to find the first mapped value which 'uncovers' x.

```
parse_row(input)..
  |> find_map(|y| {
    if let x = sensor_ranges(reports, y) |> uncovered_x {
      [x, y]
    }
  })
  |> tuning_frequency;
```

Finally, I noticed another pattern where-by I was _filtering_ and then immediately returning the _size_ of the given collection.
Taking inspiration from Ruby, I added a high-level `count` transformation which based on a predicate (similar to how `filter` works) would tally up a finite sequences items that matched that predicate.
This can be seen in both parts solutions to [day 4](https://github.com/eddmann/advent-of-code/blob/master/2022/santa-lang/aoc2022_day04.santa).

```
part_two: {
  parse_assignments(input)
    |> count(|[[x1, y1], [x2, y2]]| max(x1, x2) <= min(y1, y2));
}
```

### Ranges are very expressive

I had used ranges in both Rust and Python before, the former having the syntax that inspired this languages design choice (`1..10`).
In the initial release I had tried to simplify the specification by only including a single range `..`, which was inclusive of both the lower and upper-bounds.
Throughout the calendar however, I soon released that having to decrement some values, especially when zero indexed, was negatively impacting readability.
As such, I decided to additionally add `..=` which would replace my current implementation of `..`.
The `..` would now signify lower inclusive, upper exclusive - which is in keeping with how other language define the behaviour.
This was an initial design decision that back fired on me, and required amendment when spending more time within the language.
One puzzle which highlighted how useful range sequences were was in [day 15](https://github.com/eddmann/advent-of-code/blob/master/2022/santa-lang/aoc2022_day15.santa), when we had to deduce all possible 'x' positions.

```
let xs = sensor_ranges(reports, y)
  |> map(|[start, end]| start..=end)
  |> union;
```

Use of ranges were applied in many areas of the calendar, another common example was when producing indexed sequences.
This behaviour is found in other languages (like `enumerate` in Python), but being able to provide such functionality on-top of standard library constructs was empowering.
Furthermore, the resulting index/item tuple lists could be passed to the `hash` function to produce lookup tables.

```
// aoc2022_day03.santa
let priorities = zip("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ", 1..) |> hash;

// aoc2022_day12.santa
let elevation = zip("SabcdefghijklmnopqrstuvwxyzE", 0..) |> hash;
```

Another use of ranges was within pattern matching.
For [day 22](https://github.com/eddmann/advent-of-code/blob/master/2022/santa-lang/aoc2022_day22.santa)'s infamous cube puzzle I initially used _if guards_ to handle point ranges, but again felt that readability of the end solution was negatively impacted.
Instead, I decided to implement the ability to express ranges within pattern match statements, similar to how Rust does.
This results in a far more concise solution, as documented with a snippet of day 22 below.

```
let step_3d = |facing, [y, x]| {
  match [facing, [y, x]] {
    ["N", [0, 50..100]]  { ["E", [150 + (x - 50), 0]] }
    ["N", [0, 100..150]] { ["N", [199, x - 100]] }
    ["N", [100, 0..50]]  { ["E", [50 + x, 50]] }
    ["N", _]             { ["N", [y - 1, x]] }
    // ..
  }
}
```

### Memoization as a language keyword?!

Every AoC calendar you can expect to see one problem which lends itself to [Dynamic programming](https://en.wikipedia.org/wiki/Dynamic_programming).
These can be summarised as breaking up a larger problem into smaller sub-problems, which in-turn can be used to help solve the original larger problem.
This year was no exception, and as such I was required to invest some time in adding the ability to memoize functions within santa-lang.
For this I added a function called `memoize`, which is a higher-order function that caches results (based on argument values) of the pure function that is supplied to it.
The inclusion of this function is not that significant, but what I really wish to highlight is how trailing Lambda syntax provides for such a rich DSL, making the function invocation feel like a language construct.
This can be found in an extract of the [day 16](https://github.com/eddmann/advent-of-code/blob/master/2022/santa-lang/aoc2022_day16.santa) puzzle.

```
let recur = memoize |valve, time, open_valves| {
  // ..
}
```

Although this simply means `memoize(|..| ..)`, the omission of the call parenthesis is very powerful.
It also lends itself well to _decorate_ functions, in a similar manor to how Python provides such functionality.

## Conclusion

Having spent some time now reflecting on my experience solving the 2022 calendar in santa-lang, I am very pleased with how many of the fundamental decisions made up front paid off.
Aside from the small additions that have been discussed through this article, much of the language and its underlying philosophy have held up.
The one possible argument to this claim would be the inclusion of mutable `let` bindings, but going back and forth on this decision I feel that it has a deserved place in the language.

### Possible improvements

Despite being happy with the current state of the language, there are several areas in which I feel time could be spent to improve it more so.
One category of puzzle problem that we were exposed to in many ways this year was maze traversal.
Throughout the course of the month I toyed with the idea of enriching the language with concepts and types which would aid in such puzzle solving.
These were centred around the possible addition of a `Point` type, and associated helper functions (i.e. `neighbours`, `bounded_neighbours`).
However, I could not settle on what I would deem to be the _best fit_ for the language, as it would ideally cater for both 2D and 3D planes.
As such, I felt it best to omit such a concept for the time being and possibly revisit it in several months.
This would give me time to explore a more generalised means in solving such problems, suitable for the many different AoC maze puzzles that are present.

Another area which I feel could be improved upon is parsing the input.
Although greatly simplified with the addition of `regex_*`, helper functions (such as `ints`) and function composition I feel a more radical change could be explored.
It would be interesting to experiment with embedding a [parser combinator](https://en.wikipedia.org/wiki/Parser_combinator) library into the runner, which would provide a clear means of defining how to transform the input into a parsed form used for computation.
Having, seen examples in other languages such as Rust using libraries such as [nom](https://docs.rs/nom/latest/nom/), I feel there could be place for expressing such parsing rules in an Advent of Code DSL.

### So what's next?

Something I did not really touch upon throughout this article was performance.
This was intentionally, as it was not a fundamental goal of the language, opting for readability and correctness.
As such, not much work was done (other than tail-recursive calls, which was more of a necessity at the time) within language evaluation to improve this.
I did [benchmark](https://github.com/eddmann/advent-of-code/blob/master/2022/santa-lang/benchmark.txt) each solution to see how the language/runtime implementation faired, and in some solutions the performance was in the 5-minute range 😬.
I briefly explored further data-structure mutation, similar to Clojure ([`assoc!`](https://clojuredocs.org/clojure.core/assoc!), `update!`), but this did not feel like the right path to take.
In some cases this maybe due to suboptimal solutions, but I was sure there was room within the runtime to improve upon this.
To validate this I reimplemented some of these solutions in Python and JavaScript, reflecting as closely as I could to the santa-lang implementation.
Within the CPython and Node v8 runtimes these solution were orders of magnitude faster! 😮

This leads us on to the next chapter in the project...
I now wish to take the language specification and defined standard library functions, and reimplement them in a more performant, lower-level language.
For this I have chosen Rust, as I feel it is a great fit for this purpose.
I also enjoyed using the language to build a [Rubik Cube Solver](https://eddmann.com/posts/building-a-rubik-cube-solver-using-rust-wasm-threejs-and-react/) several years back.

Along the way I wish to rethink the underlying abstractions I used within the TypeScript implementation, as the current implementation feels more of a proof-of-concept for the language as opposed to a runtime I wish to maintain going forward.
I hope through this process to improve the benchmark performance of these solutions, without having to change anything about the actual solutions themselves, only the runtimes and associated internals.
