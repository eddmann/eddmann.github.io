---
layout: post
title: 'Building a Running Calculator PWA in React and TypeScript'
meta: 'This post documents my experience building a Progress Web Application which calculates running pace, time and distance, along with common-place imperial/metric measurement conversions'
tags: pwa react typescript
---

I have been an avid runner for many years now, but I still get confused by imperial and metric measurements.
On top of this, the amount of times I seek out a random website to perform some form of pace/distance calculation is too often to count.
What I wanted was a desktop and mobile application that could perform pace, distance and time calculations, along with imperial/metric conversions - _a swiss-army knife of running calculators_.
In this post I would like to document my experience building a [Progress Web Application](https://web.dev/articles/what-are-pwas) (PWA) which does just this; providing a native app-like experience across iOS, Android and Desktop.

<!--more-->

<a href="https://eddmann.com/running-calculator/">
  <img src="/uploads/building-a-running-calculator-pwa-in-react-and-typescript/app-icon.png" style="max-width:150px;border-radius:20%;margin:0 auto;" alt="App Icon" />
</a>

Progress Web Applications provide a means of leveraging the browser and web technologies to enable a _native app_-like mobile and desktop experience.
They use the conventional web stack that web developers are familiar with; HTML, JavaScript and CSS.
This in-turn allows you to deploy at the same frequency and ease as you would a conventional website, but without the head-aches of app store submissions.

## The App

<div style="display:flex;gap:0.5rem;flex-direction:row;margin:1rem 0 0;">
  <div>
    <img src="/uploads/building-a-running-calculator-pwa-in-react-and-typescript/ios-pace.png" alt="Pace" />
  </div>
  <div>
    <img src="/uploads/building-a-running-calculator-pwa-in-react-and-typescript/ios-distance.png" alt="Distance" />
  </div>
  <div>
    <img src="/uploads/building-a-running-calculator-pwa-in-react-and-typescript/ios-time.png" alt="Time" />
  </div>
</div>

The resulting application has been built using React, TypeScript, CSS-in-JS ([styled-components](https://styled-components.com/)) and bundled with [Vite](https://vitejs.dev/).
I have leveraged the [Vite PWA plugin](https://vite-pwa-org.netlify.app/) to abstract away generating the required Service Worker, Web app manifest and icon assets to [meet PWA requirements](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Tutorials/js13kGames/Installable_PWAs#requirements).
Under-the-hood Google's [Workbox](https://developer.chrome.com/docs/workbox/) project is used to handle managing caching assets for offline use and updating the registered Service Worker.

When initially researching PWA development, you would naively assume it is just a case of adding a Web app manifest and Service Worker to your project, serving the content over HTTPS and you're done... not quite.
Below I will discuss the different areas I needed to consider which lead to final result shown above.

## App'ification

<div style="display:flex;gap:1rem;align-items:center;margin:1rem 0 0;">
  <div>
    <video style="width:100%;" controls muted>
      <source src="/uploads/building-a-running-calculator-pwa-in-react-and-typescript/ios-install.mp4" type="video/mp4">
    </video>
  </div>
  <div>
    <video style="width:100%" controls muted>
      <source src="/uploads/building-a-running-calculator-pwa-in-react-and-typescript/android-install.mp4" type="video/mp4">
    </video>
  </div>
</div>

### Look and Feel

A large area of research and development was making the user experience _look and feel_ like a native application that would be typically found on both mobile and desktop devices.
A lot of time was spent in essentially _'de-webifying'_ the web application, to follow what users would expect from a native application experience.
This included disabling page zooming capabilities, user text selection and document overflow scrolling.
These were all fortunately able to be achieved using CSS, with a small dose of browser-specific prefixes (Safari...).
I did however have to resort to some JavaScript for disabling the touch body scroll which is present when the soft-keyboard appears on mobile for focused input fields.
Although this process overall did take some trial and error, the learnings garnered can be applied going forward to other app-like web experiences and PWAs I wish to develop.

### Mobile

When the iPhone was initially released, Steve Jobs toted an innovative new way to create web applications _"that look exactly and behave exactly like native apps"_ during the launch's [one last thing](https://www.youtube.com/watch?v=ZlE7dzoD6GA) section.
However, the momentum soon dwindled with the release of a native SDK several months later - and the subsequent popularity/revenue of the App Store has not made Apple regret that decision.
This has lead to much of my PWA development experience sadly feeling like how can I make this work on iOS... (and this is coming from an Apple fanboy).
iOS is still [way behind](https://firt.dev/notes/pwa-ios/) the awesome web capability support that is present on Android, for example it has only finally added [Web Push](https://developer.mozilla.org/en-US/docs/Web/API/Push_API) capabilities since iOS 16.4.

Below are several of the key pain points I have felt whilst developing this PWA on iOS.

#### Splash screens

The amount of splash-screen assets that are required to be generated to provide full iOS device support is mind-blowing.
Not only do you need to supply many assets up-front, iOS requires custom Safari specific meta-tag workarounds to register the different splash-screen variants.
This is in stark contrast to Android where the system is able to use an existing icon provided by the Web app manifest.

#### Orientation

iOS lacks support for the Web app manifest [orientation](https://developer.mozilla.org/en-US/docs/Web/Manifest/orientation) (portrait and/or landscape) property, which allows you to specify what orientations the PWA supports.
Instead you are required to cater for both, or provide crude CSS-based 'Not support in this orientation' messages to the user.

#### Installation prompt

Most annoying of all, iOS lacks native [installation prompts](https://web.dev/learn/pwa/installation-prompt), which on the other hand is fully supported on Android and Chrome desktop devices.
It does not support the `beforeinstallprompt` event which means that to install a PWA you have to instruct the user to manually visit Safari, open the bottom menu bar and 'Add to Home Screen' 🤦.
Third-party browsers (i.e. Chrome) although being required to use the Safari web-engine do not have support for installing PWAs.
This really puts PWA adoption on the back foot compared to the seamless experience that iOS provides for App Store installations.
Android on the other hand provides a great user experience, harnessing screenshots found in the Web app manifest to aid the user in installing your application.
It even packages up the application as a [Trusted Web Activity](https://developer.chrome.com/docs/android/trusted-web-activity/), which treats the PWA as if it were like any other Android application, not just a Safari _bookmark_ icon.
You can see how the two experiences differ by watching the videos above.

### Desktop

<div style="display:flex;gap:1rem;flex-direction:row;align-items:center;">
  <div>
    <img src="/uploads/building-a-running-calculator-pwa-in-react-and-typescript/desktop-wide-pace.png" alt="Desktop (wide)" />
  </div>
  <div>
    <img src="/uploads/building-a-running-calculator-pwa-in-react-and-typescript/desktop-narrow-pace.png" alt="Desktop (narrow)" />
  </div>
</div>

In contrast to the work required on mobile to meet the desired look and feel, desktop development did not require as much attention.
As PWAs support is only present within Google Chrome (and variants such as Microsoft Edge), this limited the scope of browsers that needed to be catered for.
What is great about this approach is that there is no need to wrap your application in an [Electron](https://www.electronjs.org/)/[Tauri](https://tauri.app/) wrapper if the APIs supplied by Google Chrome meet your needs.

<video style="width:100%" controls muted>
  <source src="/uploads/building-a-running-calculator-pwa-in-react-and-typescript/desktop-install.mp4" type="video/mp4">
</video>

## Conclusion

I am very happy with the PWA that I have been able to build over the past week or so.
Although the application itself is simple, it has allowed me to explore many of the fundamental areas of PWA development that need to considered when building web applications that should look and feel native.
iOS support, although lacking behind Android considerably, at least provides a native look and feel once it has been installed on to the device.
To help aid in this issue, going forward I would like to explore how I can use projects such as [PWABuilder](https://www.pwabuilder.com/) to package the PWA into an application that can be submitted onto both the Google Play and Apple App Store.
