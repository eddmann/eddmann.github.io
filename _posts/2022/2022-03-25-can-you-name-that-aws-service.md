---
layout: post
title: 'Can you name that AWS service?'
meta: 'Documents building an AWS service icon quiz game using React and GitHub Actions'
tags: aws react js
---

I have always been amazed by the sheer amount of services AWS offers.
Although I spend a lot of time working within AWS, I am always surprised to find yet another service that I did not know existed.
Better still, is with each new service comes an associated new service icon.
This is why I thought it would be interesting (and somewhat educational) to build a small trivia game which quizzes you on AWS service icons.

<!--more-->

<a href="https://eddmann.com/name-that-aws-service/"><img src="/uploads/can-you-name-that-aws-service/demo.png" /></a>

## Finding the Services

Instead of having to painstakingly crawl through all the available AWS services and associated icons, they fortunately provide an Architecture Icons [assets package](https://aws.amazon.com/architecture/icons/).
This artifact includes all the available named service icons, grouped by category.
Having found this, all that was required was to create a [small script](https://github.com/eddmann/name-that-aws-service/blob/main/export-services.js) which exported this directory listing.
Thanks to the service icons being available in SVG format, I was able to keep this service definition contained to a single file.
Being in a deterministic form, meant that future additions (because AWS is surely going to add more services!) could be performed in an automated fashion.
With the services now in a format we could query, it was time to build the game!

## Building the Game

Thinking of the rules behind the game, I opted to keep it simple at this time.
That being, each day a new quiz would be generated which consisted of 10 service icons.
These service icons would each have 4 possible choices, and an optional hint (the supplied category) you could view.
The participants results would be stored within their web browsers local storage, to provide a crude means of ensuring they only attempted the daily quiz once.
Like many developers I have been amazed by the success of [Wordle](https://www.nytimes.com/games/wordle/index.html), and with this, I took inspiration for the shared single daily quiz - which helps garner community discussion.

In a similar manner to how I built several small [web-based](https://eddmann.com/posts/creating-a-contact-tracing-scanner-using-web-bluetooth/) [applications](https://eddmann.com/posts/building-a-nokia-composer-rtttl-player-and-wav-file-generator-in-the-browser/) a couple of years ago, I decided to keep all the client-side React logic within a single [HTML file](https://github.com/eddmann/name-that-aws-service/blob/main/public/index.html).
This makes it easier for someone who wishes to review the code, and highlights how trivial such behaviour can be built using React.
Going forward, if additional more complex behaviour is required, I may look to employ tooling such as [Create React App](https://create-react-app.dev/).

## Generating the Quiz

With the game being static in nature, I decided that hosting it using GitHub Pages would be a great fit.
With this, I also decided that I could harness GitHub Actions to generate the daily [random quiz](https://github.com/eddmann/name-that-aws-service/blob/main/generate-quiz.js) based on a [scheduled workflow](https://github.com/eddmann/name-that-aws-service/blob/main/.github/workflows/generate.yml).
Each morning the workflow is executed, which in-turn, generates a new quiz and commits it to the GitHub repository.
This allows me to delegate the responsibility of hosting and compute to GitHub, and only concern myself with the behaviour I wish to build.

## Conclusion

Since building the quiz game I have shared it across the team at MyBuilder and seen how well people know their AWS services!
Going forward I would like to experiment with adding a Social Login component to the game, in-which results can then be centrally stored and shared with other participants.
