---
layout: post
title: 'Vibe Coding a Chess UI: Building on the ESP32 with Cursor & LVGL'
meta: "Exploring vibe coding with the ESP32 microcontroller, Cursor, and LVGL - how AI-assisted development tools like Claude and OpenAI's o3 enable rapid prototyping and high-level architectural thinking in building an embedded chess UI."
summary: "In this post, I share my experience using AI-driven tools like Cursor, Claude Sonnet, and OpenAI's o3 to rapidly prototype an embedded chess UI on the ESP32 microcontroller using LVGL. Letting the AI handle implementation allowed me to stay focused on high-level design, iterate quickly, and stay in flow. Hype aside, it's a powerful tool for exploring ideas faster."
tags: ['esp32', 'cursor', 'llm', 'chessboard']
---

Yesterday, I completed my first "vibe coding" session - a term recently coined by [Andrej Karpathy](https://karpathy.ai/) to describe a new, fluid style of coding where natural language and AI collaboration replace traditional, detail-oriented development workflows.
In just three hours, I prototyped a functioning chessboard UI using [LVGL](https://lvgl.io/) (a library I hadn't touched before) on an ESP32, fully integrated with the [Chessmate](https://chessmate.cloud/) API I'd previously developed.

What made this session remarkable wasn't just the outcome, but the approach: using Cursor and a mix of LLMs like Claude Sonnet and OpenAI's o3, I explored what happens when you treat coding as a high-level collaborative design process - more like pair programming with an indefatigable assistant than line-by-line implementation.

{{< video src="demo.mp4" muted="true" loop="true" >}}

## A Natural Language-Driven Sprint

My aim was to explore rapid prototyping for a visual chessboard display - part of a broader side-project involving PCB design for a standalone electronic chessboard.
The idea was to see how far I could push a _standard_ ESP32 - evaluating screen options and stress-testing its capabilities - before needing to consider more powerful alternatives like the S3 variant or adding external PSRAM; all while integrating with [Chessmate's](https://chessmate.cloud/) existing API for human-vs-bot play modes.

What I found particularly liberating was the shift in abstraction. Instead of working directly in C or C++, I framed problems and intent in natural language.
Cursor, paired with Claude or OpenAI's models, would handle the boilerplate and implementation details.

This style - firmly within the umbrella of vibe coding - let me focus on behavior and high-level structure without micromanaging syntax, library APIs, or compiler quirks.
There's even a [Wikipedia article](https://en.wikipedia.org/wiki/Vibe_coding) now on the subject, and Karpathy's [original tweet](https://x.com/karpathy/status/1886192184808149383) really captures the spirit:

> "There's a new kind of coding I call 'vibe coding', where you fully give in to the vibes, embrace exponentials, and forget that the code even exists..." - @karpathy

## Engineering with AI: Pair Programming at a Higher Level

I've been using AI tools in my workflow for some time, but this was the first session where I fully leaned in - treating the model as the primary driver in a true pair programming setup.
Cursor handled the implementation details with tireless speed and confidence, while I focused on providing a high-level architectural vision and steering the overall direction.
This separation let me spot ideas, design gaps, and opportunities that might be invisible to someone buried in the weeds of the implementation.

On this journey, I found that Claude Sonnet tends to generate more verbose code and explore a broader solution space, often proposing speculative fixes.
OpenAI's o3 model, by contrast, felt more deliberate and reason-driven (well that figures being a reasoning model) - almost like a senior developer pausing to ask clarifying questions before diving into implementation.
When I ran into a race condition between graphics rendering and processing tasks across ESP32 cores, Sonnet cycled through a variety of partial solutions without fully resolving the issue.
o3, however, identified the correct mutex placement and solved the problem in a single, elegant pass - likely because it took the time upfront to review the existing code at a deeper level before making changes.

The REPL-like nature of Cursor's feedback loop was surprisingly addictive.
I was able to converse with the model about rendering lag and memory access problems, ultimately arriving at partial display updates and better task coordination in the process.

## Challenges and Observations

There were rough edges.
At one point, the model became fixated on incorrectly renaming an en passant variable (`from_r` to `from_row`), continuing to reintroduce the change even after I explicitly rejected it and left inline comments.
It would slip the change in alongside other updates, hit linting errors, then revert it - only to try again later.
In the end, I had to manually adjust the line myself - possibly the only line of _real_ code I wrote during the entire session.

I briefly experimented with LVGL v9 but ran into breaking changes.
While I'm confident I could have guided the model through the port with enough time, v8 proved more than sufficient for a fast-paced sprint.

Flashing the ESP32 remained a manual step - Cursor and PlatformIO doesn't yet automate the build-upload loop, although I'm hoping to add [Cursor rules](https://docs.cursor.com/context/rules) soon to close that gap.
Little bits of toil like this compound quickly when iterating frequently, and tighter integration could make this experience even smoother.

Checkpoints in Cursor were useful, but I still made regular Git commits out of habit (and caution).
With more experience, I might learn to trust Cursor's versioning a bit more.

## Reflections on Speed, Focus, and Fulfilment

In the span of just three hours, I managed to explore a new display library (LVGL), integrate an familiar API (Chessmate), and get a working interface running on embedded hardware I don't use every day.
That's a significant return on time, especially when prototyping something as involved as an embedded chessboard UI.

The biggest win, though, wasn't just velocity.
It was being able to stay in a high-level, creative state of mind - thinking in terms of features and flows rather than registers and timers.
It felt more like architectural sketching than engineering.

## What's Next

This prototype now serves as a jumping-off point.
I plan to spend several more hours building out additional functionality - such as custom UCI chessbot configuration, a streamlined WiFi setup process, and automated flashing (the manual process adds up quickly).
During these continued vibe coding sessions, I'll also explore more advanced display options and interaction modes.

There's a lot of hype around AI-assisted coding right now, but at the end of the day, it's just another tool in the belt - one that, when used well, can help you ship ideas faster and focus more on product thinking than syntax juggling.
I'm also interested in exploring [Claude Code](https://www.anthropic.com/claude-code) going forward; the CLI-first approach looks like a promising complement to the GUI-based flow in Cursor.

There's still a lot to build, but vibe coding has given me a compelling new lens on early-stage development.
The fast feedback, expressive workflows, and ability to stay "in flow" make it feel like I'm coding at the speed of thought.
