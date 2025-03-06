---
layout: post
title: 'Solving the Advent of Code 2023 calendar in Kotlin and Swift'
meta: 'This post documents my experience solving the Advent of Code 2023 calendar using both Kotlin and Swift.'
tags: advent-of-code swift kotlin
---

Another year, another [Advent of Code](https://adventofcode.com/2023), another excuse to explore new languages.
After my recent exploration into [PWAs](https://eddmann.com/posts/building-a-secret-santa-draw-pwa-in-react-and-typescript/) this past year, I wanted a reason to explore Kotlin and Swift, two languages equipped for native mobile (Android and iOS) development.
Before delving into the mobile domain, I wanted to see what each language had to offer.
In this post, I will document my experience completing the Advent of Code 2023 calendar in both [Kotlin](https://github.com/eddmann/advent-of-code/tree/master/2023/kotlin) and [Swift](https://github.com/eddmann/advent-of-code/tree/master/2023/swift).

<!--more-->

<img src="/uploads/solving-the-advent-of-code-2023-calendar-in-kotlin-and-swift/vs.png" alt="Kotlin vs Swift" />

## First Impressions

From the outset, I found that both languages were very comparable in syntax and style - both modelling problems using similar paradigms: OO with a blend of functional primitives.
Both also follow suit in that the language developer also provides the _de facto_ IDE in which to work; for Kotlin (created by JetBrains), it is [IntelliJ IDEA](https://www.jetbrains.com/idea/), and for Swift (created by Apple), it is [Xcode](https://developer.apple.com/xcode/).
Throughout the month, I found myself much more productive within IntelliJ than Xcode.
I should caveat that I have been using JetBrains' suite of IDEs (PHPStorm in particular) for many years.
However, I found that Xcode would randomly crash on me (not what you want from an IDE), even in my limited time using it.
I remember watching a [video series](https://frontendmasters.com/courses/swift-ios/) on iOS development last year, which mentioned that this was deemed to be _expected behaviour_ when working in Xcode 😬.

### Starter Templates

Both language developers have (rather handily) published Advent of Code starter templates ([Kotlin](https://github.com/kotlin-hands-on/advent-of-code-kotlin-template), [Swift](https://github.com/apple/swift-aoc-starter-example)), which provide a convenient means of getting started tackling each daily problem.
It is good to see language developers investing time in this, as Advent of Code is a great tool to help advertise a language - it is the time developers typically get to explore different languages (me being a case in point).
I found the REPL provided by the Kotlin starter template to be better.
Having the ability to run each day from within the IDE (using the gutter _play_ button) was very useful, and it felt as though, during problem-solving, it was quicker to compile (perhaps due to incremental compilation?).
I had initially looked at using [Swift Playgrounds](https://developer.apple.com/swift-playgrounds/) to iterate on the solutions within Xcode but found that it was very unperformant due to the way it has to instrument the code 😔.
After some research, I found there were some _tricks_ to make it more performant, but I did not want to rewrite the code to appease the IDE.

## Today I learned...

Each day, I wrote down my learnings and insights into each language as I went about solving the problems.
Below, I have documented these findings, paying close attention to the use of the language itself over the actual problems they were trying to solve.

### Day 1: Trebuchet?!

From the outset, I decided to add extension methods within both languages to help parse the input.
This included `lines`, `ints`, and `longs` (in the case of Kotlin).
Having to explicitly specify longs (64-bit values) within Kotlin felt like it was one overflow away from being a problem.
This must be due to being hosted on the JVM.

In addition to this, I also found that tuple declaration (`Pair`) within Kotlin seemed a little verbose, and the subsequent infix `to` syntax was odd.
I understand that this is most likely due to not wanting to add additional syntax to the language.
However, Swift tuples are much more readable.

### Day 2: Cube Conundrum

I found that Kotlin had a far richer standard library, which, when solving problems such as Advent of Code, can come in very handy!
It was also interesting clicking through on a given method and seeing that the supporting code was all readable Kotlin.
It was cool to see how the language had bootstrapped itself.
For example, there was no built-in `sum` method within Swift, something which you are required to include using an [extension method](https://github.com/eddmann/advent-of-code/blob/master/2023/swift/AdventOfCode2023/Sources/Utils.swift).

### Day 3: Gear Ratios

I found that structures (in Swift) and [data classes](https://kotlinlang.org/docs/data-classes.html) (within Kotlin) are a very concise means of creating data objects.
Kotlin additionally provides capabilities to compare and copy instances of such classes, which removes a lot of boilerplate.

### Day 4: Scratchcards

I had fun creating an infix operator within Kotlin and Swift to calculate the power of a given number, opting to use the same `**` operator that Python does.
I found that it was incredibly cheap to add such powerful capabilities.
However, it did make me start to worry about how easy it could be to abuse (_cough_ Scala _cough_).

### Day 5: If You Give A Seed A Fertilizer

This day provided me with a perfect excuse to explore both languages' concurrency capabilities.
They both follow similar asynchronous execution models (`async`, `await`), which provide an ideal level of abstraction.
Within part two, there was an _intelligent_ way to solve the problem and a brute-force means.
Splitting up the required work led to a great use case for solving the problem in parallel.

Swift has come on leaps and bounds from the time I remember having to use [Grand Central Dispatch](https://en.wikipedia.org/wiki/Grand_Central_Dispatch).
Having explored Kotlin's concurrency model first and finding Java's `parallelStream`, I decided to implement a similar abstraction within Swift (`parallelMap`) using a generic _Sequence_ extension method.
It was very cool to see all my machine's cores being utilised with very little code.

### Day 6: Wait For It

Something that I knew I wanted to include in _santa-lang_ (borrowed from Kotlin and Swift) was trailing Lambda expression/Closures syntax.
I used this syntax heavily throughout the month, and building function APIs that took advantage of this syntax provides for a very readable DSL.

In addition to this, explicitly having to define Swift's arguments during invocation (unless explicitly declaring not to) was initially odd to me.
However, the parameter names being part of the method/function signature brought with it increased expressiveness in the code.

### Day 7: Camel Cards

This day allowed me to use Kotlin's and Swift's advanced pattern-matching capabilities within `switch` and `when` expressions, respectively.
I was able to pattern match on lists, including values found within the data structure itself.
On top of this, I was also able to abstract out the concept of a `Hand` into a type that could encapsulate how it was compared in both languages.
This led to a very concise solution whereby the input was passed into `Hand`s and then sorted before performing several collection operations on the output.

### Day 8: Haunted Wasteland

I found that the arguments of a Lambda expression/Closure appearing after the curly brace grew on me.
I was initially opposed to this when designing _santa-lang_, but I can see how it aids in parsing the syntax whilst maintaining readability.

### Day 9: Mirage Maintenance

As explained before, Kotlin has a very rich standard library and provides the ability to generate an _infinite_ sequence.
Along with this, it includes functions (e.g. `zipWithNext` and `takeIf`) that feel like they have been added just for Advent of Code?!
This day's Kotlin solution was by far my favourite solution for the entire calendar.

### Day 10: Pipe Maze

I built up the solution using a composition of several smaller functions.
I was able to use the `let` function within Kotlin to achieve the desired composition that I had become accustomed to within _santa-lang_.
However, Swift did not provide such functionality, but never fear - this was another good excuse to implement another operator (`>>>`).

### Day 11: Cosmic Expansion

This day highlighted more of Kotlin's extensive standard library, including `mapIndexedNotNull`, `mapNotNull`, `all`, and `count`.

### Day 12: Hot Springs

I found that Kotlin had better support for treating composed data structures as values.
For example, I was able to make a `Pair<String, List<Int>>` a _hashable_ map key, whereas in Swift, I had to implement the `Hashable` protocol, which was a pain.

I was also a big fan of the `if let` syntax within Swift and felt this would be a welcome addition to Kotlin.
Combined with `Optional` typing constructs, this provided an easy means of unwrapping values with scoped variables.

### Day 13: Point of Incidence

I found that number ranges are very expressive.
I liked how Kotlin provided `downTo` to declare a decreasing range.
This also provided an opportune place to experiment with Kotlin's syntax support for omitting the function invocation from the call (i.e. `10.downTo(1)` being equivalent to `10 downTo 1`).

### Day 14: Parabolic Reflector Dish

Type aliases are awesome!
They allow you to cheaply declare data types using the language of the problem domain.
For example, I was able to define a generic `Matrix<T>` (`List<List<T>>`) type and compose a `Dish` (`Matrix<Char>`) type in this day's solution.

### Day 15: Lens Library

I found that Kotlin provides better overall immutable data structure support.
I was initially impressed with Swift's use of `var`/`let` declarations to dictate whether the data structure itself was immutable or not.
However, I fell into a problem regarding nested mutable data structure definitions.
The means to overcome this problem was rather ugly.

### Day 16: The Floor Will Be Lava

Apple provides a [Collections](https://github.com/apple/swift-collections) library, which includes many useful data structures that come in handy when solving Advent of Code problems.
One such collection was a double-ended queue (Deque), which I was able to make use of on this day.

### Day 17: Clumsy Crucible

It was fun being able to use Java's [Priority Queue](https://docs.oracle.com/javase/8/docs/api/java/util/PriorityQueue.html) implementation within Kotlin.
One of the advantages of being hosted on the JVM is that you can use libraries that are already available.
The syntax for interacting with these libraries is also very clean.
For example, you can provide a Kotlin lambda expression for the comparator.
Sadly, Swift does not provide such a data structure, so I had to go about building a heap-backed [Priority Queue](https://github.com/eddmann/advent-of-code/blob/master/2023/swift/AdventOfCode2023/Sources/PriorityQueue.swift), which was fun.

### Day 18: Lavaduct Lagoon

I originally had written down how I wished that Swift had `switch`/`if` expression support, similar to Kotlin.
However, upon writing this post, I have seen that Swift 5.9 has [support](https://github.com/apple/swift-evolution/blob/main/proposals/0380-if-switch-expressions.md) for it, so I just need to upgrade from 5.8!

### Day 19: Aplenty

I had fun building out an enumerated `Workflow` type and being able to destructure the type using a `switch` statement in Swift.
There was also more internal debate about Kotlin's standard library - Kotlin's `mapIndexed` vs Swift's `enumerated().map()`.
The purist in me likes the latter.
However, the developer who is already akin to the language and just wants to solve the problem likes the ease of the former. 🤔

### Day 20: Pulse Propagation

I cannot believe it took me until day 20 to find `buildMap` within Kotlin.
This provides the ability to construct a `Map` in a mutable/imperative manner, with the resulting value being returned to the caller as an immutable data structure.
I am a big fan of this explicit mutation, all thanks to implicit lambda contexts for providing access to the data structure methods.

### Day 21: Step Counter

Now that I had found `buildMap`, it was time to use `buildSet` within Kotlin as well!

### Day 22: Sand Slabs

The ability to add extension methods to existing data types plays a big role in both languages.
Although I refrained from using them too frequently throughout the calendar (excluding utility methods), there were some days when I felt they aided in expressing the solution.
One such example of this was in today's `Set<T>.canDrop` definition.

### Day 23: A Long Walk

Some syntactic sugar that Kotlin could adopt from Swift would be the ability to omit verbose enumeration definitions.
The compiler is aware of the type that is required.
As such, omitting the enumerated class and only providing the value aids readability - for example, `.NORTH` instead of `Point.NORTH`.

### Day 24: Never Tell Me The Odds

Part two was a tough maths problem, and I sadly had to reach out to the subreddit for help.
It did, however, provide me with a reason to explore interacting with third-party libraries within both languages by running the [Z3 problem solver](https://github.com/Z3Prover/z3).
There are official Z3 Java bindings, which, thanks to Kotlin's interop, I was able to use seamlessly.
Fortunately, within Swift, someone had worked on building a [wrapper](https://github.com/LuizZak/swift-z3) that exposed a great Swift interface for this C library.

### Day 25: Snowverload

Today was the day I attempted to explore implementing a generic solution to using a tuple as a hash value within Swift - so worth it on the last day...
Regarding the Kotlin solution, along with implementing Karger's algorithm, I decided to try solving it using a Graphviz visualisation, which I thought would make for a cool diagram to include in this article.

<img src="/uploads/solving-the-advent-of-code-2023-calendar-in-kotlin-and-swift/day25.png" alt="Day 25 Graphviz Solution" style="max-width:280px;margin:0 auto;" />

## santa-lang DSL in Kotlin

As an additional exploration, I wished to look into Kotlin's [type-safe builders](https://kotlinlang.org/docs/type-safe-builders.html), which provide you with a means to implement your own DSL on top of the language.
I felt that it could be possible to implement the [day solution structure](https://eddmann.com/santa-lang/runner/) I had designed for _santa-lang_ within Kotlin itself.

```
fun main() = solution {
    fun calibrate(values: List<String>) = values.sumOf { value ->
        val digits = value.replace(Regex("\\D"), "")
        "${digits.first()}${digits.last()}".toInt()
    }

    input {
        readInput("Day01")
    }

    partOne {
        calibrate(input.lines())
    }

    partTwo {
        val translations = mapOf(
            "one" to "o1e",
            "two" to "t2o",
            "three" to "t3e",
            "four" to "4",
            "five" to "5e",
            "six" to "6",
            "seven" to "7n",
            "eight" to "e8t",
            "nine" to "n9e",
        )

        val values = input.lines().map { value ->
            translations.entries.fold(value) { acc, (from, to) ->
                acc.replace(from, to)
            }
        }

        calibrate(values)
    }

    test {
        input { "..." }
        partOne { 142 }
    }

    test {
        input { "..." }
        partTwo { 281 }
    }
}
```

It was amazing to see what can be achieved with the language's support of lambda expression contexts.
Overall, the experience was very easy.
However, I did find [DSL markers](https://kotlinlang.org/api/latest/jvm/stdlib/kotlin/-dsl-marker/) a little confusing to get my head around.
Similar to infix operators and extension methods, this is another language feature that provides great power.
A part of me again fears how developers could overuse or exploit it (i.e. not everything needs its own DSL!).

<img src="/uploads/solving-the-advent-of-code-2023-calendar-in-kotlin-and-swift/santa-lang-dsl.png" alt="santa-lang DSL in Kotlin" />

## Conclusion

There were some very interesting days in this year's calendar, along with some very complex maths-related problems that I am happy to see the back of.
I really enjoyed working in both Kotlin and Swift to solve these puzzles, and, as per my initial thoughts, I was able to model the problems in a similar manner most of the time.
Reflecting on the experience, I feel as though Kotlin (surprisingly to me) is my preferred language going forward.
Throughout the month, I have had the opportunity to explore almost all of the touted features in both languages, and at each hurdle, Kotlin tips Swift.
Going forward, I hope to expand upon this and delve into building native mobile applications using both languages.
Perhaps that may sway things Swift's way?
