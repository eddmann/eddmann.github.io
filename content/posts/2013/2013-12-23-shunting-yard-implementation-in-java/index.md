---
layout: post
title: 'Shunting Yard Implementation in Java'
meta: 'A comprehensive guide to implementing the Shunting Yard algorithm in Java, converting infix expressions to postfix notation with a clear code example and detailed explanation.'
tags: ['java', 'algorithms']
---

The Shunting Yard algorithm was developed by the great [Edsger Dijkstra](http://en.wikipedia.org/wiki/Edsger_Dijkstra) as a means to parse an infix mathematical expression into Reverse Polish notation (postfix).
Using this notation allows the computer to evaluate the expression in a simple stack-based form, [examples](../2013-12-15-reverse-polish-notation-rpn-in-scala/index.md) of which I have shown in Scala previously.
The algorithm itself also uses a stack along with a built-up output string to create the resulting value.
Below is an example implementation which only takes into consideration brackets and the four common operator precedences.
Although it is possible to evaluate more, including functions and associativity, I decided to keep the implementation simple to better highlight the process.

<!--more-->

```java
import java.util.*;

public class ShuntingYard {

    private enum Operator
    {
        ADD(1), SUBTRACT(2), MULTIPLY(3), DIVIDE(4);
        final int precedence;
        Operator(int p) { precedence = p; }
    }

    private static Map<String, Operator> ops = new HashMap<String, Operator>() {{
        put("+", Operator.ADD);
        put("-", Operator.SUBTRACT);
        put("*", Operator.MULTIPLY);
        put("/", Operator.DIVIDE);
    }};

    private static boolean isHigherPrec(String op, String sub)
    {
        return (ops.containsKey(sub) && ops.get(sub).precedence >= ops.get(op).precedence);
    }

    public static String postfix(String infix)
    {
        StringBuilder output = new StringBuilder();
        Deque<String> stack  = new LinkedList<>();

        for (String token : infix.split("\\s")) {
            // operator
            if (ops.containsKey(token)) {
                while (!stack.isEmpty() && isHigherPrec(token, stack.peek()))
                    output.append(stack.pop()).append(' ');
                stack.push(token);

            // left parenthesis
            } else if (token.equals("(")) {
                stack.push(token);

            // right parenthesis
            } else if (token.equals(")")) {
                while (!stack.peek().equals("("))
                    output.append(stack.pop()).append(' ');
                stack.pop();

            // digit
            } else {
                output.append(token).append(' ');
            }
        }

        while (!stack.isEmpty())
            output.append(stack.pop()).append(' ');

        return output.toString();
    }

}
```

The example implementation above first creates an enumerated type called `Operator` which stores the increasing precedence of the four operators.
Following this, a map is initialised using [double bracket syntax](http://c2.com/cgi/wiki?DoubleBraceInitialization), pairing the enumerated type with its symbol equivalent.
Supplying the postfix method with an infix string causes the string to be split on whitespace and each token to be evaluated.
The next step depends on the subject matter.
If the token is a digit, it is added to the output string immediately.
If, on the other hand, it is a left parenthesis, it is added to the stack and kept there until a corresponding right parenthesis appears.
When this is the case, the contents of the stack are appended to the output string until the left parenthesis is reached.
If the token is an operator, each operator on the stack is appended to the output string until the operator at the top of the stack has a lower precedence than the token.
Once this condition is met, the token is pushed onto the stack.
Finally, the remaining items in the stack are appended to the `StringBuilder` output, and the resulting string is returned.

```java
postfix("( 5 + 7 ) * 2") // 5 7 + 2 *
postfix("5 + 7 / 2")     // 5 7 2 / +
```

## Resources

- [Converting Infix to RPN](http://andreinc.net/2010/10/05/converting-infix-to-rpn-shunting-yard-algorithm/)
- [Shunting Yard Algorithm - Intro and Reverse Polish Notation](http://www.youtube.com/watch?v=QzVVjboyb0s)
- [What is the significance of Reverse Polish notation?](http://cs.stackexchange.com/questions/4666/what-is-the-significance-of-reverse-polish-notation)
- [Double Brace Initialisation](http://c2.com/cgi/wiki?DoubleBraceInitialization)
