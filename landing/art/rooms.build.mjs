// The Konteks room tour: four cutaway rooms in one isometric world, laid out as a diamond.
// 1843 (far), 1936 (right), 1969 (left), Today (near). The page moves a camera (viewBox)
// from room to room; this script writes the world and the camera for each room.
//   node rooms.mjs → rooms.svg, rooms.html, rooms.cams.json
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
const depth = (p) => k.depthOf([p[0], p[1], p[2] ?? 0], W0);
const ac = (name) => (s) => `<g class="ac-${name}">${s}</g>`;
const flat = (fill, edge) => `fill:var(--anatomy-${fill});stroke:var(--anatomy-${edge});stroke-width:var(--anatomy-weight);vector-effect:non-scaling-stroke;stroke-linejoin:round`;
const faceY = (y, x0, x1, z0, z1) => k.pathOf([[x0, y, z0], [x1, y, z0], [x1, y, z1], [x0, y, z1]].map(at), true);
const faceX = (x, y0, y1, z0, z1) => k.pathOf([[x, y0, z0], [x, y1, z0], [x, y1, z1], [x, y0, z1]].map(at), true);
const box = (x, y, w, d, z, h, r = 0.6, steps = 2) => k.slabOf({ x, y, w, d, r }, z, h, P, steps);

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

// ---------- world layout ----------
const R = 100;            // half the floor
const WH = 104;           // wall height
const GAP = 116;
const STEP = 2 * R + GAP;
const ROOMS = [
  { key: "1843", c: [0, 0] },
  { key: "1936", c: [STEP, 0] },
  { key: "1969", c: [0, STEP] },
  { key: "today", c: [STEP, STEP] },
];

// Render `fn` (built around its own origin, at its own scale) at a world point, scaled by f.
function placed(fn, pos, f) {
  const keep = P;
  P = { origin: k.iso(pos, keep), scale: keep.scale * f, azimuth: AZ, elevation: EL };
  const s = fn();
  P = keep;
  return s;
}

// ---------- shared furniture ----------
function table(x, y, w, d, h, { tone = "mid", leg = 2.4 } = {}) {
  const wood = ac("desk");
  const legs = [[x + 2, y + 2], [x + w - 2 - leg, y + 2], [x + 2, y + d - 2 - leg], [x + w - 2 - leg, y + d - 2 - leg]]
    .sort((p, q) => depth([...p, 0]) - depth([...q, 0]))
    .map(([lx, ly]) => S(box(lx, ly, leg, leg, 0, h - 3), { tone: "lo" }));
  return wood(legs.join("") + S(box(x, y, w, d, h - 3, 3, 0.8, 3), { tone, inner: L(k.sideSeam({ x, y, w, d, r: 0.8 }, h - 1.6, P, 3), { tone: "faint" }) }));
}

function person({ x, y, coat = "coatA", seated = false, facing = 0, lift = false }) {
  const skin = ac("skin"), cloth = ac(coat), dark = ac("trouser");
  const out = [];
  out.push(`<path class="iso-halo" d="${k.haloOf({ x: x - 9, y: y - 9, w: 18, d: 18, r: 9 }, 0, 2, P)}"/>`);
  const z0 = seated ? 15 : 0;
  if (!seated) {
    const side = [Math.cos(facing + Math.PI / 2) * 3, Math.sin(facing + Math.PI / 2) * 3];
    const legs = [[x + side[0], y + side[1]], [x - side[0], y - side[1]]].sort((p, q) => depth([...p, 0]) - depth([...q, 0]));
    for (const [lx, ly] of legs) out.push(dark(S(k.cylinder(lx, ly, 2, 0, 22, P, 14), { tone: "lo" })));
  } else {
    const fx = Math.cos(facing) * 8, fy = Math.sin(facing) * 8;
    out.push(dark(S(k.slabOf({ x: x - 4 + fx / 2, y: y - 4 + fy / 2, w: 8, d: 8, r: 2.6 }, 13, 5, P, 3), { tone: "lo" })));
    out.push(dark(S(k.cylinder(x + fx, y + fy, 2, 0, 15, P, 12), { tone: "lo" })));
  }
  const zb = seated ? 16 : 22;
  const F = G.frameOf([x, y, zb], [0, 0, 1], [1, 0, 0], [0, 1, 0]);
  out.push(cloth(S(G.solidOf([[0, 7.5, 1], [6, 8.6, 1], [16, 8, 1], [22, 6.2, 1], [25, 2.4, 1]], F, P), { tone: "hi" })));
  out.push(skin(S(k.cylinder(x, y, 2, zb + 24, 3, P, 12), { tone: "mid" })));
  out.push(skin(S(G.sphereOf([x, y, zb + 33], 6.6, P), { tone: "hi" })));
  if (lift) out.push(cloth(S(k.cylinder(x + Math.cos(facing) * 7, y + Math.sin(facing) * 7, 2, zb + 12, 10, P, 12), { tone: "mid" })));
  return out.join("");
}

function chair(x, y) {
  const wood = ac("desk");
  return wood(S(box(x - 5, y - 5, 10, 10, 0, 13, 1, 3), { tone: "mid" }));
}

