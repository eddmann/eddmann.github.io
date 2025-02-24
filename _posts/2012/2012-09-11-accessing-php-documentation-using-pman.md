---
layout: post
title: "Accessing PHP documentation using 'pman'"
meta: "Learn how to quickly access PHP documentation from the terminal using 'pman', complete with installation instructions and a script for random manual page selection."
tags: php
---

PHP has a ridiculous amount of in-built functions.
Even though I code in it daily, I am still surprised to find a new one.
It was not until recently that I discovered `strip_tags`, which saved me an ample amount of time that I would have spent writing my own implementation.
My philosophy now is that if there is a function you require, PHP most likely already has it.

<!--more-->

In spite of this wealth of functions, however, I hate having to load a browser to visit [php.net](http://php.net/).
I now spend too much time in the terminal.
I love the UNIX ethos of being able to run a 'man' command to quickly display documentation on a specific command.
What I want is the same capability for PHP functions.
Thankfully, this need has been fulfilled in the form of 'pman'.

## Installation

Installing 'pman' is incredibly easy using PEAR.
All you have to do is run the command below:

```bash
$ pear install doc.php.net/pman
```

Once the installation has been successfully completed, you can access manual pages for PHP functions by calling 'pman' followed by the function name.
For example:

```bash
$ pman strip_tags
```

## I'm feeling lucky

As an extra treat to get acquainted with as many functions as possible, I have created a simple bash script.
Although it is a very crude implementation, it randomly selects a PHP manual page and displays it.

```bash
function rpman() {
  cd `pman -w`
  cd `ls | head -1`
  a=(*);
  func=$(echo ${a[$((RANDOM % ${#a[@]}))]} |
         sed -E 's/([^0-9]).[0-9].gz/\1/')
  pman $func
}
```
