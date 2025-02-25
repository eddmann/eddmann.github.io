---
layout: post
title: 'Storing PHP Sessions/File Caches in Memory using TMPFS'
meta: 'Using TMPFS to store non-persistent files on a memory partition.'
---

Yesterday I was looking through some application logs and noticed a significant bottleneck with I/O reads in the implemented file cache.
This cache is used to temporary store processed views and records for a set duration.
I looked into a couple of solutions to alleviate the intense spinning disk usage, ranging from [Memcache](http://memcached.org/) to [Redis](http://redis.io/).
These products are great for large-scale applications (spread over multiple systems), however, in my case simply required a single local configuration.

<!--more-->

This was when I found 'tmpfs', saving me from all sorts of issues relating to adding yet another application to the production stack.
'tmpfs' appears as a mounted partition on your system, however, under the hood it allocates and uses a section of physical memory (non-persistent through reboots).
This means that you are able to configure directories (such as the cache) to be mounted on a 'tmpfs' partition.
This results in the desired speed boosts, without tampering with the application logic itself.
Even better, if the mount is unsuccessful for some reason, it will safety fall-back to using the persistent hard-disk solution.

## PHP Sessions

Though I have been discussing this solution in the case of caches, file-based PHP sessions can be setup in a similar manner.
You must first work out where session files for your PHP installation are stored.
Note, that if your using PHP-FPM you may be required to modify the second configuration line.

```bash
# /etc/php.ini
session.save_path = /var/lib/php/session
# /etc/php-fpm.conf
php_value[session.save_path] = /var/lib/php/session
```

We can then make sure that the directory has been created, along with the fall-back permissions.
So as to temporary see the performance increases, we are able to mount the 'tmpfs' partition to the session directory, setting ownership to the desired user.

```bash
mkdir -p /var/lib/php/session
# fallback
chown nginx:nginx /var/lib/php/session
chmod 755 /var/lib/php/session
# temporary mount
mount -t tmpfs -o size=32m,mode=0755,uid=$(id -u nginx),gid=$(id -g nginx) tmpfs /var/lib/php/session
umount /var/lib/php/session
```

If you are a satisfied with the configuration, you can persist the partition mount across reboots by adding the following line to your 'fstab' file.

```bash
echo "tmpfs /var/lib/php/session tmpfs size=32m,uid=$(id -u nginx),gid=$(id -g nginx),mode=0755 0 0" >> /etc/fstab
```

## Resources

- [Revisiting Faster PHP Sessions](http://kvz.io/blog/2011/04/29/faster-php-sessions/)
- [Overview of RAMFS and TMPFS on Linux](http://www.thegeekstuff.com/2008/11/overview-of-ramfs-and-tmpfs-on-linux/)
