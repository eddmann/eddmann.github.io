---
layout: post
title: "An alternative to 'var_dump' in PHP"
meta: "Discover a custom alternative to PHP's var_dump function that improves HTML presentation, displays context details, and offers a die-after-dump feature for efficient debugging."
tags: php debugging
---

Whilst working with PHP, I seem to use `var_dump` a ridiculous amount.
It's a debugging must-have.
However, it does fall short in a few ways.
It does not take into consideration that the function is almost always displayed on an HTML page, and switching to the page source can be troublesome.
Due to these pitfalls, a host of projects such as [Krumo](http://krumo.sourceforge.net/) and [Kint](http://raveren.github.io/kint/) have emerged to cater for these needs.
In addition to these projects, if you have [XDebug](http://xdebug.org/) installed, it will replace the default `var_dump` function with its own implementation that outputs the information with much-needed styling.

<!--more-->

For me though, I do not need all the bells and whistles that these provide.
My base requirements are:

- Better presentation on an HTML page, without the need to view the source.
- Output of the file, class, function, and line that called the function.
- The ability to end script execution immediately after outputting the information (for easier debugging).

## The code...

So, as a result of these requirements, I created the two simple functions below.
I am sure there are many similar implementations available online, but these two serve me well.

```php
function dump()
{
  $args = func_get_args();

  echo "\n<pre style=\"border:1px solid #ccc;padding:10px;" .
       "margin:10px;font:14px courier;background:whitesmoke;" .
       "display:block;border-radius:4px;\">\n";

  $trace = debug_backtrace(false);
  $offset = (@$trace[2]['function'] === 'dump_d') ? 2 : 0;

  echo "<span style=\"color:red\">" .
       @$trace[1+$offset]['class'] . "</span>:" .
       "<span style=\"color:blue;\">" .
       @$trace[1+$offset]['function'] . "</span>:" .
       @$trace[0+$offset]['line'] . " " .
       "<span style=\"color:green;\">" .
       @$trace[0+$offset]['file'] . "</span>\n";

  if ( ! empty($args)) {
    call_user_func_array('var_dump', $args);
  }

  echo "</pre>\n";
}

function dump_d()
{
  call_user_func_array('dump', func_get_args());
  die();
}
```

## Resources

- [A Gist of the above implementation](http://gist.github.com/3692379)
- [Kint](http://raveren.github.io/kint/)
- [Krumo](http://krumo.sourceforge.net/)
- [XDebug](http://xdebug.org/)
