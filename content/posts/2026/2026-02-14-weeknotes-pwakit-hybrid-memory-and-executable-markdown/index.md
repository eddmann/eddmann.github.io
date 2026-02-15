---
layout: post
title: 'Weeknotes: PWAKit, Hybrid Memory, and Executable Markdown'
meta: 'Building PWAKit for wrapping Progressive Web Apps in native iOS shells, dog-fooding it with HealthKit and local notifications in Step Wars, expanding Jeeves with hybrid memory search and multimodal support, and thinking about prompt injection as the security problem of the agentic era.'
tags: ['weeknotes', 'agents', 'personal-software', 'pwa', 'llm']
---

The big theme this week has been wrapping things up - quite literally, in the case of PWAKit - and expanding what already exists into something more robust.

<!--more-->

## PWAKit

I'm a big proponent of Progressive Web Apps.
I love them.
Android support is excellent - PWAs feel genuinely native there.
But iOS is lagging behind, and having an App Store presence matters.
It's where the eyeballs are, it's where people discover apps, and even though you can make a web experience feel like a native app using PWAs, being _in the store_ is a different thing entirely.

The beauty of PWAs is that **you control the deployment**.
Offline strategies, syncing, pushing new fixes - all without going through an app release cycle.
That fluidity is brilliant.
But you still need that thin native wrapper to get into the App Store.

I'd been using [PWABuilder](https://www.pwabuilder.com/) for this over the past year - wrapping [Chessmate](https://chessmate.cloud/), [Name That Color](https://namethatcolor.cloud/), and [Daily Thing](https://dailything.cloud/) for distribution.
PWABuilder gave me that wrapper, and it worked.
But the source felt dated.
It wasn't leveraging SwiftUI, there were gaps I kept patching - notification tweaks, missing features, rough edges.
I found myself adding the same things on top every time.

