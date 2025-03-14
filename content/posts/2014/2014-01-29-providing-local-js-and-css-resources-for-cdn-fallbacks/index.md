---
layout: post
title: 'Providing Local JS and CSS Resources for CDN Fallbacks'
meta: 'Learn how to provide reliable local JavaScript and CSS fallback options for CDN-hosted assets such as jQuery and Twitter Bootstrap.'
summary: 'In a recent podcast the topic of using Content Delivery Networks (CDN) to host commonly used resources such as jQuery and Twitter Bootstrap came up. The merits of having access to large-scale delivery infrastructure provided by Google etc. are significant.'
tags: ['cdn', 'javascript', 'css']
---

In a recent [podcast](https://threedevsandamaybe.com/html-experiences-part-1/) the topic of using Content Delivery Networks (CDN) to host commonly used resources such as jQuery and Twitter Bootstrap came up.
The merits of having access to large-scale delivery infrastructure provided by Google etc. are significant.
There is also the possibility that the client will already have these assets cached.
One pessimistic comment which can arise, however, is what happens if these CDNs suddenly become unavailable.
Though highly unlikely in the case of Google's [Hosted Libraries](https://developers.google.com/speed/libraries/devguide), similar issues during development whilst offline may result in the same effect.
To overcome this, hosting a local fallback version of the assets is a worthwhile investment.
In this post I will go over three different techniques for achieving this by loading an arbitrary example of jQuery, Twitter Bootstrap JS and CSS.

## Basic

The example implementation below is the simplest example of providing the client with fallback options.
Inspired by the [HTML5 Boilerplate](http://html5boilerplate.com/) jQuery fallback example, I have expanded this solution to cater for Twitter Bootstrap.

```html
<!-- jQuery -->
<script src="//ajax.googleapis.com/ajax/libs/jquery/1.10.2/jquery.min.js"></script>
<script>
  window.jQuery || document.write('<script src="/js/jquery-1.10.2.min.js"><\/script>');
</script>

<!-- Bootstrap -->
<script src="//netdna.bootstrapcdn.com/bootstrap/3.0.3/js/bootstrap.min.js"></script>
<script>
  window.jQuery.fn.modal || document.write('<script src="/js/bootstrap-3.0.3.min.js"><\/script>');
</script>
<script>
  (function ($) {
    $(function () {
      if ($('body').css('color') !== 'rgb(51, 51, 51)') {
        $('head').prepend('<link rel="stylesheet" href="/css/bootstrap-3.0.3.min.css">');
      }
    });
  })(window.jQuery);
</script>
```

To check that the Bootstrap JavaScript is loaded, we test for the existence of one of the provided plugins – in this case, 'modal'.
The CSS is a little more tricky.
In addition to including the CDN-provided stylesheet in the head, we wait for the page to be fully loaded and then check to see if the body colour matches our expectations.
If this is not the case, we append the local stylesheet to the head.
This example uses jQuery for ease of explanation, as we can be confident at this stage that at least the local version is in effect.

## YepNope

The second example takes advantage of the excellent [YepNope](http://yepnopejs.com/) library, which provides us with the ability to test for the existence of a predicate and act upon the result.
By including YepNope and the provided CSS plugin extension in the document head, we are able to ensure that the 'complete' callbacks are only invoked when the related JS or CSS assets have been fully loaded.

```js
yepnope([
  {
    load: '//ajax.googleapis.com/ajax/libs/jquery/1.10.2/jquery.min.js',
    complete: function () {
      window.jQuery || yepnope('/js/jquery-1.10.2.min.js');
    },
  },
  {
    load: 'timeout=1000!//netdna.bootstrapcdn.com/bootstrap/3.0.3/css/bootstrap.min.css',
    complete: function () {
      $('body').css('color') == 'rgb(51, 51, 51)' || yepnope('/css/bootstrap-3.0.3.min.css');
    },
  },
  {
    load: '//netdna.bootstrapcdn.com/bootstrap/3.0.3/js/bootstrap.min.js',
    complete: function () {
      window.jQuery.fn.modal || yepnope('/js/bootstrap-3.0.3.min.js');
    },
  },
]);
```

You will notice that this example is very similar to the basic implementation, as it tests for the existence of window variables and CSS body properties.
However, using this library provides the ability to load these assets asynchronously and in parallel (based on the ordering provided).
Supplying a sequence of resources to load ensures that jQuery will be loaded before Bootstrap, which depends on it.
To improve the client's viewing experience, a one-second timeout has been specified for checking whether the Bootstrap CSS file has been successfully loaded before returning the local fallback.

## Fallback.js

The final example utilises the extremely small library [Fallback.js](http://fallback.io/), which was designed specifically for this use-case.
This is evident from the simplicity of its API, with default checking of window variable existence based on the asset key name.
Similar to the features provided by YepNope – such as loading resources asynchronously – we can improve page loading times with minimal hassle.

```js
fallback.load(
  {
    bootstrapCss: '//netdna.bootstrapcdn.com/bootstrap/3.0.3/css/bootstrap.min.css',
    jQuery: ['//ajax.googleapis.com/ajax/libs/jquery/1.10.2/jquery.min.js', '/js/jquery-1.10.2.min.js'],
    'jQuery.fn.modal': [
      // bootstrap
      '//netdna.bootstrapcdn.com/bootstrap/3.0.3/js/bootstrap.min.js',
      '/js/bootstrap-3.0.3.min.js',
    ],
  },
  {
    shim: {
      'jQuery.fn.modal': ['jQuery'], // bootstrap
    },
  }
);
```

The one issue with this library is that it is tied to checking the window object for resource existence.
This does not work well when checking for the successful loading of CSS assets, as we are unable to override the predicate to check for body styling.
Although this is a minor inconvenience, I still feel that this is the best solution to deploy, particularly given the extremely simple API for loading JS resources.

## Resources

- [Check if Bootstrap is loaded](https://github.com/MaxCDN/bootstrap-cdn/issues/111)
- [JavaScript CDN with Fallback to Local Script](http://www.websightdesigns.com/posts/view/javascript-cdn-with-fallback-to-local-script)
- [Yepnope load from CDN with Fallback](https://coderwall.com/p/pmx_4w)
- [yepnope.js](http://yepnopejs.com/)
- [Fallback.js](http://fallback.io/)
