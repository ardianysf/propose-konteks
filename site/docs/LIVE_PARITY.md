# Konteks live app: process parity spec (read 27 Oct 2026, 19.40–20.10 WIB, read-only)

Source: app.konteks.io as Ardian Yusuf (Engineering Contributor) + audit report v2. The redesign may change
presentation only. Every page, entry point, field, step and action below must exist in the redesign with the
same meaning; nothing may be added that needs new backend behaviour.

Tech note: the app is built on Backstage (`@backstage/core` SignInPage, provider `google-auth-provider`);
custom plugin UI uses Tailwind `app-*` token classes and a `.dark` class.

## Sign in
- Backstage sign-in page with Google (`google-auth-provider`). No email/OTP, no GitHub, no SAML observed.

## Shell (sidebar)
- Workspace switcher "R Refactory" (menu: workspaces, Create workspace, Manage workspace) + icon button "Notifications".
- Nav (in order): Activities, Work In Progress (badge "9 need your attention"), Issues, Releases, Leaders, Customize.
- RUNTIMES group: "Connect a runtime", then every runtime by name with its status (blank = Ready,
  "Not connected", "Not accepting work"). Clicking opens /runtimes/{id}. Error state: "Runtimes cannot be shown right now."
- Account button (name + email) → menu: Settings, Work Locally, EN | ID, Support, Sign Out.
- Sidebar can collapse to a rail (state remembered).
- App-wide banner when a new build is out: "A new version of Konteks is ready. Reload".

## Work In Progress (/work)
- Title "Work In Progress", subtitle "What people are driving. Agents do the rest.", button "New initiative".
- System filter row: All systems + every System, "New System"; pencil "Edit <System>" on the active chip.
- Banner "<System> was connected from <pengguna>@<perangkat> on 9/30/2026."
- Section "Needs your attention" (count). Card: title, "N new updates", System, stage ("Planning:" / "Executing:"),
  "Needs you · 1d 3h", waiting time, driver avatar, cause line + one action:
  Try again (+1 more: "Konteks asked you something about the plan"), See what happened, Continue, Create tickets,
  Review, Approve.
- New initiative (modal): "A planning session opens behind it, ready to read your notes." Fields:
  What is this initiative about? (textarea), Software System (select), Attach meeting transcript. Cancel / Start.
  NO title field.
