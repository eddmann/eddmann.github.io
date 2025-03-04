---
layout: post
title: "Building a Rubik's Cube Solver using Rust/WASM and Three.js/React"
meta: "Explore the process of building a Rubik's Cube (3x3x3) solver using Rust, WebAssembly (WASM), Three.js, and React."
tags: rubiks-cube typescript rust react threejs
---

After building the [Pocket Cube Solver](https://eddmann.com/posts/building-an-optimal-pocket-cube-solver-using-rust-wasm-threejs-and-react/), I wished to expand upon this design and cater for a conventional 3x3x3 Rubik's Cube.
In this post, I discuss the process I went through in designing and building the solver and visual client alike - taking the learnings garnered from implementing the previous solver.

<!--more-->

## Characteristics of a Rubik's Cube

As documented in my previous post, a Pocket Cube has a couple of key characteristics that make it easier to construct a solver using conventional [Graph searching algorithms](https://en.wikipedia.org/wiki/Graph_traversal), with minimal pruning or heuristics required.
However, in the case of a 3x3x3 Rubik's Cube, this is not the case, largely due to the addition of a centre _cubie_ - meaning the two no longer share the same optimisations that can be performed.
The cube itself has _43 quintillion, 252 quadrillion, 3 trillion, 274 billion, 489 million, 856 thousand_ different valid states, which makes it computationally infeasible to visit each possible move sequence in an adequate time.
However, [research](http://www.cube20.org/) has proven that God's Number for a Rubik's Cube is twenty - demonstrating that any initial state can be solved in twenty moves or fewer.

![Characteristics of a Rubik's Cube](/uploads/building-a-rubik-cube-solver-using-rust-wasm-threejs-and-react/cube.jpg)

## Solving the Cube

Along with conventional [Layer by Layer](https://en.wikipedia.org/wiki/Layer_by_Layer) approaches that _eventually_ lead to a solved state, there has been much research into producing algorithms that perform this task more efficiently.

### Korf's Algorithm

Initially, when setting out to build this Rubik's Cube Solver, I had hoped to mirror the [2x2x2 counterpart](https://github.com/eddmann/pocket-cube-solver) and create an optimal solver that ran in the browser.
Prior work in this space documents algorithms such as [Richard Korf's](https://www.aaai.org/Papers/AAAI/1997/AAAI97-109.pdf), which, with the aid of several pruning tables, can provide an optimal solution from any initial state using Iterative deepening depth-first search (IDDFS) to traverse the search space.
However, these pruning tables must be generated upfront and incur a large memory footprint - reaching upwards of 250MB in my experiments.
Additionally, it is not possible to set an upper bound on how long it would take to find an optimal solution, sometimes taking over forty minutes to complete!
When running tests, I found that any scramble exceeding ten random turns (starting from the goal state) resulted in an undesired wait for the client to return.
Although optimal, the memory and time footprint led me to continue my search to find a better fit for the target platform.

### Thistlethwaite's and Kociemba's Algorithms

Based on the above evaluation, I instead sought to provide a solution that was _good enough_ - averaging an upper bound of thirty-five moves or fewer.
Both [Morwen Thistlethwaite's](https://www.jaapsch.net/puzzles/thistle.htm) and the improved [Herbert Kociemba's](https://en.wikipedia.org/wiki/Optimal_solutions_for_Rubik%27s_Cube#Kociemba's_algorithm) algorithms solve a given cube using multiple phases (sub-groupings), where only certain moves and properties of the cube are relevant at any given time.
At each phase, we generate a move sequence that satisfies a given property, allowing us to progress toward solving the cube.
Again, pruning tables are used to accelerate transitions between different phases.

### Pochmann's Algorithm

Before setting out to implement one of the above algorithms, I stumbled upon an interesting [C++ solver](https://www.stefan-pochmann.info/spocc/other_stuff/tools/solver_thistlethwaite/solver_thistlethwaite_cpp.txt) that had a surprisingly small implementation and did not require additional memory for pruning tables!
The [Stefan Pochmann](https://www.stefan-pochmann.info/spocc/) algorithm takes inspiration from the sub-grouping and multi-phase approach of Thistlethwaite's but instead defines several different requirements to transition between each phase.
This approach may result in a longer move sequence, but it enables the use of Bidirectional Search (as in the Pocket Cube Solver) at each phase, which is trivial to implement.

## Building the Solver

With multiple algorithms available to solve a Rubik's Cube, I designed my solution to accommodate multiple solvers being _plugged into_ the same cube representation - achieved using Rust traits.
This approach allows for future exploration of the advantages and disadvantages of each algorithm.
I applied the same level of modularity to the [cube](https://github.com/eddmann/rubik-cube-solver/blob/main/solver/src/cube.rs) itself, recognising that different aspects of the cube are relevant depending on the algorithm used.

I decided to implement Pochmann's algorithm first, as it allowed me to leverage much of the knowledge and code from the 2x2x2 cube solver.
Using the Rubik's Cube model I built, I applied a simple representation translation that let me reference much of the original C++ implementation.
The only additional optimisation involved simplifying [multi-face turn moves](https://github.com/eddmann/rubik-cube-solver/blob/main/solver/src/pochmann_solver.rs#L302) occurring between phases.
Once the solver was [implemented](https://github.com/eddmann/rubik-cube-solver/blob/main/solver/src/pochmann_solver.rs) and adequately tested, I moved on to visualising the solution for the client.

## Visualising the Solution

Similar to how I visualised the Pocket Cube, I reused much of the same model built for that solution.
Using a combination of React, [Three.js](https://threejs.org/), [react-three-fiber](https://github.com/pmndrs/react-three-fiber), and TypeScript, I expanded upon the 2x2x2 design by adding the necessary additional _cubies_ and rotation animation adjustments.
I was very pleased with how the previous work on the Pocket Cube could be adapted and expanded upon for this project.

[![Visualising the Solution](/uploads/building-a-rubik-cube-solver-using-rust-wasm-threejs-and-react/solution.gif)](https://eddmann.com/rubik-cube-solver/)

## Conclusion

To conclude, exploring prior work in solving a 3x3x3 Rubik's Cube has been very insightful.
Being able to reuse much of the code from the [2x2x2 solver](https://eddmann.com/pocket-cube-solver/) was immensely helpful, allowing me to focus on the unique challenges of building the solver.
Moving forward, I plan to expand beyond the single implemented solver, giving users the ability to select additional solvers (e.g., Thistlethwaite's and Kociemba's) for experimentation.
