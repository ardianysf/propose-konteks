// The Konteks room tour, second concept: one house. Four rooms stand side by side along one
// back wall (1843, 1936, 1969, Today), divided by short partitions you can walk past, on one
// floor. A single strip of instructions runs along the back wall through all four rooms.
// Each room's machine works in detail; the page moves a camera along the house.
//   node house.mjs → house.svg, house.html, house.cams.json
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as k from "../../kit/iso-kit.mjs";
import * as a from "../../kit/asset.mjs";
import * as G from "../../kit/lathe.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const PAPER = "#F6F1E4";
const AZ = 58, EL = 32;
const W0 = { origin: [0, 0], scale: 1, azimuth: AZ, elevation: EL };
let P = W0;
const at = (p) => k.iso(p, P);
const S = (paths, style) => k.solidSvg(paths, style);
const L = (d, style) => k.lineSvg(d, style);
const D = (pts, style) => k.dotsSvg(pts, style);
const depth = (p) => k.depthOf([p[0], p[1], p[2] ?? 0], P);
const ac = (name) => (s) => `<g class="ac-${name}">${s}</g>`;
const flat = (fill, edge) => `fill:var(--anatomy-${fill});stroke:var(--anatomy-${edge});stroke-width:var(--anatomy-weight);vector-effect:non-scaling-stroke;stroke-linejoin:round`;
const unit = (v) => { const l = Math.hypot(...v); return v.map((c) => c / l); };
const poly = (pts) => k.pathOf(pts.map(at), true);
const faceY = (y, x0, x1, z0, z1) => poly([[x0, y, z0], [x1, y, z0], [x1, y, z1], [x0, y, z1]]);
const faceX = (x, y0, y1, z0, z1) => poly([[x, y0, z0], [x, y1, z0], [x, y1, z1], [x, y0, z1]]);
const box = (x, y, w, d, z, h, r = 0.6, steps = 2, bevel = 0) => k.slabOf({ x, y, w, d, r }, z, h, P, steps, bevel);
const flatFace = (d, name, edge = "lo") => ac(name)(`<path d="${d}" style="${flat("top", edge)}"/>`);
let clipN = 0;
const clipped = (screenPath, svg) => { const id = `hc${(++clipN).toString(36)}`; return `<clipPath id="${id}"><path d="${screenPath}"/></clipPath><g clip-path="url(#${id})">${svg}</g>`; };
const yMat = (o) => a.planeMatrix(o, [1, 0, 0], [0, 0, -1], P);   // a face that looks along +y, x right, z up
const xMat = (o) => a.planeMatrix(o, [0, 1, 0], [0, 0, -1], P);   // a face that looks along +x
const texts = (M, lines, cls, size, lead) => `<g transform="${M}">${lines.map((t, i) => `<text class="${cls}" x="0" y="${(i * lead).toFixed(2)}" font-size="${size}">${t}</text>`).join("")}</g>`;
const sortItems = (items) => items.sort((p, q) => depth(p[0]) - depth(q[0])).map(([, s]) => s).join("");

// ---------- path minifier ----------
const num = (t) => (t / 10).toString().replace(/^(-?)0\./, "$1.");
function minifyD(d) {
  if (!/^[MLZ0-9 .\-]+$/.test(d)) return d;
  const tokens = d.match(/[MLZ]|-?\d*\.?\d+/g);
  let out = "", cx = 0, cy = 0, sx = 0, sy = 0, first = true, prev = "";
  for (let i = 0; i < tokens.length;) {
    const c = tokens[i++];
    if (c === "Z") { out += "z"; cx = sx; cy = sy; prev = "z"; continue; }
    const x = Math.round(parseFloat(tokens[i++]) * 10), y = Math.round(parseFloat(tokens[i++]) * 10);
    const dx = first ? x : x - cx, dy = first ? y : y - cy;
    const cmd = c === "M" ? (first ? "M" : "m") : "l";
    out += (cmd === prev && cmd === "l" ? (dx < 0 ? "" : " ") : cmd) + num(dx) + (dy < 0 ? "" : " ") + num(dy);
    prev = cmd; first = false; cx = x; cy = y; if (c === "M") { sx = x; sy = y; }
  }
  return out;
}
const minify = (svg) => svg.replace(/ d="([^"]*)"/g, (_, d) => ` d="${minifyD(d)}"`);

function placed(fn, pos, f) {
  const keep = P;
  P = { origin: k.iso(pos, keep), scale: keep.scale * f, azimuth: AZ, elevation: EL };
  const s = fn();
  P = keep;
  return s;
}

// ---------- the house ----------
const RW = 200, DEP = 176, WH = 116, NR = 4, LEN = RW * NR;
const STRIP = [100, 106];      // the instruction strip on the back wall
const PART = 64;                // partitions reach this far from the back wall

// ---------- people ----------
function person({ x, y, facing = 0, coat = "coatA", hair = "hairA", seated = false, pose = "", lift = "r" }) {
  const skin = ac("skin"), cloth = ac(coat), dark = ac("trouser"), hr = ac(hair), shoe = ac("shoe");
  const f = [Math.cos(facing), Math.sin(facing), 0], s = [-f[1], f[0], 0];
  const out = [`<path class="iso-halo" d="${k.haloOf({ x: x - 10, y: y - 10, w: 20, d: 20, r: 10 }, 0, 2, P)}"/>`];
  const zb = seated ? 15 : 22;
  // legs
  const legs = [1, -1].map((sg) => ({ sg, p: [x + s[0] * sg * 3, y + s[1] * sg * 3] })).sort((p, q) => depth([...p.p, 0]) - depth([...q.p, 0]));
  for (const { p } of legs) {
    if (!seated) {
      out.push(shoe(S(k.slabOf({ x: p[0] - 2.4 + f[0] * 1.6, y: p[1] - 2.4 + f[1] * 1.6, w: 4.8, d: 4.8, r: 2 }, 0, 2.2, P, 3), { tone: "lo" })));
      out.push(dark(S(k.cylinder(p[0], p[1], 2.1, 2, 21, P, 14), { tone: "mid" })));
    } else {
      const knee = [p[0] + f[0] * 10, p[1] + f[1] * 10];
      out.push(shoe(S(k.slabOf({ x: knee[0] - 2.4 + f[0] * 2, y: knee[1] - 2.4 + f[1] * 2, w: 4.8, d: 4.8, r: 2 }, 0, 2.2, P, 3), { tone: "lo" })));
      out.push(dark(S(k.cylinder(knee[0], knee[1], 2.1, 2, 13.5, P, 14), { tone: "mid" })));
      out.push(dark(S(G.solidOf([[0, 2.6, 1], [5, 2.6, 1], [10.5, 2.4, 1]], G.frameAlong([p[0], p[1], 15.6], f), P), { tone: "mid" })));
    }
  }
  // arms
  const sh = (sg) => [x + s[0] * sg * 8.2, y + s[1] * sg * 8.2, zb + 18.5];
  const armDir = (sg) => {
    const mine = sg === (lift === "r" ? -1 : 1);
    if (pose === "point" && mine) return unit([f[0] * 0.85 + s[0] * sg * 0.1, f[1] * 0.85 + s[1] * sg * 0.1, 0.45]);
    if (pose === "write" || pose === "type") return unit([f[0] * 0.85, f[1] * 0.85, -0.55]);
    if (pose === "hold" && mine) return unit([f[0] * 0.7, f[1] * 0.7, -0.35]);
    return unit([s[0] * sg * 0.18, s[1] * sg * 0.18, -1]);
  };
  const LEN_A = 15;
  const arm = (sg) => {
    const o = sh(sg), d = armDir(sg);
    const hand = [o[0] + d[0] * (LEN_A + 1.6), o[1] + d[1] * (LEN_A + 1.6), o[2] + d[2] * (LEN_A + 1.6)];
    return cloth(S(G.solidOf([[0, 2.5, 1], [3, 2.6, 1], [12, 2.1, 1], [LEN_A, 1.7, 1]], G.frameAlong(o, d), P), { tone: "mid" })) + skin(S(G.sphereOf(hand, 2.1, P), { tone: "hi" }));
  };
  const arms = [1, -1].sort((p, q) => depth(sh(p)) - depth(sh(q)));
  const farSide = arms[0], nearSide = arms[1];
  out.push(arm(farSide));
  const F = G.frameOf([x, y, zb], [0, 0, 1], [1, 0, 0], [0, 1, 0]);
  out.push(cloth(S(G.solidOf([[0, 7.2, 1], [5, 8.2, 1], [15, 8, 1], [20, 7, 1], [23, 4.4, 1], [24, 2.4, 1]], F, P), { tone: "hi" })));
  out.push(cloth(L(k.segment([x + f[0] * 7.9, y + f[1] * 7.9, zb + 4], [x + f[0] * 7.6, y + f[1] * 7.6, zb + 19], P), { tone: "faint", free: true })));
  out.push(arm(nearSide));
  out.push(skin(S(k.cylinder(x, y, 2.1, zb + 23.5, 3.5, P, 14), { tone: "mid" })));
  const H = [x, y, zb + 32.5];
  out.push(skin(S(G.sphereOf(H, 6.4, P), { tone: "hi" })));
  out.push(hr(S(G.solidOf([[-1.6, 6.7, 1], [1.5, 6.6, 1], [4, 5.5, 1], [5.9, 3.3, 1], [6.9, 0, 1]], G.frameOf([H[0] - f[0] * 1.1, H[1] - f[1] * 1.1, H[2]], [0, 0, 1], [1, 0, 0], [0, 1, 0]), P), { tone: "mid" })));
  return out.join("");
}

