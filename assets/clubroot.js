
(() => {
'use strict';
/* ================================================================
   Constants
   ================================================================ */
const W = 1280, H = 720, SH = 590, CX = 640, CY = 295, DUR = 104;
const INK = '#283D85';
const PAPER = '#F5F0E4';
const FONT = "'Patrick Hand','Segoe Print','Bradley Hand','Comic Sans MS',cursive";
const REDUCED = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ================================================================
   Maths helpers
   ================================================================ */
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const lerp2 = (p, q, t) => [lerp(p[0], q[0], t), lerp(p[1], q[1], t)];
const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const pr = (t, a, b) => clamp((t - a) / (b - a));
const ep = (t, a, b) => ease(pr(t, a, b));
const win = (t, a, b, f = .45) => Math.min(pr(t, a, a + f), 1 - pr(t, b - f, b));
const norm = v => { const l = Math.hypot(v[0], v[1]) || 1; return [v[0] / l, v[1] / l]; };
const add = (p, v, k = 1) => [p[0] + v[0] * k, p[1] + v[1] * k];
function ih(s) { let h = 2166136261 >>> 0; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  h ^= h >>> 13; h = Math.imul(h, 0x5bd1e995); h ^= h >>> 15; return h >>> 0; }
const hf = (...a) => ih(a.join('|')) / 4294967296;
function rng(seed) { let a = ih(String(seed)); return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a);
  t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function qb(p0, c, p1, t) { const u = 1 - t; return [u*u*p0[0] + 2*u*t*c[0] + t*t*p1[0], u*u*p0[1] + 2*u*t*c[1] + t*t*p1[1]]; }
function qbd(p0, c, p1, t) { return [2*(1-t)*(c[0]-p0[0]) + 2*t*(p1[0]-c[0]), 2*(1-t)*(c[1]-p0[1]) + 2*t*(p1[1]-c[1])]; }
function cb(p0, p1, p2, p3, t) { const u = 1 - t; return [u*u*u*p0[0] + 3*u*u*t*p1[0] + 3*u*t*t*p2[0] + t*t*t*p3[0],
  u*u*u*p0[1] + 3*u*u*t*p1[1] + 3*u*t*t*p2[1] + t*t*t*p3[1]]; }
function cbd(p0, p1, p2, p3, t) { const u = 1 - t; return [3*u*u*(p1[0]-p0[0]) + 6*u*t*(p2[0]-p1[0]) + 3*t*t*(p3[0]-p2[0]),
  3*u*u*(p1[1]-p0[1]) + 6*u*t*(p2[1]-p1[1]) + 3*t*t*(p3[1]-p2[1])]; }
function polyArea(p) { let a = 0; for (let i = 0; i < p.length; i++) { const q = p[i], r = p[(i + 1) % p.length]; a += q[0]*r[1] - r[0]*q[1]; } return Math.abs(a) / 2; }
function angLerp(a, b, t) { let d = ((b - a + Math.PI * 3) % (Math.PI * 2)) - Math.PI; return a + d * t; }

/* ================================================================
   Canvas set-up
   ================================================================ */
const cv = document.getElementById('cv');
const mctx = cv.getContext('2d');
const layer = document.createElement('canvas');
const lctx = layer.getContext('2d');
let DPR = 1;
let ctx = lctx;       // current drawing context
let SC = 1;           // current total scale (world unit -> CSS px)
let T = 0;            // current timeline time
let BOIL = 0;         // hand-redrawn outline state (from timeline time)
let SHOW_LABELS = true, SHOW_CAPS = true;
const scStack = [];
function push(x, y, s = 1, r = 0) { ctx.save(); ctx.translate(x, y); if (r) ctx.rotate(r); if (s !== 1) ctx.scale(s, s); scStack.push(SC); SC *= s; }
function pop() { ctx.restore(); SC = scStack.pop(); }
function camera(c) { push(CX, CY, c[2]); ctx.translate(-c[0], -c[1]); }
const endCamera = pop;
function camAt(t, keys) {
  if (t <= keys[0][0]) return keys[0].slice(1);
  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i], b = keys[i + 1];
    if (t <= b[0]) { const e = ease(pr(t, a[0], b[0]));
      return [lerp(a[1], b[1], e), lerp(a[2], b[2], e), Math.exp(lerp(Math.log(a[3]), Math.log(b[3]), e))]; }
  }
  return keys[keys.length - 1].slice(1);
}

/* ================================================================
   Paper and coloured-pencil textures (seeded, generated once)
   ================================================================ */
let paper = null;
function makePaper() {
  paper = document.createElement('canvas'); paper.width = W * DPR; paper.height = H * DPR;
  const g = paper.getContext('2d'); g.fillStyle = PAPER; g.fillRect(0, 0, paper.width, paper.height);
  const img = g.getImageData(0, 0, paper.width, paper.height), d = img.data, r = rng('paper');
  for (let i = 0; i < d.length; i += 4) { const n = (r() - .5) * 9; d[i] += n; d[i+1] += n; d[i+2] += n * .9; }
  g.putImageData(img, 0, 0);
  g.scale(DPR, DPR);
  for (let i = 0; i < 900; i++) {   // faint fibres
    const x = r() * W, y = r() * H, a = r() * Math.PI, l = 4 + r() * 12;
    g.strokeStyle = r() < .5 ? 'rgba(150,130,95,.07)' : 'rgba(255,255,255,.18)'; g.lineWidth = .6;
    g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + Math.cos(a) * l * .5 + (r() - .5) * 3, y + Math.sin(a) * l * .5 + (r() - .5) * 3, x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke();
  }
  const vg = g.createRadialGradient(W/2, H/2, H*.35, W/2, H/2, H*.95);   // very soft edge darkening of the sheet
  vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(120,100,60,.07)');
  g.fillStyle = vg; g.fillRect(0, 0, W, H);
}

const TEXDEF = {
  leaf:   { c:'#6E9B67', n:1250, a:[.30,.70], ang:-0.95, cross:.38 },
  leafY:  { c:'#C7A548', n:1000, a:[.30,.65], ang:-0.60, cross:.30 },
  stem:   { c:'#93AE77', n:900,  a:[.25,.55], ang:-1.20, cross:.20 },
  root:   { c:'#D9B470', n:950,  a:[.28,.62], ang:-0.75, cross:.28 },
  stele:  { c:'#C9A060', n:1050, a:[.25,.55], ang:-0.10, cross:.20 },
  cell:   { c:'#E2CB94', n:700,  a:[.22,.50], ang:-0.85, cross:.20 },
  amber:  { c:'#E5872A', n:1500, a:[.45,.85], ang:-0.80, cross:.50 },
  soil:   { c:'#B1946A', n:380,  a:[.16,.38], ang:-0.55, cross:.25 },
  grain:  { c:'#BFA27A', n:900,  a:[.20,.50], ang:-0.70, cross:.40 },
  decay:  { c:'#80603E', n:1300, a:[.30,.65], ang:-0.40, cross:.45 },
};
const TS = 240;
const TEX = {};
function makeTextures() {
  for (const [name, d] of Object.entries(TEXDEF)) {
    const c = document.createElement('canvas'); c.width = c.height = TS * 2;
    const g = c.getContext('2d'); g.scale(2, 2); g.lineCap = 'round'; g.strokeStyle = d.c;
    const r = rng('tex-' + name);
    const pass = (n, ang) => {
      for (let i = 0; i < n; i++) {
        const x = r() * TS, y = r() * TS, L = 4 + r() * 10, a = ang + (r() - .5) * .38;
        const al = d.a[0] + r() * (d.a[1] - d.a[0]), lw = .55 + r() * 1.0, bx = (r() - .5) * 1.6, by = (r() - .5) * 1.6;
        const dx = Math.cos(a) * L / 2, dy = Math.sin(a) * L / 2;
        g.globalAlpha = al; g.lineWidth = lw;
        for (const ox of [-TS, 0, TS]) for (const oy of [-TS, 0, TS]) {
          if (x + ox < -L || x + ox > TS + L || y + oy < -L || y + oy > TS + L) continue;
          g.beginPath(); g.moveTo(x - dx + ox, y - dy + oy); g.quadraticCurveTo(x + ox + bx, y + oy + by, x + dx + ox, y + dy + oy); g.stroke();
        }
      }
    };
    pass(d.n, d.ang); pass(Math.round(d.n * d.cross), d.ang + 1.3);
    TEX[name] = lctx.createPattern(c, 'repeat');
  }
}

/* ================================================================
   Sketch primitives
   ================================================================ */
