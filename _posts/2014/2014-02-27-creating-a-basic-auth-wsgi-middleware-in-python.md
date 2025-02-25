---
layout: post
title: 'Creating a Basic Auth. WSGI Middleware in Python'
meta: 'Learn how to implement a basic authentication WSGI middleware in Python to secure your web applications effectively.'
tags: python wsgi
---

With my recent dedicated introduction to the Python language, I have become very appreciative of the highly composable nature of [WSGI](http://en.wikipedia.org/wiki/Web_Server_Gateway_Interface) applications.
In a functional style, you are able to compose a desired application from many different components, using the middleware ideology.
The benefits of this approach can be clearly seen in the contrived example depicted below, which is based on my previous [Flask example](/posts/using-basic-auth-and-decorators-in-pythons-flask/).

<!--more-->

```python
class Auth():

    def __init__(self, app):
        self._app = app

    def __call__(self, environ, start_response):
        if self._authenticated(environ.get('HTTP_AUTHORIZATION')):
            return self._app(environ, start_response)
        return self._login(environ, start_response)

    def _authenticated(self, header):
        from base64 import b64decode
        if not header:
            return False
        _, encoded = header.split(None, 1)
        decoded = b64decode(encoded).decode('UTF-8')
        username, password = decoded.split(':', 1)
        return username == password

    def _login(self, environ, start_response):
        start_response('401 Authentication Required',
            [('Content-Type', 'text/html'),
             ('WWW-Authenticate', 'Basic realm="Login"')])
        return [b'Login']


def app(environ, start_response):
    start_response('200 OK', [('Content-Type', 'text/html')])
    return [b'Hello, world!']


if __name__ == '__main__':
    from wsgiref.simple_server import make_server
    httpd = make_server('', 8080, Auth(app))
    print('Serving on port 8080...')
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print('Goodbye!')
```

As you can see, we are able to secure a specified WSGI application with the provided 'Auth' middleware.
The advantages of using this loosely coupled approach allow us to easily replace the authentication implementation with an alternative (i.e. OAuth) in future builds, without alteration to encapsulated applications.
