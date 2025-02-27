---
layout: post
title: 'Setting up GitHub Pages HTTPS Custom Domains using CloudFront and Lambda@Edge'
meta: 'Learn how to set up HTTPS custom domains for GitHub Pages using CloudFront and Lambda@Edge in this comprehensive guide.'
tags: lambda lambda-edge cloudfront
---

We recently wished to switch over our sites hosted on [GitHub Pages](https://pages.github.com/) to be solely HTTPS.
However, although you are able to supply a [custom domain](https://help.github.com/articles/using-a-custom-domain-with-github-pages/) or support [HTTPS traffic](https://github.com/blog/2186-https-for-github-pages), you are not able to do both.
In this article, I would like to guide you through the process of how we went about achieving this using [CloudFront](https://aws.amazon.com/cloudfront/), [Route 53](https://aws.amazon.com/route53/) and [Lambda@Edge](https://aws.amazon.com/lambda/edge/).

<!--more-->

## Setting up the CloudFront Distribution

To get around the fact that we can only route plain HTTP traffic using custom domains within GitHub Pages, we decided to add a CloudFront distribution in between the client and the origin.
Doing so allowed us to supply our own SSL certificate and a secure connection for our custom domain.
Below is a high-level diagram depicting the approach we took.

<img src="/uploads/setting-up-github-pages-https-custom-domains-using-cloudfront-and-lambda-edge/architecture.png" alt="Architecture" />

We first set up a new distribution which was associated with a certificate supplied by [AWS Certificate Manager](https://aws.amazon.com/certificate-manager/).

<img src="/uploads/setting-up-github-pages-https-custom-domains-using-cloudfront-and-lambda-edge/distribution.png" alt="Distribution Settings" />

Following this, we created a new origin which routed traffic to the specified `*.github.io` domain.
We ensured that only HTTPS via TLS 1.2 was used for requests to the origin server for security concerns.

<img src="/uploads/setting-up-github-pages-https-custom-domains-using-cloudfront-and-lambda-edge/origin.png" alt="Distribution Origin" />

With this origin in place, we then created a default cache behaviour which enforced HTTPS traffic (redirecting HTTP traffic if found).

<img src="/uploads/setting-up-github-pages-https-custom-domains-using-cloudfront-and-lambda-edge/cache.png" alt="Default Cache Behaviour" />

## Handling GitHub Page Redirects

One issue we faced with routing traffic through CloudFront was that if GitHub attempted to return a redirect response to the client (for example, for missing trailing slashes), GitHub, being unaware of the custom domain, would attempt to route traffic to the `*.github.io` domain.
To get around this, we took advantage of an [Origin Response Lambda](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/lambda-updating-http-responses.html) which simply replaced any such responses' `Location` header with the desired custom domain.

To ensure that CloudFront had access to this Lambda, we had to define it within the `us-east-1` region.
Using the simple handler below, we published a new version of the Lambda and copied the ARN into the CloudFront Distribution settings.

```js
'use strict';

exports.handler = (event, context, callback) => {
  const response = event.Records[0].cf.response;

  if (response.status === '301' || response.status === '302') {
    if (
      response.headers['location'] &&
      response.headers['location'][0].value.indexOf('USERNAME.github.io') > -1
    ) {
      response.headers['location'][0].value = response.headers['location'][0].value.replace(
        'USERNAME.github.io',
        'custom.domain'
      );
    }
  }

  callback(null, response);
};
```

<img src="/uploads/setting-up-github-pages-https-custom-domains-using-cloudfront-and-lambda-edge/lambda.png" alt="Origin Response Lambda" />

Once this was complete, we set up an `ALIAS` record for the custom domain within Route 53.
All GitHub Pages traffic could now be accessed from the custom domain over HTTPS.
