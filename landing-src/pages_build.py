"""Builds /pricing and /security in the landing page's world. Copy comes from konteks.io."""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import journal_build as jb

SITE = jb.SITE
esc = jb.esc

# ---------------------------------------------------------------- pricing
PLANS = [
  dict(k="free", name="Free", for_="Explore one real Software System with your own model key.", price=0, unit="forever", minSeats=1, maxSeats=1, perSeat=0, pooled=False,
       priceLabel="Rp0", note="1 user", sp="0 monthly, plus a 0.5 SP one-time onboarding grant",
       feats=["1 user, 1 System, 2 repositories", "1 concurrent agent run", "Read-only Core MCP", "Automatic catalog generation", "Story Point top-ups available"],
       cta=("Start building", "https://app.konteks.io/")),
  dict(k="builder", name="Builder", for_="For an individual builder shipping governed repository work.", price=304000, unit="per user / month", minSeats=1, perSeat=2, pooled=False,
       priceLabel="Rp304,000", note="1 seat minimum", sp="2 SP per seat / month",
       feats=["Up to 3 Systems and 10 repositories", "1 concurrent agent run", "Read and write Core MCP", "Basic validation runtime", "Standard support"],
       cta=("Start building", "https://app.konteks.io/")),
  dict(k="team", name="Team", for_="For engineering teams coordinating agents across a shared catalog.", price=624000, unit="per user / month", minSeats=3, perSeat=6, pooled=True,
       priceLabel="Rp624,000", note="3 seats, Rp1,872,000 minimum", sp="6 pooled SP per seat / month", star="Most teams start here",
       feats=["Up to 25 Systems and 100 repositories", "3 concurrent agent runs", "Advanced validation and team presence", "Audit logs and advanced budgets", "Provider policy controls"],
       cta=("Start building", "https://app.konteks.io/")),
  dict(k="scale", name="Scale", for_="For larger organizations that need identity automation and dedicated capacity.", price=1264000, unit="per user / month", minSeats=10, perSeat=15, pooled=True,
       priceLabel="Rp1,264,000", note="10 seats, Rp12,640,000 minimum", sp="15 pooled SP per seat / month",
       feats=["Up to 100 Systems and 500 repositories", "10 concurrent agent runs", "SSO and SCIM", "Dedicated runtime", "Priority support"],
       cta=("Start building", "https://app.konteks.io/")),
  dict(k="enterprise", name="Enterprise", for_="For unrestricted estates, deployment control, and enterprise evidence requirements.", price=None, unit="annual agreement", minSeats=None, perSeat=None,
       priceLabel="Custom", note="USD 2,500 monthly platform minimum", sp="USD 1,000 monthly committed SP spend minimum",
       feats=["Unlimited users, Systems, repositories, and runs", "On-premise and VPC deployment", "Dedicated runtime and support", "Enterprise audit export", "Custom governance and commercial terms"],
       cta=("Talk to us", "mailto:hello@konteks.io?subject=Konteks%20Enterprise")),
]
PRINCIPLES = [
  ("i-users", "Every plan is BYOA", "Bring the coding agent you already pay for. Claude Code and Codex sign in with your subscription, DeepSeek Harness with your key, and OpenCode and Antigravity either way. Provider tokens and money never enter the Story Point total."),
  ("i-note", "Quotes come before runs", "Chargeable stages receive an upfront estimate, a best-effort provider-cost estimate where pricing allows, a budget decision, and an approval boundary before execution."),
  ("i-layers", "Allowances scale with seats", "Builder, Team, and Scale receive monthly Story Points per paid seat. Team and Scale pool them across the workspace."),
  ("i-receipt", "Receipts explain reality", "Completed work reconciles the approved maximum, actual platform usage, provider telemetry, and delivery evidence."),
  ("i-ticket", "Project Management mode on every plan", "PRDs, breakdowns, tickets, and delivery Reports add no new meter. Chargeable work still happens only through quoted, approved Engineering delivery."),
]
NOTES = [
  "Published IDR prices are fixed plan prices, not live foreign-exchange quotes. We will announce pricing changes before they take effect.",
  "Free includes no recurring Story Point allowance. Its 0.5 SP is a one-time onboarding grant. Top-ups remain available where the account and payment method permit them.",
  "Enterprise platform and committed Story Point minimums are separate USD-denominated commercial floors. Final enterprise agreements may include deployment, support, security, and volume terms.",
  "Agentic readiness workshops, role-based training, guided onboarding, and adoption coaching are available as professional services. Scope and pricing are tailored to the organization and are separate unless included in an order.",
  "Taxes, model-provider charges, cloud infrastructure outside the plan, and optional paid support may be billed separately where applicable.",
]

