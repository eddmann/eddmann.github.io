---
layout: post
title: 'Building a Secret Santa allocator and SMS sender using a Raspberry Pi Pico/MicroPython and SIM800L module'
meta: 'Documenting how to build a Secret Santa allocator and SMS sender using a Raspberry Pi Pico/MicroPython and SIM800L module'
tags: pico micropython sms
---

Over the past couple of years I have explored [several](https://eddmann.com/posts/allocating-secret-santas-with-a-substitution-cipher-using-clojure/) [different](https://eddmann.com/posts/allocating-and-notifying-secret-santas-via-email-using-clojure/) ways in which to solve the problem of allocating Secret Santa's for members of my family.
Having spent a couple of months recently interested in microcontrollers, I decided that this year I would send out automatically allocated Secret Santas via SMS using a Raspberry Pi Pico/MicroPython and [SIM800L GSM module](https://lastminuteengineers.com/sim800l-gsm-module-arduino-tutorial/).

<!--more-->

<img src="/uploads/building-a-secret-santa-allocator-and-sms-sender-using-a-raspberry-pi-pico-micropython-and-sim800l-module/begin.jpg" />

## The build

The system I designed comprised of a display (that I had used in a [previous project](https://eddmann.com/posts/building-a-2fa-totp-generator-using-a-raspberry-pi-pico-and-micropython/)), the Raspberry Pi Pico and a [SIM800L GSM module](https://lastminuteengineers.com/sim800l-gsm-module-arduino-tutorial/).
Upon boot the system reads in the supplied [`participants.json`](https://github.com/eddmann/pico-secret-santa/blob/main/participants.json.example) file which contains the participants names and phone numbers.
Once allocation commences all participants are assigned a Secret Santa, with the resulting allocation notifications being sent out via SMS.
The display is used to report the current status throughout both the allocation and notification phases.
The final solution can be found on [GitHub](https://github.com/eddmann/pico-secret-santa), with additional usage instructions included.

## The allocation process

I decided to use the same technique I had employed in a previous years solution to allocate the Secret Santas.
This method applied a brute-force approach which uniformly shuffled the given participants into pairs, returning the allocations if all pairs met the desired criteria (i.e. not oneself or within an exclusion listing).
Looking through the MicroPython documentation however, I noticed that no array shuffle functionality was present.
As such, I opted to implement my own [Fisher–Yates shuffle](https://en.wikipedia.org/wiki/Fisher%E2%80%93Yates_shuffle) algorithm which performed these capabilities of which were lacking from the standard library.
MicroPython does however provide some of the high-level Python constructs I have grown accustom to (such as `zip` and `all`) which produced a very succinct [end solution](https://github.com/eddmann/pico-secret-santa/blob/main/allocator.py).

<img src="/uploads/building-a-secret-santa-allocator-and-sms-sender-using-a-raspberry-pi-pico-micropython-and-sim800l-module/allocation.jpg" />

## Sending the SMS

The most interesting part of the entire project was exploring how you could send SMS using the Pico.
The SIM800L module is a GSM cellular chip which communicates with the microcontroller via [UART](https://docs.micropython.org/en/latest/library/machine.UART.html).
I opted to build a [small abstraction](https://github.com/eddmann/pico-secret-santa/blob/main/sim800l.py) within MicroPython around communication with the SIM800L via `AT` commands.
This abstraction handled the necessary initial configuration setup and connection to the mobile network provider.
Further more, it encapsulated the behaviour required to send an SMS to a given phone number.

<img src="/uploads/building-a-secret-santa-allocator-and-sms-sender-using-a-raspberry-pi-pico-micropython-and-sim800l-module/breadboard.jpg" style="margin:0 auto;width:350px;" />

## Conclusion

This was by-far my most enjoyable Secret Santa allocation system to design and build to date.
Having the ability to begin the allocation process using a physical button, and subsequently see progress reported on the display was very pleasing.
I really look forward to exploring other ways in which I can use mobile network communication within projects such as this in the time to come.

<img src="/uploads/building-a-secret-santa-allocator-and-sms-sender-using-a-raspberry-pi-pico-micropython-and-sim800l-module/complete.jpg" />
