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


// ======================================================================================
// Today: a rubber stamp says yes. A stack of note cards, the top one already stamped
// with a green tick; the stamp (oak handle, green rubber) presses again; an ink pad beside.
// ======================================================================================
function stamp() {
  const oak = ac("oak"), green = ac("green"), card = ac("card"), tin = ac("tin"), ink = ac("ink");
  const out = [];
  // the ink pad: a tin with a green pad inset, lid leaning behind it
  const PAD = { x: 30, y: -30, w: 30, d: 22, r: 3 };
  out.push(`<path class="iso-halo" d="${k.haloOf(k.insetPlan(PAD, -3), 0, 3, P)}"/>`);
  out.push(tin(S(k.slabOf(PAD, 0, 5, P, 4, 0.6), { tone: "mid", inner: L(k.sideSeam(PAD, 2, P, 4), { tone: "faint" }) })));
  out.push(green(S(k.slabOf(k.insetPlan(PAD, 2.4), 5, 0.6, P, 3), { tone: "mid", crease: "none" })));
  // the note cards, a little askew, the top one stamped
  const C = { x: -44, y: -26, w: 66, d: 46, r: 1.6 };
  out.push(`<path class="iso-halo" d="${k.haloOf(k.insetPlan(C, -4), 0, 4, P)}"/>`);
  const offs = [[0, 0], [1.2, -0.8], [-0.8, 0.6], [0.4, 0.3]];
  offs.forEach(([dx, dy], i) => out.push(card(S(k.slabOf({ ...C, x: C.x + dx, y: C.y + dy }, i * 0.9, 0.9, P, 2), { tone: "hi", crease: "faint" }))));
  const zt = offs.length * 0.9;
  const T = { ...C, x: C.x + 0.4, y: C.y + 0.3 };
  // rule lines for the note's words, a heading line
  out.push(L(k.lineOnTop([T.x + 6, T.y + 7], [T.x + 34, T.y + 7], zt, P), { tone: "mid", free: true }));
  out.push(L([0, 1, 2, 3].map((i) => k.lineOnTop([T.x + 6, T.y + 13 + i * 5], [T.x + T.w - 8 - (i % 2) * 14, T.y + 13 + i * 5], zt, P)).join(""), { tone: "lo", free: true }));
  // the stamped mark: a green rounded frame with a tick
  const M = { x: T.x + 30, y: T.y + 28, w: 28, d: 13, r: 3 };
  out.push(ink(L(k.planOutline(M, zt, P, 4) + k.planOutline(k.insetPlan(M, 1.4), zt, P, 4), { tone: "lit" })));
  out.push(ink(L(k.lineOnTop([M.x + 7, M.y + 7], [M.x + 10, M.y + 10], zt, P) + k.lineOnTop([M.x + 10, M.y + 10], [M.x + 17, M.y + 3], zt, P), { tone: "lit", free: true })));
  // the stamp, hovering over the mark and pressing
  const SX = M.x + M.w / 2, SY = M.y + M.d / 2, Z0 = zt + 9;
  const R = { x: SX - 15, y: SY - 7.5, w: 30, d: 15, r: 2 };
  const st = [];
  st.push(green(S(k.slabOf(R, Z0, 2.2, P, 3, 0.4), { tone: "mid" })));
  st.push(oak(S(k.slabOf(k.insetPlan(R, -1), Z0 + 2.2, 7, P, 3, 0.8), { tone: "mid", inner: L(k.sideSeam(k.insetPlan(R, -1), Z0 + 5.6, P, 3), { tone: "faint" }) })));
  st.push(L(k.planOutline(k.insetPlan(R, 2.4), Z0 + 9.2, P, 3), { tone: "faint" }));
  st.push(oak(S(k.cylinder(SX, SY, 3.2, Z0 + 9.2, 10, P, 24), { tone: "mid", inner: L(k.sideArc(SX, SY, 3.2, Z0 + 12, P, 20), { tone: "faint" }) })));
  st.push(oak(S(G.sphereOf([SX, SY, Z0 + 24], 7, P), { tone: "hi" })));
  out.push(a.amPress(st.join(""), [0, 0, -8], P, { period: 3600 }));
  const points = [...k.boxCorners(k.insetPlan(C, -4), 0, 1), ...k.boxCorners(PAD, 0, 6), [SX, SY, Z0 + 31]];
  return { body: out.join(""), points, accents: { oak: "#B48A5A", green: "#5F8D4E", ink: { hex: "#4F8A3E", mode: "ink" }, card: "#F3EEDF", tin: "#9A968C" }, label: "An isometric rubber stamp with an oak handle and green rubber pressing on a stack of note cards, the top card already stamped with a green tick, an ink pad beside it." };
}


