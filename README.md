# Jamil Chowdhury — personal website

Website: https://jamil-chowdhury.github.io/

GitHub Pages publishes the root of the `main` branch.

## Editing

- `index.html`: homepage structure and name. Add future science posts inside `<div class="posts">` in the grey journal section.
- `style.css`: responsive layout and typography. The embedded Patrick Hand font comes from the supplied HTML animation; its license is in `assets/OFL-Patrick-Hand.txt`.
- `assets/clubroot.js`: the supplied clubroot animation adapted for a silent, looping landing-page feature. Captions and labels are drawn on the canvas. Search `const CAPS` to edit the caption wording.
- `paper.js`: the existing static grey watercolour texture, drawn at display density.

The animation has a keyboard-accessible play/pause button. It starts paused when the visitor requests reduced motion and stops rendering while offscreen or in a hidden tab. The animation artwork is kept in its original 16:9 composition. The site makes no external font, script, audio or video requests.
