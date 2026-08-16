/*
 * AgentsTab — the Customize → Agents tab content (Task 9 Part B,
 * spec §11, AC36).
 *
 * The exact hierarchy: a prominent `Create profile` action (a compact
 * local creation hint/form toggles in place — no persistence, this is
 * a mockup), the `Active Profiles` semantic table driven by
 * EXECUTION_PROFILES, a compact `Review setup` sticker (an inline
 * card, not a large panel), and progressive disclosure — five
 * details/summary regions that collectively expose and label the AI
 * role, provider, profile, archived, and permission content with the
 * current illustrative values from mockData (AC46). Closed by default
 * so the tab stays compact inside the 790×580 frame.
 */
import { useId, useState } from 'react'
import {
  AGENT_ROLES,
  AI_PROVIDERS,
  ARCHIVED_AGENTS,
  EXECUTION_PROFILES,
} from '../../data/mockData'
import { useMockup } from '../../state/MockupContext'

const READINESS_LABELS = { ready: 'Ready', 'needs-setup': 'Needs setup' } as const

export default function AgentsTab() {
  const { state } = useMockup()
  const [createOpen, setCreateOpen] = useState(false)
  const nameInputId = useId()

  const activeProfile =
    EXECUTION_PROFILES.find((profile) => profile.id === state.activeProfileId) ??
    EXECUTION_PROFILES[0]
  const needsSetup = EXECUTION_PROFILES.filter((profile) => profile.readiness === 'needs-setup')

  return (
    <section className="kx-customize-tab kx-customize-tab--agents">
      {/* Prominent Create profile action — toggles the compact local
          creation form below it (mock interaction, no persistence). */}
      <header className="kx-customize-tab__bar">
        <h3 className="kx-customize-tab__title">Agents</h3>
        <button
          type="button"
          className="kx-btn kx-btn--primary kx-agents__create-btn"
          aria-expanded={createOpen}
          aria-controls="kx-agents-create"
          onClick={() => setCreateOpen((open) => !open)}
        >
          Create profile
        </button>
      </header>

      {createOpen && (
        <div id="kx-agents-create" className="kx-agents__create">
          <label className="kx-agents__create-label" htmlFor={nameInputId}>
            Profile name
          </label>
          <input
            id={nameInputId}
            type="text"
            className="kx-input kx-agents__create-input"
            placeholder="e.g. Payments Platform"
          />
          <p className="kx-agents__create-hint">
            Illustrative form — new profiles are not stored in this mockup.
          </p>
        </div>
      )}

      {/* Active Profiles — the semantic table driven by EXECUTION_PROFILES. */}
      <table className="kx-customize-tab__table kx-agents__table" aria-label="Active Profiles">
        <thead>
          <tr>
            <th scope="col">Profile</th>
            <th scope="col">Planner</th>
            <th scope="col">Executor</th>
            <th scope="col">Readiness</th>
          </tr>
        </thead>
        <tbody>
          {EXECUTION_PROFILES.map((profile) => (
            <tr key={profile.id}>
              <th scope="row">{profile.name}</th>
              <td>{profile.plannerModel}</td>
              <td>{profile.executorModel}</td>
              <td>
                <span
                  className={
                    profile.readiness === 'ready'
                      ? 'kx-integrations__status kx-integrations__status--connected'
                      : 'kx-integrations__status kx-integrations__status--setup'
                  }
                >
                  {READINESS_LABELS[profile.readiness]}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Compact Review setup sticker — one inline card, not a panel. */}
      <aside className="kx-agents__review" aria-label="Review setup">
        <p className="kx-agents__review-title">Review setup</p>
        <p className="kx-agents__review-text">
          {needsSetup.length} of {EXECUTION_PROFILES.length} profiles need setup
          {needsSetup.length > 0 ? ` — ${needsSetup.map((p) => p.name).join(', ')}` : ''}.
        </p>
      </aside>

      {/* Progressive disclosure — five details regions that together
          expose the AI role / provider / profile / archived / permission
          content (AC36). */}
      <details className="kx-agents__disclosure">
        <summary>AI roles</summary>
        <div className="kx-agents__disclosure-body">
          <dl className="kx-agents__facts">
            {AGENT_ROLES.map((entry) => (
              <div key={entry.id} className="kx-agents__fact">
                <dt className="kx-agents__fact-term">{entry.role}</dt>
                <dd className="kx-agents__fact-value">
                  {entry.currentModel} · {entry.description}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </details>

      <details className="kx-agents__disclosure">
        <summary>Providers</summary>
        <div className="kx-agents__disclosure-body">
          <dl className="kx-agents__facts">
            {AI_PROVIDERS.map((provider) => (
              <div key={provider.id} className="kx-agents__fact">
                <dt className="kx-agents__fact-term">{provider.name}</dt>
                <dd className="kx-agents__fact-value">
                  {provider.models} ·{' '}
                  {provider.status === 'connected' ? 'Connected' : 'Needs setup'}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </details>

      <details className="kx-agents__disclosure">
        <summary>Profile assignments</summary>
        <div className="kx-agents__disclosure-body">
          <dl className="kx-agents__facts">
            <div className="kx-agents__fact">
              <dt className="kx-agents__fact-term">Active profile</dt>
              <dd className="kx-agents__fact-value">{activeProfile.name}</dd>
            </div>
            <div className="kx-agents__fact">
              <dt className="kx-agents__fact-term">Workspace default</dt>
              <dd className="kx-agents__fact-value">{EXECUTION_PROFILES[0].name}</dd>
            </div>
            <div className="kx-agents__fact">
              <dt className="kx-agents__fact-term">Fallback behavior</dt>
              <dd className="kx-agents__fact-value">
                Sessions without an explicit profile use {EXECUTION_PROFILES[0].name}.
              </dd>
            </div>
          </dl>
        </div>
      </details>

      <details className="kx-agents__disclosure">
        <summary>Archived agents</summary>
        <div className="kx-agents__disclosure-body">
          <ul className="kx-agents__archived-list">
            {ARCHIVED_AGENTS.map((entry) => (
              <li key={entry.id} className="kx-agents__archived-item">
                <span className="kx-agents__archived-name">{entry.name}</span>
                <span className="kx-agents__archived-on">Archived {entry.archivedOn}</span>
              </li>
            ))}
          </ul>
        </div>
      </details>

      <details className="kx-agents__disclosure">
        <summary>Permissions</summary>
        <div className="kx-agents__disclosure-body">
          <dl className="kx-agents__facts">
            {EXECUTION_PROFILES.map((profile) => (
              <div key={profile.id} className="kx-agents__fact">
                <dt className="kx-agents__fact-term">{profile.name}</dt>
                <dd className="kx-agents__fact-value">{profile.authorization}</dd>
              </div>
            ))}
          </dl>
        </div>
      </details>
    </section>
  )
}