function windowB(x, y0, y1, z0, z1, mull = 1) {
  // an arched window on a wall that runs along y (its face at x)
  const glass = ac("glass");
  const cy = (y0 + y1) / 2, rr = (y1 - y0) / 2;
  const pts = [[x, y0, z0], [x, y1, z0], [x, y1, z1]];
  for (let i = 0; i <= 16; i++) { const t = (i / 16) * Math.PI; pts.push([x, cy + Math.cos(t) * rr, z1 + Math.sin(t) * rr]); }
  pts.push([x, y0, z1]);
  const out = [glass(`<path d="${k.pathOf(pts.map(at), true)}" style="${flat("top", "lo")}"/>`)];
  const bars = [k.segment([x, cy, z0], [x, cy, z1 + rr], P)];
  for (let i = 1; i <= mull; i++) { const z = z0 + ((z1 - z0) * i) / (mull + 1); bars.push(k.segment([x, y0, z], [x, y1, z], P)); }
  out.push(L(bars.join(""), { tone: "lo" }));
  // sill
  out.push(ac("wall")(S(box(x, y0 - 2, 3, y1 - y0 + 4, z0 - 2, 2, 0.4), { tone: "hi" })));
  return out.join("");
}

function windowA(y, x0, x1, z0, z1, cols = 3) {
  // a wide window with mullions on a wall that runs along x (face at y)
  const glass = ac("glass");
  const out = [glass(`<path d="${faceY(y, x0, x1, z0, z1)}" style="${flat("top", "lo")}"/>`)];
  const bars = [];
  for (let i = 1; i < cols; i++) { const x = x0 + ((x1 - x0) * i) / cols; bars.push(k.segment([x, y, z0], [x, y, z1], P)); }
  bars.push(k.segment([x0, y, z0 + (z1 - z0) * 0.62], [x1, y, z0 + (z1 - z0) * 0.62], P));
  out.push(L(bars.join(""), { tone: "lo" }));
  out.push(ac("wall")(S(box(x0 - 2, y, x1 - x0 + 4, 3, z0 - 2, 2, 0.4), { tone: "hi" })));
  return out.join("");
}

function shell(cx, cy, floorTone) {
  // floor slab and the two far walls, in world coordinates around (cx, cy)
  const fl = ac("floor"), wall = ac("wall");
  const x0 = cx - R, y0 = cy - R;
  const out = [];
  out.push(`<path class="iso-halo" d="${k.haloOf({ x: x0 - 6, y: y0 - 6, w: 2 * R + 12, d: 2 * R + 12, r: 4 }, -8, 4, P)}"/>`);
  out.push(fl(S(box(x0, y0, 2 * R, 2 * R, -8, 8, 0.8, 2), { tone: floorTone, inner: L(k.sideSeam({ x: x0, y: y0, w: 2 * R, d: 2 * R, r: 0.8 }, -3, P, 2), { tone: "faint" }) })));
  // far walls: the one along y (at x0) and the one along x (at y0)
  out.push(wall(S(box(x0, y0, 4, 2 * R, 0, WH, 0.3), { tone: "hi" })));
  out.push(wall(S(box(x0, y0, 2 * R, 4, 0, WH, 0.3), { tone: "hi" })));
  out.push(L(k.segment([x0 + 4, y0 + 4, 0], [x0 + 4, y0 + 4, WH], P), { tone: "lo" }));
  // skirting
  out.push(L(faceY(y0 + 4, x0 + 4, x0 + 2 * R, 0, 4) + faceX(x0 + 4, y0 + 4, y0 + 2 * R, 0, 4), { tone: "faint" }));
  return out.join("");
}

const floorGrid = (cx, cy, step, tone = "faint", dir = "both") => {
  const x0 = cx - R + 4, y0 = cy - R + 4, x1 = cx + R, y1 = cy + R;
  const ls = [];
  if (dir !== "y") for (let x = x0 + step; x < x1 - 1; x += step) ls.push(k.lineOnTop([x, y0], [x, y1], 0, P));
  if (dir !== "x") for (let y = y0 + step; y < y1 - 1; y += step) ls.push(k.lineOnTop([x0, y], [x1, y], 0, P));
  return L(ls.join(""), { tone });
};

const sortItems = (items) => items.sort((p, q) => depth(p[0]) - depth(q[0])).map(([, s]) => s).join("");