def pricing():
    cols = ""
    for p in PLANS:
        feats = "".join(f'<li><svg class="ico"><use href="#i-check"/></svg>{esc(f)}</li>' for f in p["feats"])
        data = "" if p["price"] is None else f' data-price="{p["price"]}" data-min="{p["minSeats"]}" data-max="{p.get("maxSeats", 0)}" data-sp="{p["perSeat"]}" data-pooled="{int(p["pooled"])}"'
        star = f'<span class="star">{p["star"]}</span>' if p.get("star") else ""
        btn = "btn-go" if p["k"] == "team" else "btn-line"
        cols += f'''<article class="plan{' hi' if p.get('star') else ''}" data-k="{p['k']}"{data}>
  <header class="p-h">{star}<h3>{p["name"]}</h3><p>{esc(p["for_"])}</p></header>
  <div class="p-price"><b class="tab">{p["priceLabel"]}</b><span>{p["unit"]}</span><small>{esc(p["note"])}</small></div>
  <div class="p-est" aria-live="polite"><span class="est-l">For <span class="seats-n">5 people</span></span><b class="tab est-v">{'Custom' if p['price'] is None else ''}</b><small class="est-s">{'Annual agreement' if p['price'] is None else ''}</small></div>
  <div class="p-sp"><span>Included Story Points</span><b>{esc(p["sp"])}</b><small class="sp-calc"></small></div>
  <ul class="p-f">{feats}</ul>
  <a class="btn {btn}" href="{p['cta'][1]}">{p['cta'][0]} <svg class="ico"><use href="#{'i-out' if p['cta'][1].startswith('https') else 'i-arrow'}"/></svg></a>
</article>'''
    prin = "".join(f'<li><span class="pi"><svg class="ico"><use href="#{ic}"/></svg></span><div><h3>{esc(t)}</h3><p>{esc(d)}</p></div></li>' for ic, t, d in PRINCIPLES)
    notes = "".join(f"<li>{esc(n)}</li>" for n in NOTES)
    body = f'''<section class="px-hero">
  <div class="wrap">
    <h1>Pay for governed work. <span>Bring your own agent.</span></h1>
    <p class="lede">Every Konteks plan is BYOA, Bring Your Own Agent. Claude Code, Codex, DeepSeek Harness, OpenCode, or Antigravity works on your own computer under the subscription or key you already have, and your provider bills you directly. Konteks Story Points pay for orchestration, execution, validation, evidence, and platform control.</p>
    <p class="ref"><span>Overage and top-up reference</span><b class="tab">Rp192,000 per Story Point</b></p>
  </div>
  <div class="bills" aria-label="Two bills that never mix">
    <div class="wrap bills-in">
      <div class="bill up"><span class="bi"><svg class="ico"><use href="#i-users"/></svg></span><div><h2>Your model provider</h2><p>Tokens run on the subscription or key you already have. Your provider bills you directly, never marked up.</p></div></div>
      <div class="bill-line" aria-hidden="true"><i class="d d1"></i><i class="d d2"></i><i class="d d3"></i><span>Provider tokens and money never enter the Story Point total.</span></div>
      <div class="bill dn"><span class="bi"><svg class="ico"><use href="#i-receipt"/></svg></span><div><h2>Konteks Story Points</h2><p>Orchestration, execution, validation, evidence, and platform control. Quoted before a run, settled on a receipt.</p></div></div>
    </div>
  </div>
</section>

<section class="plans-sec" aria-labelledby="h-plans">
  <div class="wrap">
    <div class="plans-top">
      <h2 id="h-plans">Plans</h2>
      <div class="seats" role="group" aria-label="How many people will use Konteks">
        <label for="seats">People on Konteks</label>
        <div class="stepper"><button type="button" id="sMinus" aria-label="One fewer person">−</button><input id="seats" type="number" inputmode="numeric" min="1" max="500" value="5"><button type="button" id="sPlus" aria-label="One more person">+</button></div>
        <input id="seatsR" type="range" min="1" max="60" value="5" aria-label="People on Konteks">
        <small>Totals use the published prices and seat minimums, before taxes and provider charges.</small>
      </div>
    </div>
    <div class="plans">{cols}</div>
  </div>
</section>

<section class="theatre" aria-labelledby="h-theatre">
  <div class="wrap theatre-g">
    <div class="theatre-l"><h2 id="h-theatre">No token theatre.</h2><p>What a Story Point pays for, and what it never hides.</p></div>
    <ol class="prin">{prin}</ol>
  </div>
</section>

<section class="notes-sec" aria-labelledby="h-notes">
  <div class="wrap notes-g">
    <h2 id="h-notes">Pricing notes</h2>
    <div><ul class="notes">{notes}</ul><a class="lnk" href="/terms">See the Terms <svg class="ico"><use href="#i-arrow"/></svg></a></div>
  </div>
</section>

<section class="px-close moss" aria-labelledby="h-pclose">
  <div class="wrap px-close-in">
    <h2 id="h-pclose">Start with Free. Say yes when the quote is right.</h2>
    <div class="acts"><a class="btn btn-go" href="https://app.konteks.io/">Start building <svg class="ico"><use href="#i-out"/></svg></a><a class="btn btn-line" href="mailto:hello@konteks.io?subject=Konteks%20Enterprise">Talk to us about Enterprise <svg class="ico"><use href="#i-arrow"/></svg></a></div>
  </div>
</section>'''
    css = SHARED_CSS + PRICING_CSS
    js = jb.COMMON_JS + PRICING_JS
    return jb.page("Pricing | Konteks", "Pay for governed work. Bring your own agent. Konteks plans, Story Points and pricing notes.", body, css, js, active="pricing")

