import { useEffect, useReducer } from 'react'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import CustomizeModal from './CustomizeModal'
import { OverlayLifecycleProvider } from '../shell/OverlayLifecycle'
import { MockupContext, useMockup } from '../../state/MockupContext'
import {
  initialState,
  mockupReducer,
  type CustomizeTab,
  type MockupOverlay,
  type MockupState,
} from '../../state/mockupReducer'
import {
  AGENT_ROLES,
  AI_PROVIDERS,
  ARCHIVED_AGENTS,
  CONTEXT_FILES,
  EXECUTION_PROFILES,
  MCP_SERVERS,
  PRESERVED_SKILLS,
  REPOSITORIES,
  SYSTEMS,
  VCS_CONNECTORS,
} from '../../data/mockData'
import {
  preservedCountLine,
  SKILLS_SECTION,
  TOOLS_SECTION,
} from './preservedContent'

// ---------------------------------------------------------------------------
// Harness — the modal behind the real reducer via the mockup context,
// mounted exactly the way AppShell mounts it (Task 9 Part A): the
// overlay slot renders the modal only while overlay.kind === 'customize'.
// A state bucket captures the committed store for dispatch assertions.
// ---------------------------------------------------------------------------

type StateBucket = { current: MockupState | null }

function StateProbe({ bucket }: { bucket: StateBucket }) {
  const { state } = useMockup()
  useEffect(() => {
    bucket.current = state
  })
  return null
}

function renderCustomizeModal(
  overlay: MockupOverlay = { kind: 'none' },
  initial?: Partial<MockupState>,
) {
  const bucket: StateBucket = { current: null }

  function Harness() {
    const [state, dispatch] = useReducer(mockupReducer, { ...initialState(), ...initial, overlay })
    return (
      <MockupContext.Provider value={{ state, dispatch }}>
        <StateProbe bucket={bucket} />
        <OverlayLifecycleProvider overlay={state.overlay} dispatch={dispatch}>
          {state.overlay.kind === 'customize' && <CustomizeModal />}
        </OverlayLifecycleProvider>
      </MockupContext.Provider>
    )
  }

  return { ...render(<Harness />), bucket }
}

const getDialog = () => screen.getByRole('dialog', { name: 'Customize' })
const getTablist = () => screen.getByRole('tablist', { name: /customize tabs/i })
const getTab = (name: string) => within(getTablist()).getByRole('tab', { name })
const getTabPanel = () => screen.getByRole('tabpanel')

/** The exact §11 tab order — Agents, Context, MCP, Connectors, VCS,
 * Skills, Tools — nothing else, in this order. */
const TAB_ORDER = ['Agents', 'Context', 'MCP', 'Connectors', 'VCS', 'Skills', 'Tools'] as const

const TAB_BY_LABEL: Record<(typeof TAB_ORDER)[number], CustomizeTab> = {
  Agents: 'agents',
  Context: 'context',
  MCP: 'mcp',
  Connectors: 'connectors',
  VCS: 'vcs',
  Skills: 'skills',
  Tools: 'tools',
}

