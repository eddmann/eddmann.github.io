---
layout: post
title: 'Managing Background Processes within Symfony'
canonical: https://tech.mybuilder.com/managing-background-processes-within-symfony/
meta: 'Looking into managing background processes within Symfony'
---

When a web application reaches a sufficiently large size, it can become infeasible to perform all actions required within a single web request/response life-cycle.
You may find yourself wishing to for example - batch up and send queued emails at particular intervals, or process payments asynchronous to the point in-time the user made the initial request.
In this post I would like to discuss our changing use of background processes (both time-dependent and continuous) due to increasing throughput demands.

<!--more-->

## Using Cron

At MyBuilder we have grown to rely heavily on background processes, helping manage the day-to-day activities of the business.
For time-dependent tasks (i.e. run a specific command every 30 minutes) we use the Cron job scheduler, to declare and execute the processes at desired intervals.
We found ourselves using this so frequently in-fact that we created [Cronos](https://github.com/mybuilder/cronos) and the [Cronos Symfony Bundle](https://github.com/mybuilder/cronos-bundle), which allows us to decorate Commands we wish to run using a PHP `@Cron` annotation.
Using this system allows us to 'dump' the new `crontab` declaration upon each deployment cycle.
This ensures that our background processes remain in-sync with the current released build.
Upon reflection, this also proved to be a success in-regard to code-base understandability.
It has been found that keeping the interval definition close to the code, makes it easier to reason about when entering a piece of functionality.

Below is an example use-case of how we would use the `@Cron` annotation within a trivial Symfony command.

```php?start_inline=1
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

Above we are specifying that we would like to send out any queued emails every 30 minute interval.

## The Need for More

However, over-time the demand on these commands and throughput required has grown and grown.
Reducing the invocation times gave us short-term aid, but eventually we were in need of always running processes.
We even found that in some cases the need was so great that a single instance would not suffice, and having multiple workers running would be a requirement too.
With this need to address we created the concept of a `RunManager`, which allowed us to provide Command's with a looping process construct.

Looking at the problem of sending queued emails again as a concrete example.
Lets say that to mange the load at which we now enqueue emails to be sent, would require us to have an always running instance of the sender command.
Below we have made some amendments, which will now iterativity keep processing queued emails that are present.

```php?start_inline=1
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

In an ideal scenario we would kick off a process and it would run 'forever'.
Unfortunately certain events may occur throughout its life where-by the cheapest way of managing its state is to restart it (i.e. allocated memory exceeded).
We got around this problem by firstly declaring (using the `RunManager`) how many of a process we wished to be present at a time.
We were then able to employ our initial Cron infrastructure, to attempt to start the process at a given interval.
This meant that if a process did die, the next Cron invocation would spawn a new instance.
Guarding the command with a maximum process count, meant that we could be sure that only a certain amount of instances would be running at a given time.

```php?start_inline=1
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

Although this solved the problem of spawning a capped number of new processes, it did introduce a couple of issues.
One of which was when you desired to have multiple of a given process running to accommodate for a particular expected load.
From a cold-start you would have to wait for multiple invocation attempts from Cron to occur before you were at the desired processing power.
Another point of contention was the unnecessary work Cron would do every interval in an attempt to create a new 'potential' process.
More often than not the processes created by the Cron invocation would be ended immediately due to the maximum process cap.
It seemed that although possible to use a time-based approach to represent 'almost' continuous processes, we needed to take a step back and review our thinking.

## Enter Supervisor

As the story above highlights; there was a gradual transition from the need to always have a time-based approach (run every 30 minutes) to sometimes warranting a continuous approach (have two processes running at all times).
As the demands increased we slowly innovated on our existing solution to cater for the throughput, however, what we needed to do was change our way of thinking.
We needed to explicitly separate the concept of a time-based task which fitted well within the Cron philosophy and a continuous task.

### Changing our Thinking

After some research we decided that [Supervisor](http://supervisord.org/) would be a worthwhile investment to incorporate into our stack.
Supervisor is a process control system written in Python, which provides the infrastructure to achieve the exact goals we desired from a continuous process.
Spawning processes as a child of the main Supervisor process, it allows the system to manage how many of a given process are currently running and the health of each one.
When a child process dies for whatever reason the `SIGCHLD` signal is sent to Supervisor, which is then able to decide what action to perform (i.e. restart the process).
Being able to now change our way of thinking from 'when do I need to attempt to begin running a process' to 'I want this many processes running at all times' was a hugely beneficial gain.
Following experimentation it was time to try and incorporate this approach into our system, and transition over our 'almost' continuous processes, into true continuous processes.

### The Transition

Transitioning from one system to another can be a challenging task, especially when it is so critical to the business.
With this in mind, we felt it would be ideal not to have to change much in-way of the code relating to the existing continuous commands.
As a result of this desire we created the [Supervisor Symfony Bundle](https://github.com/mybuilder/supervisor-bundle), which in a similar manner to its Cronos counterpart allows you to decorate Commands with a PHP `@Supervisor` annotation.
These annotations are then parsed during the 'dump' phase and a Supervisor specific configuration is made available.
Due to the similarities this meant that all that was required was to replace the `@Cron` with `@Supervisor` annotations (as shown in the example below).

```php?start_inline=1
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

## Lets be Safe

There has been one key omission from this story so far, that I would now like to discuss.
Another pain point within our Cron setup, was how to safely handle the transition from one version of a process to another.
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

```php?start_inline=1
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

Upon review, I feel that this change has been a great addition to our stack and process.
We are now able to clearly differentiate between a time-based command (of which there are many still present) and a continuous process.
Although complexity of course has increased in-regard to the inclusion of Supervisor, using the right tool for the job has paid off greatly.
