---
layout: post
title: 'Creating a Contact Tracing Scanner using Swift for macOS'
meta: 'Highlights how to use Swift, Interface Builder and Core Bluetooth to build a Contact Tracing Scanner application'
---

Following on from my [previous experiement](https://eddmann.com/posts/creating-a-contact-tracing-scanner-using-web-bluetooth/) which highlighted what an Exposure Notification-enabled device actually emits using Web Bluetooth, I decided to explore how I could do the same using Swift and Interface Builder for macOS.

<!--more-->

The latest [application release](https://github.com/eddmann/contact-tracing-scanner-macos) can be downloaded from GitHub, and simply unzipped/executed without any additional dependencies.

[![Contact Tracing Scanner using Swift for macOS](/uploads/creating-a-contact-tracing-scanner-using-swift-for-macos/contact-tracing-scanner.png)](https://github.com/eddmann/contact-tracing-scanner-macos)

Using [Core Bluetooth](https://developer.apple.com/documentation/corebluetooth) I was able to scan for devices which were advertising the registered service UUID `0xfd6f` - and in-turn parse the service data.
The process overall, was very similair to the one used when building the Web Bluetooth solution.

```swift
// ...

let exposureNotificationServiceUuid = CBUUID(string: "FD6F")

open func centralManagerDidUpdateState(_ central: CBCentralManager) {
  switch central.state {
    case .poweredOn:
      central.scanForPeripherals(withServices: [exposureNotificationServiceUuid], options: [CBCentralManagerScanOptionAllowDuplicatesKey: true])
    case .poweredOff:
      central.stopScan()
    default:
      break
  }
}

public func centralManager(_ central: CBCentralManager, didDiscover peripheral: CBPeripheral, advertisementData: [String : Any], rssi RSSI: NSNumber) {
  if let serviceAdvertisementData = advertisementData[CBAdvertisementDataServiceDataKey] as? NSDictionary {
    if let exposureNotificationServiceData = serviceAdvertisementData.object(forKey: exposureNotificationServiceUuid) as? Data {
      let hex = exposureNotificationServiceData.map { String(format: "%02hhx", $0) }.joined()
      updateDevice(Device(uuid: peripheral.identifier.uuidString, rollingProximityId: "\(hex.prefix(32))", metadata: "\(hex.suffix(8))", rssi: "\(RSSI)", lastSeen: Date()))
    }
  }
}

// ...
```

To clean-up the listing and ensure that only active devices where present, I used a scheduled timer which would remove any old devices every 5 seconds.

```swift
Timer.scheduledTimer(withTimeInterval: 5, repeats: true) { timer in
  self.removeDevicesNotSeenInLastSeconds(10)
  self.tableView?.reloadData()
}

private func removeDevicesNotSeenInLastSeconds(_ seconds: Double) {
  devices = devices.filter({ Date().timeIntervalSince1970 - $0.lastSeen.timeIntervalSince1970 < seconds })
}
```

For a deeper understanding of how the Exposure Notification system works, please visit my [previous post](https://eddmann.com/posts/creating-a-contact-tracing-scanner-using-web-bluetooth/#how-it-works).
