---
layout: post
title: 'Understanding Python WSGI with Examples'
meta: 'Learn how to build and deploy WSGI compliant applications in Python with detailed examples and practical use cases.'
tags: python wsgi
---

Coming from a strong PHP background, initially, exploring the web development landscape whilst delving into Python seemed rather confusing.
As Python was not originally developed for the web, a specification called [PEP 333](http://www.python.org/dev/peps/pep-0333/) was accepted, which standardised the required interface between web servers and Python web frameworks/applications.
Despite the additional complexity, the manner in which middleware applications can be integrated, along with the server choices, offers possibilities that I find hard to locate a comparable alternative for in PHP.

<!--more-->

## Basic Example

Simply put, a WSGI (Web Server Gateway Interface) compliant application must supply a callable (function or class) which accepts an 'environ' dictionary and a `start_response` function.
For a familiar PHP comparison, you can think of the 'environ' dictionary as a combination of `$_SERVER`, `$_GET` and `$_POST`, albeit with extra processing required.
This callable is expected to invoke the `start_response` function with the desired response code and header data, and then return an iterable of bytes containing the response body.

```python
def app(environ, start_response):
    start_response('200 OK', [('Content-Type', 'text/html')])
    return [b'Hello, world!']

if __name__ == '__main__':
    try:
        from wsgiref.simple_server import make_server
        httpd = make_server('', 8080, app)
        print('Serving on port 8080...')
        httpd.serve_forever()
    except KeyboardInterrupt:
        print('Goodbye.')
```

Using the single-threaded [WSGI reference](http://docs.python.org/3.3/library/wsgiref.html) implementation provided with Python is a great choice for experimenting with these lower-level concepts.
You will notice that as the example is written for Python 3, we must return an iterable (in this case a list) with declared 'byte' content inside.

## Post Example

Now that we are familiar with the basic structure of a WSGI compliant application, we can experiment with a more practical example.
Below, we provide the client with a simple form which posts a supplied 'name' for the application to greet accordingly.

```python
import cgi

form = b'''
<html>
    <head>
        <title>Hello User!</title>
    </head>
    <body>
        <form method="post">
            <label>Hello</label>
            <input type="text" name="name">
            <input type="submit" value="Go">
        </form>
    </body>
</html>
'''

def app(environ, start_response):
    html = form

    if environ['REQUEST_METHOD'] == 'POST':
        post_env = environ.copy()
        post_env['QUERY_STRING'] = ''
        post = cgi.FieldStorage(
            fp=environ['wsgi.input'],
            environ=post_env,
            keep_blank_values=True
        )
        html = b'Hello, ' + post['name'].value + '!'

    start_response('200 OK', [('Content-Type', 'text/html')])
    return [html]

if __name__ == '__main__':
    try:
        from wsgiref.simple_server import make_server
        httpd = make_server('', 8080, app)
        print('Serving on port 8080...')
        httpd.serve_forever()
    except KeyboardInterrupt:
        print('Goodbye.')
```

Although somewhat verbose, we have been able to create a simple web application which handles supplied POST data using the CGI module's `FieldStorage` class.
These are the very simplified building blocks used in popular frameworks such as [Flask](http://flask.pocoo.org/) and [Django](http://www.djangoproject.com/).
