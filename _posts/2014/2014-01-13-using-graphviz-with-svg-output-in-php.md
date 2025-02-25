---
layout: post
title: 'Using Graphviz with SVG Output in PHP'
meta: 'Learn how to integrate Graphviz with SVG output in PHP to create interactive, scalable graphs within your markdown posts.'
tags: php graphviz svg
---

Since adding the functionality to process syntax highlighting through [Pygments](http://pygments.org/) I had been on the lookout for similar external tools that I could integrate.
One area that I felt was lacking in my posts was accompanying visual aids, which would be useful when explaining a new concept or algorithm.
Like most developers, I feel at home in an editor, so delving into another software package did not appeal to me.

<!--more-->

It was highly desirable to maintain my current workflow and store all content related to a post (unless necessary) within a single markdown file.
[Graphviz](http://www.graphviz.org/) was the tool for the job, enabling graphs to be described using a small DSL and output in a variety of formats.
Along with the ability to describe graphs in plain text, the option to output results in [SVG](http://en.wikipedia.org/wiki/Scalable_Vector_Graphics) allowed me to keep post dependencies to a minimum.
SVG (Scalable Vector Graphics) is an XML-based vector image format, providing lossless scaling and small file sizes.
This allowed me to embed outputted graphs within the rendered post, similar to the process of syntax highlighting with Pygments.

## Implementation

Below is a simple example implementation to output SVG variants of each defined graph within a supplied string (post).
I made the assumption that the 'dot' command (provided by Graphviz) is present in the user's path (this can be easily altered).
For consistency, I decided to declare graph definitions using Markdown Extra's [fenced blocks](http://michelf.ca/projects/php-markdown/extra/#fenced-code-blocks) notation, discussed further in the [Pygments post](/posts/using-pythons-pygments-syntax-highlighter-in-php/).
Providing the code block with a unique '.dot-show' language type-hint allowed me to be sure of no conflicting pre-processes.

```php
function graphviz($post)
{
    return preg_replace_callback('/~~~[\s]*\.dot-show\n(.*?)\n~~~/is', function($match)
    {
        list($orig, $dot) = $match;

        $proc = proc_open(
            'dot -Tsvg',
            [ [ 'pipe', 'r' ], [ 'pipe', 'w' ] /* ignore stderr */ ],
            $pipes
        );

        fwrite($pipes[0], $dot);
        fclose($pipes[0]);

        $output = stream_get_contents($pipes[1]);
        fclose($pipes[1]);

        if ( ! proc_close($proc)) {
            $output = preg_replace(
                '/.*<svg width="[0-9]+pt" height="([0-9]+pt)"/s',
                '<svg style="max-height:$1;" ',
                $output
            );
            $output = preg_replace('/<!--(.*)-->/Uis', '', $output);
            $output = preg_replace('/id="(.*?)"/s', 'id="$1_' . rand() . '"', $output);
        } else {
            $output = $orig;
        }

        return $output;
    }, $post);
}
```

Looking at the example above, you will notice the use of the same regular expression replacement and process command calls found in the Pygments implementation.
All that has been altered is the processing that occurred on the outputted result and, of course, the command itself.
Comments and unnecessary headers are removed from the resulting output, along with the inclusion of random 'id' element names (as multiple graphs may use the same names).
The 'max-height' style replaces the defined width and height of the SVG element to fix an issue I found in maintaining the height ratio when resizing the graph.

## Examples

Now that we have an example implementation to work with, let's see some of the impressive results we can achieve when using Graphviz and SVG output.

### UML Class Diagram

Inspired by the excellent article found [here](http://www.ffnn.nl/pages/articles/media/uml-diagrams-using-graphviz-dot.php), I was able to describe a simple UML Class Diagram in .dot notation and output the results in SVG.

```
digraph G
{
    node [
        shape = "record"
    ]
    Animal [
        label = "{Animal|+ name : string\l+ age : int\l|+ walk() : void\l}"
    ]
    Dog [
        label = "{Dog||+ bark() : void\l}"
    ]
    Cat [
        label = "{Cat||+ meow() : void\l}"
    ]
    edge [
        arrowhead = "empty"
    ]
    Dog -> Animal
    Cat -> Animal
    edge [
        arrowhead = "none"
        headlabel = "0..*"
        taillabel = "0..*"
    ]
}
```

### Binary Tree

```
digraph G
{
    graph[ordering="out"];
    null[shape=point];
    5 -> 3;
    5 -> 8;
    3 -> 1;
    3 -> 4;
    8 -> 6;
    8 -> null;
}
```

### Circularly Doubly Linked-List

```
digraph G
{
    n1 [label="Linked List|{size: 3}",
    shape=record];
    n1 -> n2 [label="sentinel"];
    n2 [label="Entry|{null}",shape=record];
    n2 -> n3 [label="next"];
    n3 [label="Entry|{A}",shape=record];
    n3 -> n4 [label="next"];
    n4 [label="Entry|{B}",shape=record];
    n4 -> n5 [label="next"];
    n5 [label="Entry|{C}",shape=record];
    n5 -> n2 [label="next"];
    n5 -> n4 [label="previous"];
    n4 -> n3 [label="previous"];
    n3 -> n2 [label="previous"];
    n2 -> n5 [label="previous"];
}
```

### Huffman Coding Tree

Using [this](http://huffman.ooz.ie/) generator I was able to visually represent the Huffman Tree for a given string.

```
{%- raw -%}
digraph G
{
    edge [label=0];
    graph [ranksep=0];
    O [shape=record, label="{{O|2}|000}"];
    W [shape=record, label="{{W|2}|001}"];
    D [shape=record, label="{{D|1}|0100}"];
    H [shape=record, label="{{H|1}|0101}"];
    SPACE [shape=record, label="{{SPACE|2}|011}"];
    DHSPACE [label=4];
    T [shape=record, label="{{T|1}|1000}"];
    COMA [shape=record, label="{{COMA|1}|1001}"];
    TCOMA [label=2];
    S [shape=record, label="{{S|1}|1010}"];
    R [shape=record, label="{{R|1}|1011}"];
    SR [label=2];
    TCOMASR [label=4];
    E [shape=record, label="{{E|3}|110}"];
    L [shape=record, label="{{L|3}|111}"];
    18 -> 8 -> 4 -> O;
    DHSPACE -> 2 -> D;
    10 -> TCOMASR -> TCOMA -> T;
    SR -> S;
    6 -> E;4 -> W [label=1];
    2 -> H [label=1];
    8 -> DHSPACE -> SPACE [label=1];
    TCOMA -> COMA [label=1];
    TCOMASR -> SR -> R [label=1];
    18 -> 10 -> 6 -> L [label=1];
}
{% endraw -%}
```

## Resources

- [Graphviz](http://www.graphviz.org/)
- [Pygments](http://pygments.org/)
- [Using Python's Pygments Syntax Highlighter in PHP](/posts/using-pythons-pygments-syntax-highlighter-in-php/)
- [UML Diagrams Using Graphviz Dot](http://www.ffnn.nl/pages/articles/media/uml-diagrams-using-graphviz-dot.php)
- [Huffman Tree Generator](http://huffman.ooz.ie/)
- [Visualising Java Data Structures as Graphs](https://www.cs.auckland.ac.nz/~j-hamer/ACE04-paper.pdf)