/** True when `later` comes after `earlier` in document order. */
const follows = (earlier: Element, later: Element) =>
  (earlier.compareDocumentPosition(later) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0

// jsdom does not load stylesheets, so the fixed 790×580 geometry is
// verified against the shipped CSS directly (tokens.test.ts convention).
const css = readFileSync(join(process.cwd(), 'src/styles/components.css'), 'utf8')
const tokens = readFileSync(join(process.cwd(), 'src/styles/tokens.css'), 'utf8')

const EMOJI = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/u

// ---------------------------------------------------------------------------
// Frame + mount gating (spec §11, §16)
// ---------------------------------------------------------------------------

describe('CustomizeModal — frame', () => {
  it('renders only while the customize overlay is open — no other overlay kind mounts it', () => {
    const closed = renderCustomizeModal()
    expect(closed.container.querySelector('.kx-customize')).toBeNull()
    closed.unmount()

    const other = renderCustomizeModal({ kind: 'create-system-modal', source: 'system-menu' })
    expect(other.container.querySelector('.kx-customize')).toBeNull()
    other.unmount()

    renderCustomizeModal({ kind: 'customize', tab: 'agents' })
    expect(getDialog()).toBeInTheDocument()
  })

  it('is a centered modal dialog over the shared backdrop — role=dialog, aria-modal, labelled by its title', () => {
    renderCustomizeModal({ kind: 'customize', tab: 'agents' })
    const dialog = getDialog()
    expect(dialog).toHaveClass('kx-modal', 'kx-customize')
    expect(dialog).toHaveAttribute('aria-modal', 'true')

    const title = within(dialog).getByRole('heading', { name: 'Customize' })
    expect(title.tagName).toBe('H2')

    // Exactly one backdrop, mounted before the dialog in document order.
    const backdrop = document.querySelector('.kx-modal-backdrop')
    expect(backdrop).not.toBeNull()
    expect(follows(backdrop!, dialog)).toBe(true)

    // Header dismiss control — exactly one.
    expect(within(dialog).getAllByRole('button', { name: 'Close' })).toHaveLength(1)
  })

  it('carries the fixed 790×580 geometry in CSS — width and height pinned through the tokens on every tab', () => {
    expect(css).toContain('.kx-customize {')
    expect(css).toContain('width: var(--kx-customize-w)')
    expect(css).toContain('height: var(--kx-customize-h)')
    // The tokens resolve to the spec's exact 790×580 (AC34).
    expect(tokens).toMatch(/--kx-customize-w:\s*790px/)
    expect(tokens).toMatch(/--kx-customize-h:\s*580px/)
  })

  it('moves focus to the dialog on mount', () => {
    renderCustomizeModal({ kind: 'customize', tab: 'agents' })
    expect(getDialog()).toHaveFocus()
  })

  it('Escape dispatches CLOSE_OVERLAY and unmounts the dialog', () => {
    const { bucket } = renderCustomizeModal({ kind: 'customize', tab: 'agents' })
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(bucket.current?.overlay).toEqual({ kind: 'none' })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('closes from the header dismiss control too', () => {
    const { bucket } = renderCustomizeModal({ kind: 'customize', tab: 'agents' })
    fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(bucket.current?.overlay).toEqual({ kind: 'none' })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})

// ---------------------------------------------------------------------------
// Tab navigation — seven tabs, exact order, selected from overlay.tab (§11)
// ---------------------------------------------------------------------------

describe('CustomizeModal — tab nav', () => {
  it('renders exactly seven tabs in the exact §11 order — Agents, Context, MCP, Connectors, VCS, Skills, Tools', () => {
    renderCustomizeModal({ kind: 'customize', tab: 'agents' })
    const tabs = within(getTablist()).getAllByRole('tab')
    expect(tabs.map((tab) => tab.textContent)).toEqual([...TAB_ORDER])
    expect(getTablist()).toBeVisible()
  })

  it('selects the tab carried by overlay.tab — agents by default, any requested tab otherwise', () => {
    const first = renderCustomizeModal({ kind: 'customize', tab: 'agents' })
    expect(getTab('Agents')).toHaveAttribute('aria-selected', 'true')
    expect(getTab('Tools')).toHaveAttribute('aria-selected', 'false')
    expect(getTabPanel()).toHaveTextContent('Agents')
    first.unmount()

    for (const label of TAB_ORDER) {
      if (label === 'Agents') continue
      const { unmount } = renderCustomizeModal({ kind: 'customize', tab: TAB_BY_LABEL[label] })
      expect(getTab(label)).toHaveAttribute('aria-selected', 'true')
      expect(getTabPanel()).toHaveTextContent(label)
      unmount()
    }
  })

  it('renders exactly one tab panel — only the selected tab mounts its content', () => {
    renderCustomizeModal({ kind: 'customize', tab: 'skills' })
    expect(screen.getAllByRole('tabpanel')).toHaveLength(1)
    expect(getTabPanel()).toHaveTextContent('Skills')
    expect(getTabPanel()).not.toHaveTextContent('Agents')
  })
})

// ---------------------------------------------------------------------------
// In-place switching — SET_CUSTOMIZE_TAB without remounting the frame (AC34/35)
// ---------------------------------------------------------------------------

describe('CustomizeModal — in-place tab switching', () => {
  it('tab buttons dispatch SET_CUSTOMIZE_TAB — the aria-selected moves and the panel content swaps', () => {
    const { bucket } = renderCustomizeModal({ kind: 'customize', tab: 'agents' })
    fireEvent.click(getTab('Context'))
    expect(bucket.current?.overlay).toEqual({ kind: 'customize', tab: 'context' })
    expect(getTab('Context')).toHaveAttribute('aria-selected', 'true')
    expect(getTab('Agents')).toHaveAttribute('aria-selected', 'false')
    expect(getTabPanel()).toHaveTextContent('Context')
  })

  it('switching through all seven tabs never remounts the frame — the same dialog, header, nav, and sole scroll region stay mounted', () => {
    renderCustomizeModal({ kind: 'customize', tab: 'agents' })
    const dialog = getDialog()
    const title = within(dialog).getByRole('heading', { name: 'Customize' })
    const close = within(dialog).getByRole('button', { name: 'Close' })
    const head = dialog.querySelector('.kx-customize__head')!
    const nav = getTablist()

    for (const label of TAB_ORDER) {
      if (label === 'Agents') continue
      fireEvent.click(getTab(label))
      // Same DOM nodes still connected — the frame never remounted.
      expect(document.contains(dialog)).toBe(true)
      expect(document.contains(title)).toBe(true)
      expect(document.contains(close)).toBe(true)
      expect(document.contains(head)).toBe(true)
      expect(document.contains(nav)).toBe(true)
      // The fixed sizing class stays on the frame (AC34).
      expect(getDialog()).toBe(dialog)
      expect(getTablist()).toBe(nav)
      expect(dialog.querySelector('.kx-customize__head')).toBe(head)
      expect(getDialog()).toHaveClass('kx-modal', 'kx-customize')
      // Still exactly one scroll region, carrying the swapped panel (AC35).
      const regions = dialog.querySelectorAll('.kx-customize__content')
      expect(regions).toHaveLength(1)
      expect(regions[0].contains(getTabPanel())).toBe(true)
      expect(getTab(label)).toHaveAttribute('aria-selected', 'true')
      expect(getTabPanel()).toHaveTextContent(label)
    }
  })
})

// ---------------------------------------------------------------------------
// Scroll anatomy — header + nav static, one content scroll region (AC35)
// ---------------------------------------------------------------------------

describe('CustomizeModal — scroll anatomy', () => {
  it('renders exactly one .kx-customize__content scroll region carrying the tab panel', () => {
    renderCustomizeModal({ kind: 'customize', tab: 'agents' })
    const dialog = getDialog()
    const regions = dialog.querySelectorAll('.kx-customize__content')
    expect(regions).toHaveLength(1)
    expect(regions[0].contains(getTabPanel())).toBe(true)
  })

  it('keeps the fixed header and the tab nav outside the scroll region — head, then nav, then content in document order', () => {
    renderCustomizeModal({ kind: 'customize', tab: 'agents' })
    const dialog = getDialog()
    const head = dialog.querySelector('.kx-customize__head')
    const nav = getTablist()
    const content = dialog.querySelector('.kx-customize__content')!

    expect(head).not.toBeNull()
    expect(content.contains(head!)).toBe(false)
    expect(content.contains(nav)).toBe(false)

    expect(follows(head!, nav)).toBe(true)
    expect(follows(nav, content)).toBe(true)
  })

  it('scrolls only the content region in CSS — overflow sits on .kx-customize__content, not the frame', () => {
    expect(css).toMatch(/\.kx-customize__content[\s\S]*?overflow-y:\s*auto/)
    expect(css).toMatch(/\.kx-customize \{[\s\S]*?overflow:\s*hidden/)
  })
})

// ---------------------------------------------------------------------------
// Hygiene — semantic labels, no emoji, no placeholder TODO text (§16)
// ---------------------------------------------------------------------------

describe('CustomizeModal — hygiene', () => {
  it('labels every control semantically and uses no emoji anywhere in the dialog', () => {
    renderCustomizeModal({ kind: 'customize', tab: 'agents' })
    const dialog = getDialog()
    expect(dialog.textContent).not.toMatch(EMOJI)

    for (const button of within(dialog).getAllByRole('button')) {
      expect(button).toHaveAccessibleName()
    }
    for (const tab of within(getTablist()).getAllByRole('tab')) {
      expect(tab).toHaveAccessibleName()
    }
    expect(dialog).toHaveAccessibleName()
  })

  it('renders no TODO-style placeholder text in any tab — semantic headings only', () => {
    renderCustomizeModal({ kind: 'customize', tab: 'agents' })
    for (const label of TAB_ORDER) {
      if (label === 'Agents') continue
      fireEvent.click(getTab(label))
    }
    fireEvent.click(getTab('Agents'))
    expect(getDialog().textContent).not.toMatch(/\b(TODO|TBD|WIP|placeholder)\b/i)
  })
})

// ---------------------------------------------------------------------------
// Agents tab (Task 9 Part B, AC36) — Create profile action, Active
// Profiles table driven by EXECUTION_PROFILES, compact Review setup
// sticker, and progressive disclosure exposing AI role / provider /
// profile / archived / permission content.
// ---------------------------------------------------------------------------

const DISCLOSURE_LABELS = [
  'AI roles',
  'Providers',
  'Profile assignments',
  'Archived agents',
  'Permissions',
] as const

describe('CustomizeModal — Agents tab (AC36)', () => {
  it('renders the exact hierarchy — Create profile action, then the Active Profiles table, then the Review setup sticker, then the disclosure regions', () => {
    renderCustomizeModal({ kind: 'customize', tab: 'agents' })

    const create = getTabPanel().querySelector<HTMLElement>('header.kx-customize-tab__bar')!
    const table = screen.getByRole('table', { name: 'Active Profiles' })
    const review = screen.getByRole('complementary', { name: 'Review setup' })
    const disclosures = screen.getAllByRole('group')

    expect(within(create).getByRole('button', { name: 'Create profile' })).toBeInTheDocument()
    expect(follows(create, table)).toBe(true)
    expect(follows(table, review)).toBe(true)
    for (const disclosure of disclosures) {
      expect(follows(review, disclosure)).toBe(true)
    }
  })

  it('drives the Active Profiles table from EXECUTION_PROFILES — one row per profile with planner, executor, and readiness values', () => {
    renderCustomizeModal({ kind: 'customize', tab: 'agents' })
    const table = screen.getByRole('table', { name: 'Active Profiles' })

    const rows = within(table).getAllByRole('row')
    expect(rows).toHaveLength(EXECUTION_PROFILES.length + 1) // header + data rows

    const body = rows.slice(1).map((row) => row.textContent)
    for (const profile of EXECUTION_PROFILES) {
      const row = body.find((text) => text!.includes(profile.name))
      expect(row).toContain(profile.plannerModel)
      expect(row).toContain(profile.executorModel)
      expect(row).toContain(profile.readiness === 'ready' ? 'Ready' : 'Needs setup')
    }
  })

  it('Create profile reveals a compact local creation form with a hint — and persists nothing', () => {
    const { bucket } = renderCustomizeModal({ kind: 'customize', tab: 'agents' })
    const create = screen.getByRole('button', { name: 'Create profile' })
    expect(screen.queryByRole('textbox', { name: 'Profile name' })).not.toBeInTheDocument()

    // Reveal — the compact creation form with an explicit no-persistence hint.
    fireEvent.click(create)
    const input = screen.getByRole('textbox', { name: 'Profile name' })
    expect(input).toBeInTheDocument()
    expect(getTabPanel().textContent).toContain('not stored in this mockup')

    // Typing stays local — the committed store never gains a profile.
    fireEvent.change(input, { target: { value: 'Payments Platform' } })
    expect(bucket.current?.activeProfileId).toBe(initialState().activeProfileId)
    expect(bucket.current?.overlay).toEqual({ kind: 'customize', tab: 'agents' })

    // Toggle again collapses it.
    fireEvent.click(create)
    expect(screen.queryByRole('textbox', { name: 'Profile name' })).not.toBeInTheDocument()
  })

  it('keeps Review setup a compact sticker — it counts the needs-setup profiles from the data and ships as an inline card in CSS', () => {
    renderCustomizeModal({ kind: 'customize', tab: 'agents' })
    const review = screen.getByRole('complementary', { name: 'Review setup' })

    const needsSetup = EXECUTION_PROFILES.filter((p) => p.readiness === 'needs-setup')
    expect(review.textContent).toContain(
      `${needsSetup.length} of ${EXECUTION_PROFILES.length} profiles need setup`,
    )
    for (const profile of needsSetup) {
      expect(review.textContent).toContain(profile.name)
    }

    // Compactness ships in CSS — inline card sizing, not a full panel.
    expect(review).toHaveClass('kx-agents__review')
    expect(css).toMatch(/\.kx-agents__review\s*\{[^}]*display:\s*inline-flex/)
    expect(css).toMatch(/\.kx-agents__review\s*\{[^}]*max-width/)
  })

  it('exposes AI role, provider, profile, archived, and permission content through five closed details regions in a fixed order', () => {
    renderCustomizeModal({ kind: 'customize', tab: 'agents' })
    const disclosures = getDialog().querySelectorAll('details.kx-agents__disclosure')
    expect(disclosures).toHaveLength(5)

    const summaries = [...disclosures].map(
      (details) => details.querySelector('summary')!.textContent,
    )
    expect(summaries).toEqual([...DISCLOSURE_LABELS])

    // Progressive disclosure — closed until opened (AC36).
    for (const details of disclosures) {
      expect((details as HTMLDetailsElement).open).toBe(false)
    }
  })

  it('each disclosure opens on click and carries its current illustrative values — roles, providers, assignments, archived, permissions', () => {
    renderCustomizeModal({ kind: 'customize', tab: 'agents' })
    const disclosures = [...getDialog().querySelectorAll('details.kx-agents__disclosure')] as HTMLDetailsElement[]

    // AI roles
    fireEvent.click(within(disclosures[0]).getByText('AI roles'))
    expect(disclosures[0].open).toBe(true)
    for (const role of AGENT_ROLES) {
      expect(disclosures[0].textContent).toContain(role.role)
      expect(disclosures[0].textContent).toContain(role.currentModel)
    }

    // Providers
    fireEvent.click(within(disclosures[1]).getByText('Providers'))
    expect(disclosures[1].open).toBe(true)
    for (const provider of AI_PROVIDERS) {
      expect(disclosures[1].textContent).toContain(provider.name)
      expect(disclosures[1].textContent).toContain(provider.models)
    }

    // Profile assignments — the active profile from the store
    fireEvent.click(within(disclosures[2]).getByText('Profile assignments'))
    expect(disclosures[2].open).toBe(true)
    expect(disclosures[2].textContent).toContain('Active profile')
    expect(disclosures[2].textContent).toContain(EXECUTION_PROFILES[0].name)

    // Archived agents
    fireEvent.click(within(disclosures[3]).getByText('Archived agents'))
    expect(disclosures[3].open).toBe(true)
    for (const agent of ARCHIVED_AGENTS) {
      expect(disclosures[3].textContent).toContain(agent.name)
      expect(disclosures[3].textContent).toContain(agent.archivedOn)
    }

    // Permissions — the authorization string of every profile
    fireEvent.click(within(disclosures[4]).getByText('Permissions'))
    expect(disclosures[4].open).toBe(true)
    for (const profile of EXECUTION_PROFILES) {
      expect(disclosures[4].textContent).toContain(profile.name)
      expect(disclosures[4].textContent).toContain(profile.authorization)
    }
  })
})

// ---------------------------------------------------------------------------
// Context tab (Task 9 Part B, AC37) — Files / Skills / Repositories
// sections with compact counts and representative illustrative content.
// ---------------------------------------------------------------------------

describe('CustomizeModal — Context tab (AC37)', () => {
  const getRegions = () => within(getTabPanel()).getAllByRole('region')

  it('presents exactly three labelled sections in order — Files, Skills, Repositories — each with a compact status/count', () => {
    renderCustomizeModal({ kind: 'customize', tab: 'context' })

    const regions = getRegions()
    expect(regions.map((region) => region.getAttribute('aria-labelledby'))).toHaveLength(3)

    const [files, skills, repositories] = regions
    expect(within(files).getByRole('heading', { name: 'Files' })).toBeInTheDocument()
    expect(within(skills).getByRole('heading', { name: 'Skills' })).toBeInTheDocument()
    expect(within(repositories).getByRole('heading', { name: 'Repositories' })).toBeInTheDocument()
    expect(follows(files, skills)).toBe(true)
    expect(follows(skills, repositories)).toBe(true)

    // With nothing selected, the repositories count reports zero — the
    // Files and Skills counts are unaffected by the session scope.
    const enabledSkills = PRESERVED_SKILLS.filter((skill) => skill.enabled)
    expect(files.textContent).toContain(`${CONTEXT_FILES.length} files`)
    expect(skills.textContent).toContain(
      `${enabledSkills.length} of ${PRESERVED_SKILLS.length} enabled`,
    )
    expect(repositories.textContent).toContain(
      `0 repositories · ${SYSTEMS.length} systems`,
    )
  })

  it('repositories — nothing selected: count 0, the concise `No repositories selected` note, and no repository rows', () => {
    renderCustomizeModal({ kind: 'customize', tab: 'context' })
    const [, , repositories] = getRegions()

    expect(repositories.textContent).toContain(`0 repositories · ${SYSTEMS.length} systems`)
    expect(repositories.textContent).toContain('No repositories selected')

    // The only row is the designed empty note — never a fake list.
    const items = repositories.querySelectorAll('.kx-context__item')
    expect(items).toHaveLength(1)
    expect(items[0]).toHaveClass('kx-context__item--empty')
    for (const repository of REPOSITORIES) {
      expect(repositories.textContent).not.toContain(repository.name)
    }
  })

  it('repositories — a global selected subset renders only those rows and their count', () => {
    renderCustomizeModal(
      { kind: 'customize', tab: 'context' },
      { selectedRepoIds: ['bsi/hris-frontend-shared', 'bsi/canteen-cms'] },
    )
    const [, , repositories] = getRegions()

    expect(repositories.textContent).toContain(`2 repositories · ${SYSTEMS.length} systems`)
    expect(within(repositories).getByText('bsi/hris-frontend-shared')).toBeInTheDocument()
    expect(within(repositories).getByText('bsi/canteen-cms')).toBeInTheDocument()
    // Each row carries its VCS and updated metadata.
    expect(repositories.textContent).toContain('GitHub')
    expect(repositories.textContent).toContain('GitLab')
    expect(repositories.textContent).toContain('updated 2026-08-15')

    // Unrelated repositories never render — no other registry rows leak in.
    for (const repository of REPOSITORIES) {
      const selected =
        repository.id === 'bsi/hris-frontend-shared' || repository.id === 'bsi/canteen-cms'
      if (!selected) {
        expect(within(repositories).queryByText(repository.name)).not.toBeInTheDocument()
      }
    }
    expect(repositories.textContent).not.toContain('No repositories selected')
  })

  it('repositories — a committed sessionContext repoIds takes precedence over the global selection', () => {
    renderCustomizeModal(
      { kind: 'customize', tab: 'context' },
      {
        selectedRepoIds: ['bsi/hris-frontend-shared', 'bsi/hris-frontend-promotion'],
        sessionContext: { systemId: 'bsi-canteen', repoIds: ['bsi/canteen-backend'] },
      },
    )
    const [, , repositories] = getRegions()

    // Only the committed session scope renders — the global selection does
    // not leak into the rows or the count.
    expect(repositories.textContent).toContain(`1 repositories · ${SYSTEMS.length} systems`)
    expect(within(repositories).getByText('bsi/canteen-backend')).toBeInTheDocument()
    expect(within(repositories).queryByText('bsi/hris-frontend-shared')).not.toBeInTheDocument()
    expect(within(repositories).queryByText('bsi/hris-frontend-promotion')).not.toBeInTheDocument()
  })

  it('repositories — unknown ids outside the registry drop out instead of rendering broken rows', () => {
    renderCustomizeModal(
      { kind: 'customize', tab: 'context' },
      { selectedRepoIds: ['bsi/hris-frontend-shared', 'ghost/not-in-registry'] },
    )
    const [, , repositories] = getRegions()

    expect(repositories.textContent).toContain(`1 repositories · ${SYSTEMS.length} systems`)
    expect(within(repositories).getByText('bsi/hris-frontend-shared')).toBeInTheDocument()
    expect(repositories.textContent).not.toContain('ghost/not-in-registry')
    expect(repositories.querySelectorAll('.kx-context__item')).toHaveLength(1)
  })

  it('each section carries representative illustrative content — files and skills from the data sources, repositories from the session scope', () => {
    renderCustomizeModal(
      { kind: 'customize', tab: 'context' },
      { selectedRepoIds: REPOSITORIES.slice(0, 2).map((repository) => repository.id) },
    )
    const [files, skills, repositories] = getRegions()

    for (const file of CONTEXT_FILES) {
      expect(files.textContent).toContain(file.path)
    }
    for (const skill of PRESERVED_SKILLS) {
      expect(skills.textContent).toContain(skill.name)
      expect(skills.textContent).toContain(skill.scope)
    }
    for (const repository of REPOSITORIES.slice(0, 2)) {
      expect(repositories.textContent).toContain(repository.name)
      expect(repositories.textContent).toContain(repository.vcs)
      expect(repositories.textContent).toContain(`updated ${repository.updatedAt}`)
    }
  })
})

// ---------------------------------------------------------------------------
// Integration variants (Task 9 Part B, AC37) — one parameterized
// component behind MCP / Connectors / VCS, each with its title and a
// compact semantic table or a designed empty state.
// ---------------------------------------------------------------------------

describe('CustomizeModal — integration variants (AC37)', () => {
  it('MCP — titled table of configured servers from MCP_SERVERS with transport, status chips, and a concise Add action', () => {
    renderCustomizeModal({ kind: 'customize', tab: 'mcp' })

    expect(within(getTabPanel()).getByRole('heading', { name: 'MCP', level: 3 })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Add MCP server' })).toBeInTheDocument()

    const table = screen.getByRole('table', { name: 'MCP servers' })
    const rows = within(table).getAllByRole('row')
    expect(rows).toHaveLength(MCP_SERVERS.length + 1)

    const connected = MCP_SERVERS.filter((server) => server.status === 'connected')
    expect(within(table).getAllByText('Connected')).toHaveLength(connected.length)
    expect(within(table).getAllByText('Needs setup')).toHaveLength(
      MCP_SERVERS.length - connected.length,
    )
    for (const server of MCP_SERVERS) {
      const row = rows.find((r) => r.textContent!.includes(server.name))!
      expect(row.textContent).toContain(server.transport)
    }
  })

  it('VCS — titled table of VCS_CONNECTORS with repository counts derived from REPOSITORIES and per-connector status', () => {
    renderCustomizeModal({ kind: 'customize', tab: 'vcs' })

    expect(within(getTabPanel()).getByRole('heading', { name: 'VCS', level: 3 })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Connect VCS' })).toBeInTheDocument()

    const table = screen.getByRole('table', { name: 'VCS connectors' })
    const rows = within(table).getAllByRole('row')
    expect(rows).toHaveLength(VCS_CONNECTORS.length + 1)

    for (const connector of VCS_CONNECTORS) {
      const count = REPOSITORIES.filter((repo) => repo.vcs === connector.name).length
      const row = rows.find((r) => r.textContent!.includes(connector.name))!
      expect(row.textContent).toContain(
        count === 1 ? '1 repository' : count > 0 ? `${count} repositories` : 'None yet',
      )
      expect(row.textContent).toContain(count > 0 ? 'Connected' : 'Needs setup')
    }
  })

  it('Connectors — renders the designed empty state while the workspace has no connectors: heading, helper text, Add action, no table', () => {
    renderCustomizeModal({ kind: 'customize', tab: 'connectors' })

    expect(
      within(getTabPanel()).getByRole('heading', { name: 'Connectors', level: 3 }),
    ).toBeInTheDocument()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()

    const empty = screen.getByRole('status')
    expect(empty).toHaveClass('kx-integrations__empty')
    expect(within(empty).getByRole('heading', { name: 'No connectors yet' })).toBeInTheDocument()
    expect(empty.textContent).toContain('Connect Jira, Slack, or Sentry')
    expect(screen.getByRole('button', { name: 'Add connector' })).toBeInTheDocument()

    // The designed empty state ships in CSS — a dashed compact panel.
    expect(css).toMatch(/\.kx-integrations__empty\s*\{[^}]*border:\s*1px dashed var\(--kx-border\)/)
  })

  it('switching between the three integration tabs swaps the variant in place — one panel, the right title each time', () => {
    renderCustomizeModal({ kind: 'customize', tab: 'mcp' })
    expect(screen.getByRole('table', { name: 'MCP servers' })).toBeInTheDocument()

    fireEvent.click(getTab('Connectors'))
    expect(screen.getAllByRole('tabpanel')).toHaveLength(1)
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Connectors', level: 3 })).toBeInTheDocument()

    fireEvent.click(getTab('VCS'))
    expect(screen.getAllByRole('tabpanel')).toHaveLength(1)
    expect(screen.getByRole('table', { name: 'VCS connectors' })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Connectors', level: 3 })).not.toBeInTheDocument()
  })

  it('styles integration rows as compact semantic tables with status chips — shared table CSS, no giant cards', () => {
    expect(css).toMatch(/\.kx-customize-tab__table\s*\{[^}]*border-collapse:\s*collapse/)
    expect(css).toMatch(/\.kx-integrations__status--connected\s*\{[^}]*color:\s*var\(--kx-accent-text-aa\)/)
    expect(css).toMatch(/\.kx-integrations__status--setup\s*\{[^}]*color:\s*var\(--kx-muted-text-aa\)/)
  })
})

// ---------------------------------------------------------------------------
// Preserved Skills / Tools tabs (Task 9 Part C, AC38) — the preserved
// content from the preservedContent adapter inside the new shell:
// item names/counts match the adapter, and the toggles are local-only.
// ---------------------------------------------------------------------------

describe('CustomizeModal — Skills tab (AC38)', () => {
  it('renders the preserved skills from the adapter — one row per item with name, description, scope, and status', () => {
    renderCustomizeModal({ kind: 'customize', tab: 'skills' })

    const list = screen.getByRole('list', { name: SKILLS_SECTION.listLabel })
    const rows = within(list).getAllByRole('listitem')
    expect(rows).toHaveLength(SKILLS_SECTION.items.length)

    for (const item of SKILLS_SECTION.items) {
      const row = rows.find((row) => row.textContent!.includes(item.name))!
      expect(row.textContent).toContain(item.description)
      expect(row.textContent).toContain(item.scope)
      expect(row.textContent).toContain(item.enabled ? 'Enabled' : 'Disabled')
    }

    // The compact count line mirrors the adapter's enabled count.
    expect(getTabPanel().textContent).toContain(preservedCountLine(SKILLS_SECTION.items))
  })

  it('carries the compact action metadata — header action, title, and the visible illustrative note', () => {
    renderCustomizeModal({ kind: 'customize', tab: 'skills' })

    expect(
      within(getTabPanel()).getByRole('heading', { name: SKILLS_SECTION.title, level: 3 }),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: SKILLS_SECTION.actionLabel })).toBeInTheDocument()
    expect(getTabPanel().textContent).toContain(SKILLS_SECTION.note)
  })

  it('renders one switch per skill with checked state matching the adapter', () => {
    renderCustomizeModal({ kind: 'customize', tab: 'skills' })

    const switches = within(getTabPanel()).getAllByRole('switch')
    expect(switches).toHaveLength(SKILLS_SECTION.items.length)
    for (const item of SKILLS_SECTION.items) {
      expect(screen.getByRole('switch', { name: `Toggle ${item.name}` })).toHaveAttribute(
        'aria-checked',
        String(item.enabled),
      )
    }
  })

  it('toggles are local-only — flipping moves the switch, status, and count, but the committed store never changes', () => {
    const { bucket } = renderCustomizeModal({ kind: 'customize', tab: 'skills' })
    const target = SKILLS_SECTION.items.find((item) => !item.enabled)!
    const control = screen.getByRole('switch', { name: `Toggle ${target.name}` })
    const row = within(screen.getByRole('list', { name: SKILLS_SECTION.listLabel }))
      .getAllByRole('listitem')
      .find((row) => row.textContent!.includes(target.name))!

    expect(row.textContent).toContain('Disabled')
    fireEvent.click(control)

    // The visual state flips in place — switch, status chip, count line.
    expect(control).toHaveAttribute('aria-checked', 'true')
    expect(row.textContent).toContain('Enabled')
    const flipped = SKILLS_SECTION.items.map((item) =>
      item.id === target.id ? { ...item, enabled: !item.enabled } : item,
    )
    expect(getTabPanel().textContent).toContain(preservedCountLine(flipped))

    // Nothing reaches the store — the toggle is mock-only (AC46).
    expect(bucket.current).toEqual({
      ...initialState(),
      overlay: { kind: 'customize', tab: 'skills' },
    })
  })
})

describe('CustomizeModal — Tools tab (AC38)', () => {
  it('renders the preserved tools from the adapter — one row per item with name, description, scope, and status', () => {
    renderCustomizeModal({ kind: 'customize', tab: 'tools' })

    const list = screen.getByRole('list', { name: TOOLS_SECTION.listLabel })
    const rows = within(list).getAllByRole('listitem')
    expect(rows).toHaveLength(TOOLS_SECTION.items.length)

    for (const item of TOOLS_SECTION.items) {
      const row = rows.find((row) => row.textContent!.includes(item.name))!
      expect(row.textContent).toContain(item.description)
      expect(row.textContent).toContain(item.scope)
      expect(row.textContent).toContain(item.enabled ? 'Enabled' : 'Disabled')
    }
    expect(getTabPanel().textContent).toContain(preservedCountLine(TOOLS_SECTION.items))
  })

  it('renders one switch per tool with checked state matching the adapter — flipping stays local', () => {
    const { bucket } = renderCustomizeModal({ kind: 'customize', tab: 'tools' })

    const switches = within(getTabPanel()).getAllByRole('switch')
    expect(switches).toHaveLength(TOOLS_SECTION.items.length)
    for (const item of TOOLS_SECTION.items) {
      expect(screen.getByRole('switch', { name: `Toggle ${item.name}` })).toHaveAttribute(
        'aria-checked',
        String(item.enabled),
      )
    }

    const target = TOOLS_SECTION.items[0]
    fireEvent.click(screen.getByRole('switch', { name: `Toggle ${target.name}` }))
    expect(screen.getByRole('switch', { name: `Toggle ${target.name}` })).toHaveAttribute(
      'aria-checked',
      String(!target.enabled),
    )
    expect(bucket.current).toEqual({
      ...initialState(),
      overlay: { kind: 'customize', tab: 'tools' },
    })
  })
})
