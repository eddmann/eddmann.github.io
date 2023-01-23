---
layout: post
title: 'Using GitHub Actions to send Gone Live release notes via Email and Slack'
canonical: https://tech.mybuilder.com/using-github-actions-to-send-gone-live-release-notes-via-email-and-slack/
meta: 'Using GitHub Actions to send Gone Live release notes via Email and Slack'
---

Ensuring that both the tech team and company as a whole are aware of changes that have just been released is very important.
This keeps everyone _in the loop_ with the work that the tech team are carrying out, and how the system is changing over time.
Last year MyBuilder transitioned away from Jenkins to GitHub Actions to manage our CI pipelines, and in the process was able to revise how we notified interested parties about releases.

<!--more-->

We have been using [Release Drafter](https://github.com/release-drafter/release-drafter) for several years now (even before transitioning to Actions) and really like how it provides a frictionless means of relaying changes through compiled release notes from GitHub pull requests.
The ability to additionally tag pull requests and produce sectionable release notes is very useful.
Adopting GitHub Actions, we now had an easy means of additionally triggering actions based on GitHub events such as successful deployment 😎.

Our primary means of release notification were in the form of Gone Live emails, which required manual means to send out the release notes to the company once the changes had been deployed.
One of the key drivers of the SRE team at MyBuilder is [eliminating toil](https://sre.google/workbook/eliminating-toil/), and we had pinpointed this as being such a case that needed review.
With the move to GitHub Actions we could now harness the power of the provided event system and workflows to instead automate the process.
Upon review, we also felt it useful to provide the ability for members of staff to review Gone Live release notes within a dedicated Slack channel, as this had overtaken email as the primary communication platform.

## What we wanted

We wanted a means of automatically notifying interested parties of Gone Live release notes via both Email and Slack channels upon successful deployment, without any manual intervention.
Better still, it would be great if we could additionally [_mention_](https://slack.com/intl/en-gb/help/articles/205240127-Use-mentions-in-Slack) members of the tech team within the Slack notification based on their involvement.
So with this in mind, I was able to spend a day building several GitHub Actions which solved these two use-cases.

## Email release notifier

<a href="https://github.com/eddmann/email-release-notifier"><img src="/uploads/using-github-actions-to-send-gone-live-release-notes-via-email-and-slack/email-notification.png" /></a>

The completed Email release notifier is available for review and use [on GitHub](https://github.com/eddmann/email-release-notifier).
When a release is published within GitHub the contents is stored as Markdown, as such, we were required to convert this Markdown to HTML so it could be presented in an Email.
This was trivial thanks to having access to not only a Node runtime, but the ability to package NPM dependencies as well.
We have been using SendGrid for handling email at MyBuilder for many years, and opted to use their SDK/API to send out the actual email on our behalf.

With the new GitHub Action we were now able to bind it to the successful deployment event (as shown below), and remove the need for any more manual tasks!

<!-- {% raw %} -->

```yaml
name: Notify Team via Email about Release
on: deployment_status
jobs:
  notify:
    if: ${{ github.event.deployment_status.state == 'success' }}
    runs-on: ubuntu-20.04
    steps:
      - name: Notify Team
        uses: eddmann/email-release-notifier@v1
        with:
          to: to@email.com
          from: from@email.com
          sendGridToken: ${{ secrets.SENDGRID_API_TOKEN }}
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

<!-- {% endraw %} -->

## Slack release notifier

<a href="https://github.com/eddmann/slack-release-notifier"><img src="/uploads/using-github-actions-to-send-gone-live-release-notes-via-email-and-slack/slack-notification.png" /></a>

The completed Slack release notifier is available for review and use [on GitHub](https://github.com/eddmann/slack-release-notifier).
In this case, we wanted to not only send it to a desired shared channel, but also provide a means of _mentioning_ tech team members based on interested pull request changes going live.
Slack's [Webhook support](https://slack.com/intl/en-gb/help/articles/115005265063-Incoming-webhooks-for-Slack) allows you to build complex messages using constructs such as _blocks_.
These _blocks_ can handle a subset of Markdown which was useful in-regards to the release notes that had been generated.
As the Release Drafter has a means to include all the contributor GitHub usernames within the compiled release, it was a trivial task to replace these occurrences with their associated Slack member identities (by way of a lookup table input).
This meant that when a release had Gone Live and the the subsequent Slack notification had been sent, interested parties would be alerted to this news instantaneously.

In a similar fashion to how we were able to wire up the Email release notifier, we could bind to the same successful deployment event for Slack communications too.

<!-- {% raw %} -->

```yaml
name: Notify Team via Slack about Release
on: deployment_status
jobs:
  notify:
    if: ${{ github.event.deployment_status.state == 'success' }}
    runs-on: ubuntu-20.04
    steps:
      - name: Notify Team
        uses: eddmann/slack-release-notifier@v1
        with:
          slackTitle: 'Your changes are live!'
          slackHeading: 'Gone Live - {tag_name}'
          gitHubSlackUserLookup: '{"@GitHubUsername":"SlackMemberId"}'
          slackWebhookEndpointUrl: ${{ secrets.RELEASE_SLACK_WEBHOOK_URL }}
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

<!-- {% endraw %} -->

_Note:_ Both these tasks could be merged and performed in the same GitHub Action workflow job if desired.

## Conclusion

To conclude, I really enjoyed exploring how we could automate tasks we deem to be toil using GitHub Actions.
The rich set of GitHub events you are able to trigger behaviour on is invaluable, and makes automating tasks such as this easy to achieve.
Now that we have moved our entire CI pipeline over to GitHub Actions, I hope to be able to take more advantage of these capabilities in time to come.