function jit(pts, amp, p1, p2) {
  if (amp <= 0) return pts;
  const out = new Array(pts.length);
  for (let i = 0; i < pts.length; i++) { const p = pts[i];
    out[i] = [p[0] + amp * (Math.sin(i * .41 + p1) + .5 * Math.sin(i * 1.27 + p2)),
              p[1] + amp * (Math.cos(i * .37 + p2) + .5 * Math.sin(i * 1.09 + p1))]; }
  return out;
}
function tracePath(q, closed) {
  const n = q.length; ctx.beginPath(); if (n < 2) return;
  if (closed) {
    ctx.moveTo((q[n-1][0] + q[0][0]) / 2, (q[n-1][1] + q[0][1]) / 2);
    for (let i = 0; i < n; i++) { const a = q[i], b = q[(i + 1) % n]; ctx.quadraticCurveTo(a[0], a[1], (a[0] + b[0]) / 2, (a[1] + b[1]) / 2); }
    ctx.closePath();
  } else {
    ctx.moveTo(q[0][0], q[0][1]);
    for (let i = 1; i < n - 1; i++) { const a = q[i], b = q[i + 1]; ctx.quadraticCurveTo(a[0], a[1], (a[0] + b[0]) / 2, (a[1] + b[1]) / 2); }
    ctx.lineTo(q[n-1][0], q[n-1][1]);
  }
}
// Hand-drawn pen stroke. Outline wobble is chosen from one of three drawing states (BOIL),
// so the line looks redrawn by hand but never changes randomly from frame to frame.
function sk(pts, o = {}) {
  if (!pts || pts.length < 2) return;
  const id = o.id || 's'; let closed = !!o.closed; let P = pts;
  if (o.upto !== undefined) { if (o.upto <= 0.001) return; if (o.upto < 1) { P = pts.slice(0, Math.max(2, Math.ceil(pts.length * o.upto))); closed = false; } }
  const amp = (o.amp ?? .6) / SC;
  const p1 = hf(id, BOIL) * 6.283, p2 = hf(id, BOIL, 'q') * 6.283;
  const q = o.pre ? P : jit(P, amp, p1, p2);
  const ga = ctx.globalAlpha;
  ctx.strokeStyle = o.color || INK; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.lineWidth = (o.lw || 1.5) / SC;
  if (o.dash) ctx.setLineDash(o.dash.map(v => v / SC));
  ctx.globalAlpha = ga * (o.alpha ?? 1);
  tracePath(q, closed); ctx.stroke();
  ctx.setLineDash([]);
  if (o.dbl !== false && P.length > 8) {          // occasional overlapping sketch line
    const n = P.length, len = Math.floor(n * (closed ? .32 : .28));
    const s0 = Math.floor(hf(id, 'd') * (closed ? n : n * .6)); const seg = [];
    for (let k = 0; k < len; k++) seg.push(P[closed ? (s0 + k) % n : Math.min(n - 1, s0 + k)]);
    const q2 = jit(seg, amp * 1.5, p2 + 1.3, p1 + 2.1).map(p => [p[0] + .7 / SC, p[1] - .6 / SC]);
    ctx.globalAlpha = ga * (o.alpha ?? 1) * .33; ctx.lineWidth = (o.lw || 1.5) * .75 / SC;
    tracePath(q2, false); ctx.stroke();
  }
  ctx.globalAlpha = ga;
}
// Coloured-pencil fill: textured strokes (fixed seed) clipped to the shape; paper shows through.
function fillT(pts, tex, alpha = 1, wash) {
  if (alpha <= .002 || !pts || pts.length < 3) return;
  ctx.save(); ctx.globalAlpha *= alpha; tracePath(pts, true);
  if (wash) { ctx.fillStyle = wash; const g = ctx.globalAlpha; ctx.globalAlpha = g * .16; ctx.fill(); ctx.globalAlpha = g; }
  const p = TEX[tex]; p.setTransform(new DOMMatrix().scale(.5 / SC)); ctx.fillStyle = p; ctx.fill();
  ctx.restore();
}
function flat(pts, color, alpha = 1) { if (alpha <= .002) return; ctx.save(); ctx.globalAlpha *= alpha; ctx.fillStyle = color; tracePath(pts, true); ctx.fill(); ctx.restore(); }
function ellP(cx, cy, rx, ry, rot = 0, n = 44, wob = 0, seed = 'e', ph = 0) {
  const out = [], a1 = hf(seed, 1) * 6.28, a2 = hf(seed, 2) * 6.28, c = Math.cos(rot), s = Math.sin(rot);
  for (let i = 0; i < n; i++) { const t = i / n * Math.PI * 2;
    const w = 1 + wob * (Math.sin(3 * t + a1 + ph) * .6 + Math.sin(5 * t + a2 - ph * 1.3) * .4);
    const x = Math.cos(t) * rx * w, y = Math.sin(t) * ry * w; out.push([cx + x * c - y * s, cy + x * s + y * c]); }
  return out;
}
function line(a, b, n = 10) { const o = []; for (let i = 0; i <= n; i++) o.push(lerp2(a, b, i / n)); return o; }
function tube(Cf, Tf, Rf, n = 40, cap = true) {
  const L = [], R = [];
  for (let i = 0; i <= n; i++) { const s = i / n, c = Cf(s), t = norm(Tf(s)), r = Rf(s), nx = -t[1], ny = t[0];
    L.push([c[0] + nx * r, c[1] + ny * r]); R.push([c[0] - nx * r, c[1] - ny * r]); }
  const cp = [];
  if (cap) { const c = Cf(1), t = norm(Tf(1)), r = Rf(1), a0 = Math.atan2(t[0], -t[1]);
    for (let k = 1; k < 14; k++) { const a = a0 - Math.PI * k / 14; cp.push([c[0] + Math.cos(a) * r, c[1] + Math.sin(a) * r]); } }
  return { L, R, cap: cp, outline: [...L, ...cp, ...R.slice().reverse()] };
}
function wallWithGaps(pts, id, gaps, o = {}) {
  const amp = (o.amp ?? .35) / SC, q = jit(pts, amp, hf(id, BOIL) * 6.28, hf(id, BOIL, 'q') * 6.28);
  const segs = [[]];
  for (let i = 0; i < pts.length; i++) {
    const inGap = gaps.some(g => g.w > 0 && Math.hypot(pts[i][0] - g.p[0], pts[i][1] - g.p[1]) < g.w);
    if (inGap) { if (segs[segs.length - 1].length) segs.push([]); } else segs[segs.length - 1].push(q[i]);
  }
  for (const s of segs) if (s.length > 1) sk(s, { ...o, pre: true, dbl: false });
}

/* ---------------- screen-space annotations ---------------- */
function label(wp, off, text, a, o = {}) {
  if (!SHOW_LABELS || a <= .01) return;
  const p = ctx.getTransform().transformPoint(new DOMPoint(wp[0], wp[1]));
  const x = p.x / DPR, y = p.y / DPR, sv = SC;
  ctx.save(); ctx.setTransform(DPR, 0, 0, DPR, 0, 0); SC = 1; ctx.globalAlpha *= a;
  ctx.font = (o.size || 21) + 'px ' + FONT;
  const w = ctx.measureText(text).width;
  const align = off[0] < -5 ? 'right' : off[0] > 5 ? 'left' : 'center';
  let tx = x + off[0], ty = y + off[1];
  if (align === 'left') tx = clamp(tx, 14, W - 14 - w); else if (align === 'right') tx = clamp(tx, 14 + w, W - 14); else tx = clamp(tx, 14 + w / 2, W - 14 - w / 2);
  ty = clamp(ty, 24, SH - 14);
  if (!o.noLeader) {
    const sx = align === 'left' ? tx - 5 : align === 'right' ? tx + 5 : tx, sy = align === 'center' ? (ty > y ? ty - 19 : ty + 7) : ty - 7;
    const d = Math.hypot(x - sx, y - sy);
    if (d > 12) {
      const ex = x + (sx - x) / d * 4, ey = y + (sy - y) / d * 4;
      const mx = (sx + ex) / 2 + (ey - sy) * .12, my = (sy + ey) / 2 - (ex - sx) * .12;
      const pts = []; for (let i = 0; i <= 12; i++) pts.push(qb([sx, sy], [mx, my], [ex, ey], i / 12));
      sk(pts, { id: 'ld' + text, lw: 1.1, amp: .4, dbl: false, alpha: .85 });
      ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(ex, ey, 1.7, 0, 6.283); ctx.fill();
    }
  }
  ctx.textAlign = align; ctx.textBaseline = 'alphabetic'; ctx.lineJoin = 'round';
  ctx.strokeStyle = 'rgba(245,240,228,.88)'; ctx.lineWidth = 5; ctx.strokeText(text, tx, ty);
  ctx.fillStyle = INK; ctx.fillText(text, tx, ty);
  ctx.restore(); SC = sv;
}
function scaleBar(pxPer, unit, choices, a = 1) {
  if (a <= .01) return;
  const per = pxPer * SC; let v = choices.find(c => c * per >= 70) ?? choices[choices.length - 1];
  const L = v * per, sv = SC;
  ctx.save(); ctx.setTransform(DPR, 0, 0, DPR, 0, 0); SC = 1; ctx.globalAlpha *= a;
  const x0 = 34, y0 = SH - 22;
  sk(line([x0, y0], [x0 + L, y0], 12), { id: 'sb', lw: 2, amp: .3, dbl: false });
  sk(line([x0, y0 - 6], [x0, y0 + 6], 2), { id: 'sb1', lw: 1.6, amp: .2, dbl: false });
  sk(line([x0 + L, y0 - 6], [x0 + L, y0 + 6], 2), { id: 'sb2', lw: 1.6, amp: .2, dbl: false });
  const txt = unit === 'mm' && v >= 10 ? (v / 10) + ' cm' : v + ' ' + unit;
  ctx.font = '19px ' + FONT; ctx.fillStyle = INK; ctx.textAlign = 'center'; ctx.fillText(txt, x0 + L / 2, y0 - 9);
  ctx.restore(); SC = sv;
}
function nucleus(x, y, r, id, a = 1) {
  if (a <= .01) return;
  const pts = ellP(x, y, r, r * .92, 0, 18, .05, id);
  flat(pts, '#F6E7C6', .95 * a); sk(pts, { closed: true, id, lw: 1.1, amp: .25, dbl: false, alpha: a });
  ctx.save(); ctx.globalAlpha *= a; ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(x + r * .15, y - r * .1, r * .28, 0, 6.283); ctx.fill(); ctx.restore();
}

/* ================================================================
   Biological drawing functions
   ================================================================ */
// Zoospore: amber body, nucleus, two flagella of unequal length (short anterior, long posterior).
// Local frame: +x = direction of swimming. Base units are 6 px per µm (body ~3 µm).
function zoospore(x, y, ang, s, fl, t, id, o = {}) {
  push(x, y, s, ang);
  const rx = o.rx ?? 9, ry = o.ry ?? 6.5, a = o.alpha ?? 1;
  ctx.globalAlpha *= a;
  if (fl > .02) {
    const ins = [rx * .45, -ry * .62], beat = o.beat ?? 1, ph = hf(id, 'f') * 6.28;
    const Ll = 72 * fl, Ls = 24 * fl, pl = [], ps = [];
    for (let i = 0; i <= 30; i++) { const u = i / 30;
      pl.push([ins[0] - u * Ll, ins[1] - 2.5 * Math.sin(Math.min(1, u * 3) * Math.PI / 2) + u * 1.5 + 5.5 * u * Math.sin(u * 8.5 - t * 13 * beat + ph)]); }
    for (let i = 0; i <= 14; i++) { const u = i / 14;
      ps.push([ins[0] + u * Ls, ins[1] - u * 4 + 3.2 * u * Math.sin(u * 6.5 - t * 15 * beat + ph + 1)]); }
    sk(pl, { id: id + 'fL', lw: 1.15, amp: .25, dbl: false });
    sk(ps, { id: id + 'fS', lw: 1.15, amp: .25, dbl: false });
  }
  const body = ellP(0, 0, rx, ry, 0, 34, .045, id);
  fillT(body, 'amber', 1, '#E5872A');
  sk(body, { closed: true, id: id + 'b', lw: 1.5, amp: .35 });
  if (o.nuc !== false) nucleus(-rx * .1, ry * .05, Math.min(rx, ry) * .36, id + 'n', o.nucA ?? 1);
  pop();
}
// Thick-walled resting spore (double wall); optional opening for germination.
function restingSpore(x, y, r, id, o = {}) {
  const gap = o.gap || 0, gd = o.gapDir ?? Math.PI;
  const ring = (rr, n) => { const out = []; for (let i = 0; i <= n; i++) { const a = gd + gap / 2 + (Math.PI * 2 - gap) * i / n; out.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr]); } return out; };
  if (!o.empty) { fillT(ellP(x, y, r - 1, r - 1, 0, 24, .03, id), 'amber', o.fillA ?? 1, '#E5872A'); }
  if (gap > .01) { sk(ring(r, 30), { id: id + 'o', lw: 2.2, amp: .3, dbl: false }); sk(ring(r - 2.6, 26), { id: id + 'i', lw: 1, amp: .2, dbl: false, alpha: .6 }); }
  else { sk(ellP(x, y, r, r, 0, 26, .03, id), { closed: true, id: id + 'o', lw: 2.2, amp: .3 });
         sk(ellP(x, y, r - 2.6, r - 2.6, 0, 22, .03, id + 'x'), { closed: true, id: id + 'i', lw: 1, amp: .2, dbl: false, alpha: .6 }); }
}

