---
layout: post
title: 'Determining if an IPv4 address is within a CIDR range in JavaScript'
meta: 'A comprehensive guide on determining if an IPv4 address lies within a CIDR range in JavaScript, featuring code examples and detailed explanations.'
tags: ['javascript']
---

Recently I was required to process a group of [CIDR](https://en.wikipedia.org/wiki/Classless_Inter-Domain_Routing) ranges in JavaScript to determine if a given IPv4 address fell within one of them.
In this post I would like to discuss how I went about completing this.

<!--more-->

## What is CIDR notation?

CIDR stands for `Classless Inter-Domain Routing`, and is a replacement for the historic [class-based](https://en.wikipedia.org/wiki/Classful_network) system.
This approach allows for more efficient use of the IPv4 address space, reducing the size of routing tables in the process.
Every IPv4 address consists of two parts - one to identify the network and the other to identify the host on that network.
A CIDR address contains the typical 32-bit IPv4 address, along with information on how many bits are used for the network prefix (by way of Variable Length Subnet Masking).
Unlike classful networks, any number of contiguous bits can be assigned to identify the network, allowing for more fine-grained IPv4 allocation.
Due to these advantages, you will see this commonly used within networking platforms such as [Amazon Virtual Private Cloud](https://aws.amazon.com/vpc/) and [AWS Web Application Firewall](https://aws.amazon.com/waf/).

## Matching CIDRs

Now that we have had a refresher on what CIDR notation actually is, we can go about implementing the solution to the initial problem laid out.

```js
const ip4ToInt = ip => ip.split('.').reduce((int, oct) => (int << 8) + parseInt(oct, 10), 0) >>> 0;

const isIp4InCidr = ip => cidr => {
  const [range, bits = 32] = cidr.split('/');
  const mask = ~(2 ** (32 - bits) - 1);
  return (ip4ToInt(ip) & mask) === (ip4ToInt(range) & mask);
};

const isIp4InCidrs = (ip, cidrs) => cidrs.some(isIp4InCidr(ip));

isIp4InCidrs('192.168.1.5', ['10.10.0.0/16', '192.168.1.1/24']); // true
```

As you can see the problem has been broken up into three distinct parts.
The first of which is converting the given IPv4 address into its integer equivalent, which is achieved by adding each [octet](<https://en.wikipedia.org/wiki/Octet_(computing)>) together.
With this at our disposal we are then able to verify a single IPv4 and CIDR combination.
At this stage the CIDR is parsed to produce the given mask, which is then used along with the integer function to validate if the IPv4 address falls within the range outlined.
This function is curried so that it can be partially applied in the following step.
Finally, we are able to check many CIDRs by using this partially applied function, checking if at least one match is present.

## Determining CIDR ranges

It can also be useful to determine the start and end of a given CIDR range.
Using a similar approach to how we tackled the initial problem, we can use the mask again to produce the minimum and maximum IPv4 addresses.

```js
const intToIp4 = int =>
  [(int >>> 24) & 0xff, (int >>> 16) & 0xff, (int >>> 8) & 0xff, int & 0xff].join('.');

const calculateCidrRange = cidr => {
  const [range, bits = 32] = cidr.split('/');
  const mask = ~(2 ** (32 - bits) - 1);
  return [intToIp4(ip4ToInt(range) & mask), intToIp4(ip4ToInt(range) | ~mask)];
};

calculateCidrRange('192.168.1.0/24'); // ["192.168.1.0", "192.168.1.255"]
```

During development it proved useful to investigate what the internal binary representation of the given IPv4 addresses and masks were.
This was achieved using another small function which converted the integer to a binary string output.

```js
const intToBin = int =>
  (int >>> 0)
    .toString(2)
    .padStart(32, 0)
    .match(/.{1,8}/g)
    .join('.');

intToBin(ip4ToInt('192.168.1.1')); // 11000000.10101000.00000001.00000001
```
