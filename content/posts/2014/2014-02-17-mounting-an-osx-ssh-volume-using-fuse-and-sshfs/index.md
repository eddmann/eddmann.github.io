---
layout: post
title: 'Mounting an OSX SSH Volume using FUSE and SSHFS'
meta: 'Learn how to mount a remote SSH directory on OSX using FUSE and SSHFS with this step-by-step guide.'
tags: ['osx', 'ssh']
---

[FUSE for OSX](http://osxfuse.github.io/) is a Mac OSX port of the popular [Filesystem in Userspace](http://en.wikipedia.org/wiki/Filesystem_in_Userspace) (FUSE) software, and a successor to MacFUSE.
Once installed, you have the ability to mount many different types of remote and local filesystems in user space, without the need to alter the kernel.
An example filesystem that I have found to be very useful is [SSHFS](http://en.wikipedia.org/wiki/SSHFS), which allows you to interact with files located on a remote server via the SSH protocol.
Once mounted, the specified remote directory can be accessed as if it were a local volume.

<!--more-->

## Example Usage

With both FUSE for OSX and SSHFS installed, you can simply add a new mounted volume in the terminal using the command below.
An issue that you have surely encountered is OSX's tendency to pollute directories with `.DS_Store` files.
However, this can be disabled on a mount-by-mount basis by including the 'noappledouble' option.

```bash
$ mkdir ~/example
$ sshfs user@host:/example ~/example -oauto_cache,reconnect,defer_permissions,negative_vncache,noappledouble,volname=Example
```

Looking at the example command above, you will notice that you must first create the directory ('example') to which we wish to mount the remote filesystem.
Finally, once we are done with the volume, we can unmount it using the command below.

```bash
$ umount ~/example
```
