/* Original, static paper texture. No image downloads or animation loop. */
(() => {
  'use strict';
  const canvas = document.querySelector('.paper-texture');
  const page = document.querySelector('.page');
  if (!canvas || !page) return;
  const context = canvas.getContext('2d', { alpha: false });
  if (!context) return; // CSS provides a neutral paper fallback.
  let previousSize = '';
  let resizeTimer;
  let tile;
  let tileRatio;

  function randomGenerator(seed) {
    return () => {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      return seed / 4294967296;
    };
  }

  function makePaper(ratio) {
    // One seamless 512-CSS-pixel tile, drawn at the actual display density.
    const size = Math.ceil(512 * ratio);
    const surface = document.createElement('canvas');
    surface.width = surface.height = size;
    const ctx = surface.getContext('2d', { alpha: false });
    if (!ctx) return null;
    const random = randomGenerator(731214);
    const relief = new Float32Array(size * size);
    const wash = new Float32Array(size * size);

    function addNoise(target, columns, rows, amplitude) {
      const grid = Float32Array.from({ length: columns * rows }, () => random() * 2 - 1);
      for (let y = 0; y < size; y++) {
        const gy = y * rows / size;
        const iy = Math.floor(gy);
        const fy = gy - iy;
        const sy = fy * fy * (3 - 2 * fy);
        const row0 = iy * columns;
        const row1 = ((iy + 1) % rows) * columns;
        for (let x = 0; x < size; x++) {
          const gx = x * columns / size;
          const ix = Math.floor(gx);
          const fx = gx - ix;
          const sx = fx * fx * (3 - 2 * fx);
          const next = (ix + 1) % columns;
          const top = grid[row0 + ix] * (1 - sx) + grid[row0 + next] * sx;
          const bottom = grid[row1 + ix] * (1 - sx) + grid[row1 + next] * sx;
          target[y * size + x] += (top * (1 - sy) + bottom * sy) * amplitude;
        }
      }
    }

    // Coarse cotton tooth, compressed fibre clusters and a diffuse pigment wash.
    addNoise(relief, 160, 190, 0.48);
    addNoise(relief, 68, 84, 0.34);
    addNoise(relief, 24, 30, 0.18);
    addNoise(wash, 4, 4, 1);
    const image = ctx.createImageData(size, size);
    const step = Math.max(1, Math.round(ratio));
    for (let y = 0; y < size; y++) {
      const above = ((y - step + size) % size) * size;
      const below = ((y + step) % size) * size;
      for (let x = 0; x < size; x++) {
        const i = y * size + x;
        const light = (relief[y * size + (x - step + size) % size] - relief[y * size + (x + step) % size]) * 20
          + (relief[above + x] - relief[below + x]) * 24;
        const grain = (random() - 0.5) * 4;
        const tone = light + relief[i] * 7 + wash[i] * 3 + grain;
        const p = i * 4;
        image.data[p] = 238 + tone;
        image.data[p + 1] = 239 + tone;
        image.data[p + 2] = 235 + tone;
        image.data[p + 3] = 255;
      }
    }
    ctx.putImageData(image, 0, 0);
    // Fine, irregular cellulose fibres, wrapped so tile edges remain seamless.
    ctx.lineWidth = ratio * 0.38;
    for (let i = 0; i < 1700; i++) {
      const x = random() * size;
      const y = random() * size;
      const length = (1.2 + random() * 4.5) * ratio;
      const angle = random() * Math.PI * 2;
      const dx = Math.cos(angle) * length;
      const dy = Math.sin(angle) * length;
      ctx.strokeStyle = i % 3 ? 'rgba(255,255,253,0.18)' : 'rgba(91,100,93,0.08)';
      for (const ox of [-size, 0, size]) {
        for (const oy of [-size, 0, size]) {
          if (x + ox < -length || x + ox > size + length || y + oy < -length || y + oy > size + length) continue;
          ctx.beginPath();
          ctx.moveTo(x + ox, y + oy);
          ctx.quadraticCurveTo(x + ox + dx * 0.45 - dy * 0.18, y + oy + dy * 0.45 + dx * 0.18, x + ox + dx, y + oy + dy);
          ctx.stroke();
        }
      }
    }
    return surface;
  }

  function draw() {
    const { width, height } = page.getBoundingClientRect();
    if (!width || !height) return;
    // Bound memory on unusually large screens while retaining full density on
    // normal Retina desktops and phones. Texture never determines text sharpness.
    const ratio = Math.min(window.devicePixelRatio || 1, 3, Math.sqrt(12000000 / (width * height)));
    const sizeKey = `${Math.round(width)}:${Math.round(height)}:${ratio}`;
    if (sizeKey === previousSize) return;
    previousSize = sizeKey;
    if (!tile || tileRatio !== ratio) {
      tile = makePaper(ratio);
      tileRatio = ratio;
    }
    if (!tile) return;
    canvas.width = Math.ceil(width * ratio);
    canvas.height = Math.ceil(height * ratio);
    const pattern = context.createPattern(tile, 'repeat');
    if (!pattern) return;
    context.fillStyle = pattern;
    context.fillRect(0, 0, canvas.width, canvas.height);
    canvas.dataset.rendered = 'true';
  }

  function schedule() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(draw, 140);
  }
  if ('requestIdleCallback' in window) window.requestIdleCallback(draw, { timeout: 600 });
  else setTimeout(draw, 0);
  if ('ResizeObserver' in window) new ResizeObserver(schedule).observe(page);
  window.addEventListener('resize', schedule, { passive: true });
})();
