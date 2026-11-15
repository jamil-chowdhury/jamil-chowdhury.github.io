---
name: Jamil Chowdhury - Felt farm
description: Supplied sustainable farm panorama above grey wool felt.
colors:
  felt: "#bdbebb"
  ink: "#221b16"
  sky: "#c8dfea"
  control: "#c8c9c4"
  control-hover: "#d9dad4"
  control-border: "#65645d"
typography:
  display:
    fontFamily: "Caveat, cursive"
    fontSize: "clamp(2.8rem,6vw,5rem)"
    fontWeight: 500
    lineHeight: 1.12
    letterSpacing: "-.025em"
rounded:
  control: "50%"
components:
  playback:
    backgroundColor: "{colors.control}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    width: "44px"
    height: "44px"
    padding: "0"
  playback-hover:
    backgroundColor: "{colors.control-hover}"
---

# Design System: Jamil Chowdhury - Felt farm

## Overview

**Creative North Star: "The Kind Little Farm"**

The supplied felt-and-ink farm leads above original textured grey wool. Preserve its artwork and labels.

## Colors

Preserve the artwork palette, sky banner and charcoal text on grey felt.

## Typography

Self-hosted Caveat supplies artwork lettering and the centred name. Body uses system sans-serif, line height (1.55).

## Layout

The full-width banner is 3:1, clipped between heights (260px) and (92vh). Canvas covers the frame at object position (28% 100%), retaining the gardener on narrow screens. Stitch margin is (18px 22px 0). Playback sits below the banner, right-aligned (top 12px). Main content: maximum width (1100px), minimum height (65vh), padding (56px 20px 80px). Only Jamil Chowdhury appears; future science content remains unfilled.

## Elevation & Depth

The banner casts a layered cut-out shadow. Static wool and cloud tiles repeat at (384px) and (910px), beneath a soft vignette.

## Shapes

Rectangular banner, circular playback and pale dashed stitch (2px).

## Components

Native playback: icon (18px), target (44px), hover fill, ink focus outline (2px), offset (4px). Labels and icons track playback. Canvas has an accessible description; Skip animation targets main. Continuous artwork runs up to 30fps, starts paused under reduced motion, pauses on preference activation and suspends hidden/offscreen. Explicit play remains available.

## Do's and Don'ts

- **Do** preserve the supplied farm artwork and original grey felt.
- **Do** keep playback below the artwork and keyboard accessible.
- **Don't** add biography or invented posts to the current name-only content.
