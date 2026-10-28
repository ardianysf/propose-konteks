/* Synthetic demo data. Every name, System and number is invented for the pitch, but each object has the same
   fields, states and wording as its counterpart in the live app (see parity/LIVE_PARITY.md). */
const ME = { id: "ay", name: "Ardian Yusuf", email: "ardian@refactory.id", role: "Engineering Contributor" };

const PEOPLE = {
  ay: { name: "Ardian Yusuf", ini: "AY" },
  ds: { name: "Dimas Pratama", ini: "DP" },
  sw: { name: "Sari Wulandari", ini: "SW" },
  bh: { name: "Bagus Hartono", ini: "BH" },
  np: { name: "Nadia Putri", ini: "NP" },
  ra: { name: "Rizky Aditya", ini: "RA" },
  ml: { name: "Maya Lestari", ini: "ML" },
  ys: { name: "Yoga Saputra", ini: "YS" },
};

/* Systems carry no colour: colour is reserved for state. A System is named, with a box icon. */
const SYSTEMS = [
  { id: "rentify", name: "Rentify" }, { id: "ledger", name: "Ledgerline" }, { id: "sense", name: "SensePortal" },
  { id: "hris", name: "HRIS Nusantara" }, { id: "kurir", name: "Kurir Hub" }, { id: "vendor", name: "Portal Vendor" },
  { id: "kanteen", name: "Kanteen" }, { id: "blog", name: "Personal Blog" },
];
const sysById = Object.fromEntries(SYSTEMS.map(s => [s.id, s]));

/* stage: Planning | Executing (the two stages the live list shows) · tone: who acts and how urgent
   kind decides the attention card on the detail page. Wording of `cause` and `action` follows the live cards. */
const INITIATIVES = [
  { id: "INI-139", head: "TKT-1's estimate is ready", detail: "The agent updates only README.md in rentify/support-api, runs the documented checks on rf-01 and opens one pull request. Nothing runs until it is approved.", title: "Refresh the Support API README", sys: "rentify", driver: "ay", stage: "Executing", tone: "decision", kind: "estimate",
    cause: "TKT-1's estimate is ready: up to 2.15 SP", action: "Approve", wait: "18m", fresh: 3, updates: 16, ticket: "TKT-1 · Validate and refresh the support-api README" },
  { id: "INI-142", head: "The plan is ready. Break it into tickets", detail: "Revision 2 of the plan covers validation, configuration, RBAC and state transitions for the first rental feature. Creating tickets starts the breakdown; nothing is estimated or charged yet.", title: "Rental checkout documentation", sys: "rentify", driver: "ay", stage: "Planning", tone: "decision", kind: "plan-ready",
    cause: "The plan is ready. Break it into tickets", action: "Create tickets", wait: "7h 11m", fresh: 21, updates: 21 },
  { id: "INI-131", head: "Nothing is moving: the plan could not be saved", detail: "Konteks revised the plan as often as it may this hour, then stopped: saving needs Plan Save in SensePortal, which your role does not include.", title: "Role editor for SensePortal", sys: "sense", driver: "ay", stage: "Planning", tone: "blocked", kind: "stalled",
    cause: "Plan could not be saved: you don't have Plan Save in SensePortal", action: "See what happened", wait: "4d 2h", updates: 12 },
  { id: "INI-137", head: "The breakdown is ready for review", detail: "Konteks proposed one ticket. It cannot be accepted until TKT-1 has a repository; Sari chooses it in the breakdown.", title: "HRIS frontend developer README", sys: "hris", driver: "sw", stage: "Planning", tone: "decision", kind: "breakdown",
    cause: "The breakdown is ready for review. TKT-1 still needs a repository", action: "Review", wait: "7h 31m", fresh: 12, updates: 12 },
  { id: "INI-128", head: "TKT-1 was stopped. Its work is kept", detail: "Bagus stopped TKT-1 after its third repair round. The changes so far are kept on the pull request. Continue resumes from there.", title: "SensePortal performance pass", sys: "sense", driver: "bh", stage: "Executing", tone: "blocked", kind: "stopped",
    cause: "TKT-1 was stopped. Its work is kept", action: "Continue", wait: "1d 3h", fresh: 35, updates: 35 },
  { id: "INI-120", head: "Planning ended without a plan", detail: "The planning agent ended 12 times without a plan or a question. Try again starts a new planning run from the same request and notes.", title: "Kurir Hub user manual", sys: "kurir", driver: "ra", stage: "Planning", tone: "blocked", kind: "no-plan",
    cause: "Planning ended without a plan", action: "Try again", more: "Konteks asked a question about the plan", wait: "1d 3h", updates: 39 },
  { id: "INI-125", head: "Nothing is moving on this initiative", detail: "No agent is working and nobody has added a note for a day. The last update was Konteks asking for the reproduction steps.", title: "Reproduce staging bug findings", sys: "vendor", driver: "np", stage: "Planning", tone: "waiting", kind: "stalled",
    cause: "Nothing is moving. Last update 1d 2h ago", action: "See what happened", wait: "1d 2h", updates: 4 },
  { id: "INI-144", head: "TKT-2 of 3 is being delivered", detail: "TKT-1 is merged. TKT-2 is being delivered on rf-01; TKT-3 waits for it.", title: "Invoice export for Ledgerline", sys: "ledger", driver: "ds", stage: "Executing", tone: "running", kind: "running",
    cause: "TKT-2 of 3 is being delivered on rf-01", wait: "12m", updates: 10 },
];
const iniById = Object.fromEntries(INITIATIVES.map(i => [i.id, i]));

