---
layout: post
title: 'Complete MAMP Setup with PHP 5.5'
meta: 'A comprehensive guide to setting up a complete MAMP environment with PHP 5.5, MySQL, and DNSMasq using Homebrew on macOS.'
tags: php mamp
---

I have been a loyal [MAMP Pro](http://www.mamp.info/en/mamp-pro/) user for many years.
I fell in love with how easy it was to set up custom hosts, without the need to tweak the hosts file myself.
However, ever since I documented my [experiences](http://eddmann.com/posts/dnsmasq-your-local-development-dns/) with DNSMasq, I have been interested in how [this](http://davidwinter.me/articles/2011/06/18/simple-local-web-development-with-apache-and-dnsmasq/) post documented setting up a web stack with Apache, similar to Ruby's [Pow](http://pow.cx/).
The ability to set up a new development site with only the creation of a new folder (i.e. a folder called test could be accessible at test.dev) appealed to me greatly.

<!--more-->

Below is a step-by-step guide on how I set up my MAMP environment.
Full credit goes to the discussed approach; without it, a small part of my heart would never have been filled.

## Apache and PHP

The first piece of the puzzle is to set up Apache.
Luckily, Mac OSX (Lion or later) already comes pre-installed with an adequate Apache installation.
All we have to do is enable it.

To achieve this, we must first go to System Preferences, then Sharing, and finally check Web Sharing.

How easy was that?
The second piece is PHP, and again an installation is already provided with OSX Mavericks (version 5.4, to be exact).
All that is required is to load the PHP5 module into your Apache setup.
This can be achieved by uncommenting `LoadModule php5_module libexec/apache2/libphp5` in your `/etc/apache2/httpd.conf` file.

## Fancy some PHP 5.5?

If you feel ultra-cool and want to use the latest and greatest from PHP - such as traits and yield - you can install PHP 5.5 using [Homebrew](http://brew.sh/) following the below instructions:

```bash
$ brew tap homebrew/dupes
$ brew tap josegonzalez/homebrew-php
$ brew options php55 # list available configuration options
$ brew install php55
```

To enable PHP 5.5 for use with Apache you need to replace the uncommented PHP module (from the last step) with `LoadModule php5_module /usr/local/Cellar/php55/5.5.6/libexec/apache2/libphp5.so`.

## MySQL

To install MySQL I have decided to skip all the heavy lifting of compiling my own build and again let Homebrew do all the heavy lifting.
Run the following commands to successfully set up your own personal MySQL installation.
Remember to follow the instructions Homebrew provides you.
I personally also recommend that you run the optional secure installation script once complete (even if it is just a development setup).

```bash
$ brew install mysql
$ # The folder version may vary
$ /usr/local/Cellar/mysql/5.5.20/bin/mysql_secure_installation
```

We must then make Apache aware that MySQL now has set up shop on your system.
To do this, run the following commands.

```bash
$ sudo mkdir /var/mysql
$ sudo ln -s /tmp/mysql.sock /var/mysql/mysql.sock
```

Now we are ready to add DNSMasq into the mix.

## DNSMasq and the magical part

Now that we have successfully set up our MAMP stack, it is time to add the magic sauce which makes this setup so much better.
I have already documented what DNSMasq is and how to set it up on a Linux distribution (Ubuntu) in a previous article, so I will just skip the introductions and install it.
To install DNSMasq on Mac OSX I have decided to follow a similar process to MySQL and let Homebrew do all the heavy lifting.

```bash
$ brew install dnsmasq
```

Once successfully downloaded and installed, follow the on-screen instructions and copy the configuration file to `/usr/local/etc/dnsmasq.conf`.
Before continuing on to the second stage of installation, however, we need to tell DNSMasq (using the copied configuration file) that we want any address with a [TLD](http://en.wikipedia.org/wiki/Top-level_domain) of '.dev' to loop back to our own machine.

```text
address=/dev/127.0.0.1
listen-address=127.0.0.1
```

We then need to add our loopback address (127.0.0.1) as the first DNS record to our primary network adapter.
We do this by going to System Preferences, then Network.
Once there, we click Advanced, and then DNS.
Finally, we can then add 127.0.0.1 as the first DNS record.

The last step is to set up the last development Apache Virtual Host you will hopefully ever have to look at.
Add the following Virtual Host information into your custom Apache configuration file, located at `/etc/apache2/users/[your-username].conf`.

```conf
NameVirtualHost *:80

<Directory "/Users/[your-username]/Sites/">
  Options Indexes MultiViews FollowSymLinks Includes
  AllowOverride All
  Order allow,deny
  Allow from all
</Directory>

<VirtualHost *:80>
  UseCanonicalName off
  VirtualDocumentRoot /Users/[your-username]/Sites/%1
</VirtualHost>
```

All that is needed now is to simply restart Apache by using the following command.

```bash
$ sudo apachectl restart
```

You can now add a new folder to your `~/Sites` directory.
Without any additional work, visit the folder's name with the '.dev' TLD prepended in your browser of choice.

I have added a simple function to my dotfiles which cuts out even this labourious task.

```bash
function newsite() {
  mkdir -p ~/Sites/$1
  echo "Hello, world..." > ~/Sites/$1/index.html
  echo "<?php phpinfo();" > ~/Sites/$1/info.php
}
```

Now that I have this set up, I cannot imagine a world without it.
All the tedious work required in setting up a new project has now vanished!
