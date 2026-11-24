"""Docs, About, Contact, Privacy and Terms, rebuilt in the landing page's world. Copy from konteks.io."""
import os, re, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import journal_build as jb
from pages_build import SHARED_CSS

esc = jb.esc
def sid(t): return re.sub(r"[^a-z0-9]+", "-", t.lower()).strip("-")

READ_JS = jb.COMMON_JS + r'''
const links = $$(".toc a"), heads = links.map(a => document.getElementById(a.getAttribute("href").slice(1))).filter(Boolean);
const onS = () => { let cur = 0; heads.forEach((h, i) => { if (h.getBoundingClientRect().top < innerHeight * .3) cur = i; }); links.forEach((a, i) => a.classList.toggle("on", i === cur)); };
addEventListener("scroll", onS, { passive: true }); onS();
$$("[data-copy]").forEach(b => b.addEventListener("click", async () => { const t = document.getElementById(b.dataset.copy).innerText; let ok = false; try { await navigator.clipboard.writeText(t); ok = true; } catch (e) {} const s = b.querySelector("span"); s.textContent = ok ? "Copied" : "Select and copy"; setTimeout(() => s.textContent = "Copy", 2000); }));
'''

READ_CSS = r'''
.rd-hero{padding:clamp(56px,8vw,120px) 0 clamp(40px,5vw,64px)}
.rd-hero h1{max-width:18ch}
.eff{margin-top:20px;display:inline-flex;font-size:13.5px;color:var(--ink-2);padding:6px 12px;border-radius:999px;border:1px solid var(--line-strong)}
.rd{display:grid;grid-template-columns:230px minmax(0,1fr);gap:clamp(32px,6vw,96px);padding:clamp(24px,3vw,40px) 0 clamp(96px,12vw,176px);border-top:1px solid var(--line-strong)}
.toc{position:sticky;top:100px;align-self:start;font-size:14px}
.toc b{display:block;font:600 13px/1 var(--sans);color:var(--ink-3);margin-bottom:12px}
.toc ol{list-style:none;margin:0;padding:0;border-left:1px solid var(--line-strong)}
.toc a{display:block;padding:7px 0 7px 14px;margin-left:-1px;border-left:2px solid transparent;color:var(--ink-3);text-decoration:none;line-height:1.35;transition:color .2s,border-color .2s}
.toc a:hover{color:var(--ink)}
.toc a.on{color:var(--ink);border-left-color:var(--accent-strong);font-weight:600}
.legal{max-width:70ch;counter-reset:s}
.legal section{padding:28px 0;border-bottom:1px solid var(--line)}
.legal h2{font:620 clamp(21px,1rem + .7vw,27px)/1.2 var(--display);letter-spacing:-.02em;scroll-margin-top:96px;display:flex;gap:14px;align-items:baseline}
.legal h2 span{font:600 14px/1 var(--sans);color:var(--accent-ink);background:var(--accent-soft);border-radius:8px;padding:6px 8px;flex:none}
.legal p{margin-top:12px;font-size:17px;line-height:1.7;color:color-mix(in srgb,var(--ink) 88%,var(--paper))}
.legal .ask{margin-top:40px;padding:24px;border-radius:20px;background:var(--moss);color:var(--on-moss);display:flex;flex-wrap:wrap;gap:14px 24px;align-items:center;justify-content:space-between}
.legal .ask p{margin:0;color:var(--on-moss-2);font-size:16px}
.legal .ask .btn-go{background:var(--live);color:#1F2B20}
@media (max-width:900px){.rd{grid-template-columns:1fr}.toc{display:none}}
/* docs */
.smap{margin-top:clamp(40px,5vw,64px);display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px}
.surf{display:grid;grid-template-rows:auto auto 1fr auto;gap:8px;padding:24px;border-radius:20px;background:var(--surface);border:1px solid var(--line-strong);text-decoration:none;transition:transform .3s var(--ease),box-shadow .3s var(--ease),border-color .3s}
.surf:hover{transform:translateY(-3px);box-shadow:var(--shadow-2);border-color:var(--accent-strong)}
.surf:focus-visible{outline:2px solid var(--accent);outline-offset:3px}
.surf .who{font-size:13px;color:var(--ink-3)}
.surf b{font:620 26px/1.1 var(--display);letter-spacing:-.02em}
.surf .what{font-size:15px;color:var(--ink-2);line-height:1.5}
.surf .go{margin-top:12px;display:inline-flex;align-items:center;gap:6px;font:600 14px/1 var(--sans);color:var(--accent-ink)}
.dsec{padding:clamp(40px,5vw,64px) 0;border-bottom:1px solid var(--line)}
.dsec > h2{font-size:clamp(1.75rem,1.1rem + 1.6vw,2.625rem);scroll-margin-top:96px}
.dsec > p{margin-top:14px;font-size:18px;color:var(--ink-2);max-width:62ch}
.dsec .btn{margin-top:22px}
.dgrid{margin-top:32px;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:0 32px;border-top:1px solid var(--line-strong)}
.dgrid div{padding:20px 0;border-bottom:1px solid var(--line)}
.dgrid h3{font:620 18px/1.25 var(--display);letter-spacing:-.015em}
.dgrid p{margin-top:6px;font-size:15.5px;color:var(--ink-2);line-height:1.55}
.code{margin-top:28px;border-radius:18px;background:var(--moss);color:var(--on-moss);overflow:hidden}
.code-h{display:flex;justify-content:space-between;align-items:center;padding:10px 12px 10px 18px;border-bottom:1px solid var(--moss-line);font-size:13px;color:var(--on-moss-2)}
.code-h button{all:unset;cursor:pointer;display:inline-flex;gap:6px;align-items:center;font:600 13px/1 var(--sans);color:var(--on-moss);padding:8px 10px;border-radius:8px}
.code-h button:hover{background:rgba(238,241,232,.08)}
.code-h button:focus-visible{outline:2px solid var(--live);outline-offset:2px}
.code pre{margin:0;padding:18px 20px;font:500 14px/1.75 var(--mono);overflow-x:auto}
.note{margin-top:22px;padding:14px 18px;border-radius:14px;background:var(--warn-soft);border:1px solid var(--edge-warn);color:var(--ink);font-size:15px}
@media (max-width:860px){.smap{grid-template-columns:1fr;gap:12px}}@media (max-width:760px){.dgrid{grid-template-columns:1fr}}
/* about */
.about-p{max-width:68ch}
.about-p p{font-size:19px;line-height:1.7;color:color-mix(in srgb,var(--ink) 88%,var(--paper))}
.about-p p + p{margin-top:1.1em}
.about-p p:first-child{font:540 clamp(22px,1rem + .8vw,28px)/1.4 var(--display);letter-spacing:-.015em;color:var(--ink)}
.beliefs{margin-top:clamp(56px,7vw,96px);display:grid;grid-template-columns:repeat(2,minmax(0,1fr));border-top:1px solid var(--line-strong)}
.beliefs div{padding:28px 28px 28px 0;border-bottom:1px solid var(--line)}
.beliefs div:nth-child(even){padding-left:28px;border-left:1px solid var(--line)}
.beliefs h2{font:620 clamp(22px,1rem + 1vw,30px)/1.15 var(--display);letter-spacing:-.02em}
.beliefs p{margin-top:10px;font-size:16.5px;color:var(--ink-2)}
@media (max-width:760px){.beliefs{grid-template-columns:1fr}.beliefs div:nth-child(even){padding-left:0;border-left:0}}
/* contact */
.mailcard{margin-top:clamp(40px,5vw,64px);display:grid;grid-template-columns:minmax(0,1fr) auto;gap:24px 40px;align-items:center;padding:clamp(28px,4vw,48px);border-radius:28px;background:var(--moss);color:var(--on-moss);border-top:1px solid var(--live)}
.mailcard p{color:var(--on-moss-2);font-size:17px;max-width:46ch}
.mailcard a.addr{display:block;margin-bottom:10px;font:640 clamp(26px,1.1rem + 1.6vw,40px)/1 var(--display);letter-spacing:-.03em;color:var(--live);text-decoration:none}
.mailcard a.addr:hover{text-decoration:underline;text-decoration-thickness:2px;text-underline-offset:.15em}
.mailcard .btn-go{background:var(--live);color:#1F2B20}
.explore{margin-top:clamp(56px,7vw,96px);padding-bottom:clamp(96px,12vw,176px)}
.explore h2{font-size:clamp(1.6rem,1rem + 1.2vw,2.25rem)}
.explore p{margin-top:8px;color:var(--ink-2);font-size:17px}
.exl{list-style:none;margin:24px 0 0;padding:0;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}
.exl a{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:22px 24px;border-radius:18px;border:1px solid var(--line-strong);text-decoration:none;font:620 19px/1.2 var(--display);letter-spacing:-.015em;transition:background .3s,transform .3s var(--ease)}
.exl a:hover{background:var(--hover);transform:translateY(-2px)}
.exl svg{color:var(--accent);flex:none}
@media (max-width:760px){.mailcard{grid-template-columns:1fr}.exl{grid-template-columns:1fr}}
'''

