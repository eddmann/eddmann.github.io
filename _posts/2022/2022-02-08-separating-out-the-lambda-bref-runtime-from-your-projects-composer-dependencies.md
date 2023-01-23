---
layout: post
title: 'Separating out the Lambda Bref runtime from your projects Composer dependencies'
link: https://tech.mybuilder.com/separating-out-the-lambda-bref-runtime-from-your-projects-composer-dependencies/
meta: 'Separating out the Lambda Bref runtime from your projects Composer dependencies'
---

Having had great success using AWS Lambda within our insurance product ([MyBuilder Plus](https://mybuilder-plus.com/)), late last year we made the decision to move **all** our web request traffic over to the platform!
However, we noticed when attempting to migrate over one application in particular, that we could not use the latest release of [Bref](https://bref.sh/) (the PHP runtime) due to a conflict between required Symfony [Process component](https://symfony.com/doc/current/components/process.html) versions.

<!--more-->

Thanks to the responsive [enterprise support](https://bref.sh/#enterprise) that Matthieu provides, we discussed a possible solution which involved using a [separate custom autoloader](https://bref.sh/docs/environment/php.html#custom-vendor-path) for use with the Bref runtime.
Looking through the Bref codebase, we noticed that as we only use the FPM and console runtimes, [both](https://github.com/brefphp/bref/blob/master/runtime/layers/fpm/bootstrap#L35) [variants](https://github.com/brefphp/bref/blob/master/runtime/layers/console/bootstrap#L49) spawn separate PHP processes to handle the actual request.
This means that the project autoloader does not need to be aware of Bref, and as such, we can isolate away this runtime concern from the project entirely.

The project in question packages the release as a [container image](https://docs.aws.amazon.com/lambda/latest/dg/images-create.html).
As such, we were able to create a multi-stage Docker build (as shown below) which handles our desired outcome.

```dockerfile
FROM composer:2.2.5 AS runtime

RUN mkdir -p /tmp/runtime \
 && composer require -d /tmp/runtime bref/bref:1.5.3

FROM bref/php-81-fpm:1.5.3

COPY --from=runtime /tmp/runtime/vendor /opt/runtime/vendor
ENV BREF_AUTOLOAD_PATH /opt/runtime/vendor/autoload.php

COPY . $LAMBDA_TASK_ROOT
```

Using the Composer Docker image as a base, we were able to build a `vendor` directory which included only the desired Bref dependencies.
We were then able to copy this directory into our Lambda container image, making the Bref bootstrap script aware of the custom autoloader path by way of the `BREF_AUTOLOAD_PATH` environment variable.

### Conclusion

Although we have only demonstrated this for our own use-case (using a container image), the same idea could be applied for layer-based Lambda functions too.
Sadly, this approach will not work for [PHP functions](https://bref.sh/docs/runtimes/function.html) due to the means in which the handler is pulled in within the bootstrap script.
However, thanks to both the FPM and console layer abstractions we are able to remove these runtime concerns from our project.
This gives us the ability to maintain the runtime and project requirements separately, allowing us to use the latest Bref release in a project that has dependency conflicts.
