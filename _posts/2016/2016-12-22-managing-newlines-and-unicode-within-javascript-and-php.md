---
layout: post
title: 'Managing Newlines and Unicode within JavaScript and PHP'
meta: 'Learn how to handle newline inconsistencies and Unicode character length differences between JavaScript and PHP to ensure accurate text processing.'
tags: javascript php
---

We were recently sent a tweet regarding a text-area client/server-side length validation not correlating.
After some detective work, we were able to find two issues that could have caused this to occur.
In this post, I wish to discuss our findings and how we resolved each issue.

<!--more-->

## Newlines

The first issue we noticed was when newlines were present within the text-area input.
It seemed that client-side, newlines were being represented with a single character, whereas on the server, two were instead used.
Reading a section of the HTML5 specification confirmed our suspicions.

> The API value... is normalized so that line breaks use "LF" (U+000A) characters. Finally, there is the form submission value. It is normalized so that line breaks use U+000D CARRIAGE RETURN "CRLF" (U+000A) character pairs...
> [https://www.w3.org/TR/html5/forms.html#the-textarea-element](https://www.w3.org/TR/html5/forms.html#the-textarea-element)

## Unicode Characters

The second issue we observed was when the text-area contained a character outside the [Basic Multilingual Plane](<https://en.wikipedia.org/wiki/Plane_(Unicode)#Basic_Multilingual_Plane>).
There are a couple of [very](https://mathiasbynens.be/notes/javascript-unicode) [interesting](https://mathiasbynens.be/notes/javascript-encoding) [articles](https://mathiasbynens.be/notes/es6-unicode-regex) discussing Unicode support within JavaScript that I highly recommend reading.
In short, JavaScript represents strings as a collection of unsigned 16-bit integers.
This means that any character that does not fit within 16 bits (requiring a [surrogate pair](http://unicodebook.readthedocs.io/unicode_encodings.html#utf-16-surrogate-pairs)) will instead have a length of two when calling `.length`.

```js
'a'.length; // 1
'🍕'.length; // 2!
```

This can get even more confusing when you then wish to send that string to the server.
The general consensus is to use UTF-8 character encoding during transmission (default as of HTML5), and this means that a character can be represented with between one and four bytes.
So, in the case of the above examples, a naive `strlen` will return:

```php
strlen('a'); // 1
strlen('🍕'); // 4!
```

> The beauty of UTF-8 is that the ASCII character set can be represented with the identical single binary value.

## Newline Solution

With these two problems in mind, we set out to tackle them.
Regarding the newline issue, we decided that a newline would represent a single character within the supplied limit.
As the HTML5 standard handles this for us within the browser, all we are required to do is replace occurrences of CRLF on the server side.

```php
strlen(str_replace("\r", '', $message)); // 1
```

## Unicode Solution

That was relatively easy to resolve - now both newlines on the client and server side correlated with one another.
Next, we needed to address the Unicode issue - we had fortunately already resolved this on the server side thanks to the PHP [`mb_*`](http://php.net/manual/en/book.mbstring.php) functions.
As we had specified that our default encoding was UTF-8, we did not have to include the desired encoding upon invocation.

```php
mb_strlen('🍕'); // 1
```

> Instead of naively byte-processing the length of the string as `strlen` does, `mb_strlen` takes into consideration the encoding and is able to discern multi-byte characters.

On the client side, we were still faced with the issue of characters containing a surrogate pair.
To handle this use case when calculating the length, we took inspiration from [this](https://mathiasbynens.be/notes/javascript-unicode) article.
We decided to replace any characters that lay outside of the BMP with a single one that did (in the case below, a simple '\_').
An alternative approach, if you were using ES6, would be to use `Array.from`, which correctly handles the character encoding used.

```js
'🍕'.replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, '_').length; // 1
```
