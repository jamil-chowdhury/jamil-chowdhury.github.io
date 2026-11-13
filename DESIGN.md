---
name: Jamil Chowdhury — Grey watercolour paper
description: A personal welcome page on procedurally drawn neutral paper.
colors:
  paper: "#eeefeb"
  ink: "#343b36"
  muted-ink: "#57625d"
  fern: "#485c56"
  rust: "#3c5061"
typography:
  display:
    fontFamily: "Caveat, cursive"
    fontSize: "clamp(3.75rem, 6.7vw, 6rem)"
    fontWeight: 500
    lineHeight: 1.06
    letterSpacing: "-0.025em"
  body:
    fontFamily: "Georgia, Times New Roman, serif"
    fontSize: "17px"
    lineHeight: 1.75
spacing:
  small: "16px"
  medium: "24px"
  large: "32px"
---

# Design System

## Overview
Greyish off-white watercolour paper with visible cotton tooth and fibres. A static JavaScript canvas draws the texture at display density; text remains separate HTML. The latest user instruction removes woodland imagery and the yellow cast.

## Colors
Neutral paper carries charcoal text, grey-green links and blue-grey hover accents. Low-amplitude pigment washes preserve reading contrast.

## Typography
Caveat supplies a soft handwritten heading and navigation voice. Georgia supports readable body paragraphs. Caveat is self-hosted, with its SIL Open Font License included.

## Layout
A continuous paper surface fills the viewport, with signature and navigation at the top, central welcome text and a quiet footer in document flow. At 700px and below, condense navigation and reduce typography. No empty area is reserved for illustration.

## Elevation & Depth
Procedural paper relief, fibres and subtle pigment variation supply depth. There are no illustrated objects, cards, decorative shadows or glass surfaces.

## Shapes
Fine rules under text links supply clear affordances. Paper grain has small irregular organic contours.

## Components
Navigation uses handwritten text. Profile and source links are real anchors with visible keyboard focus. Arrow movement and transition are disabled under reduced-motion preferences. The canvas is decorative, hidden from assistive technology and pointer events. It renders once, redraws after a debounced resize, and has no animation loop. A neutral CSS paper fallback works without JavaScript.

## Do's and Don'ts
- Do retain visible paper tooth and fibres at display density.
- Do keep text selectable and separate from the decorative canvas.
- Don't introduce yellow washes, trees, mushrooms or other scenery.
- Don't add personal biographical claims without authorisation.
