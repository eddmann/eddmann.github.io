---
layout: post
title: 'Building a Rubik Cube Solver using Rust/WASM and Three.js/React'
meta: 'This explores the process of building a Rubik Cube Solver using Rust/WASM and Three.js/React'
tags: rubik-cube typescript rust react threejs
---

After building the [Pocket Cube Solver](https://eddmann.com/posts/building-an-optimal-pocket-cube-solver-using-rust-wasm-threejs-and-react/) I wished to expand upon this design and cater for a conventional 3x3x3 Rubik Cube.
In this post I wish to discuss the process I went through in designing and building the solver and visual client alike - taking the learnings garnered from implementing the previous solver.

<!--more-->

## Characteristics of a Rubik Cube

As documented in my previous post, a Pocket Cube has a couple of key characteristics which make it easier to construct a solver using conventional [Graph searching algorithms](https://en.wikipedia.org/wiki/Graph_traversal), with minimal pruning or heuristics required.
However, in the case of a 3x3x3 Rubik Cube this is not the case, thanks in large part to the addition of a centre _cubie_ - the two no longer share the same optimisations that can be performed.
The cube itself has _43 quintillion, 252 quadrillion, 3 trillion, 274 billion, 489 million, 856 thousand_ different valid states, which in itself makes it computational infeasible to visit each possible move sequence in an adequate time.
However, [research](http://www.cube20.org/) has been conducted to prove that God's Number for a Rubik's Cube is twenty - that proving that any initial state can be solved in twenty moves or less.

![Characteristics of a Rubik Cube](/uploads/building-a-rubik-cube-solver-using-rust-wasm-threejs-and-react/cube.jpg)

## Solving the Cube

Along with conventional [Layer by Layer](https://en.wikipedia.org/wiki/Layer_by_Layer) approaches that _eventually_ get you to the solved state, there has been much research in the space of producing algorithms that perform this result more efficiently.

### Korf's algorithm

Initially, when setting out to build this Rubik Cube Solver I had hoped this to mirror the [2x2x2 counter-part](https://github.com/eddmann/pocket-cube-solver), and be an optimal solver which ran in the browser.
Prior art in this space documents algorithms such as [Richard Korf's](https://www.aaai.org/Papers/AAAI/1997/AAAI97-109.pdf) which with the aid of several pruning tables, do provide you with an optimal solution from any initial state; using Iterative deepening depth-first search (IDDFS) to traverse through the search space.
However, these prune tables are required to be generated up-front and incur a large memory footprint - upon my experiments begin upwards of 250mb.
On top of this, it is not possible to put an upper bound on how long it would take to find an optimal solution, sometimes I found taking over forty minutes to complete!
When running tests with such an implementation, I found that any scramble which tipped over ten random turns (starting from the goal state), resulted in an undesired wait for the client to return.
Although optimal, the memory and time footprint led me to continue my search to find a better fit for the target platform.

### Thistlethwaite's and Kociemba's algorithms

Based on the above evaluation I instead looked to provide a means to produce a solution which was instead _good enough_ - averaging out to an upper-bound of thirty-five moves or less.
Both [Morwen Thistlethwaite's](https://www.jaapsch.net/puzzles/thistle.htm) and the improved [Herbert Kociemba's](https://en.wikipedia.org/wiki/Optimal_solutions_for_Rubik%27s_Cube#Kociemba's_algorithm) algorithm both solve a given cube using multiple different phrases (sub-groupings), in-which only certain moves and properties of the cube are of concern at any given time.
At each phase we end up with a move sequence that matches a given property, in which we can continue on with until we have solved the cube in its entirety.
Again, prune tables are used to help speed up and aid the transition between the different phases.

### Pochmann's algorithm

Before setting out to implement one of the above algorithms, I stumbled upon a very interesting [C++ solver](https://www.stefan-pochmann.info/spocc/other_stuff/tools/solver_thistlethwaite/solver_thistlethwaite_cpp.txt) which looked ridiculously small in its' implementation and did not incur any additional memory footprint in regards to expected prune tables?!
The [Stefan Pochmann](https://www.stefan-pochmann.info/spocc/) algorithm takes inspiration from the sub-grouping and multi-phase approach of Thistlethwaite's, but instead provides several different requirements needed to transition between each phase.
In doing this we possibly end up with a larger move sequence result, but we are instead able to employ a Bidirectional search (like we did in the Pocket Cube Solver) at each phase which is trivial to implement.

## Building the Solver

With multiple different algorithms available to solve a Rubik Cube, I decided to architect my solution in such a way that could cater for multiple different solvers being _plugged in_ to the same cube represenation - achieved using Rust traits.
This would allow me to explore the advantages and disadvantages of each algorithm going forward.
I also applied the same level of design to the [cube](https://github.com/eddmann/rubik-cube-solver/blob/main/solver/src/cube.rs) itself, knowing that in each algorithm, certain different aspects of the cube were of concern.

I decided that the first algorithm to implement (and what is finished at the time of writing this) would be Pochmann's algorithm.
This allowed me to borrow much of the learnings and implementation I had built from the 2x2x2 cube solver.
Using the Rubik Cube model built I was able to apply a trivial represenation translation allowing me to reference plenty of the original C++ implementation.
The only addition included from this reference implementation was to simplify [multi-face turn moves](https://github.com/eddmann/rubik-cube-solver/blob/main/solver/src/pochmann_solver.rs#L302) which could incur between phases.
Once the solver was [implemented](https://github.com/eddmann/rubik-cube-solver/blob/main/solver/src/pochmann_solver.rs) and adequately tested, I could continue on to visualising the solution to the client.

## Visualising the Solution

Similar to how I achieved the visualisation for the Pocket Cube, I was able to take advantage of much of the same model of which had been built in that solution.
Using a combination of React, [Three.js](https://threejs.org/), [react-three-fiber](https://github.com/pmndrs/react-three-fiber) and TypeScript I was able to expand upon the 2x2x2 design already built, and add the necessary additional _cubies_ and rotation animation amendments required.
I was very pleased with how the previous work completed in building the Pocket Cube could be brought over and expanded upon to increase the scope of this project.

[![Visualising the Solution](/uploads/building-a-rubik-cube-solver-using-rust-wasm-threejs-and-react/solution.gif)](https://eddmann.com/rubik-cube-solver/)

## Conclusion

To conclude exploring the prior work that has been conducted in solving a 3x3x3 Rubik Cube has been very interesting.
Being able to borrow much of the same code built up from the [2x2x2 solver](https://eddmann.com/pocket-cube-solver/) was of great help, and allowed me to concentrate on the differences required to build the solver itself.
Going forward I wish to expand upon the single solver that has been implemented, providing a means of allowing the user to select additional solvers (i.e Thistlethwaite's and Kociemba's) they wish to experiment with.
