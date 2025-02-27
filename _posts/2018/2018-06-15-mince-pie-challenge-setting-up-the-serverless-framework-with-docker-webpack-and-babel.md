---
layout: post
title: 'Mince Pie Challenge: Setting up the Serverless Framework with Docker, Webpack and Babel'
meta: 'Learn how to set up the Serverless Framework with Docker, Webpack and Babel for building robust AWS Lambda functions as part of the Mince Pie Challenge.'
tags: serverless docker webpack babel lambda mince-pie-challenge
---

Now that we have spent some time working out how the API is going to look, we can move on to building it!
We will start off by configuring the initial API project, setting up a Dockerised [Serverless Framework](https://serverless.com/) with [Webpack](https://webpack.js.org/) and [Babel](https://babeljs.io/) support.

<!--more-->

If you are keen to see how the finished configuration looks, you can access it within the [API repository](https://github.com/eddmann/mince-pie-challenge-api-serverless/tree/01-base).

## Serverless Framework via Docker

So as to make the project easy to set-up on many different development environments, we will employ Docker to manage the Serverless Framework and Node dependencies.
We will take advantage of a pre-built Node 8 image and add the ability to run the Serverless Framework within it.
To allow us to support future Node dependencies that require `glibc` and container exploration via a Bash shell, we will also include these in our image definition.

```
FROM node:8-alpine
RUN apk --no-cache add bash ca-certificates wget
RUN wget -q -O /etc/apk/keys/sgerrand.rsa.pub https://raw.githubusercontent.com/sgerrand/alpine-pkg-glibc/master/sgerrand.rsa.pub && \
    wget https://github.com/sgerrand/alpine-pkg-glibc/releases/download/2.27-r0/glibc-2.27-r0.apk && \
    apk add glibc-2.27-r0.apk && \
    rm -f glibc-2.27-r0.apk
RUN yarn global add serverless@1.28.0
WORKDIR /opt/app
```

When the container is initiated, we wish to supply the AWS credentials (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`) required by Serverless using a given `.env` file.
This allows us to easily control what [credentials](https://serverless.com/framework/docs/providers/aws/guide/credentials/) are being used to deploy and maintain the application.
We will also allow the container to access the code-base and provide a separate volume for Node dependencies to be persisted.
Doing this allows us to isolate working dependencies targeted at the container architecture and dependencies installed for the host machine.

```yaml
version: '3'

services:
  serverless:
    build: .
    env_file: .env
    volumes:
      - .:/opt/app
      - app-modules:/opt/app/node_modules

volumes:
  app-modules:
```

Finally, to make the process of executing the common-place actions on our host machine seamless, we shall define a simple `Makefile` which outlines these capabilities in a single place.

```make
install:
  docker-compose run --rm serverless npm install

build:
  docker-compose run --rm serverless sls webpack -v --stage=dev

deploy:
  docker-compose run --rm serverless sls deploy -v --stage=dev

shell:
  docker-compose run --rm serverless bash
```

## Serverless with Babel and Webpack

It should be noted that it is not strictly necessary to require Babel and Webpack when working with Lambda and the Serverless Framework.
However, the ability to use all the latest JavaScript features, along with Webpack's module bundling (inc. [tree-shaking](https://webpack.js.org/guides/tree-shaking/)), is an invaluable addition.
We will start off by defining and installing the explicit development dependencies that we will need.
Within Lambda, the `aws-sdk` dependency comes pre-baked into the runtime, so we only care about including this during development.

```json
{
  "name": "mince-pie-challenge-api",
  "version": "1.0.0",
  "private": true,
  "devDependencies": {
    "aws-sdk": "^2.268.1",
    "babel-core": "^6.26.3",
    "babel-loader": "^7.1.5",
    "babel-plugin-transform-object-rest-spread": "^6.26.0",
    "babel-preset-env": "^1.7.0",
    "serverless-webpack": "^5.1.5",
    "webpack": "^4.15.1",
    "webpack-node-externals": "^1.7.2"
  },
  "dependencies": {}
}
```

From here we can `make install` and see the Docker module volume in action.
You will notice that a `node_modules` directory has been created within the code-base but it is empty on your host machine?!
However, if you `make shell` into the container, you will notice that the container-specific dependencies are present.
This allows you to optionally install the dependencies on your host machine without conflicting with the container.

Now let's set up the initial `serverless.yml`, `webpack.config.js` and `.babelrc` configurations.

```yaml
service: mince-pie-challenge-api

provider:
  name: aws
  runtime: nodejs8.10
  stage: ${opt:stage, 'dev'}
  region: eu-west-1
  environment:
    GREETING: 'Hello'
  iamRoleStatements: ${file(./roles.yml)}

custom:
  webpack:
    webpackConfig: ./webpack.config.js
    includeModules:
      forceExclude:
        - aws-sdk

plugins:
  - serverless-webpack

package:
  individually: true

resources: ${file(./resources.yml)}

functions: ${file(./functions.yml)}
```

You can see that we have decided to break up the roles, resources and functions into separate YAML files.
This allows us to manage these definitions in an easier manner, preventing us from creating one huge file.
We have specified that we wish to use the latest Lambda [node runtime](https://aws.amazon.com/blogs/compute/node-js-8-10-runtime-now-available-in-aws-lambda/) (at the time of writing), with a single global environment variable set (this will be used in a following demo).
So as to take full advantage of Webpack, we have specified that we wish each function to be packaged individually when deployed.
This allows us to prune any unused dependencies on a per-function basis.

```js
const path = require('path');
const slsw = require('serverless-webpack');
const nodeExternals = require('webpack-node-externals');

module.exports = {
  entry: slsw.lib.entries,
  target: 'node',
  mode: slsw.lib.webpack.isLocal ? 'development' : 'production',
  optimization: { minimize: false },
  performance: { hints: false },
  devtool: 'nosources-source-map',
  externals: [nodeExternals()],
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: [{ loader: 'babel-loader' }],
      },
    ],
  },
  output: {
    libraryTarget: 'commonjs2',
    path: path.join(__dirname, '.webpack'),
    filename: '[name].js',
    sourceMapFilename: '[file].map',
  },
};
```

We supply Webpack with a simple configuration, specifying that we are targeting Node (allowing us to [ignore packaging](https://www.npmjs.com/package/webpack-node-externals) built-in modules) and that we wish to use Babel to process our JavaScript files.
We also define how we wish each function to be output (with their associated source mapping), and which mode to run in based on a [serverless-offline](https://github.com/dherault/serverless-offline) flag.

```json
{
  "comments": false,
  "presets": [["env", { "targets": { "node": "8.10" } }]],
  "plugins": ["transform-object-rest-spread"]
}
```

We let Babel know that we wish to target the specific version of Node that is present within the Lambda runtime.
This allows Babel to only include [polyfilled](https://remysharp.com/2010/10/08/what-is-a-polyfill) support for features that are used and do not natively exist in this version.
One such feature that is not present within the `env` preset at this time is [Object rest spread](https://babeljs.io/docs/plugins/transform-object-rest-spread/), so we explicitly include this plugin.

This is all that is required to begin developing Lambda functions using the Serverless Framework, with access to the latest JavaScript features. 🎉

## The 'Hello World' Example

Before we delve into developing the API, let's get ourselves accustomed to building and deploying a trivial HTTP-based Lambda function.
We will create a function which is invoked by an [API Gateway](https://aws.amazon.com/api-gateway/) endpoint and returns a greeting based on the supplied name.
The environment variable that we specified in the `serverless.yml` file will make sense now.

We will start off by defining the function within our `functions.yml` file, and store the implementation itself within a `src` directory.

```yaml
hello:
  handler: src/hello.handler
  events:
    - http:
        path: /hello/{name}
        method: get
        request:
          parameters:
            paths:
              name: true
