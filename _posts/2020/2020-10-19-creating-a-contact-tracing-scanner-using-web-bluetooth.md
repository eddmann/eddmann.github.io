---
layout: post
title: 'Creating a Contact Tracing Scanner using Web Bluetooth'
meta: 'Highlights how to use the Web Bluetooth API to build a Contact Tracing Scanner application'
---

I have recently been looking at the [Contact Tracing specifications](https://covid19.apple.com/contacttracing) Apple and Google released earlier this year in aid of the fight against COVID-19.
Looking through these documents allowed me to grapse how the system was put together, and ease fears family members had with regards to how privacy conscious the Exposure Notification system is.

<!--more-->

I decided to make a Web Bluetooth-based [scanning application](https://eddmann.com/contact-tracing-scanner-web/) which highlighted what an Exposure Notification-enabled device actually emits.

[![Contact Tracing Scanner using Web Bluetooth](/uploads/creating-a-contact-tracing-scanner-using-web-bluetooth/contact-tracing-scanner.png)](https://eddmann.com/contact-tracing-scanner-web/)

### How it works

The [Exposure Notification system](https://en.wikipedia.org/wiki/Exposure_Notification) designed by Apple and Google uses the GATT Bluetooth LE protocol to emit advertisements using the registered service UUID `0xfd6f`.
These advertisements are sent using the format outlined in the [Exposure Notification Bluetooth Specification](https://covid19-static.cdn-apple.com/applications/covid19/current/static/contact-tracing/pdf/ExposureNotification-BluetoothSpecificationv1.2.pdf).

```js
setActiveScan(
  await navigator.bluetooth.requestLEScan({
    filters: [{ services: [0xfd6f] }],
    keepRepeatedDevices: true,
  })
);
```

Using the Web Bluetooth API we are able to scan for devices which are emitting these kinds of service advertisement.
We are then able to parse the payloads service data to retrieve the current _Rolling Proximity Identifier_ and _Encrypted Metadata_ for that device.
You will notice that every 10 minutes or so both the device UUID and Rolling Proximity Identifier change, this is for privacy concerns and in-line with the [Exposure Notification Cryptography Specification](https://covid19-static.cdn-apple.com/applications/covid19/current/static/contact-tracing/pdf/ExposureNotification-CryptographySpecificationv1.2.pdf).

```js
const onAdvertisementReceived = event => {
  const serviceData = event.serviceData.get(event.uuids[0]).buffer;

  setDevices(devices => ({
    ...devices,
    [event.device.id]: {
      uuid: event.device.id,
      rollingProximityId: toHex(serviceData.slice(0, 16)),
      metadata: toHex(serviceData.slice(16)),
      rssi: event.rssi,
      lastSeen: Date.now(),
    },
  }));
};
```

The Encrypted Metadata includes the transmitted power (txPower) value which the Bluetooth device is currently emitting at.
Upon a positive diagnosis the last 14 days _Temporary Exposure Key's_ are sent to the Diagnosis Server.
Every interested device can then download these keys and verify if they are aware of any derived Rolling Proximity Identifier.
If there is a match, then the associated payloads Encrypted Metadata can then be decrypted using the days' Temporary Exposure Key.
This leads to a more accurate distance value being calculated based on the _Received Signal Strength Indicator_ (RSSI) and transmitted power.
