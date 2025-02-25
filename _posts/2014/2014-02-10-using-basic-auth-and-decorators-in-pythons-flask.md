---
layout: post
title: "Using Basic Auth. and Decorators in Python's Flask"
meta: 'An in-depth guide to implementing basic authentication in Python\'s Flask using decorators and virtual environments.'
tags: flask python
---

I have recently set aside some time to delve into the world of Python and all its Zen.
Being a web developer at heart, I, of course, had to look at the current options available to me.
In this post, I will guide you through creating a single-script web application using Flask and basic access authentication.
For simplicity, I assume that you have a working installation of either Python 2.7/3.3 and [virtualenv](http://www.virtualenv.org/en/latest/index.html).

<!--more-->

## Project Setup

We must first set up a new virtual environment to cleanly handle external dependencies, similar to [Composer](https://getcomposer.org/) in the PHP ecosystem.
As Python libraries are shared at the system level by default, virtualenv provides projects with their own custom installation directories.
This resolves the issue of different projects requiring different versions of the same package.

```bash
$ virtualenv venv
$ source venv/bin/activate
$ pip install Flask
```

Using the commands provided above, we first create a new virtual environment called 'venv' in the project's root directory.
To configure the Python, pip, etc. commands to take notice of the custom installation directories within the current shell instance, we must source the 'activate' script.
Finally, we install Flask using the typical pip command.

## The Application

We are now ready to implement the web application logic.
A design decision I have made is to separate the login credentials into their own settings file.
This is good practice, and with Python's "everything is an object" philosophy, defining the file is easy.

```python
USER='admin'
PASS='password'
```

As you can see, the file requires no boilerplate code and simply specifies the two desired variables.
With the settings now defined, we can move on to implementing the web application itself.

```python
from flask import Flask, Response, request
from functools import wraps

app = Flask(__name__)
app.config.from_object('settings')

def valid_credentials(username, password):
    return username == app.config['USER'] and password == app.config['PASS']

def authenticate(f):
    @wraps(f)
    def wrapper(*args, **kwargs):
        auth = request.authorization
        if not auth.username or not auth.password or not valid_credentials(auth.username, auth.password):
            return Response('Login!', 401, {'WWW-Authenticate': 'Basic realm="Login!"'})
        return f(*args, **kwargs)
    return wrapper

@app.route('/')
def index():
    return 'Hello, world!'

@app.route('/secure')
@authenticate
def secure():
    return 'Secure!'

if __name__ == '__main__':
    app.run(debug=True)
```

Using Flask's ability to import configuration options from external objects, we are able to access the specified credentials in the `valid_credentials` function.
To provide the 'secure' route with the required basic authentication, I created a simple wrapper method which is used to decorate the route.
Decorators are a super simple, yet increasingly powerful concept, allowing you to wrap function calls with other functions in a very succinct manner.
As this is an experiment, I have specified that the application be run in debug mode, enabling auto-reloading of updated files within the local development server.
Finally, we are ready to run the application.

```bash
$ python main.py
$ pip freeze > requirements.txt
```

After checking to make sure that our handiwork has been successful, we can freeze the required dependencies so as to ease future development and deployment.

## Resources

- [virtualenv](http://www.virtualenv.org/en/latest/index.html)
- [PyPI](https://pypi.python.org/pypi)
- [Flask](http://flask.pocoo.org/)
- [HTTP Basic Auth](http://flask.pocoo.org/snippets/8/)
