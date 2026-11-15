---
name: Jamil Chowdhury - Hand-drawn science journal
description: Supplied scientific animation above a quiet grey watercolour journal.
colors:
  paper: "#eeefeb"
  ink: "#343b36"
  animation-paper: "#f5f0e4"
  animation-ink: "#283d85"
  playback-border: "#a5aac0"
  playback-hover: "#e7e6dd"
typography:
  display:
    fontFamily: "Patrick Hand, Segoe Print, Bradley Hand, cursive"
    fontSize: "clamp(2.7rem, 6vw, 4.5rem)"
    fontWeight: 400
    lineHeight: 1.16
    letterSpacing: "-0.025em"
  body:
    fontFamily: "Patrick Hand, Segoe Print, Bradley Hand, cursive"
  fallback:
    fontFamily: "Georgia, serif"
    fontSize: "1rem"
    lineHeight: 1.6
rounded:
  playback: "50%"
spacing:
  control-inset: "12px"
  gutter: "24px"
  journal-top: "52px"
components:
  playback:
    backgroundColor: "{colors.animation-paper}"
    textColor: "{colors.animation-ink}"
    rounded: "{rounded.playback}"
    padding: "0"
    width: "44px"
    height: "44px"
  playback-hover:
    backgroundColor: "{colors.playback-hover}"
  skip-link:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    padding: "12px 18px"
  journal:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
  name:
    typography: "{typography.display}"
---

# Design System: Jamil Chowdhury - Hand-drawn science journal

## Overview
**Creative North Star: "A hand-drawn science journal"**

The supplied hand-drawn scientific artwork leads the experience. Its pencil marks, handwritten labels and warm sheet remain an intact visual asset. The surrounding interface stays quiet so the science remains the focus.

The neutral grey watercolour journal preserves the existing cotton-paper tooth, fibres and subtle pigment variation. Selectable HTML text sits above this static decorative texture. Warmth belongs to the supplied animation; the journal retains its neutral grey character.

**Key Characteristics:**

- Supplied scientific artwork with unobtrusive playback controls.
- Patrick Hand lettering shared by the animation and page signature.
- Neutral grey paper with static, procedural material detail.
- Open spacing, flat surfaces and visible keyboard focus.

## Colors
Blue scientific ink on warm animation paper sits above charcoal text on neutral grey journal paper. Frontmatter contains the normative CSS values.

### Primary

- **Scientific blue ink:** Drawing and caption ink, reused by the playback icon and focus ring.

### Neutral

- **Grey watercolour paper:** Page fallback, journal background and skip-link surface.
- **Charcoal ink:** Name, page text and skip-link focus ring.
- **Warm animation paper:** Supplied artwork's sheet and playback button background.
- **Quiet control border:** Thin circular playback outline.
- **Control hover wash:** Subtle tonal change on playback hover.

**The Neutral Journal Rule.** Preserve the journal's grey paper character; do not extend the supplied artwork's warm sheet into it.

## Typography
Patrick Hand, embedded locally under the SIL Open Font License, connects the page signature with the supplied scientific labels. Its page fallbacks are Segoe Print, Bradley Hand and cursive. The centred name uses the display token and balanced wrapping. Canvas labels and captions retain their supplied typography. Georgia appears only in the no-JavaScript fallback message; no article typography is established yet.

## Layout
The current page stacks two full-width surfaces: animation, then journal. The journal currently contains only the centred name Jamil Chowdhury; an empty, hidden posts container reserves its content flow for future science blogs and animations.

On wider screens, the animation uses padding (18px 24px 20px) and a centred frame constrained by `min(1120px, 100%, calc(66svh * 16 / 9))`. The canvas preserves a widescreen ratio (16:9). Playback sits at the frame's top right, inset (12px).

The journal uses minimum height (38svh), padding (52px 24px 88px), and centred content width `min(1040px, 100%)`. At the mobile breakpoint (600px and below), animation padding becomes (12px 0 16px), the frame fills the available width, and playback moves into normal flow below the artwork with margin (8px 12px 0 auto). This keeps scientific labels unobstructed. Mobile journal padding is (52px 22px 80px), with minimum height `calc(100svh - 100vw * 9 / 16 - 80px)`.

## Elevation & Depth
There are no box shadows. Procedural paper relief, fibres and low-amplitude pigment variation supply material depth. The journal texture draws at display density with bounded memory, without an animation loop. A neutral CSS paper fallback remains available before rendering or without JavaScript.

## Shapes
The surfaces are continuous and unrounded. The artwork retains its rectangular canvas silhouette; playback alone uses a circular shape with a fine border (1px). Paper grain and the supplied drawing retain their irregular organic contours.

## Components
### Scientific animation

The supplied artwork and captions remain the signature component. Its logical canvas is 1280 by 720. Silent playback loops over the supplied duration (104 seconds), at up to 30 frames per second. Clicking the canvas or activating the native button toggles playback. The button's accessible label and title switch between Play animation and Pause animation; the canvas has an accessible description and a no-JavaScript message.

Reduced motion starts playback paused and disables the drawing's outline boil. A later preference change to reduced motion pauses playback; users may explicitly start it. Rendering suspends when the canvas is offscreen or the document is hidden, resuming only when playback remains selected. Resize redraws the current frame after a debounce (150ms).

### Playback button

A circular touch target (44px square) contains an inline line icon (18px). Hover changes the paper tone without movement. Keyboard focus adds a blue outline (2px) with offset (4px). Icons alternate with playback state. Mobile placement follows Layout.

### Skip link

Skip animation targets the journal. Hidden above the viewport until focused, it appears at the top left with a charcoal outline (2px) and offset (3px). Its underline offset is .2em. Scrolling is smooth by default and immediate under reduced motion.

### Grey paper journal

The decorative canvas is hidden from assistive technology and pointer events. It renders once and redraws after a debounced size change (140ms). The signature remains separate, selectable HTML. No card, article, biography or general navigation component is currently established.

## Do's and Don'ts
### Do:

- **Do** retain the supplied scientific artwork, labels and captions.
- **Do** retain visible paper tooth and fibres on the neutral grey journal.
- **Do** keep journal text selectable and separate from the decorative canvas.
- **Do** preserve keyboard playback, visible focus, reduced-motion handling and offscreen suspension.
- **Do** keep mobile playback below the artwork so scientific labels remain visible.

### Don't:

- **Don't** introduce yellow washes, woodland scenery, trees or mushrooms into the grey journal.
- **Don't** add biography, qualifications, employment claims or invented posts to the current name-only journal.
- **Don't** turn the static journal paper texture into a motion effect.

