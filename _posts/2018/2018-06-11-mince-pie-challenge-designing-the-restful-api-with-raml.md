---
layout: post
title: 'Mince Pie Challenge: Designing the RESTful API with RAML'
link: https://tech.mybuilder.com/mince-pie-challenge-designing-the-restful-api-with-raml/
meta: 'Mince Pie Challenge: Designing the RESTful API with RAML'
---

Now that we are aware of what needs to be done, we can go about designing the RESTful API that will be used to process and persist those vital mince pies.

<!--more-->

### REST and HAL

Before we jump in to the design phase, I would first like to briefly discuss the thought-process behind how we will be designing this API.
We will be using [REST](https://restfulapi.net/) (Representational State Transfer), which is a flexible architectural style for distributed hypertext-driven systems.
Following this approach allows for clear client/server separation (different rates-of-change), encapsulated state transitions and increased discoverability (via [HATEOAS](https://restfulapi.net/hateoas/)).
The server dictates what data/actions to return and how to react to desired client action requests - while the client is tasked with presenting this data and actions to the user.

We will also be using [HAL](http://stateless.co/hal_specification.html) (Hypertext Application Language), which is a simple format for providing hyperlinks between resources.
This enables your API to be discoverable to both humans and machines alike.

If you wish to learn more, I have had the good fortune to discuss both REST and HAL at length with [knowledgeable](http://threedevsandamaybe.com/designing-apis-with-camille-baldock/) [guests](http://threedevsandamaybe.com/api-ramblings-with-phil-sturgeon/) on past episodes of my podcast.

### RAML

[RAML](https://raml.org/) (RESTful API Modeling Language) is a language to easily describe RESTful APIs.
Following this format allows us to easily map out how an API will work and respond to a consumer, before a line of code needs to be written.
At MyBuilder we have found it highly beneficial to use an API design tool such as RAML at the start of building a new API.
In doing so, we are able to flush out the requirements in a more concrete manor, whilst still maintaining quick feedback loops.

### Bootstrap

Every story has a beginning and our APIs is the bootstrap request.
As a client, all I am initially aware of is a single endpoint and the protocol that we wish to communicate over.
So as to help aid the client in discovering more about our service, we will respond with all the available actions and some key configuration information for setting up [Amazon Cognito](https://aws.amazon.com/cognito/).

```yaml
/:
  get:
    description: |
      Provides available actions and Cognito authentication pool identifiers.
    responses:
      200:
        body:
          application/hal+json:
            example: |
              {
                "_links": {
                  "self": { "href": "/" },
                  "list": { "href": "/pies" },
                  "add": { "href": "/pies" },
                  "view": { "href": "/pies/{id}", "templated": true }
                },
                "cognito": {
                  "poolId": "eu-west-1_BXXROsWOu",
                  "clientId": "3qf6pqo467hr1tcbm3kf5sn2v3"
                },
                "baseEndpointUrl": "https://api.mincepiechallenge.com"
              }
```

Adding this additional layer of indirection in providing these actions allows us to remain in control over what the client is able to do (and how) at any given time.
This provides us with a valuable form of decoupling, with the ability to change endpoints and actions at a later date without any input from the consumer.

### Authentication

This service will delegate authenticating the client to Amazon Cognito and [JSON Web Tokens](https://jwt.io/).
This alleviates us from having to cater for user signup and login activities within the API.
Instead we are required to only ensure that a given client is authorised and meets the desired authorisation in-place.
The different forms of endpoint we will be using are as follows:

- **Public** - accessible to any client request.
- **Optional Authentication** - the response may differ based on if the client is authenticated or not.
- **Strict Authentication** - the endpoint requires the client to be authenticated.

We have already seen a public endpoint in the form of the bootstrap resource, which is available to any client request.
To permit the other two forms we will be using JSON Web Tokens.

```yaml
securitySchemes:
  optional-jwt:
    description: Optionally provide a valid JSON Web Token.
    type: x-jwt
    describedBy:
      headers:
        Authorization:
          description: Used to send a JSON Web Token with the request.
          type: string
          required: false

  strict-jwt:
    description: Requires a valid JSON Web Token be provided.
    type: x-jwt
    describedBy:
      headers:
        Authorization:
          description: Used to send a JSON Web Token with the request.
          type: string
          required: true
      responses:
        401:
          body:
            application/problem+json:
              type: object
              example: |
                {
                  "title": "Unauthorized",
                  "detail": "Service requires an authenticated user"
                }
```

RAML allows us to document how the process works, detailing the client request requirements and possible authentication related responses.

### Managing the Pies

Now that we have validated who we are to the API, we can go about documenting how we expect to add and remove pies within the challenge.

```yaml
/pies:
  post:
    description: Add a new mince pie to the challenge.
    securedBy: strict-jwt
    body:
      application/json:
        type: object
        example: |
          { "name": "Awesome Mince Pie" }
    responses:
      201:
        headers:
          Location:
            type: string
            example: '/pies/9d197f40'
        body:
          application/hal+json:
            type: object
            example: |
              {
                "_links": {
                  "self": { "href": "/pies/9d197f40" },
                  "photo": { "href": "/pies/9d197f40/photo" }
                },
                "id": "9d197f40",
                "name": "Awesome Mince Pie",
                "addedAt": "2018-06-11T12:00:00.000Z",
                "rating": { "avg": 0, "total": 0 }
              }
      400:
        body:
          application/problem+json:
            type: object
            example: |
              {
                "title": "Bad Request",
                "detail": "Invalid request body",
                "errors": [
                  { "name": "name", "reason": "You must supply the pie's name." }
                ]
              }
```

```yaml
/pies/{id}:
  delete:
    description: Remove a specified mince pie from the challenge.
    securedBy: strict-jwt
    responses:
      204:
        description: Successfully deleted the mince pie.
      403:
        body:
          application/problem+json:
            type: object
            example: |
              {
                "title": "Forbidden",
                "detail": "This mince pie does not belong to you."
              }
      404:
        body:
          application/problem+json:
            type: object
            example: |
              {
                "title": "Not Found",
                "detail": "Unable to find the specified mince pie."
              }
```

We expect the authenticated client (denoted using `securedBy`) to provide us with a valid pie to add to the challenge, else we will return a sufficient error (following [Problem Details for HTTP APIs](https://tools.ietf.org/html/rfc7807)).
In a similar manor we are able to remove a specified pie, providing that the client is authorised to do so (the pie owner).

### Uploading a Photo

We wish to delegate the responsibility of uploading and persisting the clients pie photos to [Amazon S3](https://aws.amazon.com/s3/).
To do so, we need a process in which to allow the client to request a given unique endpoint to upload these to.

```yaml
/pies/{id}/photo:
  put:
    description: Request a new photo upload URL.
    securedBy: strict-jwt
    body:
      application/json:
        type: object
        example: |
          {
            "fileExtension": "jpg",
            "contentType": "image/jpg"
          }
    responses:
      201:
        headers:
          Location:
            type: string
            example: 'http://s3.com/upload/9d197f40'
        body:
          application/hal+json:
            type: object
            example: |
              {
                "_links": {
                  "self": { "href": "http://s3.com/upload/9d197f40" }
                },
                "url": "http://s3.com/upload/9d197f40"
              }
      400:
        body:
          application/problem+json:
            type: object
            example: |
              {
                "title": "Bad Request",
                "detail": "Invalid request body",
                "errors": [
                  { "name": "fileExtension", "reason": "You must supply the file extension." },
                  { "name": "contentType", "reason": "You must supply the content-type." }
                ]
              }
      403:
        body:
          application/problem+json:
            type: object
            examples:
              not-owner: |
                {
                  "title": "Forbidden",
                  "detail": "This mince pie does not belong to you."
                }
              photo-present: |
                {
                  "title": "Forbidden",
                  "detail": "This mince pie already has a photo."
                }
      404:
        body:
          application/problem+json:
            type: object
            example: |
              {
                "title": "Not Found",
                "detail": "Unable to find the specified mince pie."
              }
```

Providing the authenticated client owns the specified pie we accept the desired photos extension and content-type.
From this we return a unique endpoint that the client can upload the expected file to.
This allows us to remain in control of what content gets uploaded, but without the need to actually manage the upload process itself.

### Viewing the Pies

So as to allow the client to browse all the available pies, we will provide a listing which partially embeds all the pie resources (saving on many HTTP requests).
Although this is not strictly allowed within the HAL specification (it should be the entire sub-resource), we have found no negative impact in following this practise, 'filling in the rest' upon subsequent client requests to the specific resource.

```yaml
/pies:
  get:
    description: List all available mince pie's in the challenge.
    responses:
      200:
        body:
          application/hal+json:
            type: object
            example: |
              {
                "_links": {
                  "self": { "href": "/pies" }
                },
                "_embedded": {
                  "pies": [
                    {
                      "_links": {
                        "self": { "href": "/pies/9d197f40" }
                      },
                      "id": "9d197f40",
                      "name": "Awesome Mince Pie",
                      "thumbnail": "http://s3.com/9d197f40.jpg",
                      "rating": { "avg": 5, "total": 1 }
                    }
                  ]
                },
                "total": 1
              }
```

In the case of a detailed pie view, we wish to provide the client with the possible actions that are available to them.
These will differ based on if they are authenticated and/or the owner of the specified pie.

```yaml
/pies/{id}:
  get:
    description: View a specified mince pie.
    securedBy: optional-jwt
    responses:
      200:
        body:
          application/hal+json:
            type: object
            example: |
              {
                "_links": {
                  "self": { "href": "/pies/9d197f40" },
                  "photo?": { "href": "/pies/9d197f40/photo" },
                  "rate?": { "href": "/pies/9d197f40/rate" },
                  "remove?": { "href": "/pies/9d197f40" }
                },
                "id": "9d197f40",
                "name": "Awesome Mince Pie",
                "addedAt": "2018-06-11T012:00:00.000Z",
                "photo": "http://s3.com/original/9d197f40.jpg",
                "thumbnail": "http://s3.com/9d197f40.jpg",
                "rating": { "avg": 0, "total": 0 }
              }
      404:
        body:
          application/problem+json:
            type: object
            example: |
              {
                "title": "Not Found",
                "detail": "Unable to find the specified mince pie."
              }
```

We specify that the `rate`, `remove` and `photo` actions could be optionally present.
This is due to the imposed restrictions on who can remove/upload a photo for the pie (the owner), and if the authenticated client has already given a rating to this pie.

### Rating the Pies

Finally, there would be no challenge if we were not able to actually rate the pies.
Providing that the authenticated client has not already rated the pie, we allow them to submit a desired rating.

```yaml
/pies/{id}/rate:
  put:
    description: Rate a specified mince pie.
    securedBy: strict-jwt
    body:
      application/json:
        type: object
        example: |
          { "rating": 5 }
    responses:
      204:
        description: Successfully rated the mince pie.
      400:
        body:
          application/problem+json:
            type: object
            example: |
              {
                "title": "Bad Request",
                "detail": "Invalid request body",
                "errors": [
                  { "name": "rating", "reason": "You must supply a valid pie rating." }
                ]
              }
      403:
        body:
          application/problem+json:
            type: object
            example: |
              {
                "title": "Forbidden",
                "detail": "You have already rated this mince pie."
              }
      404:
        body:
          application/problem+json:
            type: object
            example: |
              {
                "title": "Not Found",
                "detail": "Unable to find the specified mince pie."
              }
```

If the rating does not meet the requirements we return a sufficient error to the client, else we signify success based on the returned HTTP status code.

### Exploring the API

We are now able to experiment with this API, using proposed user-stories and exploring how the state transitions work.
There are many [different](https://github.com/mulesoft/osprey) [tools](https://github.com/RePoChO/raml-mocker) available to bring this API to life, allowing you to handle mock service calls.

I have found it beneficial to produce clear, easy-to-read documentation from the specification using [raml2html](https://github.com/raml2html/raml2html).
You can explore this [documentation](/uploads/mince-pie-challenge-designing-the-restful-api-with-raml/api.html) and the complete underlying [specification](/uploads/mince-pie-challenge-designing-the-restful-api-with-raml/api.raml) at your leisure.

<a href="/uploads/mince-pie-challenge-designing-the-restful-api-with-raml/api.html"><img src="/uploads/mince-pie-challenge-designing-the-restful-api-with-raml/api-documentation.png" alt="API Documentation" /></a>

With the API design now finalised we can move on to actually building it!
Join me in the next post were we will go about locally setting up the Serverless Framework with Docker, Webpack and Babel.