function chair(x, y, facing = 0) {
  const wood = ac("desk");
  const f = [Math.cos(facing), Math.sin(facing)];
  const legs = [[-4, -4], [4, -4], [-4, 4], [4, 4]].map(([dx, dy]) => [x + dx, y + dy]).sort((p, q) => depth([...p, 0]) - depth([...q, 0]));
  let s = legs.map(([lx, ly]) => wood(S(box(lx - 0.9, ly - 0.9, 1.8, 1.8, 0, 12), { tone: "lo" }))).join("");
  s += wood(S(box(x - 5.5, y - 5.5, 11, 11, 12, 2, 1, 3), { tone: "mid" }));
  const bx = x - f[0] * 5, by = y - f[1] * 5;
  const back = Math.abs(f[0]) > Math.abs(f[1]) ? box(bx - 0.8, by - 5.5, 1.6, 11, 14, 14, 0.4) : box(bx - 5.5, by - 0.8, 11, 1.6, 14, 14, 0.4);
  const backFirst = depth([bx, by, 0]) < depth([x, y, 0]);
  return backFirst ? wood(S(back, { tone: "mid" })) + s : s + wood(S(back, { tone: "mid" }));
}

function table(x, y, w, d, h, { drawer = true, name = "desk" } = {}) {
  const wood = ac(name);
  const legs = [[x + 1.5, y + 1.5], [x + w - 4, y + 1.5], [x + 1.5, y + d - 4], [x + w - 4, y + d - 4]].sort((p, q) => depth([...p, 0]) - depth([...q, 0]));
  let s = legs.map(([lx, ly]) => wood(S(box(lx, ly, 2.5, 2.5, 0, h - 3), { tone: "lo" }))).join("");
  if (drawer) {
    s += wood(S(box(x + 3, y + 3, w - 6, d - 6, h - 8, 5, 0.4), { tone: "mid" }));
    const fy = y + d - 3;
    s += L(faceY(fy + 0.05, x + w * 0.3, x + w * 0.7, h - 7, h - 4), { tone: "lo" });
    s += D([at([x + w / 2, fy + 0.05, h - 5.5])], { size: 0.6, tone: "hi" });
  }
  s += wood(S(box(x, y, w, d, h - 3, 3, 0.8, 3, 0.3), { tone: "hi", inner: L(k.sideSeam({ x, y, w, d, r: 0.8 }, h - 1.5, P, 3), { tone: "faint" }) }));
  return s;
}

function windowOnBack(x0, x1, z0, z1, { arch = false, cols = 2 } = {}) {
  const y = 0.15;
  const pts = [[x0, y, z0], [x1, y, z0], [x1, y, z1]];
  const cx = (x0 + x1) / 2, r = (x1 - x0) / 2;
  if (arch) for (let i = 0; i <= 18; i++) { const t = (i / 18) * Math.PI; pts.push([cx + Math.cos(t) * r, y, z1 + Math.sin(t) * r]); }
  pts.push([x0, y, z1]);
  const out = [ac("frame")(`<path d="${poly(pts.map(([px, , pz]) => [px, y - 0.05, pz]))}" style="${flat("top", "lo")}"/>`)];
  const inset = pts.map(([px, , pz]) => [cx + (px - cx) * 0.9, y + 0.1, z0 + 1.6 + (pz - z0) * (1 - 3.2 / (z1 - z0 + (arch ? r : 0)))]);
  out.push(ac("glass")(`<path d="${poly(inset)}" style="${flat("top", "mid")}"/>`));
  const bars = [];
  for (let i = 1; i < cols; i++) { const bx = x0 + ((x1 - x0) * i) / cols; bars.push(k.segment([bx, y + 0.2, z0 + 1.6], [bx, y + 0.2, z1 + (arch ? r * 0.92 : -1.6)], P)); }
  bars.push(k.segment([x0 + r * 0.1, y + 0.2, (z0 + z1) / 2 + 4], [x1 - r * 0.1, y + 0.2, (z0 + z1) / 2 + 4], P));
  out.push(ac("frame")(L(bars.join(""), { tone: "mid" })));
  out.push(ac("frame")(S(box(x0 - 2, 0, x1 - x0 + 4, 3, z0 - 2.2, 2.2, 0.4), { tone: "hi" })));
  return out.join("");
}

// ======================================================================================
// 1843 · The Analytical Engine. Punched cards feed the mill, the crank turns, the figure
// wheels carry digit by digit up each column. Ada writes Note G by the oil lamp.
// ======================================================================================
const VIEW = (() => { const V = G.viewOf(W0); const l = Math.hypot(V[0], V[1]); return Math.atan2(V[1] / l, V[0] / l); })();
const rimTicks = (cx, cy, r, z0, z1) => Array.from({ length: 9 }, (_, i) => { const t = VIEW - 1.25 + (i / 8) * 2.5; return k.segment([cx + Math.cos(t) * r, cy + Math.sin(t) * r, z0], [cx + Math.cos(t) * r, cy + Math.sin(t) * r, z1], P); }).join("");
function engine(ex, ey) {
  const brass = ac("brass"), iron = ac("iron"), card = ac("card"), oak = ac("desk");
  const out = [];
  const W = 66, Dd = 30;
  out.push(`<path class="iso-halo" d="${k.haloOf({ x: ex - 4, y: ey - 4, w: W + 8, d: Dd + 8, r: 3 }, 0, 3, P)}"/>`);
  out.push(oak(S(box(ex, ey, W, Dd, 0, 7, 1, 3, 0.6), { tone: "mid", inner: L(k.sideSeam({ x: ex, y: ey, w: W, d: Dd, r: 1 }, 3.5, P, 3), { tone: "faint" }) })));
  const posts = [[ex + 3, ey + 3], [ex + W - 6, ey + 3], [ex + 3, ey + Dd - 6], [ex + W - 6, ey + Dd - 6]].sort((p, q) => depth([...p, 0]) - depth([...q, 0]));
  const farPosts = posts.slice(0, 2), nearPosts = posts.slice(2);
  for (const [px, py] of farPosts) out.push(iron(S(box(px, py, 3, 3, 7, 62, 0.4), { tone: "mid" })));
  // three columns of figure wheels, each with ten ticks on its rim; a carry runs up each column
  const cols = [ex + 16, ex + 33, ex + 50].map((cx) => [cx, ey + Dd / 2]);
  for (const [cx, cy] of cols.sort((p, q) => depth([...p, 0]) - depth([...q, 0]))) {
    out.push(iron(S(k.cylinder(cx, cy, 1.3, 7, 62, P, 10), { tone: "mid" })));
    for (let i = 0; i < 8; i++) {
      const z = 11 + i * 7;
      out.push(brass(S(k.cylinder(cx, cy, 6.6, z, 3.6, P, 32, 0.4), { tone: "hi", inner: L(rimTicks(cx, cy, 6.6, z + 0.7, z + 2.9), { tone: "lo" }) })));
    }
    const ci = cols.findIndex((c) => c[0] === cx);
  }
  for (const [px, py] of nearPosts) out.push(iron(S(box(px, py, 3, 3, 7, 62, 0.4), { tone: "mid" })));
  out.push(brass(S(box(ex, ey, W, Dd, 69, 3.5, 1, 3, 0.4), { tone: "mid" })));
  out.push(L(k.planOutline({ x: ex + 3, y: ey + 3, w: W - 6, d: Dd - 6, r: 0.6 }, 72.5, P, 2), { tone: "faint" }));
  // the crank on the right cheek, turning
  const cr = [ex + W + 0.6, ey + Dd / 2, 34];
  out.push(iron(S(G.disc(0, 1.6, 12, G.frameAlong([ex + W, ey + Dd / 2, 34], [1, 0, 0]), P), { tone: "hi", crease: "lo" })));
  const crank = `<circle r="2" style="${flat("shade-0", "mid")}"/><path d="M0 0L11 0" style="stroke:var(--anatomy-hi);stroke-width:2.6;stroke-linecap:round"/><circle cx="11" cy="0" r="2.4" style="${flat("top", "hi")}"/>` + [0, 1, 2, 3, 4, 5].map((i) => { const t = (i / 6) * Math.PI * 2; return `<circle cx="${(Math.cos(t) * 8.4).toFixed(2)}" cy="${(Math.sin(t) * 8.4).toFixed(2)}" r=".9" style="fill:var(--anatomy-lo)"/>`; }).join("");
  out.push(iron(a.amSpin(crank, a.planeMatrix([cr[0] + 1, cr[1], cr[2]], [0, 1, 0], [0, 0, -1], P), { period: 1200 })));
  return out.join("");
}

