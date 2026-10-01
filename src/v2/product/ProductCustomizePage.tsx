import { useRef, useState } from 'react'
import { useMockup } from '../../state/MockupContext'
import type { ContextSection } from '../../state/mockupReducer'
import ContextPanel from '../../components/customize/ContextPanel'
import CapabilitiesPanel from '../../components/customize/CapabilitiesPanel'
import ConnectionsPanel from '../../components/customize/ConnectionsPanel'
import AgentsPanel from '../../components/customize/AgentsPanel'
import { CUSTOMIZE_SECTIONS, SECTION_LABELS } from './productState'
import {
  ProductDialog,
  ProductEmpty,
  ProductPageHeader,
  ProductStateGate,
} from './ProductPrimitives'
import { RuntimesPanel } from './RuntimePages'

const ACCESS_TABS = [
  'Overview',
  'People & groups',
  'Roles',
  'Resource access',
  'Service accounts',
  'Requests & approvals',
  'Audit',
]
function UnavailableReference({ name }: { name: string }) {
  const [retried, setRetried] = useState(false)
  return (
    <ProductEmpty title={`${name} reference unavailable`}>
      This section remained loading in the live app during inspection. Its
      detail layout has not been verified.
      <button className="kx-button" onClick={() => setRetried(true)}>
        Retry reference
      </button>
      {retried && (
        <span role="status">A populated live reference is still required.</span>
      )}
    </ProductEmpty>
  )
}
function AccessPanel() {
  const [tab, setTab] = useState('Overview')
  return (
    <div className="kx-stack">
      <h2>Access</h2>
      <p>Understand and manage who can do what across this workspace.</p>
      <div className="kx-subtabs" role="tablist" aria-label="Access">
        {ACCESS_TABS.map((t) => (
          <button
            role="tab"
            aria-selected={tab === t}
            key={t}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </div>
      <UnavailableReference name={`Access · ${tab}`} />
    </div>
  )
}
function OperationsPanel() {
  const { state, dispatch } = useMockup()
  const [open, setOpen] = useState(false)
  const [provider, setProvider] = useState('Datadog')
  const [name, setName] = useState('')
  const triggerRef = useRef<HTMLButtonElement>(null)
  return (
    <div className="kx-stack">
      <div className="kx-section-heading">
        <h2>Channels</h2>
        <button
          ref={triggerRef}
          className="kx-button kx-button--primary"
          onClick={() => {
            setName('')
            setOpen(true)
          }}
        >
          Add a channel
        </button>
      </div>
      {state.product.channels.length ? (
        <div className="kx-list">
          {state.product.channels.map((c) => (
            <article key={c.id} className="kx-list-row">
              <div>
                <strong>{c.name}</strong>
                <span>
                  {c.provider} · {c.enabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>
              <button
                className="kx-button"
                onClick={() =>
                  dispatch({
                    type: 'PRODUCT',
                    action: { kind: 'toggle-channel', id: c.id },
                  })
                }
              >
                {c.enabled ? 'Disable' : 'Enable'}
              </button>
            </article>
          ))}
        </div>
      ) : (
        <p>
          No telemetry sends here yet. Add a channel and paste its setup into
          your provider.
        </p>
      )}
      <section className="kx-card">
        <h2>Ops Profiles</h2>
        <p>
          This profile can open incidents and wake the agent on your behalf. It
          can never approve a change.
        </p>
        <p>
          A profile is set up on the System it watches, from that System’s own
          screen.
        </p>
        <button
          className="kx-button"
          onClick={() =>
            dispatch({ type: 'NAVIGATE_PRODUCT', route: 'systems' })
          }
        >
          View systems
        </button>
      </section>
      {open && (
        <ProductDialog
          title="Add a channel"
          triggerRef={triggerRef}
          onClose={() => setOpen(false)}
          footer={
            <>
              <button className="kx-button" onClick={() => setOpen(false)}>
                Cancel
              </button>
              <button
                form="create-channel"
                className="kx-button kx-button--primary"
              >
                Create the channel
              </button>
            </>
          }
        >
          <form
            id="create-channel"
            className="kx-stack"
            onSubmit={(e) => {
              e.preventDefault()
              if (!name.trim()) return
              dispatch({
                type: 'PRODUCT',
                action: { kind: 'create-channel', name, provider },
              })
              setOpen(false)
            }}
          >
            <label className="kx-field">
              Where the alerts come from
              <select
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
              >
                {[
                  'Datadog',
                  'PostHog',
                  'Loki via Alertmanager',
                  'Loki via Grafana alerting',
                  'Anything else',
                ].map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </select>
            </label>
            <label className="kx-field">
              Name
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </label>
            <p>
              The prototype records channel configuration locally.
              Provider-specific secrets and webhooks need a populated live
              reference.
            </p>
          </form>
        </ProductDialog>
      )}
    </div>
  )
}
export default function ProductCustomizePage() {
  const { state, dispatch } = useMockup()
  const section = state.product.customizeSection
  const [contextTab, setContextTab] = useState<ContextSection>('files')
  const [showExistingAgents, setShowExistingAgents] = useState(false)
  const select = (customizeSection: typeof section) =>
    dispatch({
      type: 'NAVIGATE_PRODUCT',
      route: 'customize-page',
      customizeSection,
    })
  return (
    <>
      <ProductPageHeader
        title="Customize"
        description="Make Konteks work the way your team does."
        onBack={() =>
          dispatch({ type: 'NAVIGATE_PRODUCT', route: 'activities' })
        }
        backLabel="Back to Activities"
      />
      <div className="kx-product-settings-layout">
        <nav aria-label="Customize" className="kx-product-section-nav">
          {CUSTOMIZE_SECTIONS.map((s) => (
            <button
              key={s}
              aria-current={section === s ? 'page' : undefined}
              onClick={() => select(s)}
            >
              {SECTION_LABELS[s]}
            </button>
          ))}
        </nav>
        <section
          className="kx-product-panel"
          aria-label={SECTION_LABELS[section]}
        >
          <ProductStateGate
            key={section}
            empty={
              <ProductEmpty title="No configuration yet">
                Choose a section to start configuring your workspace.
              </ProductEmpty>
            }
          >
            {section === 'runtimes' ? (
              <RuntimesPanel />
            ) : section === 'access' ? (
              <AccessPanel />
            ) : section === 'models' ? (
              <>
                <UnavailableReference name="Models" />
                <button
                  className="kx-button"
                  aria-expanded={showExistingAgents}
                  onClick={() => setShowExistingAgents(!showExistingAgents)}
                >
                  Existing proposed agent profiles
                </button>
                {showExistingAgents && <AgentsPanel />}
              </>
            ) : section === 'context' ? (
              <>
                <h2>Context</h2>
                <ContextPanel subtab={contextTab} onSelect={setContextTab} />
              </>
            ) : section === 'skills' || section === 'tools' ? (
              <>
                <h2>{SECTION_LABELS[section]}</h2>
                {section === 'skills' && (
                  <p className="kx-product-reference-note">
                    Live Skills did not load. These are the existing proposed
                    skill components.
                  </p>
                )}
                <CapabilitiesPanel
                  key={section}
                  subtab={section}
                  onSelect={(s) => select(s === 'mcp' ? 'mcps' : s)}
                  showTabs={false}
                  selectedId={state.product.selectedId || null}
                  onSelectedChange={(id) =>
                    dispatch({
                      type: 'NAVIGATE_PRODUCT',
                      route: 'customize-page',
                      customizeSection: section,
                      id: id ?? '',
                    })
                  }
                />
              </>
            ) : section === 'mcps' ||
              section === 'vcs' ||
              section === 'connectors' ? (
              <>
                <h2>
                  {section === 'mcps' ? 'MCP servers' : SECTION_LABELS[section]}
                </h2>
                <ConnectionsPanel
                  key={section}
                  subtab={
                    section === 'mcps'
                      ? 'mcp'
                      : section === 'vcs'
                        ? 'vcs'
                        : 'search'
                  }
                  onSelect={(s) =>
                    select(
                      s === 'mcp' ? 'mcps' : s === 'vcs' ? 'vcs' : 'connectors',
                    )
                  }
                  showTabs={false}
                />
              </>
            ) : (
              <OperationsPanel />
            )}
          </ProductStateGate>
        </section>
      </div>
    </>
  )
}
