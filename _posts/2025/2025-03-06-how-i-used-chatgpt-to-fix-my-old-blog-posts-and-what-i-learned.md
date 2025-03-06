---
layout: post
title: 'How I Used ChatGPT to Fix My Old Blog Posts (And What I Learned)'
meta: 'Exploring how large language models (LLMs) can enhance blog content review, technical accuracy, and image generation for a more engaging and accessible experience.'
tags: llm chatgpt accessibility
---

Over the past week, I have dedicated some of my free time to a long-overdue blog redesign.
During this process, I stumbled upon several glaring spelling mistakes in older posts, which led me down the path of manually reviewing all my previous entries.
This felt a lot like [yak shaving](https://en.wiktionary.org/wiki/yak_shaving), prompting me to consider whether leveraging a Large Language Model (LLM) could be an effective solution to this problem.

<!--more-->

![A futuristic workspace with a glowing keyboard, digital pen, and a holographic display showing "AI-POWERED EDITING" and a robotic figure.](/uploads/how-i-used-chatgpt-to-fix-my-old-blog-posts-and-what-i-learned/editor.jpg)

## Content Review

My initial goal was to ensure that blog content was grammatically correct and free of spelling mistakes.
While numerous tools are available, such as [Grammarly](https://www.grammarly.com/), I found that large language models (LLMs) offer exceptional contextual understanding, enhancing the review process.

Beyond this, I also wished to leverage LLMs for summarisation - one of their most powerful features.
Specifically, I aimed to have the model revise each blog post's meta description and add relevant tags, which would be highly beneficial for the upcoming blog redesign.
Over the years, I had been pretty lax in the time spent writing meta descriptions, and many older posts lacked tags altogether.

To achieve this, I used the following prompt with the GPT-4o model:

````
You are a highly skilled technical blog post reviewer. Your task is to review the provided Markdown technical blog post while ensuring the following:

- *Correct spelling and grammar mistakes* without altering the meaning or shortening the content.
- Use *British English* throughout.
- Ensure that *each sentence in a Markdown paragraph* (ending in a full stop) appears on a *new line*, without trailing whitespace.
- Ensure all *Markdown syntax* and *heading casing* are correct.
- Add an *SEO-optimised meta description* within the YAML front matter using the format: `meta: <description>`.
- Include *at least two relevant tags* (in snake_case) within the YAML front matter, following this format: `tags: tag1 my-tag-2 tag3`.
- Convert all code blocks formatted as ```<lang> to ~~~<lang>.

Return the entire reviewed Markdown content inside a *single code block*.

<content>
````

Notably, I requested code blocks to be returned in the `~~~` format and the output to be enclosed within a single code block.
Since I have been using ChatGPT instead of the API for these experiments, I wanted to ensure the results were easily transferable to raw Markdown rather than being formatted for conversational output.

> _An interesting takeaway:_ Iterating on the prompt itself - using the LLM to refine it - significantly improved the resulting output.

## Technical Review

When running the above prompt on the blog posts, I noticed that it not only reviewed the textual content but also identified errors in the code examples!
This observation led me to consider that the model could review both the content and the _intent_ behind the blog post.
I wondered whether it could assess if the article fulfilled its intended purpose as stated in the introduction, whether it ended abruptly, and if it was technically accurate.

I then experimented with the following prompt, coupled with the GPT-4o model, to obtain this feedback:

```
You are a highly skilled technical blog post reviewer.
Your task is to review the provided Markdown technical blog post for technical accuracy and coherence.
Please provide suggestions for any necessary corrections or improvements.

<content>
```

Much like the previous prompt, this provided me with some very interesting insights.
Rather than allowing the LLM to simply replace content for me, I used its feedback as a set of points to consider during revision.

> _An interesting takeaway:_ I found that specifying the language, e.g., "You are a highly skilled {language} blog post reviewer," significantly improved the quality of the output.

## Image Generation

I find that adding images to a blog post makes it more engaging.
Therefore, I thought it would be interesting to have the LLM generate a suitable image to accompany the blog post.

I approached this in two steps:

1. First, I asked the model (GPT-4o) to describe an image that would complement the blog based on its title.
   In some cases, I requested multiple descriptions and selected the most appropriate one.
2. Then, I used the model (DALL·E) to generate the image based on this description.

```
Generate a detailed description for an image that should accompany the blog post entitled '<title>'.
Ensure the image is visually appealing and relevant to the content.
```

I found that making small iterative tweaks to the resulting image was challenging, as even minor adjustments could significantly alter it.
Instead, generating multiple versions and selecting the _best one_ proved to be an effective strategy.

## Image Descriptions

In the past, I often found my image `alt` text lacking detail, making it less useful for users relying on screen readers.
Using the LLM, I was able to create more precise and informative descriptions.

I used the following prompt to generate suitable alternative text for newly created images:

```
Describe the following image for use in an HTML `alt` tag.
Ensure the response is short, informative and concise.
```

LLMs excel at describing images succinctly, providing clear and informative descriptions.
This approach has helped me improve the accessibility of my blog, ensuring that all users can better understand the content of my images.

## Conclusion

What started as a _small task_ turned into a fascinating investigation, and I am pleased with the results.

Throughout this process, I used ChatGPT via my Plus subscription rather than the API, as I was not ready to explore its pricing model just yet.
However, my findings suggest potential for automation - perhaps even developing an automated blog reviewer in the future 🤔.
Aside: it will be interesting to see how the ChatGPT and API products differ.

For now, though, my focus is finally back on redesigning the blog! 🎨