So I built [PWAKit](https://github.com/eddmann/pwa-kit) from the ground up.

The core principle: keep everything as web-standard as possible.
I didn't want to learn a new framework or rewrite anything.
I wanted to write my web app the way I already write web apps, and have a thin native shell that gets it into the App Store.
I've [written up comparisons](https://github.com/eddmann/pwa-kit/blob/main/docs/comparison.md) with Capacitor, React Native, Flutter, and native Swift - each has tradeoffs, but for my use case the PWA-first approach wins for most usecases.

The way it works is you supply a URL and the list of native features you want available in the wrapper.
The CLI (`npx @pwa-kit/cli init`) scaffolds an Xcode project with those modules enabled, and a [TypeScript SDK](https://github.com/eddmann/pwa-kit/tree/main/sdk) provides the JavaScript bridge between your web app and the native layer.
I built modules for the things I actually needed across my apps (i.e. HealthKit, haptics, notifications...), and ended up with fifteen of them.
It also provides capabilities for you to expand the wrapper and write your own native modules if desired.

One thing I'm particularly pleased with: **it reads your web manifest**.
Theme colour, background colour, app name, app icon - if you've already done the work to make a _proper_ PWA, the wrapper just picks it up.
That felt right.
The wrapper should be as invisible as possible.

The feature modules are currently enabled at runtime based on config.
I'd like to move this to compile-time eventually - Swift macros to only include what you need - but runtime works for now.

I also built a [**Kitchen Sink demo**](https://github.com/eddmann/pwa-kit/tree/main/example) that exercises every module.
It's mostly for my own testing and validation, but it doubles as a way to explore how each feature actually behaves on device.

![PWAKit splash screen](pwa-kit-splash.png) ![PWAKit Kitchen Sink - module list](pwa-kit-kitchen-sink.png) ![PWAKit Kitchen Sink - local notifications](pwa-kit-notifications.png)

## Dog-fooding: Step Wars Goes Native

The real test of any tool is whether you'd use it yourself.

I'd already wrapped [F1 Picks 2026](https://github.com/eddmann/f1-picks-2026) with PWAKit - a simple wrapper that needed no native features.
But [Step Wars](https://github.com/eddmann/step-wars) was the real dog-fooding exercise.

Step Wars needed three things from the native layer: **haptic feedback**, **local notifications**, and **HealthKit**.

The HealthKit integration was the most interesting addition.
Step Wars can now query iOS HealthKit directly - current step counts, yesterday's totals, whatever the challenge needs - and upload them automatically.
No manual entry.
It starts to feel like a _real_ native app.
Like opening Garmin Connect or the Health app on your phone - the data just syncs and it works.

Haptic feedback handles the confirmations - that satisfying vibration when you submit your steps, confirm an action.
Small touches that make the experience feel native.

And local notifications send a daily reminder at 8am to make sure you've uploaded your steps.
I'm planning to expand this to push notifications from the backend eventually - alerts when a challenge is ending and you haven't submitted, that kind of thing.
But local notifications are a good start.

What I like about this setup is that the web app doesn't change.
You can still enter steps manually in a browser - the PWA works as it always did.
The native features just layer on top when you're on iOS.
It's additive, not a rewrite.

![Step Wars with HealthKit integration](step-wars-healthkit.png)

## Coding Agent: Refactoring with GPT‑5.3‑Codex

I continued refactoring [My Own Coding Agent](https://github.com/eddmann/my-own-coding-agent) this week, with two big threads: testing philosophy and model support.

On the testing side, I noticed the existing coverage was leaning heavily into **implementation details** - the London school approach.
Mocking internals, asserting on how things were called - I wanted to move toward **Detroit/Chicago-style** coverage.
Test at the public API boundary, double the external collaborators, and let the tests tell you _what_ broke rather than just _that_ something moved.

This is the approach [Ian Cooper](https://www.youtube.com/watch?v=EZ05e7EMOLM) and Kent Beck advocate for, and it's what I described [last week](../2026-02-08-weeknotes-throwaway-tools-sessions-as-trees-and-building-a-personal-ai-assistant/) with F1 Picks and Step Wars.

What's interesting is that this testing refactoring also improved the architecture.
Thinking carefully about what constitutes a public API boundary forces you to think about module boundaries, dependency direction, and what's actually stable.
Better tests led to better structure.

The other thread was model support.
I added **[GPT‑5.3‑Codex](https://openai.com/index/introducing-gpt-5-3-codex/)** support at the beginning of the week, which means you can now use your ChatGPT subscription with the agent.
I also revisited **OpenRouter** support and played with local language models - using OpenRouter as an OpenAI-compatible LLM provider, and running models locally using [Ollama](https://ollama.com/).
Documented all of that too, which was a satisfying exercise in itself.

The workflow from previous weeks continues to evolve but the shape is the same.
**Opus 4.6 for quick iteration** - tight REPL loops, tracer bullets, fast feedback.
**GPT‑5.3‑Codex for big architectural thinking** - structural changes, refactoring, rethinking boundaries.
The new GPT‑5.3‑Codex gave me a great opportunity to exercise this: using it for the testing refactoring, letting it reason about module boundaries and test design while I focused on direction.

One observation that keeps surprising me: **I don't think about context windows anymore** when working with GPT‑5.3‑Codex.
I just talk.
The compaction is intelligent enough that I don't see regressions even in long sessions with big architectural changes.
The model maintains coherence across compaction boundaries in a way that feels seamless.
I could be making big structural changes, splitting modules, reorganising tests - and the model tracks it all through compaction without missing a beat.

## Jeeves: Hybrid Memory and Multimodal

I managed to spend a little more time on [Jeeves](https://github.com/eddmann/jeeves) this week, building on the conversation I had with [TJ Miller](https://tjmiller.me/) about memory last week.

The biggest addition is the **long-term memory system** - a hybrid search index using SQLite.
[FTS5](https://www.sqlite.org/fts5.html) handles keyword search, and [`sqlite-vec`](https://github.com/asg017/sqlite-vec) provides native vector similarity search using OpenAI embeddings.
This is wired into a context compaction pipeline so the agent can summarise and persist knowledge from long conversations.

I've ended up somewhere close to what [OpenClaw](https://openclaw.ai/) does at the moment, with a couple of ideas I'm working on that expand beyond it.
The combination of lexical and semantic search means Jeeves can find relevant memories whether I use the exact same words or just related concepts.

Beyond memory, I added **new tools** - edit tools, web search - and made Jeeves **multimodal**.
You can now send photos, voice messages, and reply to previous messages with context.
Jeeves understands all of these, which opens up much richer interactions than pure text.

I also fixed some internal details around caching with the Anthropic API - an interesting one where stale `cache_control` markers were causing issues with the block limit.

Next step: making it bidirectional.
I want Jeeves to be able to _send_ photos and voice messages back, not just receive them.
Full conversational multimedia.

## Compiled Conversations: Chris Brousseau

I released [episode 19](https://compiledconversations.com/19/) of Compiled Conversations this week - a conversation with [Chris Brousseau](https://www.linkedin.com/in/chris-brousseau/), co-author of [_LLMs in Production_](https://www.manning.com/books/llms-in-production) and VP of AI at Veox AI.
I'm a big fan of his book, and this was a conversation I recorded at the tail end of last year that I finally got around to releasing.

What made this episode special was Chris's path into LLMs.
He came from **linguistics** - semiotics, translation, how meaning is created in language.
A graduate seminar on Python and machine translation in 2017 pulled him into NLP, and that linguistic foundation gives him a fundamentally different lens on what these models can and can't do.

We went deep.
The fundamentals - transformers, tokenisation, word embeddings, the training pipeline from self-supervised learning through RLHF to supervised fine-tuning.
The production side - lessons from deploying multi billion-parameter models at MasterCard and JP Morgan Chase, the gap between demos and real systems.
And some fascinating tangents: how logic manipulation and context-free grammars can make a 2023-era 7B model outperform frontier models at maths, the evolution from prompt engineering to context engineering, and the stochastic parrots debate through the lens of semiotics.

What I really wanted from this episode was a conversation that went deeper into the LLM stuff than the usual surface-level takes, and Chris delivered.
The linguistics background provides a grounding that's rare in these discussions - understanding both the strengths and the fundamental limitations of language models.

## Executable Markdown and the Trust Problem

[ThePrimeagen's video on skills](https://www.youtube.com/watch?v=Y2otN_NY75Y) this week articulated something that's been nagging at me.

**Prompt injection is the SQL injection of the agentic era.**

In traditional security, we learned the hard way to separate code and data.
SQL injection happens when you treat them as the same thing - user input flows directly into executable queries.
The solution was clear: parameterised queries, prepared statements, sanitise your inputs.
Separate the channels.

But with LLMs, we're back to the same fundamental problem.
A prompt is _both_ instruction and data.
The system prompt, the user's request, the context from tools and files - it's all mixed together in one stream that the model interprets holistically.
There's no clean separation between what's "code" (the instructions) and what's "data" (the content being processed).

And skills make this worse.
A skill is a Markdown file.
**Markdown as an executable.**
When you pull down a skill from a hub - if you haven't read it, haven't verified it - you're essentially running an untrusted executable on your machine.

The examples from the video are sobering: malicious instructions hidden in comments that don't render in GitHub-style review but agents faithfully follow, and hallucinated npm packages that an attacker could squat on.

Peter Steinberger is working on verification for the OpenClaw skill hub - scanning and checking that skills are safe.
But this is fundamentally hard.
All the basic principles of security - least privilege, defence in depth, separation of concerns - get blurred in the agentic world.

Because here's the tension: **security is friction, and usefulness comes from giving agents access**.
The magic happens when you let agents operate mostly autonomously with broad access to your machine, your codebase, your services.
But that's exactly the access an injected prompt would exploit.

Simon Willison calls this the **[lethal trifecta](https://simonwillison.net/2025/Jun/16/the-lethal-trifecta/)**: an agent that can read private data, take actions (send emails, execute code), _and_ process untrusted content.
Any two of those are manageable; all three together and a successful prompt injection becomes a full compromise.
Jeeves pointed this out to me itself, unprompted - it ticks all three boxes.

![Jeeves discussing the lethal trifecta](jeeves-lethal-trifecta.png)

We need to be thinking about this seriously as the ecosystem matures.
It's not a solved problem.
It may not be solvable in the traditional sense.
But awareness matters.

## What I've Been Watching/Listening To

**Articles:**

- [The Final Bottleneck](https://lucumr.pocoo.org/2026/2/13/the-final-bottleneck/) - Armin Ronacher on how AI has shifted the bottleneck from writing code to reviewing it, creating unsustainable backlogs
- [A Language for Agents](https://lucumr.pocoo.org/2026/2/9/a-language-for-agents/) - Armin Ronacher on why agent-friendly language design may matter as much as human-friendly design
- [Pi: The Minimal Agent Within OpenClaw](https://lucumr.pocoo.org/2026/1/31/pi/) - Armin Ronacher on Pi's self-extension philosophy
- [Introducing GPT-5.3-Codex-Spark](https://simonwillison.net/2026/Feb/12/codex-spark/) - Simon Willison on OpenAI's new fast model from the Cerebras partnership, ~1,000 tokens/second
- [A Complete Guide to AGENTS.md](https://www.aihero.dev/a-complete-guide-to-agents-md) - progressive disclosure for agent instructions
- [Skill Test-Driven Development for Claude Code](https://www.aihero.dev/skill-test-driven-development-claude-code) - a TDD skill that enforces one-test-one-implementation vertical slicing
- [ypi: A Recursive Coding Agent](https://raw.works/ypi-a-recursive-coding-agent/) - a recursive agent built on Pi that delegates sub-problems to itself
- [DeepWiki](https://deepwiki.com/) - conversational AI documentation for GitHub repositories

**Podcasts/Videos:**

- [OpenClaw: The Viral AI Agent that Broke the Internet](https://www.youtube.com/watch?v=YFjfBk8HI5o) - Peter Steinberger on Lex Fridman Podcast #491, covering OpenClaw's journey, self-modifying agents, and the agentic future
- [Be Careful w/ Skills](https://www.youtube.com/watch?v=Y2otN_NY75Y) - ThePrimeagen on prompt injection, executable markdown, and why skills are the new attack surface
- [What Skills Do Developers NEED To Have In An AI Future?](https://www.youtube.com/watch?v=lJiDBRh96oU) - Kent Beck on the skills that matter as AI reshapes development

**X/Twitter:**

- [Max Musing - "The vibe coding trap"](https://x.com/maxmusing/status/2021990855741936072) - the difference between the cost of building software and the cost of owning it
- [Thorsten Ball - "I am the bottleneck now"](https://x.com/thorstenball/status/2022261665257971800) - on humans becoming the constraint in agent-assisted development
- [Matt Pocock on TDD with Claude Code](https://x.com/mattpocockuk/status/2022036754648166527) - his new skill that enforces real behaviour-validating tests instead of dozens of implementation-coupled ones
- [Theo - "The Agentic Code Problem"](https://x.com/theo/status/2018091358251372601) - the mental overhead of parallel agent workflows across terminals, browsers, and projects - our tools weren't built for how we work now
- [Andreas Klinger - "Software Development is f\*\*d"](https://x.com/andreasklinger/status/2022339447769977134) - custom, disposable, one-shot software as the norm, why GitHub may be obsolete, and why prompt injection could be bigger than SQL injection

---

A recurring thread this week across everything I read, watched, and built: **where does the human sit in this loop?**

Armin Ronacher argues the [bottleneck has shifted](https://lucumr.pocoo.org/2026/2/13/the-final-bottleneck/) from writing code to reviewing it.
Thorsten Ball says he's the bottleneck now.
ThePrimeagen points out that the security model assumes a human in the loop - but we keep removing the human to get the speed.

I feel this tension every day.
The productivity gains from letting agents run autonomously are real - PWAKit, the test refactoring, the Jeeves memory system, all of it moves faster when I step back and let the model work.
But stepping back means trusting.
And trust in a world of executable markdown and prompt injection requires a kind of vigilance that's new to our discipline.

We haven't figured this out yet.
But at least we're talking about it.