def legal(slug, title, h1, lede, eff, sections, desc):
    toc = "".join(f'<li><a href="#{sid(t)}">{i}. {esc(t)}</a></li>' for i, (t, _) in enumerate(sections, 1))
    secs = "".join(f'<section><h2 id="{sid(t)}"><span>{i}</span>{esc(t)}</h2><p>{p}</p></section>' for i, (t, p) in enumerate(sections, 1))
    body = f'''<div class="wrap">
  <header class="rd-hero"><h1>{esc(h1)}</h1><p class="lede">{esc(lede)}</p><span class="eff">{eff}</span></header>
  <div class="rd"><nav class="toc" aria-label="On this page"><b>On this page</b><ol>{toc}</ol></nav>
    <div class="legal">{secs}<div class="ask"><p>Questions about this page? Write to hello@konteks.io.</p><a class="btn btn-go" href="mailto:hello@konteks.io">Email us <svg class="ico"><use href="#i-arrow"/></svg></a></div></div>
  </div>
</div>'''
    return jb.page(f"{title} | Konteks", desc, body, SHARED_CSS + READ_CSS, READ_JS, active=slug)

PRIVACY = [
 ("Scope", "This Privacy Notice explains how Konteks handles information when you visit konteks.io, use Konteks, connect through Core MCP, or use related Konteks APIs and services. Customer agreements and data-processing addenda may provide additional terms."),
 ("Information we process", "We process account and workspace identity, contact details, authentication records, organization membership, billing and transaction records, support communications, service configuration, audit events, and technical telemetry. When you connect repositories, catalogs, VCS providers, MCP servers, or model providers, Konteks processes the content and metadata needed to provide the requested capability."),
 ("Software and agent data", "Depending on your configuration, Konteks may process repository URLs and content, branches, commits, pull requests, catalog entities, Software Systems, Components, session messages, prompts, tool calls, plans, validation evidence, logs, model telemetry, and usage records. Customer code and private organizational context remain customer data."),
 ("Model providers and BYOA", "Every published Konteks plan is bring-your-own-agent: the coding agent works under your own provider subscription or key. When you select an external model provider, relevant prompts and context are sent to that provider under your provider account and its terms. Konteks does not treat model-provider charges as Konteks Story Points. You are responsible for choosing providers and configuring their retention or privacy controls."),
 ("How we use information", "We use information to authenticate users, enforce tenant isolation and permissions, preserve System and Component context, orchestrate and validate agent work, operate billing and approvals, provide evidence and support, protect the service, prevent abuse, improve reliability, and comply with law. We do not train general-purpose models on private customer code or commercial history without explicit agreement."),
 ("Service providers and transfers", "Konteks may rely on hosting, storage, observability, authentication, payment, email, version-control, and model-provider services. Data may be processed in countries where those providers operate. We limit access by purpose and use contractual, technical, and organizational safeguards appropriate to the service."),
 ("Security", "We use tenant-scoped authorization, encryption in transit, protected secret storage, audit logging, credential rotation and revocation, and scoped execution environments. No service can guarantee absolute security. Please report suspected vulnerabilities to hello@konteks.io."),
 ("Retention and deletion", "We retain information for as long as needed to provide the service, maintain security and audit integrity, settle billing, satisfy legal obligations, and resolve disputes. Workspace deletion and cleanup are designed to remove tenant-owned sessions, plans, runs, catalog state, credentials, and related resources while preserving records we must legally or contractually retain."),
 ("Your choices and rights", "Subject to applicable law and your organization’s administration, you may request access, correction, export, restriction, or deletion of personal information. Workspace owners control most product data and connected systems. Contact hello@konteks.io for privacy requests."),
 ("Updates", "We may update this notice as Konteks reaches general availability, adds providers, or changes legal requirements. Material changes will be posted on konteks.io with an updated effective date."),
]
TERMS = [
 ("Agreement", "These Terms govern access to Konteks websites, Konteks, Core MCP, APIs, agent orchestration, billing, and related services. By using Konteks, you confirm that you can bind yourself or the organization you represent. Enterprise agreements control where they conflict with these public Terms."),
 ("Service availability", "Konteks is currently in beta. Features, limits, interfaces, and availability may change as the service matures toward general availability. Commitments in a paid agreement apply only when they are expressly included in that agreement."),
 ("Accounts and workspaces", "You must provide accurate information, protect credentials, and use the correct workspace. Workspace owners administer membership, connected repositories, Systems, Components, provider keys, budgets, and permissions. One user may belong to multiple workspaces, but data and billing remain tenant-scoped."),
 ("Connected services and BYOA", "You authorize Konteks to access connected repositories, catalogs, VCS providers, MCP servers, and model providers only as configured by you. Every published plan is bring-your-own-agent and requires your own model-provider subscription, account, or key. Provider usage, availability, retention, and charges are governed by the provider’s terms."),
 ("Agent work and human approval", "AI and agent output may be incomplete, incorrect, or unsafe. You are responsible for reviewing proposals, code, migrations, commands, pull requests, and other outputs before production use. Where Konteks presents a human approval boundary, neither an autonomous model nor a replayed or stale approval substitutes for authorized human consent."),
 ("Story Points, plans, and payment", "Subscription prices, included Story Points, limits, and minimum seats are described on the <a href=\"/pricing\">Pricing page</a> or in your order. Story Points meter Konteks platform work and do not include external model-provider charges. Quotes are estimates; approved maximums and actual settlement follow the applicable product workflow. Taxes, top-ups, overages, support, infrastructure, and provider costs may be separate."),
 ("Customer data and intellectual property", "You retain rights in your code, content, catalog, prompts, and other customer data. You grant Konteks the limited rights needed to host, process, transform, and transmit that data to provide and secure the service. Konteks retains rights in the platform, documentation, design, software, and aggregated or de-identified operational information that does not identify a customer or disclose customer code."),
 ("Acceptable use", "Do not use Konteks to violate law, infringe rights, introduce malware, bypass security, access another tenant, abuse provider services, conceal unauthorized automation, or operate destructive workflows without appropriate review and safeguards. Do not probe production systems except through an authorized security program."),
 ("Suspension and termination", "We may limit or suspend access to protect customers, the service, connected providers, or third parties; address non-payment; respond to legal obligations; or investigate material violations. You may stop using Konteks and request workspace closure subject to billing, retention, and contractual obligations."),
 ("Warranties and liability", "To the maximum extent allowed by law, preview and free services are provided as available without implied warranties. Paid-service commitments are limited to the applicable order or enterprise agreement. Konteks is not responsible for external provider failures, customer configuration, unreviewed agent output, or indirect and consequential losses except where liability cannot legally be excluded."),
 ("Changes and contact", "We may update these Terms as the product and law evolve. Material changes will be posted on konteks.io. Questions about these Terms may be sent to hello@konteks.io."),
]

