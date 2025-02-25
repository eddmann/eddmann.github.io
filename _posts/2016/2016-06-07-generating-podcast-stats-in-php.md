---
layout: post
title: 'Generating Podcast Stats in PHP'
meta: 'Creating simple podcast stats stored in YAML front-matter using PHP'
---

In the [100th episode](http://threedevsandamaybe.com/the-one-hundredth-episode/) of Three Devs and a Maybe I decided to generate some stats relating to the previous 99 episodes and formed a small quiz out of these findings.
All information relating to each podcast is stored in separate Markdown files within YAML front-matter, which makes it easy to pull out and process.
I thought it would be interesting to go over the code I used to achieve this.

<!--more-->

### Parsing the YAML front-matter

The first job we need to do is to parse each of the podcasts front-matter into a format that we can processed in PHP.

```php
$podcasts = array_reduce(scandir(POSTS_DIR), function ($meta, $fileName) {
    if (strpos($fileName, '.') === 0) {
        return $meta;
    }

    if (!preg_match_all('/^([a-z]+):\s+([^\n]+)/m', file_get_contents(POSTS_DIR . '/' . $fileName), $match)) {
        return $meta;
    }

    return array_merge($meta, [array_combine($match[1], $match[2])]);
}, []);
```

### Stats, stats, stats

With the podcast meta-data now in a format with can process, we can now go about generating some stats.

```php
// Total size
array_sum(array_column($podcasts, 'size'));

// Total duration
array_sum(array_column($podcasts, 'duration'));

// Average duration
round(array_sum(array_column($podcasts, 'duration')) / count($podcasts));
```

```php
// Release day rankings
$days = array_count_values(
    array_map(
        function ($meta) { return date_create($meta['date'])->format('D'); },
        $podcasts));
arsort($days);
implode(', ', array_map(function ($day, $total) { return "$day ($total)"; }, array_keys($days), $days));

// Release month rankings
$months = array_count_values(
    array_map(
        function ($meta) { return date_create($meta['date'])->format('M'); },
        $podcasts));
arsort($months);
implode(', ', array_map(function ($month, $total) { return "$month ($total)"; }, array_keys($months), $months));
```

```php
// Most frequent title words
$words = array_count_values(
    array_reduce($podcasts, function ($words, $m) {
        $t = trim(preg_replace('/[^a-z\s]/i', '', strtolower($m['title'])));
        return array_merge($words, explode(' ', $t));
    }, []));
arsort($words);
implode(', ', array_keys(array_slice($words, 0, 10)));
```
