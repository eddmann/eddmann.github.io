---
layout: post
title: 'Fetching Link Titles using Promises and Async/Await in JavaScript'
meta: 'Exploring ways to use Promises and Async/Await to fetch Link Titles from the Clipboard'
---

One tool that I use on a regular basis when compiling the notes for a [Three Devs and a Maybe](http://threedevsandamaybe.com/) episode is a tool for converting a clipboard full of links into a Markdown formatted list.
I created this tool a while back in Python and thought it would be interesting to see how it may look in JavaScript when combined with Promises and Async/Await functions.

<!--more-->

The implementations below uses the following Node dependencies.

```js
import fetch from 'node-fetch';
import { AllHtmlEntities } from 'html-entities';
const entities = new AllHtmlEntities();
import { copy, paste } from 'copy-paste';
```

## Fetching Clipboard Links

I made a conscious effort to try and break up the problem as much as I could, so as to create smaller, more concise functions.
The first problem to solve was fetching the links from the clipboard and then parsing this input into an array.
You will notice that I am wrapping the callback-based `paste` asynchronous approach with a Promise so I can interact with it in the same way as the rest of the application functions.

```js
const fromClipboard = () => new Promise((res, _) => paste((_, x) => res(x)));

const toLinks = s => s.split('\n').map(s => s.trim());

const fetchClipboardLinks = () => fromClipboard().then(toLinks);
```

## Fetching and Extracting Link Titles

Now that we have the desired input we can fetch and extract the titles for each of the links.
Notice how I have created functions which handle an individual link transformation, and then used a `Promise.all` invocation to handle the array provided.

```js
const extractTitle = r =>
  r.ok ? r.text().then(t => t.match(/<title[^>]*>([^<]+)<\/title>/)[1]) : '';

const cleanTitle = t => entities.decode(t.trim());

const fetchTitleForLink = l => fetch(l).then(extractTitle).then(cleanTitle);

const fetchTitlesForLinks = ls => Promise.all(ls.map(fetchTitleForLink));
```

## Copying the Markdown List to the Clipboard

Finally, we need to 'zip' up the links and their associated titles and then transform this list into Markdown, which is subsequently copied to the clipboard.

```js
const zip = x => y => x.map((ele, idx) => [ele, y[idx]]);

const toMarkdownList = arr =>
  arr.map(([href, title]) => `- [${title}](${href})`).join('\n');

const toClipboard = x => new Promise((res, _) => copy(x, () => res(x)));
```

## Putting it Together

The functions we have created are very small, and as a result very descriptive/composable in their nature.
Below is a basic Promise based approach to stitching the functions together to solve the problem laid out.

```js
fetchClipboardLinks()
  .then(ls => fetchTitlesForLinks(ls).then(zip(ls)))
  .then(toMarkdownList)
  .then(toClipboard)
  .then(console.log)
  .catch(console.error);
```

We are also able to take advantage of a proposed ES2016 feature which will add async/await capabilites to JavaScript.
You will notice that the solution below follows a more sequential flow, allowing you to clearly see how each asynchronous part is built up and combined to produce the result.

```js
(async function linksToMarkdownList() {
  const links = await fetchClipboardLinks();
  const titles = await fetchTitlesForLinks(links);
  const list = toMarkdownList(zip(links)(titles));
  await toClipboard(list);
  console.log(list);
})();
```
