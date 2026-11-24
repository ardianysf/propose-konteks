// The Mill of Babbage's Analytical Engine, for the 1843 era of the Konteks landing page.
// Three columns of brass figure wheels between cast-iron frame plates, three crown gears
// meshing on top, and Ada's operation cards — punched, stacked — feeding in at the front.
//   node build.mjs  → babbage.svg (+ babbage.html)
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as k from "../../kit/iso-kit.mjs";
import * as a from "../../kit/asset.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const PAPER = "#FBF6E6";
const W = 560, H = 560;
const AZ = 58, EL = 32;

let P;
const at = (p) => k.iso(p, P);
const S = (paths, style) => k.solidSvg(paths, style);
const L = (d, style) => k.lineSvg(d, style);
const D = (pts, style) => k.dotsSvg(pts, style);
const depth = ([x, y, z = 0]) => k.depthOf([x, y, z], P);
const byDepth = (items, key = (i) => i) => [...items].sort((p, q) => depth(key(p)) - depth(key(q)));
const brass = (s) => `<g class="ac-brass">${s}</g>`;
const iron = (s) => `<g class="ac-iron">${s}</g>`;
const card = (s) => `<g class="ac-card">${s}</g>`;
const SCREW = 0.55;
const screws = (pts, z, ring = 1.3) => L(pts.map(([x, y]) => k.ring(x, y, ring, z, P, 14)).join(""), { tone: "lo" }) + D(pts.map(([x, y]) => at([x, y, z])), { size: SCREW });

// ---------- world ----------
const BASE = { x: -62, y: -34, w: 124, d: 92, r: 4 };      // the bed, cards sit on its front
const Z_FOOT = 0, Z_BED = 5, Z_BEDTOP = 12;
const FRAME = { x: -54, y: -26, w: 108, d: 40, r: 5 };      // lower and upper plates
const Z_LOW = Z_BEDTOP, Z_LOWTOP = Z_LOW + 4;
const Z_UP = 98, Z_UPTOP = Z_UP + 4;
const COLS = [-34, 0, 34].map((x) => [x, -6]);
const WHEEL_R = 12.5, WHEEL_H = 3.4, GAP = 10.6, N_WHEELS = 7;
const GEAR_R = 16.4;                                            // tips touch the neighbour's: 2 × 16.4 ≈ 34 − clearance
const PILLARS = [[FRAME.x + 6, FRAME.y + 6], [FRAME.x + FRAME.w - 6, FRAME.y + 6], [FRAME.x + 6, FRAME.y + FRAME.d - 6], [FRAME.x + FRAME.w - 6, FRAME.y + FRAME.d - 6]];

function feet() {
  const out = [];
  for (const [x, y] of byDepth(k.corners(BASE, 9))) out.push(iron(S(k.cylinder(x, y, 5, Z_FOOT, Z_BED - Z_FOOT, P, 20, 0.4), { tone: "lo" })));
  return out.join("");
}

function bed() {
  const out = [`<path class="iso-halo" d="${k.haloOf(k.insetPlan(BASE, -6), 0, 4, P)}"/>`, feet()];
  out.push(iron(S(k.slabOf(BASE, Z_BED, Z_BEDTOP - Z_BED, P, 5, 1.2), { tone: "mid", inner: L(k.sideSeam(BASE, Z_BED + 2.4, P, 5), { tone: "faint" }) })));
  out.push(L(k.planOutline(k.insetPlan(BASE, 4), Z_BEDTOP, P, 4), { tone: "faint" }));
  out.push(screws(k.corners(BASE, 4.5), Z_BEDTOP));
  // lower frame plate
  out.push(iron(S(k.slabOf(FRAME, Z_LOW, Z_LOWTOP - Z_LOW, P, 5, 0.8), { tone: "mid" })));
  return out.join("");
}

// One column: a collar between every wheel, each wheel knurled with its ten figures.
function column([x, y]) {
  const out = [];
  let z = Z_LOWTOP;
  out.push(iron(S(k.cylinder(x, y, 5, z, 3, P, 28, 0.4), { tone: "mid" })));
  z += 3;
  for (let i = 0; i < N_WHEELS; i++) {
    const z0 = z + 1.6;
    out.push(S(k.cylinder(x, y, 2.4, z, z0 - z + 0.2, P, 16), { tone: "lo" }));
    const figs = k.knurl(x, y, WHEEL_R, z0 + 0.5, z0 + WHEEL_H - 0.5, 30, P, 0.2);
    out.push(brass(S(k.cylinder(x, y, WHEEL_R, z0, WHEEL_H, P, 56, 0.6), { tone: "hi", crease: "lo", inner: L(figs, { tone: "lo" }) })));
    out.push(L(k.ring(x, y, WHEEL_R - 3, z0 + WHEEL_H, P, 40), { tone: "faint" }));
    out.push(brass(S(k.cylinder(x, y, 3.2, z0 + WHEEL_H, 0.6, P, 18), { tone: "mid" })));
    z = z0 + WHEEL_H + 0.6;
    if (i === N_WHEELS - 1) break;
    z += GAP - WHEEL_H - 2.2;
  }
  out.push(S(k.cylinder(x, y, 2.4, z, Z_UP - z, P, 16), { tone: "lo" }));
  return out.join("");
}

