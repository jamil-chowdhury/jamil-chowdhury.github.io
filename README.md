# Jamil Chowdhury — personal website

Website: https://jamil-chowdhury.github.io/

GitHub Pages publishes the root of `main`.

The landing page retains the illustrated farm panorama and grey felt background. The name uses self-hosted Bodoni Moda in dark green, with the subtitle `Research. Creative technologist. Artist.`

## Editing and adding animations

- `index.html`: edit the name in `h1#name`, and the subtitle in `.identity-line`. Both sit inside the banner (`.hero-identity`), in the open sky at the top-left.
- `assets/content.css`: name, subtitle, animation-card and video-page styles. Card titles use Fraunces and card descriptions use Kalam. The masking tape on each card is pure CSS (`.animation-window::before/::after`); its placement is set per card by the `.animation-entry:nth-child(...)` rules, which also give each window its small tilt, drop and nudge (`--tilt`, `--drop`, `--nudge`). Video pages use the same two fonts. Font licenses are in `assets/OFL-Bodoni-Moda.txt`, `assets/OFL-Patrick-Hand.txt`, `assets/OFL-Fraunces.txt` and `assets/OFL-Kalam.txt`.
- Each `.animation-entry` card links to a separate page with `target="_blank" rel="noopener"`. The browser chooses a new tab or window. The gallery shows up to four windows per row on wide screens, centred. Duplicate an article in `.animation-gallery`, replace its thumbnail, title, summary and page link, and create the matching page.
- `ectomycorrhiza.html`: video title, short description and video source. Its video starts only when a visitor presses play. The homepage never requests video bytes.
- `clubroot.html`: the same layout for `When Roots Turn to Clubs`, the narrated clubroot animation. Its 1080p MP4 is stored in the repository at `assets/video/clubroot-1080p.mp4` (about 83 MB; GitHub's per-file limit is 100 MB), and its card uses `assets/clubroot-poster.webp`. It can be moved to the `animations-v1` release later by uploading it there and changing the `<source src>`.
- `bacillus.html`: the same layout for `Bodyguards Below Ground`, the narrated Bacillus sequel. Its 1080p MP4 is at `assets/video/bacillus-1080p.mp4` and its card uses `assets/bacillus-poster.webp`.
- To change the narration, replace the audio track in the MP4, upload the new video as a GitHub release asset, and update the `<source src>` in the video page. Editing the page text alone does not change the recorded voice.
- `assets/felt-background.js`: reusable generated grey felt. The homepage retains the same inline background script and its original farm illustration code.

The farm pause button remains below the banner. Reduced motion starts the farm paused; rendering also pauses when the banner is offscreen or the tab is hidden. No external fonts or scripts are requested.