/* ---------------- whole plant (scenes A and D) ---------------- */
const SOIL_Y = 250, PX_MM = 3.2;
const TAP = [[640, 250], [628, 360], [664, 440], [652, 528]];
const tapC = s => cb(...TAP, s), tapT = s => cbd(...TAP, s);
const tapR = (s, g) => lerp(8, 1.2, s) + (g > 0 ? g * 40 * Math.exp(-(((s - .42) / .17) ** 2)) * (1 + .12 * Math.sin(s * 40)) : 0);
const LATS = [
  { s: .16, sd: -1, len: 150, dr: 55, g: .6 }, { s: .27, sd: 1, len: 165, dr: 65, g: 0 },
  { s: .40, sd: -1, len: 185, dr: 85, g: 1 },  { s: .53, sd: 1, len: 200, dr: 75, g: .8, hairs: true },
  { s: .68, sd: -1, len: 140, dr: 60, g: .5 }, { s: .80, sd: 1, len: 110, dr: 45, g: 0 } ];
function latBez(L) { const p0 = tapC(L.s), p3 = [p0[0] + L.sd * L.len, p0[1] + L.dr], c = [p0[0] + L.sd * L.len * .45, p0[1] + L.dr * .05]; return [p0, c, p3]; }
const latC = (i, u) => qb(...latBez(LATS[i]), u);
const latR = (L, u, g) => lerp(3, .7, u) + (g > 0 ? g * L.g * 17 * Math.exp(-(((u - .38) / .2) ** 2)) * (1 + .15 * Math.sin(u * 40)) : 0);
const STEM_TOP = [640, 184];
const LEAVES = [ { a: -80, len: 140, w: 50 }, { a: 74, len: 148, w: 50 }, { a: -42, len: 170, w: 58 }, { a: 38, len: 172, w: 58 }, { a: -4, len: 158, w: 54 } ];

function drawSoil() {
  ctx.save(); ctx.globalAlpha *= .5; ctx.beginPath(); ctx.rect(-1500, SOIL_Y, 4300, 2500);
  const p = TEX.soil; p.setTransform(new DOMMatrix().scale(.5 / SC)); ctx.fillStyle = p; ctx.fill(); ctx.restore();
  const surf = []; for (let x = -400; x <= 1700; x += 10) surf.push([x, SOIL_Y + Math.sin(x * .05) * 1.5 + Math.sin(x * .013) * 2.5]);
  sk(surf, { id: 'soilline', lw: 1.6, amp: .5 });
  const r = rng('pebbles');
  for (let i = 0; i < 26; i++) {
    const x = 80 + r() * 1120, y = SOIL_Y + 30 + r() * 300, rx = 5 + r() * 9, ry = rx * (.5 + r() * .35);
    if (Math.abs(x - 650) < 60 && y < 540) continue;
    const pts = ellP(x, y, rx, ry, r() * 3, 18, .15, 'pb' + i);
    fillT(pts, 'grain', .8); sk(pts, { closed: true, id: 'pb' + i, lw: 1, amp: .3, alpha: .7, dbl: false });
  }
}
function drawPlant(o, t) {
  const g = o.g || 0, w = o.w || 0, dc = o.dc || 0;
  const dash = dc > .02 ? [lerp(60, 7, dc), lerp(0, 6, dc)] : null;
  // leaves and stem
  const stem = tube(s => lerp2([640, SOIL_Y + 2], STEM_TOP, s), () => [0, -1], s => lerp(5, 4, s), 10, false);
  fillT(stem.outline, 'stem', .9); sk(stem.L, { id: 'stemL', lw: 1.4 }); sk(stem.R, { id: 'stemR', lw: 1.4 });
  LEAVES.forEach((L, i) => {
    let a = L.a + (Math.abs(L.a) > 20 ? Math.sign(L.a) * w * 26 : w * 16);
    const len = L.len * (1 - .14 * w), rad = a * Math.PI / 180, dir = [Math.sin(rad), -Math.cos(rad)];
    const rx = len * .36, wid = L.w * (1 - .1 * w) / 2;
    const bc = [STEM_TOP[0] + dir[0] * len * .64, STEM_TOP[1] + dir[1] * len * .64 + w * len * .14];
    const ang = Math.atan2(bc[1] - STEM_TOP[1], bc[0] - STEM_TOP[0]), d2 = [Math.cos(ang), Math.sin(ang)];
    const blade = ellP(bc[0], bc[1], rx, wid, ang, 46, .055, 'leaf' + i);
    const b0 = add(bc, d2, -rx * .92), tip = add(bc, d2, rx * .98);
    sk([STEM_TOP, lerp2(STEM_TOP, b0, .5), b0], { id: 'pet' + i, lw: 1.5, dbl: false });
    fillT(blade, 'leaf', 1); if (w > .01) fillT(blade, 'leafY', w * .65);
    sk(blade, { closed: true, id: 'blade' + i, lw: 1.5 });
    const mid = []; for (let k = 0; k <= 12; k++) { const u = k / 12; const p = lerp2(b0, tip, u); mid.push(add(p, [-d2[1], d2[0]], Math.sin(u * Math.PI) * 3)); }
    sk(mid, { id: 'mid' + i, lw: 1.1, amp: .3, dbl: false, alpha: .85 });
    for (const f of [.3, .5, .7]) for (const sd of [-1, 1]) {
      const p = lerp2(b0, tip, f), n = [-d2[1] * sd, d2[0] * sd], e = add(add(p, d2, rx * .32), n, wid * .72);
      sk(line(p, e, 5), { id: 'v' + i + f + sd, lw: .9, amp: .3, dbl: false, alpha: .6 });
    }
  });
  // lateral roots
  LATS.forEach((L, i) => {
    const bz = latBez(L), C = u => qb(...bz, u), Tn = u => qbd(...bz, u);
    const tb = tube(C, Tn, u => latR(L, u, g), 30);
    fillT(tb.outline, 'root', 1); if (dc > 0 && L.g > 0) fillT(tb.outline, 'decay', dc * .8 * L.g);
    sk(tb.outline, { id: 'lat' + i, lw: 1.25, amp: .45, dash: L.g > 0 ? dash : null });
    for (const u of [.35, .62, .82]) {
      const p = C(u), t2 = norm(Tn(u)), sd = (u === .62 ? -1 : 1) * L.sd;
      const e = [p[0] + t2[0] * 18 - t2[1] * 22 * sd, p[1] + t2[1] * 18 + 16 + Math.abs(t2[0]) * 10];
      sk([p, lerp2(p, e, .5).map((v, k) => v + (k ? 3 : 0)), e], { id: 'sub' + i + u, lw: 1, amp: .3, dbl: false, alpha: .85 });
    }
    if (L.hairs && o.hairs) {
      const r = rng('hairs' + i);
      for (let k = 0; k < 46; k++) { const u = .52 + (k / 46) * .42, p = C(u), t2 = norm(Tn(u)), sd = k % 2 ? 1 : -1;
        const n = [-t2[1] * sd, t2[0] * sd], rr = latR(L, u, 0), len = 6 + r() * 6;
        const a = add(p, n, rr), b = add(add(a, n, len), t2, (r() - .5) * 3);
        sk([a, lerp2(a, b, .5), b], { id: 'rh' + k, lw: .8, amp: .15, dbl: false, alpha: .85 }); }
    }
  });
  // taproot
  const tp = tube(tapC, tapT, s => tapR(s, g), 70);
  fillT(tp.outline, 'root', 1); if (dc > 0) fillT(tp.outline, 'decay', dc * .8);
  sk(tp.L, { id: 'tapL', lw: 1.5, dash }); sk([...tp.cap, ...tp.R.slice().reverse()], { id: 'tapR', lw: 1.5, dash });
  if (g > .2) for (let k = 0; k < 6; k++) { // knobbly gall texture lines
    const s = .3 + k * .045, c = tapC(s), r0 = tapR(s, g) * .6, a = hf('gk', k) * 6;
    sk(ellP(c[0] + Math.cos(a) * r0 * .5, c[1], r0 * .35, r0 * .18, a, 12, .1, 'gk' + k), { id: 'gk' + k, lw: .9, alpha: .45 * (1 - dc), dbl: false, upto: .7 });
  }
}

/* ================================================================
   SCENE A — whole plant, zoom to the root-hair zone (0–9.5 s)
   ================================================================ */
const RHZ = latC(3, .74);
function sceneA(t) {
  camera(camAt(t, [[0, 640, 286, 1], [4.2, 640, 286, 1], [9.5, RHZ[0], RHZ[1] - 4, 6.5]]));
  drawSoil(); drawPlant({ hairs: true }, t);
  const lb = LEAVES[3], rad = lb.a * Math.PI / 180;
  label([STEM_TOP[0] + Math.sin(rad) * lb.len * .7, STEM_TOP[1] - Math.cos(rad) * lb.len * .7], [120, -30], 'brassica host (e.g. cabbage, canola)', win(t, .6, 4.6));
  label([380, 300], [0, 0], 'soil', win(t, 1, 4.6), { noLeader: true });
  label(tapC(.62), [-150, 50], 'taproot', win(t, 1.4, 4.6));
  label(latC(3, .6), [110, 65], 'root-hair zone', win(t, 3.4, 8.8));
  scaleBar(PX_MM, 'mm', [.1, .2, .5, 1, 2, 5, 10, 20, 50]);
  endCamera();
  const ta = 1 - pr(t, 3.8, 4.8);
  if (ta > 0) { ctx.save(); ctx.globalAlpha *= ta; ctx.fillStyle = INK; ctx.textAlign = 'left';
    ctx.font = '46px ' + FONT; ctx.fillText('Clubroot of brassicas', 44, 64);
    ctx.font = '23px ' + FONT; ctx.fillText('the life cycle of Plasmodiophora brassicae', 46, 96);
    const ul = []; for (let x = 44; x <= 420; x += 12) ul.push([x, 76 + Math.sin(x * .07) * 1.2]); sk(ul, { id: 'ul', lw: 1.6, amp: .5 });
    ctx.restore(); }
}

