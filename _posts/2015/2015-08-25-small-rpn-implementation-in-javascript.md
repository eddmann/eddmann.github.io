---
layout: post
title: 'Small RPN Implementation in JavaScript'
meta: 'Small Reverse Polish notation evaluator in JavaScript using ES2015'
---

This morning I decided to quickly write up a small reverse polish notation evaluator in JavaScript.
Evaluation of these expressions highlights the perfect use case for a stack based approach. <!--more-->
Looping over each of the supplied tokens we push to the stack either the item if it is a number or the evaluation of the last two numbers if it is an operator.
Once this iteration has been complete we end up with a single element in the stack which is the answer to the supplied expression.

```js
let rpn = (ts, s = []) => {
  ts.split(' ').forEach(t =>
    s.push(t == +t ? t : eval(s.splice(-2, 1)[0] + t + s.pop()))
  );
  return s[0];
};

rpn('26 4 + 2 *'); // 60
```