APP = [("Start with a Software System", "Every durable session belongs to one explicit Backstage/C4 System boundary and binds one ready Execution Profile revision."),
 ("Choose known Components", "Reuse catalogued repositories naturally, or bootstrap new Components from repository information."),
 ("Review before execution", "Inspect proposal scope, upfront estimate, affected repositories, and the human approval boundary."),
 ("Follow and reconcile", "Track runs, tasks, validation, pull requests, usage, and Value Receipt evidence from the same session."),
 ("Plan in Project Management mode", "Draft a PRD, break it into milestones, sprints, and tickets, and open one Engineering session per ticket. Estimates flow back to the tickets, and a live delivery Report consolidates Value Receipts."),
 ("Verify in QA mode", "Verify a delivered change against a Preview Environment through browser journeys, per-criterion assertions, and a Verification Report that declares its own coverage. Anything a run did not exercise reads as unverified, never as passed.")]
MCP = [("Discover", "Find Systems, sessions, catalog context, billing state, and federated tools without hard-coded IDs."),
 ("Act safely", "Tool metadata, permissions, tenant scope, budgets, and human approval control what may run."),
 ("Keep parity", "Konteks and MCP share the same product context, policies, and outcome model.")]
API = [("Identity & workspace", "Authentication, active workspace, membership, invitations, and tenant-scoped account context."),
 ("Software Systems & sessions", "Create and select Systems; create sessions; send messages; attach files; inspect and cancel runs."),
 ("Catalog learning", "Review known Components, provisional repository-derived facts, and evidence-backed catalog changes."),
 ("VCS connectors", "Connect, validate, inspect, revoke, restore, and browse repositories from supported providers."),
 ("Plans & execution", "Inspect proposals and plans, follow events and tasks, confirm or revise approved work, and read outcomes."),
 ("Billing", "Read plans, entitlements, balance, budgets, quotes, reservations, usage analytics, exports, and transactions."),
 ("Profiles & models", "Configure Planner, Executor, Assistant, and Search roles through unified Agent Setup, manage named immutable-revision Execution Profiles, and validate supported models while keeping credentials protected."),
 ("Project management", "Draft PRDs, accept breakdowns, assign tickets, open a ticket’s Engineering session, and read the live delivery Report that consolidates ticket estimates and Value Receipts."),
 ("Authentication", "Browser requests use the authenticated Konteks session. External agents use revocable, scoped MCP credentials. Service credentials are not public client credentials."),
 ("Errors", "Treat 401/403 as authentication or authorization boundaries, 409 as state conflict, 402 as billing recovery, and 5xx as retryable only when the operation is idempotent."),
 ("Stability", "Konteks is in beta and the public surface is being stabilized. We will publish versioned schemas and changelog details before incompatible changes.")]
