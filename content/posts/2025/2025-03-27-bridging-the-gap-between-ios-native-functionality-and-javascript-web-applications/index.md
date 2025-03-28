---
layout: post
title: 'Bridging the Gap Between iOS Native Functionality and JavaScript Web Applications'
meta: 'Learn how to integrate iOS native functionality into JavaScript web applications using WKWebView and a custom Swift/JavaScript bridge for seamless communication.'
summary: "In this post, I share a pattern I've been using to bridge native iOS functionality with JavaScript running inside a WKWebView. It covers setting up a lightweight Swift/JavaScript bridge to handle asynchronous communication between the two."
tags: ['swift', 'ios', 'javascript']
---

I've been recently working on a project which requires some native iOS capabilities that are not accessible within a JavaScript _WebView_ context.
There are projects such as [Capacitor](https://capacitorjs.com/) which help to bridge this gap.
However, I already have an existing iOS application that I wished to include this functionality in.

To provide bi-directional communication between the JavaScript application running within the `WKWebView` and the native functionality available within the wrapper application, I built a thin bridge placed in the middle.
In this post, I wish to provide an example pattern I have been using which handles the typical asynchronous lifecycle of the given functionality.

![Illustration of a stone bridge over water with Swift logo on the left and JavaScript logo on the right, symbolizing a connection between the two programming languages.](bridge.png)

## Bridging the Gap

To set up the bridge between the native Swift wrapper application and the JavaScript web application, you must implement a class which conforms to the `WKScriptMessageHandler` protocol.
With this implementation, you can then register the desired _message names_ (à la function names) to handle within a `WKUserContentController`, which is supplied to the `WKWebView` instance.

```swift
class Example: WKScriptMessageHandler {
    weak var webView: WKWebView!
    weak var locationManager: CLLocationManager!

    // ..

    private func initWebView() {
        let contentController = WKUserContentController()
        contentController.add(self, name: "getCurrentWifiSsid")

        let config = WKWebViewConfiguration()
        config.userContentController = contentController

        self.webView = WKWebView(frame: calcWebviewFrame(), configuration: config)
    }

    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        switch message.name {
        case "getCurrentWifiSsid":
            if let body = message.body as? [String: Any], let requestId = body["requestId"] as? String {
                let status = self.locationManager.authorizationStatus
                if status != .authorizedWhenInUse && status != .authorizedAlways {
                    self.evaluateJavascriptWithinWebView("onGetCurrentWifiSsidResult('\(requestId)', null, 'Does not have sufficient WiFi permissions')")
                    return
                }

                NEHotspotNetwork.fetchCurrent { network in
                    if let ssid = network?.ssid {
                        self.evaluateJavascriptWithinWebView("onGetCurrentWifiSsidResult('\(requestId)', '\(ssid)', null)")
                    } else {
                        self.evaluateJavascriptWithinWebView("onGetCurrentWifiSsidResult('\(requestId)', null, null)")
                    }
                }
            }
        default:
            break
        }
    }

    private func evaluateJavascriptWithinWebView(_ js: String) {
        DispatchQueue.main.async {
            self.webView.evaluateJavaScript(js, completionHandler: nil)
        }
    }
}
```

The message handlers are uni-directional and, as such, we need to coordinate the request/response lifecycle ourselves, preferably in an asynchronous manner, so as to not block the main thread.
Thanks to the `Promise` construct, we can abstract this away from the JavaScript callee in a very clean manner.

```js
const requests = {};

export const getCurrentWifiSsid = () =>
  new Promise((resolve, reject) => {
    const requestId = Date.now().toString();
    requests[requestId] = { resolve, reject };
    window.webkit.messageHandlers.getCurrentWifiSsid.postMessage({
      requestId,
    });
  });

window.onGetCurrentWifiSsidResult = (requestId, ssid, error) => {
  if (error) {
    requests[requestId].reject(error);
  } else {
    requests[requestId].resolve(ssid);
  }
  delete requests[requestId];
};
```

To achieve this, we create a `requestId` within the JavaScript bridge code, storing the Promise's `resolve` and `reject` callbacks in a shared space which can be looked up by this `requestId` at a later time.
We then send the _message_ (à la function call) on to the native wrapper application, including all desired parameters (including this `requestId`).
Upon completion of the native application's behaviour, a separate JavaScript bridge function is invoked which supplies the `requestId` along with any additional parameters.
The JavaScript bridge is then able to look up and invoke the Promise's `resolve` and `reject` callbacks accordingly with the desired resulting values.

**Aside**: we could additionally include a timeout which rejects the Promise after a given time if we do not receive a result back from the native wrapper in a sufficient amount of time.
