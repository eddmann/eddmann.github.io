---
layout: post
title: 'Building a 2FA TOTP generator using a Raspberry Pi Pico and MicroPython'
meta: 'Learn how to build a 2FA TOTP generator device using a Raspberry Pi Pico and MicroPython, including a display and customisable features.'
tags: pico micropython
---

I have recently become very interested in microcontrollers, particularly the [Raspberry Pi Pico](https://www.raspberrypi.com/products/raspberry-pi-pico/).
Not only is it ridiculously affordable (just over £3), but it also provides extensive scope for use in various projects.
One such project I wanted to explore was building an independent [Time-based One-time Password](https://en.wikipedia.org/wiki/Time-based_one-time_password) (TOTP) device.

<!--more-->

I have been using the likes of Google Authenticator and Authy for many years but wanted to gain a deeper understanding of the specific building blocks that Time-based One-time Passwords are built upon.
This led me to investigate the viability of building such a solution using a Raspberry Pi Pico, combined with [MicroPython](https://micropython.org/) and the [Pico Display Pack](https://shop.pimoroni.com/products/pico-display-pack).
Thanks to some [great](https://datatracker.ietf.org/doc/html/rfc2104) [resources](https://datatracker.ietf.org/doc/html/rfc6238), I was able to do just that.

<a href="https://github.com/eddmann/pico-2fa-totp"><img src="/uploads/building-a-2fa-totp-generator-using-a-raspberry-pi-pico-and-micropython/demo.gif" /></a>

## Features

Below is a list of the feature set that the built device provides:

- Complete [MicroPython implementation](https://github.com/eddmann/pico-2fa-totp/tree/main/totp) of the TOTP specification (including underlying HMAC-SHA1 and Base32 dependencies).
- Customisable background colours per TOTP.
- A progress bar to show how long until the TOTP expires.
- A flashing alert LED when the TOTP is about to expire.
- An initial configuration screen to set the current UTC time - to correct the Raspberry Pi Pico's RTC.

## Usage

Once you have downloaded the project from [GitHub](https://github.com/eddmann/pico-2fa-totp), follow the instructions below to set up the device:

- Connect the [Pico Display Pack](https://shop.pimoroni.com/products/pico-display-pack) to the Raspberry Pi Pico.
- Create a `codes.json` file (based on `codes.json.example`) that includes the desired TOTP keys.
- Flash the Raspberry Pi Pico with the latest [MicroPython with Pimoroni Libs](https://github.com/pimoroni/pimoroni-pico/releases/latest).
- Copy the codebase to the Raspberry Pi Pico.
- Upon boot, you will be required to specify the current UTC time (click `B` once set).
- Now you can cycle through your TOTPs using the `X` button.

<a href="https://github.com/eddmann/pico-2fa-totp"><img src="/uploads/building-a-2fa-totp-generator-using-a-raspberry-pi-pico-and-micropython/demo.jpg" /></a>

## Conclusion

I have been amazed at how easy it is for someone like myself, coming from a high-level programming background, to pick up MicroPython and build non-trivial systems using microcontrollers.
I found researching and implementing the functionality that performed HMAC-SHA1 to be a lot of fun, allowing me to demystify what can seem to be a very _magical_ process.
Additionally, investigating how to set the Pico's RTC was an interesting aside, combined with presenting this correction using a purpose-built configuration display screen.

Having success in completing this project has already sparked other ideas that I will discuss in upcoming articles!