function cardFeed(x0, y0) {
  // a sloped tray of punched cards running into the engine's left cheek, stepping one card each turn
  const card = ac("card"), oak = ac("desk");
  const out = [];
  const TW = 30, TD = 12, Z = 24, PITCH = 6;
  out.push(oak(S(box(x0 - 2, y0 + 2, 3, 3, 0, Z, 0.4), { tone: "lo" })));
  out.push(oak(S(box(x0, y0, TW, TD, Z, 2.2, 0.6, 2), { tone: "mid" })));
  const cards = [];
  for (let i = -6; i <= 6; i++) {
    const cx = x0 + 2 + i * PITCH;
    cards.push(card(S(box(cx, y0 + 1.5, 5, TD - 3, Z + 2.2, 0.5, 0.3), { tone: "hi", crease: "none" })));
    cards.push(D([[1, 3], [3, 6], [2, 8], [4, 4]].filter((_, j) => (i + j) % 3 !== 0).map(([dx, dy]) => at([cx + dx * 0.9 + 0.5, y0 + 1.5 + dy, Z + 2.8])), { size: 0.45, tone: "lo" }));
  }
  const win = poly([[x0, y0, Z + 2.2], [x0 + TW, y0, Z + 2.2], [x0 + TW, y0 + TD, Z + 2.2], [x0, y0 + TD, Z + 2.2]]);
  // clip to the tray, raised a little so the cards' thickness shows
  const winHi = k.pathOf([[x0, y0, Z + 2.2], [x0 + TW, y0, Z + 2.2], [x0 + TW, y0, Z + 4], [x0 + TW, y0 + TD, Z + 4], [x0 + TW, y0 + TD, Z + 2.2], [x0, y0 + TD, Z + 2.2], [x0, y0 + TD, Z + 4], [x0, y0, Z + 4]].map(at), true);
  out.push(clipped(winHi, `<g class="am-step" style="--am-period:1.2s;--am-dx:${(at([PITCH, 0, 0])[0] - at([0, 0, 0])[0]).toFixed(2)}px;--am-dy:${(at([PITCH, 0, 0])[1] - at([0, 0, 0])[1]).toFixed(2)}px">${cards.join("")}</g>`));
  return out.join("");
}

// ======================================================================================
// 1936 · A tape and its rules. The head reads a cell, the rule lights on the board, the head
// writes and the tape steps. Turing points at the rule in play.
// ======================================================================================
function turing() {
  const wood = ac("wood"), blue = ac("blue"), steel = ac("steel"), tape = ac("tape");
  const BASE = { x: -76, y: -18, w: 152, d: 36, r: 3 };
  const ZB = 8, AX = 30, SX = 58, FL = 15, WOUND = 11, PER = 1200;
  const out = [];
  for (const [x, y] of k.corners(BASE, 7).sort((p, q) => depth([...p, 0]) - depth([...q, 0]))) out.push(wood(S(k.cylinder(x, y, 3.6, 0, 3, P, 18), { tone: "lo" })));
  out.push(wood(S(k.slabOf(BASE, 3, ZB - 3, P, 4, 1), { tone: "mid", inner: L(k.sideSeam(BASE, 5.5, P, 4), { tone: "faint" }) })));
  const upright = (x, y) => steel(S(k.slabOf({ x: x - 3, y: y - 1.2, w: 6, d: 2.4, r: 0.8 }, ZB, AX + 4 - ZB, P, 3, 0.3), { tone: "mid" }));
  const flange = (x, y) => steel(S(G.disc(0, 1.4, FL, G.frameAlong([x, y, AX], [0, 1, 0]), P), { tone: "hi", crease: "lo" }));
  const core = (x) => tape(S(G.disc(0, 16, WOUND, G.frameAlong([x, -8, AX], [0, 1, 0]), P), { tone: "hi", crease: "lo" }));
  for (const x of [-SX, SX]) out.push(upright(x, -11));
  for (const x of [-SX, SX]) out.push(flange(x, -9.4));
  for (const x of [-SX, SX]) out.push(core(x));
  const TZ = AX + WOUND, CELL = 8.4;
  out.push(tape(S(k.slabOf({ x: -SX, y: -7, w: 2 * SX, d: 14, r: 0.2 }, TZ, 0.5, P, 2), { tone: "hi", crease: "faint" })));
  const marks = [];
  const pattern = "1101001101011100101101001";
  for (let i = -9; i <= 9; i++) {
    const x = i * CELL;
    marks.push(L(k.lineOnTop([x, -7], [x, 7], TZ + 0.5, P), { tone: "lo" }));
    if (pattern[(i + 18) % pattern.length] === "1") marks.push(L(k.lineOnTop([x + CELL / 2, -3.4], [x + CELL / 2, 3.4], TZ + 0.5, P), { tone: "hi" }));
    else marks.push(L(k.ring(x + CELL / 2, 0, 2.3, TZ + 0.5, P, 16), { tone: "hi" }));
  }
  const tapeWin = poly([[-SX, -7, TZ + 0.5], [SX, -7, TZ + 0.5], [SX, 7, TZ + 0.5], [-SX, 7, TZ + 0.5]]);
  out.push(clipped(tapeWin, `<g class="am-step" style="--am-period:${PER / 1000}s;--am-dx:${(at([CELL, 0, 0])[0] - at([0, 0, 0])[0]).toFixed(2)}px;--am-dy:${(at([CELL, 0, 0])[1] - at([0, 0, 0])[1]).toFixed(2)}px">${marks.join("")}</g>`));
  // the head: carriage, a read window lit as it reads, and a stylus that taps down to write
  const H = { x: -11, y: -14, w: 22, d: 28, r: 2 };
  let head = blue(S(k.slabOf({ x: -2, y: -2, w: 4, d: 4, r: 0.6 }, TZ + 0.6, 3, P, 2), { tone: "lo" }));
  head += blue(S(k.slabOf(H, TZ + 3, 16, P, 4, 0.8), { tone: "hi", inner: L(k.sideSeam(H, TZ + 8, P, 4), { tone: "faint" }) }));
  head += L(faceY(H.y + H.d + 0.05, -7, 7, TZ + 9, TZ + 15), { tone: "lo" });
  head += ac("lamp")(`<g class="am-read" style="--am-period:${PER / 1000}s">${D([at([-3.5, H.y + H.d + 0.1, TZ + 12]), at([0, H.y + H.d + 0.1, TZ + 12]), at([3.5, H.y + H.d + 0.1, TZ + 12])], { size: 0.9, tone: "lit" })}</g>`);
  head += steel(S(k.cylinder(0, 0, 3, TZ + 19, 5, P, 20, 0.4), { tone: "mid" }));
  out.push(`<g class="am-tap" style="--am-period:${PER / 1000}s;--am-dy:${(at([0, 0, -2.4])[1] - at([0, 0, 0])[1]).toFixed(2)}px">${head}</g>`);
  for (const x of [-SX, SX]) out.push(flange(x, 8));
  // spokes on the near flanges turn with the tape
  for (const x of [-SX, SX]) {
    const spokes = [0, 1, 2].map((i) => { const t = (i * 2 * Math.PI) / 3; return `<path d="M0,0L${(Math.cos(t) * 11).toFixed(2)},${(Math.sin(t) * 11).toFixed(2)}" style="stroke:var(--anatomy-mid);stroke-width:var(--anatomy-weight);vector-effect:non-scaling-stroke"/>`; }).join("") + `<circle r="3" style="${flat("shade-0", "mid")}"/>`;
    out.push(steel(a.amSpin(spokes, a.planeMatrix([x, 9.4, AX], [1, 0, 0], [0, 0, -1], P), { period: PER * 6 })));
  }
  for (const x of [-SX, SX]) out.push(upright(x, 11));
  return out.join("");
}

// ======================================================================================
// 1969 · Unix and C. The minicomputers' reels turn and lamps blink; on the terminal a program
// appears line by line; the teletype's head runs and the printout climbs.
// ======================================================================================
function pdp() {
  const cab = ac("cab"), green = ac("cgreen"), dark = ac("dark"), reel = ac("reel");
  const C = { x: -32, y: -20, w: 64, d: 40, r: 2.4 };
  const FY = C.y + C.d;
  const out = [];
  out.push(dark(S(k.slabOf(k.insetPlan(C, 2), 0, 5, P, 3), { tone: "lo" })));
  out.push(cab(S(k.slabOf(C, 5, 120, P, 3, 0.8), { tone: "mid", inner: L([30, 96].map((z) => k.sideSeam(C, z, P, 3)).join(""), { tone: "faint" }) })));
  out.push(L(Array.from({ length: 6 }, (_, i) => faceY(FY, -24, 24, 9 + i * 3.4, 10.4 + i * 3.4)).join(""), { tone: "lo" }));
  out.push(dark(S(k.slabOf({ x: -28, y: FY, w: 56, d: 0.6, r: 0.4 }, 34, 58, P, 2), { tone: "lo" })));
  const RZ = 72, RR = 11.5;
  for (const x of [-13.5, 13.5]) {
    out.push(reel(S(G.disc(0, 1.6, RR, G.frameAlong([x, FY, RZ], [0, 1, 0]), P), { tone: "hi", crease: "lo" })));
    const hub = `<circle r="3.4" style="${flat("shade-0", "mid")}"/>` + [0, 1, 2].map((i) => { const t = (i * 2 * Math.PI) / 3; return `<path d="M${(Math.cos(t - 0.42) * 5).toFixed(2)},${(Math.sin(t - 0.42) * 5).toFixed(2)}L${(Math.cos(t - 0.3) * 9.6).toFixed(2)},${(Math.sin(t - 0.3) * 9.6).toFixed(2)}L${(Math.cos(t + 0.3) * 9.6).toFixed(2)},${(Math.sin(t + 0.3) * 9.6).toFixed(2)}L${(Math.cos(t + 0.42) * 5).toFixed(2)},${(Math.sin(t + 0.42) * 5).toFixed(2)}Z" style="${flat("shade-1", "lo")}"/>`; }).join("");
    out.push(reel(a.amSpin(hub, a.planeMatrix([x, FY + 1.6, RZ], [1, 0, 0], [0, 0, -1], P), { period: 1300, reverse: x > 0 })));
  }
  // the tape between the reels, over a capstan
  out.push(L(k.segment([-13.5, FY + 0.9, RZ - RR], [-4, FY + 0.9, 44], P) + k.segment([-4, FY + 0.9, 44], [4, FY + 0.9, 44], P) + k.segment([4, FY + 0.9, 44], [13.5, FY + 0.9, RZ - RR], P), { tone: "mid" }));
  out.push(L(faceY(FY, -28, 28, 98, 120), { tone: "lo" }));
  const lamps = [], sw = [];
  for (let i = 0; i < 16; i++) {
    const x = -24 + i * 3.2;
    lamps.push(at([x + 0.6, FY, 114]));
    const paths = k.slabOf({ x: x - 0.8, y: FY, w: 1.8, d: 3.2, r: 0.4 }, 102 + (i % 3 === 0 ? 1.4 : 0), 4.2, P, 2);
    sw.push(Math.floor(i / 3) % 2 ? green(S(paths, { tone: "hi" })) : cab(S(paths, { tone: "hi" })));
  }
  out.push(ac("lampr")(lamps.map((p, i) => a.amBlink(D([p], { size: 0.85, tone: "lit" }), { period: 900 + (i % 5) * 260, delay: (i * 137) % 900 })).join("")));
  out.push(sw.join(""));
  return out.join("");
}

