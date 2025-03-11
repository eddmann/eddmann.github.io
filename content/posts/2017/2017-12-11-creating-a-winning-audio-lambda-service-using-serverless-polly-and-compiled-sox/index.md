---
layout: post
title: "Creating a 'Winning' Audio Lambda Service using Serverless, Polly and compiled SOX"
meta: "Learn how to build a 'Winning' audio Lambda service using the Serverless framework, AWS Polly and compiled SOX. This comprehensive guide covers compiling native code, integrating AWS services and generating dynamic audio outputs."
tags: ['serverless', 'aws', 'lambda', 'javascript']
---

Following on from my previous post which discussed [manipulating images](../2017-12-04-memes-as-a-service-using-lambda-serverless-and-imagemagick/index.md), I would now like to expand upon this and look into how you can interact with audio using Lambda.
To highlight this use-case we will be creating a simple service which, given a name and an optional voice (provided by [Polly](https://aws.amazon.com/polly/)), will synthesise the name and include it in a returned "And the winner is..." applause MP3 file.
This will demonstrate how to integrate Polly within Lambda, compile and execute native code within Lambda and return a binary MP3 file to the client.

<!--more-->

## Compiling SOX for Lambda

As we wish to join our static intro and outro audio files with the dynamically produced Polly response, we will need an application that can achieve this.
I have decided to use [SOX](http://sox.sourceforge.net/) for this task, as it provides us with a very simple API for joining multiple files together into a single track.
Lambda allows us to execute natively compiled code, providing that it has been correctly compiled for the underlying host operating system.
To correctly compile SOX for Lambda, we will be using a [Docker image](https://github.com/lambci/docker-lambda) which locally replicates the environment as best it can, providing all the necessary build tooling.
First, we need to start up a container (of this image) with `bash` running, so we can compile SOX and its required dependencies.

```bash
$ docker run -it lambci/lambda:build bash
```

This will pull down the required image from Docker Hub and begin a `bash` interpreter session.
Within this session, we will start by compiling [MPEG Audio Decoder](https://sourceforge.net/projects/mad/), which is a dependency of SOX.

```bash
$ curl -L -o libmad-0.15.1b.tar.gz "http://downloads.sourceforge.net/project/mad/libmad/0.15.1b/libmad-0.15.1b.tar.gz"
$ tar zxf libmad-0.15.1b.tar.gz && cd libmad-0.15.1b
$ sed -i '/-fforce-mem/d' configure # https://stackoverflow.com/questions/14015747/gccs-fforce-mem-option
$ ./configure --prefix=/usr/libmad-0.15.1b --disable-shared --enable-static
$ make && make install
```

Next we will compile [LAME](http://lame.sourceforge.net/), which will allow us to encode the desired MP3 audio file within SOX.

```bash
$ curl -L -o lame-3.100.tar.gz "https://downloads.sourceforge.net/project/lame/lame/3.100/lame-3.100.tar.gz"
$ tar zxf lame-3.100.tar.gz && cd lame-3.100
$ ./configure --prefix=/usr/lame-3.100 --disable-shared --enable-static
$ make && make install
```

Finally, we are able to compile SOX, providing locations to the previously compiled libraries.

```bash
$ curl -L -o sox-14.4.2.tar.bz2 "http://downloads.sourceforge.net/project/sox/sox/14.4.2/sox-14.4.2.tar.bz2"
$ tar jxf sox-14.4.2.tar.bz2 && cd sox-14.4.2
$ CPPFLAGS="-I/usr/libmad-0.15.1b/include -I/usr/lame-3.100/include" \
  LDFLAGS="-L/usr/libmad-0.15.1b/lib -L/usr/lame-3.100/lib" \
  ./configure --prefix=/usr/sox-14.4.2 --disable-shared --enable-static
$ make && make install
```

You will notice that we have [statically compiled](https://en.wikipedia.org/wiki/Static_build#Static_building) all these applications, as we desire to depend on only a single executable within the Lambda service.
With SOX now compiled, we can open up a host terminal session and copy the newly compiled `sox` executable from the container.

```bash
$ docker ps # displays the running container's ID
$ docker cp {CONTAINER-ID}:/usr/sox-14.4.2/bin/sox ~/sox
```

## Creating the Serverless Project

Now with the native executable compiled, we can create the accompanying Lambda service.
In a similar manner to the previous blog post, we will first create a skeleton [Serverless](https://serverless.com/) project template.

```bash
$ serverless create --template aws-nodejs --path and-the-winner-is
```

Running this will create the basic handler and Serverless definition file.
Replace the given Serverless definition file with the following:

```yaml
service: and-the-winner-is

provider:
  name: aws
  runtime: nodejs6.10
  stage: prod
  region: eu-west-1
  environment:
    SOX_EXEC: ./sox
    INTRO_FILE: ./intro.mp3
    OUTRO_FILE: ./outro.mp3
  iamRoleStatements:
    - Effect: Allow
      Action:
        - polly:DescribeVoices
        - polly:SynthesizeSpeech
      Resource: '*'

plugins:
  - serverless-apigw-binary

custom:
  apigwBinary:
    types:
      - '*/*'

functions:
  winner:
    handler: handler.winner
    events:
      - http:
          path: /
          method: get
```

This configuration defines a single Lambda function which is exposed via a root API Gateway path.
It also provides a couple of environment variables which specify the SOX executable location, along with the desired intro and outro audio files.
We then use a [Serverless plugin](https://github.com/maciejtreder/serverless-apigw-binary) to correctly add binary support to the API Gateway.
As we desire to use Polly within Lambda, we permit access to both the `DescribeVoices` and `SynthesizeSpeech` actions.
Before continuing, we should include the Serverless plugin we have defined as a development dependency.

```bash
$ npm install serverless-apigw-binary --save-dev
```

## Synthesising the Name

With this definition in place, we will move on to generating (synthesising) the name provided by the client using Polly.
If the client does not supply a desired voice, we will randomly choose one from the list of available options.
After creating a new file called `synthesise-name.js`, copy the following functions into the file:

```js
'use strict';

const AWS = require('aws-sdk');

const random = arr => arr[Math.floor(Math.random() * arr.length)];

const polly = new AWS.Polly();

const getRandomVoice = () =>
  new Promise((res, rej) => {
    polly.describeVoices({}, function (err, { Voices }) {
      if (err) rej(err);
      else res(random(Voices).Id);
    });
  });

const synthesiseSpeech = (text, voice) =>
  new Promise((res, rej) => {
    const params = {
      OutputFormat: 'mp3',
      SampleRate: '22050',
      Text: text,
      TextType: 'text',
      VoiceId: voice,
    };

    polly.synthesizeSpeech(params, function (err, speech) {
      if (err) rej(err);
      else res(speech.AudioStream);
    });
  });

module.exports = (name, voice = undefined) =>
  Promise.resolve(voice || getRandomVoice()).then(voice => synthesiseSpeech(name, voice));
```

We have a couple of helper functions - one returns a randomly selected Polly voice (if no voice is supplied), and another generates the audio representation of the supplied name.
Combining these two helpers returns an audio buffer stream which we can later use in our response.

## Joining audio files using SOX

Having synthesised the client's desired name, we now wish to join the multiple audio files together and generate the output track.
SOX requires that all audio files be of the same sample rate and channel count to successfully produce a joined file.
As Polly returns a mono-channel audio file with a sample rate of 22050, the intro and outro I have provided are re-sampled to these requirements.
After creating a new file called `generate-track.js`, copy the following logic into the file:

```js
'use strict';

const fs = require('fs');
const tempfile = require('tempfile');
const childProcess = require('child_process');

const { SOX_EXEC, INTRO_FILE, OUTRO_FILE } = process.env;

module.exports = nameAudio => {
  const nameTempFile = tempfile('.mp3');
  fs.writeFileSync(nameTempFile, nameAudio);

  const trackTempFile = tempfile('.mp3');
  childProcess.execFileSync(SOX_EXEC, [INTRO_FILE, nameTempFile, OUTRO_FILE, trackTempFile]);

  return fs.readFileSync(trackTempFile);
};
```

This function simply takes in the audio buffer stream returned from the Polly service and writes it to a temporary file.
We use an external temporary file library to achieve this, so we need to include it as a project dependency.

```bash
$ npm install tempfile --save
```

We then supply this file, along with the intro and outro audio files, to the SOX executable to generate the final joined output track.
As this output is written to a temporary file, we then read its contents into a buffer which we can later use within our service.

## Wiring it all together

With the two key problems now solved, we can now wire the handler together.
Replace the sample `handler.js` file contents with the following:

```js
'use strict';

const synthesiseName = require('./synthesise-name');
const generateTrack = require('./generate-track');

module.exports.winner = (event, context, callback) => {
  const input = event.queryStringParameters || {};

  synthesiseName(input.name || 'All of us', input.voice)
    .then(generateTrack)
    .then(track => {
      callback(null, {
        statusCode: 200,
        headers: { 'Content-Type': 'audio/mpeg' },
        body: track.toString('base64'),
        isBase64Encoded: true,
      });
    });
};
```

This composes the two functions together, returning the resulting audio track back to the client.
API Gateway requires that we Base-64 encode the binary response, so we do so within the callback.

## We are all winners

With the implementation now fully complete, we can deploy the Lambda service by executing:

```bash
$ serverless deploy -v
```

Finally, we can visit the returned endpoint URL and enjoy creating our own winning audio tracks!
You can find the code in its entirety, along with supporting assets, in [this](https://github.com/eddmann/and-the-winner-is-serverless) GitHub repository.

{{< audio src="winner.mp3" >}}
