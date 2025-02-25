---
layout: post
title: 'Compiling PHP 5.5 with ZTS and pthreads Support'
meta: 'A comprehensive guide to compiling PHP 5.5 from source with ZTS and pthreads support on CentOS 6.5.'
tags: php pthreads
---

[POSIX Threads](http://en.wikipedia.org/wiki/POSIX_Threads) are a standard for threading implementations available in many Unix-like operating systems.
Written in C, they provide developers with high-level thread management methods, synchronisation, etc. <!--more-->
Support for these methods in PHP is provided by an extension called [pthreads](http://pthreads.org/), enabling user-land multi-threaded applications to be built.
Designed in a similar manner to the implementation specified in Java, PHP can now create, read, write, execute and synchronise with Threads, Workers and Stackables.
This is a major step in the right direction for PHP development, providing better-suited solutions than simply [forking](<http://en.wikipedia.org/wiki/Fork_(system_call)>) (process copying).
To experiment with this extension, however, it is required to have a PHP built with ZTS enabled (thread-safety support).
This option can only be specified at compile-time, and as such I felt that it would be an ideal time to provide a simple guide to compile PHP from source.
For this example, I am working with a base CentOS 6.5 installation.

## Compiling PHP 5.5 with ZTS Support

To compile PHP from source, we must first make sure the required development tools are present (such as GCC).
One issue that cropped up when trying to install the 'Development Tools' group was the complaint of not having access to kernel packages.
To overcome this problem, I simply removed `kernel*` from the excluded list provided in `/etc/yum.conf`.

```bash
$ sed -i "s/^\exclude.*$/exclude=/g" /etc/yum.conf
$ yum groupinstall -y 'Development Tools'
```

Looking at the first command above, we remove all excludes that have currently been set.
In my case, this was only `kernel*`, but I recommend you check your setup first.
We are now able to install the required packages to download the compressed source code and compile the XML library provided in PHP.
I decided to set a global variable with the desired version of PHP I wished to compile, making the command listing more flexible when updates arise.

```bash
$ VERSION=5.5.8 # set version
$ yum install -y wget libxml2-devel
$ cd /usr/local/src
$ wget http://www.php.net/distributions/php-$VERSION.tar.gz
$ tar zxvf php-$VERSION.tar.gz
$ cd /usr/local/src/php-$VERSION
$ ./configure --prefix=/usr --with-config-file-path=/etc --enable-maintainer-zts
$ make
$ make install
$ cp php.ini-development /etc/php.ini
```

We download and uncompress the source code into the preferred `/usr/local/src` directory.
From here, we configure the build to meet our requirements.
As I only desire to use this build to test pthreads (on the CLI), I specify that the binary file should be placed in `/usr/bin`, the configuration location at `/etc`, and enable ZTS.
With the options in place, we can now make the build and then install the compilation using the provided Makefile.
Finally, I copy across the development `php.ini` file to the specified `/etc` directory.

## Compiling pthreads Extension

PHP comes with [PECL](http://pecl.php.net/) (PHP Extension Community Library) command support by default, which saves us the hassle of having to compile the extension manually.
We can instead just run the installation command below.

```bash
$ pecl install pthreads
$ echo "extension=pthreads.so" >> /etc/php.ini
```

With the extension now successfully installed, we must include the extension to be loaded in the `php.ini` configuration file.
We can test that the extension has been successfully loaded with the PHP interpreter by running and inspecting the output from the following command.

```bash
$ php -m | grep pthreads
```

## Resources

- [pthreads](http://docs.php.net/manual/en/book.pthreads.php)
- [Github: pthreads](https://github.com/krakjoe/pthreads)
- [Build PHP 5.4 on CentOS 6.2](http://benramsey.com/blog/2012/03/build-php-54-on-centos-62/)
