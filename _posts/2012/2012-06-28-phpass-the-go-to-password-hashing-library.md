---
layout: post
title: 'PHPass, the go-to password hashing library'
meta: 'An in-depth exploration of PHPass as the leading password hashing library, detailing best practices for password storage and security in PHP applications.'
tags: php security hashing
---

It is becoming a scarily common occurrence to read about [yet](http://www.guardian.co.uk/technology/us-news-blog/2012/jun/07/blogpost-eharmony-linkedin-hacked-leaked) [another](http://www.bbc.co.uk/news/technology-18338956) [batch](http://www.pcworld.com/article/257178/music_site_lastfm_joins_the_passwordleak_parade.html) of high-profile websites' users' passwords being leaked online - for everyone's cracking pleasure.
What's even more shocking is how poorly these sites are storing them.
In the case of LinkedIn, it turned out that they had stored them as unsalted, plain MD5 hashes, which any Joe Bloggs could easily crack using a rainbow table.
The tried and tested means of storing passwords in today's web applications is to create a hash from the user's input, and then compare any attempted authentication with this stored value.
The trouble and confusion arise, however, in how to actually achieve this, as there are so many incorrect methods available.

<!--more-->

## How should you be storing passwords then?

After reading through countless articles and experimenting with many implementations, I have arrived at the conclusion that, as the title of this post clearly states, [PHPass](http://www.openwall.com/phpass/) is the way to go – provided that you are programming in PHP.
PHPass provides you with the latest and most effective strategies to deter malicious third parties from successfully cracking your users' passwords.
I say deter, as nothing is unbreakable, and your main aim as a developer is to make it as hard as possible for the attacker (after all, they love a challenge).

## What PHPass gives you

PHPass provides the lethal combination of salting, key stretching, and Bcrypt.

### Salting

Salting is a relatively common method used to make the process of cracking your stored hashes more difficult.
Salts are most commonly unique (technically called a [nonce](http://en.wikipedia.org/wiki/Cryptographic_nonce)), although they can be global.
They are appended or prepended to the given value, making the produced output unique regardless of the input.
The randomness for these salts is generated from multiple factors, depending on the host system.
For example, on a UNIX system, '/dev/urandom' can be used.
Salting prevents some of the most widely exploited weaknesses in today's hashing functions.
These threats include the ability to use a pre-hashed list (such as a rainbow table) on the subject, as well as the ability to reuse a cracked hash's password on another record with the same hash sequence.
I have spent many years implementing this method, both on a per-application and per-record basis.
In recent developments, I have introduced the concept of combining the two, as documented by Steve Gibson on the excellent Security Now podcast ([episode 358](http://www.grc.com/sn/sn-358.htm)).

### Key Stretching

Key stretching was a new concept to me before I started to seriously research this subject.
In its most basic form, key stretching is the process of re-running a given cryptographic function a certain number of times before returning the output.
Commonly used cryptographic hashing functions, such as MD5, SHA1, and SHA2, were not designed for password hashing but for speed.
What seemed like a complicated algorithm 10 years ago has now become an outdated concept due to [Moore's law](http://en.wikipedia.org/wiki/Moore's_law) working its magic.
These algorithms, by themselves, are simply too easy for current hardware to crack (even with a salt).
Check out [this](http://www.troyhunt.com/2012/06/our-password-hashing-has-no-clothes.html) blog post to read more.
The way we solve this issue is by performing multiple iterations (known as key stretching) of the cryptographic function on the input before returning the output.
This slows down and adds complexity to the calculation process, which is our goal as a password hashing function.
In a typical web application, hashes are computed only at login and signup.
Adding a few microseconds to this process will not affect user experience, but it increases the time required for an attacker to crack the hash exponentially.

### Bcrypt

The final piece of the PHPass puzzle is [Bcrypt](http://en.wikipedia.org/wiki/Bcrypt).
Created in 1999 by Niels Provos and David Mazieres, it was designed from the ground up to be a password-specific cryptographic hash function.
This means that it was designed to be technically slow and memory-expensive, making a brute-force attack extremely labourious – helping to put Moore's law in its place.
To help future-proof the implementation, it is adaptive and supports the use of key stretching.
This allows you to set the number of iterations per hash, as the count is stored within the output.

## A simple example

There are many good examples of how to use PHPass online (such as [this one](http://sunnyis.me/blog/secure-passwords/)), so I will keep mine short and sweet.
You can simply hash a password with PHPass using the code snippet below.

```php
require_once('PasswordHash.php');

// a new phpass instance, providing the iteration count
// and if to use the in-built MD5 crypto or not
$phpass = new PasswordHash(8, FALSE);

$password = 'password1234';

$hash = $phpass->HashPassword($password);
```

It's even easier to compare hashes, using the following code snippet.

```php
$hash = '$2a$08$ezQB7LWGLPs3RtJLS9os5...';

$password = 'password1234';

if ($phpass->CheckPassword($password, $hash))
  echo 'We have found a match!';
```

I am an avid CodeIgniter user at present, and I was happy to discover that a quick search on GitHub returned a very cool PHPass wrapper library (I love the use of the `_call` function).
The library can be found [here](http://github.com/segersjens/CodeIgniter-Phpass-Library).
The one and only point I hope you take away from this post is that if you are using PHP, you should use PHPass as your password hashing library!

## Update

Since the release of PHP 5.5, an even simpler set of functions has been added to the core (documentation found [here](http://php.net/manual/en/function.password-hash.php)), and it is recommended that you take advantage of these instead.
[Anthony Ferrara](http://blog.ircmaxell.com/), the creator of the update, has also provided a library for backwards compatibility (>= PHP 5.3.7) [here](http://github.com/ircmaxell/password_compat).
