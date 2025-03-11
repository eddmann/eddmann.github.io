---
layout: post
title: 'Making Gitflow the way you want it to'
description: 'A guide to optimising your Git workflow using Gitflow, including tips on branching, installation, and valuable resources for mastering Git development.'
tags: ['git', 'gitflow']
---

I have been a part-time Git user for a little over a year now.
Before this, I had dabbled with using [Subversion](http://subversion.apache.org/) but never for anything too serious.
I say 'part-time' because, throughout the year, I never fully got to grips with all the ideologies and tools available to support my development lifecycle process.
This was particularly evident with regard to branching.

<!--more-->

Sure, I had attempted to get my head around the excellent documentation found on the official [Git website](http://git-scm.com/), along with a boatload of screencasts.
However, putting this into practise never actually happened.
Until recently, I had been very content working in 'master'.
On occasion, if I was feeling a little adventurous, I would add a temporary branch for an experimental feature.

## Gitflow to the rescue

This has all changed since I discovered Gitflow (a little late to the party, I know).
In 2010, Vincent Driessen posted on his site ([A successful Git branching model](http://nvie.com/posts/a-successful-git-branching-model/)) about how he used Git for both personal and professional development.
He discussed incorporating the use of the branch types listed below:

- Master
- Hotfix
- Release
- Develop
- Feature

On top of this, he released a set of [Git extensions](http://github.com/nvie/gitflow) to help speed up and ease the learning curve.
If you are a Homebrew user like myself, installing Gitflow is as easy as running the following command:

```bash
$ brew install git-flow
```

To begin using Gitflow on an existing Git repository and create a new feature called 'test', run the following commands:

```bash
$ git flow init
$ git flow feature start test
```

There is no point in me repeating the concepts presented in Vincent's well-laid-out blog post, or adding yet another simple tutorial to the mix.
Instead, I will leave you with a list of resources that I have found useful when learning this subject.

## Resources

- [A successful Git branching model - Vincent Driessen](http://nvie.com/posts/a-successful-git-branching-model/)
- [Github: Gitflow Repository](https://github.com/nvie/gitflow)
- [A short introduction to Gitflow - Video](http://vimeo.com/16018419)
- [On the path with Gitflow - Video](http://vimeo.com/37408017)
- [Introduction to Git with Scott Chacon - Video](http://www.youtube.com/watch?v=ZDR433b0HJY)
