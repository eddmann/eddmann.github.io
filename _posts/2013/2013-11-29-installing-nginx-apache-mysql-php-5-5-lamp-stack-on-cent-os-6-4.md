---
layout: post
title: 'Installing Nginx/Apache, MySQL, PHP 5.5 (LAMP) stack on CentOS 6.4'
meta: 'Comprehensive guide to installing a LAMP stack (Nginx/Apache, MySQL, PHP 5.5) on CentOS 6.4 for robust web hosting on a VPS.'
tags: lamp php nginx apache
---

With the widespread appeal and flexibility of an [VPS](http://en.wikipedia.org/wiki/Virtual_private_server) and [Vagrant](http://www.vagrantup.com/), a shift from mere FTP access to setting up a fresh installation from scratch has taken effect.
Tools like [Puppet](http://puppetlabs.com/) and [Chef](http://www.opscode.com/chef/) are great for certain use-cases (i.e. large deployments, dev-ops teams), but starting with the terminal is your best friend.
In this post I will take you through the process of setting up a trivial LAMP stack on CentOS 6.4, with the option to use either [Apache](http://httpd.apache.org/) or [Nginx](http://nginx.com/).
Both will take advantage of the features PHP-FPM provides you, via FastCGI.

<!--more-->

The first step is to make sure you are logged in as the 'root' user (this saves you from tedious sudo usage during the installation).
We then add the [EPEL](http://fedoraproject.org/wiki/EPEL) and [Remi](http://rpms.famillecollet.com/) YUM repositories, providing us with easy access to updated MySQL and PHP pre-compiled builds.

```bash
$ sudo su -
$ rpm -Uvh http://download.fedoraproject.org/pub/epel/6/x86_64/epel-release-6-8.noarch.rpm
$ rpm -Uvh http://rpms.famillecollet.com/enterprise/remi-release-6.rpm
```

## MySQL

Installation of the MySQL server and client is the next step, followed by configuring the associated daemon to run on start-up.
It is then good practise to run the 'secure installation' script, which guides you through changing the root password etc.

```bash
$ yum --enablerepo=remi install -y mysql mysql-server
$ chkconfig --levels 235 mysqld on
$ /etc/init.d/mysqld start
$ /usr/bin/mysql_secure_installation
```

## PHP

Next we are going to install PHP 5.5 along with a host of useful packages (i.e. the new Zend OPcache).
Running the second command is useful if you wish to find other available packages.
Finally, we run a couple of commands that use 'sed' to quickly alter the specified configuration in PHP.

```bash
$ yum --enablerepo=remi-php55,remi install -y \
    php php-fpm php-common php-cli php-opcache php-pecl-xdebug \
    php-pear php-mysqlnd php-pdo php-gd php-mbstring \
    php-mcrypt php-xml
$ yum --enablerepo=remi-php55 list php-* # list available modules
$ sed -i "s/^\;date\.timezone.*$/date\.timezone = \"Europe\/London\"/g" /etc/php.ini
$ sed -i "s/^\expose_php.*$/expose_php = Off/g" /etc/php.ini
$ sed -i "s/^\upload_max_filesize.*$/upload_max_filesize = 10M/g" /etc/php.ini
$ sed -i "s/^\post_max_size.*$/post_max_size = 10M/g" /etc/php.ini
```

We are then tasked with configuring the previously installed PHP-FPM, and adding it to run on start-up.
If you wish to install Nginx, you must also execute the last two commands, which correct the desired user/group settings used.

```bash
$ chkconfig --levels 235 php-fpm on
$ sed -i "s/^\listen.*$/listen = \/tmp\/php5-fpm.sock/g" /etc/php-fpm.d/www.conf
# if you wish to use nginx, also execute
$ sed -i "s/^\user.*$/user = nginx/g" /etc/php-fpm.d/www.conf
$ sed -i "s/^\group.*$/group = nginx/g" /etc/php-fpm.d/www.conf
```

## Option 1: Nginx

I am a huge fan of Nginx, and would definitely recommend it over Apache, even if just for its exceptionally low memory footprint.
First, we must add the YUM repository and then install and configure Nginx to run at start-up.

```bash
$ rpm -Uvh http://nginx.org/packages/centos/6/noarch/RPMS/nginx-release-centos-6-0.el6.ngx.noarch.rpm
$ yum install -y nginx
$ chkconfig --levels 235 nginx on
```

We can then replace the initial configuration file provided at `/etc/nginx/conf.d/default.conf` with the one below.
This is a trivial configuration that should help you get up and running.
I would recommend, however, that you take a look at the great work [here](http://github.com/h5bp/server-configs-nginx) for more ideas.

```nginx
# /etc/nginx/conf.d/default.conf

server {
    listen 80;
    server_name localhost;
    charset utf-8;
    root /srv/www/;
    index index.php index.html index.htm;
    location ~ \.php$ {
        fastcgi_pass            unix:/tmp/php5-fpm.sock;
        fastcgi_index           index.php;
        fastcgi_split_path_info ^(.+\.php)(.*)$;
        include                 /etc/nginx/fastcgi_params;
        fastcgi_param           SCRIPT_FILENAME $document_root$fastcgi_script_name;
    }
}
```

## Option 2: Apache

Alternatively, you may prefer the extra modules and familiarity of Apache.
Below we are simply installing the Apache package provided in the official repository, along with enabling it at start-up.

```bash
$ yum install -y httpd
$ chkconfig --levels 235 httpd on
```

We have to go through one extra step to successfully get Apache to use PHP-FPM.
To achieve this, we must install the 'mod_fastcgi' module along with safely disabling a couple of default configuration files.

```bash
$ rpm -Uvh http://pkgs.repoforge.org/rpmforge-release/rpmforge-release-0.5.3-1.el6.rf.x86_64.rpm
$ yum --enablerepo=rpmforge-extras install -y mod_fastcgi
$ mv /etc/httpd/conf.d/php.conf /etc/httpd/conf.d/php.conf.old # disable mod_php
$ mv /etc/httpd/conf.d/fastcgi.conf /etc/httpd/conf.d/fastcgi.conf.old
$ mkdir /usr/lib/cgi-bin/
```

We can then create a new file `/etc/httpd/conf.d/default.conf` with the contents below to get up and running.
This configuration is very trivial.
I would recommend that you take a look at the great work [here](http://github.com/h5bp/server-configs-apache) for more ideas.

```conf
# /etc/httpd/conf.d/default.conf

# FastCGI
User apache
Group apache
LoadModule fastcgi_module modules/mod_fastcgi.so
FastCgiIpcDir /var/run/mod_fastcgi
FastCgiWrapper Off
FastCgiConfig -idle-timeout 20 -maxClassProcesses 1
FastCgiExternalServer /usr/lib/cgi-bin/php5-fcgi -socket /tmp/php5-fpm.sock -pass-header Authorization
AddHandler php5-fcgi .php
Action php5-fcgi /php5-fcgi
Alias /php5-fcgi /usr/lib/cgi-bin/php5-fcgi

# Default VirtualHost
NameVirtualHost *:80
<VirtualHost *:80>
    ServerName "*"
    DocumentRoot /srv/www/
    DirectoryIndex index.php index.html index.htm
    <Directory /srv/www/>
        Options All
        AllowOverride All
    </Directory>
</VirtualHost>
```

## Web Directory

I tend to store my web content under `/srv/www`, and the example configuration files use this preference.
If you have another preference, remember to update the configuration files accordingly.

```bash
$ mkdir /srv/www
$ echo "<?php phpinfo();" > /srv/www/index.php
```

## Firewall

It is very important to have a well-configured firewall that meets your business domain needs.
The configuration below is a good start.
I will not go through each line, but this helps handle common script-kiddie attacks, along with accepting activity on ports 80, 443 and 22 (HTTP, HTTPS and SSH).

```bash
$ iptables -F
$ iptables -A INPUT -p tcp --tcp-flags ALL NONE -j DROP # null packets
$ iptables -A INPUT -p tcp ! --syn -m state --state NEW -j DROP # syn-flood attacks
$ iptables -A INPUT -p tcp --tcp-flags ALL ALL -j DROP # xmas packets
$ iptables -A INPUT -i lo -j ACCEPT # allow localhost interface
$ iptables -A INPUT -p tcp -m tcp --dport 80 -j ACCEPT  # http
$ iptables -A INPUT -p tcp -m tcp --dport 443 -j ACCEPT # https
$ iptables -A INPUT -p tcp -m tcp --dport 22 -j ACCEPT # ssh
$ iptables -I INPUT -m state --state ESTABLISHED,RELATED -j ACCEPT # vps, run s/w updates
$ iptables -P OUTPUT ACCEPT # allow outgoing
$ iptables -P INPUT DROP # block other
$ iptables-save | sudo tee /etc/sysconfig/iptables
$ service iptables restart
$ iptables -L -n # display rules
```

## Composer

Who in the PHP world can now live without Composer?

```bash
$ cd /tmp
$ curl -sS https://getcomposer.org/installer | php
$ mv composer.phar /usr/local/bin/composer
```

## 3, 2, 1, Go...

```bash
$ /etc/init.d/php-fpm start
$ /etc/init.d/httpd start # apache
$ /etc/init.d/nginx start # nginx
```

I hope that this brief overview has helped you become accustomed to configuring a base installation, allowing you to take advantage of its flexibility.
I have purposely omitted detailed discussion on logging and advanced web-server configuration, as I feel they deserve their own posts and I hope to cover this in the near future.
