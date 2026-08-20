#!/usr/bin/env node
/**
 * remove-migrated-css.mjs — one-off, zero-dep precision CSS removal.
 *
 * Usage:
 *   node scripts/remove-migrated-css.mjs <domain-css-file> [<domain-css-file> ...]
 *
 * For each domain CSS file:
 *  - Extract ALL top-level rules (selector-list + block), brace-aware.
 *  - Rules inside @media blocks are treated as matchable units themselves.
 *  - For each domain rule: find IDENTICAL rule(s) in src/styles/components.css
 *    (whitespace-normalized comparison) and remove the FULL block(s) there.
 *  - Not found        -> report as "orphan-domain" (remove nothing).
 *  - >1 identical hits -> remove ALL candidates (duplicates) and report.
 *  - Comments are left untouched (empty section comments stay).
 *  - Final sanity: components.css brace balance must be balanced, else ABORT
 *    without writing.
 */

import fs from 'node:fs';
import path from 'node:path';

const COMPONENTS_CSS = 'src/styles/components.css';

// ---------------------------------------------------------------------------
// Scanner: walk source, tracking comments / strings / brace depth.
// Produces flat list of segments with structural metadata.
// ---------------------------------------------------------------------------

/**
 * Scan CSS source into rule units.
 * A "rule unit" at top level is either:
 *   - a qualified rule: prelude (selector list) + `{ ... }` block
 *   - an at-rule with a block: `@media ... { ... }`, `@keyframes x { ... }`, etc.
 *   - an at-rule without a block: `@import ...;` (leaf statement)
 *
 * Each rule records: start/end offsets (in the original source), its prelude,
 * and (for block at-rules like @media) the list of child rules inside it.
 */
function parseRules(src) {
  const rules = [];
  const n = src.length;
  let i = 0;

  function skipWsAndComments(pos) {
    while (pos < n) {
      const c = src[pos];
      if (c === ' ' || c === '\t' || c === '\r' || n === 0 && false) { pos++; continue; }
      if (c === '\n') { pos++; continue; }
      if (c === '/' && src[pos + 1] === '*') {
        const end = src.indexOf('*/', pos + 2);
        pos = end === -1 ? n : end + 2;
        continue;
      }
      break;
    }
    return pos;
  }

  // Parse a block starting at index of '{'; returns index just past matching '}'.
  function blockEnd(openIdx) {
    let depth = 0;
    let p = openIdx;
    while (p < n) {
      const c = src[p];
      if (c === '/' && src[p + 1] === '*') {
        const end = src.indexOf('*/', p + 2);
        p = end === -1 ? n : end + 2;
        continue;
      }
      if (c === '"' || c === "'") {
        // string inside block (rare in CSS but be safe)
        const quote = c;
        p++;
        while (p < n && src[p] !== quote) {
          if (src[p] === '\\') p++;
          p++;
        }
        p++;
        continue;
      }
      if (c === '{') depth++;
      else if (c === '}') {
        depth--;
        if (depth === 0) return p + 1;
      }
      p++;
    }
    return n; // unbalanced — caller sanity check will catch
  }

  function parseLevel(startPos, endPos, depth) {
    let p = startPos;
    const out = [];
    while (p < endPos) {
      p = skipWsAndComments(p);
      if (p >= endPos) break;
      const ruleStart = p;
      // read prelude until '{' or ';' at this level (comments skipped but included in raw text)
      let q = p;
      let hit = null; // '{' or ';' or null (EOF)
      while (q < endPos) {
        const c = src[q];
        if (c === '/' && src[q + 1] === '*') {
          const end = src.indexOf('*/', q + 2);
          q = end === -1 ? endPos : end + 2;
          continue;
        }
        if (c === '{') { hit = '{'; break; }
        if (c === ';') { hit = ';'; break; }
        if (c === '}') { hit = '}'; break; } // stray close at this level
        q++;
      }
      const prelude = src.slice(ruleStart, q);
      if (hit === '{') {
        const bEnd = blockEnd(q);
        const bodyStart = q + 1;
        const bodyEnd = bEnd - 1; // index of closing '}'
        const rule = {
          start: ruleStart,
          end: bEnd,
          prelude,
          body: src.slice(bodyStart, bodyEnd),
          hasBlock: true,
          isAtRule: prelude.trimStart().startsWith('@'),
          children: [],
        };
        // Recurse into block at-rules whose children are rules (@media, @supports, @layer)
        if (rule.isAtRule && /^@(media|supports|layer|container)\b/i.test(rule.prelude.trim())) {
          rule.children = parseLevel(bodyStart, bodyEnd, depth + 1);
        }
        out.push(rule);
        p = bEnd;
      } else if (hit === ';') {
        out.push({
          start: ruleStart,
          end: q + 1,
          prelude,
          body: null,
          hasBlock: false,
          isAtRule: prelude.trimStart().startsWith('@'),
          children: [],
        });
        p = q + 1;
      } else {
        // stray '}' or EOF — skip to avoid infinite loop
        p = q + 1;
      }
    }
    return out;
  }

  return parseLevel(0, n, 0);
}