MCP_CODE = "Endpoint: https://api.konteks.io/mcp\nTransport: Streamable HTTP\nAuth: Bearer <scoped credential>\n\ninitialize\n → tools/list\n → resources/list\n → resources/templates/list\n → tools/call | resources/read"

def grid(items): return '<div class="dgrid">' + "".join(f"<div><h3>{esc(t)}</h3><p>{esc(p)}</p></div>" for t, p in items) + "</div>"

def docs():
    body = f'''<div class="wrap">
  <header class="rd-hero"><h1>Three surfaces. <span>One product contract.</span></h1><p class="lede">Konteks for people. MCP for agents. Tenant-scoped APIs underneath both. Konteks is model-neutral by design, so your team can choose the model and coding agent that fit the work.</p>
    <div class="smap" aria-label="How the three surfaces fit together">
      <a class="surf" href="#app"><span class="who">People use</span><b>Konteks</b><span class="what">The workspace for Systems, sessions, approvals and evidence.</span><span class="go">Read the Konteks docs <svg class="ico"><use href="#i-down"/></svg></span></a>
      <a class="surf" href="#mcp"><span class="who">Agents use</span><b>Core MCP</b><span class="what">One tenant-scoped connection for authorized external agents.</span><span class="go">Read the MCP docs <svg class="ico"><use href="#i-down"/></svg></span></a>
      <a class="surf" href="#api-reference"><span class="who">Both run on</span><b>Tenant-scoped APIs</b><span class="what">Usually reached through Konteks or MCP. Direct integrations use the documented endpoints.</span><span class="go">Read the API reference <svg class="ico"><use href="#i-down"/></svg></span></a>
    </div>
  </header>
  <div class="rd"><nav class="toc" aria-label="On this page"><b>On this page</b><ol><li><a href="#app">Konteks</a></li><li><a href="#mcp">Core MCP</a></li><li><a href="#api-reference">API reference</a></li><li><a href="#contract">Need the contract clarified?</a></li></ol></nav>
  <div>
    <section class="dsec"><h2 id="app">Konteks</h2><p>The human workspace for creating Systems, opening sessions in Engineering, Project Management, or QA mode, selecting Components and repositories, configuring agents through unified Agent Setup, reviewing estimates, approving work, and reading evidence.</p><p>Konteks is available on the web, on desktop and mobile browsers.</p><a class="btn btn-go" href="/login">Open Konteks <svg class="ico"><use href="#i-arrow"/></svg></a>{grid(APP)}</section>
    <section class="dsec"><h2 id="mcp">Core MCP</h2><p>The public remote MCP endpoint for authorized external agents. It federates Konteks capabilities behind one tenant-scoped connection.</p><p>Use it from Claude Code, Codex, or another MCP-compatible coding agent. Konteks supplies the durable software context, policy, estimate, approval boundary, and evidence; your team chooses the model.</p>
      <div class="code"><div class="code-h"><span>Connection</span><button type="button" data-copy="mcpcode"><svg class="ico"><use href="#i-copy"/></svg><span>Copy</span></button></div><pre id="mcpcode">{esc(MCP_CODE)}</pre></div>
      {grid(MCP)}<p class="note">Create, rotate, and revoke credentials from Konteks’s Work Locally surface. Never place credentials in prompts, source control, screenshots, or shared logs.</p></section>
    <section class="dsec"><h2 id="api-reference">API reference</h2><p>Public APIs are tenant-scoped and generally consumed through Konteks or MCP. Direct integrations should use documented endpoints and published authentication methods.</p>{grid(API)}</section>
    <section class="dsec" style="border-bottom:0"><h2 id="contract">Need the public contract clarified?</h2><p>If a capability is not documented here, contact us before building against it.</p><a class="btn btn-line" href="mailto:hello@konteks.io?subject=Konteks%20public%20contract">Contact us <svg class="ico"><use href="#i-arrow"/></svg></a></section>
  </div></div>
</div>'''
    return jb.page("Docs | Konteks", "Three surfaces. One product contract. Konteks for people, MCP for agents, tenant-scoped APIs underneath both.", body, SHARED_CSS + READ_CSS, READ_JS, active="docs")