/* ================================================================
   SCENE B — soil, root hair, primary infection (8–60 s). 6 px = 1 µm.
   ================================================================ */
const RH = { p0: [360, 30], c: [385, 330], p1: [745, 470], r: 30 };
const rhC = s => qb(RH.p0, RH.c, RH.p1, s), rhT = s => norm(qbd(RH.p0, RH.c, RH.p1, s));
const rhNL = s => { const t = rhT(s); return [-t[1], t[0]]; };
const HT = tube(rhC, rhT, () => RH.r, 240);
const S_CON = .55, Ccon = rhC(S_CON), NL = rhNL(S_CON), NR = [-NL[0], -NL[1]], TAN = rhT(S_CON);
const PCON = add(Ccon, NR, RH.r);                // point of entry on the root-hair wall
const ZA = add(PCON, NR, 11);                     // cyst centre
const HEAD_IN = Math.atan2(-NR[1], -NR[0]);       // facing the wall
const S_P2 = .61, P2 = add(rhC(S_P2), rhNL(S_P2), RH.r);   // discharge pore (opposite side)
const SPORES = [[920, 352], [949, 333], [977, 357], [953, 382], [992, 330], [1007, 374], [932, 403], [978, 405]];
const ZE = [890, 352];
const ZPATH = [ZE, [790, 445], [650, 205], ZA];
const GRAINS = [[150, 250, 55, 38], [105, 470, 70, 42], [260, 562, 55, 30], [560, 568, 48, 30], [790, 150, 52, 34], [1010, 150, 60, 40],
  [1185, 262, 58, 44], [1150, 520, 75, 46], [960, 560, 50, 28], [850, 585, 40, 22], [1250, 420, 45, 30], [620, 96, 38, 26], [1100, 380, 26, 18], [230, 360, 30, 20]];
const PLASMO_S = .5075, SPOR_S = [.44, .485, .53, .575];
const NU3 = [[-.72, -.3], [-.5, .32], [-.28, -.28], [-.06, .3], [.14, -.32], [.36, .28], [.56, -.3], [.74, .3]];
const mean = a => [a.reduce((s, p) => s + p[0], 0) / a.length, a.reduce((s, p) => s + p[1], 0) / a.length];
const NUG = [[[0, 0]], [mean(NU3.slice(0, 4)), mean(NU3.slice(4))], [0, 1, 2, 3].map(i => mean(NU3.slice(i * 2, i * 2 + 2))), NU3];
const NT = [46.4, 47.7, 49.0];
function nucleiNorm(t) {
  let nodes = NUG[0];
  for (let L = 1; L <= 3; L++) { const p = ep(t, NT[L - 1], NT[L - 1] + .7); if (p <= 0) break;
    nodes = NUG[L].map((c, i) => lerp2(NUG[L - 1][Math.floor(i / 2)], c, p)); }
  return nodes;
}
const toFrame = (c, th, rx, ry, uv) => { const x = uv[0] * rx, y = uv[1] * ry; return [c[0] + x * Math.cos(th) - y * Math.sin(th), c[1] + x * Math.sin(th) + y * Math.cos(th)]; };

function sceneB(t) {
  // camera: fixed moves, except that it follows the swimming zoospore between 18.6 and 27.5 s
  let cam;
  if (t > 18.6 && t < 27.5) {
    const e = ep(t, 18.6, 20.4), zc = cb(...ZPATH, ep(t, 19.4, 27.5));
    cam = [lerp(870, zc[0] - 25 * (1 - pr(t, 25, 27.5)), e), lerp(350, zc[1], e), lerp(1.9, 2.6, ep(t, 18.6, 27.5))];
  } else cam = camAt(t, [[8, 660, 300, .95], [12.2, 690, 312, .95], [15.5, 880, 350, 1.6], [18.6, 870, 350, 1.9],
    [27.5, ZA[0], ZA[1], 2.6], [31, ZA[0] - 6, ZA[1] + 4, 4.2], [34.5, PCON[0], PCON[1] + 2, 6.2], [43.6, PCON[0] - 3, PCON[1] + 5, 6.2],
    [48, 520, 300, 1.7], [52, 520, 312, 1.75], [56, 500, 322, 1.55], [60, 470, 340, 1.2]]);
  camera(cam);
  // soil grains
  GRAINS.forEach((g, i) => { const pts = ellP(g[0], g[1], g[2], g[3], hf('gr', i) * 3, 30, .16, 'gr' + i);
    fillT(pts, 'grain', .75); sk(pts, { closed: true, id: 'gr' + i, lw: 1.1, alpha: .7 }); });
  for (let i = 0; i < 40; i++) { const x = hf('sg', i) * 1400 - 60, y = 60 + hf('sg', i, 'y') * 560, r = 2 + hf('sg', i, 'r') * 4;
    if (Math.hypot(x - 620, y - 330) < 230 || Math.hypot(x - 960, y - 365) < 90) continue;
    sk(ellP(x, y, r, r * .7, i, 10, .2, 'sg' + i), { closed: true, id: 'sg' + i, lw: .9, alpha: .55, dbl: false }); }

  // epidermis + root hair (one continuous cell)
  const epi = [[-400, -220], [1700, -220], [1700, 30], [-400, 30]];
  fillT(epi, 'cell', 1); fillT(HT.outline, 'cell', 1);
  const wallL = line([-400, 30], HT.L[0], 60), wallR = line(HT.R[0], [1700, 30], 120);
  sk(wallL, { id: 'eoL', lw: 1.9, amp: .4 }); sk(wallR, { id: 'eoR', lw: 1.9, amp: .4 });
  [-260, -120, 20, 160, 290, 430, 570, 705, 840, 980, 1120, 1260, 1400].forEach((x, i) => sk(line([x, 30], [x + 6, -220], 12), { id: 'ew' + i, lw: 1.4, amp: .4 }));
  sk(line([-400, -150], [1700, -150], 90), { id: 'ein', lw: 1.3, amp: .4, alpha: .8 });
  // root-hair wall: continuous, apart from the entry pore (and later the discharge pore)
  const poreW = 3.4 * ep(t, 37.7, 38.2), pore2W = 3 * ep(t, 56.3, 56.7);
  wallWithGaps(HT.outline, 'rhwall', [{ p: PCON, w: poreW }, { p: P2, w: pore2W }], { lw: 1.9, amp: .35 });

  // root exudates
  const exA = win(t, 12, 19.5, 1);
  if (exA > 0) for (let i = 0; i < 16; i++) { const s = .18 + (i % 8) * .1, sd = i < 8 ? 1 : -1, base = add(rhC(s), sd > 0 ? NR : NL, 0);
    const n = (() => { const nl = rhNL(s); return sd > 0 ? [-nl[0], -nl[1]] : nl; })();
    for (let k = 0; k < 3; k++) { const d = ((t - 12) * 16 + hf('ex', i, k) * 120) % 120, p = add(base, n, RH.r + 6 + d);
      ctx.save(); ctx.globalAlpha *= exA * (1 - d / 120) * .8; ctx.fillStyle = '#6F9B6A'; ctx.beginPath(); ctx.arc(p[0], p[1], 2.4, 0, 6.283); ctx.fill(); ctx.restore(); } }

  // resting spores
  const gap = .9 * ep(t, 15.4, 16.6);
  SPORES.forEach((p, i) => { if (i === 0) restingSpore(p[0], p[1], 12, 'sp0', { gap, gapDir: Math.PI, empty: t > 17.6, fillA: 1 - pr(t, 16.8, 17.6) });
    else restingSpore(p[0], p[1], 12, 'sp' + i); });

  // ---- primary zoospore ----
  const sw = ep(t, 19.4, 27.5);
  let zp, head, fl = 1, beat = 1, rx = 9, ry = 6.5, zs = 1, show = t >= 16.6;
  if (t < 19.4) { const e = ep(t, 16.6, 18.8); zp = lerp2(SPORES[0], ZE, e); head = Math.PI + Math.sin(t * 3) * .1; zs = lerp(.55, 1, e); fl = ep(t, 17.6, 19.4); }
  else if (t < 27.5) { zp = cb(...ZPATH, sw); const d = cbd(...ZPATH, Math.max(.001, sw)); head = Math.atan2(d[1], d[0]) + Math.sin(t * 5.5) * .12;
    const perp = [-Math.sin(head), Math.cos(head)]; zp = add(zp, perp, 2 * Math.sin(t * 7) * (1 - pr(t, 26.5, 27.5))); }
  else { zp = ZA; const d = cbd(...ZPATH, 1); head = angLerp(Math.atan2(d[1], d[0]), HEAD_IN, ep(t, 27.5, 28.6));
    fl = 1 - ep(t, 28.6, 31); beat = lerp(1, .4, pr(t, 28.6, 31)); const e = ep(t, 31, 33); rx = lerp(9, 8, e); ry = lerp(6.5, 8, e); }
  // cyst wall, Rohr, Stachel and injection
  const inj = ep(t, 39.8, 43.6);                 // fraction of parasite contents transferred
  const cystWall = ep(t, 31.3, 33.6);
  if (t >= 31.3) { const ring = ellP(ZA[0], ZA[1], 10.6, 10.6, 0, 40, .03, 'cyst');
    sk(ring, { id: 'cystw', lw: 2.1, amp: .3, upto: cystWall, closed: true }); }
  if (show) {
    const bodyR = Math.sqrt(1 - inj);
    if (t < 39.8) zoospore(zp[0], zp[1], head, zs, fl, t, 'z1', { rx, ry, beat });
    else if (bodyR > .02) zoospore(ZA[0], ZA[1], HEAD_IN, 1, 0, t, 'z1', { rx: 8 * bodyR, ry: 8 * bodyR, nuc: inj < .45, nucA: 1 - pr(inj, .3, .45) });
  }
  // Rohr (tube) and Stachel (stylet) inside the cyst
  if (t > 34.5 && t < 42) {
    push(ZA[0], ZA[1], 1, HEAD_IN);
    const ra = 1 - pr(t, 41, 42), rl = ep(t, 34.5, 35.8);
    ctx.globalAlpha *= ra;
    sk(line([-4, -1.8], [-4 + 13 * rl, -1.8], 6), { id: 'rohr1', lw: 1.1, amp: .15, dbl: false });
    sk(line([-4, 1.8], [-4 + 13 * rl, 1.8], 6), { id: 'rohr2', lw: 1.1, amp: .15, dbl: false });
    const xs = lerp(3, 14, ep(t, 36.3, 38.3)) - 9 * ep(t, 40.3, 41.6);
    if (t > 36) { sk(line([-2.5, 0], [xs - 2, 0], 6), { id: 'stachel', lw: 1.4, amp: .1, dbl: false });
      ctx.fillStyle = INK; ctx.beginPath(); ctx.moveTo(xs, 0); ctx.lineTo(xs - 3, -1.1); ctx.lineTo(xs - 3, 1.1); ctx.closePath(); ctx.fill(); }
    pop();
  }
  // injected contents through the pore
  const B0 = add(PCON, NR, -11);
  if (inj > 0 && inj < 1) { ctx.save(); ctx.strokeStyle = '#E5872A'; ctx.lineCap = 'round'; ctx.globalAlpha *= .85 * Math.sin(inj * Math.PI) ** .5;
    ctx.lineWidth = 2.6; ctx.beginPath(); ctx.moveTo(ZA[0], ZA[1]); ctx.lineTo(B0[0], B0[1]); ctx.stroke(); ctx.restore(); }
  // ---- primary plasmodium inside the root hair ----
  const grow = ep(t, 44.5, 50), PC = lerp2(B0, rhC(PLASMO_S), ep(t, 44.5, 49)), th = Math.atan2(TAN[1], TAN[0]);
  const prx = lerp(8 * Math.sqrt(inj), 58, grow), pry = lerp(8 * Math.sqrt(inj), 21, grow);
  const cleave = ep(t, 50.8, 52.6);
  if (inj > 0 && cleave < 1) {
    const blob = ellP(PC[0], PC[1], prx, pry, th, 46, lerp(.03, .085, grow), 'plas', t * .9);
    fillT(blob, 'amber', 1 - cleave, '#E5872A'); sk(blob, { closed: true, id: 'plasO', lw: 1.5, amp: .35, alpha: 1 - cleave });
  }
  // nuclei: one injected nucleus divides 1 → 2 → 4 → 8
  const sporC = SPOR_S.map(s => rhC(s));
  const relA = 1 - ep(t, 54.8, 55.8);
  if (inj > .45) {
    const nn = nucleiNorm(t);
    nn.forEach((uv, i) => {
      let p = inj < 1 ? lerp2(ZA, B0, pr(inj, .45, .7)) : toFrame(PC, th, prx, pry, uv);
      if (nn.length === 8 && cleave > 0) { const k = Math.floor(i / 2), q = toFrame(sporC[k], th, 1, 1, [0, i % 2 ? 7 : -7]);
        p = lerp2(toFrame(PC, th, prx, pry, uv), q, cleave); }
      nucleus(p[0], p[1], 3.1, 'nu' + i, relA);
    });
  }
  // zoosporangia → secondary zoospores
  if (cleave > 0) SPOR_S.forEach((s, k) => {
    const c = rhC(s), pts = ellP(c[0], c[1], 16.5, 21, th, 30, .05, 'spg' + k);
    fillT(pts, 'amber', cleave * .55, '#E5872A'); sk(pts, { closed: true, id: 'spg' + k, lw: 1.3, amp: .3, upto: cleave });
    const form = ep(t, 55, 56.5);
    if (form > 0) for (let j = 0; j < 4; j++) {
      const loc = [[-6, -8], [6, -8], [-6, 8], [6, 8]][j], start = toFrame(c, th, 1, 1, loc);
      const id = 'sz' + k + j;
      if (k === 3) {      // these four are released through the discharge pore
        const t0 = 56.6 + j * .45, m1 = ep(t, t0, t0 + .7), m2 = ep(t, t0 + .7, t0 + 3.4);
        if (m1 <= 0) { zoospore(start[0], start[1], th, .55 * form, 0, t, id, { rx: 8, ry: 7, nucA: .8 }); }
        else { const out = add(add(P2, rhNL(S_P2), 150 + j * 18), TAN, -60 + j * 38);
          const p = m2 <= 0 ? lerp2(start, P2, m1) : cb(P2, add(P2, rhNL(S_P2), 40), lerp2(P2, out, .6), out, m2);
          const dir = m2 <= 0 ? norm([P2[0] - start[0], P2[1] - start[1]]) : norm(cbd(P2, add(P2, rhNL(S_P2), 40), lerp2(P2, out, .6), out, Math.max(.01, m2)));
          zoospore(p[0], p[1], Math.atan2(dir[1], dir[0]) + Math.sin(t * 6 + j) * .1, lerp(.55, .9, m1), ep(t, t0 + .8, t0 + 1.6) * .85, t, id, { rx: lerp(8, 9, m1), ry: lerp(7, 6.5, m1) }); }
      } else zoospore(start[0], start[1], th, .55 * form, 0, t, id, { rx: 8, ry: 7, nucA: .8 });
    }
  });

  // labels
  label([700, 18], [70, 44], 'root epidermis', win(t, 9.2, 18.5));
  label(add(rhC(.3), NL, RH.r), [-150, 40], 'root hair (part of one epidermal cell)', win(t, 9.2, 21));
  label([970, 392], [70, 85], 'resting spores', win(t, 9.4, 17.5));
  label(add(rhC(.78), NR, RH.r + 34), [60, -70], 'root exudates', win(t, 13, 19));
  if (show && t < 27.4) label(zp, [40, -70], 'primary zoospore', win(t, 18, 27.4));
  if (t > 20.5 && t < 27.4) { const fp = toFrame(zp, head, 1, 1, [-45, 0]); label(fp, [-40, 70], 'two flagella, unequal length', win(t, 20.5, 26.8)); }
  label(add(PCON, TAN, 30), [70, 52], 'host cell wall', win(t, 28.2, 44.6));
  label(ZA, [55, -62], 'zoospore attaches', win(t, 28, 31.2));
  label(add(ZA, NR, 10), [45, -60], 'cyst wall forms', win(t, 31.6, 35));
  label(ZA, [80, -40], 'Rohr (tube) + Stachel (stylet)', win(t, 35.2, 39.6));
  label(add(PCON, NR, -3), [-120, 80], 'tiny pore: the only break in the wall', win(t, 38.3, 44.6));
  label(add(ZA, NR, 10), [60, -50], 'empty cyst', win(t, 43, 48.5));
  label(PC, [-60, 110], 'primary plasmodium', win(t, 45.4, 50.6));
  if (t > 46.8 && t < 50.6) label(toFrame(PC, th, prx, pry, [.36, .28]), [70, 80], 'nuclei dividing', win(t, 46.8, 50.6));
  label(rhC(SPOR_S[1]), [-140, 120], 'zoosporangia', win(t, 51.4, 56.4));
  label(add(P2, rhNL(S_P2), 70), [-60, 90], 'secondary zoospores released', win(t, 57, 60));
  scaleBar(6, 'µm', [1, 2, 5, 10, 20, 50]);
  endCamera();
}

