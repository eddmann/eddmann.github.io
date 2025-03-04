---
layout: post
title: 'Rewriting the santa-lang Interpreter in Rust, Part 1 - Implementing the Core'
meta: 'This series of articles documents my experience rewriting the santa-lang interpreter in Rust. In this article, I delve into how I organised the project and built the core language.'
tags: rust santa-lang interpreter santa-lang-in-rust-series
---

After implementing santa-lang in [TypeScript (Node)](https://eddmann.com/posts/designing-santa-lang-a-language-for-solving-advent-of-code-puzzles/), I wanted to explore rewriting the tree-walking interpreter in a lower-level systems language for efficiency and performance gains.
My goal was to be able to run the entire [Advent of Code 2022 calendar](https://adventofcode.com/2022) _quicker_ than the Node variant.
I settled on using Rust due to its blend of high and low-level constructs, its vibrant package registry (Cargo), memory management model, and previous [enjoyable experience using the language](https://eddmann.com/posts/building-a-rubik-cube-solver-using-rust-wasm-threejs-and-react/).
In this first article within the series, I will document how I went about organising the project and rewriting the core language within Rust.

<!--more-->

<img style="max-width:350px;margin:0 auto;" src="/uploads/rewriting-the-santa-lang-interpreter-in-rust/logo.png" alt="santa-lang" />

I decided to organise the project using [Cargo workspaces](https://doc.rust-lang.org/cargo/reference/workspaces.html), with the language and each (delivery) runtime being colocated in the same monorepo as separate packages.
This provided a good level of modularity and structure to the project.
Within the language library itself, I broke up each of the individual layers into subdirectory modules, with tests colocated with the specific layer.

```
├── Cargo.toml
├── runtime
│   └── cli
│       └── Cargo.toml
└── lang
    ├── Cargo.toml
    └── src
        ├── evaluator
        ├── lexer
        ├── parser
        └── runner
```

To implement the core, I used the TypeScript test suite as documented behaviour I wished to provide.
This proved to be a very rewarding experience, whereby investing the time in making a solid test suite for the initial implementation made it somewhat trivial to follow this time around.
Due to the manner in which each layer ([Lexer](#lexer), [Parser](#parser), [Evaluator](#evaluator)) is built on top of each other, I was able to work my way up the stack, garnering confidence at each level.
Whilst building out the testing framework within Rust, I stumbled upon [expect_test](https://docs.rs/expect-test/latest/expect_test/), which uses macros to provide a frictionless means to validate (and automatically update) test assertions.
For data structure-centric outputs such as the Lexer and Parser, this was ideal.

## Lexer

Within the Lexer, I decided to implement the tokenizer as an `Iterator`, which the Parser could consume.
I additionally used a [macro](https://github.com/eddmann/santa-lang-rs/blob/ec9a5ecc795ea9a67844d0c5d3720e960a8bd31b/lang/src/lexer/token.rs#L118-L177) (shown below) to express the Lexer tokens in an [easier-to-read](https://github.com/eddmann/santa-lang-rs/blob/ec9a5ecc795ea9a67844d0c5d3720e960a8bd31b/lang/src/lexer/mod.rs#L44) form than the `Token` enumeration itself.

```rust
#[macro_export]
macro_rules! T {
    [INT] => { $crate::lexer::TokenKind::Integer };
    [+]   => { $crate::lexer::TokenKind::Plus };
    [||]  => { $crate::lexer::TokenKind::PipePipe };
    // ..
}
```

## Parser

With the Lexer implemented and tested, the generated tokens were then used to construct an Abstract Syntax Tree (AST) by way of the Parser.
Several interesting choices were made due to using Rust as the implementation language.

In this case, an error was handled using an explicit `Result` type, as opposed to throwing an exception.
Upon a parser error being found, a [`ParserErr`](https://github.com/eddmann/santa-lang-rs/blob/ec9a5ecc795ea9a67844d0c5d3720e960a8bd31b/lang/src/parser/mod.rs#L26) would be returned with a detailed message and the source location.
To avoid _indentation hell_, I appreciated how we could express an `Err`, short-circuiting execution using the [question mark operator](https://doc.rust-lang.org/rust-by-example/std/result/question_mark.html).
For example, `self.expect(T![ID])?` ensures that the next token consumed is an _identifier_, else it short-circuits and returns the `Err` type.
This syntax also works for `Option` types.

As discussed before, we were able to use the macro tokens that were defined within the Lexer to clearly describe the translation to a meaningful AST.
One such example of this was while parsing an _if expression_, combining the representation of the tokens as expected santa-lang syntax along with short-circuiting upon a `ParserErr`.

```rust
fn parse_if_expression(&mut self) -> RExpression {
    let start = self.expect(T![IF])?;

    self.consume_if(T!['(']);
    let condition = Box::new(self.parse_expression(Precedence::Lowest)?);
    self.consume_if(T![')']);
    let consequence = Box::new(self.parse_block_statement()?);
    let alternative = if self.consume_if(T![ELSE]) {
        Some(Box::new(self.parse_block_statement()?))
    } else {
        None
    };

    Ok(Expression {
        kind: ExpressionKind::If { condition, consequence, alternative },
        source: start.source_range(&self.current_token),
    })
}
```

It was also during Parser development that I became very familiar with the concept of a `Box`.
This type stores a value on the _heap_ rather than the _stack_, with the size of the smart pointer known at compile time and the value it points to being of indeterminate size until runtime.
As we are allocating the value onto the _heap_, this does incur performance penalties.
However, it also provides us with the ability to define recursive types, which is required when building up the AST.
For example, in the case of `Box<Expression>`, we do not know the exact type/size of `Expression` at compile time, as we are required to parse the santa-lang source code provided at runtime to discern this.

## Evaluator

The largest undertaking was evaluating the parsed AST.
In this step, I opted to use the concept of `Frames` to model the stacked computation.
Represented as an [enumeration](https://github.com/eddmann/santa-lang-rs/blob/ec9a5ecc795ea9a67844d0c5d3720e960a8bd31b/lang/src/evaluator/mod.rs#L42C10-L60), it allowed me to trivially express and destructure the different states.

Like the TypeScript implementation, trying to break up the evaluation behaviour into manageable-sized chunks was an important task.
To achieve this, I decided to break up key behaviours into separate functions (located in separate files).
To ensure that there was no performance penalty or unnecessary function invocation for this decision, I used [inline annotations](https://nnethercote.github.io/perf-book/inlining.html), which will be discussed more in a [future article](https://eddmann.com/posts/rewriting-the-santa-lang-interpreter-in-rust-part-3-performance/) within the series.
Some behaviours that I separated out were language [function invocation](https://github.com/eddmann/santa-lang-rs/blob/ec9a5ecc795ea9a67844d0c5d3720e960a8bd31b/lang/src/evaluator/function.rs) (user-land, memoized, closures, external and built-in), [infix operations](https://github.com/eddmann/santa-lang-rs/blob/ec9a5ecc795ea9a67844d0c5d3720e960a8bd31b/lang/src/evaluator/infix.rs), and santa-lang's [match expressions](https://github.com/eddmann/santa-lang-rs/blob/ec9a5ecc795ea9a67844d0c5d3720e960a8bd31b/lang/src/evaluator/matcher.rs).

### Rc\<RefCell\<T\>\>

Similar to the Parser, as the size of certain values is not known at compile-time, some work has to be delegated to runtime.
As evaluation of the santa-lang source code could lead to shared ownership and mutation of given values, we could not rely on Rust's compile-time memory management.
It was here that I was introduced to `Rc<RefCell<T>>`.
The `Rc` keeps track of how many references exist to a given value, deallocating it when the count reaches zero.
The `RefCell` provides us with the ability to borrow a mutable value even when the type is deemed immutable.
Combined, this allows multiple parts of the program to have read-only access to the same value, whilst allowing parts to mutate it when necessary.
This results in runtime errors over our preferred compile-time errors.
It should also be noted that this combination only works for single-threaded applications.
There are alternative means of solving this for multithreaded applications (i.e. using `Arc`).

I have a love-hate relationship with this concept.
On the one hand, it allows me to trivially handle many `Object`s being passed around and mutated throughout the evaluator's lifetime.
However, on the other hand, it does not feel very Rust-like, losing the compile-time memory management guarantees that we hold so dear.
After reviewing several interpreter implementations in Rust, I noticed that they all used this concept.
I would like to revisit it to explore alternative approaches that reduce reliance on this moving forward.

### Lazy Sequences

In the previous implementation, I had made extensive use of the [ImmutableJS](https://immutable-js.com/) library, not only for immutable data structures but also for the lazy operations that could be applied to them.
However, when it came to the Rust implementation, there was no such library that offered both behaviours.
Fortunately, I was able to use the [im-rs](https://github.com/bodil/im-rs) library, which provided performant immutable data structures (of which I found [one gotcha bug](https://github.com/eddmann/im-rs/commit/90092043778c5812c0b236d61c70acdb3acaa584)).
Regarding the lazy sequences, I had to implement these myself.

It was an interesting challenge (especially with Rust's borrow checker) to handle such computation.
Similar to the Lexer, I built my own custom `Iterator`, which handled resolving the underlying lazy value and applying operations that had been defined (`maps`, `filters`, etc.).
I was happy with the resulting behaviour but still feel that this implementation could do with some attention.
It still does not feel very Rust-like to me (I wonder what a true _Rustacean_ would think of it).

### Standard Library

A large part of the santa-lang evaluator is the standard library that it provides.
As the language is dynamically typed, each function call can be passed many arguments (of differing types) and needs to be able to handle them accordingly.
Upon researching a means to handle this within Rust, I could see there were two options: dynamic dispatch (via `Object` type traits) and in-place invocation (via pattern matching).
I had used [dynamic dispatch](https://www.shuttle.rs/blog/2024/04/18/using-traits-generics-rust#object-traits-and-dynamic-dispatch) within the TypeScript implementation.
Although highly readable and extendable, it was going to result in runtime performance penalties I was not willing to incur.
As such, I was only left with in-place invocation.

Taking inspiration from the [enum_dispatch](https://docs.rs/enum_dispatch/latest/enum_dispatch/) crate, I decided to build my own [`builtin!`](https://github.com/eddmann/santa-lang-rs/blob/ec9a5ecc795ea9a67844d0c5d3720e960a8bd31b/lang/src/evaluator/builtins/macros.rs) function suite of macros.
This allowed me to remove the boilerplate of choosing inline invocation whilst keeping a clean DSL for defining the many different functions the language had to offer.
A good example of this is how the `map` function is defined, whereby we are able to co-locate the different mapping behaviours based on type.

```rust
builtin! {
    map(mapper, collection) [evaluator, source] match {
        (Object::Function(mapper), Object::List(list)) => { // .. }
        (Object::Function(mapper), Object::Set(set)) => { // .. }
        (Object::Function(mapper), Object::Dictionary(map)) => { // .. }
        (Object::Function(mapper), Object::LazySequence(sequence)) => { // .. }
        (Object::Function(mapper), Object::String(string)) => { // .. }
    }
}
```

Additionally, it catered for [multi-arity arguments](https://github.com/eddmann/santa-lang-rs/blob/ec9a5ecc795ea9a67844d0c5d3720e960a8bd31b/lang/src/evaluator/builtins/collection.rs#L835).

```rust
builtin! {
    zip(collection, ..collections) [evaluator, source] match {
        (_, Object::List(collections)) => { // .. }
    }
}
```

This DSL is one of the areas I am most proud of within the Rust rewrite of the language.
It allows me to clearly define a function's parameters and implement pattern-matched behaviours based on the parsed-in arguments.

### External Functions

Along with providing built-in functions defined within the core language, the TypeScript implementation included a means of adding external functions, which are defined during evaluator instantiation.
These external functions can be used to provide runtime-specific behaviour, for example, implementing I/O concerns such as `puts` and `read`.
To implement this capability within the interpreter, I was required to use a `dyn Fn` [trait object](https://doc.rust-lang.org/std/keyword.dyn.html) definition over basic function pointers.
This provides the ability to pass _Closures_ as external functions, which was a requirement when building the WASM runtime (discussed in the [next article](https://eddmann.com/posts/rewriting-the-santa-lang-interpreter-in-rust-part-2-runtimes/)).
There are some performance disadvantages to modelling it this way due to extra indirection via the _vtable_ lookup.
However, it should be noted that a heap allocation is not required if the trait object it is storing has zero size, which is the case for functions and Closures that do not capture any variables.

## Runner

Finally, I was able to build the Advent of Code Runner, which was used to parse the _AoC_ file format and execute the solutions (with provided tests).
At this step, I enjoyed building a [`Time`](https://github.com/eddmann/santa-lang-rs/blob/ec9a5ecc795ea9a67844d0c5d3720e960a8bd31b/lang/src/runner/mod.rs#L82-L84) trait, which was used for runtimes to specify how they determined the current time, as we could not rely solely on a [POSIX](https://en.wikipedia.org/wiki/POSIX) implementation (i.e. WASM).
I also encapsulated the internal Parser and Runtime errors into a type that is publicly accessible to the runtimes using the `From` trait (`From<RuntimeErr> for RunErr`).
This ensured that the internal error types remained private and were not leaked out of the _core domain_.

## What's Next...

With the core language library now implemented and tested, it was time to move on to the different runtimes.
In the [next post](https://eddmann.com/posts/rewriting-the-santa-lang-interpreter-in-rust-part-2-runtimes/) within the series, I will document how I went about integrating the core language library into the (delivery) runtimes.
