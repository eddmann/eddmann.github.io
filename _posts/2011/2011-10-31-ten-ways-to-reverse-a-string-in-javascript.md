---
layout: post
title: 'Ten ways to reverse a string in JavaScript'
meta: 'Discover ten interesting methods to reverse a string in JavaScript, complete with performance analysis and practical code examples for coding interviews.'
tags: javascript
---

In a recent job interview, I was asked to write a simple C# function that would reverse a string and return the result.
However, there was a catch: I was unable to use the provided string object's `reverse()` function.
I successfully created a function that did as requested (using a decrementing for-loop and concatenation), though I realised that using concatenation would result in a new string being created in memory upon each iteration, as strings are immutable objects.
I solved this by using a `StringBuilder` to append each character and then returning the result.
On the way home, I began to think of the endless ways in which you could reverse a string in code (extremely sad, I know).

<!--more-->

## Implementations

Below are my ten favourite and most interesting ways I conjured up to solve the problem of reversing a string.
I decided to use JavaScript as it provided me with a quick feedback loop (in the browser) and first-class function support.

### 1: Decrementing for-loop with concatenation

```js
function reverse(s) {
  var o = '';
  for (var i = s.length - 1; i >= 0; i--) {
    o += s[i];
  }
  return o;
}
```

The original way that I achieved the intended result was to use a decrementing for-loop that appended each character of the input string in reverse order.
I was able to access the string's individual characters similar to the way you would reference an array's items.

### 2: Incrementing/decrementing for-loop with two arrays

```js
function reverse(s) {
  var o = [];
  for (var i = s.length - 1, j = 0; i >= 0; i--, j++) {
    o[j] = s[i];
  }
  return o.join('');
}
```

Another approach to reverse a string was to create an empty array and iterate over the length of the string using both incrementing and decrementing counters.
The array position utilises the incrementing counter, whereas the input string is accessed with the decrementing one.
Finally, the array is joined into a single string and returned.

### 3: Incrementing for-loop with array pushing and `charAt`

```js
function reverse(s) {
  var o = [];
  for (var i = 0, len = s.length; i <= len; i++) {
    o.push(s.charAt(len - i));
  }
  return o.join('');
}
```

This example is a modification of the second one.
Instead of using two counters, a single incrementing value is subtracted from the total length of the input string to determine the next character to push onto the new array (using the `push` function).
Another difference is that it uses the string's `charAt` method instead of its array capabilities.

### 4: In-built functions

```js
function reverse(s) {
  return s.split('').reverse().join('');
}
```

This implementation takes advantage of the `reverse` method provided by the `Array` prototype.
First, it splits the string into an array, then calls the `reverse` method, and finally returns the joined array.

### 5: Decrementing while-loop with concatenation and substring

```js
function reverse(s) {
  var i = s.length,
    o = '';
  while (i > 0) {
    o += s.substring(i - 1, i);
    i--;
  }
  return o;
}
```

Using a decrementing while-loop, I implemented this method.
Again, by harnessing concatenation, I was able to iterate through the string similarly to the for-loops used in the first two examples.
I then used the string's `substring` function to retrieve each desired character.

### 6: Single for-loop declaration with concatenation

```js
function reverse(s) {
  for (var i = s.length - 1, o = ''; i >= 0; o += s[i--]) {}
  return o;
}
```

This is most likely my favourite implementation, despite its unnecessarily cryptic nature.
Using only a single for-loop declaration, I decremented through the input string and concatenated each character to a new string to return.

### 7: Recursion with substring and charAt

```js
function reverse(s) {
  return s === '' ? '' : reverse(s.substr(1)) + s.charAt(0);
}
```

This example recursively calls itself, passing in the input string excluding the first character on each iteration, which is then appended to the result.
This process continues until no input remains (the base case), resulting in a reversed string.

### 8: Internal function recursion

```js
function reverse(s) {
  function rev(s, len, o) {
    return len === 0 ? o : rev(s, --len, (o += s[len]));
  }
  return rev(s, s.length, '');
}
```

Here is another example of using recursion to reverse a string.
The implementation utilises an internal function that is first called by the outer function, passing in the input string, its length, and an empty string.
The internal function then recursively calls itself until the length has been decremented to zero - at which point the initially empty string has been concatenated with the input string's characters in reverse order.

### 9: Half-index switch for-loop

```js
function reverse(s) {
  s = s.split('');
  var len = s.length,
    halfIndex = Math.floor(len / 2) - 1,
    tmp;
  for (var i = 0; i <= halfIndex; i++) {
    tmp = s[len - i - 1];
    s[len - i - 1] = s[i];
    s[i] = tmp;
  }
  return s.join('');
}
```

I found this method to be a very effective way of reversing a string, particularly when processing large strings.
The string's half-point is first calculated and then iterated over.
On each iteration, the upper half's value (determined by subtracting the current index from the string's length) is temporarily stored and swapped with the lower half's value, resulting in a reversed string.

### 10: Half-index recursion

```js
function reverse(s) {
  if (s.length < 2) return s;
  var halfIndex = Math.ceil(s.length / 2);
  return reverse(s.substr(halfIndex)) + reverse(s.substr(0, halfIndex));
}
```

The final method uses the same half-indexing idea as the previous implementation but relies on recursion to reverse the string instead of a for-loop.

## Performance

It is all fun and games being a JavaScript _ninja_ and finding interesting tricks to complete quite a mundane task.
However, the real-world performance of your implementation is what matters most to the end user.
To assess how effective each implementation is, I tested their performance using an online tool called [JSPref](http://jsperf.com).
JSPref allows you to create unit-style test suites, which can then be run on any browser you have access to.
What makes this tool so great is that it stores the results of each run in the cloud, providing easily accessible, meaningful graphs and statistics.
In the test suite, each function was called multiple times (with time measured and an average calculated) one after the other with a randomly generated 20-character-long string to be reversed.

![A graph showing the performance of the ten implementations in four browsers](/uploads/ten-ways-to-reverse-a-string-in-javascript/browser-performance.png)

Above is a screenshot (without the key) of one of the graphs that JSPref provided for the result set.
I ran the test suite five times on the four most popular browsers to gather a large breadth of data to analyse.
You will notice that Chrome is by far the fastest browser at running each implementation, with significant speed boosts when using the _first_ and _sixth_ implementations.
This is a testament to the time and optimisation that has gone into the development of the V8 JavaScript engine.
What surprised me, however, was how ineffective the built-in function implementation was on almost all tested browsers.
The exception was IE 9, which surprisingly ran it the fastest compared to all the other browsers and implementations.

Best performing implementation(s) per browser

- Chrome 15 - _Implemations 1 and 6_
- Firefox 7 - _Implementation 6_
- IE 9 - _Implementation 4_
- Opera 12 - _Implementation 9_

To conclude, upon reflection of the processed data, I believe that the first implementation is the most favourable one to use in production, as it consistently scores well across all browsers.
I am surprised by this conclusion, as I thought that string concatenation was a costly operation, especially when performed repeatedly.
This analysis leads me to believe that browser vendors have heavily optimised this process, given its prevalence in everyday coding tasks.

## Resources

- [JSPref](http://jsperf.com/)
- [String Reverse Function Performance - JSPref](http://jsperf.com/string-reverse-function-performance)
- [How do you reverse a string in-place in JavaScript? - StackOverflow](http://stackoverflow.com/questions/958908/how-do-you-reverse-a-string-in-place-in-javascript)
