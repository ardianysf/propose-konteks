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
       cta=("Start building", "/login")),
  dict(k="builder", name="Builder", for_="For an individual builder shipping governed repository work.", price=304000, unit="per user / month", minSeats=1, perSeat=2, pooled=False,
       priceLabel="Rp304,000", note="1 seat minimum", sp="2 SP per seat / month",
       feats=["Up to 3 Systems and 10 repositories", "1 concurrent agent run", "Read and write Core MCP", "Basic validation runtime", "Standard support"],
       cta=("Start building", "/login")),
  dict(k="team", name="Team", for_="For engineering teams coordinating agents across a shared catalog.", price=624000, unit="per user / month", minSeats=3, perSeat=6, pooled=True,
       priceLabel="Rp624,000", note="3 seats, Rp1,872,000 minimum", sp="6 pooled SP per seat / month", star="Most teams start here",
       feats=["Up to 25 Systems and 100 repositories", "3 concurrent agent runs", "Advanced validation and team presence", "Audit logs and advanced budgets", "Provider policy controls"],
       cta=("Start building", "/login")),
  dict(k="scale", name="Scale", for_="For larger organizations that need identity automation and dedicated capacity.", price=1264000, unit="per user / month", minSeats=10, perSeat=15, pooled=True,
       priceLabel="Rp1,264,000", note="10 seats, Rp12,640,000 minimum", sp="15 pooled SP per seat / month",
       feats=["Up to 100 Systems and 500 repositories", "10 concurrent agent runs", "SSO and SCIM", "Dedicated runtime", "Priority support"],
       cta=("Start building", "/login")),
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
    <div class="acts"><a class="btn btn-go" href="/login">Start building <svg class="ico"><use href="#i-arrow"/></svg></a><a class="btn btn-line" href="mailto:hello@konteks.io?subject=Konteks%20Enterprise">Talk to us about Enterprise <svg class="ico"><use href="#i-arrow"/></svg></a></div>
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
.bills{margin-top:clamp(32px,4vw,56px);background:linear-gradient(var(--paper) 0 50%,var(--moss) 50% 100%)}
.bills-in{display:grid;grid-template-rows:auto auto auto}
.bill{display:flex;gap:20px;align-items:flex-start;max-width:720px;padding:clamp(48px,6vw,80px) 0}
.bill.up{padding-bottom:clamp(56px,7vw,88px)}
.bill.dn{padding-top:clamp(64px,8vw,104px)}
.bill h2{font-size:clamp(22px,1rem + 1vw,30px)}
.bill p{margin-top:6px;font-size:16px;color:var(--ink-2)}
.bill.dn{color:var(--on-moss)}
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

