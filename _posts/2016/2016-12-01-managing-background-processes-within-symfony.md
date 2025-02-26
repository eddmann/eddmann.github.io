---
layout: post
title: 'Managing Background Processes within Symfony'
meta: 'Discover how to efficiently manage background processes within Symfony, leveraging Cron, Supervisor, and continuous process management techniques.'
tags: symfony supervisor php
---

When a web application reaches a sufficiently large size, it can become infeasible to perform all actions required within a single web request/response lifecycle.
You may find yourself wishing to, for example, batch up and send queued emails at particular intervals or process payments asynchronously to the point in time when the user made the initial request.
In this post, I would like to discuss our evolving use of background processes (both time-dependent and continuous) due to increasing throughput demands.

<!--more-->

## Using Cron

At MyBuilder, we have grown to rely heavily on background processes, helping manage the day-to-day activities of the business.
For time-dependent tasks (i.e. run a specific command every 30 minutes), we use the Cron job scheduler to declare and execute the processes at desired intervals.
We found ourselves using this so frequently, in fact, that we created [Cronos](https://github.com/mybuilder/cronos) and the [Cronos Symfony Bundle](https://github.com/mybuilder/cronos-bundle), which allow us to decorate commands we wish to run using a PHP `@Cron` annotation.
Using this system allows us to 'dump' the new `crontab` declaration upon each deployment cycle.
This ensures that our background processes remain in sync with the current released build.
Upon reflection, this also proved to be a success in regard to codebase understandability.
We have found that keeping the interval definition close to the code makes it easier to reason about when entering a piece of functionality.

Below is an example use case of how we would use the `@Cron` annotation within a trivial Symfony command.

```php
/**
 * @Cron(minute="/30")
 */
class SendQueuedEmailsCommand extends Command
{
    public function execute()
    {
        foreach ($this->fetchQueuedEmails() as $email) {
            $this->send($email);
        }
    }
}
```

Above, we are specifying that we would like to send out any queued emails every 30-minute interval.

## The Need for More

However, over time, the demand on these commands and the required throughput has grown significantly.
Reducing the invocation times gave us short-term relief, but eventually, we needed always-running processes.
We even found that, in some cases, a single instance would not suffice, and having multiple workers running would be a requirement too.
To address this need, we created the concept of a `RunManager`, which allowed us to provide commands with a looping process construct.

Looking at the problem of sending queued emails again as a concrete example, let’s say that to manage the load at which we now enqueue emails to be sent, we require an always-running instance of the sender command.
Below, we have made some amendments that will now iteratively keep processing queued emails that are present.

```php
class SendQueuedEmailsCommand extends Command
{
    public function execute()
    {
        $manager = new RunManager();

        while ($manager->isOk()) {
            if ($email = $this->fetchSingleQueuedEmail()) {
                $this->send($email);
            }
        }
    }
}
```

### Run Forever

In an ideal scenario, we would kick off a process and it would run 'forever'.
Unfortunately, certain events may occur throughout its life where the cheapest way of managing its state is to restart it (e.g. allocated memory exceeded).
We got around this problem by first declaring (using the `RunManager`) how many of a process we wished to be present at a time.
We then employed our initial Cron infrastructure to attempt to start the process at a given interval.
This meant that if a process did die, the next Cron invocation would spawn a new instance.
Guarding the command with a maximum process count ensured that only a certain number of instances would be running at a given time.

```php
/**
 * @Cron(minute="/1")
 */
class SendQueuedEmailsCommand extends Command
{
    public function execute()
    {
        $manager = new RunManager(['maxDuration' => 30, 'maxProcesses' => 2]);

        while ($manager->isOk()) {
            if ($email = $this->fetchSingleQueuedEmail()) {
                $this->send($email);
            }
        }
    }
}
```

Although this solved the problem of spawning a capped number of new processes, it introduced a couple of issues.
One of these was when you desired multiple instances of a given process to accommodate a particular expected load.
From a cold start, you would have to wait for multiple Cron invocation attempts before reaching the desired processing power.
Another issue was the unnecessary work Cron would perform at every interval attempting to create a new 'potential' process.
More often than not, the processes created by the Cron invocation would end immediately due to the maximum process cap.
Although a time-based approach could represent 'almost' continuous processes, we needed to take a step back and review our thinking.

## Enter Supervisor

As the story above highlights, there was a gradual transition from a time-based approach (run every 30 minutes) to sometimes warranting a continuous approach (have two processes running at all times).
As demands increased, we slowly innovated on our existing solution to cater to the throughput.
However, what we needed was a change in our way of thinking.
We needed to explicitly separate the concept of a time-based task, which fitted well within the Cron philosophy, from a continuous task.

### Changing our Thinking

After some research, we decided that [Supervisor](http://supervisord.org/) would be a worthwhile investment to incorporate into our stack.
Supervisor is a process control system written in Python, providing the infrastructure to achieve exactly the goals we desired for a continuous process.
Spawning processes as children of the main Supervisor process allows the system to manage how many instances of a given process are currently running and their health.
When a child process dies for whatever reason, the `SIGCHLD` signal is sent to Supervisor, which then decides what action to perform (e.g. restart the process).
This shift in thinking, from "when do I need to attempt to begin running a process" to "I want this many processes running at all times," was hugely beneficial.
Following experimentation, it was time to incorporate this approach into our system and transition our 'almost' continuous processes into true continuous processes.

### The Transition

Transitioning from one system to another can be challenging, especially when it is critical to the business.
With this in mind, we felt it would be ideal to avoid making significant code changes to existing continuous commands.
As a result, we created the [Supervisor Symfony Bundle](https://github.com/mybuilder/supervisor-bundle).
Similar to its Cronos counterpart, this bundle allows you to decorate commands with a PHP `@Supervisor` annotation.
These annotations are then parsed during the 'dump' phase, generating Supervisor-specific configuration.
Due to these similarities, the only required change was to replace the `@Cron` annotation with `@Supervisor`, as shown in the example below.

```php
/**
 * @Supervisor(processes=2)
 */
class SendQueuedEmailsCommand extends Command
{
    public function execute()
    {
        $manager = new RunManager(['maxDuration' => 30]);

        while ($manager->isOk()) {
            if ($email = $this->fetchSingleQueuedEmail()) {
                $this->send($email);
            }
        }
    }
}
```

The transition of these processes from Cron to Supervisor was successfully spaced out over a couple of days. As we had become accustom to automatically dumping out the `crontab` upon each deploy, we were only required to do the same for the Supervisor configuration.

## Let's be Safe

One major omission from this story so far is how to safely handle the transition from one version of a process to another.
At this time the `RunManager` was only able to safely exit activity based on memory, processor and duration limits.
If we were to attempt to terminate a process mid-way through a critical activity we would not know of the lasting side-effects.
This meant that we would have to wait for all process duration limits to be exceeded before we could be sure that processes were stopped, and new versions could be started.
Ideally, what we desired was to be able to safely halt execution of all current processes, run the deploy and then bring back up the processes again with any changes that had been applied.

### Signaling

Upon further research, and with Supervisor's signal based approach in-mind, we decided to take advantage of Unix signaling.
We did this by providing another `RunManager` predicate to safely exit the looping construct found in these processes.
Upon an update request, Supervisor sends out a specified signal (i.e. `SIGTERM`) to each of the running processes.
This meant that we could use the [pcntl PHP extension](http://php.net/manual/en/book.pcntl.php) to listen out for these signals and react accordingly to safely stop the process.
Below is an simplified implementation of how we incorporated Unix signaling into our `RunManager`.

```php
class RunManager
{
    private $ok = true;

    public function __construct(array $options)
    {
        // ...

        pcntl_signal(SIGTERM, function () {
            $this->ok = false;
        });
    }

    public function isOk()
    {
        pcntl_signal_dispatch();

        return $this->ok;
    }
}
```

With this in-place we were now able to perform a Supervisor update upon each deployment.
This would safely finish any work the process was doing (i.e. finish sending the current email) before shutting down and allowing a new version to be spawned.
Unlike the duration-based limits we relied upon in the past, we could now be sure that a new deployment meant that only newly deployed processes were being run.

## SIGSTOP

This transition has been a significant improvement to our stack.
We can now clearly differentiate between time-based commands and continuous processes.
Although the inclusion of Supervisor adds complexity, using the right tool for the job has paid off greatly.