SHARED_CSS = r'''
.nav-links a[aria-current="page"]{color:var(--ink);background:var(--hover)}
h1{font-size:clamp(2.5rem,1.4rem + 3.8vw,5rem);letter-spacing:-.04em;line-height:.98;max-width:16ch}
h1 span{display:block;color:var(--accent)}
.lede{margin-top:24px;font-size:clamp(17px,1rem + .3vw,19.5px);color:var(--ink-2);max-width:62ch;line-height:1.6}
.sec-h2{font-size:clamp(2rem,1.2rem + 2.4vw,3.5rem)}
@keyframes flowx{from{transform:translateX(-10%)}to{transform:translateX(110%)}}
@media (prefers-reduced-motion:reduce){.d{display:none}}
'''

PRICING_CSS = r'''
.px-hero{padding-top:clamp(56px,8vw,120px)}
.ref{margin-top:24px;display:inline-flex;flex-wrap:wrap;align-items:baseline;gap:6px 12px;padding:10px 16px;border-radius:12px;background:var(--accent-soft);border:1px solid var(--line-accent);font-size:14px;color:var(--ink-2)}
.ref b{font:640 18px/1 var(--display);color:var(--accent-ink)}
.bills{margin-top:clamp(48px,6vw,80px);background:linear-gradient(var(--paper) 0 50%,var(--moss) 50% 100%)}
.bills-in{display:grid;grid-template-rows:auto auto auto}
.bill{display:flex;gap:18px;align-items:flex-start;max-width:640px;padding:28px 0}
.bill h2{font-size:clamp(22px,1rem + 1vw,30px)}
.bill p{margin-top:6px;font-size:16px;color:var(--ink-2)}
.bill.dn{color:var(--on-moss);justify-self:end}
.bill.dn p{color:var(--on-moss-2)}
.bi{width:48px;height:48px;border-radius:14px;display:grid;place-items:center;flex:none;background:var(--accent-soft);color:var(--accent-ink)}
.bill.dn .bi{background:rgba(143,191,106,.16);color:var(--live)}
.bill-line{position:relative;height:1px;background:var(--live);margin:0 calc(50% - 50vw)}
.bill-line span{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);white-space:nowrap;background:var(--paper);border:1px solid var(--live);color:var(--accent-ink);font:600 13px/1 var(--sans);padding:9px 14px;border-radius:999px}
.bill-line .d{position:absolute;top:-4px;left:0;width:8px;height:8px;border-radius:50%;background:var(--live);animation:flowx 6s linear infinite}
.bill-line .d2{animation-delay:-2s}.bill-line .d3{animation-delay:-4s}
@media (max-width:700px){.bill-line span{white-space:normal;width:86%;text-align:center}.bills{background:linear-gradient(var(--paper) 0 48%,var(--moss) 48% 100%)}.bill.dn{justify-self:start}}
.plans-sec{padding:clamp(80px,10vw,152px) 0 0}
.plans-top{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:20px 40px;align-items:end}
.plans-top h2{font-size:clamp(2rem,1.2rem + 2.4vw,3.5rem)}
.seats{display:grid;grid-template-columns:auto auto;gap:10px 16px;align-items:center;justify-items:start}
.seats label{font:600 14px/1 var(--sans)}
.seats small{grid-column:1/-1;font-size:12.5px;color:var(--ink-3);max-width:44ch}
.seats input[type=range]{grid-column:1/-1;width:100%;accent-color:var(--accent)}
.stepper{display:flex;align-items:center;border:1px solid var(--line-strong);border-radius:999px;overflow:hidden;background:var(--surface)}
.stepper button{all:unset;cursor:pointer;width:40px;height:40px;display:grid;place-items:center;font:600 18px/1 var(--sans);color:var(--ink)}
.stepper button:hover{background:var(--hover)}
.stepper button:focus-visible,.stepper input:focus-visible{outline:2px solid var(--accent-strong);outline-offset:-2px}
.stepper input{width:56px;height:40px;border:0;background:transparent;text-align:center;font:640 18px/1 var(--display);color:var(--ink);-moz-appearance:textfield}
.stepper input::-webkit-inner-spin-button{appearance:none}
.plans{margin-top:clamp(28px,3vw,40px);display:grid;grid-template-columns:repeat(5,minmax(0,1fr));grid-template-rows:repeat(6,auto);border:1px solid var(--line-strong);border-radius:24px;background:var(--surface);overflow:hidden}
.plan{grid-row:span 6;display:grid;grid-template-rows:subgrid;gap:0;border-left:1px solid var(--line);position:relative;transition:background .4s var(--ease)}
.plan:first-child{border-left:0}
.plan > *{padding:18px 20px}
.plan.hi{background:var(--accent-soft)}
.plan.hi::before{content:"";position:absolute;left:0;right:0;top:0;height:3px;background:var(--accent)}
.p-h h3{font-size:24px;font-weight:620}
.p-h p{margin-top:6px;font-size:14px;color:var(--ink-2);line-height:1.45}
.star{display:inline-block;margin-bottom:8px;font:600 12px/1 var(--sans);color:var(--on-accent);background:var(--accent);padding:5px 9px;border-radius:999px}
.p-price{display:grid;gap:3px;border-top:1px solid var(--line)}
.p-price b{font:640 clamp(22px,1rem + .8vw,28px)/1.05 var(--display);letter-spacing:-.02em}
.p-price span{font-size:13px;color:var(--ink-2)}
.p-price small{font-size:12.5px;color:var(--ink-3)}
.p-est{display:grid;gap:3px;background:var(--sunken);border-top:1px solid var(--line);border-bottom:1px solid var(--line)}
.plan.hi .p-est{background:color-mix(in srgb,var(--accent-soft) 60%,var(--surface))}
.est-l{font-size:12.5px;color:var(--ink-3)}
.est-v{font:640 19px/1.15 var(--display);color:var(--accent-ink);transition:opacity .2s}
.est-s{font-size:12.5px;color:var(--ink-3);min-height:1.3em}
.p-sp{display:grid;gap:4px}
.p-sp span{font-size:12.5px;color:var(--ink-3)}
.p-sp b{font:600 14px/1.35 var(--sans)}
.sp-calc{font-size:12.5px;color:var(--accent-ink);font-weight:600;min-height:1.2em}
.p-f{list-style:none;margin:0;display:grid;gap:9px;align-content:start;border-top:1px solid var(--line)}
.p-f li{display:grid;grid-template-columns:16px minmax(0,1fr);gap:8px;font-size:14px;line-height:1.4;color:var(--ink-2)}
.p-f svg{color:var(--accent);margin-top:2px}
.plan > .btn{margin:4px 20px 22px;padding:0 16px;justify-content:center;--h:44px;font-size:14px}
.plan.dim .p-est{opacity:.55}
@media (max-width:1100px){
  .plans-top{grid-template-columns:1fr}
  .plans{grid-template-columns:1fr;grid-template-rows:none;border:0;background:none;gap:16px;overflow:visible}
  .plan{grid-row:auto;grid-template-rows:none;display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);border:1px solid var(--line-strong);border-radius:20px;background:var(--surface);overflow:hidden}
  .plan.hi{background:var(--accent-soft)}
  .plan .p-h{grid-column:1/-1}.plan .p-f{grid-column:1/-1}.plan > .btn{grid-column:1/-1;justify-self:start}
  .plan .p-est{border-bottom:0}
}
@media (max-width:560px){.plan{grid-template-columns:1fr}.plan .p-est,.plan .p-price{grid-column:1/-1}}
.theatre{padding:clamp(96px,12vw,176px) 0 0}
.theatre-g{display:grid;grid-template-columns:minmax(0,.8fr) minmax(0,1.2fr);gap:clamp(32px,6vw,96px);align-items:start}
.theatre-l{position:sticky;top:120px}
.theatre-l h2{font-size:clamp(2.2rem,1.3rem + 3vw,4rem)}
.theatre-l p{margin-top:14px;font-size:17px;color:var(--ink-2)}
.prin{list-style:none;margin:0;padding:0;border-top:1px solid var(--line-strong)}
.prin li{display:grid;grid-template-columns:52px minmax(0,1fr);gap:20px;padding:26px 0;border-bottom:1px solid var(--line)}
.pi{width:52px;height:52px;border-radius:16px;display:grid;place-items:center;background:var(--accent-soft);color:var(--accent-ink);transition:background .4s,color .4s,transform .4s var(--ease)}
.prin li.on .pi{background:var(--accent);color:var(--on-accent);transform:rotate(-6deg)}
.prin h3{font:620 clamp(20px,1rem + .6vw,25px)/1.2 var(--display);letter-spacing:-.02em}
.prin p{margin-top:8px;font-size:16px;color:var(--ink-2);max-width:56ch}
.notes-sec{padding:clamp(96px,12vw,176px) 0}
.notes-g{display:grid;grid-template-columns:minmax(0,.8fr) minmax(0,1.2fr);gap:clamp(32px,6vw,96px)}
.notes-g h2{font-size:clamp(1.6rem,1rem + 1.4vw,2.4rem)}
.notes{margin:0 0 24px;padding:0 0 0 1.1em;display:grid;gap:12px;font-size:14.5px;line-height:1.55;color:var(--ink-2)}
.notes li::marker{color:var(--accent)}
.px-close{padding:clamp(72px,9vw,128px) 0;border-top:1px solid var(--live)}
.px-close-in{display:grid;gap:28px}
.px-close h2{font-size:clamp(2.2rem,1.3rem + 3vw,4.25rem);max-width:18ch;color:var(--on-moss)}
.px-close .acts{display:flex;flex-wrap:wrap;gap:12px}
.px-close .btn-go{background:var(--live);color:#1F2B20}
.px-close .btn-line{background:transparent;color:var(--on-moss);border-color:var(--moss-line-2)}
@media (max-width:900px){.theatre-g,.notes-g{grid-template-columns:1fr}.theatre-l{position:static}}
'''

