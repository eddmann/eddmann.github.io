---
layout: post
title: 'Simplify Git commit fixes using fixup and auto-squash'
meta: 'Learn how to streamline your Git commit history by using fixup and auto-squash commands to simplify and organise commit fixes.'
tags: git
---

Throughout a project I will typically make commits that could be categorised as fixes to previous commits.
To help highlight such commits I would follow the pattern of starting the message with 'fix: ...', making the final rebase step (before merging into master) easier.
However, as time passed, it became more challenging to determine which fix commits were related to previous commits.

<!--more-->

I would typically have to resort to reviewing these commits to work out the context, as fixes would not always occur in a chronological order.

One day a colleague noticed me doing this, and pointed me in the direction of a great feature available in Git (since 1.7).
This feature allows you to make a commit which is conceptually 'tagged' as a fix to a previous commit.
These commits all follow the 'fixup! Subject commit message' naming convention, and can be auto-squashed when performing an interactive rebase.
The great benefit of doing this is that it not only marks the commit as a 'fixup', but also reorders the commits, allowing you to typically just apply the changes without any modification.
Below is a contrived example showcasing the usage of this feature.

```bash
git add . # stage fixes for 9c8735
git commit --fixup=9c8735
git rebase -i --autosquash 9c8735~1 # one before the subject commit
```
