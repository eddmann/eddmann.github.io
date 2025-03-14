---
layout: post
title: 'Mince Pie Challenge: Authentication with Amazon Cognito and JSON Web Tokens'
meta: 'This technical post explains how to implement authentication with Amazon Cognito and JSON Web Tokens in a Serverless environment.'
tags: ['cognito', 'serverless', 'security', 'mince-pie-challenge-series']
---

Now that we have set up the Serverless Framework, we can go about investigating how Authentication and Authorisation will be handled within the application.
For this, we will be using [Amazon Cognito](https://aws.amazon.com/cognito/), a fully managed web service which handles the user sign-up, sign-in and management processes.

<!--more-->

If you are keen to see how the finished example looks, you can access it within the [API repository](https://github.com/eddmann/mince-pie-challenge-api-serverless/tree/02-authentication).

Cognito provides us with the ability to register users to a specified [User Pool](https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-user-identity-pools.html) directory, or enable social sign-in services (such as Google).
It also includes the ability to verify supplied email addresses and include additional layers of security using [MFA](https://docs.aws.amazon.com/cognito/latest/developerguide/user-pool-settings-mfa.html).
This allows us to focus our attention on the key domain-specific functionality of the application, as opposed to reinventing the wheel.

Along with managed User Pools, Cognito also provides the concept of [Identity Pools](https://docs.aws.amazon.com/cognito/latest/developerguide/getting-started-with-identity-pools.html).
We will not be using this feature, but it is good to understand how this could be of use in future development.

> The two main components of Amazon Cognito are user pools and identity pools.
> User pools are user directories that provide sign-up and sign-in options for your app users.
> Identity pools enable you to grant your users access to other AWS services.

Cognito User Pools use [JSON Web Tokens](https://jwt.io/) to transmit and validate payloads between the client and server.
Using the Client AWS SDK, we are able to authenticate with the pool, returning a token that we can later send to the API to handle authenticated requests.

## Creating the User Pool

The first step in setting up Cognito is to define the AWS-specific resources that are required.
To do this, we will provision a User Pool and Client using [CloudFormation](https://serverless.com/framework/docs/providers/aws/guide/resources/) within `resources.yml`.

```yaml
Resources:
  PieUserPool:
    Type: AWS::Cognito::UserPool
    Properties:
      UserPoolName: ${file(./config.${self:provider.stage}.yml):userPoolName, ''}
      Policies:
        PasswordPolicy:
          MinimumLength: 6
      AliasAttributes:
        - email
      AutoVerifiedAttributes:
        - email
      Schema:
        - Name: email
          AttributeDataType: String
          Mutable: false
          Required: true

  PieUserPoolClient:
    Type: AWS::Cognito::UserPoolClient
    Properties:
      ClientName: ${file(./config.${self:provider.stage}.yml):userPoolClientName, ''}
      ExplicitAuthFlows:
        - ADMIN_NO_SRP_AUTH
      GenerateSecret: false
      UserPoolId:
        Ref: PieUserPool

Outputs:
  PieUserPoolId:
    Value:
      Ref: PieUserPool

  PieUserPoolClientId:
    Value:
      Ref: PieUserPoolClient
```

You will notice that we have decided to name the two defined resources based on values supplied within a YAML configuration file that relates to the current stage.
This allows us to isolate different groups of resources based on the environment (development, staging, production) we are currently in.
We will complete this definition by supplying the required values within `config.dev.yml`.

```yaml
userPoolName: 'dev-mince-pie-challenge-pool'
userPoolClientName: 'dev-mince-pie-challenge-client'
```

In regard to the pool itself, along with the default username and password required by the User Pool, we also specify that we would like a verified email address to be included per user.
To provide client-side access to the pool sign-up and sign-in functionality, we must also associate a [User Pool Client](https://docs.aws.amazon.com/cognito/latest/developerguide/user-pool-settings-client-apps.html) that has access to the unauthorised endpoints.

So as to test the newly created User Pool within the AWS CLI, we must include an explicit authentication flow entitled `ADMIN_NO_SRP_AUTH`, which permits the exclusion of the [Secure Remote Password Protocol (SRP)](https://en.wikipedia.org/wiki/Secure_Remote_Password_protocol).
Finally, we specify that we wish to output the two created resource identifiers, which will be presented to us within the terminal after a successful deployment.

## Authenticating a User

With the User Pool now defined, we can move our attention onto how we will authenticate an incoming request within the API.
There is an option within Amazon API Gateway to provide a [Lambda Authoriser](https://docs.aws.amazon.com/apigateway/latest/developerguide/apigateway-use-lambda-authorizer.html) (formerly known as a Custom Authoriser), which are invoked before the intended function and provide it with the generated IAM policy.
Although this approach is desirable, some of the API resource endpoints require the ability to differ based on whether the user is authenticated or not.
As such, we will instead bring this authentication logic into our application domain, and validate the claims for each intended request ourselves.

As discussed before, Cognito uses standard JSON Web Tokens, which allows us to include a pre-existing library [node-jose](https://github.com/cisco/node-jose), that abstracts away this problem space.
We will now include this dependency within the `package.json`, and create a new service within `src/services/userTokenAuthenticator.js`.

```json
{
  "dependencies": {
    "node-jose": "^1.0.0"
  }
}
```

```js
import https from 'https';
import jose from 'node-jose';

const generateKeySetUrl = poolId => {
  const region = poolId.split('_')[0];
  return `https://cognito-idp.${region}.amazonaws.com/${poolId}/.well-known/jwks.json`;
};

const fetchKey = (poolId, token) => {
  const { kid } = JSON.parse(jose.util.base64url.decode(token.split('.')[0]));

  return new Promise((res, rej) => {
    https.get(generateKeySetUrl(poolId), response => {
      if (response.statusCode !== 200) {
        rej('Unable to fetch keys');
        return;
      }

      response.on('data', body => {
        const { keys } = JSON.parse(body);
        const key = keys.find(key => key.kid === kid);

        if (!key) {
          rej('Unable to find key');
          return;
        }

        jose.JWK.asKey(key).then(res);
      });
    });
  });
};

const parseClaims = (token, key) =>
  jose.JWS.createVerify(key)
    .verify(token)
    .then(({ payload }) => {
      const claims = JSON.parse(payload);

      if (Math.floor(new Date() / 1000) > claims.exp) {
        throw Error('Token has expired');
      }

      return claims;
    });

export default poolId => async token => {
  try {
    const key = await fetchKey(poolId, token);
    const claims = await parseClaims(token, key);
    return claims.sub;
  } catch (e) {
    return undefined;
  }
};
```

This small service fetches the associated [JSON Web Key Set](https://auth0.com/docs/jwks), locates the matching key, and then verifies that the provided request token is valid.
Providing that the token has been verified to come from the intended party and has not expired, we parse the provided claims and return the user identifier.

## Constructing Handlers with User Authentication

Now that we have a means to authenticate a request and be provided with the user identifier, we can now create a framework in which to easily construct handlers with varying permission requirements.
We will now create a couple of small helper functions within `src/helpers/handlers.js`, which will be used to aid us in this pursuit.

```js
import { unauthorised } from './http';

export const createHandler = handler => services => (event, context) =>
  handler({ event, context, services });

export const withOptionalHttpAuthentication = handler => async params => {
  const { event, services } = params;
  const userId = await services.getUserIdFromToken(event.headers.Authorization);
  return handler({ ...params, userId });
};

export const withStrictHttpAuthentication = handler => async params => {
  const { event, services } = params;
  const userId = await services.getUserIdFromToken(event.headers.Authorization);
  return userId
    ? handler({ ...params, userId })
    : unauthorised('Service requires an authenticated user');
};
```

The first function is rather important.
Instead of simply returning a standard Lambda handler, we add the concept of supplying `services` to the handler.
This allows us to explicitly supply services (such as the user token authenticator) to a given handler in a controlled manner, which can be easily tested.

Following this, the next two functions show how a handler can now be composed – supplying the ability to specify if the handler requires optional (`withOptionalHttpAuthentication`) or strict (`withStrictHttpAuthentication`) authentication requirements.
In both cases, the `userId` is provided to the decorated handler.

As we are now managing how a handler is constructed within our domain, we are able to craft how the internal handler signature looks.
This leads us to opt for a single object parameter, which can be specifically destructured.
You will also notice that we have decided to delegate creation of the unauthorised HTTP response to a specific function, which is defined within `src/helpers/http.js`.

```js
export const unauthorised = detail => ({
  statusCode: 401,
  headers: {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Credentials': '*',
    'Content-Type': 'application/problem+json',
  },
  body: JSON.stringify({ title: 'Unauthorized', detail }),
});
```

This response follows the [Problem Details for HTTP APIs](https://tools.ietf.org/html/rfc7807) specification that we highlighted when defining the API within RAML in a [previous post](../2018-06-11-mince-pie-challenge-designing-the-restful-api-with-raml/index.md).

## Testing the Authenticated Handler Use-Cases

Now that we have all the pieces in place, we can experiment with how this abstraction will work in practise for the different handler use-cases we have laid out.
To do this, we will replace the Hello, World example we created in the [previous post](../2018-06-15-mince-pie-challenge-setting-up-the-serverless-framework-with-docker-webpack-and-babel/index.md#the-hello-world-example) with the following configuration (`serverless.yml`, `config.dev.yml`) and endpoints (`functions.yml`).

```yaml
provider:
  # ..
  environment:
    USER_POOL_ID: ${file(./config.${self:provider.stage}.yml):userPoolId}
  # ...
```

```yaml
# ..
userPoolId:
  Ref: PieUserPool
```

As shown before, we define the value using the one present within the current stage's YAML configuration file.
In a similar fashion to how we reference the User Pool identifier within the resource output, we can also include them as environment variables within Lambda functions.

```yaml
public:
  handler: src/auth.public_
  events:
    - http:
        path: /public
        method: get

optional:
  handler: src/auth.optional
  events:
    - http:
        path: /optional
        method: get

strict:
  handler: src/auth.strict
  events:
    - http:
        path: /strict
        method: get
```

As `public` is a reserved JavaScript keyword, we suffix the first handler with a miscellaneous `_`.
With these endpoints now defined, we can move on to creating the underlying implementations within `src/auth.js`.

```js
import {
  createHandler,
  withOptionalHttpAuthentication,
  withStrictHttpAuthentication,
} from './helpers/handlers';
import createUserTokenAuthenticator from './services/userTokenAuthenticator';

const handler = async ({ userId = 'N/A' }) => ({
  statusCode: 200,
  body: JSON.stringify({ userId }),
});

const getUserIdFromToken = createUserTokenAuthenticator(process.env.USER_POOL_ID);

export const public_ = createHandler(handler)({ getUserIdFromToken });
export const optional = createHandler(withOptionalHttpAuthentication(handler))({
  getUserIdFromToken,
});
export const strict = createHandler(withStrictHttpAuthentication(handler))({ getUserIdFromToken });
```

Thanks to how the handler is now constructed, we are able to re-use the underlying handler in all three use-cases.
This handler returns the request's user identifier (if present), and highlights how explicit object destructuring allows us to clearly see which parameters are being used.
Finally, we simply have to supply each handler with the concrete user token authenticator service before exporting them for consumption.

## Testing the Endpoints

Now that the three endpoints have been configured, we can move on to deploying and subsequently testing them.
First, deploy the updated application, provisioning all the associated resources and keeping a note of the User Pool and User Pool Client identifiers in the process.

For testing, we will use the ability within the [aws-cli](https://aws.amazon.com/cli/) to sign up and authenticate with a given User Pool.
In a similar fashion to how we set up the Serverless Framework with Docker, we will include a pre-existing [aws-cli image](https://github.com/mesosphere/aws-cli) within `docker-compose.yml`, referencing the same `.env` variable file that is used within Serverless.

```yaml
services:
  # ..
  aws-cli:
    image: mesosphere/aws-cli
    env_file: .env
```

With this in place, we can now create a new user within the User Pool, signing up with a unique username and email address.
We must supply the User Pool Client identifier that was created during the deployment phase, along with the region in which the User Pool was deployed.

```bash
docker-compose run --rm aws-cli cognito-idp sign-up \
  --region $AWS_REGION \
  --client-id $USER_POOL_CLIENT_ID \
  --username joe_bloggs \
  --password MySuperSecurePassw0rd! \
  --user-attributes Name=email,Value=joe_bloggs@email.com
```

Now we are required to confirm the newly created account.
This can be done manually with the following command, supplying the User Pool identifier this time.

```bash
docker-compose run --rm aws-cli cognito-idp admin-confirm-sign-up \
  --region $AWS_REGION \
  --user-pool-id $USER_POOL_ID \
  --username joe_bloggs
```

We can now generate a new authentication token for the newly created user, which can be used to make subsequent authenticated requests to the API.
This token will be output to the terminal.

```bash
docker-compose run --rm aws-cli cognito-idp admin-initiate-auth \
  --region $AWS_REGION \
  --user-pool-id $USER_POOL_ID \
  --client-id $USER_POOL_CLIENT_ID \
  --auth-flow ADMIN_NO_SRP_AUTH \
  --query AuthenticationResult.IdToken \
  --output text \
  --auth-parameters USERNAME=joe_bloggs,PASSWORD=MySuperSecurePassw0rd!
```

Finally, we can experiment with this token and make requests to each of the three different endpoints.
Notice how the behaviour of all three differs based on whether you provide a valid token or not.

```bash
http https://nw6ok0dk3k.execute-api.eu-west-1.amazonaws.com/dev/strict 'Authorization:$JSON_WEB_TOKEN'
```

We have now successfully exercised the ability to sign up and authenticate users with the application.
Join me in the [next post](../2018-07-09-mince-pie-challenge-setting-up-flow-with-babel-and-webpack/index.md) of the [series]({{< tag "mince-pie-challenge-series" >}}), where we will look into providing a level of code reassurance, adding the static type checker [Flow](https://flow.org/) to our Webpack configuration.