/* ================================================================
   SCENE C — root tissue: cortical infection and gall formation (58.5–92 s). 1.6 px = 1 µm
   ================================================================ */
const ROWY = [228, 276, 334, 392, 450];
const VOFF = 3, VI0 = -3, VI1 = 18;   // vertex columns extend beyond the view so the tissue fills the frame
const VV = (() => { const r = rng('grid'), v = [];
  for (let i = VI0; i <= VI1; i++) { v[i + VOFF] = []; for (let j = 0; j <= 4; j++) {
    const x = 40 + i * 80 + (r() - .5) * 24;
    const y = ROWY[j] + (j === 0 ? (r() - .5) * 6 : j === 4 ? (r() - .5) * 4 : (r() - .5) * 15);
    v[i + VOFF][j] = [x, y]; } } return v; })();
const Vg = (i, j) => VV[i + VOFF][j];
let K1 = 0, K2 = 0;
function def(p) {
  const x = p[0], y = p[1], h = clamp((450 - y) / 222), d = x - 660;
  const gN = Math.exp(-((d / 200) ** 2)), gB = Math.exp(-((d / 400) ** 2));
  const sy = 1 + .55 * K1 * gN + .35 * K2 * gB;
  const A = (55 * K1 + 45 * K2) * h;
  return [x + A * Math.tanh(d / 140), 450 - (450 - y) * sy];
}
const bil = (i, j, u, v) => { const a = Vg(i, j), b = Vg(i + 1, j), c = Vg(i + 1, j + 1), d = Vg(i, j + 1);
  return [(1 - v) * ((1 - u) * a[0] + u * b[0]) + v * ((1 - u) * d[0] + u * c[0]), (1 - v) * ((1 - u) * a[1] + u * b[1]) + v * ((1 - u) * d[1] + u * c[1])]; };
const cellPt = (i, j, u, v) => def(bil(i, j, u, v));
function cellPoly(i, j, dfm = true) { const out = [], n = 6;
  for (let k = 0; k < n; k++) out.push([k / n, 0]); for (let k = 0; k < n; k++) out.push([1, k / n]);
  for (let k = 0; k < n; k++) out.push([1 - k / n, 1]); for (let k = 0; k < n; k++) out.push([0, 1 - k / n]);
  return out.map(([u, v]) => dfm ? cellPt(i, j, u, v) : bil(i, j, u, v)); }
const HB = lerp2(Vg(2, 0), Vg(3, 0), .5);
const hairBez = [HB, [HB[0] - 8, HB[1] - 180], [HB[0] + 50, HB[1] - 520]];
const HC = s => qb(...hairBez, s), HTn = s => qbd(...hairBez, s);
const HAIR2 = tube(HC, HTn, () => 8, 50);
const ZS = .267;   // zoospore drawing scale in this scene (1.6 px per µm vs 6 px per µm)
const SECZ = [{ i: 6, t0: 60.0 }, { i: 7, t0: 60.5 }, { i: 9, t0: 61.0 }].map(z => {
  const top = lerp2(Vg(z.i, 0), Vg(z.i + 1, 0), .5), c = add(top, [0, -3.2]);
  const hn = norm(HTn(.2)), st = add(HC(.2), [hn[1], -hn[0]], 9);
  return { ...z, top, c, st, path: [st, add(st, [70, -10]), add(c, [-30, -70]), c] };
});
const INFECT = [[6, 0, 65.5], [7, 0, 66.0], [9, 0, 66.5], [6, 1, 67.0], [7, 1, 67.4], [8, 1, 67.8], [9, 1, 68.2], [7, 2, 68.8], [8, 2, 69.3], [6, 2, 69.8]];
const DIVS = [[4, 1, 'v', 77.2], [10, 1, 'v', 77.55], [5, 2, 'h', 77.9], [9, 2, 'v', 78.25], [4, 3, 'v', 78.6], [10, 3, 'h', 78.95], [5, 0, 'v', 79.3],
  [8, 0, 'v', 79.65], [6, 3, 'v', 80.0], [7, 3, 'v', 80.35], [8, 3, 'h', 80.7], [3, 2, 'v', 81.05], [11, 2, 'v', 81.4], [5, 1, 'h', 81.75],
  [10, 0, 'v', 82.1], [9, 3, 'v', 82.45], [4, 2, 'h', 82.8], [11, 1, 'h', 83.15], [3, 1, 'v', 83.5], [12, 2, 'v', 83.85]];
