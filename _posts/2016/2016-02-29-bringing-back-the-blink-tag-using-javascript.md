---
layout: post
title: 'Bringing Back the Blink Tag using JavaScript'
meta: 'Quick implementation to bring back the Blink tag to modern browsers'
---

Who doesn't miss the the `blink` tag that was ever-present in years past.
I thought it would be fun to quickly code up a JavaScript implementation which replicated the functionality that has 'sadly' been removed in modern browsers.

<!--more-->

```js
document.addEventListener('DOMContentLoaded', function () {
  setInterval(function () {
    [].forEach.call(document.getElementsByTagName('blink'), function (el) {
      el.style.visibility =
        el.style.visibility === 'visible' ? 'hidden' : 'visible';
    });
  }, 500);
});
```