// ======================================================================================
// 1843: Ada at a writing desk, Note G on the page, the Analytical Engine's mill behind.
// ======================================================================================
function room1843(cx, cy) {
  const out = [shell(cx, cy, "mid")];
  const x0 = cx - R, y0 = cy - R;
  out.push(floorGrid(cx, cy, 14, "faint", "x"));
  out.push(windowB(x0 + 4, cy - 66, cy - 30, 34, 66));
  // a row of pinned sheets on the far wall
  const sheets = [];
  for (let i = 0; i < 5; i++) { const sx = x0 + 100 + i * 13; sheets.push(ac("paper")(`<path d="${faceY(y0 + 4.2, sx, sx + 10, 62, 82)}" style="${flat("top", "lo")}"/>`)); sheets.push(L([0, 1, 2].map((j) => k.segment([sx + 2, y0 + 4.3, 77 - j * 4], [sx + 8 - j, y0 + 4.3, 77 - j * 4], P)).join(""), { tone: "faint", free: true })); }
  out.push(sheets.join(""));
  const items = [];
  // bookshelf against the far wall
  {
    const bx = x0 + 34, by = y0 + 4, bw = 34, bd = 14, bh = 78;
    const sh = [ac("desk")(S(box(bx, by, bw, bd, 0, bh, 0.5), { tone: "mid" }))];
    const books = [];
    for (let r = 0; r < 4; r++) {
      const z = 6 + r * 18;
      sh.push(L(faceY(by + bd, bx + 2, bx + bw - 2, z, z + 15), { tone: "lo" }));
      for (let i = 0; i < 9; i++) { const xx = bx + 3 + i * 3.3; const hh = 10 + ((i * 7 + r * 3) % 5); books.push(ac(i % 3 === 0 ? "bookA" : i % 3 === 1 ? "bookB" : "bookC")(`<path d="${faceY(by + bd + 0.1, xx, xx + 2.6, z, z + hh)}" style="${flat("top", "mid")}"/>`)); }
    }
    items.push([[bx + bw / 2, by + bd / 2, 0], sh.join("") + books.join("")]);
  }
  // the mill: three columns of stacked figure wheels on a plinth
  {
    const mx = cx + 46, my = cy - 40;
    const m = [ac("brass")(S(box(mx - 30, my - 12, 60, 24, 0, 6, 1, 3), { tone: "mid" }))];
    const cols = [[-18, 0], [0, 0], [18, 0]].sort((p, q) => depth([mx + p[0], my + p[1], 0]) - depth([mx + q[0], my + q[1], 0]));
    for (const [dx, dy] of cols) {
      m.push(ac("steel")(S(k.cylinder(mx + dx, my + dy, 1.2, 6, 60, P, 10), { tone: "mid" })));
      for (let i = 0; i < 9; i++) m.push(ac("brass")(S(k.cylinder(mx + dx, my + dy, 6.4, 9 + i * 6, 3.2, P, 28, 0.4), { tone: "hi", inner: L(k.sideArc(mx + dx, my + dy, 6.4, 10.6 + i * 6, P, 24), { tone: "faint" }) })));
    }
    m.push(ac("brass")(S(box(mx - 30, my - 12, 60, 24, 66, 4, 1, 3), { tone: "mid" })));
    // a column of wheels turns: a glint walks up the middle column
    m.push(a.amBlink(D(Array.from({ length: 9 }, (_, i) => at([mx, my + 6.4, 10.6 + i * 6])), { size: 0.9, tone: "lit" }), { period: 2600, min: 0.2 }));
    items.push([[mx, my, 0], m.join("")]);
  }
  // rug, desk, chair, Ada
  out.push(ac("rug")(S(box(cx - 62, cy + 2, 70, 52, 0, 0.8, 1, 2), { tone: "mid", crease: "none" })));
  out.push(ac("rug")(L(k.planOutline({ x: cx - 58, y: cy + 6, w: 62, d: 44, r: 1 }, 0.8, P, 2), { tone: "lo" })));
  {
    const tx = cx - 52, ty = cy + 6, tw = 46, td = 24, th = 26;
    let t = table(tx, ty, tw, td, th);
    // the page and Note G being written
    const pz = th + 0.2;
    t += ac("paper")(S(box(tx + 10, ty + 5, 18, 13, th, 0.4, 0.3), { tone: "hi", crease: "none" }));
    const rows = [0, 1, 2, 3, 4].map((i) => k.lineOnTop([tx + 12, ty + 7 + i * 2.2], [tx + 26 - (i % 2) * 4, ty + 7 + i * 2.2], pz + 0.3, P)).join("");
    t += ac("ink")(a.amDraw(rows, { tone: "hi", period: 7000, free: true }));
    t += ac("glassk")(S(k.cylinder(tx + 36, ty + 8, 2.4, th, 4, P, 16), { tone: "mid" }));
    t += ac("ink")(S(k.cylinder(tx + 37, ty + 8, 0.4, th + 4, 9, P, 8), { tone: "hi" }));
    items.push([[tx + tw / 2, ty + td / 2, 0], t]);
    items.push([[tx + 20, ty + td + 10, 0], chair(tx + 20, ty + td + 10) + person({ x: tx + 20, y: ty + td + 10, seated: true, facing: -Math.PI / 2, coat: "coatA" })]);
  }
  out.push(sortItems(items));
  return out.join("");
}