// ---------------------------------------------------------------------------
// Normalization (whitespace only, comments stripped for comparison)
// ---------------------------------------------------------------------------
function stripComments(s) {
  return s.replace(/\/\*[\s\S]*?\*\//g, ' ');
}

function normalize(s) {
  return stripComments(s).replace(/\s+/g, ' ').trim();
}

function normalizeRule(rule, src) {
  // Full rule text (prelude + block) normalized.
  const raw = src.slice(rule.start, rule.end);
  return normalize(raw);
}

// ---------------------------------------------------------------------------
// Flatten: domain rules to match = all qualified rules at any level,
// PLUS @keyframes as whole units (they belong to a domain when defined there),
// PLUS block at-rules ONLY as containers (their children match individually).
// ---------------------------------------------------------------------------
function collectMatchableUnits(rules) {
  const units = [];
  for (const r of rules) {
    if (!r.hasBlock) {
      // leaf at-rule (@import etc.) — not something we migrate/remove
      continue;
    }
    if (r.isAtRule && /^@(media|supports|layer|container)\b/i.test(r.prelude.trim())) {
      // container: children are matchable individually
      for (const child of r.children) {
        units.push({ rule: child, container: r });
      }
    } else {
      // qualified rule or @keyframes/@font-face — matchable as a whole unit
      units.push({ rule: r, container: null });
    }
  }
  return units;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
function main() {
  const domainFiles = process.argv.slice(2);
  if (domainFiles.length === 0) {
    console.error('usage: node scripts/remove-migrated-css.mjs <domain-css-file> [...]');
    process.exit(2);
  }

  const compSrc = fs.readFileSync(COMPONENTS_CSS, 'utf8');
  const compRules = parseRules(compSrc);

  // Build index of matchable units in components.css with normalized keys.
  const compUnits = collectMatchableUnits(compRules).map((u) => ({
    ...u,
    key: normalizeRule(u.rule, compSrc),
    removed: false,
  }));

  const stats = {
    domainFiles: [],
    rulesRemoved: 0,
    duplicatesRemoved: 0,
    orphanDomain: [], // { file, rule }
    duplicateHits: [], // { file, rule, count }
  };

  for (const file of domainFiles) {
    if (!fs.existsSync(file)) {
      console.error(`ERROR: domain file not found: ${file}`);
      process.exit(2);
    }
    const dSrc = fs.readFileSync(file, 'utf8');
    const dRules = parseRules(dSrc);
    const dUnits = collectMatchableUnits(dRules);
    stats.domainFiles.push({ file, units: dUnits.length });

    for (const du of dUnits) {
      const key = normalizeRule(du.rule, dSrc);
      // find identical candidates in components.css not already removed
      const hits = compUnits.filter((cu) => !cu.removed && cu.key === key);
      const label = normalize(du.rule.prelude).slice(0, 90);
      if (hits.length === 0) {
        stats.orphanDomain.push({ file, rule: label });
      } else {
        if (hits.length > 1) {
          stats.duplicateHits.push({ file, rule: label, count: hits.length });
        }
        for (const h of hits) {
          h.removed = true;
          stats.rulesRemoved++;
          if (hits.length > 1) stats.duplicatesRemoved++;
        }
      }
    }
  }

  // Build removal ranges from removed units.
  // If ALL children of a container (@media) were removed and nothing else
  // remains in its body except whitespace/comments, remove the whole container
  // block instead of leaving an empty @media shell.
  const removalRanges = [];

  // Index containers present in components.css
  const containers = compRules.filter(
    (r) => r.isAtRule && r.children.length > 0,
  );

  const removedUnitSet = new Set(compUnits.filter((u) => u.removed).map((u) => u.rule));

  const containerFullyEmptied = new Set();
  for (const c of containers) {
    const childUnits = compUnits.filter((u) => u.container === c);
    if (childUnits.length === 0) continue;
    const allRemoved = childUnits.every((u) => removedUnitSet.has(u.rule));
    if (allRemoved) {
      // check remaining body is only whitespace/comments
      const body = compSrc.slice(c.start, c.end);
      const inner = body.slice(body.indexOf('{') + 1, body.lastIndexOf('}'));
      const strippedInner = stripComments(inner).replace(/\s+/g, '');
      const removedTextLen = childUnits
        .map((u) => normalize(compSrc.slice(u.rule.start, u.rule.end)).length)
        .reduce((a, b) => a + b, 0);
      // crude: if the non-comment content of the container equals the concat
      // of the removed children's normalized content, it's empty after removal.
      const normalizedInner = normalize(inner);
      const normalizedChildren = childUnits
        .map((u) => normalize(compSrc.slice(u.rule.start, u.rule.end)))
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();
      if (normalizedInner === normalizedChildren) {
        containerFullyEmptied.add(c);
      }
      void strippedInner;
      void removedTextLen;
    }
  }

  for (const u of compUnits) {
    if (!u.removed) continue;
    if (u.container && containerFullyEmptied.has(u.container)) continue; // container covers it
    removalRanges.push([u.rule.start, u.rule.end]);
  }
  for (const c of containerFullyEmptied) {
    removalRanges.push([c.start, c.end]);
  }

  // Apply removals (sort desc by start).
  removalRanges.sort((a, b) => b[0] - a[0]);
  let out = compSrc;
  for (const [s, e] of removalRanges) {
    out = out.slice(0, s) + out.slice(e);
  }

  // Collapse runs of >2 blank lines left behind (cosmetic, safe).
  out = out.replace(/\n{3,}/g, '\n\n');

  // SANITY: brace balance
  let depth = 0;
  for (const ch of out) {
    if (ch === '{') depth++;
    else if (ch === '}') depth--;
    if (depth < 0) break;
  }
  if (depth !== 0) {
    console.error(`ABORT: brace balance broken after removal (depth=${depth}). components.css NOT written.`);
    process.exit(1);
  }

  fs.writeFileSync(COMPONENTS_CSS, out);

  // Report
  console.log('=== remove-migrated-css report ===');
  for (const d of stats.domainFiles) {
    console.log(`domain file: ${d.file} (${d.units} matchable rules)`);
  }
  console.log(`rules removed from components.css: ${stats.rulesRemoved}`);
  console.log(`  of which duplicate candidates:   ${stats.duplicatesRemoved}`);
  console.log(`empty @media containers removed:   ${containerFullyEmptied.size}`);
  console.log(`orphan-domain (in domain file, NOT found in components.css): ${stats.orphanDomain.length}`);
  for (const o of stats.orphanDomain) console.log(`  [orphan-domain] ${o.file}: ${o.rule}`);
  console.log(`duplicate identical matches (removed ALL): ${stats.duplicateHits.length}`);
  for (const d of stats.duplicateHits) console.log(`  [duplicate] ${d.file}: ${d.rule} x${d.count}`);
  const newLines = out.split('\n').length;
  console.log(`components.css lines now: ${newLines}`);
}

main();
