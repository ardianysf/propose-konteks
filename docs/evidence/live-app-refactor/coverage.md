# Live app inventory — 1 October 2026

Reference: authenticated app.konteks.io, Refactory workspace. Live screenshots are kept locally in `/tmp/konteks-live-reference`; published evidence uses illustrative prototype fixtures exclusively.

| Live surface | Proposed implementation | Inspection |
| --- | --- | --- |
| Activities: system filter, initiative feed, reactions, comments, updates | Activities page, shared notes and updates | Observed |
| Work In Progress: filter, discovery continuation, initiative list | WIP page, session continuation | Observed |
| New initiative: prompt, system, transcript attachment | Validated local dialog | Observed |
| Initiative detail: notes, attachment, comments/reactions, updates drawer | WIP detail, shared note composer, updates dialog | Observed |
| Issues | System filter and observed empty state | Empty in live workspace; detail inaccessible |
| Releases | System filter and observed empty state | Empty in live workspace; candidate/detail inaccessible |
| Leaderboard: People, Model value | Two ranking panels | Observed; no ranking detail control exposed |
| Customize: Runtimes | Runtime list, policy, connection dialog | Observed |
| Runtime: agent tabs, sessions, terminal instructions | Runtime page reusing session flows | Observed |
| Runtime details: identity, previews, agents, actions, history | Runtime dialog and editable local state | Observed |
| Customize: Access and its seven submenus | Navigation with explicit unavailable state | Live content remained loading; do not invent roles/approval screens |
| Customize: Models | Explicit unavailable state; existing agents accessible separately | Live content remained loading |
| Customize: Context (Files, Skills, Repositories) | Reuse ContextPanel and its dialogs | Observed files; existing proposed component contracts retained |
| Customize: Skills | Retain CapabilitiesPanel with reference limitation notice | Live skills content remained loading |
| Customize: Tools (search, create, detail, versions) | Reuse CapabilitiesPanel and its dialogs | Observed list, create form, detail; versions failed to load |
| Customize: MCPs (list, add form) | Reuse ConnectionsPanel, MCP dialogs | Observed |
| Customize: Connectors | Reuse ConnectionsPanel, empty state | Observed empty |
| Customize: VCS Connectors (list, validated create form) | Reuse ConnectionsPanel, connector dialog | Observed |
| Customize: Operations (channels, setup, Ops Profiles) | Local channel setup and list | Observed empty and creation form |
| Settings: General (workspace, profile, appearance, language) | Shared GeneralPanel plus workspace form | Observed |
| Settings: Plan, Usage, Budgets, Payments | Existing BillingWorkspace adapted to page navigation | Observed usage/payments; Plan remained loading on inspection, budgets unavailable in live workspace |
| Profile | Dedicated access to existing profile editor | Live Profile is a section of General, not a separate menu |
| Account: Work Locally (credentials, expiry, rotate/revoke) | Local credential panel with inert illustrative tokens | Observed; no production credentials copied |
| Account: Support, language, sign out | Support panel, existing locale, simulated sign out | Account menu observed; external support destination not inspected |
| Workspace switching, manage, creation | Existing context popover/create workspace; manage links to Access | Observed workspace menu; existing prototype forms retained |
| Notifications | Local dialog linking to initiative | Observed |
| Create System: discover, start from nothing, empty form | Existing system form plus entry choices, session handoff | Observed choices and empty form |
| System map, repository and component selection | Preserve existing component implementations | Existing prototype coverage; not all live management routes exposed |

This is a prototype adaptation, not a production API integration. Unavailable live details are explicitly identified above and in the relevant prototype screens. Existing proposed flows remain accessible.