// ======================================================================================
// Today: an agent. A small robot hovering over a digital pad (a disc ruled in a grid),
// a floating panel of code beside it, loose pixels drifting up; its eyes blink.
// ======================================================================================
function bot() {
  const shell = ac("shell"), green = ac("green"), pad = ac("pad"), glow = ac("glow"), holo = ac("holo"), face = ac("face"), gink = ac("gink");
  const nearY = depth([0, 1, 0]) > depth([0, 0, 0]) ? 1 : -1;
  const nearX = depth([1, 0, 0]) > depth([0, 0, 0]) ? 1 : -1;
  const out = [];
  // the pad: a low disc with a lit ring and a grid on its face
  const PR = 44;
  out.push(`<path class="iso-halo" d="${k.haloOf({ x: -PR - 4, y: -PR - 4, w: 2 * PR + 8, d: 2 * PR + 8, r: PR + 4 }, 0, 3, P)}"/>`);
  out.push(pad(S(k.cylinder(0, 0, PR, 0, 4, P, 72, 0.6), { tone: "mid", inner: L(k.sideArc(0, 0, PR, 1.6, P, 64), { tone: "faint" }) })));
  out.push(face(S(k.cylinder(0, 0, PR - 4, 4, 0.6, P, 72), { tone: "hi", crease: "none" })));
  const grid = [];
  for (let g = -32; g <= 32; g += 8) {
    const h = Math.sqrt(Math.max(0, (PR - 6) ** 2 - g * g));
    grid.push(k.lineOnTop([g, -h], [g, h], 4.6, P), k.lineOnTop([-h, g], [h, g], 4.6, P));
  }
  out.push(gink(L(grid.join(""), { tone: "lit", free: true })));
  out.push(gink(L(k.ring(0, 0, 16, 4.6, P, 48), { tone: "lit" })));
  // the robot, floating
  const rb = [];
  const ZB = 18;
  rb.push(shell(S(k.cylinder(0, 0, 4, ZB - 6, 6, P, 24), { tone: "lo" })));                         // thruster
  rb.push(glow(S(k.cylinder(0, 0, 2.6, ZB - 7, 1, P, 20), { tone: "hi", lit: true })));
  const BODY = { x: -13, y: -11, w: 26, d: 22, r: 8 };
  rb.push(shell(S(k.slabOf(BODY, ZB, 24, P, 8, 1), { tone: "hi", inner: L(k.sideSeam(BODY, ZB + 8, P, 8), { tone: "faint" }) })));
  // chest light on the front face
  const FY = nearY > 0 ? BODY.y + BODY.d : BODY.y;
  rb.push(glow(S(k.slabOf({ x: -4, y: nearY > 0 ? FY : FY - 0.6, w: 8, d: 0.6, r: 0.3 }, ZB + 12, 5, P, 2), { tone: "hi", lit: true })));
  // arms: two short rounded posts at the sides, one raised a little
  for (const sx of byDepth([-1, 1], (sx) => [sx * 16, 0, ZB + 14])) {
    const x = sx * 15.5;
    rb.push(shell(S(k.slabOf({ x: x - 2.6, y: -3, w: 5.2, d: 6, r: 2.4 }, ZB + 6 + (sx > 0 ? 4 : 0), 13, P, 4), { tone: "mid" })));
  }
  // neck and head with a dark visor and two eyes
  rb.push(shell(S(k.cylinder(0, 0, 3.4, ZB + 24, 3, P, 20), { tone: "mid" })));
  const HEAD = { x: -15, y: -12, w: 30, d: 24, r: 7 };
  const HZ = ZB + 27;
  rb.push(shell(S(k.slabOf(HEAD, HZ, 18, P, 8, 1.2), { tone: "hi" })));
  const HY = nearY > 0 ? HEAD.y + HEAD.d : HEAD.y;
  const visor = { x: -11, y: nearY > 0 ? HY : HY - 1, w: 22, d: 1, r: 0.5 };
  rb.push(pad(S(k.slabOf(visor, HZ + 4, 10, P, 2, 0.3), { tone: "lo" })));
  const eyes = (open) => glow(open
    ? S(k.slabOf({ x: -6.5, y: visor.y + (nearY > 0 ? 1 : -0.4), w: 4, d: 0.4, r: 0.2 }, HZ + 7, 4, P, 2), { tone: "hi", lit: true }) + S(k.slabOf({ x: 2.5, y: visor.y + (nearY > 0 ? 1 : -0.4), w: 4, d: 0.4, r: 0.2 }, HZ + 7, 4, P, 2), { tone: "hi", lit: true })
    : S(k.slabOf({ x: -6.5, y: visor.y + (nearY > 0 ? 1 : -0.4), w: 4, d: 0.4, r: 0.2 }, HZ + 8.6, 0.8, P, 2), { tone: "hi" }) + S(k.slabOf({ x: 2.5, y: visor.y + (nearY > 0 ? 1 : -0.4), w: 4, d: 0.4, r: 0.2 }, HZ + 8.6, 0.8, P, 2), { tone: "hi" }));
  rb.push(a.amFlip([eyes(true), eyes(true), eyes(true), eyes(true), eyes(false)], { period: 3000 }));
  // antenna with a glowing tip
  rb.push(shell(S(k.cylinder(0, 0, 0.9, HZ + 18, 8, P, 12), { tone: "mid" })));
  rb.push(a.amPulse(glow(S(G.sphereOf([0, 0, HZ + 28], 2.6, P), { tone: "hi" })), { period: 2400, min: 0.4 }));
  out.push(a.amFloat(rb.join(""), P, { rise: 3, period: 4200 }));
  // a floating panel of code to the side, and pixels drifting up
  const PX = nearX > 0 ? -34 : 34;
  const panel = [];
  const pz0 = 40, pz1 = 66, py0 = -18, py1 = 10;
  panel.push(holo(S(k.slabOf({ x: PX - 0.6, y: py0, w: 1.2, d: py1 - py0, r: 0.4 }, pz0, pz1 - pz0, P, 2), { tone: "hi" })));
  const fx = PX + (nearX > 0 ? 0.6 : -0.6) * -1;
  const faceX = (x, y0, y1, z) => k.segment([x, y0, z], [x, y1, z], P);
  const xf = nearX > 0 ? PX + 0.6 : PX - 0.6;
  panel.push(L([0, 1, 2, 3].map((i) => faceX(xf, py0 + 4 + (i % 2) * 4, py1 - 4 - i * 3, pz1 - 6 - i * 5)).join(""), { tone: "lo", free: true }));
  out.push(a.amFloat(panel.join(""), P, { rise: 2.4, period: 5200, delay: 1200 }));
  const pixels = [[22, -20, 52], [28, 4, 70], [-8, 24, 74], [16, 20, 46], [-24, -24, 62]];
  pixels.forEach(([x, y, z], i) => out.push(a.amFloat(glow(S(k.slabOf({ x: x - 1.8, y: y - 1.8, w: 3.6, d: 3.6, r: 0.4 }, z, 3.6, P, 2), { tone: i % 2 ? "hi" : "mid" })), P, { rise: 5, period: 3600 + i * 700, delay: i * 500 })));
  const points = [[-PR - 4, -PR - 4, 0], [PR + 4, PR + 4, 0], [-PR, PR, 0], [PR, -PR, 0], [0, 0, HZ + 32], [PX, py0, pz1], [PX, py1, pz1], [28, 4, 76]];
  return { body: out.join(""), points, accents: { shell: "#E8E6DE", green: "#5F8D4E", pad: "#3E4A40", face: "#33443A", glow: "#7FBF5A", holo: "#CFE3C2", gink: { hex: "#8FD06A", mode: "ink" } }, label: "An isometric agent: a small robot hovering over a digital pad ruled in a glowing grid, a floating code panel beside it and pixels drifting up, its eyes blinking." };
}


