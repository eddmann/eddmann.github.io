---
layout: post
title: "Compiling Pokémon Red (pokered) using Docker and adding 'Super B' button behaviour"
meta: "Documenting how to compile Pokémon Red (pokered) using Docker and adding 'Super B' button behaviour"
---

Over the Christmas break I found myself on a bit of a nostalgic gaming journey.
Along with building a [RetroPie](https://retropie.org.uk/), I dusted off my old Game Boy and decided to 'catch them all' one more time on Pokémon Red.
Whilst playing, the developer in me started to contrive how a game like this was created, and better still could be changed.
Enter [pokered](https://github.com/pret/pokered), a disassembly of Pokémon Red/Blue which has been organised so that an assembly code noice like myself can understand it.
In this post I will go through compiling the ASM, tweaking the game to add ['Super B' button behaviour](https://github.com/eddmann/pokered/commit/e2d6662bc13348234d58a262e9d6faef0a2507de), and then running the compiled ROM on an actual handheld!

<!--more-->

**Note:** I don't condone piracy and personally own both Pokémon Red/Blue game cartridges that this project is based on.

## Compiling pokered using Docker

The [pokered](https://github.com/pret/pokered) Git repository is well documented, including the steps required to compile the given assembly code for the desired platform.
However, being an advocate of Docker I wished to take it a step further an Dockerise this process.
To do this I created the `Dockerfile` below, which uses a small [Debian base image](https://github.com/bitnami/minideb) to install all the required dependencies with.

```docker
FROM bitnami/minideb:stretch
RUN install_packages make git gcc byacc flex pkg-config libpng-dev ca-certificates
RUN git clone https://github.com/rednex/rgbds /opt/rgbds && make -C /opt/rgbds install && rm -fr /opt/rgbds
RUN mkdir /opt/src
WORKDIR /opt/src
CMD ["make", "all"]
```

From here I then compiled and pushed [this image](https://hub.docker.com/r/eddmann/pokered) to Docker Hub and created a small executable `docker-make` script within the root of the repository.

```bash
#!/bin/bash
docker run -v $(pwd):/opt/src eddmann/pokered make $@
```

This allowed me to seamlessly run all provided `make` targets within the Docker container like so `./docker-make all`.
Once complete, two new build artifacts were now present in the root of the repository - `pokered.gbc` and `pokeblue.gbc`.
Both these ROMs were now playable using a desktop/web Game Boy emulator like [wasmboy](https://wasmboy.app/). 🎉

## Adding the 'Super B' button behaviour

Now that I could now compile the game into a working ROM, my mind began thinking of all the small tweaks to the game I would like to experiment with.
One aspect of the original that always felt time consuming was when trying to get to a destination in a hurry and be caught out by many wild Pokémon (without [Repel](https://bulbapedia.bulbagarden.net/wiki/Repel) active) and trainer-battle encounters.
I started to review the code-base to see if there was a way of taking advantage of when the B button was pressed, possibly temporarily preventing these two activities.

### Prevent Wild Pokémon Encounters

It turns out that the game had an unused [debug mode](https://tcrf.net/Pok%C3%A9mon_Red_and_Blue/Debug_Functions#Debug_Mode) that was left in, which provided one part of this behaviour.
As such I was able to tweak [`engine/battle/core.asm`](https://github.com/eddmann/pokered/commit/e2d6662bc13348234d58a262e9d6faef0a2507de#diff-126f3527215b40b1dc53ffe1ff45b479) to prevent wild Pokémon encounters if the B button was pressed.

```diff
DetermineWildOpponent:
- ld a, [wd732]
- bit 1, a
- jr z, .asm_3ef2f
  ld a, [hJoyHeld]
- bit 1, a ; B button pressed?
+ and B_BUTTON
  ret nz
```

This tweak simply removes the check for if the debug mode is enabled and short-circuits the action if the B button is pressed.

### Prevent Trainer Battle Encounters

Following this, I now hoped to follow a similar pattern in temporarily preventing trainer battle encounters.
I was able to achieve this by making some minor modifications to [`home.asm`](https://github.com/eddmann/pokered/commit/e2d6662bc13348234d58a262e9d6faef0a2507de#diff-33f8ea117b558305b57c03b757e4ef64).

```diff
CheckFightingMapTrainers::
+ ld a, [hJoyHeld]
+ and B_BUTTON
+ jr nz, .noFight

  call CheckForEngagingTrainers
  ld a, [wSpriteIndex]
  cp $ff
  jr nz, .trainerEngaging
+ .noFight
  xor a
  ld [wSpriteIndex], a
  ld [wTrainerHeaderFlagBit], a
  ret
```

In a similar manor to how we prevented wild Pokémon encounters, if the B button is pressed we jump to `.noFight`, skipping the `CheckForEngagingTrainers` call.
Once compiled, I was able to experiment with these two changes and found them to be very interesting additions to game play.

### Walking Through Walls

I then thought wouldn't it be cool to accommodate for a similar 'walk through walls' glitch behaviour that you see in certain [speed runs](https://www.youtube.com/watch?v=5naL4X1vUbE).
As such I delved back into the code-base and made a small modification to [`home/overworld.asm`](https://github.com/eddmann/pokered/commit/e2d6662bc13348234d58a262e9d6faef0a2507de#diff-3dcdb47cbd60e627ff3c82d83193112c) which provided me with this capability.

```diff
.noDirectionChange
  ld a, [wPlayerDirection] ; current direction
  ld [wPlayerMovingDirection], a ; save direction
  call UpdateSprites

+ ld a, [hJoyHeld]
+ and B_BUTTON
+ jr nz, .noCollision

  ld a, [wWalkBikeSurfState]
  cp $02 ; surfing
  jr z, .surfing
```

After another compile I was now able to not only prevent wild Pokémon and trainer battle encounters, but also 'walk through walls' when desired.
You can see a small clip below of how game play is altered when the 'Super B' button is pressed.

![Super B Button](/uploads/compiling-pokered-using-docker-and-adding-super-b-button-behaviour/superb.gif)

Due to the effort put into making the pokered project so readable, I found it very easy to work my way through the code-base and locate the areas of interest to experiment with.
The people behind this disassembly have also worked on doing the same for [many other](https://github.com/pret) Pokémon releases.

## Playing on a Handheld

With this modifications in place I ideally wished to now use this new behaviour on a handled console, as opposed to just through a desktop emulator.
To achieve this I purchased an [EZ-Flash Omega](http://www.ezflash.cn/product/omega/) cartridge for the GBA which allowed me to transfer these ROMs onto a micro-SD card.
Now I could play these games on a backlit screen using my Nintendo DS Lite. 😎

![EZ-Flash Omega](/uploads/compiling-pokered-using-docker-and-adding-super-b-button-behaviour/ezflash.jpg)