/* The seven workloads, named as in Customize › Runtimes and Connect a runtime. */
const WORKLOADS = [
  ["Planning", "Turns a request into a plan and a PRD, and inspects repositories when a System is onboarded."],
  ["Implementation & correction", "Writes the change for a ticket and fixes what review finds."],
  ["Assistant & Search", "Answers questions about your Systems and repositories in chat."],
  ["Validation", "Reviews the change independently before anyone merges."],
  ["QA & preview", "Runs the change and tries it the way a user would."],
  ["Operations", "Looks into alerts and incidents. A person approves every change."],
  ["Catalog onboarding", "Reads repositories to map a System's components. It never delivers code."],
];
const WL_ALL = WORKLOADS.map(w => w[0]);

/* status: ready | offline | paused. reasons follow the live card ("Lease expired, Last known healthy, No live connection"). */
const RUNTIMES = [
  { id: "rf-01", name: "rf-01", desc: "Refactory Server 01", os: "Linux", owner: "Organization", status: "ready", sessions: "Open sessions 3 · Running 1", wl: WL_ALL, version: "0.19.26", seen: "Now",
    harness: [["Claude Code", "signin"], ["Codex", "ready"], ["DeepSeek Harness", "ready"], ["OpenCode", "failed"], ["Google Antigravity", "na"]], attested: true },
  { id: "maya", name: "maya-mac", desc: "", os: "macOS", owner: "Maya Lestari", status: "ready", sessions: "Idle", wl: WL_ALL, version: "0.19.26", seen: "Now", harness: [["Claude Code", "ready"], ["Codex", "ready"]] },
  { id: "dimas", name: "dimas-pc", desc: "", os: "Windows", owner: "Dimas Pratama", status: "ready", sessions: "Open sessions 1 · Running 0", wl: WL_ALL.slice(0, 5).concat("Catalog onboarding"), version: "0.19.25", update: true, seen: "Now", harness: [["Claude Code", "ready"], ["Codex", "ready"]] },
  { id: "bagus", name: "bagus-arc", desc: "", os: "Linux", owner: "Bagus Hartono", status: "ready", sessions: "Open sessions 1 · Running 0", wl: WL_ALL.filter(w => w !== "Operations"), version: "0.19.26", seen: "Now", harness: [["Claude Code", "ready"], ["Codex", "ready"], ["OpenCode", "ready"]] },
  { id: "fedora", name: "yoga-fedora", desc: "", os: "Linux", owner: "Yoga Saputra", status: "ready", sessions: "Open sessions 1 · Running 0", wl: WL_ALL.filter(w => w !== "Operations"), version: "0.19.26", seen: "Now", harness: [["Codex", "ready"]] },
  { id: "bazzite", name: "yoga-bazzite", desc: "", os: "Linux", owner: "Yoga Saputra", status: "ready", sessions: "Idle", wl: [], version: "0.19.26", seen: "Now", harness: [] },
  { id: "rizky", name: "rizky-mac", desc: "", os: "macOS", owner: "Rizky Aditya", status: "paused", reasons: "No live connection", sessions: "", wl: WL_ALL.filter(w => w !== "Operations"), version: "0.19.25", update: true, seen: "16 Oct 2026", harness: [["Codex", "ready"]] },
  { id: "mymac", name: "ardian's Mac", desc: "", os: "macOS", owner: "Ardian Yusuf", status: "offline", reasons: "Lease expired, last known healthy, no live connection", sessions: "", wl: WL_ALL.filter(w => w !== "Operations"), version: "0.19.25", update: true, seen: "24 Oct 2026", mine: true, harness: [["Codex", "ready"]] },
  { id: "rf-02", name: "rf-02", desc: "Rack 3", os: "Linux", owner: "Organization", status: "offline", reasons: "Lease expired, last known healthy, no live connection", sessions: "", wl: WL_ALL.filter(w => w !== "Operations"), version: "0.19.25", update: true, seen: "20 Oct 2026", harness: [["Codex", "ready"]] },
  { id: "sari", name: "sari-linux", desc: "", os: "Linux", owner: "Sari Wulandari", status: "offline", reasons: "Lease expired, last known healthy, no live connection", sessions: "", wl: ["Assistant & Search", "Catalog onboarding", "Planning"], version: "0.19.25", update: true, seen: "19 Oct 2026", harness: [["Codex", "ready"]] },
];
const rtById = Object.fromEntries(RUNTIMES.map(r => [r.id, r]));
const HARNESS_STATUS = { ready: ["ok", "Ready"], signin: ["warn", "Needs sign-in"], failed: ["danger", "Failed"], na: ["muted", "Not available"] };
const HARNESS_KEY = { "Claude Code": "claude-code", Codex: "codex", "DeepSeek Harness": "dsh", OpenCode: "opencode", "Google Antigravity": "antigravity" };
/* Agent marks. Put each vendor's official mark (from its brand or press kit) at assets/harness/<key>.svg and list
   the key here; until then a neutral two-letter mark stands in. The name and status always stay in the
   accessible name and the tooltip, and the selected agent is named in text under the row (UX-038). */
