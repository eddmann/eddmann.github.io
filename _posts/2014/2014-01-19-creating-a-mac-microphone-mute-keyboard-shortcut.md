---
layout: post
title: 'Creating a Mac Microphone Mute Keyboard Shortcut'
meta: 'Learn how to create a Mac microphone mute toggle using AppleScript and Automator for clearer podcast recordings and reduced background noise.'
tags: mac apple-script automator podcasting
---

When recording our [podcast](http://threedevsandamaybe.com/) there is nothing more annoying than playing it back only to find hearing yourself banging away on the keyboard when someone else is speaking.
Within Skype there is functionality to mute your microphone input device during an active call.
However, the location and size of the button can be a challenge to find throughout a full podcast recording.

<!--more-->

I also discovered upon listening to our previous recording that, with the transition to [Audio Hijack Pro](http://www.rogueamoeba.com/audiohijackpro/) (which is amazing), the user recording the conversation loses the ability for muting their microphone in Skype to also affect the recording.
This behaviour is due to Audio Hijack Pro recording and mixing both the audio output from Skype and the local user's input device.
To get around this, I found that muting the input source from within System Preferences did the trick.

Below is a step-by-step guide using a simple [AppleScript](http://www.macosxautomation.com/applescript/) and [Automator](<http://en.wikipedia.org/wiki/Automator_(software)>) Service to create a keyboard shortcut mute-toggle.

## AppleScript and Automator

The first step is to open Automator located in `/Applications`.
Then, create a new 'Service'.
From here, we can then locate and add a 'Run AppleScript' action from the middle panel.
With this added, replace the template content with the script found below, which simply toggles between full input volume level and muted.

```applescript
if input volume of (get volume settings) = 0 then
    set level to 100
else
    set level to 0
end if

set volume input volume level
```

With this added, we now need to set the Service to receive 'no input' and to work in 'any application'.
Finally, save the service with a meaningful name.
Following these instructions should result in a similar output to the screenshot provided below.

![Automator](/uploads/creating-a-mac-microphone-mute-keyboard-shortcut/automator.png)

## Binding to a Keyboard Shortcut

With the service now saved, we can navigate to the Keyboard Shortcuts tab within the System Preferences panel and locate the Service under 'General'.
All that is required now is for you to activate the service using the checkbox and define a unique shortcut which will be used to call it.
Similar to the Automator example, following these instructions should result in a similar output to the screenshot below.

![Keyboard](/uploads/creating-a-mac-microphone-mute-keyboard-shortcut/keyboard.png)

You are now able to toggle the input volume using the defined keyboard shortcut.
Unfortunately, there is no visual indication of the current state of the input device's volume, so I tend to keep the System Preferences input device screen open.
Another snag that I am still trying to find a workaround for is the requirement to be focused on 'Finder' when calling the keyboard shortcut.
I hope to investigate this issue further.