// ======================================================================================
// 1936: a tape and its rules. The rules on a blackboard; the machine on a long bench.
// ======================================================================================
function turing() {
  const wood = ac("wood"), blue = ac("blue"), steel = ac("steel"), tape = ac("tape");
  const BASE = { x: -76, y: -18, w: 152, d: 36, r: 3 };
  const ZB = 8, AX = 30, SX = 58, FL = 15, WOUND = 11;
  const nearY = 1;
  const out = [];
  for (const [x, y] of k.corners(BASE, 7).sort((p, q) => depth([...p, 0]) - depth([...q, 0]))) out.push(wood(S(k.cylinder(x, y, 3.6, 0, 3, P, 18), { tone: "lo" })));
  out.push(wood(S(k.slabOf(BASE, 3, ZB - 3, P, 4, 1), { tone: "mid" })));
  const upright = (x, y) => steel(S(k.slabOf({ x: x - 3, y: y - 1.2, w: 6, d: 2.4, r: 0.8 }, ZB, AX + 4 - ZB, P, 3, 0.3), { tone: "mid" }));
  const flange = (x, y) => { const F = G.frameAlong([x, y, AX], [0, 1, 0]); return steel(S(G.disc(0, 1.4, FL, F, P), { tone: "hi", crease: "lo" })); };
  const core = (x) => { const F = G.frameAlong([x, -8, AX], [0, 1, 0]); return tape(S(G.disc(0, 16, WOUND, F, P), { tone: "hi", crease: "lo" })); };
  for (const x of [-SX, SX]) out.push(upright(x, -11));
  for (const x of [-SX, SX]) out.push(flange(x, -9.4));
  for (const x of [-SX, SX]) out.push(core(x));
  const TZ = AX + WOUND, CELL = 8.4;
  out.push(tape(S(k.slabOf({ x: -SX, y: -7, w: 2 * SX, d: 14, r: 0.2 }, TZ, 0.5, P, 2), { tone: "hi", crease: "faint" })));
  const marks = [];
  const pattern = "1101001101011100101101001";
  for (let i = -6; i <= 6; i++) {
    const x = i * CELL;
    marks.push(L(k.lineOnTop([x, -7], [x, 7], TZ + 0.5, P), { tone: "lo" }));
    if (pattern[(i + 12) % pattern.length] === "1") marks.push(L(k.lineOnTop([x + CELL / 2, -3], [x + CELL / 2, 3], TZ + 0.5, P), { tone: "mid" }));
    else marks.push(L(k.ring(x + CELL / 2, 0, 2.2, TZ + 0.5, P, 16), { tone: "mid" }));
  }
  out.push(a.amLoop(marks.join(""), [CELL, 0, 0], P, { period: 2600 }));
  const H = { x: -11, y: -14, w: 22, d: 28, r: 2 };
  out.push(blue(S(k.slabOf(H, TZ + 3, 16, P, 4, 0.8), { tone: "hi" })));
  out.push(blue(S(k.slabOf({ x: -5, y: -5, w: 10, d: 10, r: 1.4 }, TZ + 0.6, 2.4, P, 3), { tone: "mid" })));
  out.push(D([at([-3, H.y + H.d, TZ + 12]), at([0, H.y + H.d, TZ + 12]), at([3, H.y + H.d, TZ + 12])], { size: 0.7, tone: "hi" }));
  out.push(steel(S(k.cylinder(0, 0, 3, TZ + 19, 5, P, 20, 0.4), { tone: "mid" })));
  for (const x of [-SX, SX]) out.push(flange(x, 8));
  for (const x of [-SX, SX]) out.push(upright(x, nearY * 11));
  return out.join("");
}

function room1936(cx, cy) {
  const out = [shell(cx, cy, "mid")];
  const x0 = cx - R, y0 = cy - R;
  out.push(floorGrid(cx, cy, 25, "faint"));
  out.push(windowB(x0 + 4, cy - 52, cy - 18, 38, 66));
  // the blackboard with the rules
  {
    const bx0 = x0 + 64, bx1 = x0 + 176, bz0 = 40, bz1 = 90, y = y0 + 4;
    out.push(ac("wall")(S(box(bx0 - 3, y, bx1 - bx0 + 6, 2.4, bz0 - 3, bz1 - bz0 + 6, 0.3), { tone: "mid" })));
    out.push(ac("board")(S(box(bx0, y + 2.4, bx1 - bx0, 0.6, bz0, bz1 - bz0, 0.2), { tone: "mid", crease: "none" })));
    const M = a.planeMatrix([bx0 + 8, y + 3.1, bz1 - 12], [1, 0, 0], [0, 0, -1], P);
    const rules = ["q1  0 → 1  R  q2", "q2  1 → 0  L  q1", "q2  _ → _  halt"];
    out.push(ac("chalk")(`<g transform="${M}">${rules.map((r, i) => `<text class="dw-rule" x="0" y="${i * 12}" font-size="8.2">${r}</text>`).join("")}<path class="dw-chalk" d="M0 30H86" /></g>`));
    out.push(ac("wall")(S(box(bx0, y + 2.4, bx1 - bx0, 4, bz0 - 4, 1.4, 0.3), { tone: "hi" })));
  }
  const items = [];
  {
    const bx = cx - 66, by = cy - 6, bw = 116, bd = 30, bh = 26;
    items.push([[bx + bw / 2, by + bd / 2, 0], table(bx, by, bw, bd, bh, { tone: "mid" }) + placed(turing, [bx + bw / 2, by + bd / 2, bh], 0.62)]);
    items.push([[bx + 8, by + bd + 22, 0], person({ x: bx + 26, y: by + bd + 26, facing: -Math.PI / 2, coat: "coatB", lift: true })]);
  }
  // a stool and a mug
  items.push([[cx + 66, cy + 52, 0], ac("desk")(S(k.cylinder(cx + 66, cy + 52, 6, 0, 16, P, 24, 0.5), { tone: "mid" }))]);
  out.push(sortItems(items));
  return out.join("");
}

