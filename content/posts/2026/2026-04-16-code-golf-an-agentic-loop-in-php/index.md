---
layout: post
title: "Code Golf: An Agentic Loop in PHP"
meta: "Building a working AI agent with tool calling in under 1KB of PHP, using Ollama for local inference and a single shell tool."
tags: ["php", "ai", "code-golf"]
---

There has been a lot of discussion recently about _agent frameworks_ - orchestration layers, SDKs, harnesses.
Over lunch I found myself curious about how much of that is actually essential.
How small could a working _agentic loop_ be, whilst still doing useful work?
The result is 821 bytes of PHP, running entirely locally via [Ollama](https://ollama.com/) with a single shell tool - and it turns out that gets you surprisingly far.

<!--more-->

## Why PHP?

The reason PHP wins this particular golf is `file_get_contents()`.
Combined with `stream_context_create()`, it performs a full HTTP POST and returns the response body as a string - all in a single synchronous expression with no imports.
Other languages have built-in HTTP support (Python's `urllib`, Node's `fetch`), but they are either more verbose or require async handling.
PHP's version happens to be the most compact for inline use, which matters when you are counting bytes.

## Building the Agent

The full agent is five lines, but there are really only four ideas: conversation state, calling the model, printing the answer, and executing tools.
I will walk through each piece, using extracted variables for readability, before composing them together into the final result.

### Conversation History

```php
$messages = [['role' => 'system', 'content' => 'shell agent']];
```

The entire conversation lives in a single array.
Every user message, assistant reply, and tool result gets appended here and sent back on every request - the model sees the full history of what has happened.
It should be noted that a two-word _system prompt_ is enough to bias the model toward using the shell tool rather than guessing answers.

### Reading User Input

```php
while ($input = readline('> ')) {
    $messages[] = ['role' => 'user', 'content' => $input];
```

The outer loop reads user input with a `> ` prompt.
`readline` returns false on EOF, which exits the programme cleanly.
Each input is pushed to the conversation history as a user turn.

### Calling the Model

```php
$tool = [
    'type' => 'function',
    'function' => [
        'name' => 'sh',
        'parameters' => [
            'type' => 'object',
            'properties' => ['c' => ['type' => 'string']],
        ],
    ],
];

$body = json_encode([
    'model'    => 'qwen3.5:35b-a3b',
    'messages' => $messages,
    'tools'    => [$tool],
    'stream'   => false,
]);
```

The _tool schema_ defines a single function called `sh` with one string parameter `c` - that is the entire contract between our code and the model.
The model decides what commands to run; we just execute them.
In the minified version this tool definition becomes an inline JSON string, but the structure is the same.

The request body is rebuilt each iteration, though the model name, tool schema, and `stream: false` are all static - only `$messages` changes.

```php
$ctx = stream_context_create(['http' => [
    'method'  => 'POST',
    'content' => $body,
]]);

$response = json_decode(
    @file_get_contents('http://localhost:11434/api/chat', 0, $ctx)
);

$assistant = $response->message;
$messages[] = $assistant;
```

We POST to Ollama's native `/api/chat` endpoint, which returns the assistant's response at `->message` directly.
The `@` suppresses a harmless PHP notice about the missing `Content-Type` header - Ollama parses JSON regardless.
The assistant's message is then pushed to history immediately so the model sees its own prior turns on subsequent iterations.

### The Agent Loop

```php
for (;;) {
    // ... call the model ...

    if (empty($assistant->tool_calls)) {
        echo "< $assistant->content\n";
        break;
    }

    // ... execute tools ...
}
```

This inner `for(;;)` is the _agent loop_ itself.
After each model call, we check whether the response contains _tool calls_.
If it does not, the model is done thinking - we print the final answer and `break` back to the readline prompt.
If it does, we execute the requested tools, append the results to history, and loop again.
The model sees those tool results on the next iteration and decides whether to run more commands or produce an answer.

### Executing Tool Calls

```php
foreach ($assistant->tool_calls as $call) {
    $cmd = $call->function->arguments->c;
    $output = shell_exec("{ $cmd\n} 2>&1");

    $messages[] = [
        'role'         => 'tool',
        'tool_call_id' => $call->id,
        'content'      => "$output",
    ];
}
```

For each tool call the model requested, we extract the command string from the arguments (Ollama's native API returns these pre-parsed as objects, so no `json_decode` is needed) and execute it via `shell_exec`.

The _brace group_ `{ $cmd\n}` is worth noting.
We need `2>&1` to capture stderr alongside stdout, but appending it directly to the command breaks _heredocs_ - `EOF 2>&1` is not a valid heredoc terminator.
Wrapping in a brace group puts `2>&1` on the group instead, so `EOF` stays on its own line.
I found this the hard way; the fix cost 8 bytes and eliminated an entire class of retry failures during evaluation.

Each tool result is pushed to the conversation history with the matching `tool_call_id`, so the model can pair which result goes with which request.

## The Composed Result

With all the pieces now in place, we can compose the entire agent into five lines:

```php
<?php $m=[['role'=>'system','content'=>'shell agent']];
while($i=readline('> ')){$m[]=['role'=>'user','content'=>$i];for(;;){
$m[]=$g=json_decode(@file_get_contents('http://localhost:11434/api/chat',0,stream_context_create(['http'=>['method'=>'POST','content'=>'{"model":"qwen3.5:35b-a3b","messages":'.json_encode($m).',"tools":[{"type":"function","function":{"name":"sh","parameters":{"type":"object","properties":{"c":{"type":"string"}}}}}],"stream":false}']])))->message;
if(!$t=@$g->tool_calls){echo"\e[36m< ".strtr($g->content,["\n"=>"\n< "])."\e[0m\n";break;}
foreach($t as$c){$x=$c->function->arguments->c;echo"\e[33m$ ".strtr($x,["\n"=>"\n  "])."\e[0m\n";$o=shell_exec("{ $x\n} 2>&1");echo"\e[90m│ ".strtr(rtrim("$o"),["\n"=>"\n│ "])."\e[0m\n";$m[]=['role'=>'tool','tool_call_id'=>$c->id,'content'=>"$o"];}}}
```

This version also includes ANSI colour codes - `$` commands in yellow, `│` output in grey, `<` answers in cyan - so you can visually trace the agent's reasoning.
Stripping colours and formatting down to the bare minimum gets it to 594 bytes.

## Running It

```bash
ollama pull qwen3.5:35b-a3b
ollama serve
php agent.php
```

The model runs locally via Ollama, which gave me a nice test bed to explore [qwen3.5:35b-a3b](https://ollama.com/library/qwen3.5:35b-a3b) - a MoE model with roughly 3B active parameters that handles tool calling well for its size.

## Evals

I ran four evals to see how far a single shell tool actually gets you.

The first was a _codebase exploration_ - I asked it to survey a Python project, count files, and find TODOs.
It ran `ls`, `cat`, `find`, and `grep` across the project, identified four Python files and two TODOs in the codebase, all in five tool calls.

{{< video src="eval1.mp4" muted="true" loop="true" >}}

For _system inspection_, I asked for the OS, free disk space, and top processes by memory.
It ran `uname`, `df`, and `ps`.
On the first attempt it used Linux-style `ps --sort` flags, hit a BSD error on macOS, and retried with the correct syntax unprompted - a nice demonstration of the self-correcting nature of the loop.
Five tool calls in total.

{{< video src="eval2.mp4" muted="true" loop="true" >}}

I then pointed it at an access log and asked for the most active IP, failure rate, and any suspicious activity.
It used `awk` and `grep` to parse the log, calculated a 40% failure rate, and flagged a brute-force login pattern - two 401s followed by a 200 from the same IP.
Five tool calls.

{{< video src="eval3.mp4" muted="true" loop="true" >}}

The most ambitious eval was asking it to write a Python CLI todo app with add/list/done commands, persisting to JSON, and then test it end-to-end.
It wrote the entire file via _heredoc_ in a single tool call, then ran the full test sequence: add two tasks, list them, mark one done, list again, and verify the JSON persistence on disk.
Seven tool calls, without any further input from me.

{{< video src="eval4.mp4" muted="true" loop="true" >}}

## One Tool Goes a Long Way

What surprised me most from the evals was how far a single shell tool gets you.
File I/O, system introspection, data analysis with `awk` and `grep`, writing and executing code, even verifying its own output - all through one function called `sh`.
Many _agent frameworks_ ship with dozens of specialised tools for file reading, web search, code execution and so on.
It turns out a shell command subsumes most of them, because the model already knows how to compose `ls`, `cat`, `grep`, `curl`, `python` and everything else available on the machine.
The constraint also keeps the tool schema tiny (~120 bytes of JSON), which leaves more of the context window for the actual conversation.

## Under the Frameworks

Looking back at the implementation, the whole _agentic loop_ really is just two nested loops.
The outer loop reads user input.
The inner loop calls the model - if it wants tools, execute them and loop; if it returns an answer, print it and break.

That is it.
The _agent frameworks_ everyone is building wrap this loop in configuration, error handling, tool registries, and retry logic - all useful in production, but not fundamental to the pattern itself.
Under all that scaffolding, the core is a `for(;;)` (or `while(true)` if you prefer) with a break condition.
