---
layout: post
title: 'Open external links in a new window using JavaScript'
meta: 'Discover an easy and effective method to automatically open external links in a new window using JavaScript and jQuery.'
tags: ['javascript']
---

It is good practise to open external links in a new window.
However, it can be a bit tedious to remember to include `target="_blank"`, especially in Markdown.
To get around this, I have incorporated a simple raw JavaScript solution, which can be found below.

<!--more-->

```js
for (var links = document.getElementsByTagName('a'), i = 0, l = links.length; i < l; i++) {
  var link = links[i];
  if (link.getAttribute('href') && link.hostname !== location.hostname) link.target = '_blank';
}
```

If you have access to jQuery on the page, then a more elegant solution presented below would be more appealing.

```js
$('a[href^="http"]')
  .not('[href*="' + location.hostname + '"]')
  .attr('target', '_blank');
```