function terminal(tx, ty, th) {
  // a glass terminal on the desk, its screen facing the room: a C program appears line by line
  const cab = ac("cab"), out = [];
  const W = 26, Dp = 24, H = 22, sx0 = tx + 4, sx1 = tx + W - 4;
  out.push(cab(S(box(tx, ty, W, Dp, th, H, 2.4, 3, 0.6), { tone: "mid", inner: L(k.sideSeam({ x: tx, y: ty, w: W, d: Dp, r: 2.4 }, th + 4, P, 3), { tone: "faint" }) })));
  const fy = ty + Dp + 0.05;
  out.push(ac("screen")(`<path d="${faceY(fy, sx0, sx1, th + 5, th + H - 3)}" style="${flat("top", "lo")}"/>`));
  const M = yMat([sx0 + 1.4, fy + 0.05, th + H - 5.6]);
  const code = ["main() {", "  printf(", "   \"hello,\\n\");", "}", "$ cc hello.c", "$ a.out", "hello,"];
  const frames = [];
  for (let n = code.length; n >= 1; n--) frames.push(texts(M, code.slice(0, n), "hw-phos", 2.2, 2.4));
  frames.push(texts(M, ["$ _"], "hw-phos", 2.2, 2.4));
  out.push(a.amFlip([frames[0], frames[frames.length - 1], ...frames.slice(1, -1).reverse()], { period: 4000 }));
  // keyboard
  out.push(cab(S(box(tx + 2, ty + Dp + 3, W - 4, 9, th, 2, 0.8, 2), { tone: "hi" })));
  const keys = [];
  for (let r = 0; r < 2; r++) for (let c = 0; c < 7; c++) keys.push(k.planOutline({ x: tx + 3.6 + c * 2.9, y: ty + Dp + 4.2 + r * 3.2, w: 2.2, d: 2.4, r: 0.3 }, th + 2, P, 2));
  out.push(L(keys.join(""), { tone: "lo" }));
  return out.join("");
}

function teletype(x, y) {
  const cab = ac("cab"), paper = ac("paper"), iron = ac("iron");
  const out = [];
  const legs = [[x - 14, y - 9], [x + 12, y - 9], [x - 14, y + 7], [x + 12, y + 7]].sort((p, q) => depth([...p, 0]) - depth([...q, 0]));
  out.push(legs.map(([lx, ly]) => iron(S(box(lx, ly, 2, 2, 0, 18), { tone: "lo" }))).join(""));
  out.push(cab(S(box(x - 16, y - 11, 32, 22, 18, 9, 1.4, 3, 0.4), { tone: "mid" })));
  out.push(cab(S(box(x - 16, y - 11, 32, 13, 27, 8, 2.4, 3, 0.4), { tone: "hi" })));
  out.push(cab(S(box(x - 14, y + 3, 28, 7, 27, 1.6, 0.8, 2), { tone: "mid" })));
  const keys = [];
  for (let r = 0; r < 2; r++) for (let c = 0; c < 8; c++) keys.push(k.planOutline({ x: x - 12.4 + c * 3.1, y: y + 3.8 + r * 2.9, w: 2.3, d: 2.2, r: 0.4 }, 28.6, P, 2));
  out.push(L(keys.join(""), { tone: "lo" }));
  // the platen, the paper climbing out of it, and the print head running along it
  out.push(iron(S(G.disc(-13, 13, 2.2, G.frameAlong([x, y - 5, 37.4], [1, 0, 0]), P), { tone: "mid", crease: "lo" })));
  const py = y - 6.6;
  out.push(paper(S(box(x - 10, py, 20, 0.5, 38, 24, 0.2), { tone: "hi", crease: "none" })));
  const lines = [];
  for (let i = -2; i < 9; i++) lines.push(k.segment([x - 8, py + 0.6, 40 + i * 3], [x + 6 - ((i + 9) % 3) * 4, py + 0.6, 40 + i * 3], P));
  const win = faceY(py + 0.6, x - 10, x + 10, 38.5, 62);
  out.push(clipped(win, a.amLoop(L(lines.join(""), { tone: "lo", free: true }), [0, 0, 3], P, { period: 900 })));
  out.push(a.amSlide(iron(S(box(x - 10, y - 5, 4, 3.4, 38, 3, 0.6, 2), { tone: "hi" })), [16, 0, 0], P, { period: 900 }));
  return out.join("");
}

// ======================================================================================
// Today · A team and its agents. A board of explorations and one decision; a screen working
// on its own: the change written line by line, the checks passing one by one, a preview drawn.
// ======================================================================================
function board(bx0, bx1, bz0, bz1) {
  const out = [];
  out.push(ac("frame")(S(box(bx0 - 2.5, 0, bx1 - bx0 + 5, 2, bz0 - 2.5, bz1 - bz0 + 5, 0.3), { tone: "mid" })));
  out.push(ac("white")(S(box(bx0, 2, bx1 - bx0, 0.5, bz0, bz1 - bz0, 0.2), { tone: "hi", crease: "none" })));
  const y = 2.6;
  const M = (x, z) => yMat([x, y, z]);
  // two areas: explore (left two thirds) and decide (right third), a marker line between
  const split = bx0 + (bx1 - bx0) * 0.64;
  out.push(`<g transform="${M(split, bz1 - 4)}"><path class="hw-marker" d="M0 0V${(bz1 - bz0 - 8).toFixed(1)}" stroke-dasharray="1.6 1.6"/></g>`);
  out.push(texts(M(bx0 + 4, bz1 - 5.4), ["Explore"], "hw-hand", 4.6, 0));
  out.push(texts(M(split + 4, bz1 - 5.4), ["Decide"], "hw-hand", 4.6, 0));
  // sticky notes, each an idea: some sketched, two crossed out
  const notes = [
    [0, 0, "noteA", "sketch"], [1, 0, "noteB", "lines"], [2, 0, "noteA", "x"],
    [0, 1, "noteC", "lines"], [1, 1, "noteA", "flow"], [2, 1, "noteB", "x"],
    [0, 2, "noteB", "lines"], [1, 2, "noteC", "sketch"],
  ];
  const NW = 13.5, NH = 11, gx = bx0 + 5, gz = bz1 - 12;
  const noteSvg = ([c, r, col, kind]) => {
    const x = gx + c * (NW + 3.4) + (r % 2) * 1.2, z = gz - r * (NH + 3.2);
    let s = ac(col)(S(box(x, y, NW, 0.5, z - NH, NH, 0.2), { tone: "hi", crease: "none" }));
    const m = M(x + 1.8, z - 2.4);
    const draw = kind === "sketch" ? `<rect class="hw-ink" x="0" y="0" width="${(NW - 3.6).toFixed(1)}" height="5.2" rx=".6"/><path class="hw-ink" d="M1 1.8H6M1 3.4H4.4"/>`
      : kind === "flow" ? `<circle class="hw-ink" cx="1.6" cy="2.6" r="1.4"/><path class="hw-ink" d="M3.2 2.6H6.8"/><rect class="hw-ink" x="7" y="1.2" width="2.8" height="2.8" rx=".4"/>`
      : `<path class="hw-ink" d="M0 1H${(NW - 4).toFixed(1)}M0 3.2H${(NW - 6).toFixed(1)}M0 5.4H${(NW - 5).toFixed(1)}"/>`;
    s += `<g transform="${m}">${draw}${kind === "x" ? `<path class="hw-ink" d="M0 1H${(NW - 4).toFixed(1)}M0 3.2H${(NW - 6).toFixed(1)}"/><path class="hw-strike" d="M-1 -1L${(NW - 2.6).toFixed(1)} 7M-1 7L${(NW - 2.6).toFixed(1)} -1"/>` : ""}</g>`;
    return s;
  };
  const upTo = (n) => notes.slice(0, n).map(noteSvg).join("");
  out.push(a.amFlip([upTo(8), upTo(1), upTo(2), upTo(3), upTo(4), upTo(5), upTo(6), upTo(7), upTo(8), upTo(8), upTo(8), upTo(8)], { period: 6000 }));
  // a new idea arrives now and then
  out.push(a.amFlip(["", "", noteSvg([2, 2, "noteC", "flow"]), noteSvg([2, 2, "noteC", "flow"]), noteSvg([2, 2, "noteC", "flow"])], { period: 6000 }));
  // arrows from two ideas to the decision
  out.push(`<g transform="${M(gx + 2 * (NW + 3.4) + NW + 1, gz - 6)}"><path class="hw-marker" d="M0 0C6 0 8 -4 ${(split - (gx + 2 * (NW + 3.4) + NW + 1) + 6).toFixed(1)} -6"/></g>`);
  // the decision: a card, ticked, circled in green
  const dx = split + 5, dz = bz1 - 12, DW = bx1 - split - 10, DH = 22;
  out.push(ac("card")(S(box(dx, y, DW, 0.6, dz - DH, DH, 0.3), { tone: "hi", crease: "none" })));
  out.push(`<g transform="${M(dx + 2.4, dz - 3.4)}"><path class="hw-ink" d="M0 1H${(DW - 5).toFixed(1)}M0 3.6H${(DW - 9).toFixed(1)}M0 6.2H${(DW - 7).toFixed(1)}"/><path class="hw-tick" d="M1 12L3.6 14.6L8.6 9.4"/></g>`);
  const ring = [];
  for (let i = 0; i <= 40; i++) { const t = -0.6 + (i / 40) * Math.PI * 2.15; ring.push([dx + DW / 2 + Math.cos(t) * (DW / 2 + 3), y + 0.8, dz - DH / 2 + Math.sin(t) * (DH / 2 + 3)]); }
  out.push(ac("go")(a.amDraw(k.pathOf(ring.map(at)), { tone: "lit", period: 3000, free: true })));
  // marker tray and markers
  out.push(ac("frame")(S(box(bx0, 2, bx1 - bx0, 3.6, bz0 - 3.4, 1.2, 0.3), { tone: "hi" })));
  out.push(ac("go")(S(box(bx0 + 10, 3, 6, 1.4, bz0 - 2.2, 1.2, 0.5), { tone: "mid" })) + ac("noteB")(S(box(bx0 + 18, 3, 6, 1.4, bz0 - 2.2, 1.2, 0.5), { tone: "mid" })));
  return out.join("");
}