// ======================================================================================
// 1969: Unix and C. A minicomputer, a teletype, two people working.
// ======================================================================================
function pdp() {
  const cab = ac("cab"), green = ac("cgreen"), dark = ac("dark"), reel = ac("reel");
  const C = { x: -32, y: -20, w: 64, d: 40, r: 2.4 };
  const FY = C.y + C.d, s = 1;
  const out = [];
  out.push(dark(S(k.slabOf(k.insetPlan(C, 2), 0, 5, P, 3), { tone: "lo" })));
  out.push(cab(S(k.slabOf(C, 5, 120, P, 3, 0.8), { tone: "mid", inner: L([30, 96].map((z) => k.sideSeam(C, z, P, 3)).join(""), { tone: "faint" }) })));
  out.push(L(Array.from({ length: 6 }, (_, i) => faceY(FY, -24, 24, 9 + i * 3.4, 10.4 + i * 3.4)).join(""), { tone: "lo" }));
  out.push(dark(S(k.slabOf({ x: -28, y: FY, w: 56, d: 0.6, r: 0.4 }, 34, 58, P, 2), { tone: "lo" })));
  const RZ = 72, RR = 11.5;
  for (const x of [-13.5, 13.5]) {
    const F = G.frameAlong([x, FY, RZ], [0, s, 0]);
    out.push(reel(S(G.disc(0, 1.6, RR, F, P), { tone: "hi", crease: "lo" })));
    const hub = `<circle r="3.4" style="${flat("shade-0", "mid")}"/>` + [0, 1, 2].map((i) => { const t = (i * 2 * Math.PI) / 3; return `<path d="M${(Math.cos(t - 0.42) * 5).toFixed(2)},${(Math.sin(t - 0.42) * 5).toFixed(2)}L${(Math.cos(t - 0.3) * 9.6).toFixed(2)},${(Math.sin(t - 0.3) * 9.6).toFixed(2)}L${(Math.cos(t + 0.3) * 9.6).toFixed(2)},${(Math.sin(t + 0.3) * 9.6).toFixed(2)}L${(Math.cos(t + 0.42) * 5).toFixed(2)},${(Math.sin(t + 0.42) * 5).toFixed(2)}Z" style="${flat("shade-1", "lo")}"/>`; }).join("");
    out.push(reel(a.amSpin(hub, a.planeMatrix([x, FY + 1.6, RZ], [1, 0, 0], [0, 0, -1], P), { period: 5200, reverse: x > 0 })));
  }
  out.push(L(faceY(FY, -28, 28, 98, 120), { tone: "lo" }));
  const lamps = [], sw = [];
  for (let i = 0; i < 16; i++) {
    const x = -24 + i * 3.2;
    lamps.push(at([x + 0.6, FY, 114]));
    const paths = k.slabOf({ x: x - 0.8, y: FY, w: 1.8, d: 3.2, r: 0.4 }, 102 + (i % 3 === 0 ? 1.4 : 0), 4.2, P, 2);
    sw.push(Math.floor(i / 3) % 2 ? green(S(paths, { tone: "hi" })) : cab(S(paths, { tone: "hi" })));
  }
  out.push(a.amBlink(D(lamps.filter((_, i) => i % 2), { size: 0.8, tone: "hi" }), { period: 1800 }));
  out.push(D(lamps.filter((_, i) => !(i % 2)), { size: 0.8, tone: "lo" }));
  out.push(sw.join(""));
  return out.join("");
}

function teletype(x, y) {
  // a desk-height teletype: a cabinet, a keyboard shelf, a roll of paper feeding up
  const cab = ac("cab"), paper = ac("paper");
  const out = [];
  out.push(cab(S(box(x - 16, y - 12, 32, 24, 0, 24, 1, 3), { tone: "mid" })));
  out.push(cab(S(box(x - 16, y - 12, 32, 16, 24, 10, 2, 3), { tone: "hi" })));
  out.push(cab(S(box(x - 14, y + 4, 28, 10, 24, 3, 1, 2), { tone: "mid" })));
  const keys = [];
  for (let r = 0; r < 2; r++) for (let c = 0; c < 8; c++) keys.push(k.planOutline({ x: x - 12 + c * 3.1, y: y + 5.6 + r * 3.4, w: 2.4, d: 2.6, r: 0.4 }, 27, P, 2));
  out.push(L(keys.join(""), { tone: "lo" }));
  // paper sheet rising from the platen, its lines scrolling up
  const py = y - 6;
  out.push(paper(S(box(x - 10, py, 20, 0.6, 34, 22, 0.2), { tone: "hi", crease: "none" })));
  const lines = [];
  for (let i = 0; i < 8; i++) lines.push(k.segment([x - 8, py + 0.7, 36 + i * 3], [x + 4 - (i % 3) * 3, py + 0.7, 36 + i * 3], P));
  out.push(`<g class="dw-tty">${a.amLoop(L(lines.join(""), { tone: "lo", free: true }), [0, 0, 3], P, { period: 1500 })}</g>`);
  return out.join("");
}