// ======================================================================================
// Today: a friendly agent. A round, bean-shaped companion floating over a soft digital pad,
// big round eyes and a smile, a leaf sprout on its head, one hand waving; lights drift up.
// ======================================================================================
function pal() {
  const skin = ac("skin"), leaf = ac("leaf"), pad = ac("pad"), face = ac("face"), gink = ac("gink"), blush = ac("blush"), dark = ac("dark");
  const V = G.viewOf(P);
  const f = (() => { const l = Math.hypot(V[0], V[1]); return [V[0] / l, V[1] / l, 0]; })();
  const side = [-f[1], f[0], 0];
  const onSphere = (c, r, dx, dz) => { const d = [f[0] + side[0] * dx, f[1] + side[1] * dx, dz]; const l = Math.hypot(...d); return [c[0] + (d[0] / l) * r, c[1] + (d[1] / l) * r, c[2] + (d[2] / l) * r]; };
  const out = [];
  // the pad: a soft rounded disc with a ring of lights
  const PR = 40;
  out.push(`<path class="iso-halo" d="${k.haloOf({ x: -PR - 4, y: -PR - 4, w: 2 * PR + 8, d: 2 * PR + 8, r: PR + 4 }, 0, 3, P)}"/>`);
  out.push(pad(S(k.cylinder(0, 0, PR, 0, 4, P, 72, 1), { tone: "mid" })));
  out.push(face(S(k.cylinder(0, 0, PR - 5, 4, 0.5, P, 72), { tone: "hi", crease: "none" })));
  out.push(gink(L(k.ring(0, 0, PR - 9, 4.5, P, 64) + k.ring(0, 0, 14, 4.5, P, 40), { tone: "lit" })));
  const lights = [];
  for (let i = 0; i < 20; i++) { const t = (i / 20) * Math.PI * 2; lights.push(at([Math.cos(t) * (PR - 9), Math.sin(t) * (PR - 9), 4.5])); }
  out.push(a.amBlink(gink(D(lights.filter((_, i) => i % 2), { size: 1.5, tone: "lit" })), { period: 2600, min: 0.3 }));
  out.push(gink(D(lights.filter((_, i) => !(i % 2)), { size: 1.5, tone: "lit" })));
  // the companion
  const c = [];
  const ZB = 16;
  const F = G.frameOf([0, 0, ZB], [0, 0, 1], [1, 0, 0], [0, 1, 0]);
  c.push(skin(S(G.solidOf([[0, 7, 1], [4, 12, 1], [12, 14.5, 1], [22, 13.5, 1], [30, 10, 1]], F, P), { tone: "hi" })));
  const H = [0, 0, ZB + 42], HR = 17;
  // hands: the far one rests, the near one waves
  const handAt = (sgn) => [side[0] * sgn * 15.5, side[1] * sgn * 15.5, ZB + 16];
  const hands = byDepth([1, -1], (sgn) => handAt(sgn));
  const hand = (sgn) => skin(S(G.sphereOf(handAt(sgn), 4.6, P), { tone: "hi" }));
  c.push(hand(hands[0]));
  c.push(skin(S(G.sphereOf(H, HR, P), { tone: "hi" })));
  // the face: two round eyes with a glint, a smile, soft cheeks
  const eye = (dx) => onSphere(H, HR, dx, 0.12);
  const eyes = [eye(-0.36), eye(0.36)];
  c.push(dark(D(eyes.map(at), { size: 4.2, tone: "hi" })));
  c.push(D(eyes.map((p) => { const q = at(p); return [q[0] + 1.4, q[1] - 1.5]; }), { size: 1.2, tone: "lit" }));
  const smile = [];
  for (let i = 0; i <= 12; i++) { const t = -0.3 + (i / 12) * 0.6; smile.push(onSphere(H, HR, t, -0.26 + 0.6 * t * t)); }
  c.push(dark(L(k.pathOf(smile.map(at)), { tone: "hi", free: true })));
  c.push(blush(D([onSphere(H, HR, -0.62, -0.12), onSphere(H, HR, 0.62, -0.12)].map(at), { size: 3.6, tone: "lit" })));
  // a leaf sprout on top
  const top = [0, 0, ZB + 42 + HR];
  c.push(leaf(S(k.cylinder(0, 0, 0.8, top[2] - 1, 5, P, 12), { tone: "mid" })));
  const leafPath = (sx) => `<path d="M0,0C${sx * 3},-5 ${sx * 9},-7 ${sx * 12},-3C${sx * 8},1 ${sx * 3},1 0,0Z" style="fill:var(--anatomy-top);stroke:var(--anatomy-hi);stroke-width:var(--anatomy-weight);vector-effect:non-scaling-stroke;stroke-linejoin:round"/>`;
  c.push(leaf(`<g transform="${a.planeMatrix([0, 0, top[2] + 4], [side[0], side[1], 0], [0, 0, -1], P)}">${leafPath(1)}${leafPath(-1)}</g>`));
  c.push(a.amFloat(hand(hands[1]), P, { rise: 4, period: 1600 }));
  out.push(a.amFloat(c.join(""), P, { rise: 3, period: 4200 }));
  // soft lights drifting up around it
  const motes = [[24, -18, 40], [26, 10, 62], [-20, 22, 70], [-28, -10, 50], [10, -28, 78]];
  motes.forEach(([x, y, z], i) => out.push(a.amFloat(gink(D([at([x, y, z])], { size: 1.6 + (i % 2), tone: "lit" })), P, { rise: 6, period: 3400 + i * 600, delay: i * 500 })));
  const points = [[-PR - 4, -PR - 4, 0], [PR + 4, PR + 4, 0], [-PR, PR, 0], [PR, -PR, 0], [0, 0, ZB + 42 + HR + 12], [-28, -10, 56], [26, 10, 68], [10, -28, 84]];
  return { body: out.join(""), points, accents: { skin: "#FFF6E6", leaf: "#6FA65A", pad: "#55705A", face: "#DCEBD3", gink: { hex: "#6FB24E", mode: "ink" }, blush: { hex: "#E8A58E", mode: "ink" }, dark: { hex: "#2C3A30", mode: "ink" } }, label: "An isometric friendly agent: a round, bean-shaped companion with big eyes, a smile and a leaf sprout, floating over a soft digital pad ringed with lights and waving one hand." };
}