function workScreen(tx, ty, th) {
  // a large monitor on a stand: on the left the change written line by line, on the right
  // the checks turning green one by one, under them a preview being drawn, and a progress bar
  const out = [], alu = ac("alu");
  const W = 52, H = 32, z0 = th + 10, sy = ty + 6;
  out.push(alu(S(box(tx + W / 2 - 8, ty + 2, 16, 10, th, 1.2, 1.4, 3, 0.3), { tone: "hi" })));
  out.push(alu(S(box(tx + W / 2 - 2, ty + 3, 4, 2.4, th + 1.2, z0 - th - 0.4, 0.8, 2), { tone: "mid" })));
  out.push(ac("bezel")(S(box(tx, sy, W, 2.4, z0, H, 1, 3, 0.4), { tone: "mid" })));
  const fy = sy + 2.45;
  out.push(ac("display")(`<path d="${faceY(fy, tx + 1.6, tx + W - 1.6, z0 + 1.6, z0 + H - 1.6)}" style="${flat("top", "lo")}"/>`));
  const M = (x, z) => yMat([x, fy + 0.05, z]);
  // window chrome
  out.push(`<g transform="${M(tx + 3, z0 + H - 3.4)}"><circle class="hw-dot1" cx="0" cy="0" r=".6"/><circle class="hw-dot2" cx="2" cy="0" r=".6"/><circle class="hw-dot3" cx="4" cy="0" r=".6"/><path class="hw-dim" d="M-1 1.6H${(W - 4).toFixed(1)}"/></g>`);
  // code being written
  const widths = [18, 13, 20, 9, 16, 11, 19, 7];
  const indent = [0, 2, 2, 4, 2, 0, 2, 0];
  const codeAt = (n) => `<g transform="${M(tx + 3.4, z0 + H - 7)}">${widths.slice(0, n).map((w, i) => `<path class="${i % 3 === 1 ? "hw-code2" : "hw-code"}" d="M${indent[i]} ${(i * 2.6).toFixed(1)}H${(indent[i] + w * 0.8).toFixed(1)}"/>`).join("")}${n < widths.length ? `<rect class="hw-caret" x="${(indent[n] ?? 0).toFixed(1)}" y="${(n * 2.6 - 0.9).toFixed(1)}" width=".9" height="1.8"/>` : ""}</g>`;
  out.push(a.amFlip([codeAt(8), codeAt(0), codeAt(1), codeAt(2), codeAt(3), codeAt(4), codeAt(5), codeAt(6), codeAt(7), codeAt(8), codeAt(8)], { period: 4400 }));
  // checks
  const cx = tx + 33;
  const checks = (n) => `<g transform="${M(cx, z0 + H - 7)}">${[0, 1, 2, 3].map((i) => i < n ? `<circle class="hw-ok" cx="0" cy="${(i * 3.4).toFixed(1)}" r="1.1"/><path class="hw-okm" d="M-.5 ${(i * 3.4).toFixed(1)}L-.1 ${(i * 3.4 + 0.4).toFixed(1)}L.6 ${(i * 3.4 - 0.4).toFixed(1)}"/>` : `<circle class="hw-wait" cx="0" cy="${(i * 3.4).toFixed(1)}" r="1.1"/>`).join("")}${[0, 1, 2, 3].map((i) => `<path class="hw-dim" d="M2.4 ${(i * 3.4).toFixed(1)}H${(8 + (i % 2) * 3).toFixed(1)}"/>`).join("")}</g>`;
  out.push(a.amFlip([checks(4), checks(0), checks(0), checks(0), checks(1), checks(2), checks(3), checks(4), checks(4), checks(4), checks(4)], { period: 4400 }));
  // preview: a small page drawn
  const pv = `<g transform="${M(cx - 1.4, z0 + 8.6)}"><rect class="hw-pv" x="0" y="0" width="14" height="6.4" rx=".6"/><path class="hw-pvl" d="M1.2 1.4H8M1.2 3H6M1.2 4.6H10"/></g>`;
  out.push(a.amFlip([pv, "", "", "", "", "", "", pv, pv, pv, pv], { period: 4400 }));
  // progress bar
  const bar = (f) => `<g transform="${M(tx + 3.4, z0 + 4)}"><rect class="hw-track" x="0" y="0" width="${(W - 6.8).toFixed(1)}" height="1.2" rx=".6"/><rect class="hw-fill" x="0" y="0" width="${((W - 6.8) * f).toFixed(1)}" height="1.2" rx=".6"/></g>`;
  out.push(a.amFlip([bar(1), bar(0.04), bar(0.12), bar(0.22), bar(0.34), bar(0.46), bar(0.58), bar(0.7), bar(0.84), bar(1), bar(1)], { period: 4400 }));
  // the bezel's lit dot
  out.push(ac("go")(D([at([tx + W / 2, fy, z0 + 0.8])], { size: 0.6, tone: "lit" })));
  // keyboard at rest, a mug
  out.push(alu(S(box(tx + 10, ty + 16, 30, 9, th, 1.4, 0.8, 2), { tone: "hi" })));
  out.push(L(Array.from({ length: 3 }, (_, r) => k.lineOnTop([tx + 12, ty + 18 + r * 2.4], [tx + 38, ty + 18 + r * 2.4], th + 1.45, P)).join(""), { tone: "faint" }));
  out.push(ac("mug")(S(k.cylinder(tx + 47, ty + 20, 2.8, th, 5.6, P, 18, 0.3), { tone: "hi" })));
  return out.join("");
}

function bubble(x, y, z, kind) {
  const V = G.viewOf(P), l = Math.hypot(V[0], V[1]);
  const M = a.planeMatrix([x, y, z], [V[1] / l, -V[0] / l, 0], [0, 0, -1], P);
  const mark = kind === "q" ? `<path class="hw-bm" d="M-2.2 -3.6C-2.2 -6.2 2.4 -6.2 2.4 -3.6C2.4 -1.8 0 -1.6 0 0.4"/><circle class="hw-bd" cx="0" cy="2.6" r=".8"/>`
    : kind === "y" ? `<path class="hw-bm" d="M-3.4 -0.6L-1 2L3.6 -3.4"/>`
    : `<circle class="hw-bd" cx="-3" cy="0" r=".9"/><circle class="hw-bd" cx="0" cy="0" r=".9"/><circle class="hw-bd" cx="3" cy="0" r=".9"/>`;
  return `<g transform="${M}"><path class="hw-bb" d="M-8 -7H8Q10 -7 10 -5V4Q10 6 8 6H-1L-4 9.5L-4.6 6H-8Q-10 6 -10 4V-5Q-10 -7 -8 -7Z"/>${mark}</g>`;
}

// ---------- the box: one square house, four rooms around a crossing of low walls ----------
const Q = 170, WH2 = 116, PH = 52, GAP0 = 26, GAP1 = 58, RING = 40;
function placedRot(fn, pos, f, rot) {
  const keep = P;
  P = { origin: k.iso(pos, keep), scale: keep.scale * f, azimuth: AZ + rot, elevation: EL };
  const s = fn();
  P = keep;
  return s;
}

