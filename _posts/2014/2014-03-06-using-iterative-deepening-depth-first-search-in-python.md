---
layout: post
title: 'Using Iterative deepening depth-first search in Python'
meta: 'Example usage of the Iterative deepening depth-first algorithm.'
---

Iterative deepening depth-first search (IDDFS) is an extension to the 'vanilla' depth-first search algorithm, with an added constraint on the total depth explored per iteration.
This addition produces equivalent results to what can be achieved using breadth-first search, without suffering from the large memory costs.
Due to BFS's storage of fringe vertices in memory, Od^b memory space may be required (b = branching factor), this is a stark contrast to IDDFS's O(bd) worst-case memory requirements.
On a per-iteration interval vertex successors at the depth-cap level are ignored, and if the goal has not been found, the maximum level is increased (by one) and the processes repeated.
Similarly to BFS, it has the guarantee to find an optimal path between two subject vertices, as the shallowest goal vertex will be the depth-cap first, resulting in no exploration of subsequent, unnecessary branches.

<!--more-->

## n-Puzzle example

Within the field of Artificial Intelligence the [sliding puzzle](http://en.wikipedia.org/wiki/15_puzzle) problem is a great way to explore the effectiveness of different searching algorithms.
Consisting of a superficial border with symboled tiles in a random order and one tile missing, the objective is to rearrange the puzzle in the least amount of moves to a goal state (typically natural order).
The border must be taken into consideration upon each move, with only a maximum of four possible legal moves available (up, down, left and right).

Below is an example of the IDDFS algorithm, implemented to help solve the discussed puzzle problem.
Providing the user with the requirement to specify a 'get_moves' function enables the ability to use the same implementation for different puzzle problems.

```python
def id_dfs(puzzle, goal, get_moves):
    import itertools

    def dfs(route, depth):
        if depth == 0:
            return
        if route[-1] == goal:
            return route
        for move in get_moves(route[-1]):
            if move not in route:
                next_route = dfs(route + [move], depth - 1)
                if next_route:
                    return next_route

    for depth in itertools.count():
        route = dfs([puzzle], depth)
        if route:
            return route
```

Looking at the sample code above you will notice the use of 'itertools' infinite counter (starting from zero).
The depth will continue to increment until a successful path is generated and returned to the user.

### Number Matrix

The first problem we will solve with the above implementation is the common place numbered (3x3) 8-puzzle.
Using the method below we are able generate the specified sized puzzle and goal matrices, which is useful to testing.

```python
def num_matrix(rows, cols, steps=25):
    import random

    nums = list(range(1, rows * cols)) + [0]
    goal = [ nums[i:i+rows] for i in range(0, len(nums), rows) ]

    get_moves = num_moves(rows, cols)
    puzzle = goal
    for steps in range(steps):
        puzzle = random.choice(get_moves(puzzle))

    return puzzle, goal
```

So as to make sure that the algorithm checks for only legal moves in our problem domain, the function below has been created that returns a partially-applied 'get_moves' method, based on the grid size and discussed restraints.

```python
def num_moves(rows, cols):
    def get_moves(subject):
        moves = []

        zrow, zcol = next((r, c)
            for r, l in enumerate(subject)
                for c, v in enumerate(l) if v == 0)

        def swap(row, col):
            import copy
            s = copy.deepcopy(subject)
            s[zrow][zcol], s[row][col] = s[row][col], s[zrow][zcol]
            return s

        # north
        if zrow > 0:
            moves.append(swap(zrow - 1, zcol))
        # east
        if zcol < cols - 1:
            moves.append(swap(zrow, zcol + 1))
        # south
        if zrow < rows - 1:
            moves.append(swap(zrow + 1, zcol))
        # west
        if zcol > 0:
            moves.append(swap(zrow, zcol - 1))

        return moves
    return get_moves
```

We are now able to use all three of these functions to solve and return the optimal path to a contrived puzzle and goal state.

```python
puzzle, goal = num_matrix(3, 3) # ([[1, 5, 2], [4, 8, 0], [7, 6, 3]], [[1, 2, 3], [4, 5, 6], [7, 8, 0]])
solution = id_dfs(puzzle, goal, num_moves(3, 3))
len(solution) # 8
```

### String Matrix

Now that we are confident that the implementation is working correctly we can now move onto creating a solution to the string matrix problem.
Similar to the problem above we are still keeping hold of the border property, however, this time we are going to add the requirement to store and compare the subject paths in string format (compared to a multi-dimensional list).
We first create a function which generate a contrived puzzle and goal state for us to then solve.

```python
def str_matrix(rows, cols, steps=25):
    import random, string

    goal = string.ascii_lowercase[:rows * cols - 1] + '*'

    get_moves = str_moves(rows, cols)
    puzzle = goal
    for steps in range(steps):
        puzzle = random.choice(get_moves(puzzle))

    return puzzle, goal
```

With this function now in place we then provide the ability to return valid present moves, based on a subject position.

```python
def str_moves(rows, cols):
    def get_moves(subject):
        moves = []

        zero = subject.index('*')
        zrow = zero // cols
        zcol = zero % cols

        def swap(idx):
            s = list(subject)
            s[zero], s[idx] = s[idx], s[zero]
            return ''.join(s)

        # north
        if zrow > 0:
            moves.append(swap(zero - cols))
        # east
        if zcol < cols - 1:
            moves.append(swap(zero + 1))
        # south
        if zrow < rows - 1:
            moves.append(swap(zero + cols))
        # west
        if zcol > 0:
            moves.append(swap(zero - 1))

        return moves
    return get_moves
```

Finally, we can produce a similar example to the number matrix example to see the solution in action.

```python
puzzle, goal = str_matrix(3, 3) # (aebhg*dfc, abcdefgh*)
solution = id_dfs(puzzle, goal, str_moves(3, 3))
len(solution) # 12
```

## Resources

- [15 puzzle](http://en.wikipedia.org/wiki/15_puzzle)
- [Iterative deepening vs depth first search](http://stackoverflow.com/questions/7395992/iterative-deepening-vs-depth-first-search)
- [Iterative deepening](http://www.stanford.edu/~msirota/soco/inter.html)
