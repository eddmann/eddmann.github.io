---
title: 'Separating out the Lambda Bref runtime from your projects Composer dependencies'
link: https://tech.mybuilder.com/separating-out-the-lambda-bref-runtime-from-your-projects-composer-dependencies/
meta: 'Separating out the Lambda Bref runtime from your projects Composer dependencies'
---

Having had great success using AWS Lambda within our insurance product ([MyBuilder Plus](https://mybuilder-plus.com/)), late last year we made the decision to move **all** our web request traffic over to the platform!
However, we noticed when attempting to migrate over one application in particular, that we could not use the latest release of [Bref](https://bref.sh/) (the PHP runtime) due to a conflict between required Symfony [Process component](https://symfony.com/doc/current/components/process.html) versions.

<!--more-->