function room1843b() {
  const out = [], items = [];
  out.push(windowOnBack(48, 74, 38, 64, { arch: true }));
  for (let i = 0; i < 3; i++) {
    const y0 = 34 + i * 20;
    out.push(flatFace(faceX(0.2, y0, y0 + 15, 54, 74), "paper"));
    out.push(L([0, 1, 2, 3].map((j) => k.segment([0.3, y0 + 2, 70 - j * 4], [0.3, y0 + 12 - (j % 2) * 3, 70 - j * 4], P)).join(""), { tone: "faint", free: true }));
  }
  {
    const bx = 10, bw = 30, bd = 12, bh = 80;
    let sh = ac("desk")(S(box(bx, 0, bw, bd, 0, bh, 0.5, 2, 0.3), { tone: "mid" }));
    const books = [];
    for (let r = 0; r < 4; r++) {
      const z = 5 + r * 18.5;
      sh += L(faceY(bd + 0.05, bx + 2, bx + bw - 2, z, z + 15.5), { tone: "lo" });
      for (let i = 0; i < 8; i++) { const xx = bx + 3 + i * 3.1; const hh = 10 + ((i * 7 + r * 3) % 5); books.push(flatFace(faceY(bd + 0.1, xx, xx + 2.5, z, z + hh), ["bookA", "bookB", "bookC"][(i + r) % 3], "mid")); }
    }
    items.push([[bx + bw / 2, 6, 0], sh + books.join("")]);
  }
  items.push([[133, 18, 0], engine(100, 6)]);
  items.push([[86, 28, 0], cardFeed(70, 22)]);
  out.push(ac("rug")(S(box(14, 70, 76, 56, 0, 0.6, 1, 2), { tone: "mid", crease: "none" })));
  out.push(ac("rug")(L(k.planOutline({ x: 18, y: 74, w: 68, d: 48, r: 1 }, 0.6, P, 2) + k.planOutline({ x: 22, y: 78, w: 60, d: 40, r: 1 }, 0.6, P, 2), { tone: "lo" })));
  {
    const tx = 26, ty = 76, tw = 48, td = 24, th = 26;
    let t = table(tx, ty, tw, td, th);
    t += ac("paper")(S(box(tx + 12, ty + 5, 18, 13, th, 0.4, 0.3), { tone: "hi", crease: "none" }));
    const rows = [0, 1, 2, 3, 4].map((i) => k.lineOnTop([tx + 14, ty + 7 + i * 2.2], [tx + 28 - (i % 2) * 4, ty + 7 + i * 2.2], th + 0.6, P)).join("");
    t += ac("ink")(a.amDraw(rows, { tone: "hi", period: 3600, free: true }));
    t += ac("glassk")(S(k.cylinder(tx + 36, ty + 7, 2.2, th, 3.6, P, 16), { tone: "mid" }));
    t += ac("ink")(S(k.cylinder(tx + 36.6, ty + 7, 0.35, th + 3.6, 9, P, 8), { tone: "hi" }));
    t += ac("brass")(S(k.cylinder(tx + 6, ty + 6, 3.4, th, 2, P, 20), { tone: "mid" }));
    t += ac("brass")(S(G.sphereOf([tx + 6, ty + 6, th + 5], 3.4, P), { tone: "hi" }));
    t += ac("glass")(S(k.cylinder(tx + 6, ty + 6, 1.8, th + 8, 8, P, 16), { tone: "hi" }));
    t += ac("flame")(S(G.sphereOf([tx + 6, ty + 6, th + 11], 1.2, P), { tone: "hi" }));
    items.push([[tx + tw / 2, ty + td / 2, 0], t]);
    items.push([[tx + 20, ty + td + 10, 0], chair(tx + 20, ty + td + 11, -Math.PI / 2) + person({ x: tx + 20, y: ty + td + 10, seated: true, facing: -Math.PI / 2, coat: "coatA", hair: "hairB", pose: "write" })]);
  }
  out.push(sortItems(items));
  return out.join("");
}

function room1936b() {
  const out = [], items = [];
  out.push(windowOnBack(128, 156, 40, 66, { arch: true }));
  {
    const bx0 = 12, bx1 = 114, bz0 = 42, bz1 = 92;
    out.push(ac("frame")(S(box(bx0 - 3, 0, bx1 - bx0 + 6, 2.2, bz0 - 3, bz1 - bz0 + 6, 0.3), { tone: "mid" })));
    out.push(ac("board")(S(box(bx0, 2.2, bx1 - bx0, 0.5, bz0, bz1 - bz0, 0.2), { tone: "mid", crease: "none" })));
    const M = yMat([bx0 + 7, 2.8, bz1 - 13]);
    const rules = ["q1  0 → 1  R  q2", "q2  1 → 0  L  q1", "q2  _ → _     halt"];
    out.push(texts(M, rules, "hw-chalk", 8, 12.5));
    out.push(`<g transform="${M}"><path class="hw-chalkline" d="M0 32H86M0 -10H40"/></g>`);
    const frames = rules.map((_, i) => `<g transform="${M}"><rect class="hw-box" x="-3.5" y="${(i * 12.5 - 8.6).toFixed(1)}" width="92" height="11.4" rx="2"/></g>`);
    out.push(a.amFlip(frames, { period: 3600 }));
    out.push(ac("frame")(S(box(bx0, 2.2, bx1 - bx0, 4, bz0 - 4, 1.4, 0.3), { tone: "hi" })));
    out.push(ac("paper")(S(box(bx0 + 70, 3, 4, 1.4, bz0 - 2.6, 1, 0.3), { tone: "hi" })));
  }
  {
    const bx = 14, by = 56, bw = 116, bd = 30, bh = 26;
    items.push([[bx + bw / 2, by + bd / 2, 0], table(bx, by, bw, bd, bh, { drawer: false }) + placed(turing, [bx + bw / 2, by + bd / 2, bh], 0.62)]);
    items.push([[146, 96, 0], person({ x: 146, y: 96, facing: Math.PI + 0.55, coat: "coatB", hair: "hairA", pose: "point", lift: "l" })]);
  }
  items.push([[118, 136, 0], ac("desk")(S(k.cylinder(118, 136, 6, 0, 16, P, 24, 0.5), { tone: "mid" })) + ac("paper")(S(box(114, 132, 8, 6, 16, 0.4, 0.3), { tone: "hi", crease: "none" }))]);
  out.push(sortItems(items));
  return out.join("");
}

function room1969b() {
  const out = [], items = [];
  // two minicomputers with their backs to the low wall, facing into the room
  items.push([[16, 86, 0], placedRot(pdp, [16, 86, 0], 0.55, 90)]);
  items.push([[16, 124, 0], placedRot(pdp, [16, 124, 0], 0.55, 90)]);
  const cable = k.onTop([[30, 104], [70, 104], [70, 114], [104, 114]], 0.3, P);
  out.push(ac("dark")(L(cable, { tone: "hi" })));
  {
    const tx = 82, ty = 6, tw = 54, td = 30, th = 26;
    items.push([[tx + tw / 2, ty + td / 2, 0], table(tx, ty, tw, td, th) + terminal(tx + 14, ty + 2, th)]);
    items.push([[tx + 27, ty + td + 14, 0], chair(tx + 27, ty + td + 14, -Math.PI / 2) + person({ x: tx + 27, y: ty + td + 13, seated: true, facing: -Math.PI / 2, coat: "coatC", hair: "hairC", pose: "type" })]);
  }
  items.push([[122, 112, 0], teletype(122, 110)]);
  items.push([[74, 146, 0], person({ x: 74, y: 146, facing: -0.3, coat: "coatA", hair: "hairA", pose: "hold" }) + ac("paper")(`<path d="${poly([[82, 142, 34], [86, 148, 34], [86, 148, 46], [82, 142, 46]])}" style="${flat("top", "lo")}"/>`)]);
  out.push(sortItems(items));
  return out.join("");
}

function roomTodayb() {
  const out = [], items = [];
  // the board of explorations and one decision, on the left wall
  out.push(placedRot(() => board(-42, 40, 34, 96), [0, 68, 0], 1, 90));
  // the desk with the screen at work, against the same wall
  out.push(placedRot(() => table(-28, 2, 56, 30, 26) + workScreen(-26, 2, 26), [0, 140, 0], 1, 90));

  items.push([[44, 62, 0], person({ x: 44, y: 62, facing: Math.PI + 0.45, coat: "coatB", hair: "hairC", pose: "point", lift: "l" }) + `<g class="hw-bub">${a.amFloat(bubble(44, 62, 72, "q"), P, { rise: 3, period: 3600 })}</g>`]);
  items.push([[78, 108, 0], chair(78, 108, Math.PI + 0.5) + person({ x: 78, y: 107, seated: true, facing: Math.PI + 0.5, coat: "coatA", hair: "hairA", pose: "hold" }) + `<g class="hw-bub">${a.amFloat(bubble(78, 107, 66, "d"), P, { rise: 3, period: 3600, delay: 1200 })}</g>`]);
  items.push([[58, 140, 0], person({ x: 58, y: 138, facing: Math.PI - 0.15, coat: "coatC", hair: "hairB", pose: "hold", lift: "l" }) + `<g class="hw-bub">${a.amFloat(bubble(58, 138, 72, "y"), P, { rise: 3, period: 3600, delay: 2400 })}</g>`]);
  {
    const px = 150, py = 150;
    let s = ac("pot")(S(k.cylinder(px, py, 7, 0, 12, P, 24, 0.6), { tone: "mid" }));
    s += ac("leaf")(S(G.sphereOf([px, py, 23], 10, P), { tone: "hi" })) + ac("leaf")(S(G.sphereOf([px - 4, py + 4, 31], 6.6, P), { tone: "hi" }));
    items.push([[px, py, 0], s]);
  }
  out.push(sortItems(items));
  return out.join("");
}

