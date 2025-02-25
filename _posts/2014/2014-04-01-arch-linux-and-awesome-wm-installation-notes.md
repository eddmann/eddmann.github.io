---
layout: post
title: 'Arch Linux and Awesome WM Installation Notes'
meta: 'Simple notes for my Arch Linux and Awesome WM installation setup.'
---

I have been a big fan of [Arch Linux](https://www.archlinux.org/) (inc. it's philosophy) and the [Awesome](http://awesome.naquadah.org/) Window Manager for just under a year now.
I recently went through the process of a clean installation on my laptop and thought I would jot down some installation notes for future reference.
Some background information on my 64bit setup, I currently use Intel HD Graphics 4000 and a Western Digital 4K Advanced Format Hard Drive. <!--more-->
I opted for the simplicity of setting up only two partitions (root and home) using [GParted](http://gparted.org/) prior to the writing of these notes.

## Base Installation

```bash
# check wifi connectivity
$ wifi-menu
$ ping www.google.com
```

```bash
# format disk partitions
$ lsblk /dev/sda
$ mkfs.ext4 /dev/sda1 # root
$ mkfs.ext4 /dev/sda2 # home

# mount disk partitions
$ mount /dev/sda1 /mnt
$ mkdir /mnt/home
$ mount /dev/sda2 /mnt/home
```

```bash
# install base
$ pacstrap /mnt base

# generate fstab
$ genfstab -U -p /mnt >> /mnt/etc/fstab
$ nano /mnt/etc/fstab # amend as necessary

# change disk root
$ arch-chroot /mnt /bin/bash
```

```bash
# install GRUB2
$ pacman -S grub
$ grub-mkconfig -o /boot/grub/grub.cfg
$ nano /boot/grub/grub.cfg # menu-entry listings
$ grub-install --recheck /dev/sda
```

```bash
# reboot into installed env
$ exit
$ umount /mnt/{home,}
$ reboot
```

## Base Configuration

```bash
# amend root password
$ passwd

# hostname
$ hostnamectl set-hostname arch

# keymap
$ ls /usr/share/kbd/keymaps # locate keymap
$ localectl set-keymap uk

# locale
$ nano /etc/locale.gen # uncomment locale
$ locale-gen
$ localectl set-locale LANG=en_GB.UTF-8

# timezone
$ ls /usr/share/zoneinfo/ # locate timezone
$ timedatectl set-timezone Europe/London
```

```bash
$ nano /etc/pacman.conf # enable multilib (32bit)
$ pacman -Syy
```

```bash
# setup user
$ useradd -m -g users -s /bin/bash edd
$ passwd edd
$ pacman -S sudo
$ visudo # set user access
# login as new account
```

```bash
# basic build utilities
$ pacman -S multilib-devel fakeroot git jshon wget make pkg-config autoconf automake patch

# packer, arch user repo.
$ wget http://aur.archlinux.org/packages/pa/packer/packer.tar.gz
$ tar zxvf packer.tar.gz
$ cd packer && makepkg
$ pacman -U packer<tab>
```

## Graphics and X.Org Server

```bash
# xorg
$ pacman -S xorg-server xorg-xinit xorg-server-utils mesa
$ pacman -S xorg-twm xorg-xclock xterm # basic components

# intel graphics
$ pacman -S xf86-video-intel libva-intel-driver

# laptop touchpad
$ pacman -S xf86-input-synaptics
```

## Awesome Window Manager

```bash
$ pacman -S awesome vicious
$ cp /etc/skel/.xinitrc ~ # basic initrc
$ echo "exec awesome" >> ~/.xinitrc
$ mkdir -p ~/.config/awesome/
$ cp /etc/xdg/awesome/rc.lua ~/.config/awesome/ # basic config
```
