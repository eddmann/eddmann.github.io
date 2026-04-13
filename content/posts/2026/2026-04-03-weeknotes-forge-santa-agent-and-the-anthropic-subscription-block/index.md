---
layout: post
title: 'Weeknotes: Forge, Santa Agent, and the Anthropic Subscription Block'
meta: 'Jumping on the bandwagon and building my own native macOS terminal for coding agents, letting an agent loose on my Advent of Code solutions, and dealing with Anthropic closing the door on third-party subscription access.'
tags: ['weeknotes', 'agents', 'personal-software', 'llm']
---

A few things from the week.
Jumped on the bandwagon and built my own native macOS terminal for coding agents, let an agent loose on my Advent of Code solutions, and dealt with Anthropic closing the door on third-party subscription access.

<!--more-->

## Forge

I've been juggling multiple coding agents across terminals for a while now, and it's messy.
Losing track of what each session is doing, no easy way to review changes, no built-in isolation between _tasks_.
[Forge](https://github.com/eddmann/Forge) is my attempt at fixing that - a native macOS terminal for local coding-agent workflows.

![Forge](forge.png)

It focuses on:

- Running multiple agent sessions without losing track of what each one is doing
- Giving agents isolated workspaces for local changes
- Letting each agent keep its own CLI and TUI instead of forcing a generic abstraction
- Inspecting, reviewing, and feeding back on the work agents produce - building on the ideas from [revu](/posts/weeknotes-model-personalities-building-my-own-agent-and-two-schools-of-agentic-development/#revu)

I'd been messing with the idea for several weeks on and off, and this week I had some free cycles and the impetus to actually push on and explore the feature set.
Lots of running to explore features - expect _clanker slop_ underneath for now.
But I'm already finding it adding value in my work process.

It's built with SwiftUI, though I found it wasn't performant enough in certain areas like rendering large git diffs, so I dropped back to AppKit for `NSTableView` support for this specific usecase.

There are many tools out there in this space - [Solo](https://soloterm.com/), [Conductor](https://www.conductor.build/), [Polyscope](https://getpolyscope.com/), [cmux](https://cmux.com/), [Superset](https://superset.sh/) - but this one's my personal one, living and changing as I adapt my workflow.

We now have the ability to build software tailored to our current needs in ways that are finally practical.
Forge is a living tool that will change with my workflow as the software development space evolves at a rapid pace.

As seems to be the running narrative across all my weeknotes, I think personal software is worth exploring more seriously: software shaped around how you want to work, not just how existing tools expect you to work.
I hope someone finds this project useful, or better yet, is inspired to explore it with their agent and then make their own version.

## Santa Agent

Several years back in the ChatGPT 3.5 Turbo days I attempted to get the LLM to write some trivial [santa-lang](https://eddmann.com/santa-lang/) based on a supplied language specification; the results were underwhelming.
With the insane amount of progress these models have taken since then I always wanted to come back to this project.
So one evening I decided to do so.
I wanted to see if an agent could now write idiomatic santa-lang - not just translate line-by-line from another language, but actually use the functional idioms and preferences the language was designed around.
So I built [santa-agent](https://github.com/eddmann/advent-of-code/tree/master/.santa-agent), a closed feedback loop that translates existing Advent of Code solutions into santa-lang.

It uses the [Claude Agent SDK](https://github.com/anthropics/claude-agent-sdk) to discover which puzzles are missing santa-lang solutions, reads the source solution in another language (TypeScript, Python, Rust, etc.), fetches the puzzle description and submitted answers from adventofcode.com, then has Claude write the `.santa` file.
The agent has access to in-memory MCP tools to test and verify answers against AoC - so it writes, tests, fixes failures, and verifies in a closed loop.

The key challenge is getting it to produce idiomatic santa-lang rather than a literal translation.
Each of the previous years' solutions uses a different programming language, which also adds to the challenge.
There's an `IDIOMATIC.md` guide that steers toward my preferred idiom of pipeline-first, function composition, partial application, and pattern matching.
The agent gets the full language spec and idiom guide in its system prompt, alongside the source solution and puzzle context.

It worked surprisingly well, and managed to solve all the missing puzzles.
Better still, upon review of the solutions I could clearly see idiomatic use of santa-lang.

An unexpected bonus was that it surfaced real bugs across the different santa-lang implementations.
The agent only targeted [Comet](https://github.com/eddmann/santa-lang-comet), the canonical implementation, when writing and verifying solutions.
But when I then ran those solutions against the other implementations (Blitzen in Rust, Prancer in TypeScript, Donner in Kotlin/JVM), several inconsistencies showed up - parser gaps, builtins behaving differently, edge cases handled one way in Comet and another elsewhere.
I fed each of those failures back to Claude to dig into and correct, and it worked through them one by one.

Having an agent exercise the language across hundreds of puzzles turned out to be a surprisingly effective way to find differences between the implementations.
It's also provided me with more insight into how I can better document the [language specification](https://github.com/eddmann/santa-lang/blob/main/docs/lang.txt) I wrote for building out these implementations as we go forward.

## MIT Lecture Course

Continuing the LLM deep-dive from [last week](/posts/weeknotes-going-deeper-on-llms-marginalia-and-agent-toolkit-skills/).
I've been working through MIT's [Hands-on Deep Learning](https://ocw.mit.edu/courses/15-773-hands-on-deep-learning-spring-2024/) course, and I'm up to the transformers section so far.
Quality, freely accessible material like this is invaluable.
Combined with the [Build an LLM from Scratch](https://www.manning.com/books/build-a-large-language-model-from-scratch) book and Karpathy's [Neural Networks: Zero to Hero](https://www.youtube.com/playlist?list=PLAqhIrjkxbuWI23v9cThsA9GvCAUhRvKZ) playlist, it's been a great complement to the more hands-on learning I've been doing.

## Anthropic Third-Party Block

Anthropic [blocked third-party tools from using Claude through Max/Pro subscription plans](https://x.com/bcherny/status/2040206440556826908).
This means tools like [Pi](https://github.com/badlogic/pi-mono), which I've been using heavily as my primary coding agent, can no longer piggyback on a subscription.
You have to use API access directly now.

[Jeeves](https://github.com/eddmann/jeeves) and [My Own Coding Agent](https://github.com/eddmann/my-own-coding-agent) have also been bitten by this.
I'd [experienced this drama before](/posts/weeknotes-throwaway-tools-sessions-as-trees-and-building-a-personal-ai-assistant/) when Anthropic started blocking API requests from third-party harnesses, but this time the door is properly shut.

The API costs are a lot for my use cases.
I do a lot of experimentation and testing - throwaway sessions, exploring ideas, running agents in loops.
That kind of usage adds up fast on per-token billing.
I'm looking at moving Jeeves over to GPT-5.4 this weekend - it's available through a ChatGPT Plus plan.
I've really enjoyed the _personality_ Claude brings in AI assistant form, so it's going to be interesting to see how that changes when moving over to GPT-5.4.

## What I've Been Learning From

**Articles:**

- [Machine Errors and Non-Deterministic Humans](https://www.linkedin.com/pulse/machine-errors-non-deterministic-humans-vlad-khononov-ecnhf/) - Vlad Khononov on applying human error-management strategies to LLMs
- [The Git Commands I Run Before Reading Any Code](https://piechowski.io/post/git-commands-before-reading-code/) - Ally Piechowski on diagnosing codebase health before diving into the code
- [Components of A Coding Agent](https://magazine.sebastianraschka.com/p/components-of-a-coding-agent) - Sebastian Raschka on how coding agents integrate tools, memory, and repository context
- [Context Anchoring](https://martinfowler.com/articles/reduce-friction-ai/context-anchoring.html) - Rahul Garg on externalising decision context into living documents across AI-assisted sessions
- [Zen of AI Coding](https://nonstructured.com/zen-of-ai-coding/) - Nonstructured on the principles of working with AI coding agents
- [I Left an AI to Do ML Research. It Crashed Three Times. I Was Ready.](https://chrisbrousseau2.substack.com/p/i-left-an-ai-to-do-ml-research-it) - Chris Brousseau on building production infrastructure around Karpathy's autoresearch

**Videos/Podcasts:**

- [MIT: Hands-on Deep Learning (Spring 2024)](https://ocw.mit.edu/courses/15-773-hands-on-deep-learning-spring-2024/)
- [How Linear Algebra Powers Machine Learning (ML)](https://www.youtube.com/watch?v=-KKxtHwxKhE)
- [I Hated Every Coding Agent, So I Built My Own - Mario Zechner (Pi)](https://www.youtube.com/watch?v=Dli5slNaJu0)
- [Amp Code Founder on future of Coding Agents](https://www.youtube.com/watch?v=_L8xxUXOTk0)
- [Why AI is the Third Coming of Domain-Driven Design](https://www.youtube.com/watch?v=kX_BWbzyWaI)

---

Forge is the latest in a series of personal tools shaped to how I actually work, not how someone else thinks I should.
The santa-agent finding real interpreter bugs was a pleasant surprise - agents as testing infrastructure is something I want to explore more.
And the Anthropic block is a reminder that building on someone else's platform always carries risk.