const SPOREPTS = (() => { const out = [], r = rng('rs');
  for (let a = 0; a < 9; a++) for (let b = 0; b < 9; b++) { const u = .1 + a * .1 + (b % 2) * .05, v = .1 + b * .1;
    if (((u - .5) / .41) ** 2 + ((v - .5) / .4) ** 2 < 1) out.push([u + (r() - .5) * .04, v + (r() - .5) * .04, r()]); }
  return out.sort((p, q) => p[2] - q[2]); })();
const AREA0 = polyArea(cellPoly(7, 1, false));

function sceneC(t) {
  K1 = ep(t, 71, 77.5); K2 = ep(t, 77, 84.2);
  camera(camAt(t, [[58.5, 470, 205, 1.7], [64, 520, 215, 1.75], [66.4, 560, 235, 1.6], [70.6, 640, 290, 1], [92, 640, 290, 1]]));
  // stele (vascular tissue, root centre)
  const stele = [[-300, 452], [1600, 452], [1600, 760], [-300, 760]];
  fillT(stele, 'stele', .9);
  for (const y of [474, 498, 522, 546, 570]) sk(line([-300, y + hf('st', y) * 4], [1600, y], 70), { id: 'stl' + y, lw: 1, amp: .4, alpha: .55 });
  for (let k = 0; k < 9; k++) { const x = 70 + k * 150 + hf('sv', k) * 40, y = [452, 474, 498, 522, 546][k % 5];
    sk(line([x, y], [x + 2, y + 24], 4), { id: 'stv' + k, lw: .9, amp: .3, alpha: .5, dbl: false }); }
  // epidermis + cortex cells
  for (let i = VI0; i < VI1; i++) for (let j = 0; j < 4; j++) fillT(cellPoly(i, j), 'cell', j === 0 ? 1 : .85);
  // root hair (continuous with its epidermal cell), moves with the tissue
  const hb = def(HB), sh = [hb[0] - HB[0], hb[1] - HB[1]], hairO = HAIR2.outline.map(p => add(p, sh));
  fillT(hairO, 'cell', 1); sk(hairO, { id: 'hair2', lw: 1.5, amp: .35 });
  [.12, .2, .28].forEach((s, k) => { const c = add(HC(s), sh), th = Math.atan2(HTn(s)[1], HTn(s)[0]);
    sk(ellP(c[0], c[1], 6.5, 5.5, th, 16, .06, 'es' + k), { closed: true, id: 'es' + k, lw: .9, alpha: .7, dbl: false }); });
  // walls: horizontal boundaries as continuous lines, then radial walls
  for (let j = 0; j <= 4; j++) { const pts = []; for (let i = VI0; i < VI1; i++) for (let k = 0; k < 6; k++) pts.push(def(lerp2(Vg(i, j), Vg(i + 1, j), k / 6))); pts.push(def(Vg(VI1, j)));
    if (j === 0) wallWithGaps(pts, 'hw0', [{ p: hb, w: 9 }], { lw: 1.9, amp: .35 }); else sk(pts, { id: 'hw' + j, lw: j === 4 ? 1.5 : 1.3, amp: .35 }); }
  for (let i = VI0; i <= VI1; i++) for (let j = 0; j < 4; j++) { const pts = []; for (let k = 0; k <= 6; k++) pts.push(def(lerp2(Vg(i, j), Vg(i, j + 1), k / 6))); sk(pts, { id: 'vw' + i + '_' + j, lw: 1.25, amp: .35, dbl: false }); }
  // new cell walls (hyperplasia)
  let ndiv = 0, lastDiv = null;
  DIVS.forEach(([i, j, o, td]) => { const p = ep(t, td, td + .7); if (p <= 0) return; if (p >= 1) ndiv++; lastDiv = [i, j];
    const pts = []; for (let k = 0; k <= 8; k++) { const s = .06 + .88 * k / 8; pts.push(o === 'v' ? cellPt(i, j, .5 + (hf('dv', i, j) - .5) * .12, s) : cellPt(i, j, s, .5 + (hf('dv', i, j) - .5) * .12)); }
    sk(pts, { id: 'dw' + i + j, lw: 1.2, amp: .3, upto: p, dbl: false }); });
  // secondary plasmodia and resting spores in infected cells
  const toSp = ep(t, 84.4, 87);
  INFECT.forEach(([i, j, t0], idx) => {
    const g = ep(t, t0, t0 + 2.2); if (g <= 0) return;
    const id = 'sp2' + idx, a1 = hf(id, 1) * 6.28;
    const pts = []; for (let k = 0; k < 36; k++) { const th = k / 36 * 6.283, w = 1 + .07 * Math.sin(3 * th + a1 + t * .8) + .05 * Math.sin(5 * th - t * .6);
      pts.push(cellPt(i, j, .5 + Math.cos(th) * .4 * g * w, .5 + Math.sin(th) * .37 * g * w)); }
    if (toSp < 1) { fillT(pts, 'amber', 1 - toSp, '#E5872A'); sk(pts, { closed: true, id, lw: 1.2, amp: .3, alpha: 1 - toSp });
      for (let k = 0; k < 5; k++) { const p = cellPt(i, j, .5 + (hf(id, 'n', k) - .5) * .5 * g, .5 + (hf(id, 'm', k) - .5) * .45 * g);
        nucleus(p[0], p[1], 2.1, id + 'n' + k, (1 - toSp) * g); } }
    if (t > 84.2) { const nAp = Math.floor(SPOREPTS.length * ep(t, 84.2 + idx * .12, 88.6 + idx * .12));
      for (let k = 0; k < nAp; k++) { const [u, v] = SPOREPTS[k], p = cellPt(i, j, u, v);
        const sp = ellP(p[0], p[1], 3.3, 3.3, 0, 10, .05, 'rs' + idx + k); flat(sp, '#E8892A', .8);
        sk(sp, { closed: true, id: 'rs' + idx + '_' + k, lw: .9, amp: .15, dbl: false }); } }
  });
  // secondary zoospores swim from the root hair and infect the root
  SECZ.forEach((z, k) => {
    const t0 = z.t0, sw = ep(t, t0, t0 + 3.4), tA = t0 + 3.4, inj = ep(t, tA + 1.5, tA + 2.3);
    if (t < t0 || t > tA + 6) return;
    if (t >= tA + .9) { sk(ellP(z.c[0], z.c[1], 2.8, 2.8, 0, 14, .03, 'cy' + k), { closed: true, id: 'cy' + k, lw: 1.2, amp: .15, dbl: false, upto: ep(t, tA + .9, tA + 1.4), alpha: 1 - pr(t, tA + 4, tA + 6) }); }
    if (inj >= 1) return;
    const st = add(z.st, sh);
    if (t < tA) { const pth = [st, ...z.path.slice(1)], p = cb(...pth, sw), d = cbd(...pth, Math.max(.01, sw));
      zoospore(p[0], p[1], Math.atan2(d[1], d[0]) + Math.sin(t * 6 + k) * .12, ZS, ep(t, t0, t0 + .5), t, 'cz' + k, { nuc: false }); }
    else { const e = ep(t, tA + .9, tA + 1.4), r = Math.sqrt(1 - inj);
      zoospore(z.c[0], z.c[1], Math.PI / 2, ZS, 1 - ep(t, tA, tA + .9), t, 'cz' + k, { rx: lerp(9, 8, e) * r, ry: lerp(6.5, 8, e) * r, nuc: false, beat: .5 }); }
  });
  // labels
  label(add(HC(.24), sh), [70, -20], 'infected root hair', win(t, 59.2, 65));
  if (t < 63.4) { const z = SECZ[0], p = cb(add(z.st, sh), ...z.path.slice(1), ep(t, z.t0, z.t0 + 3.4)); label(p, [80, 40], 'secondary zoospores', win(t, 61.2, 63.4)); }
  label(cellPt(3, 0, .5, .5), [-60, -90], 'epidermis', win(t, 60, 70));
  label(cellPt(2, 2, .5, .5), [60, 95], 'root cortex', win(t, 62, 76));
  label(cellPt(7, 1, .5, .55), [190, 130], 'secondary plasmodia', win(t, 67.6, 76));
  label([1000, 530], [0, 0], 'vascular tissue (centre of root)', win(t, 66.5, 90), { noLeader: true, size: 19 });
  label(cellPt(7, 1, .62, .4), [230, -20], 'hypertrophy: infected cells enlarge', win(t, 71.6, 77.6));
  if (lastDiv && t > 77.6) label(cellPt(...lastDiv, .5, .5), [-120, 90], 'hyperplasia: extra cell divisions', win(t, 77.6, 84.2));
  label(cellPt(5, 0, .5, 0), [-210, -40], 'root surface bulges: the gall', win(t, 80.5, 86));
  label(cellPt(8, 2, .5, .5), [250, 70], 'new resting spores', win(t, 85, 91));
  // counter: cell number and size
  const ca = win(t, 70.8, 91, .6);
  if (ca > .01) { ctx.save(); const sv = SC; ctx.setTransform(DPR, 0, 0, DPR, 0, 0); SC = 1; ctx.globalAlpha *= ca;
    const bx = 958, by = 16, bw = 300, bh = 78;
    const box = [...line([bx, by], [bx + bw, by], 20), ...line([bx + bw, by], [bx + bw, by + bh], 6), ...line([bx + bw, by + bh], [bx, by + bh], 20), ...line([bx, by + bh], [bx, by], 6)];
    flat(box, PAPER, .8); sk(box, { closed: true, id: 'cbox', lw: 1.3, amp: .5 });
    const ratio = polyArea(cellPoly(7, 1)) / AREA0;
    ctx.fillStyle = INK; ctx.font = '21px ' + FONT; ctx.textAlign = 'left';
    ctx.fillText('cells in this section:  ' + (60 + ndiv), bx + 14, by + 31);
    ctx.fillText('one infected cell, area:  ×' + ratio.toFixed(1), bx + 14, by + 62);
    ctx.restore(); SC = sv; }
  scaleBar(1.6, 'µm', [5, 10, 20, 50, 100, 200]);
  endCamera();
}

/* ================================================================
   SCENE D — whole plant with galls, decay, return to soil (90.5–104 s)
   ================================================================ */
