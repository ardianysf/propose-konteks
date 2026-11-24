// Background objects for the 1936, 1969 and Today eras of the Konteks landing page.
// Same camera as the Babbage Mill; quiet, meant to sit behind each scene's own content.
//   node eras.mjs → turing.svg, pdp.svg, laptop.svg (+ .html)
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as k from "../../kit/iso-kit.mjs";
import * as a from "../../kit/asset.mjs";
import * as G from "../../kit/lathe.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const PAPER = "#F6F3EA";
const AZ = 58, EL = 32;
let P;
const at = (p) => k.iso(p, P);
const S = (paths, style) => k.solidSvg(paths, style);
const L = (d, style) => k.lineSvg(d, style);
const D = (pts, style) => k.dotsSvg(pts, style);
const depth = (p) => k.depthOf([p[0], p[1], p[2] ?? 0], P);
const byDepth = (items, key = (i) => i) => [...items].sort((p, q) => depth(key(p)) - depth(key(q)));
const ac = (name) => (s) => `<g class="ac-${name}">${s}</g>`;
const SCREW = 0.5;
const faceY = (y, x0, x1, z0, z1) => k.pathOf([[x0, y, z0], [x1, y, z0], [x1, y, z1], [x0, y, z1]].map(at), true);
const flatStyle = (fill, edge) => `fill:var(--anatomy-${fill});stroke:var(--anatomy-${edge});stroke-width:var(--anatomy-weight);vector-effect:non-scaling-stroke;stroke-linejoin:round`;

// ---------- size: lossless path minifier (from feature-spots) ----------
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