PRICING_JS = r'''
const seats = $("#seats"), range = $("#seatsR"), plans = $$(".plan[data-price]");
const idr = n => "Rp" + Math.round(n).toLocaleString("en-US");
const update = (v, from) => {
  v = Math.max(1, Math.min(500, Math.round(+v || 1)));
  if (from !== "in") seats.value = v; if (from !== "range") range.value = Math.min(60, v);
  $$(".seats-n").forEach(e => e.textContent = v === 1 ? "1 person" : v + " people");
  plans.forEach(p => {
    const price = +p.dataset.price, min = +p.dataset.min, max = +p.dataset.max, sp = +p.dataset.sp, pooled = p.dataset.pooled === "1";
    const val = $(".est-v", p), sub = $(".est-s", p), spc = $(".sp-calc", p);
    if (max && v > max) { p.classList.add("dim"); val.textContent = "1 user only"; sub.textContent = "Move to Builder or Team"; spc.textContent = ""; return; }
    p.classList.remove("dim");
    const billed = Math.max(v, min);
    val.textContent = price === 0 ? "Rp0" : idr(price * billed) + " / month";
    sub.textContent = price === 0 ? "Forever" : billed > v ? `Billed for the ${min}-seat minimum` : `${billed} seat${billed > 1 ? "s" : ""} × ${idr(price)}`;
    spc.textContent = sp ? `${sp * billed} SP / month${pooled ? ", pooled" : ""}` : "";
  });
};
seats.addEventListener("input", () => update(seats.value, "in"));
seats.addEventListener("change", () => update(seats.value));
range.addEventListener("input", () => update(range.value, "range"));
$("#sMinus").onclick = () => update(+seats.value - 1);
$("#sPlus").onclick = () => update(+seats.value + 1);
update(5);
// the principle in view lights up
const prin = $$(".prin li");
const onS = () => { const vh = innerHeight; let best = -1, bd = 1e9; prin.forEach((li, i) => { const r = li.getBoundingClientRect(), d = Math.abs(r.top + r.height / 2 - vh * .5); if (d < bd) { bd = d; best = i; } }); prin.forEach((li, i) => li.classList.toggle("on", i === best)); };
addEventListener("scroll", onS, { passive: true }); onS();
'''

