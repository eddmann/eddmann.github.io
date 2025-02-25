---
layout: post
title: 'Developing a Resizable-Indexed Array as a PHP Extension with Joe Watkins'
meta: 'PHP Extension screencast discussing how to implement a Resizable-Indexed Array'
---

Following on from our [first screencast](/posts/php-extension-development-for-beginners-with-joe-watkins/), which touched upon how to setup a PHP extension development environment and creating a simple 'array_sum' like function.
We now further this topic by implementing a resizable-indexed array class which supplies very similar functionality to that of the SplFixedArray class. <!--more-->
Throughout this discussion we look into creating a custom Zend object class, using this to invoke an implemented data-structure located in another file, implementing internal interfaces, object handlers and the importance of PHP extension tests.

<iframe width="640" height="360" style="margin-bottom:15px" src="https://www.youtube.com/embed/AloIn2t7bWc" frameborder="0" allowfullscreen></iframe>

- [https://github.com/krakjoe/indexed](https://github.com/krakjoe/indexed) (created extension)
- [http://blog.krakjoe.ninja/](http://blog.krakjoe.ninja/)
- [http://lxr.php.net/](http://lxr.php.net/)