const SPDOTS = (() => { const r = rng('dots'), out = [];
  for (let i = 0; i < 170; i++) { let o, rr;
    if (i < 120) { const s = .28 + r() * .3, c = tapC(s), t2 = norm(tapT(s)); rr = tapR(s, 1) * (r() * 1.6 - .8); o = add(c, [-t2[1], t2[0]], rr); }
    else { const u = .2 + r() * .4, L = LATS[2], c = latC(2, u); o = add(c, [0, 1], latR(L, u, 1) * (r() * 1.6 - .8)); }
    const a = r() * 6.283; out.push({ o, d: [Math.cos(a), Math.sin(a) * .8 + .25], k: 18 + r() * 75, r: r() }); }
  return out; })();
function sceneD(t) {
  const gp = tapC(.42);
  camera(camAt(t, [[90.5, gp[0], gp[1], 3.1], [95, 640, 292, 1.12], [104, 640, 292, 1.12]]));
  const w = ep(t, 91, 96), dc = ep(t, 96.5, 102.5);
  drawSoil(); drawPlant({ g: 1, w, dc, hairs: false }, t);
  if (dc > 0) SPDOTS.forEach((s, i) => { const p = add(s.o, s.d, s.k * dc), a = Math.min(1, dc * 3 - s.r);
    if (a <= 0) return; ctx.save(); ctx.globalAlpha *= a; ctx.fillStyle = '#E5872A'; ctx.strokeStyle = INK; ctx.lineWidth = .7 / SC;
    ctx.beginPath(); ctx.arc(p[0], p[1], 2.1 / SC * Math.sqrt(SC), 0, 6.283); ctx.fill(); ctx.stroke(); ctx.restore(); });
  label(add(gp, [1, 0], tapR(.42, 1)), [190, 10], 'clubroot galls', win(t, 91.6, 100));
  const lb = LEAVES[3], rad = (lb.a + w * 26) * Math.PI / 180;
  label([STEM_TOP[0] + Math.sin(rad) * lb.len * .6, STEM_TOP[1] - Math.cos(rad) * lb.len * .6 + w * 22], [140, -20], 'wilting, stunted, yellowing shoot', win(t, 92.6, 101));
  label(tapC(.5), [-200, 40], 'galls rot', win(t, 96.6, 104.5));
  label(add(SPDOTS[5].o, SPDOTS[5].d, SPDOTS[5].k), [170, 120], 'resting spores return to the soil (dots enlarged)', win(t, 98, 104.5));
  scaleBar(PX_MM, 'mm', [.1, .2, .5, 1, 2, 5, 10, 20, 50]);
  endCamera();
}

/* ================================================================
   Timeline: scenes, captions, chapters
   ================================================================ */
const SCENES = [
  { a: 0, b: 9.5, f: sceneA }, { a: 8, b: 60, f: sceneB }, { a: 58.5, b: 92, f: sceneC }, { a: 90.5, b: DUR + 1, f: sceneD } ];
const XF = 1.5;
const CAPS = [
  [0, 4.6, 'Clubroot is caused by Plasmodiophora brassicae, a soil-borne protist that can only grow inside the living roots of brassicas.'],
  [4.6, 9, 'Infection starts in the root-hair zone, so we zoom in from the whole plant to a single root hair.'],
  [9, 13, 'In soil, the pathogen survives as thick-walled resting spores, each only 3–5 µm across.'],
  [13, 17, 'Chemicals released by the growing root (root exudates) can trigger the resting spores to germinate.'],
  [17, 21.2, 'Each resting spore releases one primary zoospore, which has two flagella of unequal length.'],
  [21.2, 27.5, 'The zoospore swims through the film of soil water towards a root hair.'],
  [27.5, 31.2, 'It attaches to the root-hair wall and withdraws its flagella.'],
  [31.2, 34.5, 'It then encysts: a new wall forms around it.'],
  [34.5, 39.6, 'Inside the cyst a tube (Rohr) forms, and a pointed stylet (Stachel) punctures the host cell wall.'],
  [39.6, 45, "The parasite's contents are injected through this tiny pore. The rest of the cell wall stays intact."],
  [45, 50.6, 'Inside the root hair it grows into a primary plasmodium: a mass of cytoplasm whose nuclei divide repeatedly.'],
  [50.6, 55, 'The plasmodium then cleaves into a cluster of zoosporangia.'],
  [55, 60, 'Each zoosporangium produces secondary zoospores, which are released and go on to infect the root cortex.'],
  [60, 66, 'Secondary zoospores attach to the root and inject their contents into its cells.'],
  [66, 71, 'Secondary plasmodia develop and spread into the inner root cortex.'],
  [71, 77.4, 'The pathogen alters the plant’s hormone balance (auxin and cytokinin). Infected cells enlarge greatly: hypertrophy.'],
  [77.4, 84.2, 'Nearby cells divide more often: hyperplasia. More cells and bigger cells together make the root swell into a gall.'],
  [84.2, 90.5, 'Each secondary plasmodium then cleaves into many new resting spores, which pack the swollen cells.'],
  [90.5, 96.3, 'The roots become club-shaped galls. Water and nutrient uptake is disrupted, so the shoot wilts and is stunted.'],
  [96.3, 106, 'As the galls rot, resting spores return to the soil, where they can survive for many years and infect future brassica crops.'] ];
const CHAPTERS = [[0, 'Host plant'], [9, 'Resting spores'], [17, 'Primary zoospore'], [27.5, 'Attachment & encystment'], [34.5, 'Penetration'],
  [45, 'Root-hair stage'], [59.2, 'Cortical infection'], [71, 'Gall formation'], [84.2, 'New resting spores'], [90.5, 'Symptoms & soil']];
const chapterAt = t => { let k = 0; CHAPTERS.forEach((c, i) => { if (t >= c[0] - 1e-6) k = i; }); return k; };

/* ================================================================
   Sound effects: small synthesised clips (Web Audio API, no audio files).
   Each sound is tied to a timeline event, so the same list drives live playback
   and the offline soundtrack export. Sounds play only while the timeline runs
   forwards; scrubbing and chapter jumps are silent.
   ================================================================ */
const SFX = (() => { const ev = [], add = (t, type, p = {}) => ev.push({ t, type, ...p });
  add(4.4, 'whoosh');                                                                  // zoom to the root-hair zone
  add(12.2, 'swell');                                                                  // root exudates spread
  add(15.5, 'crack', { v: .55 }); add(16.7, 'pop', { f: 480, v: .5 });                // spore wall opens, zoospore emerges
  add(19.5, 'whoosh', { v: .5 });                                                      // zoospore starts swimming
  add(27.5, 'plip', { f: 820 });                                                       // attaches to the root hair
  add(28.7, 'sweep', { f0: 900, f1: 420, d: 2.2, v: .5 });                             // flagella withdrawn
  add(31.4, 'note', { f: 392 }); add(32.4, 'note', { f: 523 });                        // cyst wall forms
  add(34.6, 'tick', { f: 1100 });                                                      // Rohr forms
  add(37.7, 'crack', { v: .9 });                                                       // Stachel punctures the wall
  add(39.9, 'sweep', { f0: 620, f1: 260, d: 3.4, v: .55 });                            // contents injected
  NT.forEach((t, k) => add(t + .55, 'note', { f: [523, 659, 784][k] }));               // nuclei divide 1→2→4→8
  add(50.9, 'swell');                                                                  // cleavage into zoosporangia
  [55.1, 55.4, 55.7, 56.0].forEach((t, k) => add(t, 'glint', { f: 1500 + k * 120 })); // secondary zoospores form
  add(56.35, 'crack', { v: .45 });                                                     // discharge pore opens
  [0, 1, 2, 3].forEach(j => add(57.3 + j * .45, 'plip', { f: 900 + j * 70 }));         // zoospores released
  add(58.6, 'whoosh');                                                                 // move to the root tissue
  SECZ.forEach((z, k) => { add(z.t0 + 3.4, 'plip', { f: 760 + k * 60 });               // secondary zoospores attach
    add(z.t0 + 4.9, 'pop', { f: 380 + k * 30, v: .45 }); });                            // and inject
  INFECT.forEach(([i, j, t0], k) => { if (j > 0) add(t0 + .1, 'glint', { f: 900 + k * 45 }); }); // plasmodia spread
  add(71.1, 'sweep', { f0: 180, f1: 260, d: 5.5, v: .7 });                             // hypertrophy: cells enlarge
  DIVS.forEach(([i, j, o, td], k) => add(td + .7, 'tick', { f: 1150 + (k % 5) * 90 })); // hyperplasia: new walls
  for (let k = 0; k < 14; k++) add(84.4 + k * .3, 'fizz', { f: 1300 + hf('rsf', k) * 900 }); // resting spores form
  add(90.6, 'whoosh');                                                                 // back to the whole plant
  add(91.2, 'sweep', { f0: 330, f1: 196, d: 3.5, v: .5 });                             // shoot wilts
  add(96.6, 'crack', { v: .7 });                                                       // galls rot
  for (let k = 0; k < 10; k++) add(97.2 + k * .38, 'fizz', { f: 900 + hf('rel', k) * 700 }); // spores return to soil
  add(101.8, 'chord', { notes: [262, 311, 392] });                                     // closing
  return ev.sort((a, b) => a.t - b.t); })();
const noiseBufs = new WeakMap();
function noiseBuf(ac) { if (noiseBufs.has(ac)) return noiseBufs.get(ac);
  const b = ac.createBuffer(1, ac.sampleRate, ac.sampleRate), d = b.getChannelData(0), r = rng('noise');
  for (let i = 0; i < d.length; i++) d[i] = r() * 2 - 1; noiseBufs.set(ac, b); return b; }
function envGain(ac, out, at, peak, a, d) { const g = ac.createGain(); g.gain.setValueAtTime(0.0001, at);
  g.gain.exponentialRampToValueAtTime(peak, at + a); g.gain.exponentialRampToValueAtTime(0.0001, at + a + d); g.connect(out); return g; }
function tone(ac, out, at, type, f0, f1, peak, a, d) { const o = ac.createOscillator(); o.type = type;
  o.frequency.setValueAtTime(f0, at); if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(f1, at + a + d);
  o.connect(envGain(ac, out, at, peak, a, d)); o.start(at); o.stop(at + a + d + .05); }
function noise(ac, out, at, kind, f0, f1, q, peak, a, d) { const s = ac.createBufferSource(); s.buffer = noiseBuf(ac);
  const bq = ac.createBiquadFilter(); bq.type = kind; bq.Q.value = q; bq.frequency.setValueAtTime(f0, at);
  if (f1 !== f0) bq.frequency.exponentialRampToValueAtTime(f1, at + a + d);
  s.connect(bq); bq.connect(envGain(ac, out, at, peak, a, d)); s.start(at, hf('n', at) * .5); s.stop(at + a + d + .05); }