# ---------------------------------------------------------------- security
CONTROLS = [
  ("tenant", "i-layers", "Tenant boundaries", "Konteks authorization and catalog access are tenant-scoped. Credentials and permissions should grant only the access needed for the intended workspace and action."),
  ("secret", "i-receipt", "Secrets stay secret", "Provider and connector credentials are kept in protected secret storage. Public APIs, MCP discovery, prompts, screenshots, and routine logs must not reveal raw secret material."),
  ("human", "i-users", "Human authority", "Costed work is designed around an explicit proposal and approval boundary. High-impact mutations remain subject to permissions, policy, budget, and human confirmation."),
  ("audit", "i-note", "Auditable delivery", "Sessions, proposal versions, approvals, runs, validation, usage, and outcomes are correlated so teams can understand what happened and why."),
  ("revoke", "i-route", "Revocable access", "MCP and connector credentials can be scoped, rotated, revoked, and replaced. Access should be removed promptly when a person, agent, or integration no longer needs it."),
]

SCOPE_SVG = r'''<svg class="scope" viewBox="0 0 420 420" role="img" aria-label="An agent's scope sits inside the person who supervises it, inside the workspace, inside the tenant">
  <g class="ring r-tenant"><rect x="10" y="10" width="400" height="400" rx="36"/><text x="34" y="44">Tenant</text></g>
  <g class="ring r-ws"><rect x="54" y="70" width="312" height="300" rx="30"/><text x="76" y="102">Workspace</text></g>
  <g class="ring r-person"><rect x="98" y="128" width="224" height="200" rx="24"/><text x="120" y="158">Person</text></g>
  <g class="ring r-agent"><rect x="146" y="186" width="128" height="96" rx="18"/><text x="210" y="240">Agent</text></g>
  <g class="gate"><rect x="176" y="164" width="68" height="28" rx="14"/><text x="210" y="183">Yes</text></g>
  <g class="vault"><rect x="300" y="300" width="88" height="70" rx="14"/><path d="M332 326v-6a12 12 0 0 1 24 0v6"/><rect x="324" y="326" width="40" height="28" rx="6"/></g>
  <g class="trail"><circle cx="70" cy="390" r="5"/><circle cx="120" cy="390" r="5"/><circle cx="170" cy="390" r="5"/><circle cx="220" cy="390" r="5"/><path d="M70 390H220"/></g>
  <g class="key"><circle cx="300" cy="226" r="12"/><path d="M312 226h34M334 226v10M342 226v8"/><path class="cut" d="M290 206 352 250"/></g>
</svg>'''

