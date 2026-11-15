# Design: Jamil Chowdhury

Preserve the supplied 3:1 felt-and-ink farming panorama, its scientific labels, animated farm life, original crop and generated grey felt background.

The identity below the banner uses self-hosted Bodoni Moda in dark green (#173e2c). The exact subtitle is `Research. Creative technologist. Artist.`, set in self-hosted Patrick Hand. Farm illustration labels retain Caveat.

An 800px-wide responsive animation gallery follows the identity. Each card has a still thumbnail in a stitched felt frame, a 50%-opaque play symbol, Jamil's credit, a title and a brief description. It opens a separate page through a normal link with `target="_blank" rel="noopener"`; the visitor's browser chooses a new tab or window.

The first animation is `A Partnership Takes Root`, subtitled `What ectomycorrhiza is and how it forms.` Its separate page has a native video player, a back-to-farm link and a download link. The narrated MP4 is hosted as a GitHub release asset. The homepage loads only the poster image, and the player uses `preload="none"` with no autoplay.

Keep controls keyboard accessible with visible focus states. The farm starts paused under reduced motion and suspends rendering while hidden or offscreen. Keep the mobile crop that retains the gardener and child. Preserve the original farm artwork and avoid invented biography or placeholder posts.
