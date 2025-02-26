---
layout: post
title: 'Unlocking the AWS WAF Logs'
canonical: https://tech.mybuilder.com/unlocking-the-aws-waf-logs/
meta: 'Unlocking the AWS WAF Logs using Serverless, Lambda and AWS SDK'
---

In this article we discuss our recent move to route all requests through [CloudFront](https://aws.amazon.com/cloudfront/), allowing us to parse all traffic through the [AWS Web Application Firewall](https://aws.amazon.com/waf/) (WAF).
We highlight the reasoning behind this change, and some issues/remedies ecountered when trying to garner concrete logs from the WAF instance.

<!--more-->

### Dynamic Content Delivery

Since moving our infrastructure fully over to AWS, one of the first benefits we wished to take advantage of was [Dynamic Content Delivery](https://aws.amazon.com/cloudfront/dynamic-content/) by way of CloudFront.
It may seem odd to wish to route all requests through a CDN, but in doing so we have been able to unlock the following possibilities:

- Allow CloudFront to handle SSL/TLS termination.
- HTTP/2 support out of the box.
- Due to HTTP/2 being [fully multiplexed](http://qnimate.com/what-is-multiplexing-in-http2/), fine-grained path/query-string cache behaviors present in CloudFront are hugely beneficial.
- Take advantage of CloudFront's many Edge locations - connecting the client to the nearest geographical point, and then using Amazon's own infrastructure to route the requests to the EC2 hosted origin server(s).
- Along with standard static assets that can be trivially cached, we are able to begin to experiment with caching whole pages - pushing simple dynamic content to the client (i.e. logged-in navigation states).
- Instead of pushing the entire cached page to the client, we can also harness [Lambda@Edge](https://aws.amazon.com/lambda/edge/) for small dynamic content changes at Edge locations.
- Employ the [AWS WAF](https://aws.amazon.com/waf/) on all client requests, providing another layer of security.

### AWS Web Application Firewall

As you can see there are many possibilities this opens the door to, in this post however, I would like to focus on the last one.
Soon after shifting all our traffic to go through CloudFront, we wished to take advantage of the AWS WAF.
The benefits of deploying a WAF in-front of your stack are succinctly put in a [short talk](https://www.youtube.com/watch?v=4liTK5MrTNo) from last years re:Invent.

However, during development of this approach we realised that getting meaningful logs out of the product was harder than expected.
As of writing AWS does not provide any easily accessible log stream to inspect how the WAF instance is reacting to requests.
The only noticeable indicator of a WAF rule blocking a request came from the 403 HTTP response code that was generated and returned to the client.
This was a less than desirable metric to lean on, as we could get many false-positives from genuine backend 403 reponses, and still did not know which rule triggered it.

We did not feel confident in using such a feature without having more insight into how it was working.
We wished to be able to analyse the traffic patterns and which rules were being matched.

### Unlocking the Logs

To remedy this we decided to explore the AWS SDK and noticed that with a little work we could query the [`GetSampledRequests`](http://docs.aws.amazon.com/waf/latest/APIReference/API_GetSampledRequests.html) action at a scheduled interval and fetch any matches found - storing them for future use.
This would allow us to look at current and historical data about the WAF's actions.
A small caveat to how `GetSampledRequests` works however, is in that it only returns a sample (maximum of 500) from among the first 5,000 request that your resource receives during the specified time-range.
So to ensure that we receive as many hits as have actually occurred, we must configure the scheduled invocation time according to our throughput.

I felt this was a great opportunity to work with the [Serverless Framework](https://serverless.com/) again, and in doing so created the [aws-waf-logger](https://github.com/mybuilder/aws-waf-logger) project.
Using the provided `env.yml.sample` as a template, it is very easy to configure the desired Web ACL's to monitor, the tracking frequency and which S3 bucket to store the results into.

The most interesting part of this project is within the transformation from what `GetSampledRequests` returns us, to clear insight about the individual ACL's and rules we wish to track.
Using a composition of several Promises, the below piece of code takes in the desired Web ACL identifier, along with a time-frame which is based on the last time the Lambda has been executed.
We then query for all the present rules which are applied to this Web ACL, and then fetch these individual rule hits.
Once we have this data, we flattern the results into a single dimensional array, which we then subsequently clean-up the client supplied headers.

```js
'use strict';

const AWS = require('aws-sdk');
const waf = new AWS.WAF();

const { MAX_WAF_ITEMS } = process.env; // currently 500

const getRuleIds = aclId =>
  new Promise((res, rej) => {
    waf.getWebACL({ WebACLId: aclId }, (err, data) => {
      if (err) rej(err);
      else res(data.WebACL.Rules.map(r => r.RuleId));
    });
  });

const getRuleHits = (aclId, ruleId, { start, end }) =>
  new Promise((res, rej) => {
    const params = {
      MaxItems: MAX_WAF_ITEMS,
      RuleId: ruleId,
      TimeWindow: { StartTime: start, EndTime: end },
      WebAclId: aclId,
    };

    waf.getSampledRequests(params, (err, data) => {
      if (err) rej(err);
      else {
        res(
          data.SampledRequests.reduce((acc, req) => {
            return [...acc, Object.assign(req, { WebAclId: aclId, RuleId: ruleId })];
          }, [])
        );
      }
    });
  });

const normaliseHeaders = hit => {
  hit.Request.Headers = hit.Request.Headers.reduce((headers, { Name, Value }) => {
    headers[Name.toLowerCase()] = Value;
    return headers;
  }, {});

  return hit;
};

const flatten = arrs => Array.prototype.concat.apply([], arrs);

module.exports.getWebAclHits = (aclId, timeRange) =>
  getRuleIds(aclId)
    .then(ruleIds => Promise.all(ruleIds.map(ruleId => getRuleHits(aclId, ruleId, timeRange))))
    .then(flatten)
    .then(hits => hits.map(normaliseHeaders));
```

We are then able to use this functionality to write the resulting listing to a file, or logging service of our choice.
Within the project we have provided the ability to write the results to S3 and/or directly send the hits off to [Loggly](https://www.loggly.com/).
Upon review, we could have possibly extracted out the Loggly logic (making the project logger agnostic), employing a decoupled S3 `ObjectCreated` event approach to send the hits off instead.

### Conclusion

Since adding these logging capabilities we have been able to clearly see what rules are being hit and in which context.
This allows us to feel more confident in the WAF product, removing the 'black-box' fears that we previously had towards it.

If you have ran into this problem, maybe the [aws-waf-logger](https://github.com/mybuilder/aws-waf-logger) we have created could help you!