def security():
    items = "".join(f'<li data-k="{k}"><span class="pi"><svg class="ico"><use href="#{ic}"/></svg></span><div><h3>{esc(t)}</h3><p>{esc(d)}</p></div></li>' for k, ic, t, d in CONTROLS)
    body = f'''<section class="sx-hero">
  <div class="wrap">
    <h1>Agents should inherit <span>less authority than the people who supervise them.</span></h1>
    <p class="lede">Konteks is built around scoped context, revocable credentials, explicit approval, tenant boundaries, and evidence. We publish controls we can stand behind, not certification theatre.</p>
  </div>
</section>
<section class="sx-body" aria-label="Controls">
  <div class="wrap sx-g">
    <div class="sx-l"><figure class="scope-fig" id="scope" data-k="tenant">{SCOPE_SVG}<figcaption id="scopeCap">Every scope sits inside the one above it.</figcaption></figure></div>
    <ol class="ctrl" id="ctrl">{items}</ol>
  </div>
</section>
<section class="disclose moss" aria-labelledby="h-disc">
  <div class="wrap disc-g">
    <h2 id="h-disc">Responsible disclosure</h2>
    <div><p>If you believe you found a vulnerability, do not test against other tenants or access data that is not yours. Send the details privately to hello@konteks.io.</p>
    <a class="btn btn-go" href="mailto:hello@konteks.io?subject=Security%20report">Report it privately <svg class="ico"><use href="#i-arrow"/></svg></a></div>
  </div>
</section>'''
    js = jb.COMMON_JS + r'''
const fig = $("#scope"), cap = $("#scopeCap"), items = $$("#ctrl li");
const CAPS = { tenant: "Access ends at the tenant boundary.", secret: "Secrets live in protected storage, never in prompts, screenshots or logs.", human: "Costed work waits for a person's yes.", audit: "Every step leaves a trail that ties together.", revoke: "An agent's key can be rotated or revoked at any time." };
let cur = "";
const onS = () => {
  const vh = innerHeight; let best = 0, bd = 1e9;
  items.forEach((li, i) => { const r = li.getBoundingClientRect(), d = Math.abs(r.top + Math.min(r.height, 200) / 2 - vh * .45); if (d < bd) { bd = d; best = i; } });
  items.forEach((li, i) => li.classList.toggle("on", i === best));
  const k = items[best].dataset.k; if (k !== cur) { cur = k; fig.dataset.k = k; cap.textContent = CAPS[k]; }
};
addEventListener("scroll", onS, { passive: true }); onS();
'''
    return jb.page("Security | Konteks", "Agents should inherit less authority than the people who supervise them. Konteks security controls.", body, SHARED_CSS + SECURITY_CSS, js, active="security")