// ======================================================================================
// 1936: a desk model of a Turing machine. A paper tape runs between two spools on a
// walnut base; the read/write head (blue) straddles it; the tape steps one cell at a time.
// ======================================================================================
function turing() {
  const wood = ac("wood"), blue = ac("blue"), steel = ac("steel"), tape = ac("tape");
  const BASE = { x: -76, y: -18, w: 152, d: 36, r: 3 };
  const ZB = 8, AX = 30, SX = 58, FL = 15, CORE = 7, WOUND = 11;
  const nearY = depth([0, 1, 0]) > depth([0, 0, 0]) ? 1 : -1;
  const out = [`<path class="iso-halo" d="${k.haloOf(k.insetPlan(BASE, -5), 0, 4, P)}"/>`];
  for (const [x, y] of byDepth(k.corners(BASE, 7))) out.push(wood(S(k.cylinder(x, y, 3.6, 0, 3, P, 18), { tone: "lo" })));
  out.push(wood(S(k.slabOf(BASE, 3, ZB - 3, P, 4, 1), { tone: "mid", inner: L(k.sideSeam(BASE, 5, P, 4), { tone: "faint" }) })));
  out.push(L(k.planOutline(k.insetPlan(BASE, 3.5), ZB, P, 4), { tone: "faint" }));
  const upright = (x, y) => steel(S(k.slabOf({ x: x - 3, y: y - 1.2, w: 6, d: 2.4, r: 0.8 }, ZB, AX + 4 - ZB, P, 3, 0.3), { tone: "mid" }));
  const flange = (x, y) => { const F = G.frameAlong([x, y, AX], [0, 1, 0]); return steel(S(G.disc(0, 1.4, FL, F, P), { tone: "hi", crease: "lo" })) + D([at([x, y + 1.4 * Math.sign(nearY), AX])], { size: SCREW }); };
  const core = (x) => { const F = G.frameAlong([x, -8, AX], [0, 1, 0]); return tape(S(G.disc(0, 16, WOUND, F, P), { tone: "hi", crease: "lo" })); };
  const farY = -nearY * 11, nearYY = nearY * 11, ff = -nearY * 9.4, nf = nearY * 8;
  // far side
  for (const x of [-SX, SX]) out.push(upright(x, farY));
  for (const x of [-SX, SX]) out.push(flange(x, nearY > 0 ? -9.4 : 8));
  out.push(steel(S(k.slabOf({ x: -14, y: farY - 2, w: 28, d: 3, r: 1 }, ZB, AX + WOUND - ZB - 1, P, 3), { tone: "mid" })));
  for (const x of [-SX, SX]) out.push(core(x));
  // the tape: a strip between the spools, ruled into cells, stepping one cell
  const TZ = AX + WOUND, CELL = 8.4;
  out.push(tape(S(k.slabOf({ x: -SX, y: -7, w: 2 * SX, d: 14, r: 0.2 }, TZ, 0.5, P, 2), { tone: "hi", crease: "faint" })));
  const marks = [];
  const pattern = "1101001101011100101101001";
  for (let i = -6; i <= 6; i++) {
    const x = i * CELL;
    marks.push(L(k.lineOnTop([x, -7], [x, 7], TZ + 0.5, P), { tone: "lo" }));
    const sym = pattern[(i + 12) % pattern.length];
    if (sym === "1") marks.push(L(k.lineOnTop([x + CELL / 2, -3], [x + CELL / 2, 3], TZ + 0.5, P), { tone: "mid" }));
    else marks.push(L(k.ring(x + CELL / 2, 0, 2.2, TZ + 0.5, P, 16), { tone: "mid" }));
  }
  out.push(a.amLoop(marks.join(""), [CELL, 0, 0], P, { period: 2600 }));
  // the head: a blue carriage over the tape, with a state window and a stylus
  const H = { x: -11, y: -14, w: 22, d: 28, r: 2 };
  out.push(blue(S(k.slabOf(H, TZ + 3, 16, P, 4, 0.8), { tone: "hi", inner: L(k.sideSeam(H, TZ + 6, P, 4), { tone: "faint" }) })));
  out.push(blue(S(k.slabOf({ x: -5, y: -5, w: 10, d: 10, r: 1.4 }, TZ + 0.6, 2.4, P, 3), { tone: "mid" })));
  const HY = nearY > 0 ? H.y + H.d : H.y;
  out.push(L(faceY(HY, -6, 6, TZ + 9, TZ + 15), { tone: "lo" }));
  out.push(D([at([-3, HY, TZ + 12]), at([0, HY, TZ + 12]), at([3, HY, TZ + 12])], { size: 0.9, tone: "hi" }));
  out.push(L(k.planOutline(k.insetPlan(H, 3), TZ + 19, P, 3), { tone: "faint" }));
  out.push(steel(S(k.cylinder(0, 0, 3, TZ + 19, 5, P, 20, 0.4), { tone: "mid" })) + D([at([0, 0, TZ + 24])], { size: SCREW }));
  // near side
  out.push(steel(S(k.slabOf({ x: -14, y: nearYY - 1, w: 28, d: 3, r: 1 }, ZB, AX + WOUND - ZB - 1, P, 3), { tone: "mid" })));
  for (const x of [-SX, SX]) out.push(flange(x, nearY > 0 ? 8 : -9.4));
  for (const x of [-SX, SX]) out.push(upright(x, nearYY));
  // spokes on the near flanges turn with the tape
  for (const x of [-SX, SX]) {
    const y = nearY > 0 ? 9.4 : -9.4;
    const spokes = [0, 1, 2].map((i) => { const t = (i * 2 * Math.PI) / 3; return `<path d="M0,0L${(Math.cos(t) * 11).toFixed(2)},${(Math.sin(t) * 11).toFixed(2)}" style="stroke:var(--anatomy-mid);stroke-width:var(--anatomy-weight);vector-effect:non-scaling-stroke"/>`; }).join("") +
      `<circle r="3" style="${flatStyle("shade-0", "mid")}"/>` + [0, 1, 2].map((i) => { const t = (i * 2 * Math.PI) / 3 + Math.PI / 3; return `<circle cx="${(Math.cos(t) * 8).toFixed(2)}" cy="${(Math.sin(t) * 8).toFixed(2)}" r="2.2" style="${flatStyle("shade-1", "lo")}"/>`; }).join("");
    out.push(steel(a.amSpin(spokes, a.planeMatrix([x, y, AX], [1, 0, 0], [0, 0, -1], P), { period: 7800 })));
  }
  const points = [...k.boxCorners(k.insetPlan(BASE, -5), 0, ZB), [-SX - FL, 0, AX + FL], [SX + FL, 0, AX + FL], [0, 0, TZ + 26]];
  return { body: out.join(""), points, accents: { wood: "#A27A4E", blue: "#2F6F8F", steel: "#8A8F92", tape: "#EFE6CF" }, label: "An isometric desk model of a Turing machine: a paper tape running between two spools on a walnut base, a blue read and write head over it, the tape stepping one cell at a time." };
}

