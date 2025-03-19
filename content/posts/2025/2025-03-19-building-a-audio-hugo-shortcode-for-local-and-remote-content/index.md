---
layout: post
title: 'Building a Audio Hugo Shortcode for Local and Remote Content'
meta: 'Learn how to create a custom Hugo shortcode for embedding both local and remote audio content using the HTML5 audio element.'
tags: ['hugo', 'shortcode']
---

Hugo provides a means of including _limited_ amounts of video content (YouTube and Vimeo) within Markdown via the concept of [embedded shortcodes](https://gohugo.io/content-management/shortcodes/#embedded).
In a recent post, I discussed a [shortcode](../2025-03-18-building-a-video-hugo-shortcode-for-local-and-remote-content/index.md) that I had made to embed local and remote video content.
However, I also required a means to embed audio content, such as that playable via the `audio` HTML element.
To achieve this, I built a [custom shortcode](https://gohugo.io/content-management/shortcodes/#custom) for Hugo.

<!--more-->

## What Are Shortcodes?

Shortcodes provide a way to include custom markup (with optional arguments) in Markdown, which is then parsed and rendered based on defined templates.
This allows you to avoid embedding HTML markup directly in your Markdown, separating these markup concerns from the final desired rendered output.

## The Audio Shortcode

Below is the audio shortcode that I created, which handles both local (standard and [page resources](https://gohugo.io/content-management/page-resources/)) and remote audio media content.

```
{{- $source := $.Get "src" -}}
{{- if not $source -}}
  {{- errorf "Audio 'src' must be supplied" -}}
{{- end -}}
{{- $audio := or ($.Page.Resources.GetMatch $source) (resources.GetMatch $source) -}}
{{- $type := $.Get "type" -}}
{{- if $audio -}}
  {{- $type = $type | default $audio.MediaType.Type -}}
{{- end -}}
{{- if not $type -}}
  {{- errorf "Audio 'type' must be supplied" -}}
{{- end -}}
{{- $caption := $.Get "caption" -}}
{{- $preload := $.Get "preload" | default "metadata" -}}
{{- $controls := $.Get "controls" | default true -}}
{{- $muted := $.Get "muted" -}}
{{- $loop := $.Get "loop" -}}
{{- $autoplay := $.Get "autoplay" -}}

{{- if $caption -}}
<figure>
{{- end -}}
  <audio preload="{{ $preload }}"
    {{- if $controls }} controls{{ end -}}
    {{- if $muted }} muted{{ end -}}
    {{- if $loop }} loop{{ end -}}
    {{- if $autoplay }} autoplay{{ end -}}>
    <source
      src="{{ with $audio }}{{ .RelPermalink }}{{ else }}{{ $source }}{{ end }}"
      type="{{ $type }}"
    >
    Your browser does not support the audio element.
  </audio>
{{- with $caption -}}
  <figcaption>{{ . }}</figcaption>
</figure>
{{- end -}}
```

This shortcode can be used as follows:

```
{{\< audio src="local-audio.mp3" >}}
{{\< audio src="local-audio.mp3" type="audio/mpeg" loop="true" muted="true" >}}
{{\< audio src="https://remote.com/audio.mp3" type="audio/mpeg" >}}
```

The shortcode ensures that a `src` argument has been supplied and, based on this, attempts to automatically determine the audio MIME type in the case of local content.
If a `type` argument is explicitly supplied, however, this is honoured over the determined MIME type.
Along with this, the user is able to optionally configure all the available attributes found on the `audio` element.

It is by no means perfect, but it meets my requirements for including additional audio content on this blog.
Hopefully, this can be of use to someone else moving forward.