def about():
    paras = ["Konteks is built by Refactory from a stubborn observation: software work becomes expensive when every person, session, and model must rediscover the same systems from scratch.",
     "Refactory began in 2015 and learned its craft through real projects, real clients, and the kind of engineering problems that do not disappear when the demo ends. Across years of delivery, one problem kept returning: the facts that make software understandable were scattered across repositories, catalog entries, conversations, and human memory.",
     "Konteks turns those facts into a durable Software System boundary. A System contains many sessions. A session may work with one repository or many. Repositories become known Components, and the next session can refer to them naturally. Konteks gives people the visual workspace. Core MCP gives Codex, Claude, and other MCP-compatible coding agents the same governed capability. The model is your choice; the context, policy, estimate, approval, and evidence remain coherent.",
     "We also believe software alone is not transformation. Agentic workflows change how people plan, review, decide, and learn. That is why Refactory provides agentic training, guided onboarding, and adoption coaching alongside Konteks, helping the workforce grow with the capability instead of being asked to catch up after it arrives.",
     "That is the product: not an integration marketplace and not a model wrapper. It is durable software memory and delivery discipline for teams that want agents to do serious work."]
    beliefs = [("Real software, not a demo", "Konteks grew from Refactory’s years of delivering production systems, where context loss, ownership, cost, and validation have consequences."),
     ("Memory before autonomy", "A coding agent is more useful when it can discover the right System, Components, repositories, decisions, and prior outcomes without being re-taught the company."),
     ("Receipts before mythology", "Estimates, approval, execution evidence, and actual cost belong in one trace. Speed is valuable; accountable speed is a product."),
     ("People make adoption real", "Technology creates leverage only when the workforce gains the skills, judgment, and confidence to use it well.")]
    body = f'''<div class="wrap">
  <header class="rd-hero"><h1>We did not need another agent. <span>We needed the company to stop forgetting.</span></h1></header>
  <div class="about-p">{"".join(f"<p>{esc(p)}</p>" for p in paras)}</div>
  <div class="beliefs">{"".join(f"<div><h2>{esc(t)}</h2><p>{esc(p)}</p></div>" for t, p in beliefs)}</div>
  <div class="explore"><h2>Read more</h2><ul class="exl"><li><a href="/journal/the-road-to-august-17">The road to August 17 <svg class="ico"><use href="#i-arrow"/></svg></a></li><li><a href="https://refactory.id/">Refactory <svg class="ico"><use href="#i-out"/></svg></a></li><li><a href="/contact">Contact us <svg class="ico"><use href="#i-arrow"/></svg></a></li></ul></div>
</div>'''
    return jb.page("About | Konteks", "We did not need another agent. We needed the company to stop forgetting.", body, SHARED_CSS + READ_CSS, READ_JS, active="about")