// ---------- assemble the box ----------
const body = [];
const N2 = 2 * Q, C = Q;
body.push(`<path class="iso-halo" d="${k.haloOf({ x: -12, y: -12, w: N2 + 24, d: N2 + 24, r: 8 }, -14, 6, P)}"/>`);
body.push(ac("plinth")(S(box(-4, -4, N2 + 4, N2 + 4, -14, 14, 0.8, 2), { tone: "mid", inner: L(k.sideSeam({ x: -4, y: -4, w: N2 + 4, d: N2 + 4, r: 0.8 }, -7, P, 2), { tone: "faint" }) })));
// quadrants: [key, ox, oy, floor]
const QUADS = [["1843", 0, 0, "fl1843"], ["1936", Q, 0, "fl1936"], ["1969", Q, Q, "fl1969"], ["today", 0, Q, "flToday"]];
for (const [key, ox, oy, fl] of QUADS) {
  const flo = ac(fl)(S(box(ox + 0.5, oy + 0.5, Q - 1, Q - 1, 0, 0.8, 0.2, 2), { tone: "hi", crease: "none" }));
  const ls = [], z = 0.85, x0 = ox + 0.5, x1 = ox + Q - 0.5, y0 = oy + 0.5, y1 = oy + Q - 0.5;
  if (key === "1843") for (let x = ox + 12; x < x1; x += 12) ls.push(k.lineOnTop([x, y0], [x, y1], z, P));
  if (key === "1936") { for (let x = ox + 24; x < x1; x += 24) ls.push(k.lineOnTop([x, y0], [x, y1], z, P)); for (let y = oy + 24; y < y1; y += 24) ls.push(k.lineOnTop([x0, y], [x1, y], z, P)); }
  if (key === "1969") { for (let x = ox + 17; x < x1; x += 17) ls.push(k.lineOnTop([x, y0], [x, y1], z, P)); for (let y = oy + 17; y < y1; y += 17) ls.push(k.lineOnTop([x0, y], [x1, y], z, P)); }
  if (key === "today") for (let y = oy + 10; y < y1; y += 10) ls.push(k.lineOnTop([x0, y], [x1, y], z, P));
  body.push(`<g class="dw-room" data-room="${key}">${flo}${ac(fl)(L(ls.join(""), { tone: "faint" }))}</g>`);
}
// the line of instructions: laid into the floor, from 1843 through a doorway into 1936, through
// another into 1969 and on into today; its marks change with each room it passes
{
  const r = RING, zr = 0.9, w = 3.2, E = 78;
  const route = [[C - E, C - r], [C + r, C - r], [C + r, C + r], [C - E, C + r]];
  const band = [];
  // the band as one flat outline: outer edge out, inner edge back
  const outer = [[C - E, C - r - w], [C + r + w, C - r - w], [C + r + w, C + r + w], [C - E, C + r + w]];
  const inner = [[C - E, C + r - w], [C + r - w, C + r - w], [C + r - w, C - r + w], [C - E, C - r + w]];
  body.push(ac("strip")(`<path d="${k.pathOf([...outer, ...inner].map(([x, y]) => at([x, y, zr])), true)}" style="${flat("top", "lo")}"/>`));
  const room = (x, y) => (x < C ? (y < C ? 0 : 3) : y < C ? 1 : 2);
  const mark = (x, y, along) => {
    const q = room(x, y), p0 = at([x, y, zr + 0.1]);
    const d = along === "x" ? [[x, y - 2.4], [x, y + 2.4]] : [[x - 2.4, y], [x + 2.4, y]];
    if (q === 0) return `<path class="hw-sm0" d="${k.lineOnTop(along === "x" ? [x - 2.4, y] : [x, y - 2.4], along === "x" ? [x + 2.4, y] : [x, y + 2.4], zr + 0.1, P)}"/>`;
    if (q === 1) return `<path class="hw-sm1" d="${k.lineOnTop(d[0], d[1], zr + 0.1, P)}"/>`;
    if (q === 2) return `<circle class="hw-sm2" cx="${p0[0].toFixed(1)}" cy="${p0[1].toFixed(1)}" r=".8"/>`;
    return `<circle class="hw-sm3" cx="${p0[0].toFixed(1)}" cy="${p0[1].toFixed(1)}" r=".9"/>`;
  };
  const marks = [];
  for (let x = C - E + 6; x <= C + r - 6; x += 8) marks.push(mark(x, C - r, "x"));
  for (let y = C - r + 8; y <= C + r - 8; y += 8) marks.push(mark(C + r, y, "y"));
  for (let x = C + r - 6; x >= C - E + 6; x -= 8) marks.push(mark(x, C + r, "x"));
  body.push(marks.join(""));
  const path = k.pathOf(route.map(([x, y]) => at([x, y, zr + 0.2])));
}
// the two outer walls, each room's stretch in its own colour, with skirting
body.push(`<g class="dw-room" data-room="today">${ac("w3")(S(box(-4, Q, 4, Q, 0, WH2, 0.3, 2), { tone: "hi" }))}</g>`);
body.push(`<g class="dw-room" data-room="1843">${ac("w0")(S(box(-4, -4, 4, Q + 4, 0, WH2, 0.3, 2), { tone: "hi" }))}${ac("w0")(S(box(0, -4, Q, 4, 0, WH2, 0.3, 2), { tone: "hi" }))}</g>`);
body.push(`<g class="dw-room" data-room="1936">${ac("w1")(S(box(Q, -4, Q, 4, 0, WH2, 0.3, 2), { tone: "hi" }))}</g>`);
body.push(L(k.segment([0, 0, 0.8], [0, 0, WH2], P), { tone: "lo" }));
body.push(L(faceY(0.1, 0, N2, 0.8, 5) + faceX(0.1, 0, N2, 0.8, 5), { tone: "faint" }));
// low walls of the crossing, in short pieces, with a doorway where the ring passes
const wallPiece = (x, y, w, d) => ac("wall")(S(box(x, y, w, d, 0, PH, 0.4, 2, 0.3), { tone: "hi" })) + ac("frame")(S(box(x - 0.6, y - 0.6, w + 1.2, d + 1.2, PH, 2.2, 0.4, 2), { tone: "mid" }));
const arm = (axis, from, to) => {
  // axis "x": a wall along x at y=C, from x=from to x=to; axis "y": along y at x=C
  const lo = Math.min(from, to), hi = Math.max(from, to);
  return axis === "x" ? wallPiece(lo, C - 2.5, hi - lo, 5) : wallPiece(C - 2.5, lo, 5, hi - lo);
};
const roomSvg = (key, fn, ox, oy) => `<g class="dw-room" data-room="${key}">${placed(fn, [ox, oy, 0], 1)}</g>`;
body.push(roomSvg("1843", room1843b, 0, 0));
body.push(arm("y", 0, C - GAP1), arm("y", C - GAP0, C - 2.5));   // between 1843 and 1936
body.push(arm("x", 0, C - 2.5));   // between 1843 and today: a whole wall, no way through
body.push(ac("wall")(S(box(C - 4, C - 4, 8, 8, 0, PH + 10, 0.6, 2, 0.3), { tone: "hi" })) + ac("frame")(S(box(C - 5, C - 5, 10, 10, PH + 10, 2.4, 0.6, 2), { tone: "mid" })));
body.push(roomSvg("today", roomTodayb, 0, Q));
body.push(roomSvg("1936", room1936b, Q, 0));
body.push(arm("x", C + 2.5, C + GAP0), arm("x", C + GAP1, N2));   // between 1936 and 1969
body.push(arm("y", C + 2.5, C + GAP0), arm("y", C + GAP1, N2));   // between today and 1969
body.push(roomSvg("1969", room1969b, Q, Q));
// era plaques on the floor, by each room's doorway
const plaque = (x, y, t) => `<g transform="${a.planeMatrix([x, y, 0.95], [1, 0, 0], [0, 1, 0], P)}"><text class="hw-era" x="0" y="0" font-size="9">${t}</text></g>`;

