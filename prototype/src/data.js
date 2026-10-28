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
/* Agent marks. A vendor without a mark in HARNESS_SVG gets a neutral two-letter mark. The name and status always stay in the
   accessible name and the tooltip, and the selected agent is named in text under the row (UX-038). */
/* Official marks supplied by the team (white SVGs, 128×128), drawn in currentColor so they follow light and dark. OpenCode has none yet. */
const HARNESS_SVG = {"Claude Code": "<path d=\"M32.4286 81.1404L52.8708 69.6696L53.2129 68.6699L52.8708 68.1174H51.8711L48.4509 67.9069L36.7696 67.5912L26.6406 67.1702L16.8273 66.6441L14.3543 66.1179L12.0391 63.066L12.2758 61.5401L14.3543 60.1457L17.3272 60.4088L23.9045 60.8561L33.7704 61.5401L40.9265 61.961L51.5291 63.066H53.2129L53.4496 62.382L52.8708 61.961L52.4236 61.5401L42.2156 54.6208L31.1658 47.3069L25.3778 43.0974L22.247 40.9664L20.6685 38.9669L19.9844 34.5995L22.8258 31.4688L26.6406 31.7318L27.6141 31.9949L31.4815 34.9679L39.7426 41.361L50.5293 49.3064L52.1079 50.6218L52.7393 50.1746L52.8182 49.8588L52.1079 48.6749L46.2409 38.0723L39.9794 27.2856L37.1906 22.8131L36.4539 20.1295C36.1908 19.0245 36.0067 18.1037 36.0067 16.9724L39.2427 12.5788L41.0317 12L45.3464 12.5788L47.1618 14.1573L49.8453 20.2874L54.1863 29.9428L60.9214 43.0711L62.8946 46.9648L63.947 50.5692L64.3416 51.6742H65.0257V51.0428L65.5781 43.6499L66.6042 34.5732L67.604 22.892L67.946 19.6033L69.5771 15.657L72.8132 13.5259L75.3388 14.7361L77.4173 17.7091L77.1279 19.6296L75.8913 27.6539L73.4709 40.2297L71.8923 48.6486H72.8132L73.8655 47.5963L78.1276 41.9398L85.2837 32.9947L88.4408 29.443L92.1241 25.5229L94.4919 23.6549H98.9644L102.253 28.5484L100.78 33.5998L96.1757 39.4404L92.3608 44.3865L86.8885 51.7531L83.4684 57.6463L83.7841 58.1199L84.5996 58.041L96.9649 55.4101L103.647 54.1999L111.619 52.8318L115.223 54.5156L115.618 56.2257L114.197 59.7248L105.673 61.8295L95.6758 63.829L80.7848 67.3544L80.6007 67.486L80.8111 67.7491L87.52 68.3805L90.3877 68.5383H97.4122L110.488 69.5118L113.908 71.7743L115.96 74.5368L115.618 76.6415L110.356 79.3251L103.253 77.6413L86.6781 73.6949L80.9953 72.2742H80.206V72.7478L84.9417 77.3782L93.6237 85.2183L104.489 95.321L105.042 97.8204L103.647 99.7936L102.174 99.5831L92.6239 92.4007L88.9407 89.1647L80.6007 82.1401H80.0482V82.8768L81.9687 85.6919L92.1241 100.951L92.6502 105.634L91.9136 107.16L89.2827 108.081L86.3887 107.555L80.4428 99.2148L74.3128 89.8224L69.3667 81.4035L68.7616 81.7455L65.8412 113.185L64.4732 114.79L61.3161 116L58.6852 114L57.2908 110.764L58.6852 104.371L60.3689 96.0314L61.737 89.4015L62.9735 81.1667L63.7102 78.4306L63.6576 78.2464L63.0525 78.3253L56.8435 86.8495L47.3985 99.6094L39.9267 107.607L38.1377 108.318L35.0332 106.713L35.3226 103.845L37.059 101.293L47.3985 88.1386L53.6338 79.9828L57.6591 75.2735L57.6328 74.5894H57.396L29.9293 92.427L25.0358 93.0584L22.931 91.0853L23.1941 87.8492L24.1939 86.7969L32.455 81.1141L32.4286 81.1404Z\" fill=\"currentColor\"/>", "Codex": "<path d=\"M107.601 64.0001C107.601 39.9203 88.08 20.3996 64.0001 20.3995C39.9202 20.3995 20.3995 39.9202 20.3995 64.0001C20.3996 88.08 39.9203 107.601 64.0001 107.601C88.0799 107.601 107.601 88.0799 107.601 64.0001ZM42.4093 46.3976C44.5434 45.1243 47.3057 45.8222 48.5792 47.9562L56.7775 61.6945C57.6247 63.1147 57.6248 64.8856 56.7775 66.3058L48.5792 80.0441C47.3056 82.1779 44.5433 82.8751 42.4093 81.6017C40.2752 80.3282 39.5772 77.5659 40.8507 75.4318L47.672 64.0001L40.8507 52.5685C39.5772 50.4343 40.2751 47.6711 42.4093 46.3976ZM85.8361 73.2374C88.3212 73.2375 90.3359 75.2523 90.3361 77.7374C90.3361 80.2226 88.3212 82.2373 85.8361 82.2374H69.8009C67.3156 82.2374 65.3009 80.2227 65.3009 77.7374C65.301 75.2523 67.3157 73.2374 69.8009 73.2374H85.8361ZM116.601 64.0001C116.601 93.0505 93.0505 116.601 64.0001 116.601C34.9497 116.601 11.3996 93.0505 11.3995 64.0001C11.3995 34.9497 34.9497 11.3995 64.0001 11.3995C93.0505 11.3996 116.601 34.9497 116.601 64.0001Z\" fill=\"currentColor\"/>", "DeepSeek Harness": "<path d=\"M123.756 27.1541C122.505 26.5294 121.967 27.7199 121.236 28.3243C120.986 28.5193 120.774 28.7726 120.563 29.0064C118.734 30.9963 116.598 32.3035 113.808 32.1473C109.729 31.9135 106.246 33.2204 103.167 36.3999C102.513 32.479 100.339 30.1371 97.0293 28.6359C95.2974 27.8557 93.5465 27.0748 92.334 25.3777C91.4874 24.1687 91.2564 22.8223 90.8332 21.4957C90.564 20.6964 90.2939 19.8767 89.3896 19.7397C88.4083 19.5836 88.0229 20.4221 87.6387 21.1252C86.0991 23.9931 85.5027 27.1532 85.5608 30.3521C85.6959 37.5512 88.6781 43.2858 94.605 47.3637C95.2784 47.832 95.4512 48.3 95.2402 48.9828C94.836 50.3877 94.3549 51.7529 93.9317 53.1578C93.6622 54.0553 93.2574 54.2503 92.3149 53.8603C89.0632 52.4757 86.2532 50.4266 83.7708 47.9496C79.5566 43.7939 75.747 39.2095 70.9938 35.6196C69.8939 34.7906 68.7642 34.0032 67.6071 33.2592C62.758 28.4603 68.2423 24.5191 69.5121 24.0514C70.8397 23.5633 69.9741 21.886 65.6824 21.9054C61.3913 21.9249 57.4657 23.3878 52.4631 25.3388C51.7316 25.6319 50.9623 25.8463 50.173 26.0212C45.6318 25.1432 40.9174 24.9482 35.9911 25.5137C26.7159 26.5667 19.3082 31.0345 13.8626 38.6624C7.32048 47.833 5.7806 58.2498 7.66653 69.1162C9.64843 80.5671 15.3825 90.0486 24.1957 97.4621C33.3359 105.147 43.8618 108.913 55.8686 108.191C63.1613 107.762 71.2821 106.768 80.4413 98.8661C82.7505 100.036 85.1747 100.505 89.1967 100.856C92.2949 101.149 95.2774 100.7 97.5866 100.213C101.204 99.4326 100.954 96.0183 99.6454 95.3945C89.0435 90.3618 91.3708 92.41 89.2545 90.7517C93.943 85.0987 100.701 79.2535 104.469 63.4192C105.372 59.6224 105.938 55.3802 105.938 51.4034C105.938 50.6068 106.111 50.2138 107.073 50.116C109.728 49.8034 112.307 49.063 114.674 47.7358C121.543 43.9121 124.314 37.6305 124.969 30.1004C125.065 28.9497 124.95 27.7585 123.756 27.1541ZM63.8934 94.9249C53.6175 86.6932 48.634 83.9808 46.5752 84.098C44.6511 84.2153 44.9972 86.4588 45.4205 87.9217C45.8628 89.3656 46.4408 90.3602 47.2486 91.6282C47.8066 92.4673 48.1917 93.7152 46.6909 94.6525C43.3814 96.7392 37.6276 93.95 37.3578 93.813C30.6616 89.7944 25.0619 84.4883 21.1169 77.2315C17.3072 70.2468 15.094 62.7565 14.7288 54.7578C14.6326 52.8268 15.1909 52.1431 17.0762 51.7927C19.5582 51.324 22.1175 51.2262 24.5999 51.5968C35.0868 53.1578 44.015 57.9373 51.5006 65.5063C55.7726 69.8171 59.0052 74.968 62.3348 80.0007C65.8753 85.3459 69.6853 90.4379 74.5344 94.6127C76.2471 96.0756 77.6129 97.1878 78.9218 98.0075C74.9767 98.4558 68.3955 98.5536 63.8934 94.9249ZM68.8635 62.2637C69.0263 61.5911 69.6203 61.0983 70.3396 61.0983C70.517 61.0987 70.6928 61.1317 70.8588 61.1955C71.0707 61.2738 71.263 61.3911 71.4171 61.566C71.6862 61.8396 71.8404 62.2296 71.8404 62.639C71.8404 63.4976 71.167 64.18 70.3205 64.18C69.9632 64.1834 69.6166 64.0552 69.3446 63.8191C69.0725 63.5831 68.8931 63.2549 68.8394 62.8948C68.8061 62.6849 68.8143 62.4703 68.8635 62.2637ZM83.6208 70.8385C82.8061 71.1558 81.9953 71.4049 81.2116 71.4374C79.7489 71.5151 78.1521 70.9105 77.2865 70.1691C75.9398 69.0184 74.9776 68.3751 74.5735 66.3649C74.4003 65.5063 74.4962 64.18 74.6504 63.4192C74.9967 61.7804 74.6116 60.7268 73.4768 59.7711C72.5534 58.9908 71.379 58.7764 70.0901 58.7764C69.609 58.7764 69.1667 58.562 68.8394 58.3865C68.3005 58.1138 67.8581 57.4307 68.2814 56.5916C68.4164 56.3189 69.0707 55.6552 69.2248 55.5386C70.9754 54.5239 72.9964 54.8556 74.8623 55.6164C76.5941 56.3383 77.903 57.6646 79.7886 59.5372C81.7127 61.7998 82.059 62.4246 83.1563 64.1217C84.0225 65.448 84.8112 66.8141 85.3501 68.3742C85.6243 69.1901 85.3723 69.8843 84.6183 70.374C84.3116 70.5731 83.959 70.7066 83.6208 70.8385Z\" fill=\"currentColor\"/>", "Google Antigravity": "<path d=\"M109.746 111.633C115.86 116.219 125.031 113.162 116.624 104.756C91.4053 80.301 96.7547 13.051 65.4224 13.051C34.09 13.051 39.4394 80.301 14.2206 104.756C5.05015 113.926 14.9848 116.219 21.0984 111.633C44.7889 95.5852 43.2604 67.3096 65.4224 67.3096C87.5843 67.3096 86.056 95.5852 109.746 111.633Z\" fill=\"currentColor\"/>"};
const HARNESS_MONO = { "Claude Code": "CC", Codex: "CX", "DeepSeek Harness": "DS", OpenCode: "OC", "Google Antigravity": "AG" };
const HARNESS_BADGE = { ready: "check", signin: "key-round", failed: "x", na: "minus" };
const harnMark = n => HARNESS_SVG[n] ? `<svg class="hm-svg" viewBox="0 0 128 128" fill="none" aria-hidden="true" focusable="false">${HARNESS_SVG[n]}</svg>` : `<span class="hm-mono" aria-hidden="true">${HARNESS_MONO[n] || esc(n.slice(0, 2).toUpperCase())}</span>`;
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
