# Motion

How Konteks moves, for the app (`/app`, `/login`, `/design-system`) and the marketing site (`/`, `/pricing`, `/security`, `/docs`, `/journal`, …). The live catalogue with playable specimens is **Design system › Foundations › Gerak** (`/design-system#foundations`).

## Rules

1. **Gate by frequency.** Used tens of times a day (tooltips, list hover, keyboard shortcuts, command palette): no motion, or colour only. Occasional (menus, dialogs, drawers, toasts): short motion. Rare (hero, marketing sections, first-run): the delight budget.
2. **Name the purpose** before animating: feedback, spatial consistency, state indication, preventing a jarring change, explanation (marketing only), delight (rare only).
3. **Only `transform` and `opacity` move** (`translate`, `scale`, `rotate` count). `clip-path` is allowed for reveals.
4. **Never `ease-in` on UI, never `scale(0)`, never `transition: all`.**
5. **Rapid or reversible things use transitions**, not keyframes (toasts, toggles), so a second trigger retargets instead of restarting.
6. **Exit the way you entered.** A toast rises from the bottom edge and returns to it.
7. **Hover motion only for a real pointer** (`(hover:hover) and (pointer:fine)`); on touch screens a tap is not a hover.
8. **Reduced motion is fewer and gentler, not none.** Movement stops; opacity and colour transitions stay so state changes still read.

## Tokens (`components/tokens/tokens.css`, shared by app and site)

| Token | Value | Use |
| --- | --- | --- |
| `--ease` (= `--ease-out`) | `cubic-bezier(.16,1,.3,1)` | Anything entering, leaving, or answering a press |
| `--ease-in-out` | `cubic-bezier(.77,0,.175,1)` | On-screen movement and morphs |
| `--ease-drawer` | `cubic-bezier(.32,.72,0,1)` | Sheets and docked composers rising from the edge; the phone sidebar |
| `--d-tip` | 125ms | Reserved; tooltips are instant today |
| `--d-press` | 160ms | Button press, `scale: .97` |
| `--d-pop` | 180ms | Menus, popovers, the skill panel |
| `--d-page` | 200ms | Route change in the app |
| `--d-modal` | 250ms | Dialog, phone sidebar, new message or comment |
| `--d-sheet` | 400ms | Composer rising on phones |
| `--d-toast` | 400ms | Toast in and out |
| `--d-reveal` | 800ms | Marketing reveals only |
| `--stagger` | 60ms | Gap between items in a group |

## App patterns

| Pattern | Purpose | Format | Code |
| --- | --- | --- | --- |
| Press | Feedback | `.btn:active{scale:.97}`, `scale var(--d-press) var(--ease)` | `components.css` › Motion system |
| Menu from its trigger | Spatial consistency | `@starting-style` opacity 0, scale .96 → 1, `--d-pop`, `--ease`; `transform-origin` set by `menu()` to the trigger's centre on the side it opened | `ui.js` `menu()`, `.menu` |
| Toast | Feedback | transition (not keyframes) from `translate:0 100%`, out the same way; `--d-toast ease`; removed after 400ms | `ui.js` `toast()`, `.toast` |
| Dialog | Preventing a jarring change | opacity + scale .98 → 1, 220ms `--ease`; out 120ms `--ease`; origin centre | `.dialog`, `.dialog.leaving` |
| Drawer | Spatial consistency | from 24px right, 280ms `--ease`; out 150ms `--ease` | `.drawer` |
| Route change | Preventing a jarring change | page content (not the top bar) opacity 0 → 1, 4px → 0, `--d-page --ease` | `app.js` adds `.view-in` to `.main` |
| New message / comment | State indication | rises 8px, `--d-modal --ease` | `.msg-in` |
| Composer rises (phone) | Spatial consistency | `@starting-style` from `translate:0 100%`, `--d-sheet --ease-drawer` | `.tl-cmt`, `.cmt-new` |
| Phone sidebar | Spatial consistency | `translate` -100% → 0, `--d-modal --ease-drawer` | `.side` |

Kept still on purpose: tooltips (instant), keyboard shortcuts, table and list hover (colour only), data being read.

## Site patterns (`landing/`)

| Pattern | Format | Where |
| --- | --- | --- |
| Hero on load | the lanes start hidden so their finished HTML state never flashes on refresh; each h1 line rises and fades in (`translate .5em` + opacity, 1s `--ease`, second line +.14s), then the sentence (+.32s), the actions (+.44s) and the example note (+.2s, rising 40px from scale .98) | Landing, once per visit |
| Heading reveal | `.rv-h`: rises `.45em` + opacity, `--d-reveal --ease` | Every h1/h2 on every marketing page |
| Paragraph follows | `.rv-p`: rises 16px, `--d-reveal`, 140ms after | The line beside a heading |
| Group stagger | `.rv-i`: rises 24px, `--d-reveal`, delay `--i × --stagger` | Agents, training, pricing, docs, journal, about |
| Rules arrive (phone) | icon, name, promise, detail, example, .08–.42s apart; the meter fills and counts | Authority, Money, Evidence |
| Section arrivals (animation-on-scroll) | `animationIn`: rises 30px out of an 8px blur, .9s `--ease`, paused until seen, fill `backwards` so parallax takes over after | The loop, the agents diagram, training, record panel (desktop), docs map, security panel |
| The work week | plays on its own once 35% is on screen: the five chores go to agents one by one over 4.2s and the hours count up; only the hand-off (gathering into one column) waits for the scroll, and the scroll cue appears only then | The same work, done differently |
| Scroll scenes | progress follows scroll position, no duration: pinned hero, the record rail, the eras | Landing |
| Reading hold | the Naur quote is held on screen (pinned column on desktop, a sticky quote with a 70svh hold on phones) while it lights word by word; on desktop the duties sit far apart and a duty stays lit until the next one has clearly passed the reading line (42% of the screen), so nothing is held or moved against the scroll | Programming is theory building |
| Menu | grows from its button, `--d-pop` | Site nav, View tab |
| View switch | cross-document view transition; the View tab stays still | All four views |

`reveal.js` tags the elements, watches each through its parent, fires once, then removes its classes so hover styles return. Without JS everything is simply there.

## Smooth scrolling (performance)

- Reveals use only `opacity` and `translate` (compositor). No `clip-path` on large text.
- Scroll scenes run only while their section is near the screen; section extents are measured on layout, not every frame.
- Progress bars move with `transform: scaleX()` set directly on the bar, never `width`, and never through a CSS variable on a large parent (that restyles the whole subtree every frame).
- Nothing that repaints a large area changes per scroll frame (`border-radius`, `clip-path`, filters). The moss sections flatten their corners once, with a class.
- Scroll scenes follow the scroll with inertia (`follow()` in landing.js: exponential approach, frame-rate independent), so a trackpad flick or wheel notch glides instead of jumping. The Naur quote lights at τ 320ms. The eras (Four ways, one job) keep this morning's direct scroll mapping and 270svh track, by request.
- Parallax layers carry `will-change: transform`. Phones get a solid sticky nav instead of a blurred one.
- Measured on a 4× throttled phone profile scrolling the whole landing page: frame time p90 went from 33ms to 16.7ms, with no frames over 50ms.

## Checklist before shipping motion

- Frequency tier and purpose named.
- Only transform, opacity (or clip-path for a reveal).
- A token for the curve and the duration; no hand-typed cubic-bezier.
- Exit path matches the entrance; rapid triggers use transitions.
- Hover motion gated to fine pointers.
- No per-frame writes that restyle a big subtree or repaint a large area.
- Checked with reduced motion on (DevTools › Rendering) and at 10% playback (Animations panel).
