/* ===== Reveal on scroll (marketing pages only) =====
   Headings wipe up into place, the paragraph under them follows, and groups of cards arrive one after another.
   Each fires once. Tokens: --d-reveal, --stagger, --ease (tokens.css). Without JS, or with reduced motion,
   everything is simply there (reduced motion keeps a short fade). Catalogued in Foundations > Motion. */
(() => {
  const root = document.documentElement;
  if (!("IntersectionObserver" in window) || window.__kxReveal) return; window.__kxReveal = 1;
  const skip = "#week-sec, figure, .sheet, .rec, .lanes, .rstage, .rule-v, .auth, .scope-fig, .kflow, .week, .eras, [aria-hidden=true], .foot";
  const heads = [...document.querySelectorAll("main h1, main h2, section h2, .sec-h > p, .theory-p, .sec-lead, .ph > p, .page-h > p, .lede-s")]
    .filter(el => el.id !== "h1" && !el.closest(skip) && !el.closest(".hero"));
  const groups = [...document.querySelectorAll(".roster, .tiles, .offer, .roles, .learn2, .close-acts, .jgrid, .jlist, .bills, .tiers, .dgrid, .smap, .beliefs, .explore, .ctrl")]
    .filter(g => !g.closest(skip));
  heads.forEach(el => el.classList.add(el.matches("h1, h2") ? "rv-h" : "rv-p"));
  groups.forEach(g => [...g.children].forEach((c, i) => { c.classList.add("rv-i"); c.style.setProperty("--i", Math.min(i, 8)); }));
  /* Section pictures arrive with the animation-on-scroll pattern (keyframes paused until seen). */
  const big = [...document.querySelectorAll("#loop, .acp, .train, .smap, .auth, .scope-fig, .jfeature")]
    .concat(matchMedia("(min-width:901px)").matches ? [...document.querySelectorAll("#record .rec, #record .teams")] : []);
  big.forEach(el => el.classList.add("animate-on-scroll"));
  const aio = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add("animate"); aio.unobserve(e.target); } }), { threshold: 0.15, rootMargin: "0px 0px -10% 0px" });
  big.forEach(el => aio.observe(el));
  root.classList.add("rv-on");
  /* A clipped heading does not count as visible to IntersectionObserver, so each element is watched through its parent. */
  const reveal = el => {
    el.classList.add("rv-in");
    /* Once it has landed, hand the element back to its own styles (hover transitions, shadows). */
    setTimeout(() => el.classList.remove("rv-h", "rv-p", "rv-i", "rv-in"), 1100 + (+el.style.getPropertyValue("--i") || 0) * 60);
  };
  const waiting = new Map();
  [...heads, ...groups.flatMap(g => [...g.children])].forEach(el => { const t = el.parentElement; if (!waiting.has(t)) waiting.set(t, []); waiting.get(t).push(el); });
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    io.unobserve(e.target); (waiting.get(e.target) || []).forEach(reveal);
  }), { rootMargin: "0px 0px -12% 0px", threshold: 0.01 });
  waiting.forEach((_, t) => io.observe(t));
})();