- Create System (dialog "Create System", sub "One product your team owns. Like Checkout or Payments. It holds the product's
  parts and repositories."; "How do you want to start?"): (1) Discover what we already have — connections checklist,
  reading depth line + Change, "Your Planning model inspects the repositories" + Change; Start. (2) Start from nothing —
  no fields; Start. (3) Create an empty System — Name (e.g. My Project), Description (optional); button Save.
  Checked live 28 Oct 2026 without submitting. Edit System
  (Open System map, Delete System).

## Initiative detail (/work/init_…)
- "Back to Work In Progress"; System, stage, Needs you, waiting, avatar; title.
- Buttons PRD, Breakdown, Updates (count) → each opens a drawer.
- "Needs your attention" card: ticket "TKT-1 · …", waiting, cause, primary action (e.g. Continue / Approve / Review),
  "Details" → drawer "Session history" (Refresh, Open session, events, Previous / Next).
- Estimate variant (from audit): Approve, Change (inline form: Create revised proposal, Decline), Details,
  "Models for this delivery".
- Notes composer "Draft your thinking… notes feed the plan", Attach, Post note. Thread: notes, Konteks replies,
  React, Comment. Checked by posting, 28 Oct 2026:
  - The text typed in New initiative becomes the first note. Empty thread: "No notes yet — The first note sets the
    direction. Reactions and comments feed the plan too."
  - Comments sit one level under a note (people and Konteks, "AGENT" tag); a comment has React only, no reply.
    The note shows "<faces> N comments", which folds them; the latest Konteks comment shows with "+N more".
  - Comment box: "Add a comment… type @konteks to hand it to Konteks". Typing @konteks shows "This comment hands the
    work to Konteks. Usual usage charges apply."; posting starts the planning session ("Agent working").
  - A role without plan saving gets "You can't save this plan: your role doesn't include planning" (Request access,
    Try again) after the agent runs.
- PRD drawer: title, Ready · Revision 1 · updated…, summary, GOALS, REQUIREMENTS (R1…), risks.
- Breakdown drawer: plan title, "Approved up to 2.15 SP", "0 of 1 merged · 1 needs you", Accepted, filter
  "Needs you 1", milestone, work item group, ticket TKT-1 (Settled 0.47 SP, Stopped, Continue, More →
  View changes, Open Engineering session). Who merges (radio), Choose repository (picker + confirm).
- Updates drawer: grouped by day; "X stopped TKT-1…", "TKT-1's delivery started", "approved by", "estimate is ready",
  "breakdown was accepted", "Konteks worked on the plan"…; time; "Open session" per ticket event; "×6" folding.
- Changes drawer (from Breakdown → More → View changes): file list + diff.

## Agent session (/?conversation=…)
- "Back to <initiative>", ticket title; header: runtime chip "rf-01 Ready", VCS (gitea · connection · repo URL),
  Open System map, Session files.
- Transcript: user / agent messages, duration + tokens, ◆ events ("Analysis quote ready…", "Execution quote ready…"),
  ✓ approval, task started, run ended "Settling Story Points", result card (Not finished · PR · 0.47 SP · View changes ·
  View receipt), stop reason, decision card (Continue).
- Cycle stepper: "Cycle 2 of 2", Previous cycle / Newer cycle; steps Estimate → Quote (2.15 SP · provider $…) → Plan (0/1)
  → Delivery → Receipt. "Konteks learned". Disclaimer "Konteks can make mistakes. Verify important information."
- Composer: Attach file, Create text attachment, Record voice message, Send message.

## Activities / Issues / Releases / Leaders
- Activities: "What happened across your Systems." System filter. Feed by day; entry = "<person> started <initiative>",
  relative + absolute time, tags Initiative + stage (Planning / Executing / Closed), Comment, "N updates · time". Load more.
  Comment (checked by posting, 28 Oct 2026): box "Add a comment…"; the comment stays on the Activities entry
  ("<face> N comments", React only) and does not appear on the initiative, open or Closed. @konteks there shows no
  hand-off notice and starts nothing.
- Issues: "What is wrong, by severity." System filter. Empty: "Nothing is open — When something breaks, whether a person
  reports it or a telemetry channel sends an alert, it appears here."
- Releases: "Ready to ship first, then what shipped." System filter. Empty: "Nothing here yet — Accepted initiatives
  gather into a release candidate for their System." (Release Ship permission exists.)
- Leaders (/leaderboard): "People by involvement. Agents and models by value." PEOPLE ranked: N started · N contributions ·
  N reactions, POINTS; AGENTS AND MODELS: Codex · Not reported · 32M tokens. No period filter.

## Customize (/customize/…)
Title "Customize", subtitle "Where agents run, who may do what, and what they work with."
Subnav (10): Runtimes, Access, Models, Context, Skills, Tools, MCPs, Connectors, VCS Connectors, Operations.
- Runtimes: "Connected runtimes — Your computers run the agents. Konteks never holds a provider key or account."
  Connect a runtime; "19 connected"; card per runtime: name, status (+ reasons: Lease expired, Last known healthy,
  No live connection), "Not accepting work", description, sessions ("Open sessions 3 · Running 0" / Idle),
  update line "Update available: 0.19.26 · It updates by itself within 6 hours. Open it to update now.",
  "Personal|Organization · <workloads>" or "No role can be served yet". "Revoked runtimes (20)".
  "Workspace runtime policy — Where work goes when a session does not choose." Automatic / A specific runtime (list);
  "Only workspace managers can change it." Error state: "Runtimes could not be read. Try again · Not now".
- Workloads (7): Planning, Implementation & correction, Assistant & Search, Validation, QA & preview, Operations,
  Catalog onboarding.
- Access: "Understand and manage who can do what across this workspace." Request access. Tabs: Overview, People & groups,
  Roles, Resource access, Service accounts, Requests & approvals, Audit.
  Overview: Policy revision / Membership revision, Check access, My effective access (Engineering Contributor ·
  Workspace · Migrated grant · 91 permissions · Expires: Permanent · Protected).
  People & groups: Access groups (none), People (none to show). Roles: 16 built-in templates with permission lists.
  Resource access: resource select, "temporarily unavailable. No access has been assumed.", Guardrails,
  Delegation boundaries (Access limits, Grant limits). Service accounts + Workload identities. Requests & approvals,
  Audit: "No records to show."
  Request access (modal): Requested role, Requested scope, Requested duration (30 / 90 days), Why…; Cancel / Submit request.
  Check access (modal "Explain and test access"): Operation, Resource, Role to preview (optional), no-change simulation.
- Models: "Planning, Engineering and Review use Auto unless you pick a model. Testing uses an explicit choice…"
  4 modes (Planning, Engineering, Review, Testing (QA)) each with description and a model select (123 options grouped
  by harness, price per 1M tokens, suitability notes); "Cost stays with your subscription. Auto takes over only when this
  cannot run."; "Testing uses your selected model. It is not replaced automatically."; "Only a workspace owner can change these."
- Context: tabs Files, Skills, Repositories; SCOPE select (Workspace (all agents)); files list with Edit / Delete;
  Add File (File Name, Content; Cancel / Save); Edit File same. Skills tab: "No skills configured", Add Skill.
  Repositories: Repository Name + Load Repository.
- Skills: tabs Installed / Import skills; Create Skill; card (name, version, Built-in, description). Detail drawer:
  status, version, organization, created, description, metadata, versions, Evaluate 1.0.0. Import: Public Git /
  Connected Git, Repository URL, Find skills. Create Skill: Name*, Description*, Skill instructions (Markdown)* with
  Edit/Preview + toolbar + 0/50000, Optional (Version, License, Compatibility, Allowed Tools), Metadata / Scripts /
  References / Assets (Add entry); Cancel / Create Skill.
- Tools: "Manage reusable tools that agents can use in sessions." Create Tool; "2 tool(s)": archive 1.0.0, document 3.3.0.
  Detail: status, version, tenant, created, description, versions. Create Tool: Name*, Version, Description,
  Input parameters (Add parameters); Cancel / Create Tool.
- MCPs: "Manage versioned MCP packages that agents can install locally." Create MCP; "No MCPs found".
  Create MCP: Name*, Version, Description, Command*, Arguments (one per line), Environment Variables (Add entry).
- Connectors: "Connections through your agents — Jira, Slack, Teams and Asana…" toggles: Use my connections in Konteks,
  Allow connections in this workspace, Read links with the fastest model. "No computer of yours can use connections yet.
  Connect a computer with Codex or Claude Code in Connected runtimes."
- VCS Connectors (/customize/vcs): permission banner + Check again + Review or request access; "19 connector(s)":
  name, provider (Gitea / GitHub / Azure DevOps), URL, masked token, Connected.
- Operations: Channels (Add a channel → provider select: Datadog, PostHog, Loki via Alertmanager, Loki via Grafana
  alerting, Anything else; More options; setup path; header note; "The body to paste" + Copy; Create the channel / Cancel).
  Ops Profiles: "This profile can open incidents and wake the agent… It can never approve a change. A profile is set up
  on the System it watches, from that System's own screen."

## Runtime detail (/runtimes/{id})
- Name + status. Harness tiles (Claude Code: Needs sign-in, Codex: Ready, DeepSeek Harness: Ready, OpenCode: Failed,
  Google Antigravity: Not available). Selected harness: status, "Cost stays with your subscription",
  "Attested as organization-owned". "Your sessions" (New session, "+4 by teammates"). Commands ("Learned …",
  Show N commands: slash commands with descriptions). "On this computer — Run these in a terminal on <name> (OS)":
  status, agents, doctor, update ("Installs the newest connector release and restarts the connector. Running work
  finishes first."), update --check, auth status/login/logout, agent add, preview status, start, stop, git key add/list,
  support, --version, uninstall — each with description + Copy.
- AGENT UPDATE PROCESS: no in-app update button. The connector updates itself within 6 hours, or the owner runs
  `konteks-remote update` on that computer.

## Settings (/settings/…)
"Settings — You, your workspace and how it looks; your plan, usage and payments." Tabs: General, Plan, Usage, Budgets, Payments.
- General: Workspace (name, "Only the workspace owner can rename it."), Profile (Display name, Save), Appearance
  (System / Light / Dark), Language (Auto detect / English / Indonesian).
- Plan: SUBSCRIPTION (Current plan Enterprise Active, Renews on, Included monthly SP 10,000, SP available, Purchased
  balance, Overage Disabled); PLAN ENTITLEMENTS (Seats, Systems, Repositories Unlimited; MCP access, Validation checks,
  Your own runtimes, Presence Enabled); Compare plans.
- Usage: This period, Spent last 30 days, Left, Renews on; explanatory notes; "What drove it": Chat with agents,
  Model tokens, Ideas and planning, Agent work, Not reported (Why?), Total; More detail.
- Budgets: "Budget controls" → access_denied (should read as a permission state).
- Payments: "Add Story Points — Select a package to continue": Starter 500, Team 2,500, Growth 10,000, Scale 50,000
  (choosing a package starts checkout). Payment history: Date, Order ID, Method, Amount, Status (Pending / Failed / Paid).

## Work Locally (account menu)
"Connect your local AI agent to the platform using the MCP protocol." View connections (→ "External Agent Sessions";
for this role: permission error with Try again / Not now). YOUR CREDENTIALS: auto name, Active, masked token, created,
access level "Platform MCP Access", expiry; Rotate Token, Revoke Token. Generate: Access Level (Platform MCP Access,
default), Expiry (Platform default / 30 / 90 / 365 days), Generate Credential. "Use Rotate to generate a new token and
view setup instructions." NO name field.

## Support (account menu)
Dialog with two WhatsApp routes.

## Live tokens (read from app.konteks.io stylesheets, 27 Oct 2026)
:root: --kx-canvas #faf8ef · --kx-raised #ffffff · --kx-sidebar-bg #ffffff · --kx-primary #243025 · --kx-secondary #4d644f ·
--kx-muted #778c78 · --kx-muted-text-aa #607260 · --kx-accent-text-aa #4f7044 · --kx-accent-solid-aa #4f7044 · --kx-accent-solid-ink #ffffff ·
--kx-accent-fill-ink #243025 · --kx-border #e2e9d5 · --kx-pale #f4f8ee · --kx-accent #8fbf6a · --kx-accent-strong #5f8d4e ·
--kx-attention #9a6212 · --kx-danger #b3261e · --kx-ink-rgb 36 48 37 · --kx-bubble-bg #e5ecda · --kx-bubble-border #d6e0c0 ·
--kx-tech-code-bg #e9e9dc · --kx-tech-code-border #dddccc · --kx-radius-main 19.5px · --kx-second #2f6f8f · --kx-second-text-aa #2f6f8f ·
--kx-second-solid-aa #2f6f8f · --kx-second-solid-ink #ffffff · --kx-second-soft #7cc4e0 · --kx-second-pale #e8f1f5 · --kx-second-border #bfd7e2
RGB triplets: --color-app-bg 250 248 239 · -card 255 255 255 · -text 36 48 37 · -text-secondary 77 100 79 · -text-tertiary 96 114 96 ·
-border 226 233 213 · -border-strong 214 224 192 · -accent-soft 244 248 238 · -accent 229 236 218 · -accent-fill 143 191 106 ·
-accent-strong 95 141 78 · -accent-solid 79 112 68 · -accent-text 79 112 68 · -success 95 141 78 · -warning 154 98 18 ·
-danger 179 38 30 · -second 47 111 143 · -second-soft 232 241 245 · --app-attention-surface 252 243 226. Dark values live under `.dark`.
