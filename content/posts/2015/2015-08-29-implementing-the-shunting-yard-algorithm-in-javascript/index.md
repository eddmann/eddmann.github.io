---
layout: post
title: 'Implementing the Shunting Yard algorithm in JavaScript'
meta: 'Parsing an infix expression into its RPN counterpart using the Shunting Yard algorithm in JavaScript'
tags: ['javascript', 'algorithms']
---

Following on from my [recent post](../2015-08-25-small-rpn-implementation-in-javascript/index.md) on implementing a small RPN parser using JavaScript, we can expand on this by handling infix expressions.
This can be achieved by initially parsing the expression into its postfix (RPN) counterpart, highlighting another use case where a stack-based approach works well. <!--more-->
Looping over each token, we either push the token to the output if it is numeric, pop from the operator stack based on precedence if it is an operator, or handle brackets accordingly.
You can find a more in-depth description of the algorithm, using Java as the example language, in a [previous post](../../2013/2013-12-23-shunting-yard-implementation-in-java/index.md).

```js
let yard = infix => {
  let ops = { '+': 1, '-': 1, '*': 2, '/': 2 };
  let peek = a => a[a.length - 1];
  let stack = [];

  return infix
    .split('')
    .reduce((output, token) => {
      if (parseFloat(token)) {
        output.push(token);
      }

      if (token in ops) {
        while (peek(stack) in ops && ops[token] <= ops[peek(stack)])
          output.push(stack.pop());
        stack.push(token);
      }

      if (token == '(') {
        stack.push(token);
      }

      if (token == ')') {
        while (peek(stack) != '(') output.push(stack.pop());
        stack.pop();
      }

      return output;
    }, [])
    .concat(stack.reverse())
    .join(' ');
};

yard('3 + 4 * 5 / (3 + 2)'); // 3 4 5 * 3 2 + / +
rpn(yard('3 + 4 * 5 / (3 + 2)')); // 7
```