SCOPE_SVG = r'''<div class="auth" role="img" aria-label="Example: what Rachel may do, and what the agent acting for her may do">
  <div class="auth-h"><b>Authority in one session</b><span class="eg">Example</span></div>
  <div class="auth-who"><span></span><span class="who-p"><i class="av-s">R</i>Rachel<small>Product lead</small></span><span class="who-a"><i class="av-s ag">CC</i>Claude Code<small>acts for Rachel</small></span></div>
  <ul class="auth-rows">
    <li data-r="tenant"><span>Read billing-web and invoices-api</span><em class="ok">Allowed</em><em class="ok">Allowed</em></li>
    <li data-r="human"><span>Run costed work</span><em class="ok">Allowed</em><em class="ask">Waits for her yes</em></li>
    <li data-r="human"><span>Merge to main</span><em class="ok">Allowed</em><em class="ask">Waits for her yes</em></li>
    <li data-r="secret"><span>See provider keys</span><em class="mask">Masked</em><em class="no">Never</em></li>
    <li data-r="tenant"><span>Another tenant’s data</span><em class="no">Never</em><em class="no">Never</em></li>
  </ul>
  <div class="auth-foot">
    <div class="af af-audit"><b>Record</b><ol><li><time>09:20</time>Rachel approved plan v2</li><li><time>09:21</time>Claude Code opened pull request #318</li><li><time>09:40</time>Tests passed, receipt settled</li></ol></div>
    <div class="af af-revoke"><b>MCP credential for Claude Code</b><div class="cred"><code>kx_live_••••••7f2</code><span class="st">Active</span><span class="st off">Revoked</span></div><div class="cred-acts"><span>Rotate</span><span class="rv">Revoke</span></div></div>
    <div class="af af-secret"><b>Never shown</b><div class="nv"><span>Prompts</span><span>Screenshots</span><span>Logs</span><span>MCP discovery</span></div></div>
    <div class="af af-tenant"><b>Tenant</b><p>Refactory workspace only. Nothing crosses to another tenant.</p></div>
    <div class="af af-human"><b>Approval boundary</b><p>Costed work and high-impact changes wait for a person with the right role.</p></div>
  </div>
</div>'''

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
    <div class="sx-l"><figure class="scope-fig" id="scope" data-k="tenant">{SCOPE_SVG}</figure></div>
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
const fig = $("#scope"), items = $$("#ctrl li");
const CAPS = { tenant: "Access ends at the tenant boundary.", secret: "Secrets live in protected storage, never in prompts, screenshots or logs.", human: "Costed work waits for a person's yes.", audit: "Every step leaves a trail that ties together.", revoke: "An agent's key can be rotated or revoked at any time." };
let cur = "";
const onS = () => {
  const vh = innerHeight; let best = 0, bd = 1e9;
  items.forEach((li, i) => { const r = li.getBoundingClientRect(), d = Math.abs(r.top + Math.min(r.height, 200) / 2 - vh * .45); if (d < bd) { bd = d; best = i; } });
  items.forEach((li, i) => li.classList.toggle("on", i === best));
  const k = items[best].dataset.k; if (k !== cur) { cur = k; fig.dataset.k = k; }
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
.scope-fig{margin:0}
.auth{border-radius:24px;background:var(--surface);border:1px solid var(--line);box-shadow:var(--shadow-2);overflow:hidden}
.auth-h{display:flex;justify-content:space-between;align-items:center;padding:16px 20px;border-bottom:1px solid var(--line);font-size:14px}
.auth-h b{font-weight:600}
.auth-who,.auth-rows li{display:grid;grid-template-columns:minmax(0,1.3fr) minmax(0,1fr) minmax(0,1fr);gap:12px;align-items:center;padding:0 20px}
.auth-who{padding-top:16px;padding-bottom:12px;font:600 14px/1.2 var(--sans)}
.auth-who span{display:grid;grid-template-columns:auto 1fr;column-gap:8px;align-items:center}
.auth-who small{grid-column:2;font-weight:400;font-size:12px;color:var(--ink-3)}
.av-s{grid-row:span 2;width:30px;height:30px;border-radius:50%;display:grid;place-items:center;font:700 11px/1 var(--sans);font-style:normal;background:var(--accent);color:var(--on-accent)}
.av-s.ag{border-radius:9px;background:var(--moss);color:var(--live)}
.auth-rows{list-style:none;margin:0;padding:0;border-top:1px solid var(--line)}
.auth-rows li{padding-top:13px;padding-bottom:13px;border-bottom:1px solid var(--line);font-size:14px;transition:background .4s var(--ease),opacity .4s}
.auth-rows li > span{color:var(--ink)}
.auth-rows em{font-style:normal;justify-self:start;display:inline-flex;align-items:center;gap:6px;font:600 12.5px/1 var(--sans);padding:6px 9px;border-radius:999px}
.auth-rows em::before{content:"";width:7px;height:7px;border-radius:50%;background:currentColor}
.auth-rows .ok{color:var(--accent-ink);background:var(--accent-soft)}
.auth-rows .ask{color:var(--warn);background:var(--warn-soft)}
.auth-rows .no{color:var(--danger);background:var(--danger-soft,color-mix(in srgb,var(--danger) 12%,transparent))}
.auth-rows .mask{color:var(--ink-2);background:var(--sunken)}
.scope-fig .auth-rows li{opacity:.4}
[data-k="tenant"] .auth-rows li[data-r="tenant"],[data-k="human"] .auth-rows li[data-r="human"],[data-k="secret"] .auth-rows li[data-r="secret"]{opacity:1;background:color-mix(in srgb,var(--accent-soft) 55%,transparent)}
[data-k="audit"] .auth-rows li,[data-k="revoke"] .auth-rows li{opacity:.7}
.auth-foot{position:relative;min-height:150px;background:var(--sunken)}
.af{position:absolute;inset:0;padding:16px 20px;opacity:0;transform:translateY(8px);transition:opacity .45s var(--ease),transform .5s var(--ease)}
.af b{display:block;font:600 13px/1 var(--sans);color:var(--ink-3);margin-bottom:12px}
.af p{font-size:15px;color:var(--ink-2);max-width:44ch}
[data-k="tenant"] .af-tenant,[data-k="human"] .af-human,[data-k="secret"] .af-secret,[data-k="audit"] .af-audit,[data-k="revoke"] .af-revoke{opacity:1;transform:none}
.af-audit ol{list-style:none;margin:0;padding:0;display:grid;gap:8px;font-size:14px}
.af-audit li{display:flex;gap:12px}
.af-audit time{font:500 12.5px/1.5 var(--mono);color:var(--accent-ink)}
.af-audit li{opacity:0;transform:translateX(-6px);transition:opacity .4s,transform .4s var(--ease)}
[data-k="audit"] .af-audit li{opacity:1;transform:none}
[data-k="audit"] .af-audit li:nth-child(2){transition-delay:.2s}[data-k="audit"] .af-audit li:nth-child(3){transition-delay:.4s}
.cred{display:flex;align-items:center;gap:10px}
.cred code{font:500 14px/1 var(--mono);padding:8px 10px;border-radius:8px;background:var(--surface);border:1px solid var(--line);transition:text-decoration-color .4s}
.cred .st{font:600 12.5px/1 var(--sans);padding:6px 9px;border-radius:999px;color:var(--accent-ink);background:var(--accent-soft)}
.cred .st.off{display:none;color:var(--danger);background:color-mix(in srgb,var(--danger) 12%,transparent)}
.cred-acts{margin-top:12px;display:flex;gap:8px}
.cred-acts span{font:600 13px/1 var(--sans);padding:8px 12px;border-radius:999px;border:1px solid var(--line-strong);color:var(--ink-2)}
.cred-acts .rv{border-color:var(--danger);color:var(--danger)}
[data-k="revoke"] .cred code{text-decoration:line-through;text-decoration-color:var(--danger);color:var(--ink-3)}
[data-k="revoke"] .cred .st{display:none}[data-k="revoke"] .cred .st.off{display:inline-block}
[data-k="revoke"] .cred-acts .rv{background:var(--danger);color:#fff}
.nv{display:flex;flex-wrap:wrap;gap:8px}
.nv span{font:600 13px/1 var(--sans);padding:8px 12px;border-radius:999px;background:var(--surface);border:1px solid var(--line);color:var(--ink-2);text-decoration:line-through;text-decoration-color:var(--danger)}
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
@media (max-width:900px){.sx-g,.disc-g{grid-template-columns:1fr}.sx-l{position:static}.scope-fig .auth-rows li{opacity:1}.auth-foot{display:none}.auth-who,.auth-rows li{grid-template-columns:minmax(0,1.2fr) auto auto;padding:0 14px}.auth-rows li{padding-top:11px;padding-bottom:11px;font-size:13px}.auth-rows em{font-size:11.5px;padding:5px 7px}.ctrl{padding:24px 0 30vh;gap:56px}.ctrl li{grid-template-columns:44px minmax(0,1fr);gap:14px}.pi{width:44px;height:44px;border-radius:12px}}
'''

if __name__ == "__main__":
    open(os.path.join(SITE, "pricing.html"), "w").write(pricing())
    open(os.path.join(SITE, "security.html"), "w").write(security())
    print("pricing + security built")
