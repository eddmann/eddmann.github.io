---
layout: post
title: 'Processing a List of Links using Python and BeautifulSoup'
meta: 'Learn how to automate link processing and generate Markdown formatted lists using a Python script with BeautifulSoup and xerox.'
tags: ['python']
---

Whilst uploading the [weekly podcast](https://threedevsandamaybe.com/) I am required to produce a list of links discussed on the show.
This can become a little tedious, as I must visit each link to find a suitable title.
Additionally, when using Markdown, you must provide lists in a specific format.
I had been doing this manually for a couple of weeks, and last night I thought, "I am a developer; I should automate this.".

<!--more-->

Below is a simple script I wrote in Python 3 that grabs the latest entry from your clipboard (a list of links) and then processes them into the specified format.
By default, it creates a Markdown formatted list, but this can be changed at the command line by supplying another Python-format compliant string.
The script requires access to an environment with the "[xerox](https://pypi.python.org/pypi/xerox/)" and "[beautifulsoup4](https://pypi.python.org/pypi/beautifulsoup4)" packages installed.

```python
#!/usr/bin/env python3
import sys, requests, xerox
from bs4 import BeautifulSoup
from requests.exceptions import InvalidSchema, MissingSchema

template = sys.argv[1] if len(sys.argv) > 1 else '- [{title}]({url})'
links = []

for link in xerox.paste().split('\n'):
    try:
        url = link.strip()
        print(url, '... ' , end='')
        req = requests.get(url)
        res = BeautifulSoup(req.text)
        title = res.title.string.strip()
        links.append(template.format(title=title, url=req.url))
        print(title)
    except (InvalidSchema, MissingSchema) as exp:
        print('x')

xerox.copy('\n'.join(links))
```

For convenience of invocation, I store this script in my '~/bin' directory with execute privileges, allowing me to avoid having to specify the Python interpreter.
