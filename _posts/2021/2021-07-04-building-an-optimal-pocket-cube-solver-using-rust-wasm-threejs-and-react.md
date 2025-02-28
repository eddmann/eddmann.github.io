---
layout: post
title: 'Building an optimal Pocket Cube (2x2x2) Solver using Rust/WASM and Three.js/React'
meta: 'This explores the process of building an optimal Pocket Cube (2x2x2) Solver using Rust/WASM and Three.js/React'
tags: pocket-cube rubik-cube typescript rust react threejs
---

Over the past couple of months I have been very interested in exploring how to efficiently visualise and solve a Rubik's Cube.
Coupled with my desire to experiment with Rust and WASM this felt like a great opportunity to blend the two.
However, before solving a 3x3x3 Rubik Cube, I thought it would be beneficial to explore how to optimally solve a Pocket Cube first.

<!--more-->

## Characteristics of a Pocket Cube

There is plenty of prior art in this space, and thanks to some key characteristics of a 2x2x2 Pocket Cube, optimally solving a given cube state is not too computationally intensive.
The Pocket Cube consists of 8 _cubies_, each with three colour stickers on them.
Any permutation of the _cubies_ is possible, with seven of these being able to be independently oriented in three ways.
If we fix one of these _cubies_ to a chosen position and orientation (essential deeming it to be in a solved state); we can permit any permutation of the remaining seven _cubies_ and any orientation of six _cubies_.
This results in their only being `7! * 3^6 = 3674160` possible unique states.

To ensure that we fix the given 'solved' _cubie_, we are only required to implement three of the possible six moves, these being Up, Right and Front in my case - resulting in the Down-Bottom-Left `DBL` _cubie_ staying in-place at all times.
In fixing a single _cubie_ we have managed to reduce the number of valid states, and as such employing a convention [Graph search algorithm](https://en.wikipedia.org/wiki/Graph_traversal) over the search space provides us with a efficent means to reach the optimal solution move sequence.

I was able to model [this representation](https://github.com/eddmann/pocket-cube-solver/blob/main/solver/src/cube.rs) of a Pocket Cube in Rust taking advantage of the ability to inline tests within the same file to provide additional confidence.

## Using a Bidirectional search

As we know the desired goal state and the initial cube state we can employ two simultaneous Breath First Searches - one going forward from the initial state and one backward from the goal state, stopping when they meet.
In doing this we provide a means to restrict the branching which occurs when the search is being performed, into seperate two sub-graphs - dramatically reducing the amount of exploration required.

> Suppose if the branching factor of the tree is `b` and distance of the goal vertex from the source is `d`, then the trivial Breath First Search complexity would be `O(bd)`.
> On the other hand, if we execute two search operations then the complexity would be `O(bd/2)` for each search, with a total complexity of `O(bd/2 + bd/2)` - which is far less than `O(bd)`.

On top of this we are able to prune out move sequences which exceed [God's Number](https://en.wikipedia.org/wiki/God%27s_algorithm) - which is eleven moves for a Pocket Cube.
I had a lot of fun implementing [this algorithm](https://github.com/eddmann/pocket-cube-solver/blob/main/solver/src/solve.rs) in Rust, and in-turn exposing the solver to the Browser/JavaScript using [WASM](https://rustwasm.github.io/docs/book/).

## Visualising the Solution

Now that I was able to optimally solve a given cube state in the Browser via WASM, next was to provide a pleasing visualisation which could be followed along using a real Pocket Cube.
For this I decided to build the client in React using [Three.js](https://threejs.org/), [react-three-fiber](https://github.com/pmndrs/react-three-fiber) and TypeScript.
I have had little experience till now using Three.js, but thought it would be interesting to explore constructing such models in a declarative manner using React.

I found this to be a very rewarding experience, using a Facelet representation of the cube state to communicate between the client and the solver.
The cube component itself took adavanteg of React Hooks to manage the state transitions and [rotation animations](https://github.com/eddmann/pocket-cube-solver/blob/main/client/src/Cube/rotation.ts).

[![Visualising the Solution](/uploads/building-an-optimal-pocket-cube-solver-using-rust-wasm-threejs-and-react/solution.gif)](https://eddmann.com/pocket-cube-solver/)

## Conclusion

To conclude I learned a great deal about the Pocket/Rubik Cube solution space, coupled with Rust and Three.js while completing this project.
The actual solver algorithm itself being relativity simple simple allowed me to concentrate my efforts on learning Rust and its interoperability with WebAssembly.
Going forward, I wish to expand upon this project and build a solver for the 3x3x3 Rubik's Cube.
