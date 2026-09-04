/*
 * ExecutionProfileMenu — the Execution Profile anchored menu (Task 6,
 * spec §7.3, AC22–AC24).
 *
 * An anchored .kx-menu that floats from the toolbar's profile control:
 * no modal backdrop, no header — a flat profile list where the active
 * profile carries a check and aria-current (AC22). Hovering or keyboard-
 * focusing a row reveals the sidecar beside the menu listing that
 * profile's Planner model, Executor model, authorization, and readiness
 * (AC23). Assistant and Search are workspace-level, so they render under
 * a visually separated "Workspace settings" divider + label, outside the
 * profile list (AC24). "Manage / Customize Profile" swaps this menu for
 * the Customize overlay on the Agents tab (modal UI itself is Task 9).
 * Escape closes through the shared OverlayLifecycle listener (AC45).
 */
import { useState } from 'react'
import { EXECUTION_PROFILES, WORKSPACE_SETTINGS } from '../../data/mockData'
import type { ExecutionProfile, Readiness } from '../../data/mockData'
import { useMockup } from '../../state/MockupContext'
import { useOverlayLifecycle } from '../shell/OverlayLifecycle'
import './ExecutionProfileMenu.css'

const READINESS_LABELS: Record<Readiness, string> = {
  ready: 'Ready',
  'needs-setup': 'Needs setup',
}

/** Check — marks the active profile row (AC22). */
function CheckIcon() {
  return (
    <svg data-icon="check" viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" focusable="false">
      <path
        d="M3 8.5 6.5 12 13 4.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/** Sliders/tune glyph — marks the Manage / Customize Profile entry. */
function TuneIcon() {
  return (
    <svg data-icon="tune" viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" focusable="false">
      <path
        d="M2 4.5h12M2 11.5h12"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <circle cx="6" cy="4.5" r="2" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="10" cy="11.5" r="2" fill="none" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  )
}

export default function ExecutionProfileMenu() {
  const { state, dispatch } = useMockup()
  const { dismissOverlay } = useOverlayLifecycle()
  const [previewedId, setPreviewedId] = useState<string | null>(null)

  const activeProfile: ExecutionProfile =
    EXECUTION_PROFILES.find((profile) => profile.id === state.activeProfileId) ??
    EXECUTION_PROFILES[0]
  // The sidecar previews the hovered/focused row and falls back to the
  // active profile, so it always shows exactly one profile (AC23).
  const shown =
    EXECUTION_PROFILES.find((profile) => profile.id === previewedId) ?? activeProfile

  return (
    <div className="kx-profile-menu-cluster">
      <div
        role="menu"
        aria-label="Execution Profile"
        data-testid="execution-profile-menu"
        className="kx-menu kx-profile-menu"
      >
        {/* Flat profile list (AC22) — the only region that scrolls. */}
        <div className="kx-profile-menu__list">
          {EXECUTION_PROFILES.map((profile) => {
            const active = profile.id === state.activeProfileId
            return (
              <button
                key={profile.id}
                type="button"
                role="menuitem"
                className={
                  active
                    ? 'kx-profile-menu__item kx-profile-menu__item--active'
                    : 'kx-profile-menu__item'
                }
                aria-current={active ? 'true' : undefined}
                onMouseEnter={() => setPreviewedId(profile.id)}
                onMouseLeave={() => setPreviewedId(null)}
                onFocus={() => setPreviewedId(profile.id)}
                onBlur={() => setPreviewedId(null)}
                onClick={() => {
                  dispatch({ type: 'SET_ACTIVE_PROFILE', profileId: profile.id })
                  dismissOverlay()
                }}
              >
                <span className="kx-profile-menu__item-copy">
                  <span className="kx-profile-menu__item-name">{profile.name}</span>
                  <span className="kx-profile-menu__item-meta">
                    {profile.plannerModel} · {profile.executorModel}
                  </span>
                </span>
                {active && (
                  <span className="kx-profile-menu__check" aria-hidden="true">
                    <CheckIcon />
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* Manage entry — swaps this menu for Customize on Agents (AC22);
            the modal frame itself arrives in Task 9. */}
        <div className="kx-profile-menu__footer">
          <button
            type="button"
            role="menuitem"
            className="kx-profile-menu__manage"
            onClick={() =>
              dispatch({ type: 'OPEN_OVERLAY', overlay: { kind: 'customize', destination: { section: 'agents' } } })
            }
          >
            <TuneIcon />
            <span className="kx-profile-menu__manage-label">Manage / Customize Profile</span>
          </button>
        </div>

        {/* Workspace-level entries — visually separated from the profile
            list by a divider + label (AC24). */}
        <div className="kx-profile-menu__workspace">
          <p className="kx-profile-menu__section-label">Workspace settings</p>
          {WORKSPACE_SETTINGS.map((setting) => (
            <div key={setting.id} className="kx-profile-menu__setting">
              <span
                className={
                  setting.enabled
                    ? 'kx-profile-menu__setting-dot'
                    : 'kx-profile-menu__setting-dot kx-profile-menu__setting-dot--off'
                }
                aria-hidden="true"
              />
              <span className="kx-profile-menu__setting-copy">
                <span className="kx-profile-menu__setting-name">{setting.name}</span>
                <span className="kx-profile-menu__setting-desc">{setting.description}</span>
              </span>
              <span className="kx-profile-menu__setting-state">
                {setting.enabled ? 'On' : 'Off'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Hover/focus sidecar (AC23) — beside the flat menu, inside the
          anchored cluster. */}
      <aside
        className="kx-profile-menu__sidecar"
        data-testid="execution-profile-sidecar"
        aria-live="polite"
      >
        <p className="kx-profile-menu__sidecar-title">{shown.name}</p>
        <dl className="kx-profile-menu__sidecar-facts">
          <div className="kx-profile-menu__sidecar-fact">
            <dt className="kx-profile-menu__sidecar-term">Planner model</dt>
            <dd className="kx-profile-menu__sidecar-value">{shown.plannerModel}</dd>
          </div>
          <div className="kx-profile-menu__sidecar-fact">
            <dt className="kx-profile-menu__sidecar-term">Executor model</dt>
            <dd className="kx-profile-menu__sidecar-value">{shown.executorModel}</dd>
          </div>
          <div className="kx-profile-menu__sidecar-fact">
            <dt className="kx-profile-menu__sidecar-term">Authorization</dt>
            <dd className="kx-profile-menu__sidecar-value">{shown.authorization}</dd>
          </div>
          <div className="kx-profile-menu__sidecar-fact">
            <dt className="kx-profile-menu__sidecar-term">Readiness</dt>
            <dd
              className={
                shown.readiness === 'ready'
                  ? 'kx-profile-menu__sidecar-value kx-profile-menu__readiness--ready'
                  : 'kx-profile-menu__sidecar-value kx-profile-menu__readiness--setup'
              }
            >
              {READINESS_LABELS[shown.readiness]}
            </dd>
          </div>
        </dl>
      </aside>
    </div>
  )
}