SECURITY_CSS = r'''
.sx-hero{padding:clamp(56px,8vw,120px) 0 0}
.sx-hero h1{max-width:20ch}
.sx-body{padding:clamp(72px,9vw,128px) 0 clamp(96px,12vw,176px)}
.sx-g{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:clamp(40px,7vw,112px);align-items:start}
.sx-l{position:sticky;top:110px}
.scope-fig{margin:0;padding:clamp(20px,3vw,32px);border-radius:28px;background:var(--surface);border:1px solid var(--line);box-shadow:var(--shadow-2)}
.scope{width:100%;height:auto;display:block}
.scope .ring rect{fill:none;stroke:var(--line-strong);stroke-width:1.5;transition:stroke .4s,fill .4s,stroke-width .4s}
.scope .ring text{font:600 14px var(--sans);fill:var(--ink-3);transition:fill .4s}
.scope .r-agent rect{fill:var(--moss);stroke:var(--moss)}
.scope .r-agent text{fill:var(--on-moss);text-anchor:middle;font:640 18px var(--display)}
.scope .gate rect{fill:var(--accent)}.scope .gate text{fill:var(--on-accent);text-anchor:middle;font:700 14px var(--display)}
.scope .gate,.scope .vault,.scope .trail,.scope .key{opacity:0;transition:opacity .5s var(--ease),transform .6s var(--ease)}
.scope .vault rect,.scope .vault path{fill:none;stroke:var(--accent-ink);stroke-width:2.2;stroke-linecap:round}
.scope .vault > rect:first-child{fill:var(--accent-soft)}
.scope .trail circle{fill:var(--accent-strong)}.scope .trail path{stroke:var(--accent-strong);stroke-width:2;stroke-dasharray:4 5}
.scope .key circle,.scope .key path{fill:none;stroke:var(--live);stroke-width:3;stroke-linecap:round}
.scope .key .cut{stroke:var(--danger);stroke-dasharray:80;stroke-dashoffset:80;transition:stroke-dashoffset .8s var(--ease) .3s}
[data-k="tenant"] .r-tenant rect{stroke:var(--accent-strong);stroke-width:3;fill:var(--accent-soft)}
[data-k="tenant"] .r-tenant text{fill:var(--accent-ink)}
[data-k="secret"] .vault{opacity:1}
[data-k="human"] .r-person rect{stroke:var(--accent-strong);stroke-width:3;fill:var(--accent-soft)}
[data-k="human"] .r-person text{fill:var(--accent-ink)}
[data-k="human"] .gate{opacity:1}
[data-k="audit"] .trail{opacity:1}
[data-k="revoke"] .key{opacity:1}
[data-k="revoke"] .key .cut{stroke-dashoffset:0}
[data-k="revoke"] .r-agent rect{stroke-dasharray:6 6;fill:color-mix(in srgb,var(--moss) 70%,var(--surface))}
.scope-fig figcaption{margin-top:16px;font-size:15px;color:var(--ink-2);min-height:3em}
.ctrl{list-style:none;margin:0;padding:6vh 0 20vh;display:grid;gap:clamp(64px,14vh,160px)}
.ctrl li{display:grid;grid-template-columns:56px minmax(0,1fr);gap:20px;opacity:.35;transform:translateX(12px);transition:opacity .5s var(--ease),transform .5s var(--ease)}
.ctrl li.on{opacity:1;transform:none}
.pi{width:56px;height:56px;border-radius:16px;display:grid;place-items:center;background:var(--accent-soft);color:var(--accent-ink);transition:background .4s,color .4s}
.ctrl li.on .pi{background:var(--accent);color:var(--on-accent)}
.ctrl h3{font-size:clamp(28px,1.2rem + 1.8vw,44px);font-weight:620}
.ctrl p{margin-top:12px;font-size:17px;color:var(--ink-2);max-width:48ch;line-height:1.6}
.disclose{padding:clamp(72px,9vw,128px) 0;border-top:1px solid var(--live)}
.disc-g{display:grid;grid-template-columns:minmax(0,.8fr) minmax(0,1.2fr);gap:clamp(32px,6vw,96px);align-items:start}
.disc-g h2{font-size:clamp(2rem,1.2rem + 2.4vw,3.5rem);color:var(--on-moss)}
.disc-g p{font-size:18px;color:var(--on-moss-2);max-width:52ch;margin-bottom:24px}
.disclose .btn-go{background:var(--live);color:#1F2B20}
@media (max-width:900px){.sx-g,.disc-g{grid-template-columns:1fr}.sx-l{position:sticky;top:72px;z-index:2}.scope-fig{padding:12px;display:grid;grid-template-columns:120px minmax(0,1fr);gap:14px;align-items:center;border-radius:18px}.scope-fig figcaption{margin:0;font-size:14px;min-height:0}.ctrl{padding:24px 0 30vh;gap:56px}.ctrl li{grid-template-columns:44px minmax(0,1fr);gap:14px}.pi{width:44px;height:44px;border-radius:12px}}
'''

if __name__ == "__main__":
    open(os.path.join(SITE, "pricing.html"), "w").write(pricing())
    open(os.path.join(SITE, "security.html"), "w").write(security())
    print("pricing + security built")
