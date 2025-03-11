---
layout: post
title: 'Basic Shell Job Control in Unix'
meta: 'Master Unix Shell Job Control to manage background processes and efficiently handle jobs in Unix-based operating systems with this practical guide.'
tags: ['unix', 'shell']
---

Within Unix-based operating systems the concept of [Job Control](<http://en.wikipedia.org/wiki/Job_control_(Unix)>) provides you with the ability to manage multiple 'batch jobs'.
Appending a single ampersand (&) to a command instructs the shell to fork and execute the action in a separate sub-shell. <!--more-->
This creates a background job, providing asynchronous, parallel computation to take place.
Once the job has been created, the shell returns an immediate success signal, allowing for further script command execution or returning the focus of the cursor back to the user.
The forked background process will still be attached to its parent, meaning any resulting output will still be displayed in the terminal.
The process ID (PID) of this new job is stored in a special variable called '$!', allowing you to easily refer back to it at a later date.
Below is an example of sending a copy command to a background process.

```bash
$ cp /path/to/file /path/to/destination/file &
[1] 50024 # example returned PID
```

You are able to list the currently active jobs within the shell instance using the command 'jobs'.

```bash
$ jobs
[1]+  Running  cp /path/to/file /path/to/destination/file &
```

You can return to a background process by requesting it be transferred to the foreground, using the 'fg' command.
Using the 'jobs' output, we are able to specify a job number as an argument to the command, or by default it will act upon the job with a '+' supplied.

```bash
$ fg %1 # optional job number
```

From here, you are able to issue any desired kill (Ctrl-C) or suspend (Ctrl-Z) commands.
If you forget or no longer wish to run the current command in the background, you can suspend (pause) the action and then run 'bg'.

```bash
$ cp /path/to/file /path/to/destination/file
[1]+  Stopped  cp /path/to/file /path/to/destination/file
$ bg
[1]+  Running  cp /path/to/file /path/to/destination/file
```

Finally, you can kill a job without having to bring it back to the foreground by calling the 'kill' command and optionally specifying a number (similar to the 'fg' command).

```bash
$ kill %1 # optional job number
```