// ======================================================================================
// Today: a friendly chat agent. A glossy round head with a wide dark visor and lit eyes,
// a ring-and-ball antenna, a round body with a chest panel, floating capsule arms.
// It hovers, waves, blinks and smiles; the antenna tip breathes.
// ======================================================================================
function chatbot() {
  const shell = ac("shell"), visorC = ac("visor"), eyeC = ac("eye"), panel = ac("panel"), ring = ac("ringc");
  const V = G.viewOf(P);
  const f = (() => { const l = Math.hypot(V[0], V[1]); return [V[0] / l, V[1] / l, 0]; })();
  const side = [-f[1], f[0], 0];
  const unit = (v) => { const l = Math.hypot(...v); return v.map((x) => x / l); };
  const onSphere = (c, r, dx, dz) => { const d = unit([f[0] + side[0] * dx, f[1] + side[1] * dx, dz]); return [c[0] + d[0] * r, c[1] + d[1] * r, c[2] + d[2] * r]; };
  const out = [];
  out.push(`<path class="iso-halo" d="${k.haloOf({ x: -15, y: -15, w: 30, d: 30, r: 15 }, 0, 2, P)}" style="filter:blur(5px);opacity:.35"/>`);
  const bot = [];
  // body: a round, slightly squat egg
  const ZB = 22;
  const BF = G.frameOf([0, 0, ZB], [0, 0, 1], [1, 0, 0], [0, 1, 0]);
  const BODY = [[0, 6, 1], [3, 13, 1], [10, 16, 1], [18, 15, 1], [24, 11, 1], [27, 5, 1]];
  const rAt = (s) => { for (let i = 0; i < BODY.length - 1; i++) { const [s0, r0] = BODY[i], [s1, r1] = BODY[i + 1]; if (s >= s0 && s <= s1) return r0 + (r1 - r0) * (s - s0) / (s1 - s0); } return 0; };
  // arms: capsules hanging just off the body, the far one first
  const armAt = (sgn) => [side[0] * sgn * 19.5, side[1] * sgn * 19.5, ZB + 17];
  const arm = (sgn) => { const o = armAt(sgn); const F = G.frameAlong(o, unit([side[0] * sgn * 0.35, side[1] * sgn * 0.35, -1])); return shell(S(G.solidOf([[0, 2.2, 1], [2, 3.4, 1], [9, 3, 1], [13, 1.8, 1]], F, P), { tone: "hi" })); };
  const arms = byDepth([1, -1], (sgn) => armAt(sgn));
  bot.push(arms[0] === 1 ? a.amSwing ? arm(1) : arm(1) : arm(-1));
  bot.push(shell(S(G.solidOf(BODY, BF, P), { tone: "hi" })));
  // the chest panel: a soft rounded patch on the body's front
  const pts = [];
  const N = 28;
  for (let i = 0; i < N; i++) {
    const t = (i / N) * Math.PI * 2;
    const ang = Math.cos(t) * 0.62, s0 = 13 + Math.sin(t) * 4.6;
    const r = rAt(s0) + 0.2;
    const d = [f[0] * Math.cos(ang) + side[0] * Math.sin(ang), f[1] * Math.cos(ang) + side[1] * Math.sin(ang)];
    pts.push(at([d[0] * r, d[1] * r, ZB + s0]));
  }
  bot.push(panel(`<path d="${k.pathOf(pts, true)}" style="fill:var(--anatomy-top);stroke:var(--anatomy-hi);stroke-width:var(--anatomy-weight);vector-effect:non-scaling-stroke"/>`));
  // head
  const H = [0, 0, ZB + 50], HR = 19;
  bot.push(shell(S(G.sphereOf(H, HR, P), { tone: "hi" })));
  // the visor: a wide rounded dark window on the head's front
  const vis = [];
  const VN = 40;
  for (let i = 0; i < VN; i++) {
    const t = (i / VN) * Math.PI * 2;
    const c = Math.cos(t), sn = Math.sin(t);
    const sx = Math.sign(c) * Math.pow(Math.abs(c), 0.6) * 0.8, sz = Math.sign(sn) * Math.pow(Math.abs(sn), 0.6) * 0.4 + 0.06;
    vis.push(at(onSphere(H, HR + 0.3, sx, sz)));
  }
  bot.push(visorC(`<path d="${k.pathOf(vis, true)}" style="fill:var(--anatomy-top);stroke:var(--anatomy-hi);stroke-width:var(--anatomy-weight);vector-effect:non-scaling-stroke;stroke-linejoin:round"/>`));
  // eyes: open (round), shut (a gentle arc), happy (an upturned arc)
  const eyeC2 = [-0.32, 0.32].map((dx) => onSphere(H, HR + 0.4, dx, 0.08));
  const arc = (dx, up) => k.pathOf(Array.from({ length: 9 }, (_, i) => { const t = -1 + (i / 8) * 2; return at(onSphere(H, HR + 0.4, dx + t * 0.12, 0.08 + (up ? 1 : -1) * (0.06 - 0.06 * t * t))); }));
  const open = eyeC(D(eyeC2.map(at), { size: 5.4, tone: "lit" }));
  const shut = eyeC(L(arc(-0.32, false) + arc(0.32, false), { tone: "lit", free: true }));
  const happy = eyeC(L(arc(-0.32, true) + arc(0.32, true), { tone: "lit", free: true }));
  bot.push(a.amFlip([open, open, open, open, shut, open, open, happy, happy], { period: 5400 }));
  // antenna: a stem, a flat ring, a ball that breathes
  const top = [0, 0, H[2] + HR];
  bot.push(ring(S(G.ringBand(0, 1.4, 2.4, 6, G.frameOf([0, 0, top[2] - 0.6], [0, 0, 1], [1, 0, 0], [0, 1, 0]), P), { tone: "hi" })));
  bot.push(shell(S(k.cylinder(0, 0, 1.2, top[2], 5, P, 14), { tone: "mid" })));
  bot.push(a.amPulse(ring(S(G.sphereOf([0, 0, top[2] + 7.4], 3.2, P), { tone: "hi" })), { period: 2400, min: 0.55 }));
  // the near arm waves
  bot.push(a.amFloat(arm(arms[1]), P, { rise: 5, period: 1400 }));
  out.push(a.amFloat(bot.join(""), P, { rise: 4, period: 4400, halo: "" }));
  const points = [[-26, -26, 0], [26, 26, 0], [-26, 26, 0], [26, -26, 0], [0, 0, top[2] + 12], armAt(1), armAt(-1), [...armAt(1).slice(0, 2), ZB], [...armAt(-1).slice(0, 2), ZB]];
  return { body: out.join(""), points, accents: { shell: "#FFFFFF", visor: "#1F2A24", eye: { hex: "#8FE07A", mode: "ink" }, panel: "#CFE6C6", ringc: "#B9D8B0" }, css: "#agent .ac-eye{--anatomy-lit:#9BEA82;--anatomy-dot:#9BEA82;--anatomy-hi:#9BEA82;--anatomy-mid:#9BEA82}#agent .ac-shell{--anatomy-paper:#f7f7f4;--anatomy-face:#fcfcfa;--anatomy-top:#ffffff;--anatomy-shade-0:#e2e4df;--anatomy-shade-1:#eaebe7;--anatomy-shade-2:#f1f2ee;--anatomy-shade-3:#f7f8f5;--anatomy-lit-top:#ffffff;--anatomy-lit-shade:#f2f3ef;--anatomy-hi:#8b918a;--anatomy-mid:#aab0a8;--anatomy-lo:#c6cac3;--anatomy-faint:#d8dbd5}", label: "An isometric friendly chat agent: a glossy white round head with a dark visor and glowing green eyes that blink and smile, a ring and ball antenna, a round body with a soft green chest panel and floating arms, one of them waving as it hovers." };
}

const OBJECTS = [["turing", turing, 560, 360], ["pdp", pdp, 420, 520], ["agent", chatbot, 360, 420]];
for (const [name, fn, W, H] of OBJECTS) {
  P = { origin: [0, 0], scale: 1, azimuth: AZ, elevation: EL };
  const first = fn();
  P = k.fitProjection(first.points, W, H, { pad: 16, azimuth: AZ, elevation: EL });
  const o = fn();
  const svg = a.assetSvg({ width: W, height: H, label: o.label, body: minify(o.body), paper: PAPER, accents: o.accents, weight: 0.6, id: name, css: o.css || "" });
  writeFileSync(join(HERE, `${name}.svg`), svg);
  writeFileSync(join(HERE, `${name}.html`), a.previewHtml({ title: name, svg, paper: PAPER, width: W }));
  console.log(`wrote ${name}.svg (${(svg.length / 1024).toFixed(0)} KB)`);
}
