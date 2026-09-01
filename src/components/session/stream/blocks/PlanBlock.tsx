/*
 * PlanBlock — kind 4 (PLAN).
 * Numbered steps: verb + target (mono for paths/docs) + executing agent +
 * estimate + optional risk flag; footer totals the estimate. Pending
 * state shows the primary "Approve plan" action and a ghost "Request
 * changes"; approval flips the header chip to APPROVED. Each step row
 * carries a small kebab affordance (demo menu, keyboard reachable).
 */
import { useState } from 'react'
import ResponseBlock, { KebabIcon, PlanIcon, StreamChip } from '../ResponseBlock'
import type { PlanBlockData } from '../sessionStreamTypes'

interface PlanBlockProps {
  data: PlanBlockData
  approved: boolean
  onApprove: () => void
  onRequestChanges: () => void
  actor?: string
  time?: string
}

export default function PlanBlock({
  data,
  approved,
  onApprove,
  onRequestChanges,
  actor = 'Konteks Engineering Agent',
  time = '09:12',
}: PlanBlockProps) {
  const [openMenuStep, setOpenMenuStep] = useState<string | null>(null)

  return (
    <ResponseBlock
      kindLabel="PLAN"
      tone={approved ? 'accent' : 'neutral'}
      icon={<PlanIcon />}
      actor={actor}
      time={time}
      stateChip={
        approved ? (
          <StreamChip tone="accent">approved</StreamChip>
        ) : (
          <StreamChip tone="attention">pending approval</StreamChip>
        )
      }
    >
      <div className="kx-stream-plan">
        <ol className="kx-stream-plan__steps">
          {data.steps.map((step, index) => {
            const menuOpen = openMenuStep === step.id
            return (
              <li key={step.id} className="kx-stream-plan__step">
                <span className="kx-stream-plan__num kx-stream-tabular">{index + 1}</span>
                <div className="kx-stream-plan__step-main">
                  <p className="kx-stream-plan__line">
                    <span className="kx-stream-plan__verb">{step.verb}</span>{' '}
                    <span className={step.targetMono ? 'kx-stream-mono' : undefined}>
                      {step.target}
                    </span>
                  </p>
                  <p className="kx-stream-plan__meta">
                    {step.agent} · est. {step.estimate}
                    {step.risk ? (
                      <>
                        {' · '}
                        <span className="kx-stream-plan__risk">risk: {step.risk}</span>
                      </>
                    ) : null}
                  </p>
                </div>
                <button
                  type="button"
                  className="kx-stream-plan__step-menu-btn"
                  aria-label={`Step ${index + 1} options`}
                  aria-haspopup="menu"
                  aria-expanded={menuOpen}
                  onClick={() => setOpenMenuStep(menuOpen ? null : step.id)}
                >
                  <KebabIcon />
                </button>
                {menuOpen && (
                  <div
                    className="kx-stream-plan__step-menu"
                    role="menu"
                    aria-label={`Step ${index + 1} options`}
                    onKeyDown={(event) => {
                      if (event.key === 'Escape') setOpenMenuStep(null)
                    }}
                  >
                    <button type="button" role="menuitem" onClick={() => setOpenMenuStep(null)}>
                      Edit step
                    </button>
                    <button type="button" role="menuitem" onClick={() => setOpenMenuStep(null)}>
                      Re-estimate
                    </button>
                  </div>
                )}
              </li>
            )
          })}
        </ol>
        <footer className="kx-stream-plan__footer">
          <p className="kx-stream-plan__total">
            Total estimate <span className="kx-stream-tabular">{data.totalEstimate}</span>
          </p>
          {approved ? (
            <p className="kx-stream-plan__approved-note">Plan approved — execution proceeds.</p>
          ) : (
            <div className="kx-stream-plan__actions">
              <button
                type="button"
                className="kx-stream-btn kx-stream-btn--primary"
                onClick={onApprove}
              >
                Approve plan
              </button>
              <button
                type="button"
                className="kx-stream-btn kx-stream-btn--ghost"
                onClick={onRequestChanges}
              >
                Request changes
              </button>
            </div>
          )}
        </footer>
      </div>
    </ResponseBlock>
  )
}
