---
layout: post
title: "'Memes as a Service' using Lambda, Serverless and ImageMagick"
canonical: https://tech.mybuilder.com/memes-as-a-service-using-lambda-serverless-and-imagemagick/
meta: "Creating a 'Memes as a Service' using Lambda, Serverless and ImageMagick"
---

I've recently been getting really interested in the concept of Functions as a Service (FaaS) and the [Serverless Framework](https://serverless.com/).
I decided to make a little experimental AWS Lambda, to see how I could use it to manipulate images.
For this contrived example I came up with the (silly) idea of 'Memes as a Service' (everything needs to be a service nowadays).

<!--more-->

The consumer will be able to supply top and bottom text, along with specifying the desired supporting image.
Fortunately the stock Lambda Node.js environment comes equipped with support for the popular [ImageMagick](https://www.imagemagick.org/).
In this blog post I wish to present how I went about solving this problem using the Serverless Framework.

### Setup and Configuration

I am going to assume that you already have the Serverless Framework and a AWS Access Key present on your development machine.
With these installed we are first going to create a new Serverless application, based on the provided template.

```bash
$ serverless create --template aws-nodejs --path memes-as-a-service
```

We should now be able to go into the newly created `memes-as-a-service` directory.
As we are wanting to interact with ImageMagick, we also need to include the [suitable package](http://aheckmann.github.io/gm/) for Node.js.

```bash
$ npm install gm --save
```

The next step is to open up the `serverless.yml` file.
This file outlines the provider information (as the framework can handle other platforms such as [Google Cloud](https://cloud.google.com/)), desired supporting resources and necessary function wiring.
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

Within this definition we are simply configuring an AWS Lambda Node.js based container.
We are providing a couple of environment variables which are going to be accessible within our function implementations.
We then use a [Serverless plugin](https://github.com/maciejtreder/serverless-apigw-binary) to correctly add the desired binary support to the API Gateway.
Finally, we define the single function, taking advantage of how the framework works with [CloudFormation](https://aws.amazon.com/cloudformation/) to correctly wire it up to [API Gateway](https://aws.amazon.com/api-gateway/).
Before continuing we should include the Serverless plugin we have defined as a development dependency.

```bash
$ npm install serverless-apigw-binary --save-dev
```

### Implementation

Now with the blueprint in-place we can go about creating the implementation.
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

The function simply takes in the query string input from the client and uses ImageMagick to add the provided text at the top and bottom of the desired image.
The Lambda itself contains a directory (specified within the environment) of all the available images that the client can choose from.
We also include the font in the distribution that we want to print the text as.
An interesting piece is the action of Base-64 encoding the image response.
API Gateway supports [binary responses](https://aws.amazon.com/about-aws/whats-new/2016/11/binary-data-now-supported-by-api-gateway/), but to enable this we must provide the `isBase64Encoded` flag along with the desired `Content-Type`.
We have previously configured the media types that we wish to be treated as binary within API Gateway, using the added plugin.
As by-default the framework configures each API Gateway route to be in proxy mode, this is all that is required from us to return the generated contents.

### Deployment

Finally, we are now able to try out this service by running:

```bash
$ serverless deploy -v
```

I always tend to provide the `verbose` flag as it gives you good insight into what is happening within the framework under-the-hood.
With this now deployed you can visit the resulting API Gateway endpoint and begin experimenting with generating your own memes!
You can find the code in its entirety, along with supporting assets in [this](https://github.com/eddmann/memes-as-a-service-serverless) GitHub repository.

<img src="/uploads/memes-as-a-service/memes.jpg" alt="Memes as a Service" />