const HARNESS_LOGO = {};
const HARNESS_MONO = { "Claude Code": "CC", Codex: "CX", "DeepSeek Harness": "DS", OpenCode: "OC", "Google Antigravity": "AG" };
const HARNESS_BADGE = { ready: "check", signin: "key-round", failed: "x", na: "minus" };
const harnMark = n => HARNESS_LOGO[HARNESS_KEY[n]] ? `<img class="hm-img" src="assets/harness/${HARNESS_KEY[n]}.svg" alt="">` : `<span class="hm-mono" aria-hidden="true">${HARNESS_MONO[n] || esc(n.slice(0, 2).toUpperCase())}</span>`;
/* One agent as a compact tile: mark plus a status badge whose icon, not only its colour, carries the state. */
const harnTile = (n, key, [kind, label], pressed) => `<button type="button" class="htile" aria-pressed="${pressed}" aria-label="${esc(n)}: ${esc(label)}" data-tip="${esc(n)} · ${esc(label)}" data-harn="${esc(n)}">${harnMark(n)}<span class="hbadge ${kind}" aria-hidden="true">${ic(label === "Ready when online" ? "clock" : HARNESS_BADGE[key])}</span></button>`;

/* Customize › Access › Roles: the 16 built-in templates, with their live one-line descriptions and permission groups. */
const ROLES = [
  ["Auditor", "Read audited governance evidence without policy mutation.", { work: "read", delivery: "read", runtimes: "read", billing: "read", access: "read" }],
  ["Billing Administrator", "Billing and commercial administration.", { work: "", delivery: "", runtimes: "", billing: "manage", access: "" }],
  ["Contractor", "Time-bounded contributor authority in an eligible scope.", { work: "use", delivery: "", runtimes: "use", billing: "", access: "request" }],
  ["Delivery Approver", "Approve delivery without broad System administration.", { work: "", delivery: "approve", runtimes: "", billing: "", access: "" }],
  ["Engineering Contributor", "Create and operate engineering work within assigned scope.", { work: "manage", delivery: "request", runtimes: "use", billing: "read", access: "request" }, true],
  ["Engineering Viewer", "Read non-sensitive engineering metadata in assigned scope.", { work: "read", delivery: "read", runtimes: "read", billing: "", access: "" }],
  ["Executive Observer", "Read aggregate health, spend, and risk without customer content.", { work: "read", delivery: "", runtimes: "", billing: "read", access: "" }],
  ["IAM Administrator", "Role, binding, access-request, and policy administration.", { work: "", delivery: "", runtimes: "", billing: "", access: "manage" }],
  ["Project Manager", "Plan, assignment, and delivery coordination authority.", { work: "manage", delivery: "request", runtimes: "", billing: "read", access: "" }],
  ["Provider Administrator", "Provider connection and provider-policy administration.", { work: "", delivery: "", runtimes: "manage", billing: "", access: "" }],
  ["QA Operator", "Execute QA without implicit environment administration.", { work: "read", delivery: "", runtimes: "use", billing: "", access: "" }],
  ["Runtime Administrator", "Runtime and workload administration.", { work: "", delivery: "", runtimes: "manage", billing: "", access: "" }],
  ["Service Account Runner", "Execute approved workload actions as a service identity.", { work: "", delivery: "", runtimes: "use", billing: "", access: "" }],
  ["System Owner", "Full product authority within assigned Systems.", { work: "manage", delivery: "approve", runtimes: "use", billing: "read", access: "request" }],
  ["Workspace Administrator", "Workspace operations without protected owner authority.", { work: "manage", delivery: "approve", runtimes: "manage", billing: "read", access: "manage" }],
  ["Workspace Owner", "Protected owner authority for the Workspace.", { work: "manage", delivery: "approve", runtimes: "manage", billing: "manage", access: "manage" }],
];
const ROLE_PERMS = {
  "Engineering Contributor": ["Capability Content Read", "Capability Create", "Capability Credential Use", "Capability Metadata Read", "Capability Publish", "Capability Update", "Agent Profile Read", "Context Content Read", "Context Manage", "Delivery Proposal Cancel", "Delivery Proposal Execute", "Delivery Proposal Manage", "Delivery Proposal Read", "Delivery Proposal Request Quote", "File Content Read", "File Manage", "Plan Cancel", "Plan Content Read", "Plan Continue", "Plan Execute", "Plan Read", "Plan Replan", "Plan Rerun", "Plan Resume", "Run Cancel", "Run Read", "Runtime Execute", "Runtime Read", "Session Create", "Session Manage", "Session Read", "System Configure", "System Create", "System Read", "Task Cancel", "Task Execute", "Task Read", "Initiative Contribute", "Initiative Read", "Access Request Create", "Billing Read", "Effective Access Read"],
  "Delivery Approver": ["Delivery Proposal Approve"],
  "Auditor": ["Audit Read", "Billing Read", "Runtime Audit", "Runtime Read"],
  "Billing Administrator": ["Billing Adjust", "Billing Quote", "Billing Read", "Billing Reserve", "Billing Settle", "Billing Top Up", "Budget Manage", "Budget Read", "Entitlement Read", "Subscription Manage"],
  "Contractor": ["Access Request Cancel", "Access Request Create", "Access Request Read", "Effective Access Read", "Role Read", "Runtime Execute"],
};