function room1969(cx, cy) {
  const out = [shell(cx, cy, "mid")];
  const x0 = cx - R, y0 = cy - R;
  out.push(floorGrid(cx, cy, 20, "faint"));
  // a printout pinned to the side wall
  out.push(ac("paper")(`<path d="${faceX(x0 + 4.2, cy - 60, cy - 36, 46, 80)}" style="${flat("top", "lo")}"/>`));
  out.push(L(Array.from({ length: 7 }, (_, i) => k.segment([x0 + 4.3, cy - 57, 75 - i * 4], [x0 + 4.3, cy - 40 - (i % 3) * 3, 75 - i * 4], P)).join(""), { tone: "faint", free: true }));
  const items = [];
  items.push([[x0 + 44, y0 + 22, 0], placed(pdp, [x0 + 44, y0 + 24, 0], 0.62)]);
  items.push([[x0 + 90, y0 + 22, 0], placed(pdp, [x0 + 90, y0 + 24, 0], 0.62)]);
  // a desk with a video terminal and a teletype by the side wall
  {
    const tx = x0 + 10, ty = cy - 6, tw = 34, td = 54, th = 26;
    let t = table(tx, ty, tw, td, th);
    const vt = ac("cab");
    t += vt(S(box(tx + 6, ty + 14, 20, 22, th, 18, 2, 3), { tone: "mid" }));
    t += ac("screen")(`<path d="${faceX(tx + 26, ty + 17, ty + 33, th + 4, th + 15)}" style="${flat("top", "lo")}"/>`);
    t += ac("phos")(a.amBlink(L(k.segment([tx + 26.2, ty + 19, th + 12], [tx + 26.2, ty + 28, th + 12], P) + k.segment([tx + 26.2, ty + 19, th + 9], [tx + 26.2, ty + 24, th + 9], P), { tone: "lit", free: true }), { period: 1400, min: 0.3 }));
    items.push([[tx + tw / 2, ty + td / 2, 0], t]);
    items.push([[tx + tw + 16, ty + td / 2, 0], chair(tx + tw + 14, ty + td / 2 - 2) + person({ x: tx + tw + 14, y: ty + td / 2 - 2, seated: true, facing: Math.PI, coat: "coatC" })]);
  }
  items.push([[cx + 52, cy + 18, 0], teletype(cx + 52, cy + 12)]);
  items.push([[cx + 6, cy + 40, 0], person({ x: cx + 6, y: cy + 40, facing: -Math.PI / 2 - 0.4, coat: "coatA", lift: true })]);
  out.push(sortItems(items));
  return out.join("");
}

// ======================================================================================
// Today: a team and its agents. People talk around one table; in the corner the agents
// (a chip at work) take what they agree on, and light runs between the two.
// ======================================================================================
function chip() {
  const sub = ac("sub"), pin = ac("pin"), die = ac("die"), ink = ac("cink"), core = ac("core");
  const out = [];
  const SUB = { x: -42, y: -42, w: 84, d: 84, r: 3 };
  const pins = [];
  const N = 9, step = 8, start = -((N - 1) * step) / 2;
  for (const [ax, sign] of [["x", 1], ["x", -1], ["y", 1], ["y", -1]]) {
    for (let i = 0; i < N; i++) {
      const t = start + i * step, edge = 42 * sign;
      const mk = (o0, o1, z0, z1) => { const lo = Math.min(o0, o1), hi = Math.max(o0, o1); return ax === "x" ? { x: lo, y: t - 1.6, w: hi - lo, d: 3.2, r: 0.4, z0, z1 } : { x: t - 1.6, y: lo, w: 3.2, d: hi - lo, r: 0.4, z0, z1 }; };
      const parts = [mk(edge, edge + sign * 6, 5.2, 6.6), mk(edge + sign * 4.6, edge + sign * 6.2, 1.2, 5.2), mk(edge + sign * 4.6, edge + sign * 10, 0, 1.2)];
      const key = ax === "x" ? [edge + sign * 6, t, 3] : [t, edge + sign * 6, 3];
      pins.push({ key, svg: parts.map((q) => pin(S(k.slabOf(q, q.z0, q.z1 - q.z0, P, 2), { tone: "mid" }))).join("") });
    }
  }
  pins.sort((p, q) => depth(p.key) - depth(q.key));
  const far = pins.filter((p) => depth(p.key) < depth([0, 0, 3])), near = pins.filter((p) => depth(p.key) >= depth([0, 0, 3]));
  far.forEach((p) => out.push(p.svg));
  out.push(sub(S(k.slabOf(SUB, 4, 5, P, 3, 0.8), { tone: "hi" })));
  const DIE = k.insetPlan(SUB, 17);
  out.push(a.amPulse(core(`<path d="${k.haloOf(k.insetPlan(DIE, -8), 9, 6, P)}" style="fill:var(--anatomy-top);filter:blur(6px)"/>`), { period: 3200, min: 0.35 }));
  out.push(die(S(k.slabOf(DIE, 9, 4.5, P, 4, 0.9), { tone: "mid" })));
  const zt = 13.5;
  const traces = [
    [[0, -6], [0, -14], [8, -14], [8, -22]], [[6, 0], [14, 0], [14, 8], [22, 8]], [[0, 6], [0, 12], [-10, 12], [-10, 22]], [[-6, 0], [-16, 0], [-16, -10], [-22, -10]],
    [[-6, -6], [-12, -12], [-12, -20]], [[6, 6], [12, 12], [20, 12]],
  ];
  const tr = traces.map((pts) => k.onTop(pts, zt, P)).join("");
  out.push(ink(L(tr, { tone: "lit", free: true })));
  const packet = (pts3, inward, dur, delay) => `<circle r="1.1" class="dw-pk"><animateMotion dur="${dur}s" begin="${-delay}s" repeatCount="indefinite" calcMode="linear" keyPoints="${inward ? "1;0" : "0;1"}" keyTimes="0;1" path="${k.pathOf(pts3.map(at))}"/></circle>`;
  out.push(`<g class="dw-pks">${[[0, false, 2.2, 0], [1, true, 2.6, 0.9], [2, false, 2.4, 1.6], [3, true, 2.0, 0.4]].map(([i, inw, dur, dl]) => packet(traces[i].map((q) => [...q, zt + 0.2]), inw, dur, dl)).join("")}</g>`);
  const C = { x: -6, y: -6, w: 12, d: 12, r: 1.2 };
  out.push(core(S(k.slabOf(C, zt, 1, P, 2), { tone: "hi", lit: true })));
  near.forEach((p) => out.push(p.svg));
  return out.join("");
}

