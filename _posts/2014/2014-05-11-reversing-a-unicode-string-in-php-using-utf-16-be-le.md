---
layout: post
title: 'Reversing a Unicode String in PHP using UTF-16BE/LE'
meta: 'Learn how to reverse a Unicode string in PHP using UTF-16 endianness conversion for accurate results.'
tags: php
---

Last week I was bitten by the Unicode encoding issue when trying to naively manipulate a user's input using PHP's built-in string functions.
PHP simply assumes that all characters are a single byte (octet) and the provided functions use this assumption when processing a string.
In this article I will not be going into depth on the subject of Unicode representations.
I feel this topic deserves its own series of articles.
However, you should be aware that in 'Western Europe' we commonly only use the basic [ASCII](http://en.wikipedia.org/wiki/ASCII) character-set (consisting of 7 bytes).
This makes the transition to the popular 'UTF-8' Unicode representation almost seamless, as the two map one-to-one.
I wish to, however, discuss how to reverse a Unicode string (UTF-8) using a combination of [endianness](http://en.wikipedia.org/wiki/Endianness) magic and the ['strrev'](http://www.php.net/manual/en/function.strrev.php) function.

<!--more-->

To clearly highlight the examples, the function below is used throughout the post, returning how the string is represented in binary.

```php
function str2bin($str)
{
    return array_reduce(unpack('C*', $str), function($bin, $chr)
    {
        return $bin . str_pad(decbin($chr), 8, 0, STR_PAD_LEFT);
    }, '');
}
```

## Naive Approach

With many encodings that only include single-byte character representations (i.e. ASCII, ISO 8859-\*), using the in-built `strrev` function will work fine.
However, the constructed UTF-8 string below contains a combination of ASCII-compatible characters and a multi-byte 'Black Star' character.
You will notice that the two first bytes represent the 'a' and 'b' characters, and as they fit inside a single octet each they are not affected.
The issue arises, however, with the 'Black Star' character, which requires a three-byte representation.

```php
$str = json_decode('"ab\\u2605"'); // ab★
str2bin($str); // 01100001 01100010 11100010 10011000 10000101

$naive = strrev($str); // ???ba
str2bin($str); // 10000101 10011000 11100010 01100010 01100001
```

If we naively use the 'strrev' function you will notice (aided by the binary representation) that the multi-byte character is corrupted.

## Endianness Approach

This is a huge pain, but taking advantage of UTF-16's two-byte representation and endianness we are able to successfully reverse the string.
The first step is to convert the UTF-8 representation to a big-endian (most significant byte) UTF-16 representation.
The endianness is important, as you will notice that when we perform the transformation the resulting representation is changed to little-endian (least significant byte).
As we know this is the case we can specify this to encode back to UTF-8.
Finally, we are left with a string which has been correctly reversed without any corruption.

```php
$be = iconv('UTF-8', 'UTF-16BE', $str);
str2bin($be); // 00000000 01100001 00000000 01100010 00100110 00000101

$tmp = strrev($be);
str2bin($tmp); // 00000101 00100110 01100010 00000000 01100001 00000000

$res = iconv('UTF-16LE', 'UTF-8', $tmp); // ★ba
str2bin($res); // 11100010 10011000 10000101 01100010 01100001
```