const LEADERS = [
  ["sw", 13, 34, 2], ["ds", 10, 25, 2], ["bh", 9, 18, 2], ["ml", 10, 13, 4], ["ra", 9, 13, 0], ["np", 8, 10, 0], ["ys", 6, 10, 0], ["ay", 0, 0, 1],
].map(([p, s, c, r]) => ({ p, s, c, r, pts: s * 5 + c * 2 + r })).sort((a, b) => b.pts - a.pts);

const PAYMENTS = [
  { date: "16 Sep 2026, 11.41", id: "SUB-22b0ce56", method: "—", amount: 12640000, status: "pending" },
  { date: "11 Sep 2026, 12.11", id: "SP-ba5314c7", method: "—", amount: 64000000, status: "pending" },
  { date: "11 Sep 2026, 10.13", id: "SP-e3a54929", method: "QRIS", amount: 960000, status: "failed" },
  { date: "13 Aug 2026, 12.03", id: "SUB-5f9dda8e", method: "Virtual account", amount: 304000, status: "paid" },
  { date: "11 Aug 2026, 02.43", id: "SUB-43bbe48b", method: "Virtual account", amount: 304000, status: "paid" },
];
const PACKAGES = [["Starter", 500, 960000], ["Team", 2500, 4000000], ["Growth", 10000, 14400000], ["Scale", 50000, 64000000]];