// ======================================================================================
// 1969: a minicomputer cabinet in the style of the PDP-11, two tape reels turning on its
// face, a row of toggle switches, a vented lower bay.
// ======================================================================================
function pdp() {
  const cab = ac("cab"), green = ac("green"), dark = ac("dark"), reel = ac("reel");
  const C = { x: -32, y: -20, w: 64, d: 40, r: 2.4 };
  const nearY = depth([0, 1, 0]) > depth([0, 0, 0]) ? 1 : -1;
  const FY = nearY > 0 ? C.y + C.d : C.y;
  const out = [`<path class="iso-halo" d="${k.haloOf(k.insetPlan(C, -5), 0, 4, P)}"/>`];
  out.push(dark(S(k.slabOf(k.insetPlan(C, 2), 0, 5, P, 3), { tone: "lo" })));
  out.push(cab(S(k.slabOf(C, 5, 120, P, 3, 0.8), { tone: "mid", inner: L([30, 96].map((z) => k.sideSeam(C, z, P, 3)).join(""), { tone: "faint" }) })));
  out.push(L(k.planOutline(k.insetPlan(C, 3), 125, P, 3), { tone: "faint" }));
  // lower bay: vent slots
  out.push(L(Array.from({ length: 7 }, (_, i) => faceY(FY, -24, 24, 9 + i * 2.8, 10.2 + i * 2.8)).join(""), { tone: "lo" }));
  // tape bay: a dark recess with two reels and the tape between them
  const s = nearY;
  out.push(dark(S(k.slabOf({ x: -28, y: FY - (s > 0 ? 0.6 : 0), w: 56, d: 0.6, r: 0.4 }, 34, 58, P, 2), { tone: "lo" })));
  const RZ = 72, RR = 11.5;
  for (const x of [-13.5, 13.5]) {
    const F = G.frameAlong([x, FY, RZ], [0, s, 0]);
    out.push(reel(S(G.disc(0, 1.6, RR, F, P), { tone: "hi", crease: "lo" })));
    const hub = `<circle r="3.4" style="${flatStyle("shade-0", "mid")}"/>` + [0, 1, 2].map((i) => { const t = (i * 2 * Math.PI) / 3; return `<path d="M${(Math.cos(t - 0.42) * 5).toFixed(2)},${(Math.sin(t - 0.42) * 5).toFixed(2)}L${(Math.cos(t - 0.3) * 9.6).toFixed(2)},${(Math.sin(t - 0.3) * 9.6).toFixed(2)}L${(Math.cos(t + 0.3) * 9.6).toFixed(2)},${(Math.sin(t + 0.3) * 9.6).toFixed(2)}L${(Math.cos(t + 0.42) * 5).toFixed(2)},${(Math.sin(t + 0.42) * 5).toFixed(2)}Z" style="${flatStyle("shade-1", "lo")}"/>`; }).join("") +
      `<circle r="${(RR - 2.4).toFixed(2)}" style="fill:none;stroke:var(--anatomy-faint);stroke-width:var(--anatomy-weight);vector-effect:non-scaling-stroke"/>`;
    out.push(reel(a.amSpin(hub, a.planeMatrix([x, FY + s * 1.6, RZ], [1, 0, 0], [0, 0, -1], P), { period: 5200, reverse: x > 0 })));
  }
  out.push(L(k.segment([-13.5, FY + s * 0.8, RZ - RR], [-4, FY + s * 0.8, 42], P) + k.segment([-4, FY + s * 0.8, 42], [4, FY + s * 0.8, 42], P) + k.segment([4, FY + s * 0.8, 42], [13.5, FY + s * 0.8, RZ - RR], P), { tone: "mid" }));
  out.push(dark(S(k.slabOf({ x: -6, y: FY, w: 12, d: s * 3 || 3, r: 0.6 }, 38, 6, P, 2), { tone: "mid" })));
  // console: lamps and a row of 16 toggle switches in two colours
  out.push(L(faceY(FY, -28, 28, 98, 120), { tone: "lo" }));
  const lamps = [], sw = [];
  for (let i = 0; i < 16; i++) {
    const x = -24 + i * 3.2;
    lamps.push(at([x + 0.6, FY, 114]));
    const plan = { x: x - 0.8, y: s > 0 ? FY : FY - 3.2, w: 1.8, d: 3.2, r: 0.4 };
    const paths = k.slabOf(plan, 102 + (i % 3 === 0 ? 1.4 : 0), 4.2, P, 2);
    sw.push(Math.floor(i / 3) % 2 ? green(S(paths, { tone: "hi" })) : cab(S(paths, { tone: "hi" })));
  }
  out.push(a.amBlink(D(lamps.filter((_, i) => i % 2), { size: 0.9, tone: "hi" }), { period: 1800 }));
  out.push(D(lamps.filter((_, i) => !(i % 2)), { size: 0.9, tone: "lo" }));
  out.push(sw.join(""));
  out.push(D([at([-28, FY, 34]), at([28, FY, 34]), at([-28, FY, 92]), at([28, FY, 92])], { size: SCREW }));
  const points = [...k.boxCorners(k.insetPlan(C, -5), 0, 125)];
  return { body: out.join(""), points, accents: { cab: "#E9E2CF", green: "#4F7044", dark: "#3B3A36", reel: "#B9B3A3" }, label: "An isometric minicomputer cabinet in the style of the PDP-11: two tape reels turning on its face, a row of toggle switches in cream and green, and blinking lamps." };
}

