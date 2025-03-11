---
layout: post
title: 'Changing the Timestamp of a Previous Git Commit'
meta: 'Learn how to modify commit timestamps in Git, including author and committer dates, with simple commands and best practices.'
tags: ['git']
---

Git has two different types of timestamp associated with a commit.
Although both typically hold the same value, they are used in subtly different ways.
The author (GIT_AUTHOR_DATE) is the user who originally created the work (i.e. a patch), whereas the committer (GIT_COMMITTER_DATE) is the user who last applied the work (i.e. applied patch or rebase).
The author date is the one displayed when the log is accessed.
However, the commit date is used when applying the `--since` and `--until` filter options, which seems a little odd.
To avoid confusion, you can include the committer date within your log display by setting the `--format` option.

<!--more-->

```bash
$ git log --format=fuller
```

## Ch-ch-Changes...

A tendency I have picked up is to be very commit-happy when developing locally, and then I often find myself rebasing frequently before pushing to a remote.
As a result, I am sometimes required to alter the timestamps of certain commits to make them more meaningful.
I found that the simplest approach is to add a specified timestamp to the current commit.
The author date is specified with the --date option, whereas the committer timestamp must be changed using an environment variable.

```bash
$ git commit --date="Sat, 14 Dec 2013 12:40:00 +0000" # only author
$ GIT_COMMITTER_DATE="`date -R`" git commit --date "`date -R`" # for both
```

If, on the other hand, we wish to amend the last author commit, we can execute the following similar command.
I should warn you to be wary of running these commands on a branch with commits that have already been pushed to a remote, as Git's hashing nature will alter the SHAs of all subsequent commits.

```bash
$ git commit --amend --date "`date -R`" # include '-C HEAD' to bypass commit message editing
```

Finally, to alter a previous commit by its SHA reference hash, you can run the following command (adapted from [GitFaq](http://git.wiki.kernel.org/index.php/GitFaq#How_can_I_tweak_the_date_of_a_commit_in_the_repo.3F)).

```bash
$ git filter-branch --env-filter \
"if test \$GIT_COMMIT = 'e6dbcffca68e4b51887ef660e2389052193ba4f4'
then
    export GIT_AUTHOR_DATE='Sat, 14 Dec 2013 12:40:00 +0000'
    export GIT_COMMITTER_DATE='Sat, 14 Dec 2013 12:40:00 +0000'
fi" && rm -fr "$(git rev-parse --git-dir)/refs/original/"
```

## Viewing the alterations

We can now review our alterations by checking the log again.
This is achieved by using the `--since` and `--until` options to filter the results.

```bash
$ git log --since="yesterday"
$ git log --since="1 month ago" --until="yesterday"
```

## Resources

- [How can I tweak the date of a commit in the repo?](http://git.wiki.kernel.org/index.php/GitFaq#How_can_I_tweak_the_date_of_a_commit_in_the_repo.3F)
- [How can one change the timestamp of an old commit in Git?](http://stackoverflow.com/questions/454734/how-can-one-change-the-timestamp-of-an-old-commit-in-git)
