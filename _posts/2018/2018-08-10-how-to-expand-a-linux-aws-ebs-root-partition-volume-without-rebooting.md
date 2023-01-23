---
layout: post
title: 'How to Expand a Linux AWS EBS Root/Partition Volume without Rebooting'
canonical: https://tech.mybuilder.com/how-to-expand-a-linux-aws-ebs-root-partition-volume-without-rebooting/
meta: 'How to Expand a Linux AWS EBS Root/Partition Volume without Rebooting'
---

Over the past couple of months I have found myself several times having to look up how to expand a Linux-based AWS EBS volume.
This article showcases a simple step-by-step guide to performing this action.

<!--more-->

**Prerequisites:** You have increased the subject volume using the [AWS console](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/console-modify.html) or [AWS CLI](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/cli-modify.html), and have installed the `cloud-guest-utils` (Debian/Ubuntu) or `cloud-utils-growpart` (CentOS) package on the EC2 instance.

With the volume expanded within AWS, we can see the 100G of unallocated space 😢.
Let's go about increasing the `xvda1` partition to fill the full drive.

```
$ lsblk
NAME    MAJ:MIN RM  SIZE RO TYPE MOUNTPOINT
xvda    202:0    0  120G  0 disk
└─xvda1 202:1    0   20G  0 part /
```

Using the `growpart` command, we are able to specify the device and partition number we wish to expand.

```
$ growpart /dev/xvda 1
CHANGED: partition=1 start=2048 old: size=41940959 end=41943007 new: size=251656159,end=251658207
```

We can now see that the partition has been expanded to fill the drive.

```
$ lsblk
NAME    MAJ:MIN RM  SIZE RO TYPE MOUNTPOINT
xvda    202:0    0  120G  0 disk
└─xvda1 202:1    0  120G  0 part /
```

However, the filesystem is still not aware of this newly available space.

```
$ df -h
Filesystem      Size  Used Avail Use% Mounted on
/dev/xvda1       20G  2.6G   17G  14% /
```

We can now use the `resize2fs` command to update the filesystem, making it aware of this space.

```
$ resize2fs /dev/xvda1
resize2fs 1.43.4 (31-Jan-2017)
Filesystem at /dev/xvda1 is mounted on /; on-line resizing required
old_desc_blocks = 3, new_desc_blocks = 15
The filesystem on /dev/xvda1 is now 31457019 (4k) blocks long.
```

Finally, when we now check the disk usage, we can see the extra 100G available 🎉!

```
$ df -h
Filesystem      Size  Used Avail Use% Mounted on
/dev/xvda1      119G  2.6G  111G   3% /
```