const CREDENTIALS = [
  { id: "konteks-1790323461602-2v8dv5", key: "kxmcp_f70e…1de1", created: "25 Sep 2026, 15.04", exp: "24 Dec 2026", days: 58 },
  { id: "konteks-1788413200202-4qlo2i", key: "kxmcp_d46d…c1dd", created: "3 Sep 2026, 12.26", exp: "2 Dec 2026", days: 36 },
  { id: "konteks-1787206951837-gjy9xi", key: "kxmcp_d849…2f86", created: "20 Aug 2026, 13.22", exp: "18 Nov 2026", days: 22 },
  { id: "konteks-1787045859737-uf09g2", key: "kxmcp_62d9…d7b4", created: "18 Aug 2026, 16.37", exp: "16 Nov 2026", days: 20 },
];

const CONTEXT_FILES = [
  ["AGENT-PROFILE.yaml", "yaml", "21 Oct 2026", "name: refactory-default\nplanning:\n  model: auto\nreview:\n  model: auto\nenv:\n  GITEA_URL: https://gitea.example.id\n  GITEA_TOKEN: ••••••••  # secret, hidden"],
  ["policy-limits.json", "json", "18 Oct 2026", "{\n  \"maxRepairRounds\": 3,\n  \"maxParallelTasks\": 2\n}"],
  ["remote-settings.json", "json", "12 Oct 2026", "{\n  \"defaultRuntime\": \"automatic\"\n}"],
  [".claude.json", "json", "4 Oct 2026", "{\n  \"permissions\": { \"allow\": [\"Read\", \"Grep\"] }\n}"],
];

