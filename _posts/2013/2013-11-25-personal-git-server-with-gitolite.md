---
layout: post
title: 'Personal Git Server with Gitolite'
meta: 'Discover how to create your own centralised Git server with Gitolite for enhanced access control and custom repository management.'
tags: git gitolite
---

Github and Bitbucket are great, however, there may come a time when you wish to set up a personal Git server.
There are many reasons for this, you may legally not be permitted to host the repository externally, or you want to have more control over access privileges.
[Gitolite](http://gitolite.com/gitolite/index.html) is here to help remedy this desire, allowing you to simply set up Git hosting on a central server with fine-grained access control capabilities.

<!--more-->

In this post I will take you through the steps required to set up Gitolite on a base CentOS 6.4 installation.
I will assume you have such an installation (or equivalent) available throughout the post.

## Installation

The first step is to add the [EPEL](http://fedoraproject.org/wiki/EPEL) repository (if not already present), along with installing Git and Gitolite using YUM.
Alternatively, you are able to install Gitolite from [source](http://github.com/sitaramc/gitolite), instructions of which can be found there.

```bash
$ sudo rpm -Uvh http://download.fedoraproject.org/pub/epel/6/x86_64/epel-release-6-8.noarch.rpm
$ sudo yum install -y git gitolite3
```

Gitolite intuitively uses a Git repository itself to handle the hosted repositories and user accounts.
We will be assuming that you wish to use your current logged-in account for initial management of this repository - and as such we must create an SSH key-pair (if not already present).
We then copy over the public key to a location accessible to a new account we will be creating next.

```bash
$ ssh-keygen -q -t rsa -C "your@email.com"
$ cp ~/.ssh/id_rsa.pub /tmp/server.pub
```

It is best practice to set up and access your Gitolite server from its own dedicated locked-down user account.
The 'gitolite setup' command below will add the copied over public key to the list of users able to manage the admin repository.

```bash
$ useradd -U git
$ sudo su - git
$ gitolite setup -pk /tmp/server.pub
$ rm /tmp/server.pub
$ exit
```

## Usage

With the initial setup now complete, from the previously used account we can list the available repositories and clone the admin repository.

```bash
$ ssh git@localhost info
$ git clone git@localhost:gitolite-admin.git
```

We are now able to manage the server's repositories and user access privileges from 'conf/gitolite.conf'.
Adding and then committing/pushing the following change will create a new empty repository called 'helloworld' which everyone has read/write access to.

```text
repo helloworld
    RW+ = @all
```

Finally, you are able to follow the same commit/push routine when adding users' public keys to the 'keydir' directory.
Take note that the name of the public key will be how you reference that user in the configuration file (i.e. bob.pub would be 'bob').

## Vagrant Demo

To test this setup I used Vagrant and a simple shell-script provisioner, and I thought it would be useful to provide it.
One note on the provisioner file, due to being run as 'root', it is necessary to switch to the correct account for each required command.

- [Vagrantfile](/uploads/personal-git-server-with-gitolite/Vagrantfile) - Vagrant configuration file
- [bootstrap.sh](/uploads/personal-git-server-with-gitolite/bootstrap.sh) - Shell-script provisioner
