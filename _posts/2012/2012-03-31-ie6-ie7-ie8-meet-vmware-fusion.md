---
layout: post
title: 'IE6, IE7 & IE8, meet VMWare Fusion'
meta: 'Learn how to set up legacy Internet Explorer testing on a Mac using VMWare Fusion by converting a Windows XP VHD into a VMDK, enabling quick compatibility testing for IE6, IE7, and IE8.'
tags: vmware-fusion internet-explorer browser-testing
---

Unfortunately, as a web developer, you will undoubtedly encounter the need to support one (or more) of the three browsers mentioned in this article's title.
It is a sad but true state we are in, and making it as seamless as possible goes some way in taking the sting out of it.

<!--more-->

I have spent many hours researching how to make these browser tests less painful, and the first tool I got hooked on was a Windows‐only application called [IETester](http://www.my-debugbar.com/wiki/IETester/HomePage).
This application packaged the different engines found in each version of IE, and allowed you to create new tabs based on the engine version you wished to test for.
Initially, I thought this was a great idea, but I encountered numerous issues with JavaScript execution and small differences in how the application rendered a page, which led me to look for another solution.

Fortunately, Microsoft has been nice enough to provide the web development community with multiple Virtual PC images that allow us to legally test for compatibility in an evaluative Windows XP, Windows Vista or Windows 7 environment.
Unfortunately, as Virtual PC images, these work great on a Windows box; but what about those who do not have that 'luxury'?
Luckily for us, there are a few workarounds available.
One of these is using [ievms](https://github.com/xdissent/ievms), which does exactly what it says on its GitHub repo page and automates the installation for both Linux and macOS platforms using VirtualBox.
I would highly recommend that you check this out if you wish to use VirtualBox; personally, I prefer VMWare Fusion.

## Setup

For this tutorial, I will be using the Windows XP VHD, which includes IE6 as standard.
To begin, you will need to download this image from [Internet Explorer Application Compatibility VPC Image](http://www.microsoft.com/download/en/details.aspx?displaylang=en&id=11575).
Once successfully downloaded, you will be able to extract the .EXE using a tool such as [The Unarchiver](http://wakaba.c3.cx/s/apps/unarchiver.html).
You will now have two files to work with:

- Windows XP.vhd
- Windows XP.vmc

We only care about the VHD, as the next step is to convert that image into a Virtual Machine Disk (VMDK) to support VMWare Fusion.
The easiest method I have found to perform this task is to install [Q](http://www.kju-app.org/), which internally includes a component called 'qemu-img' that works well.
Once you have installed Q, open your Terminal and navigate to the folder that contains the VHD.
Once there, run the command below:

```bash
$ /Applications/Q.app/Contents/MacOS/qemu-img convert -O vmdk -f vpc Windows XP.vhd Windows XP.vmdk
```

## Installation

Once your VHD has been successfully converted to a VMDK, it is now time to open VMWare Fusion and create a new virtual machine that uses the existing VMDK that we have created.
Upon first boot, you will be greeted with many 'Found New Hardware' dialogs, which you can safely cancel and close at this time.
Once you are at the desktop, you can now install the VMware tools, which will provide the machine with the correct network adapter drivers to successfully reactivate itself.

Installing IE7 on the newly created Virtual Machine.

![IE7 Virtual Machine](/uploads/ie6-ie7-ie8-meet-vmware-fusion/ie7.png)

You can now happily leave it here, and simply create multiple copies of the VM to install the different versions of IE that you wish to test for compatibility.
I personally like to use a method I picked up from this blog post, [How I use VMWare Fusion and Snapshots](http://snook.ca/archives/other/vmware-fusion-snapshots).
Using this method, you go through the process of making an initial snapshot of your Windows XP installation with IE6 installed, then installing IE7 and snapshotting the VM state again, and lastly snapshotting the VM with IE8 installed.
This method saves disk space and allows you to quickly switch between stable builds of each of the browsers on which you want to test.

A tree view of all the snapshots that I created for testing purposes.

![Virtual Machine Snapshots](/uploads/ie6-ie7-ie8-meet-vmware-fusion/snapshots.png)

As you can see from the screenshot above, I am currently using the IE6 snapshot with the ability to quickly switch to another browser's configuration in a couple of clicks.
You will also notice that I have created a Firefox 3.6 snapshot, demonstrating that this method benefits not only IE testing but also browser testing in general.

## Update

As of early 2013, Microsoft has finally made available VirtualBox, VMWare Fusion and Parallels for Mac machine images (available [here](http://www.modern.ie/en-us/virtualization-tools#downloads)), saving you the hassle of having to go through this process.
