---
layout: post
title: 'Providing Local JS and CSS Resources for CDN Fallbacks'
meta: "Including JS and CSS fallback options for resources hosted by CDN's"
---

In a recent [podcast](http://threedevsandamaybe.com/posts/html-experiences-part-1/) the topic of using Content Delivery Networks (CDN) to host common-place resources such as jQuery and Twitter Bootstrap came up.
The merits of having access to large scale delivery infrastructures provided by Google and the possibility that the client will already have these asset cached are huge wins. <!--more-->
One pessimistic comment which can arise however, is what happens if these CDN's suddenly become unavailable.
Though highly unlikely in the case of Google's [Hosted Libraries](https://developers.google.com/speed/libraries/devguide), similar acts such development whilst offline may likely result in the same effect.
To get around this, hosting fallback local version of the assets is a worthwhile investment.
In this post I will go over three different techniques for achieving this by loading an arbitrary example of jQuery, Twitter Bootstrap JS and CSS.

## Basic

The example implementation below is the simplest example of providing the client with fallback options.
Inspired by the [HTML5 Boilerplates](http://html5boilerplate.com/) jQuery fallback example, I have expanded this solution to cater for Twitter Bootstrap.

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

To check the Bootstrap JavaScript is loaded we test for the existence of one of the provided plugins, in this case 'modal'.
The CSS is a little more tricky, on top of including the CDN provided stylesheet in the head, we wait for the page to be fully loaded and check to see if the body color matches are expectations.
If this is not the case we appended the local stylesheet to the head.
This example uses jQuery for ease of explanation, as we can be confident at this stage that at least the local version is in effect.

## YepNope

The second example takes advantage of the great [YepNope](http://yepnopejs.com/) library, providing us with the ability to test for existence of a predicate and act upon this result.
Including YepNope and the provided CSS plugin extension in the document head, we are able to be sure that the 'complete' callbacks will only be invoked when either the related JS or CSS assets have been fully loaded.

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

You will notice that this example is very similar to the basic implementation, testing for the existence of window variables and CSS body properties.
However, using this library provides you with the ability to load these assets asynchronously and in parallel (based on the ordering provided).
Supplying a sequence of resources to load allows us to be sure that jQuery will be loaded before Bootstrap, which requires this dependency.
So as to improve the clients viewing experience a one second timeout has been specified for checking if the bootstrap CSS file has been successfully loaded, before returning the local fallback.

## Fallback.js

The final example uses the incredibly small library [Fallback.js](http://fallback.io/), that was designed for this use-case in mind.
This can be seen by how simple the API is to use, with default checking of window variable existence based on the assets key name.
Similar to the features provided in YepNope such as loading resources asynchronously we are able to increase page loading times with minimal hassle.

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

The one issue with this library is that it is tied into checking the window object for resource existence.
This does not work well in the case of checking for the successful loading of CSS assets, as we are unable to override the predicate to check for body styling.
Though this is a little bit of a pain I still feel that this is the best solution to deploy, even just for the super simple API for loading JS resources.

## Resources

- [Check if Bootstrap is loaded](https://github.com/MaxCDN/bootstrap-cdn/issues/111)
- [JavaScript CDN with Fallback to Local Script](http://www.websightdesigns.com/posts/view/javascript-cdn-with-fallback-to-local-script)
- [Yepnope load from CDN with Fallback](https://coderwall.com/p/pmx_4w)
- [yepnope.js](http://yepnopejs.com/)
- [Fallback.js](http://fallback.io/)