function bubble(x, y, z, kind) {
  // a small speech balloon in the vertical plane facing the viewer, floating
  const V = G.viewOf(W0);
  const l = Math.hypot(V[0], V[1]);
  const u = [V[1] / l, -V[0] / l, 0];
  const M = a.planeMatrix([x, y, z], u, [0, 0, -1], P);
  const mark = kind === "q" ? `<path class="dw-bm" d="M-2.2 -3.6C-2.2 -6.2 2.4 -6.2 2.4 -3.6C2.4 -1.8 0 -1.6 0 0.4"/><circle class="dw-bd" cx="0" cy="2.6" r=".8"/>`
    : kind === "y" ? `<path class="dw-bm" d="M-3.4 -0.6L-1 2L3.6 -3.4"/>`
    : `<circle class="dw-bd" cx="-3" cy="0" r=".9"/><circle class="dw-bd" cx="0" cy="0" r=".9"/><circle class="dw-bd" cx="3" cy="0" r=".9"/>`;
  const body = `<g transform="${M}"><path class="dw-bb" d="M-8 -7H8Q10 -7 10 -5V4Q10 6 8 6H-1L-4 9.5L-4.6 6H-8Q-10 6 -10 4V-5Q-10 -7 -8 -7Z"/>${mark}</g>`;
  return body;
}

function roomToday(cx, cy) {
  const out = [shell(cx, cy, "mid")];
  const x0 = cx - R, y0 = cy - R;
  out.push(floorGrid(cx, cy, 10, "faint", "y"));
  out.push(windowA(y0 + 4, x0 + 30, x0 + 168, 26, 88, 4));
  const items = [];
  // the agents: a chip at work on a low plinth in the corner, a lit trace on the floor
  const ax = x0 + 36, ay = cy + 6;
  {
    let s = ac("plinth")(S(box(ax - 22, ay - 22, 44, 44, 0, 8, 2, 3), { tone: "mid" }));
    s += placed(chip, [ax, ay, 8], 0.4);
    items.push([[ax, ay, 0], s]);
  }
  // the light path from the table to the chip, on the floor
  const tx = cx + 14, ty = cy + 14;
  const route = [[ax + 22, ay + 4, 0.3], [tx - 30, ay + 4, 0.3], [tx - 30, ty, 0.3]];
  out.push(ac("cink")(L(k.pathOf(route.map(at)), { tone: "lit", free: true })));
  out.push(ac("cink")(`<g class="dw-pks">${[0, 1.1, 2.2].map((dl, i) => `<circle r="1.3" class="dw-pk"><animateMotion dur="3.3s" begin="${-dl}s" repeatCount="indefinite" calcMode="linear" keyPoints="${i === 1 ? "0;1" : "1;0"}" keyTimes="0;1" path="${k.pathOf(route.map(at))}"/></circle>`).join("")}</g>`));
  // a plant by the window
  {
    const px = cx + 72, py = y0 + 26;
    let s = ac("pot")(S(k.cylinder(px, py, 7, 0, 12, P, 24, 0.6), { tone: "mid" }));
    s += ac("leaf")(S(G.sphereOf([px, py, 24], 11, P), { tone: "hi" }));
    s += ac("leaf")(S(G.sphereOf([px - 4, py + 5, 33], 7, P), { tone: "hi" }));
    items.push([[px, py, 0], s]);
  }
  // the table and the team
  {
    const tw = 48, td = 30, th = 26;
    let t = table(tx - tw / 2, ty - td / 2, tw, td, th, { tone: "hi" });
    t += ac("paper")(S(box(tx - 7, ty - 5, 14, 10, th, 0.4, 0.3), { tone: "hi", crease: "none" }));
    t += L([0, 1, 2].map((i) => k.lineOnTop([tx - 5, ty - 3 + i * 2.6], [tx + 4 - i * 2, ty - 3 + i * 2.6], th + 0.5, P)).join(""), { tone: "lo", free: true });
    t += ac("mug")(S(k.cylinder(tx + 14, ty + 6, 2.6, th, 5, P, 16), { tone: "hi" }));
    items.push([[tx, ty, 0], t]);
    const people = [
      { x: tx - 8, y: ty - td / 2 - 14, facing: Math.PI / 2, coat: "coatA", b: "q", dz: 0 },
      { x: tx + tw / 2 + 12, y: ty - 2, facing: Math.PI, coat: "coatB", b: "y", dz: 1.4 },
      { x: tx - 6, y: ty + td / 2 + 16, facing: -Math.PI / 2, coat: "coatC", b: "d", dz: 0.7, seated: true },
    ];
    for (const p of people) {
      let s = (p.seated ? chair(p.x, p.y) : "") + person(p);
      const bz = (p.seated ? 16 : 22) + 50;
      s += `<g class="dw-bub">${a.amFloat(bubble(p.x, p.y, bz, p.b), P, { rise: 3, period: 3600, delay: p.dz * 1000 })}</g>`;
      items.push([[p.x, p.y, 0], s]);
    }
  }
  out.push(sortItems(items));
  return out.join("");
}

