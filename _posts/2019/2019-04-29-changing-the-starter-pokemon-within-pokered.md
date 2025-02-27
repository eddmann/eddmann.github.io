---
layout: post
title: 'Changing the Starter Pokémon within Pokémon Red (pokered)'
meta: 'Documents how to change the Starter Pokémon available in Pokémon Red (pokered)'
---

Taking a closer look through the [pokered](https://github.com/pret/pokered) source, I stumbled upon the [Starter Pokémon](https://bulbapedia.bulbagarden.net/wiki/Starter_Pok%C3%A9mon) choices and thought how it would be possible to change these.
In this post I will document how I went about customising the Starter Pokémon choices available in Pokémon Red, and the modifications required to the 'pokered' source.

<!--more-->

I started off by updating the Starter Pokémon constants that are present in [`constants/starter_mons.asm`](https://github.com/eddmann/pokered/blob/change-starter-pokemon/constants/starter_mons.asm).

```diff
- STARTER1 EQU CHARMANDER
- STARTER2 EQU SQUIRTLE
- STARTER3 EQU BULBASAUR
+ STARTER1 EQU MEW
+ STARTER2 EQU PIKACHU
+ STARTER3 EQU SNORLAX
```

From here, I then generalised the wording Professor Oak uses when you are selecting the Starter Pokémon.
Instead of the specific 'So! You want the {type} Pokémon, {name}', I reworded it to 'So! You want this Pokémon?'.
As this required multiple disparate changes you can see the modifications in their entirety within [this](https://github.com/eddmann/pokered/commit/5d86068da8ef0a8967caa7c2fd654b54518e7f31) commit.

Next up was to update the Rival's Pokémon party, based on each location we encounter them.
This is defined within [`data/trainer_parties.asm`](https://github.com/eddmann/pokered/blob/change-starter-pokemon/data/trainer_parties.asm#L461) under the sections `Green1Data`, `Green2Data` and `Green3Data` (an homage to [Pokémon Green](https://bulbapedia.bulbagarden.net/wiki/Pok%C3%A9mon_Red_and_Green_Versions)).

```diff
Green1Data:
- db 5,SQUIRTLE,0
- db 5,BULBASAUR,0
- db 5,CHARMANDER,0
+ db 5,STARTER2,0
+ db 5,STARTER3,0
+ db 5,STARTER1,0
; Route 22
- db $FF,9,PIDGEY,8,SQUIRTLE,0
- db $FF,9,PIDGEY,8,BULBASAUR,0
- db $FF,9,PIDGEY,8,CHARMANDER,0
+ db $FF,9,PIDGEY,8,STARTER2,0
+ db $FF,9,PIDGEY,8,STARTER3,0
+ db $FF,9,PIDGEY,8,STARTER1,0
; Cerulean City
- db $FF,18,PIDGEOTTO,15,ABRA,15,RATTATA,17,SQUIRTLE,0
- db $FF,18,PIDGEOTTO,15,ABRA,15,RATTATA,17,BULBASAUR,0
- db $FF,18,PIDGEOTTO,15,ABRA,15,RATTATA,17,CHARMANDER,0
+ db $FF,18,PIDGEOTTO,15,ABRA,15,RATTATA,17,STARTER2,0
+ db $FF,18,PIDGEOTTO,15,ABRA,15,RATTATA,17,STARTER3,0
+ db $FF,18,PIDGEOTTO,15,ABRA,15,RATTATA,17,STARTER1,0
```

Above you can see the changes I made to the `Green1Data` section.
I decided to keep the change-set simple and not evolve any of the Rival's Starter Pokémon (i.e. Pikachu) throughout game-play.
If you wish to do this however, it is within this file that you can decide how they evolve (or maybe even change!?).

The final change that I made was to the Rival's Starter Pokémon move-set in the final battle, found in [`engine/battle/read_trainer_party.asm`](https://github.com/eddmann/pokered/blob/change-starter-pokemon/engine/battle/read_trainer_party.asm#L132).
In this battle each Starter Pokémon has a specific move made available to them.
Again, for the sake of simplicity I normalised this to only include [Hyper Beam](<https://bulbapedia.bulbagarden.net/wiki/Hyper_Beam_(move)>) regardless of choice.

```diff
; starter
- ld a, [wRivalStarter]
- cp STARTER3
- ld b, MEGA_DRAIN
- jr z, .GiveStarterMove
- cp STARTER1
- ld b, FIRE_BLAST
- jr z, .GiveStarterMove
- ld b, BLIZZARD ; must be squirtle
- .GiveStarterMove
- ld a, b
+ ld a, HYPER_BEAM
  ld [wEnemyMon6Moves + 2], a
```

With these changes applied and the new ROM compiled, I was now able to see the results of the updates above.

![Custom Starter Pokémon](/uploads/changing-the-starter-pokemon-within-pokered/starters.gif)
