---
layout: post
title: 'Adding Running Shoes (aka Speeding up walking) in Pokémon Red (pokered)'
meta: 'Learn how to add Running Shoes to Pokémon Red (pokered) for a faster walking experience without waiting for the Bicycle.'
tags: ['retro-gaming', 'assembly-code', 'pokemon']
---

One item I feel is missing from the Pokémon Generation 1 games is the [Running Shoes](https://bulbapedia.bulbagarden.net/wiki/Running_Shoes).
When activated, they increase the speed at which you move around the game.
You can achieve this with the [Bicycle](https://bulbapedia.bulbagarden.net/wiki/Bicycle), but it is only available later in the game.
In this post, I will document how I simply added this running ability globally whilst the 'B button' is pressed.

<!--more-->

Looking through the [pokered](https://github.com/pret/pokered) source, I identified the logic surrounding moving the player around the game within [`home/overworld.asm`](https://github.com/eddmann/pokered/blob/running-shoes/home/overworld.asm#L276).

```diff
.moveAhead2
  ld hl, wFlags_0xcd60
  res 2, [hl]
+ ld a, [hJoyHeld]
+ and B_BUTTON
+ jr nz, .speedUp
  ld a, [wWalkBikeSurfState]
  dec a ; riding a bike?
  jr nz, .normalPlayerSpriteAdvancement
  ld a, [wd736]
  bit 6, a ; jumping a ledge?
  jr nz, .normalPlayerSpriteAdvancement
+ .speedUp
  call DoBikeSpeedup
  .normalPlayerSpriteAdvancement
  call AdvancePlayerSprite
```

With this small modification, if the 'B button' is pressed, we jump directly to the new `speedUp` label, which instructs the engine to perform the bike speedup.
This in turn provides us with the ability to 'run' throughout the game at the same speed as if you were on a bike.
