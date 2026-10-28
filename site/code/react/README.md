# Konteks UI · React + Tailwind

The interactive components of the redesign as React components styled with Tailwind, for the live app (Backstage + React + Tailwind). They look and behave like the prototype; the prototype's component catalog is the reference for every state.

| Component | File | What it covers |
|---|---|---|
| `Button` | `Button.tsx` | default, primary, ghost, danger; sm/md/lg; icon-only; loading; `cost` shown inside the button (UX-003) |
| `Field`, `Input`, `Textarea` | `Field.tsx`, `Input.tsx` | label above, hint below, error that names the fix; ids and `aria-describedby` wired; textarea that grows with its content (UX-015) |
| `Combobox` | `Combobox.tsx` | searchable list with groups and right-aligned hints; portalled, flips upward, never clipped (UX-010, UX-014, UX-029, UX-044) |
| `Menu` | `Menu.tsx` | pick or navigate; ↑↓ Home End, Escape returns focus, opens upward near the bottom |
| `Drawer`, `Modal`, `Dialog` | `Overlay.tsx` | the overlay grammar: Escape closes the top layer only, focus trapped and returned, stacked scrim stays clear (UX-012, UX-035) |
| `Composer` | `Composer.tsx` | notes and the agent session; "/" picker for skills and tools, picks as chips, ⌘↵ to send, compact one-row form |
| `Avatar` | `Avatar.tsx` | initials on Mist Green, or the Konteks mark for the agent; accent ring for "your move" |
| `Reactions` | `Reactions.tsx` | reaction chips you toggle and a horizontal picker (one row, ←/→, Escape); picking one that exists adds you to it |
| `FlowTrack` | `FlowTrack.tsx` | Plan · Breakdown · Estimate · Delivery · Receipt, only the current step named (in the row's tone), the others named on hover, ticket bar on a delivery; packs to the left when its container is under 600px |
| `Queue`, `QueueFilter`, `QueueRow` | `Queue.tsx` | Work In Progress as a work queue: whose move and how long, title, System, N new, cause, flow track, the one action or a gate; whose move is a filter over one list, newest movement first |
| `ActivityFeed`, `ActivityDay`, `ActivityCard`, `ActivityQuote`, `AgentReply`, `TicketBar` | `Activity.tsx` | Activities as a feed of what people did; Konteks never appears as an entry, its answer is an `AgentReply` inside the caller's card |

## Install

1. Load the design tokens once, before the app's own CSS: `tokens.css`, then `tokens.live-map.css` (both in the package root). Then `motion.css` from this folder (keyframes only).
2. Add the preset and this folder to Tailwind:

```js
// tailwind.config.js
module.exports = {
  presets: [require("./konteks-ui/tailwind.preset.js")],
  content: ["./src/**/*.{ts,tsx}", "./konteks-ui/react/**/*.tsx"],
};
```

3. Peer dependencies: `react` ≥ 18, `react-dom` ≥ 18, `lucide-react` (icons, stroke 1.75), `tailwindcss` ≥ 3.3.
4. Import: `import { Button, Combobox, Drawer } from "./konteks-ui/react";`

Colours come from the preset's `app-*` names (filled by `tokens.live-map.css`). The few tokens the preset does not name (hover, press, sunken, focus, scrim, on-accent) are read as `var(--…)` from `tokens.css`, so there is still no raw colour anywhere. Dark mode follows the `.dark` class the app already sets.

## Examples

```tsx
<Button variant="primary" cost="2.15 SP" onClick={() => setConfirm(true)}><Check strokeWidth={1.75} />Approve</Button>

<Field label="Repository URL" error={valid ? undefined : "Enter a full URL, like https://github.com/owner/skills"}>
  <Input value={url} onChange={e => setUrl(e.target.value)} />
</Field>

<Combobox
  value={connection}
  onChange={setConnection}
  options={[
    { value: "hris-azure", label: "HRIS Azure", hint: "Azure DevOps", group: "Connected to HRIS Nusantara" },
    { value: "gitea-sari", label: "Gitea Sari", hint: "gitea.example.id", group: "Other connections" },
  ]}
/>

<Menu label="Account" trigger={<Button variant="ghost">Account</Button>} items={[
  { label: "Settings", icon: <Settings strokeWidth={1.75} />, onSelect: openSettings },
  "divider",
  { label: "Sign out", icon: <LogOut strokeWidth={1.75} />, danger: true, onSelect: signOut },
]} />

<Drawer open={open} onClose={() => setOpen(false)} title="Breakdown" sub="1 ticket · 2.15 SP"
  footer={<><Button onClick={() => setOpen(false)}>Close</Button><Button variant="primary">Accept</Button></>}>
  …
</Drawer>

<Dialog open={confirm} title="Approve TKT-1's delivery?" confirmLabel="Approve" cost="2.15 SP"
  onCancel={() => setConfirm(false)} onConfirm={approve}>
  Konteks will run the delivery on rf-01, up to 2.15 SP.
</Dialog>

<Composer compact cta="Send" placeholder="Describe the outcome you need. Type / for a skill"
  items={skillsAndTools} onSend={({ text, picks }) => post(text, picks)} />
```

```tsx
<QueueFilter value={who} onChange={setWho}
  options={[{ key: "all", label: "All", count: 8 }, { key: "mine", label: "Needs you", count: 2 }]} />
<Queue>
  <QueueRow mover={{ name: "Ardian Yusuf", initials: "AY", label: "Your move", you: true }} wait="7h 11m"
    title="Rental checkout documentation" system="Rentify" fresh={21} tone="decision"
    cause="The plan is ready. Break it into tickets" flow={{ current: 0 }} onOpen={open}
    action={<Button size="sm" variant="primary">Create tickets</Button>} />
</Queue>

<ActivityFeed>
  <ActivityDay day="Today" date="27 Oct 2026" />
  <ActivityCard actor={{ name: "Dimas Pratama", initials: "DP" }} verb="approved TKT-2's delivery in"
    initiative={{ title: "Invoice export for Ledgerline", onOpen: open }} time="19.26" live
    system="Ledgerline" stage="Executing" updates={10} reactions={reactions} onReactions={setReactions}
    reply={<AgentReply did="Delivering TKT-2 of 3 on rf-01" time="19.28"><TicketBar done={1} of={3} ticket="TKT-2" /></AgentReply>} />
</ActivityFeed>
```

## Rules the components already enforce

- A modal's or drawer's title is the label of the button that opened it; pass the same words.
- One primary per footer, on the right. Keep the primary disabled until required fields are valid.
- Dialogs only for actions that spend money or cannot be undone; name the action ("Approve", "Revoke token"), never "OK".
- Escape closes one layer at a time. A menu or combobox inside a drawer closes first, without closing the drawer.
- Touch targets are at least 24px; fields are 16px on phones so iOS does not zoom.
- Activities lists people only. Agents answer when a person calls them, so an agent never gets its own `ActivityCard`.
- Work In Progress is a queue, not a feed: no avatar rail, no reactions; whose move is a filter, not a grouping.

## Verified

Type-checked with TypeScript 5.6 (strict). Rendered with Tailwind 3.4 in light and dark and driven with Playwright: combobox search and keyboard pick, menu keyboard and focus return, two stacked drawers closed one Escape at a time with focus returned to each opener, focus trap, modal autofocus, dialog confirm, composer "/" pick and ⌘↵ send, queue filter and row open, reaction picker keyboard pick and focus return.