function pillar([x, y]) {
  const bands = [Z_LOWTOP + 6, Z_UP - 6].map((zz) => k.sideArc(x, y, 3, zz, P, 20)).join("");
  return iron(
    S(k.cylinder(x, y, 4.2, Z_LOWTOP, 4, P, 24, 0.4), { tone: "mid" }) +
    S(k.cylinder(x, y, 3, Z_LOWTOP + 4, Z_UP - Z_LOWTOP - 8, P, 24), { tone: "mid", inner: L(bands, { tone: "faint" }) }) +
    S(k.cylinder(x, y, 4.2, Z_UP - 4, 4, P, 24, 0.4), { tone: "mid" }));
}

function upper() {
  const out = [iron(S(k.slabOf(FRAME, Z_UP, Z_UPTOP - Z_UP, P, 5, 0.8), { tone: "hi", inner: L(k.sideSeam(FRAME, Z_UP + 1.6, P, 5), { tone: "faint" }) }))];
  out.push(screws(PILLARS, Z_UPTOP, 1.6));
  return out.join("");
}

// A crown gear: a static brass drum with a toothed top that turns in its plane.
const teeth = (n, r0, r1) => {
  const pts = [];
  for (let i = 0; i < n; i++) {
    const t = (i / n) * Math.PI * 2, s = (Math.PI * 2) / n;
    for (const [dt, r] of [[0, r0], [s * 0.18, r1], [s * 0.5, r1], [s * 0.68, r0]]) pts.push([Math.cos(t + dt) * r, Math.sin(t + dt) * r]);
  }
  return `M${pts.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join("L")}Z`;
};
const flatStyle = (fill, edge) => `fill:var(--anatomy-${fill});stroke:var(--anatomy-${edge});stroke-width:var(--anatomy-weight);vector-effect:non-scaling-stroke;stroke-linejoin:round`;
function gear([x, y], reverse, phase) {
  const z = Z_UPTOP, th = 3.2, R0 = GEAR_R - 2.6;
  const d = teeth(18, R0, GEAR_R);
  const opts = { period: 9000, reverse, delay: phase };
  const out = [];
  out.push(S(k.cylinder(x, y, 6, z, 1.2, P, 28, 0.3), { tone: "mid" }));
  out.push(brass(a.amSpin(`<path d="${d}" style="${flatStyle("shade-1", "mid")}"/>`, a.topPlane([x, y, z + 1.2], P), opts)));
  out.push(brass(S(k.cylinder(x, y, R0, z + 1.2, th, P, 56), { tone: "hi", crease: "lo" })));
  out.push(brass(a.amSpin(`<path d="${d}" style="${flatStyle("top", "hi")}"/>` +
    `<circle r="${(R0 - 4).toFixed(2)}" style="fill:none;stroke:var(--anatomy-faint);stroke-width:var(--anatomy-weight);vector-effect:non-scaling-stroke"/>` +
    [0, 1, 2, 3, 4, 5].map((i) => { const t = i * Math.PI / 3; return `<circle cx="${(Math.cos(t) * 7).toFixed(2)}" cy="${(Math.sin(t) * 7).toFixed(2)}" r="1.5" style="${flatStyle("shade-0", "lo")}"/>`; }).join(""),
    a.topPlane([x, y, z + 1.2 + th], P), opts)));
  out.push(iron(S(k.cylinder(x, y, 3.4, z + 1.2 + th, 2.6, P, 24, 0.4), { tone: "mid" })));
  out.push(D([at([x, y, z + 1.2 + th + 2.6])], { size: SCREW, tone: "hi" }));
  return out.join("");
}

// Ada's operation cards: a punched stack on a little reader tray, the top card feeding in.
const CARD = { w: 46, d: 16, r: 1.2 };
const TRAY = { x: -40, y: 22, w: 54, d: 24, r: 2.4 };
function holes(cx, cy, z, pattern) {
  const pts = [];
  pattern.forEach((row, ri) => [...row].forEach((ch, ci) => { if (ch === "1") pts.push([cx + 4 + ci * 3.4, cy + 3.4 + ri * 3.2]); }));
  return L(pts.map(([x, y]) => k.ring(x, y, 0.9, z, P, 10)).join(""), { tone: "lo" });
}
const PATTERNS = [["1010110100011", "0110001011010", "1001011000110"], ["0101100110101", "1100010101100", "0011101000011"]];
function cards() {
  const out = [];
  out.push(iron(S(k.slabOf(TRAY, Z_BEDTOP, 2.4, P, 3, 0.5), { tone: "lo" })));
  const z0 = Z_BEDTOP + 2.4;
  const cx = TRAY.x + 4, cy = TRAY.y + 4;
  for (let i = 0; i < 5; i++) {
    const c = { x: cx + [0, 0.6, -0.4, 0.3, 0][i], y: cy + [0, -0.4, 0.3, 0.2, 0][i], ...CARD };
    out.push(card(S(k.slabOf(c, z0 + i * 0.9, 0.9, P, 2), { tone: "hi", crease: "faint" })));
  }
  out.push(holes(cx, cy, z0 + 4.5, PATTERNS[0]));
  // the top card, sliding toward the mill and back
  const top = { x: cx, y: cy, ...CARD };
  const zt = z0 + 4.5;
  const moving = card(S(k.slabOf(top, zt, 0.9, P, 2), { tone: "hi", lit: true, crease: "faint" })) + holes(cx, cy, zt + 0.9, PATTERNS[1]);
  out.push(a.amSlide(moving, [0, -9, 0], P, { period: 7000, delay: 800 }));
  return out.join("");
}