// ======================================================================================
// Today: an open laptop on a desk mat, a note on its screen with a green Yes, a mug beside.
// ======================================================================================
function laptop() {
  const body = ac("alu"), green = ac("green"), screen = ac("screen"), mug = ac("mug");
  const nearY = depth([0, 1, 0]) > depth([0, 0, 0]) ? 1 : -1;
  const B = { x: -36, y: -24, w: 72, d: 48, r: 4 };
  const out = [`<path class="iso-halo" d="${k.haloOf(k.insetPlan(B, -6), 0, 4, P)}"/>`];
  const backY = nearY > 0 ? B.y : B.y + B.d;
  const lidY0 = nearY > 0 ? backY - 2 : backY;
  // lid first (it stands at the back), then the base in front of it
  out.push(body(S(k.slabOf({ x: B.x, y: lidY0, w: B.w, d: 2, r: 0.8 }, 3, 50, P, 3, 0.4), { tone: "mid" })));
  const SF = nearY > 0 ? backY : backY;
  const sx0 = B.x + 4, sx1 = B.x + B.w - 4, sz0 = 8, sz1 = 49;
  // screen content drawn on the lid's front face
  const scr = [];
  scr.push(L(faceY(SF, sx0, sx1, sz0, sz1), { tone: "lo" }));
  const nx0 = sx0 + 8, nx1 = sx1 - 14;
  scr.push(L(faceY(SF, nx0, nx1, sz0 + 6, sz1 - 5), { tone: "mid" }));
  scr.push(D([at([nx0 + 4, SF, sz1 - 10])], { size: 1.8, tone: "mid" }));
  scr.push(L([0, 1, 2].map((i) => k.segment([nx0 + 4, SF, sz1 - 17 - i * 4.4], [nx1 - 4 - i * 6, SF, sz1 - 17 - i * 4.4], P)).join(""), { tone: "lo", free: true }));
  scr.push(L(k.segment([nx0 + 8, SF, sz1 - 10], [nx0 + 24, SF, sz1 - 10], P), { tone: "mid", free: true }));
  const yes = green(S(k.slabOf({ x: nx0 + 4, y: nearY > 0 ? SF : SF - 0.6, w: 16, d: 0.6, r: 0.3 }, sz0 + 9, 5, P, 2), { tone: "hi" }));
  scr.push(a.amPulse(yes, { period: 3200, min: 0.55 }));
  out.push(screen(scr.join("")));
  // base with keyboard and trackpad
  out.push(body(S(k.slabOf(B, 0, 3, P, 4, 0.8), { tone: "hi", inner: L(k.sideSeam(B, 1.4, P, 4), { tone: "faint" }) })));
  const keys = [];
  const kb = { x0: B.x + 7, y0: nearY > 0 ? B.y + 5 : B.y + B.d - 23 };
  for (let r = 0; r < 4; r++) for (let c = 0; c < 12; c++) {
    const w = 4.2, gap = 0.9;
    keys.push(k.planOutline({ x: kb.x0 + c * (w + gap), y: kb.y0 + r * (w + gap), w, d: w, r: 0.6 }, 3, P, 2));
  }
  out.push(L(keys.join(""), { tone: "lo" }));
  const tp = { x: -11, y: nearY > 0 ? B.y + B.d - 17 : B.y + 4, w: 22, d: 13, r: 1.6 };
  out.push(L(k.planOutline(tp, 3, P, 3), { tone: "lo" }));
  // a mug to the right
  const mx = B.x + B.w + 16, my = 6;
  const mugBands = k.sideArc(mx, my, 7, 6, P, 28);
  out.push(mug(S(k.cylinder(mx, my, 7, 0, 15, P, 36, 0.5), { tone: "hi", inner: L(mugBands, { tone: "faint" }) })));
  out.push(L(k.ring(mx, my, 5.8, 15, P, 30), { tone: "lo" }));
  out.push(mug(S(k.slabOf({ x: mx + 6, y: my - 1, w: 5, d: 2, r: 0.8 }, 4, 8, P, 3), { tone: "mid" })));
  const points = [...k.boxCorners(k.insetPlan(B, -6), 0, 54), [mx + 12, my, 15]];
  return { body: out.join(""), points, accents: { alu: "#C9C6BD", green: "#5F8D4E", screen: "#5F8D4E", mug: "#E6DCC8" }, label: "An isometric open laptop on a desk, a note on its screen with a green Yes that pulses gently, and a mug beside it." };
}

const OBJECTS = [["turing", turing, 560, 360], ["pdp", pdp, 420, 520], ["laptop", laptop, 520, 420]];
for (const [name, fn, W, H] of OBJECTS) {
  P = { origin: [0, 0], scale: 1, azimuth: AZ, elevation: EL };
  const first = fn();
  P = k.fitProjection(first.points, W, H, { pad: 16, azimuth: AZ, elevation: EL });
  const o = fn();
  const svg = a.assetSvg({ width: W, height: H, label: o.label, body: minify(o.body), paper: PAPER, accents: o.accents, weight: 0.6, id: name });
  writeFileSync(join(HERE, `${name}.svg`), svg);
  writeFileSync(join(HERE, `${name}.html`), a.previewHtml({ title: name, svg, paper: PAPER, width: W }));
  console.log(`wrote ${name}.svg (${(svg.length / 1024).toFixed(0)} KB)`);
}