const SKILLS = [{ name: "skill-creator", ver: "1.0.0", builtin: true, desc: "Create and register reusable skills from a chat session.", created: "4 Sep 2026, 00.32" }];
const TOOLS = [
  { name: "archive", ver: "1.0.0", desc: "List, extract, create, and modify bounded ZIP, TAR, TAR.GZ, TAR.BZ2, and single-file GZIP archives in memory.", created: "27 Aug 2026, 14.54", versions: [["1.0.0", "27 Aug 2026"]] },
  { name: "document", ver: "3.3.0", desc: "Read, extract, create, and modify registered document formats using bounded processing (PDF/DOCX full support; XLSX/PPTX read and extract support).", created: "27 Aug 2026, 14.54", versions: [["3.3.0", "4 Sep 2026"], ["2.1.0", "28 Aug 2026"], ["2.0.0", "27 Aug 2026"]] },
];
const VCS = [
  ["Rentify org", "Gitea", "https://gitea.example.id", "29cf", "Organization", ["Rentify"]],
  ["Gitea Sari", "Gitea", "https://gitea.example.id", "36ac", "Sari Wulandari", ["HRIS Nusantara"]],
  ["Gitea Bagus", "Gitea", "https://gitea.example.id", "d941", "Bagus Hartono", ["SensePortal"]],
  ["Ledgerline GitHub", "GitHub", "https://api.github.com", "gith", "Dimas Pratama", ["Ledgerline"]],
  ["HRIS Azure", "Azure DevOps", "https://dev.azure.com/hris-nusantara", "Daer", "Sari Wulandari", ["HRIS Nusantara"]],
  ["Kurir Gitea", "Gitea", "https://git.kurirhub.id", "7887", "Rizky Aditya", ["Kurir Hub"]],
  ["Gitea Ardian", "Gitea", "https://gitea.example.id", "aedd", "Ardian Yusuf", []],
];
const MODEL_MODES = [
  ["Planning", "Understand the requirements and plan the work. Also inspects your repositories when you onboard a System.", "Auto", "Default (recommended) · $5 / $25 per 1M tokens"],
  ["Engineering", "Build or improve features according to the plan.", "Auto", "Default (recommended) · $5 / $25 per 1M tokens"],
  ["Review", "Check that the work meets requirements and quality standards.", "Auto", "Default (recommended) · $5 / $25 per 1M tokens"],
  ["Testing (QA)", "Try features from the user's perspective to check that the workflow works as expected.", "Codex", "GPT-6-Luna · $0.1 / $0.5 per 1M tokens"],
];
const MODEL_GROUPS = [
  ["Auto", [["Default (recommended)", "$5 / $25"]]],
  ["Claude Code", [["Sonnet", "$2 / $10"], ["Opus 5", "$5 / $25"], ["Haiku", "$1 / $5 · not strong enough for this mode"]]],
  ["Codex", [["GPT-5.6-Sol", "$5 / $30"], ["GPT-5.6-Terra", "$2 / $12"], ["GPT-6-Luna", "$0.1 / $0.5"], ["GPT-6-Astra", "$10 / $50"]]],
  ["OpenCode · OpenCode Zen", [["Claude Opus 5.5", "$4 / $20"], ["DeepSeek V4 Pro", "$1.32 / $3.96"], ["Gemini 3.1 Pro Preview", "$2 / $12"]]],
  ["DeepSeek Harness, not ready", [["DeepSeek V4.1 Flash", "$0.3 / $1.2"]]],
];

/* One number locale per page (UX-040): Rupiah follows the app language, like SP does. */
const rupiah = n => "Rp " + n.toLocaleString(typeof S !== "undefined" && S.lang === "id" ? "id-ID" : "en-US");

/* Notes thread for the initiative detail: a long, realistic exchange so a long conversation can be judged.
   m = minutes before the demo clock; r = a reply under the previous note; uses = skills or tools the agent used;
   steps = what it did (shown folded); atts = attachments; re = reactions. */
