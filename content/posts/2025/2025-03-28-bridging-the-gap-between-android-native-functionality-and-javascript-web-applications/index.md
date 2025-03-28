---
layout: post
title: 'Bridging the Gap Between Android Native Functionality and JavaScript Web Applications'
meta: 'Learn how to bridge native Android functionality with JavaScript running inside a WebView using a lightweight Kotlin/Java-JavaScript bridge pattern for asynchronous communication.'
summary: "In this post, I share a pattern I've been using to bridge native Android functionality with JavaScript running inside a WebView. It covers setting up a lightweight Kotlin/Java-JavaScript bridge to handle asynchronous communication between the two."
tags: ['kotlin', 'android', 'javascript']
---

I've been recently working on a project which requires some native Android capabilities that are not accessible within a JavaScript _WebView_ context.
There are projects such as [Capacitor](https://capacitorjs.com/) which help to bridge this gap.
However, similar to my [previous post](../2025-03-27-bridging-the-gap-between-ios-native-functionality-and-javascript-web-applications/index.md), I already have an existing Kotlin application that I wished to include this functionality in.

To provide bi-directional communication between the JavaScript application running within the `WebView` and the native functionality available within the wrapper application, I built a thin bridge placed in the middle.
In this post, I wish to provide an example pattern I have been using which handles the typical asynchronous lifecycle of the given functionality.

![Illustration of a bridge over a river connecting Kotlin and JavaScript logos, symbolizing interoperability between the two programming languages.](bridge.png)

## Bridging the Gap

To set up the bridge between the native Kotlin wrapper application and the JavaScript web application, you must supply an instance of a class which exposes functions that have been annotated with `@JavascriptInterface`.

Unlike the Swift equivalent, these functions are automatically exposed based on the presence of this annotation and also provide a means of returning synchronous results.
As such, for this example I have included both a synchronous `hasWifiPermissions` and _contrived_ asynchronous `getCurrentWifiSsid` example.
It is contrived as the `getCurrentWifiSsid` example could have been made synchronous, but like the [previous post](../2025-03-27-bridging-the-gap-between-ios-native-functionality-and-javascript-web-applications/index.md) which documented the iOS/Swift approach, I wanted to document a like-for-like comparison.

```kotlin
class WebBridge(private val context: Context) {

    @JavascriptInterface
    fun hasWifiPermissions(): Boolean {
        return ContextCompat.checkSelfPermission(context, ACCESS_FINE_LOCATION) == PERMISSION_GRANTED
    }

    @JavascriptInterface
    fun getCurrentWifiSsid(requestId: String) {
        if (!hasWifiPermissions()) {
            evaluateJavascriptWithinWebView("onGetCurrentWifiSsidResult('$requestId', null, 'Does not have sufficient WiFi permissions')")
            return
        }

        val wifiManager = context.applicationContext.getSystemService(Context.WIFI_SERVICE) as android.net.wifi.WifiManager
        val ssid = wifiManager.connectionInfo?.ssid

        if (ssid == null || ssid == "<unknown ssid>") {
            evaluateJavascriptWithinWebView("onGetCurrentWifiSsidResult('$requestId', null, null)")
        } else {
            evaluateJavascriptWithinWebView("onGetCurrentWifiSsidResult('$requestId', '${ssid.replace("\"", "")}', null)")
        }
    }

    private fun evaluateJavascriptWithinWebView(js: String) {
        if (context !is Activity) {
            return
        }

        val webView = context.findViewById<android.webkit.WebView>(R.id.webView)
        webView?.post {
            webView.evaluateJavascript(js, null)
        }
    }
}
```

This class is then instantiated and registered with the given `WebView` like so:

```kotlin
class MainActivity: ComponentActivity() {
    private lateinit var webView: WebView

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        // ..

        webView = findViewById(R.id.webView)
        webView.settings.javaScriptEnabled = true
        webView.addJavascriptInterface(WebBridge(this), "WebBridge")
    }
}
```

Although there is support for synchronous invocation of native behaviour, I wanted to provide a unified public API which could be used for bridging between both iOS and Android applications.
As such, I opted to use the `Promise` construct to abstract away the implementation details of whether the call can or cannot be made synchronously.

```js
const requests = {};

export const getCurrentWifiSsid = () =>
  new Promise((resolve, reject) => {
    const requestId = Date.now().toString();
    requests[requestId] = { resolve, reject };
    window.WebBridge.getCurrentWifiSsid(requestId);
  });

window.onGetCurrentWifiSsidResult = (requestId, ssid, error) => {
  if (error) {
    requests[requestId].reject(error);
  } else {
    requests[requestId].resolve(ssid);
  }
  delete requests[requestId];
};

export const hasWifiPermissions = () =>
  Promise.resolve(window.WebBridge.hasWifiPermissions());
```

To manage the asynchronous `getCurrentWifiSsid` function call, we create a `requestId` within the JavaScript bridge code, storing the Promise's `resolve` and `reject` callbacks in a shared space which can be looked up by this `requestId` at a later time.
We then invoke the WebBridge function on the native wrapper application, including all desired parameters (including this `requestId`).
Upon completion of the native application's behaviour, a separate JavaScript bridge function is invoked which supplies the `requestId` along with any additional parameters.
The JavaScript bridge is then able to look up and invoke the Promise's `resolve` and `reject` callbacks accordingly with the desired resulting values.

**Aside**: we could additionally include a timeout which rejects the Promise after a given time if we do not receive a result back from the native wrapper in a sufficient amount of time.