// ---------- cameras ----------
function boundsOf(pts) { const f = pts.map(at); const xs = f.map((p) => p[0]), ys = f.map((p) => p[1]); return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)]; }
const ASPECT = 4 / 3;
function cam([x0, y0, x1, y1], pad) {
  let w = x1 - x0 + 2 * pad, h = y1 - y0 + 2 * pad;
  if (w / h < ASPECT) w = h * ASPECT; else h = w / ASPECT;
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
  return [+(cx - w / 2).toFixed(1), +(cy - h / 2).toFixed(1), +w.toFixed(1), +h.toFixed(1)];
}
const qBox = (ox, oy, top) => [[ox, oy, top], [ox + Q, oy, top], [ox, oy + Q, top], [ox + Q, oy + Q, -14], [ox, oy + Q, -14], [ox + Q, oy, -14]];
const focus = (pts, w) => { const [x0, y0, x1, y1] = boundsOf(pts); const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, h = w / ASPECT; return [+(cx - w / 2).toFixed(1), +(cy - h / 2).toFixed(1), +w.toFixed(1), +h.toFixed(1)]; };
const cams = {
  "1843": focus([[10, 0, 96], [166, 0, 96], [26, 124, 0], [166, 40, 0]], 300),
  "1936": focus([[Q + 10, 0, 94], [Q + 160, 0, 70], [Q + 14, 90, 0], [Q + 150, 112, 0]], 300),
  "1969": focus([[Q + 6, Q + 6, 70], [Q + 150, Q + 6, 56], [Q + 60, Q + 160, 0], [Q + 150, Q + 130, 0]], 300),
  today: focus([[0, Q + 28, 96], [0, Q + 168, 70], [90, Q + 120, 0], [130, Q + 60, 0]], 300),
  all: cam(boundsOf([[0, 0, WH2], [N2, 0, WH2], [0, N2, WH2], [N2, N2, -14], [0, N2, -14], [N2, 0, -14]]), 10),
};
const VB = cams.all;

const accents = {
  plinth: "#CFC6B0", wall: "#EFE8D6", w0: "#EFE3CB", w1: "#E9E6D4", w2: "#E3E7E0", w3: "#EEF0E6",
  fl1843: "#D7BF95", fl1936: "#DDD6BC", fl1969: "#CBD2CB", flToday: "#E2D9C3",
  desk: "#B48A5A", paper: "#FBF8EF", glass: "#CFE0DC", frame: "#E7DFCB", rug: "#B9714F",
  bookA: "#6E8F5C", bookB: "#A2593F", bookC: "#3F6B7A", brass: "#C7A15E", iron: "#6F716E", card: "#F3E9CF",
  ink: { hex: "#2C3A30", mode: "ink" }, glassk: "#3C4A44", flame: "#FFD58A", lit: { hex: "#E39A2E", mode: "ink" },
  skin: "#F2DCC2", hairA: "#4A3A2C", hairB: "#2E2A26", hairC: "#9A6A3C", coatA: "#5F8D4E", coatB: "#3F6F86", coatC: "#9B6B4A", trouser: "#3B3A36", shoe: "#2B2926",
  wood: "#A27A4E", blue: "#2F6F8F", tape: "#EFE6CF", steel: "#8A8F92", lamp: { hex: "#F2B84B", mode: "ink" }, board: "#26332C", lampshade: "#4F7044",
  cab: "#E9E2CF", cgreen: "#4F7044", dark: "#3B3A36", reel: "#B9B3A3", screen: "#1F2B25", lampr: { hex: "#E8743B", mode: "ink" },
  white: "#FDFCF8", noteA: "#F3D66B", noteB: "#F2A983", noteC: "#9ED3C4", go: { hex: "#3E8A2E", mode: "ink" },
  alu: "#CFCCC3", bezel: "#2A2E2C", display: "#16201B", mug: "#E6DCC8", pot: "#B9714F", leaf: "#6FA65A", strip: "#F7F2E3",
};
const MONO = "ui-monospace,SFMono-Regular,Menlo,Consolas,monospace";
const css = `
#house .hw-era{font:600 9px ${MONO};letter-spacing:.18em;fill:#6B6A5F;text-transform:uppercase}
#house .hw-chalk{font-family:${MONO};fill:#EDEFE6;opacity:.92}
#house .hw-chalkline{stroke:#EDEFE6;opacity:.45;stroke-width:.5;fill:none}
#house .hw-box{fill:rgba(242,184,75,.16);stroke:#F2B84B;stroke-width:.7}
#house .hw-phos{font-family:${MONO};fill:#9BEA82}
#house .hw-hand{font:600 4.6px ${MONO};fill:#3A4A3E}
#house .hw-marker,#house .hw-ink{fill:none;stroke:#3A4A3E;stroke-width:.45;stroke-linecap:round}
#house .hw-strike{fill:none;stroke:#C2452D;stroke-width:.6;stroke-linecap:round}
#house .hw-tick{fill:none;stroke:#3E8A2E;stroke-width:1.1;stroke-linecap:round;stroke-linejoin:round}
#house .hw-clock{fill:#FBF8EF;stroke:#6F716E;stroke-width:.8}
#house .hw-clock+.hw-hand,#house .hw-minute .hw-hand{stroke:#2C3A30;stroke-width:.8;stroke-linecap:round;fill:none}
#house .hw-minute{animation:hw-turn 12s linear infinite}
#house .hw-dot1{fill:#E8743B}#house .hw-dot2{fill:#F2B84B}#house .hw-dot3{fill:#7FBF5A}
#house .hw-dim{stroke:#3B4A43;stroke-width:.5;stroke-linecap:round;fill:none}
#house .hw-code{stroke:#9FC8F0;stroke-width:1;stroke-linecap:round}
#house .hw-code2{stroke:#9BEA82;stroke-width:1;stroke-linecap:round}
#house .hw-caret{fill:#EDEFE6}
#house .hw-ok{fill:#5FB24A}#house .hw-okm{fill:none;stroke:#0F1A12;stroke-width:.4;stroke-linecap:round}
#house .hw-wait{fill:none;stroke:#556A5E;stroke-width:.4}
#house .hw-pv{fill:#EEF0E6}#house .hw-pvl{stroke:#6E8F5C;stroke-width:.6;stroke-linecap:round}
#house .hw-track{fill:#2B3A31}#house .hw-fill{fill:#5FB24A}
#house .hw-bb{fill:#FFFDF7;stroke:#B9B3A3;stroke-width:.6}
#house .hw-bm{fill:none;stroke:#3F6F3A;stroke-width:1.3;stroke-linecap:round;stroke-linejoin:round}
#house .hw-bd{fill:#3F6F3A}
#house .hw-sm0{stroke:#2C3A30;stroke-width:.7;stroke-linecap:round}
#house .hw-sm1{stroke:#2F6F8F;stroke-width:.5}#house .hw-sm1d{fill:#2F6F8F}
#house .hw-sm2{fill:#3B3A36}
#house .hw-pk{fill:#E4FFD6;filter:drop-shadow(0 0 1.6px #6FB24E)}
@media (prefers-reduced-motion:reduce){#house .dw-pks{display:none}}
#house .dw-room{transition:opacity .8s cubic-bezier(.23,1,.32,1),filter .8s cubic-bezier(.23,1,.32,1)}
#house[data-cur] .dw-room:not(.on){opacity:.3;filter:grayscale(1)}
#house .hw-pk2{fill:#FFD58A;filter:drop-shadow(0 0 1.6px #E8743B)}
#house .hw-flow{fill:none;stroke:#6FB24E;stroke-width:.7;stroke-dasharray:1.4 1.8;opacity:.7}
#house .hw-sm3{fill:#5FB24A;filter:drop-shadow(0 0 1.2px #9BEA82)}
#house .am-step{animation:hw-step var(--am-period) steps(1,end) infinite}
#house .am-step{animation-name:hw-step}
@keyframes hw-step{0%{transform:translate(0,0)}50%{transform:translate(calc(var(--am-dx) * .5),calc(var(--am-dy) * .5))}100%{transform:translate(var(--am-dx),var(--am-dy))}}
#house .am-step{animation:hw-step2 var(--am-period) cubic-bezier(.77,0,.175,1) infinite}
@keyframes hw-step2{0%,55%{transform:translate(0,0)}100%{transform:translate(var(--am-dx),var(--am-dy))}}
#house .am-tap{animation:hw-tap var(--am-period) ease-in-out infinite}
@keyframes hw-tap{0%,18%,48%,100%{transform:translate(0,0)}28%,38%{transform:translate(0,var(--am-dy))}}
#house .am-read{animation:hw-read var(--am-period) steps(1,end) infinite}
@keyframes hw-read{0%,10%{opacity:.25}10%,45%{opacity:1}45%,100%{opacity:.25}}
@keyframes hw-turn{to{transform:rotate(360deg)}}
@media (prefers-reduced-motion:reduce){#house .am-step,#house .am-tap,#house .am-read,#house .hw-minute{animation:none}}
`;
const svg = a.assetSvg({
  width: VB[2], height: VB[3],
  label: "One square house of four rooms around a crossing of low walls, joined by a line of instructions laid in the floor that runs through a doorway into every room: 1843, Ada Lovelace writing Note G while punched cards feed the Analytical Engine; 1936, a tape machine stepping cell by cell while its rule lights up on the blackboard; 1969, minicomputers, a terminal printing a C program and a teletype; today, a team at a board of explorations and one decision, and a screen working on its own.",
  body: minify(body.join("")), paper: PAPER, accents, weight: 0.6, id: "house", css,
}).replace(/viewBox="[^"]*"/, `viewBox="${VB.join(" ")}"`).replace(/ width="[^"]*" height="[^"]*"/, "");
writeFileSync(join(HERE, "box.svg"), svg);
writeFileSync(join(HERE, "box.cams.json"), JSON.stringify(cams));
writeFileSync(join(HERE, "box.html"), a.previewHtml({ title: "box", svg, paper: PAPER, width: 1400 }));
console.log(`wrote box.svg (${(svg.length / 1024).toFixed(0)} KB)`, JSON.stringify(cams));