// A brass maker's plate on the bed's front-right.
function plate() {
  const pl = { x: 22, y: 30, w: 30, d: 12, r: 1.2 };
  const z = Z_BEDTOP;
  return brass(S(k.slabOf(pl, z, 0.8, P, 3, 0.3), { tone: "hi", crease: "lo" })) +
    L(k.planOutline(k.insetPlan(pl, 1.6), z + 0.8, P, 3), { tone: "lo" }) +
    L([[4, 18], [4, 12]].map(([dx, len], i) => k.lineOnTop([pl.x + dx + 2, pl.y + 4.4 + i * 3], [pl.x + dx + 2 + len, pl.y + 4.4 + i * 3], z + 0.8, P)).join(""), { tone: "mid", free: true }) +
    D([at([pl.x + 3, pl.y + pl.d / 2, z + 0.8]), at([pl.x + pl.w - 3, pl.y + pl.d / 2, z + 0.8])], { size: SCREW });
}

const points = () => [...k.boxCorners(k.insetPlan(BASE, -6), 0, Z_BEDTOP), ...k.boxCorners(k.insetPlan(FRAME, -GEAR_R + 5), Z_UP, Z_UPTOP + 12)];

P = k.fitProjection(points(), W, H, { pad: 18, azimuth: AZ, elevation: EL });

function body() {
  const out = [bed()];
  const vert = [...PILLARS.map((p) => ({ key: [...p, 50], svg: pillar(p) })), ...COLS.map((c) => ({ key: [...c, 50], svg: column(c) }))];
  for (const v of byDepth(vert, (v) => v.key)) out.push(v.svg);
  out.push(upper());
  for (const [i, c] of byDepth(COLS.map((c, i) => [i, c]), ([, c]) => [...c, Z_UPTOP]).map((x) => x)) out.push(gear(c, i % 2 === 1, i * 0));
  out.push(plate(), cards());
  return out.join("");
}

// ---------- size: lossless path minifier ----------
// The kit writes absolute M/L/Z commands in tenths. Rewrite each path as relative commands,
// computed in integer tenths so nothing drifts, and drop leading zeros: about a third smaller.
const num = (t) => {
  const v = (t / 10).toString();
  return v.replace(/^(-?)0\./, "$1.");
};
function minifyD(d) {
  if (!/^[MLZ0-9 .\-]+$/.test(d)) return d;
  const tokens = d.match(/[MLZ]|-?\d*\.?\d+/g);
  let out = "";
  let cx = 0, cy = 0, sx = 0, sy = 0, first = true, prev = "";
  for (let i = 0; i < tokens.length; ) {
    const c = tokens[i++];
    if (c === "Z") { out += "z"; cx = sx; cy = sy; prev = "z"; continue; }
    const x = Math.round(parseFloat(tokens[i++]) * 10);
    const y = Math.round(parseFloat(tokens[i++]) * 10);
    const dx = first ? x : x - cx;
    const dy = first ? y : y - cy;
    const cmd = c === "M" ? (first ? "M" : "m") : "l";
    const pair = num(dx) + (dy < 0 ? "" : " ") + num(dy);
    out += (cmd === prev && cmd === "l" ? (dx < 0 ? "" : " ") : cmd) + pair;
    prev = cmd;
    first = false;
    cx = x; cy = y;
    if (c === "M") { sx = x; sy = y; }
  }
  return out;
}
const minify = (svg) => svg.replace(/ d="([^"]*)"/g, (_, d) => ` d="${minifyD(d)}"`);


const svg = a.assetSvg({
  width: W, height: H,
  label: "An isometric drawing of the Mill of Charles Babbage's Analytical Engine: three columns of brass figure wheels between cast-iron frame plates, meshing crown gears turning on top, and a stack of punched operation cards feeding in at the front.",
  body: minify(body()), paper: PAPER,
  accents: { brass: "#C08A2E", iron: "#857C6C", card: "#F1E3BF" },
  weight: 0.6, id: "babbage",
});
writeFileSync(join(HERE, "babbage.svg"), svg);
writeFileSync(join(HERE, "babbage.html"), a.previewHtml({ title: "babbage", svg, paper: PAPER, width: W }));
console.log(`wrote babbage.svg (${(svg.length / 1024).toFixed(0)} KB)`);
