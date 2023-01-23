---
title: 'Setting up GitHub Pages HTTPS Custom Domains using CloudFront and Lambda@Edge'
link: https://tech.mybuilder.com/setting-up-github-pages-https-custom-domains-using-cloudfront-and-lambda-edge/
meta: 'Setting up GitHub Pages HTTPS Custom Domains using CloudFront and Lambda@Edge'
---

We recently wished to switch over our sites hosted on [GitHub Pages](https://pages.github.com/) to be soley HTTPS.
However, although you are able to supply a [custom domain](https://help.github.com/articles/using-a-custom-domain-with-github-pages/) or support [HTTPS traffic](https://github.com/blog/2186-https-for-github-pages) you are not able to do both.
In this article I would like to guide you through the process of how we went about achieving this using [CloudFront](https://aws.amazon.com/cloudfront/), [Route 53](https://aws.amazon.com/route53/) and [Lambda@Edge](https://aws.amazon.com/lambda/edge/).

<!--more-->

### Setting up the CloudFront Distribution

To get around the fact that we can only route plain HTTP traffic using custom domains within GitHub Pages, we decided to add a CloudFront distribution in-between the client and origin.
Doing so allowed us to supply our own SSL certificate and custom domain secure connection.
Below is a high-level diagram depicting the approach we took.

<img src="/uploads/posts/setting-up-github-pages-https-custom-domains-using-cloudfront-and-lambda-edge/architecture.png" alt="Architecture" />

We first setup a new distribution which was associated with a certificate supplied by [AWS Certificate Manager](https://aws.amazon.com/certificate-manager/).

<img src="/uploads/posts/setting-up-github-pages-https-custom-domains-using-cloudfront-and-lambda-edge/distribution.png" alt="Distribution Settings" />

Following this we created a new origin which routed traffic to the specified `*.github.io` domain.
We ensured that only HTTPS via TLS 1.2 was used for requests to the origin server for security concerns.

<img src="/uploads/posts/setting-up-github-pages-https-custom-domains-using-cloudfront-and-lambda-edge/origin.png" alt="Distribution Origin" />

With this origin in-place we then created a default cache behaviour which enforced HTTPS traffic (redirecting HTTP traffic if found).

<img src="/uploads/posts/setting-up-github-pages-https-custom-domains-using-cloudfront-and-lambda-edge/cache.png" alt="Default Cache Dehaviour" />

### Handling Github Page Redirects

One issue we faced with routing traffic through CloudFront was if GitHub attempted to return a redirect response to the client (i.e for missing trailing slashes).
As GitHub is unaware of the custom domain, it attempts to route traffic to the `*.github.io` domain.
To get around this we took advantage of a [Origin Response Lambda](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/lambda-updating-http-responses.html) which simply replaced any such responses `Location` header with the desired custom domain.

To ensure that CloudFront had access to this Lambda we had to define it within the `us-east-1` region.
Using the simple handler below we published a new version of the Lambda and copied the ARN into the CloudFront Distribution settings.

```javascript
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

<img src="/uploads/posts/setting-up-github-pages-https-custom-domains-using-cloudfront-and-lambda-edge/lambda.png" alt="Origin Response Lambda" />

Once this was complete we setup an `ALIAS` record for the custom domain within Route 53 and all GitHub Pages traffic could now be accessed from the custom domain over HTTPS.
