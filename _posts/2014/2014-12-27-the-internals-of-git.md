---
layout: post
title: 'The Internals of Git'
meta: 'Delving into how Git internally represents project history.'
---

I have been using Git for the past couple of years and remember how long it took me to get my head around the work-flow.
Throughout the past couple of months, thanks to a couple of [well](http://ftp.newartisans.com/pub/git.from.bottom.up.pdf) [timed](http://mrchlblng.me/2014/09/practical-git-introduction/) [findings](http://episodes.gitminutes.com/), I have gained an interest into how Git works internally.
In this post I hope to explain how Git uses well-designed, composed low-level commands to create the high-level actions we are familiar with using on a day-to-day basis.

<!--more-->

At its core a Git repository is a key-value object store, where each SHA-1 key is generated based on multiple factors.
This file-based store is used to represent a functional [Directed Acyclic Graph](http://en.wikipedia.org/wiki/Directed_acyclic_graph), which through the use of commit, tree and blob objects, represents the projects history.

## An Example

To better understand how history is represented within Git, lets first commit a plain-text file entitled 'foo.txt' with the contents 'Hello, world'.
The only catch being, instead of using high-level commands such as [git-add](http://git-scm.com/docs/git-add) and [git-commit](http://git-scm.com/docs/git-commit), we will go through the process of manually indexing and committing the file instead.

The first step is to store a blob object containing the contents of the 'foo.txt' file in the data-store - the hash of which is generated based on the contents and size of the file (or std-in) supplied.
In the case of this example we will use std-in, and not only query Git for the generated hash, but also persist the blob into the object graph.

```bash
$ echo 'Hello, world' | git hash-object --stdin -w
a5c19667710254f835085b99726e523457150e03
```

```bash
$ tree .git/objects/
.git/objects/
| |____
| | |____a5
| | | |____c19667710254f835085b99726e523457150e03
```

You will notice, if you are following along, that the resulting hash for this blob will be identical to the one above.
That is one of Git's ingenious strengths, identical files are only ever stored once, regardless of where they appear in the history graph.

The next step is to add the blob (via its hash key) to the index (staging area), specifying the file permissions and directory/name you wish to associate it with.
We can then write this tree object out to the file-store, being returned its commuted hash.

```bash
$ git update-index --add --cacheinfo 100644 a5c19667710254f835085b99726e523457150e03 foo.txt
$ git write-tree
0906930f06d75609ca186359a6cee2c9623bf99a
$ git cat-file -p 0906930f06d75609ca186359a6cee2c9623bf99a
100644 blob a5c19667710254f835085b99726e523457150e03    foo.txt
```

```bash
$ tree .git/objects/
.git/objects/
| |____
| | |____09
| | | |____06930f06d75609ca186359a6cee2c9623bf99a
| | |____a5
| | | |____c19667710254f835085b99726e523457150e03
```

The pending index is stored in a file called 'index' until it is then persisted into the store.
Tree objects store a combination of blob objects with file attributes such as the 'foo.txt' filename, along with other tree objects for subsequent directories.
We are now ready to associate this generated tree with a commit object.

```bash
$ git commit-tree 0906930f06d75609ca186359a6cee2c9623bf99a -m "First commit"
e5446fb51f77fd526f56b7f58ac328c5db954dc6
$ git cat-file -p e5446fb51f77fd526f56b7f58ac328c5db954dc6
tree 0906930f06d75609ca186359a6cee2c9623bf99a
author Edd Mann <the@eddmann.com> 1419674305 +0000
committer Edd Mann <the@eddmann.com> 1419674305 +0000

First commit
```

```bash
$ tree .git/objects/
.git/objects/
| |____
| | |____09
| | | |____06930f06d75609ca186359a6cee2c9623bf99a
| | |____a5
| | | |____c19667710254f835085b99726e523457150e03
| | |____e5
| | | |____446fb51f77fd526f56b7f58ac328c5db954dc6
```

This commit hash will differ from the one you generate as factors such as name/email and current timestamp play a role in its generation.
With this commit now persisted in the store we can update the repositories 'HEAD' reference to point to the generated hash commit.

```bash
$ git update-ref HEAD e5446fb51f77fd526f56b7f58ac328c5db954dc6
$ git checkout -f
$ cat foo.txt
Hello, world
```

As you can see, it only takes three persisted object files to represent a one file commit history.
Finally, lets generate a new file 'baz.txt' which is stored in a directory called 'bar'.

```bash
$ echo 'Bonjour' | git hash-object --stdin -w
632e4fe73c3da8c9018008dbda117fc6b00e3e83
```

```bash
$ git update-index --add --cacheinfo 100644 632e4fe73c3da8c9018008dbda117fc6b00e3e83 bar/baz.txt
$ git write-tree
84483aa54b5cd02e76298c097831c51914c53821
$ git cat-file -p 84483aa54b5cd02e76298c097831c51914c53821
040000 tree 8ee16db87ef1f040f79a0e4cb843668369e96f70    bar
100644 blob a5c19667710254f835085b99726e523457150e03    foo.txt
```

In a similar manner to the first example, we persist both the file-contents blob and tree objects.
The difference arrives when we wish to generate the second commit, we must now supply the parent commits hash (in our case the first commit) which will be used to calculate the graphs history when desired.

```bash
$ git commit-tree 84483aa54b5cd02e76298c097831c51914c53821 -m "Second commit" -p HEAD
18f4f9e35fe5d521f12c5a5b7bc7b969b472d4dd
$ git cat-file -p 18f4f9e35fe5d521f12c5a5b7bc7b969b472d4dd
tree 84483aa54b5cd02e76298c097831c51914c53821
parent e5446fb51f77fd526f56b7f58ac328c5db954dc6
author Edd Mann <the@eddmann.com> 1419674876 +0000
committer Edd Mann <the@eddmann.com> 1419674876 +0000

Second commit
```

```bash
$ git update-ref HEAD 18f4f9e35fe5d521f12c5a5b7bc7b969b472d4dd
$ git checkout -f
$ cat bar/baz.txt
Bonjour
```

I hope this quick introduction to the internals of Git has helped you realise how simple, yet powerful the system has been modeled.
