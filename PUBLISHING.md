# Publishing status

The `main` branch currently publishes the requested dark-green name and subtitle. This branch (`animation-windows-ready`) additionally contains the finished animation card and separate player page. Do not publish it until the MP4 is uploaded.

Remaining steps:

1. Upload `C:\Users\Jamil\Downloads\ectomycorrhiza-1080p.mp4` (85,291,334 bytes) to a release tagged `animations-v1` in this repository. Title: `A Partnership Takes Root`.
2. Confirm the public download URL is `https://github.com/jamil-chowdhury/jamil-chowdhury.github.io/releases/download/animations-v1/ectomycorrhiza-1080p.mp4` and that it plays.
3. Fast-forward `main` to this branch only if its current head still matches the published identity commit; otherwise incorporate intervening changes first.
4. Confirm Pages deployment succeeds, the card opens a new tab/window, and the player loads and plays the public video.

Chrome's automated file chooser currently requires the ChatGPT extension's `Allow access to file URLs` permission. Shell networking is unavailable in the current workspace. The prepared site scripts passed syntax and loading-behavior checks. The MP4 was recovered from the previous local preview at `http://127.0.0.1:8767/ectomycorrhiza.html` using its Download link. All website assets are committed here; the video itself is still pending.