const THREADS = {
  "INI-139": [
    { who: "ay", m: 1720, text: "Refresh the Support API README. It is the first thing new support engineers read, and half of it describes the service as it was a year ago.\n\nChange only what the request needs; keep application behaviour, security and billing untouched. Record the exact commands and their outcomes so the next person can trust them.\n\nIf something in the README cannot be verified on rf-01, say so in the README instead of guessing.", re: [["👍", 2]] },
    { who: "kx", m: 1712, r: 1, uses: [["tool", "document"]], steps: ["Read README.md and package.json in rentify/support-api", "Listed the routes in src/routes", "Used tool · document", "Compared the README with the source"], text: "I read the repository and the current README. Three things to settle before I draft the PRD:\n\n1. The README documents `npm run seed:all`, which no longer exists. Should I document the two seed scripts that replaced it, or only the one support uses?\n2. The Troubleshooting section covers the old queue worker. Keep it, rewrite it, or drop it?\n3. Do you want the run outcomes in the README itself, or only in the pull request description?" },
    { who: "ay", m: 1650, r: 1, text: "1. Only `seed:support`; the other one is for the billing team.\n2. Keep it, ops still uses it. Rewrite it for the current worker.\n3. Outcomes in the PR description. The README should stay a guide, not a log." },
    { who: "sw", m: 1580, text: "Heads-up from the HRIS side: the readiness endpoint moved to `/health/ready` in v2.4. The old `/status` still answers but is deprecated and will go in v3.", re: [["👀", 1]] },
    { who: "kx", m: 1576, r: 1, steps: ["Searched src for /status and /health/ready", "Checked the v2.4 changelog"], text: "Thanks, Sari. Confirmed in the source: `/health/ready` is the readiness check and `/status` is marked deprecated. I'll document the new one and add a one-line deprecation note for the old." },
    { who: "ay", m: 1490, atts: [["architecture-notes.md", "8 KB"], ["support-api-flows.png", "214 KB"]], text: "Here are the architecture notes and the flow diagram from the last review. The diagram is a bit old but the request flow is still right." },
    { who: "kx", m: 1474, r: 1, uses: [["tool", "document"]], steps: ["Used tool · document", "Read architecture-notes.md", "Drafted PRD revision 1", "Proposed one ticket"], text: "PRD revision 1 is ready, with one ticket.\n\n**What changes**\n- Purpose and boundaries, from the architecture notes\n- Request flow for the three public routes, checked against `src/routes`\n- Configuration: environment variable names only, never values\n- Readiness: `/health/ready`, with `/status` marked deprecated\n- Troubleshooting, rewritten for the current worker\n\n**What does not change**\n- Application code, tests, security, IAM and billing\n\nEvery documented command will be run on rf-01, and the outcomes go into the pull request description. Have a look at the PRD and the breakdown." },
    { who: "ml", m: 420, text: "Before I approve: will the command checks run against staging or production data? The support-api seeds touch the customer tables." },
    { who: "kx", m: 416, r: 1, steps: ["Read the seed scripts", "Checked the runtime's credentials", "Checked the quote"], text: "Only on rf-01, against the seeded fixtures in `test/fixtures`. No production credentials are available to the run, so the customer tables are never touched.\n\nThe estimate assumes six documented commands: up to 2.15 SP, and $0.57–$2.02 on your model subscription." },
    { who: "ay", m: 380, text: "Good. One more thing: please keep the section about rotating the webhook secret. It looks outdated but the steps still work, I used them last month." },
    { who: "kx", m: 377, r: 1, steps: ["Re-read the Webhooks section", "Updated PRD to revision 2"], text: "Kept. Revision 2 of the PRD keeps the webhook-secret section as it is and only fixes the two command names in it. The estimate is unchanged: up to 2.15 SP." },
    { who: "ml", m: 64, text: "Thanks both. I'll approve after lunch.", re: [["👍", 1], ["✅", 1]] },
  ],
};
const threadFor = i => THREADS[i.id] || [
  { who: i.driver, m: 420, text: `${i.title}. Change only what the request needs; keep application behaviour, security and billing untouched. Record the exact commands and their outcomes.`, re: [["👍", 1]] },
  { who: "kx", m: 416, r: 1, steps: ["Read the request", "Drafted the PRD"], text: "Drafted the PRD and proposed its breakdown from this. Have a look." },
];
