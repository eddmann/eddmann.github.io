---
layout: post
title: 'Configuring SSH Public Key Authentication on CentOS 6.4'
meta: 'Learn how to configure SSH public key authentication on CentOS 6.4 with this comprehensive guide.'
tags: ssh
---

Having to use password authentication each time you wish to access your server can be a serious pain.
Not only does it require extra keystrokes, it is also less secure and far more susceptible to successful brute-force attacks.

<!--more-->

Enter public-key authentication, where you instead use asymmetric cryptography.
The first thing to do is generate a key-pair on your client machine.
You can optionally provide a passphrase to unlock the private key if you so wish.

```bash
$ ssh-keygen -q -t rsa -C "your@email.com"
```

We now need to add the client's public key to the list of authorised keys for the server's specified user.

```bash
$ cat ~/.ssh/id_rsa.pub | ssh user@hostname "cat >> ~/.ssh/authorized_keys"
```

Once this has been successfully copied across, we just need to enable the daemon to use the new form of authentication.
This will be the last time you will have to authenticate via password.

```bash
$ ssh user@hostname
$ sudo sed -i "s/^\#RSAAuthentication.*$/RSAAuthentication yes/g" /etc/ssh/sshd_config
$ sudo sed -i "s/^\#PubkeyAuthentication.*$/PubkeyAuthentication yes/g" /etc/ssh/sshd_config
$ sudo /etc/init.d/sshd restart
```
