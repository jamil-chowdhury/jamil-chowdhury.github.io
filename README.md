# Jamil Chowdhury — personal website

Website: https://jamil-chowdhury.github.io/

GitHub Pages publishes the root of `main`.

The landing page retains the illustrated farm panorama and grey felt background. The name uses self-hosted Bodoni Moda in dark green, with the subtitle `Research. Creative technologist. Artist.`

## Editing and adding animations

- `index.html`: edit the name in `h1#name`, and the subtitle in `.identity-line`. Both sit inside the banner (`.hero-identity`), in the open sky at the top-left.
- `assets/content.css`: name, subtitle, animation-card and video-page styles. Font licenses are in `assets/OFL-Bodoni-Moda.txt` and `assets/OFL-Patrick-Hand.txt`.
- Each `.animation-entry` card links to a separate page with `target="_blank" rel="noopener"`. The browser chooses a new tab or window. The gallery shows up to four windows per row on wide screens, centred. Duplicate an article in `.animation-gallery`, replace its thumbnail, title, summary and page link, and create the matching page.
- `ectomycorrhiza.html`: video title, short description and video source. Its video starts only when a visitor presses play. The homepage never requests video bytes.
- To change the narration, replace the audio track in the MP4, upload the new video as a GitHub release asset, and update the `<source src>` in the video page. Editing the page text alone does not change the recorded voice.
- `assets/felt-background.js`: reusable generated grey felt. The homepage retains the same inline background script and its original farm illustration code.

The farm pause button remains below the banner. Reduced motion starts the farm paused; rendering also pauses when the banner is offscreen or the tab is hidden. No external fonts or scripts are requested.