```

With this simple definition, Serverless is able to create all the AWS-specific infrastructure required for us to get the endpoint up and running.
We define a single handler which is invoked via HTTP and requires a specified name to be included with the request.

```js
const { GREETING } = process.env;

export const handler = async event => {
  const { name } = event.pathParameters || {};
  return {
    statusCode: 200,
    body: JSON.stringify({ greeting: `${GREETING} ${name}` }),
  };
};
```

Once API Gateway has passed the request to our Lambda function, we will use the supplied name to return a `200 OK` response with the associated greeting.

Now that we have some actual functionality we can interact with, we can go about deploying this application to AWS.
Simply executing `make deploy` will instruct our Dockerised Serverless Framework to package up and deploy the function, along with the required resources.
If you are interested in a more in-depth look into this process, I have created [several](https://www.youtube.com/watch?v=ke3eQv-PUC8) [different](https://www.youtube.com/watch?v=B0r3QdcCy8g) videos on the topic.
Once this has completed, an API Gateway endpoint will be presented that you can then visit to test out the service.
You can see this module installation and deployment process in action within the following screencast.

<p><script src="https://asciinema.org/a/6BAfJE1YFYLoSw0StVA9jWUaN.js" id="asciicast-6BAfJE1YFYLoSw0StVA9jWUaN" async></script></p>

With the Serverless Framework configured and a sample function now deployed, we can begin the process of implementing our API.
Join me in the next post where I will discuss the process of configuring [Amazon Cognito](https://aws.amazon.com/cognito/), the authentication service that will be used within our API.
