---
layout: post
title: 'Creating a Command Line Application to Fetch URL Titles in Go'
meta: 'A comprehensive guide to developing a cross-platform command-line application in Go that fetches URL titles using concurrent programming techniques and Docker.'
tags: go docker
---

When writing show-notes for [Three Devs and a Maybe](https://threedevsandamaybe.com/) it is tedious work to extract the associated show-link titles and generate a Markdown list from them.
This is something that I have [documented in the past](https://eddmann.com/posts/fetching-link-titles-using-promises-and-async-await-in-javascript/), providing an automated solution to this problem.
However, in this post I would like to discuss implementing such a command-line tool using [Golang](https://golang.org/), creating self-reliant executables that can be cross-compiled for Mac, Windows and Linux.

<!--more-->

The command-line application (entitled `urls-to-md`) will read in the latest clipboard contents, and then fetch the associated titles per URL found (using concurrent [Goroutines](https://tour.golang.org/concurrency/1)).
It will then generate a Markdown list representation of these results and output this to the clipboard for easy inclusion into the show-notes.

## Setting up the Development Toolchain with Docker

The first step to creating this application is to set up the required development environment dependencies.
We will be containerising this environment using Docker, allowing others to easily set up and continue development in the future.
To start we will create a new `Dockerfile` with the following definition.

```docker
FROM golang:1.10-alpine3.8
RUN apk update; apk upgrade
RUN apk add git
RUN go get -u github.com/golang/dep/cmd/dep
WORKDIR /go/src/app
VOLUME ["/go/src/app"]
```

This definition will create an image based on the official `golang:1.10-alpine3.8` release.
It then ensures that all packages are up-to-date and includes [dep](https://github.com/golang/dep) for managing dependencies within Go.
From here we can add our first targets to a `Makefile`.

```make
IMAGE_NAME=eddmann/urls-to-md

image:
  docker build -t $(IMAGE_NAME) .

shell:
  docker run --rm -v "$(PWD)":/go/src/app $(IMAGE_NAME) /bin/sh
```

## Writing the Application

With this `Makefile` present we can then execute `make image` and subsequently `make shell`.
This will bring up a terminal session within a running container instance, allowing us to commence building our command-line application.
Within this session we will execute `dep init`, which will create initial `Gopkg.lock` and `Gopkg.toml` files to keep our dependencies in check.

From here, we will create the Go application within `urls-to-md.go`.

```go
package main

import (
  "fmt"
  "github.com/PuerkitoBio/goquery"
  "github.com/atotto/clipboard"
  "net/url"
  "strings"
)

func isValidUri(uri string) bool {
  _, err := url.ParseRequestURI(uri)

  return err == nil
}

func toUrlList(input string) []string {
  list := strings.Split(strings.TrimSpace(input), "\n")
  urls := make([]string, 0)

  for _, url := range list {
    if isValidUri(url) {
      urls = append(urls, url)
    }
  }

  return urls
}

type UrlTitle struct {
  idx   int
  url   string
  title string
}

func fetchUrlTitles(urls []string) []*UrlTitle {
  ch := make(chan *UrlTitle, len(urls))

  for idx, url := range urls {
    go func(idx int, url string) {
      doc, err := goquery.NewDocument(url)

      if err != nil {
        ch <- &UrlTitle{idx, url, ""}
      } else {
        ch <- &UrlTitle{idx, url, doc.Find("title").Text()}
      }
    }(idx, url)
  }

  urlsWithTitles := make([]*UrlTitle, len(urls))

  for _ = range urls {
    urlWithTitle := <-ch
    urlsWithTitles[urlWithTitle.idx] = urlWithTitle
  }

  return urlsWithTitles
}

func toMarkdownList(urlsWithTitles []*UrlTitle) string {
  markdown := ""

  for _, urlWithTitle := range urlsWithTitles {
    markdown += fmt.Sprintf("- [%s](%s)\n", urlWithTitle.title, urlWithTitle.url)
  }

  return strings.TrimSpace(markdown)
}

func main() {
  input, _ := clipboard.ReadAll()

  urls := toUrlList(input)

  if len(urls) == 0 {
    fmt.Println("No URLs found in clipboard.")
    return
  }

  urlsWithTitles := fetchUrlTitles(urls)

  markdown := toMarkdownList(urlsWithTitles)

  fmt.Println(markdown)

  clipboard.WriteAll(markdown)
}
```

This application takes advantage of a couple of third-party dependencies ([clipboard](https://github.com/atotto/clipboard) and [goquery](https://github.com/PuerkitoBio/goquery)) to read from and write to the system clipboard, and to locate the title contents from the URL response.

We encapsulate every URL request into light-weight Goroutines, allowing these calls to occur concurrently.
As the order in which these channels complete cannot be relied upon, we ensure that the results are put back in the same order that we received them.

With this in place we can pull down and make the third-party dependencies available (within a `vendors` directory) by adding and executing the following target to the `Makefile`.

```make
deps:
  docker run --rm -v "$(PWD)":/go/src/app $(IMAGE_NAME) dep ensure
```

## Distributing the Application

Finally, we can cross-compile this command-line application for all the desired systems by adding and executing the following new target within the `Makefile`.

```make
DIST_OS=darwin linux windows
DIST_ARCH=amd64

build:
  docker run --rm -v "$(PWD)":/go/src/app $(IMAGE_NAME) /bin/sh -c ' \
    rm -fr ./dist/*; \
    for GOOS in $(DIST_OS); do \
      for GOARCH in $(DIST_ARCH); do \
        GOOS=$$GOOS GOARCH=$$GOARCH go build -o ./dist/urls-to-md-$$GOOS-$$GOARCH ./urls-to-md.go; \
      done; \
    done;'
```

This target will compile individual executable artefacts for all the specified operating system and architecture combinations.
We should now be able to test the relevant artefact for the host system you are currently using, in my case macOS.

<img src="/uploads/creating-a-command-line-application-to-fetch-url-titles-in-go/urls-to-md-darwin-amd64.gif" alt="Command Line Application Demo" />

I hope you have found it interesting looking into developing and distributing a trivial command-line application using Golang.
The ability to compile native system binaries that can be shared is a powerful concept, and for small applications like this it is extremely useful.

You can find the full source-code for this application within the [GitHub repository](https://github.com/eddmann/urls-to-md).