def contact():
    body = f'''<div class="wrap">
  <header class="rd-hero"><h1>Bring us the software problem <span>that keeps losing its context.</span></h1><p class="lede">Launch access, agentic training, guided onboarding, enterprise deployment, security, and privacy all begin at one address.</p></header>
  <div class="mailcard"><div><a class="addr" href="mailto:hello@konteks.io?subject=Hello%20Konteks">hello@konteks.io</a><p>Tell us the System, repositories, outcome, or constraint you have in mind. A human will read it.</p></div><a class="btn btn-go" href="mailto:hello@konteks.io?subject=Hello%20Konteks">Write to us <svg class="ico"><use href="#i-arrow"/></svg></a></div>
  <div class="explore"><h2>Prefer to explore first?</h2><p>Explore the product contract or compare plans before starting a conversation.</p>
    <ul class="exl"><li><a href="/docs">Konteks, MCP &amp; API <svg class="ico"><use href="#i-arrow"/></svg></a></li><li><a href="/pricing">Pricing <svg class="ico"><use href="#i-arrow"/></svg></a></li><li><a href="mailto:hello@konteks.io?subject=Agentic%20training%20and%20onboarding">Training &amp; onboarding <svg class="ico"><use href="#i-arrow"/></svg></a></li></ul></div>
</div>'''
    return jb.page("Contact | Konteks", "Bring us the software problem that keeps losing its context.", body, SHARED_CSS + READ_CSS, READ_JS, active="contact")

if __name__ == "__main__":
    S = jb.SITE
    open(os.path.join(S, "docs.html") if not os.path.isdir(os.path.join(S, "docs")) else os.path.join(S, "docs", "index.html"), "w").write(docs())
    open(os.path.join(S, "about.html"), "w").write(about())
    open(os.path.join(S, "contact.html"), "w").write(contact())
    open(os.path.join(S, "privacy.html"), "w").write(legal("privacy", "Privacy", "Privacy should survive the demo.", "Konteks works close to source code, organizational context, agents, and billing. That proximity requires a plain account of what we process and why.", "Effective July 16, 2026", PRIVACY, "How Konteks handles information."))
    open(os.path.join(S, "terms.html"), "w").write(legal("terms", "Terms", "Powerful agents still need adult supervision.", "These terms define the commercial and operational boundary around Konteks. They do not turn generated confidence into a warranty.", "Effective July 16, 2026", TERMS, "The commercial and operational boundary around Konteks."))
    print("docs, about, contact, privacy, terms built")
