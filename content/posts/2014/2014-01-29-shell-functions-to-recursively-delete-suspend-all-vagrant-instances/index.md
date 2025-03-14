---
layout: post
title: 'Shell Functions to Recursively Delete/Suspend all Vagrant Instances'
meta: 'Learn how to manage and automate deletion or suspension of Vagrant instances with recursive shell functions for a smoother development workflow.'
summary: 'I have been using Vagrant exclusively for almost a year now and am still loving it, even with the introduction of Docker. One issue I do find that arises is managing currently running and obsolete instances.'
tags: ['vagrant']
---

I have been using [Vagrant](http://www.vagrantup.com/) exclusively for almost a year now and am still loving it, even with the introduction of [Docker](https://www.docker.io/).
One issue I do find that arises is managing currently running and obsolete instances.
Port conflicts can be a huge pain to correct if you are like me and use Vagrant for many different projects at one time, resorting to loading up VirtualBox.
To help ease the pain I have created two shell script functions (tested in Bash) for recursively locating and either deleting or suspending Vagrant instances it finds.

```bash
function vagrant-destroy-all() {
    DIR=${1:-$(pwd)}
    find $DIR \
        -type d \
        -name .vagrant \
        -exec sh -c '(cd $(dirname {}) && pwd && vagrant destroy -f)' \;
}
```

```bash
function vagrant-suspend-all() {
    DIR=${1:-$(pwd)}
    find $DIR \
        -type d \
        -name .vagrant \
        -exec sh -c '(cd $(dirname {}) && pwd && vagrant suspend)' \;
}
```

The two functions above allow you to provide a starting directory to locate instances, based on the existence of a '.vagrant' directory.
If no path is provided the present working directory is used instead.
Finally, progress of each found instance and actions taken is printed to the terminal.