function playSfx(ac, out, e, at) {
  const v = e.v ?? 1;
  switch (e.type) {
    case 'pop':    tone(ac, out, at, 'sine', e.f, e.f * .6, .45 * v, .006, .18); break;
    case 'plip':   tone(ac, out, at, 'sine', e.f * 1.25, e.f * .8, .3, .004, .1); break;
    case 'tick':   tone(ac, out, at, 'triangle', e.f, e.f, .16, .002, .05); break;
    case 'swell':  noise(ac, out, at, 'bandpass', 500, 1100, 1.2, .12, .6, 1.2); break;
    case 'whoosh': noise(ac, out, at, 'bandpass', 300, 2400, 1.5, .28 * v, .25, .55); break;
    case 'sweep':  tone(ac, out, at, 'sine', e.f0, e.f1, .13 * v, .15, e.d); break;
    case 'fizz':   tone(ac, out, at, 'sine', e.f, e.f * 1.15, .07, .003, .05); break;
    case 'crack':  noise(ac, out, at, 'highpass', 1800, 1800, .7, .22 * v, .002, .07);
                   tone(ac, out, at, 'sine', 150, 90, .3 * v, .004, .16); break;
    case 'note':   tone(ac, out, at, 'sine', e.f, e.f, .16, .01, .35); break;
    case 'pulse':  tone(ac, out, at, 'sine', 330, 470, .18, .03, .35); break;
    case 'chime':  tone(ac, out, at, 'sine', 880, 880, .14, .005, 1.2); tone(ac, out, at + .02, 'sine', 1320, 1320, .08, .005, 1.0); break;
    case 'glint':  tone(ac, out, at, 'sine', e.f, e.f, .06, .003, .12); break;
    case 'chord':  (e.notes || [392, 494, 587]).forEach((f, k) => tone(ac, out, at + k * .06, 'sine', f, f, .15, .35, 2.4)); break;
  }
}
let AC = null, MASTER = null, SOUND_ON = false;
function ensureAudio() {   // browsers allow audio only after a click or key press
  try { if (!AC) { AC = new (window.AudioContext || window.webkitAudioContext)(); MASTER = AC.createGain(); MASTER.gain.value = .8; MASTER.connect(AC.destination); }
    if (AC.state === 'suspended') AC.resume(); } catch (e) { AC = null; }
}
function sfxBetween(t0, t1) {
  if (!SOUND_ON || !AC || AC.state !== 'running' || t1 <= t0 || t1 - t0 > .25) return;
  for (const e of SFX) if (e.t > t0 && e.t <= t1) playSfx(AC, MASTER, e, AC.currentTime + .02);
}
// Offline export of the full soundtrack (used to add sound to the MP4 render), returned as WAV bytes in base64.
async function renderSoundtrack(rate = 48000) {
  const oc = new OfflineAudioContext(2, Math.ceil(rate * (DUR + 1)), rate), m = oc.createGain(); m.gain.value = .8; m.connect(oc.destination);
  SFX.forEach(e => playSfx(oc, m, e, e.t));
  const buf = await oc.startRendering(), n = buf.length, L = buf.getChannelData(0), Rr = buf.getChannelData(1);
  const ab = new ArrayBuffer(44 + n * 4), dv = new DataView(ab), w = (o, s) => { for (let i = 0; i < s.length; i++) dv.setUint8(o + i, s.charCodeAt(i)); };
  w(0, 'RIFF'); dv.setUint32(4, 36 + n * 4, true); w(8, 'WAVEfmt '); dv.setUint32(16, 16, true); dv.setUint16(20, 1, true); dv.setUint16(22, 2, true);
  dv.setUint32(24, rate, true); dv.setUint32(28, rate * 4, true); dv.setUint16(32, 4, true); dv.setUint16(34, 16, true); w(36, 'data'); dv.setUint32(40, n * 4, true);
  for (let i = 0; i < n; i++) { dv.setInt16(44 + i * 4, clamp(L[i], -1, 1) * 32767, true); dv.setInt16(46 + i * 4, clamp(Rr[i], -1, 1) * 32767, true); }
  let s = ''; const u8 = new Uint8Array(ab); for (let i = 0; i < u8.length; i += 32768) s += String.fromCharCode.apply(null, u8.subarray(i, i + 32768)); return btoa(s);
}


function wrap(text, maxW) { const words = text.split(' '), lines = []; let cur = '';
  for (const w of words) { const test = cur ? cur + ' ' + w : w; if (ctx.measureText(test).width > maxW && cur) { lines.push(cur); cur = w; } else cur = test; }
  if (cur) lines.push(cur); return lines; }
function drawBand(t) {
  sk((() => { const o = []; for (let x = 24; x <= W - 24; x += 14) o.push([x, SH + 2 + Math.sin(x * .03) * .8]); return o; })(), { id: 'band', lw: 1.3, amp: .5, alpha: .7 });
  const ci = chapterAt(t);
  ctx.save(); ctx.fillStyle = INK; ctx.globalAlpha = .75; ctx.font = '18px ' + FONT; ctx.textAlign = 'left';
  ctx.fillText((ci + 1) + ' / ' + CHAPTERS.length + '  ·  ' + CHAPTERS[ci][1], 28, SH + 26);
  ctx.textAlign = 'right'; ctx.fillText('not to scale between views · scale bar applies to each view', W - 28, SH + 26);
  ctx.restore();
  if (!SHOW_CAPS) return;
  ctx.save(); ctx.font = '27px ' + FONT; ctx.fillStyle = INK; ctx.textAlign = 'center';
  for (const [a, b, text] of CAPS) {
    const al = Math.min(pr(t, a - .01, a + .35), 1 - pr(t, b - .3, b)); if (al <= .01 && !(t >= DUR - .01 && b > DUR)) continue;
    ctx.globalAlpha = t >= DUR - .01 && b > DUR ? 1 : al;
    const lines = wrap(text, 1120), lh = 33, y0 = SH + 68 - (lines.length - 1) * lh / 2 + 6;
    lines.forEach((l, i) => ctx.fillText(l, W / 2, y0 + i * lh));
  }
  ctx.restore();
}

/* ================================================================
   Deterministic render
   ================================================================ */
function renderAtTime(s) {
  T = clamp(+s || 0, 0, DUR);
  BOIL = REDUCED ? 0 : Math.floor(T * 4) % 3;
  mctx.setTransform(1, 0, 0, 1, 0, 0); mctx.globalAlpha = 1; mctx.drawImage(paper, 0, 0);
  for (let k = 0; k < SCENES.length; k++) {
    const sc = SCENES[k]; if (T < sc.a || T > sc.b) continue;
    const a = Math.min(k === 0 ? 1 : pr(T, sc.a, sc.a + XF), k === SCENES.length - 1 ? 1 : 1 - pr(T, sc.b - XF, sc.b));
    if (a <= .001) continue;
    lctx.setTransform(1, 0, 0, 1, 0, 0); lctx.clearRect(0, 0, layer.width, layer.height);
    ctx = lctx; ctx.setTransform(DPR, 0, 0, DPR, 0, 0); ctx.globalAlpha = 1; SC = 1; scStack.length = 0;
    ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, SH); ctx.clip(); sc.f(T); ctx.restore();
    mctx.globalAlpha = a; mctx.drawImage(layer, 0, 0); mctx.globalAlpha = 1;
  }
  ctx = mctx; ctx.setTransform(DPR, 0, 0, DPR, 0, 0); SC = 1; drawBand(T);
  ctx = lctx;
  syncUI();
}

/* ================================================================
   Playback controls
   ================================================================ */
const playBtn = document.getElementById('play');
let playing = !REDUCED, inView = true, frameId = 0, last = null, lastDraw = 0;
let avgMs = 0, slowN = 0;
function syncUI() {
  playBtn.setAttribute('aria-label', playing ? 'Pause animation' : 'Play animation');
  playBtn.setAttribute('title', playing ? 'Pause animation' : 'Play animation');
  playBtn.dataset.playing = String(playing);
}
function requestFrame() {
  if (!frameId && playing && inView && !document.hidden) frameId = requestAnimationFrame(frame);
}
function setPlaying(value) {
  playing = value;
  last = null;
  syncUI();
  if (playing) requestFrame();
  else { cancelAnimationFrame(frameId); frameId = 0; }
}
playBtn.addEventListener('click', () => setPlaying(!playing));
cv.addEventListener('click', () => setPlaying(!playing));
function frame(now) {
  frameId = 0;
  if (!playing || !inView || document.hidden) { last = null; return; }
  if (!lastDraw || now - lastDraw >= 1000 / 30) {
    if (last !== null) {
      const dt = Math.min(.15, (now - last) / 1000);
      const startRender = performance.now();
      renderAtTime((T + dt) % DUR);
      avgMs = avgMs * .9 + (performance.now() - startRender) * .1;
      if (avgMs > 30 && DPR > 1) {
        if (++slowN > 30) { setup(Math.max(1, DPR - .5)); renderAtTime(T); slowN = 0; avgMs = 0; }
      } else slowN = 0;
    }
    last = now;
    lastDraw = now;
  }
  requestFrame();
}
function setup(density) {
  // Render at the displayed pixel density without oversampling small screens.
  DPR = density || Math.min(2, Math.max(1, cv.clientWidth / W * (window.devicePixelRatio || 1)));
  cv.width = W * DPR; cv.height = H * DPR;
  layer.width = W * DPR; layer.height = H * DPR;
  makePaper();
}
setup(); makeTextures();
window.renderAtTime = renderAtTime;
window.clubroot = {
  renderAtTime, duration: DUR,
  play: () => setPlaying(true), pause: () => setPlaying(false)
};
renderAtTime(0);
const start = () => { renderAtTime(T); requestFrame(); };
if (document.fonts && document.fonts.load) {
  Promise.race([document.fonts.load("27px 'Patrick Hand'"), new Promise(resolve => setTimeout(resolve, 1500))]).then(start, start);
} else start();
function updateActivity() {
  last = null; lastDraw = 0;
  if (document.hidden || !inView) { cancelAnimationFrame(frameId); frameId = 0; }
  else requestFrame();
}
document.addEventListener('visibilitychange', updateActivity);
if ('IntersectionObserver' in window) {
  new IntersectionObserver(entries => {
    inView = entries[0].isIntersecting;
    updateActivity();
  }, {threshold:0}).observe(cv);
}
const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
if (motion.addEventListener) motion.addEventListener('change', event => {
  if (event.matches) setPlaying(false);
});
let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => { setup(); renderAtTime(T); }, 150);
}, {passive:true});
})();