// ---------- assemble ----------
const builders = { "1843": room1843, "1936": room1936, "1969": room1969, today: roomToday };
const order = [...ROOMS].sort((p, q) => depth([...p.c, 0]) - depth([...q.c, 0]));
const labelOf = { "1843": "1843", "1936": "1936", "1969": "1969", today: "Today" };
const body = [];
for (const r of order) {
  const [cx, cy] = r.c;
  const g = builders[r.key](cx, cy);
  // era label on the floor in front of the room
  const lp = at([cx + R + 14, cy + R + 14, -8]);
  body.push(`<g class="dw-room" data-room="${r.key}">${g}</g>`);
}
for (const r of order) { const [cx, cy] = r.c; const lp = at([cx + R, cy + R, -8]); body.push(`<text class="dw-era" data-room="${r.key}" x="${lp[0].toFixed(1)}" y="${(lp[1] + 26).toFixed(1)}" text-anchor="middle">${labelOf[r.key]}</text>`); }

// cameras: bounds of each room (floor, walls, label) in screen units, padded to 4:3
function boundsOf(pts) { const f = pts.map(at); const xs = f.map((p) => p[0]), ys = f.map((p) => p[1]); return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)]; }
const ASPECT = 4 / 3;
function cam([x0, y0, x1, y1], pad) {
  let w = x1 - x0 + 2 * pad, h = y1 - y0 + 2 * pad;
  if (w / h < ASPECT) w = h * ASPECT; else h = w / ASPECT;
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
  return [+(cx - w / 2).toFixed(1), +(cy - h / 2).toFixed(1), +w.toFixed(1), +h.toFixed(1)];
}
const roomPts = ([cx, cy]) => [[cx - R, cy - R, WH], [cx + R, cy - R, WH], [cx - R, cy + R, WH], [cx + R, cy + R, -8], [cx - R, cy + R, -8], [cx + R, cy - R, -8]];
const cams = {};
for (const r of ROOMS) cams[r.key] = cam(boundsOf(roomPts(r.c)), 6);
const all = boundsOf(ROOMS.flatMap((r) => roomPts(r.c)));
cams.all = cam([all[0], all[1], all[2], all[3] + 30], 14);
const VB = cams.all;

const accents = {
  floor: "#D8CFB8", wall: "#EFE8D6", desk: "#B48A5A", paper: "#FBF8EF", glass: "#CFE0DC", rug: "#B9714F",
  bookA: "#6E8F5C", bookB: "#A2593F", bookC: "#3F6B7A", brass: "#C7A15E", steel: "#8A8F92", ink: { hex: "#2C3A30", mode: "ink" }, glassk: "#3C4A44",
  skin: "#F4E9D8", coatA: "#5F8D4E", coatB: "#3F6F86", coatC: "#9B6B4A", trouser: "#3B3A36",
  wood: "#A27A4E", blue: "#2F6F8F", tape: "#EFE6CF", board: "#26332C", chalk: { hex: "#EDEFE6", mode: "ink" },
  cab: "#E9E2CF", cgreen: "#4F7044", dark: "#3B3A36", reel: "#B9B3A3", screen: "#22302A", phos: { hex: "#8FE07A", mode: "ink" },
  sub: "#5F8D4E", pin: "#4A4339", die: "#1E2621", core: "#C9F5B6", cink: { hex: "#6FB24E", mode: "ink" }, plinth: "#DAD4C2",
  pot: "#B9714F", leaf: "#6FA65A", mug: "#E6DCC8",
};
const css = `
#rooms .dw-era{font:500 17px/1 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.12em;fill:var(--anatomy-mid);text-transform:uppercase}
#rooms .dw-rule{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;fill:#EDEFE6;opacity:.92}
#rooms .dw-chalk{stroke:#EDEFE6;opacity:.5;stroke-width:.6;fill:none}
#rooms .dw-pk{fill:#E4FFD6;filter:drop-shadow(0 0 1.6px #9BEA82)}
#rooms .dw-bb{fill:#FFFDF7;stroke:var(--anatomy-lo);stroke-width:var(--anatomy-weight);vector-effect:non-scaling-stroke}
#rooms .dw-bm{fill:none;stroke:#3F6F3A;stroke-width:1.3;stroke-linecap:round;stroke-linejoin:round}
#rooms .dw-bd{fill:#3F6F3A}
#rooms .dw-room{transition:opacity .7s cubic-bezier(.23,1,.32,1)}
#rooms[data-cur] .dw-room{opacity:.28}
#rooms[data-cur] .dw-room.on{opacity:1}
#rooms[data-cur] .dw-era{opacity:0}
@media (prefers-reduced-motion:reduce){#rooms .dw-pks{display:none}}
`;
const svg = a.assetSvg({
  width: VB[2], height: VB[3], label: "A short history of telling machines what to do, in four rooms: 1843, Ada Lovelace writing Note G beside the Analytical Engine; 1936, a tape machine and its rules on a blackboard; 1969, a minicomputer, a terminal and a teletype; today, a team talking around one table while a chip in the corner does the work.",
  body: minify(body.join("")), paper: PAPER, accents, weight: 0.6, id: "rooms", css,
}).replace(/viewBox="[^"]*"/, `viewBox="${VB.join(" ")}"`).replace(/ width="[^"]*" height="[^"]*"/, "");
writeFileSync(join(HERE, "rooms.svg"), svg);
writeFileSync(join(HERE, "rooms.cams.json"), JSON.stringify(cams));
writeFileSync(join(HERE, "rooms.html"), a.previewHtml({ title: "rooms", svg, paper: PAPER, width: 1100 }));
console.log(`wrote rooms.svg (${(svg.length / 1024).toFixed(0)} KB)`, JSON.stringify(cams));
