---
layout: post
title: 'Twitter API v1.1 User Timeline JavaScript Solution'
meta: 'Learn how to process Twitter user timelines using Twitter API v1.1 in JavaScript without OAuth by implementing a custom solution.'
tags: ['twitter', 'javascript']
---

When I redesigned my site earlier this year I wanted to include the last couple of Twitter interactions in the footer.
Using v1.0 of the Twitter API, this was a very simple process, giving access to a JSONP response with the publicly available tweets of a specified handle.
This all [changed](http://dev.twitter.com/discussions/11564) in v1.1 with the introduction of required OAuth.
Fortunately, I was able to find a workaround [here](http://jasonmayes.com/projects/twitterApi/) which took advantage of the response made available from a widget you create.
However, the returned tweets in this solution were already styled somewhat and I could not find an unminified version of the source.
So in the end I decided to spend 45 minutes last night implementing my own solution.

<!--more-->

Using the same request method that is present in the Twitter Fetcher project (major kudos), I request the widget response, and then parse the returned tweets into objects for your callback delights.

```js
var TweetFetcher = function (id) {
  this.id = id;
  this.instance = 'tf_' + new Date().getTime();
  window[this.instance] = this;
};

TweetFetcher.prototype.fetch = function (cb, limit) {
  this.cb = cb;
  this.limit = limit || 20;

  var s = document.createElement('script');
  s.src =
    '//cdn.syndication.twimg.com/widgets/timelines/' +
    encodeURIComponent(this.id) +
    '?&lang=en&callback=' +
    encodeURIComponent(this.instance + '.parse') +
    '&suppress_response_codes=true&rnd=' +
    new Date().getTime();
  document.getElementsByTagName('head')[0].appendChild(s);
};

TweetFetcher.prototype.parse = function (res) {
  var raw = document.createElement('div');
  raw.innerHTML = res.body;

  var tweets = raw.querySelectorAll('li.tweet'),
    limit = tweets.length < this.limit ? tweets.length : this.limit,
    output = [];

  for (var i = 0; i < limit; i++) {
    var tr = tweets[i],
      t = {};

    t.id = tr.getAttribute('data-tweet-id');
    t.author = {
      handle: tr.querySelector('span.p-nickname b').innerText,
      name: tr.querySelector('span.p-name').innerText,
    };
    t.time = {
      stamp: tr.querySelector('time.dt-updated').getAttribute('datetime'),
      pretty: tr.querySelector('time.dt-updated').getAttribute('aria-label'),
    };
    t.isRetweet = !!tr.querySelector('.retweet-credit');
    t.retweets = tr.querySelector('span.stats-retweets')
      ? parseInt(tr.querySelector('span.stats-retweets').innerText.replace(',', ''), 10)
      : 0;

    // delete all unnecessary tweet content tags

    var content = tr.querySelector('p.e-entry-title'),
      tags = content.querySelectorAll('*');

    for (var j = 0; j < tags.length; j++) {
      var tag = tags[j],
        k = 0,
        del = [];

      for (k = 0; k < tag.attributes.length; k++)
        if (tag.attributes[k].name !== 'href') del.push(tag.attributes[k].name);

      while (del.length) tag.removeAttribute(del.pop());
    }

    t.content = content.innerHTML.replace(/<\/?b[^>]*>/gi, '');

    output.push(t);
  }

  this.cb(output);
};
```

To parse the response, I decided to use 'querySelector/querySelectorAll', which removes a lot of the tedious DOM querying.
This script has been tested and is working on IE8, but anything older in the IE family, sadly, does not [support](http://caniuse.com/queryselector) 'querySelector'.
To use the fetcher, all you need to do is simply create a new instance (supplying the widget ID), then call 'fetch' with a callback to process the tweets once returned, and optionally a tweet limit (maximum of 20).
Below is an example of the one used on this site.

```js
var tf = new TweetFetcher('354188847791366144');

tf.fetch(function (tweets) {
  for (var output = '', i = 0, l = tweets.length; i < l; i++) {
    output +=
      '<div class="tweet col span_12">' +
      '<p class="msg">' +
      tweets[i].content +
      '</p>' +
      '<p class="meta">' +
      tweets[i].time.pretty +
      '</p>' +
      '</div>';
  }
  document.getElementById('tweets').innerHTML = output;
}, 2);
```

When the response has been parsed, the supplied callback is given an array of processed tweets, each providing the following information.

```js
{
    id: '408662284337422337',
    author: {
        handle: 'edd_mann',
        name: 'Edd Mann'
    },
    time: {
        stamp: '2013-12-05T18:20:55+0000',
        pretty: 'Posted 1 hour ago'
    },
    isRetweet: false,
    retweets: 2,
    content: 'Sample Tweet!'
}
```

I have provided a [Gist](http://gist.github.com/eddmann/7812893) of the above script for anyone wishing to make improvements or updates.
