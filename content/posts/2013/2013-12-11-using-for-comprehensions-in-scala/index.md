---
layout: post
title: 'Using For-Comprehensions in Scala'
meta: 'Discover how to utilise for-comprehensions in Scala to write cleaner, more efficient code with functional programming techniques, complete with examples and practical applications.'
tags: ['scala', 'functional-programming']
---

Scala can be a very deceptive language, as type inference is a good example of this.
Another less understood example that you will soon be introduced to upon closer exploration of the language is the 'for-comprehension'.
The first point I wish to highlight is that in Scala everything is an expression which returns a value, even if this be Unit (which is equivalent to nothing).
This is a fundamental design principle of Scala which allows for productive use of its functional nature.
In an imperative manner, for example, we have become very accustomed to declaring and assigning a default value, only to reassign it with another if a condition is met on the next line.
Due to the expressive nature of the language, this can instead be condensed into one line, immutably and as a result is less prone to error.

<!--more-->

## Simple Expressions

Below are a couple of simple for-comprehension examples which use ranges, and in the case of the second one, a condition to filter the result.
The resulting value is a [Vector](http://www.scala-lang.org/api/current/index.html#scala.collection.immutable.Vector) which is the default implementation of an immutable indexed sequence in Scala - chosen as it has a good balance between selection and update speed.

```scala
for (i <- 10 until (0, -2))
    yield i

// Vector(10, 8, 6, 4, 2)

for (i <- 1 to 10 if i % 2 == 0)
    yield i

// Vector(2, 4, 6, 8, 10)
```

At a birds-eye view, for-comprehensions look and react like their imperative for-each counterparts, however, they can do so much more.
If you have had any experience with Python comprehensions, you will be pleasantly surprised at their similarities.
Not only can you iterate over a single collection, but you can also iterate over collections within collections.
You can do this whilst also including filters and, subsequently, like the 'if-expression' example, yield (return) new immutable collections.

```scala
for (i <- 1 to 10; j <- 1 until i)
    yield (i, j)

(1 to 10).flatMap(
    x => (1 until x).map(
        y => (x, y)
    )
)

// Vector((2,1), (3,1), (3,2), ...)
```

What blew my mind when I was first explained this in the [Functional Programming Principles in Scala](http://www.coursera.org/course/progfun) course was that all this added functionality simply reduces down into familiar higher-order 'map', 'flatMap' and 'withFilter' chained function calls.
The two above examples both evaluate to the same result, and in fact the first one is rewritten internally by the compiler into the second one (try 'scala -Xprint:typer $filename').
So in essence, it simply is syntactic sugar over already tried and tested functional concepts.
In the case of an expression that does not yield a meaningful result (Unit), the compiler will instead rewrite this to use a 'foreach' method call.

I should backtrack a little and just recap on what a higher-order function actually is.
Simply put, they are functions that accept another function as a parameter or return a function as their value.

## A Contrived Example

I will now demonstrate these comprehensions in a more defined example.
What better time to discuss basketball?
Below I am creating a case class (which for this purpose saves me having to define getters and setters) for an individual player, and then creating the starting line-up for the Heat.

```scala
case class Player(name: String, position: String)

val heat = List(
    Player("Mario Chamlers", "PG"),
    Player("Dwayne Wade", "SG"),
    Player("LeBron Jame", "SF"),
    Player("Udonis Haslem", "PF"),
    Player("Chris Bosh", "C")
)
```

With the line-up now ready, I am going to filter the players into their respective positions.
As you can see below, I have purposely used different means of producing the same result, with regard to the centre only returning the first item.
The two last examples use the discussed 'withFilter' method for the first time.
When a filter is added, instead of running the familiar 'filter' method over all items at that time, a view (projection) is generated which returns a type-compatible wrapper around the collection.
The wrapper allows Scala to delay evaluation of the condition until the last moment (lazy evaluation).
This makes it a feasible way of chaining multiple filters together without the fear of redundant iteration steps in-between.

```scala
val guards =
    for (player <- heat if player.position endsWith "G")
        yield player.name

val forwards = heat
    .withFilter(_.position endsWith "F")
    .map(_.name)

val centre = heat
    .withFilter(player => player.position == "C")
    .map(player => player.name)
    .head
```

Now that we know the team, it is time to generate some game statistics to work with.
Below I am using a for-comprehension to create an empty score-sheet (player name and score tuples), which I then call 'map' on to return random point totals for three different games.
All three examples highlight different ways to use a tuple in a map context and then return the game statistics.
To tally up the results for all the games, we concatenate the collections together and then use the 'groupBy' method (similar in-kind to SQL) on the player's name.
From this step, we map these names to the total summation of the player's game scores.

```scala
val scoreSheet = for (Player(name, _) <- heat) yield (name, 0)

def points = util.Random.nextInt(30)

val vsThunder = scoreSheet map { case (p, _) => (p, points) }

val vsCeltics = scoreSheet map { s => (s._1, points) }

val vsLakers = scoreSheet map { sheet => val (p, _) = sheet; (p, points) }

val totalScores = (vsThunder ++ vsCeltics ++ vsLakers)
    .groupBy(_._1)
    .mapValues(_.map(_._2).sum)

// Map(Mario Chamlers -> 38, Udonis Haslem -> 32, LeBron Jame -> 72, Chris Bosh -> 52, Dwayne Wade -> 44)
```

Finally, I wish to display the point totals in an easy-to-read format.
Returned from our total scores computation is a [Map](http://www.scala-lang.org/api/current/index.html#scala.collection.immutable.Map) which I would now like to be sorted by the total score.
As a basic Map does not have a total order, we must convert it into a list and then, once successfully sorted, clean up the output to display neatly.

```scala
totalScores
    .toList
    .sortBy(_._2) // sort by ASC score
    .map { case (p, s) => p + " [" + s + "]" }
    .mkString("\n")

// Udonis Haslem [32]
// Mario Chamlers [38]
// Dwayne Wade [44]
// Chris Bosh [52]
// LeBron Jame [72]
```

## Resources

- [What is in a Scala For Comprehension?](http://tataryn.net/2011/10/whats-in-a-scala-for-comprehension/)
- [Learning Scala? Learn the Fundamentals First](http://tataryn.net/2011/10/learning-scala-learn-the-fundamentals-first/)
- [Matching in for-comprehensions](http://daily-scala.blogspot.co.uk/2010/01/matching-in-for-comprehensions.html)
