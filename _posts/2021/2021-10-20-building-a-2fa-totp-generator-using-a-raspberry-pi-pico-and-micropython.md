---
layout: post
title: 'Building a 2FA TOTP generator using a Raspberry Pi Pico and MicroPython'
meta: 'Investigating how to build a 2FA TOTP generator device using a Raspberry Pi Pico and MicroPython'
tags: pico micropython
---

I have recently become very interested in microcontrollers, in particular the [Raspberry Pi Pico](https://www.raspberrypi.com/products/raspberry-pi-pico/).
Not only is it ridiculously affordable (just over £3), it provides so much scope to be used in many different projects.
One such project I wanted to explore was building an independent [Time-based One-time password](https://en.wikipedia.org/wiki/Time-based_one-time_password) (TOTP) device.

<!--more-->

I have been using the likes of Google Authenticator and Authy for many years, but really wanted to gain a deeper understanding for the specific building blocks that Time-based One-time password's are built upon.
This led me to investigate the viability of building such a solution using a Raspberry Pi Pico - combined with [MicroPython](https://micropython.org/) and the [Pico Display Pack](https://shop.pimoroni.com/products/pico-display-pack).
Thanks to some [great](https://datatracker.ietf.org/doc/html/rfc2104) [resources](https://datatracker.ietf.org/doc/html/rfc6238) I was able to do just that.

<a href="https://github.com/eddmann/pico-2fa-totp"><img src="/uploads/building-a-2fa-totp-generator-using-a-raspberry-pi-pico-and-micropython/demo.gif" /></a>

### Features

Below is a list of the feature-set that the built device provides:

- Complete [MicroPython implementation](https://github.com/eddmann/pico-2fa-totp/tree/main/totp) of the TOTP specification (and underlying HMAC-SHA1, Base32 dependencies).
- Customisable background colours per TOTP.
- Progress bar to present how long till the TOTP is about to expire.
- Flashing alert LED when the TOTP is about to expire.
- Initial configuration screen to set the current UTC time - to correct the Raspberry Pi Pico's RTC.

### Usage

Once you have downloaded the project from [GitHub](https://github.com/eddmann/pico-2fa-totp), you can the follow the instructions below to get the device setup.

- Connect the [Pico Display Pack](https://shop.pimoroni.com/products/pico-display-pack) to the Raspberry Pi Pico.
- Create a `codes.json` file (based on `codes.json.example`) which includes the desired TOTP keys.
- Flash the Raspberry Pi Pico with the latest [MicroPython with Pimoroni Libs](https://github.com/pimoroni/pimoroni-pico/releases/latest).
- Copy the codebase to the Raspberry Pi Pico.
- Upon boot, you will be required to specify the current UTC time (clicking `B` once set).
- Now you can cycle through your TOTP's using the `X` button.

<a href="https://github.com/eddmann/pico-2fa-totp"><img src="/uploads/building-a-2fa-totp-generator-using-a-raspberry-pi-pico-and-micropython/demo.jpg" /></a>

### Conclusion

I have been amazed at how easy it is for someone like myself (coming from a high-level programming background), to pick up MicroPython and build non-trivial systems using microcontrollers.
I found researching and implementing the functionality that performed HMAC-SHA1 to be alot of fun, allowing me to demystify what can seem to be a very _magical_ process.
Additionally, investigating how to set the Pico's RTC was an interesting aside, combined with presenting this correction using a purpose-built configuration display screen.

Having success in completing this project has already sparked other ideas that I will discuss in upcoming articles!
