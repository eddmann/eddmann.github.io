---
layout: post
title: 'Building a Video Hugo Shortcode for Local and Remote Content'
meta: 'Learn how to create a custom Hugo shortcode for embedding both local and remote video content using the HTML5 video element.'
tags: ['hugo', 'shortcode']
---

Hugo provides a means of including YouTube and Vimeo content within Markdown via the concept of [embedded shortcodes](https://gohugo.io/content-management/shortcodes/#embedded).
However, I required a way to embed other forms of local and remote video content, such as those playable via the `video` HTML element.
To achieve this, I built a [custom shortcode](https://gohugo.io/content-management/shortcodes/#custom) for Hugo.

<!--more-->

## What Are Shortcodes?

Shortcodes provide a way to include custom markup (with optional arguments) in Markdown, which is then parsed and rendered based on defined templates.
This allows you to avoid embedding HTML markup directly in your Markdown, separating these markup concerns from the final desired rendered output.

## The Video Shortcode

Below is the Video shortcode that I created, which handles both local (standard and [page resources](https://gohugo.io/content-management/page-resources/)) and remote video media content.

```
{{- $source := $.Get "src" -}}
{{- if not $source -}}
  {{- errorf "Video 'src' must be supplied" -}}
{{- end -}}
{{- $video := or ($.Page.Resources.GetMatch $source) (resources.GetMatch $source) -}}
{{- $type := $.Get "type" -}}
{{- if $video -}}
  {{- $type = $type | default $video.MediaType.Type -}}
{{- end -}}
{{- if not $type -}}
  {{- errorf "Video 'type' must be supplied" -}}
{{- end -}}
{{- $caption := $.Get "caption" -}}
{{- $preload := $.Get "preload" | default "metadata" -}}
{{- $controls := $.Get "controls" | default true -}}
{{- $muted := $.Get "muted" -}}
{{- $loop := $.Get "loop" -}}
{{- $autoplay := $.Get "autoplay" -}}
{{- $poster := $.Get "poster" -}}

{{- if $caption -}}
<figure>
{{- end -}}
  <video preload="{{ $preload }}"
    {{- if $controls }} controls{{ end -}}
    {{- if $muted }} muted{{ end -}}
    {{- if $loop }} loop{{ end -}}
    {{- if $autoplay }} autoplay{{ end -}}
    {{- with $poster }} poster="{{ . }}"{{ end -}}>
    <source
      src="{{ with $video }}{{ .RelPermalink }}{{ else }}{{ $source }}{{ end }}"
      type="{{ $type }}"
    >
    Your browser does not support the video element.
  </video>
{{- with $caption -}}
  <figcaption>{{ . }}</figcaption>
</figure>
{{- end -}}
```

This shortcode can be used as follows:

```
{{\< video src="local-video.mp4" >}}
{{\< video src="local-video.mp4" type="video/mp4" loop="true" muted="true" >}}
{{\< video src="https://remote.com/video.mp4" type="video/mp4" >}}
```

The shortcode ensures that a `src` argument has been supplied and, based on this, attempts to automatically determine the video MIME type in the case of local content.
If a `type` argument is explicitly supplied, however, this is honoured over the determined MIME type.
Along with this, the user is able to optionally configure all the available attributes found on the `video` element.

It is by no means perfect, but it meets my requirements for including additional video content on this blog.
Hopefully, this can be of use to someone else moving forward.
