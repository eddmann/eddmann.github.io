---
layout: post
title: "'Memes as a Service' using Lambda, Serverless and ImageMagick"
meta: "Learn how to create a 'Memes as a Service' platform using AWS Lambda, the Serverless Framework, and ImageMagick. A step-by-step guide with code examples."
tags: serverless aws lambda javascript
---

I've recently become really interested in the concept of Functions as a Service (FaaS) and the [Serverless Framework](https://serverless.com/).
I decided to create a small experimental AWS Lambda function to explore how it could be used to manipulate images.
For this contrived example, I came up with the (silly) idea of 'Memes as a Service' (everything needs to be a service nowadays).

<!--more-->

The consumer will be able to supply top and bottom text, along with specifying the desired supporting image.
Fortunately, the stock Lambda Node.js environment comes equipped with support for the popular [ImageMagick](https://www.imagemagick.org/).
In this blog post, I will present how I went about solving this problem using the Serverless Framework.

## Setup and Configuration

I will assume that you already have the Serverless Framework and an AWS Access Key set up on your development machine.
With these installed, we first create a new Serverless application based on the provided template.

```bash
$ serverless create --template aws-nodejs --path memes-as-a-service
```

We should now be able to navigate into the newly created `memes-as-a-service` directory.
As we want to interact with ImageMagick, we also need to include the [suitable package](http://aheckmann.github.io/gm/) for Node.js.

```bash
$ npm install gm --save
```

The next step is to open the `serverless.yml` file.
This file outlines the provider information (as the framework can handle other platforms such as [Google Cloud](https://cloud.google.com/)), the required supporting resources, and the necessary function wiring.
Replace the sample contents of this file with the YAML definition below:

```yaml
service: meme-as-a-service

provider:
  name: aws
  runtime: nodejs6.10
  stage: prod
  region: eu-west-1
  environment:
    IMAGES_DIR: ./images/
    TEXT_SIZE: 50
    TEXT_PADDING: 40

plugins:
  - serverless-apigw-binary

custom:
  apigwBinary:
    types:
      - '*/*'

functions:
  meme:
    handler: handler.meme
    events:
      - http:
          path: /
          method: get
```

In this definition, we configure an AWS Lambda Node.js-based container.
We provide a couple of environment variables that will be accessible within our function implementations.
We then use a [Serverless plugin](https://github.com/maciejtreder/serverless-apigw-binary) to correctly add the required binary support to the API Gateway.
Finally, we define the single function, taking advantage of how the framework integrates with [CloudFormation](https://aws.amazon.com/cloudformation/) to correctly wire it up to [API Gateway](https://aws.amazon.com/api-gateway/).
Before continuing, we should include the Serverless plugin as a development dependency.

```bash
$ npm install serverless-apigw-binary --save-dev
```

## Implementation

Now, with the blueprint in place, we can create the implementation.
Replace the sample `handler.js` contents with the following:

```js
'use strict';

const gm = require('gm').subClass({ imageMagick: true });
const fs = require('fs');

const { IMAGES_DIR, TEXT_SIZE, TEXT_PADDING } = process.env;

const parseText = text => (text || '').toUpperCase();
const getImages = () => fs.readdirSync(IMAGES_DIR);
const parseImage = image => getImages().find(file => file.indexOf(image) === 0);
const random = arr => arr[Math.floor(Math.random() * arr.length)];
const randomImage = () => random(getImages());

module.exports.meme = (event, context, callback) => {
  const input = event.queryStringParameters || {};

  const top = parseText(input.top);
  const bottom = parseText(input.bottom);
  const image = parseImage(input.image) || randomImage();

  const meme = gm(`${IMAGES_DIR}${image}`);

  meme.size(function (err, { height }) {
    meme
      .font('./impact.ttf', TEXT_SIZE)
      .fill('white')
      .stroke('black', 2)
      .drawText(0, -(height / 2 - TEXT_PADDING), top, 'center')
      .drawText(0, height / 2 - TEXT_PADDING, bottom, 'center')
      .toBuffer(function (err, buffer) {
        callback(null, {
          statusCode: 200,
          headers: { 'Content-Type': 'image/jpeg' },
          body: buffer.toString('base64'),
          isBase64Encoded: true,
        });
      });
  });
};
```

The function takes the query string input from the client and uses ImageMagick to add the provided text at the top and bottom of the selected image.
The Lambda function contains a directory (specified in the environment variables) of all available images that the client can choose from.
We also include the font in the distribution that we want to use for the text.
An interesting aspect is the Base64 encoding of the image response.
API Gateway supports [binary responses](https://aws.amazon.com/about-aws/whats-new/2016/11/binary-data-now-supported-by-api-gateway/), but to enable this, we must provide the `isBase64Encoded` flag along with the correct `Content-Type`.
We previously configured the media types that we want to be treated as binary within API Gateway using the added plugin.
Since the framework configures each API Gateway route to be in proxy mode by default, this is all we need to return the generated content.

## Deployment

Finally, we can test this service by running:

```bash
$ serverless deploy -v
```

I always use the `verbose` flag as it provides useful insight into what is happening within the framework under the hood.
Once deployed, you can visit the resulting API Gateway endpoint and experiment with generating your own memes!
You can find the complete code, along with supporting assets, in [this](https://github.com/eddmann/memes-as-a-service-serverless) GitHub repository.

<img src="/uploads/memes-as-a-service/memes.jpg" alt="Memes as a Service" />
