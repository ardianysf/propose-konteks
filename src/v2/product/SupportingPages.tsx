import { useRef, useState } from 'react'
import { useMockup } from '../../state/MockupContext'
import CodeBlock from '../../components/technical/CodeBlock'
import {
  ProductDialog,
  ProductEmpty,
  ProductPageHeader,
  ProductRow,
  ProductStateGate,
} from './ProductPrimitives'

export function SystemsPage() {
  const { state, dispatch } = useMockup()
  const [create, setCreate] = useState(false)
  const [mode, setMode] = useState<'discover' | 'scratch' | 'empty'>('scratch')
  const triggerRef = useRef<HTMLButtonElement>(null)
  const selected = state.systems.find((s) => s.id === state.product.selectedId)
  if (state.product.selectedId && !selected)
    return (
      <>
        <ProductPageHeader
          title="System not found"
          onBack={() =>
            dispatch({ type: 'NAVIGATE_PRODUCT', route: 'systems' })
          }
        />
        <ProductEmpty title="This System is unavailable">
          Choose a Software System from the list. Prototype-created Systems
          reset on reload.
        </ProductEmpty>
      </>
    )
  return (
    <>
      <ProductPageHeader
        title={selected?.name ?? 'Software Systems'}
        description={
          selected?.description ??
          'One product your team owns, with its parts and repositories.'
        }
        onBack={() =>
          dispatch({
            type: 'NAVIGATE_PRODUCT',
            route: selected ? 'systems' : 'work',
          })
        }
        backLabel={selected ? 'Back to Systems' : 'Back to Work In Progress'}
        actions={
          <button
            ref={triggerRef}
            className="kx-button kx-button--primary"
            onClick={() => setCreate(true)}
          >
            New System
          </button>
        }
      />
      <div className="kx-product-body">
        <ProductStateGate
          empty={
            <ProductEmpty title="No systems yet">
              Create a Software System to group your repositories.
            </ProductEmpty>
          }
        >
          {selected ? (
            <section className="kx-card">
              <h2>System context</h2>
              <p>{selected.repoIds.length} repositories</p>
              <div className="kx-product-note__actions">
                <button
                  className="kx-button"
                  onClick={() => {
                    dispatch({
                      type: 'SET_ACTIVE_SYSTEM',
                      systemId: selected.id,
                    })
                    dispatch({
                      type: 'OPEN_OVERLAY',
                      overlay: { kind: 'system-map', systemId: selected.id },
                    })
                  }}
                >
                  System map
                </button>
                <button
                  className="kx-button"
                  onClick={() => {
                    dispatch({
                      type: 'SET_ACTIVE_SYSTEM',
                      systemId: selected.id,
                    })
                    dispatch({
                      type: 'OPEN_OVERLAY',
                      overlay: { kind: 'repository-modal' },
                    })
                  }}
                >
                  Select repositories
                </button>
                <button
                  className="kx-button"
                  onClick={() => {
                    dispatch({
                      type: 'SET_ACTIVE_SYSTEM',
                      systemId: selected.id,
                    })
                    dispatch({ type: 'NAVIGATE', route: 'new-session' })
                  }}
                >
                  New session
                </button>
              </div>
              <p className="kx-product-reference-note">
                Existing proposed system components are retained. Live Ops
                Profile details were not exposed in the inspected navigation.
              </p>
            </section>
          ) : (
            <div className="kx-list">
              {state.systems.map((s) => (
                <ProductRow
                  key={s.id}
                  title={s.name}
                  description={s.description}
                  meta={`${s.repoIds.length} repositories`}
                  onClick={() =>
                    dispatch({
                      type: 'NAVIGATE_PRODUCT',
                      route: 'systems',
                      id: s.id,
                    })
                  }
                />
              ))}
            </div>
          )}
        </ProductStateGate>
      </div>
      {create && (
        <ProductDialog
          title="Create System"
          onClose={() => setCreate(false)}
          triggerRef={triggerRef}
          footer={
            <>
              <button className="kx-button" onClick={() => setCreate(false)}>
                Cancel
              </button>
              <button
                className="kx-button kx-button--primary"
                onClick={() => {
                  setCreate(false)
                  if (mode === 'empty')
                    dispatch({
                      type: 'OPEN_OVERLAY',
                      overlay: { kind: 'create-system-modal' },
                    })
                  else {
                    dispatch({ type: 'SET_MODE', mode: 'planning' })
                    dispatch({ type: 'NAVIGATE', route: 'new-session' })
                  }
                }}
              >
                {mode === 'empty' ? 'Continue to form' : 'Start'}
              </button>
            </>
          }
        >
          <p>
            One product your team owns. Like Checkout or Payments. It holds the
            product’s parts and repositories.
          </p>
          <fieldset className="kx-product-fieldset">
            <legend>How do you want to start?</legend>
            {(
              [
                {
                  value: 'discover',
                  title: 'Discover what we already have',
                  help: 'Scan one connection. The agent proposes Systems and you accept each one.',
                },
                {
                  value: 'scratch',
                  title: 'Start from nothing',
                  help: 'The agent proposes a System and its repositories. You approve before anything is created.',
                },
                {
                  value: 'empty',
                  title: 'Create an empty System',
                  help: 'Just a name. Add Components later.',
                },
              ] as const
            ).map((m) => (
              <label key={m.value}>
                <input
                  type="radio"
                  name="system-start"
                  checked={mode === m.value}
                  onChange={() => setMode(m.value)}
                />
                <span>
                  <strong>{m.title}</strong>
                  <small>{m.help}</small>
                </span>
              </label>
            ))}
          </fieldset>
        </ProductDialog>
      )}
    </>
  )
}
export function WorkLocallyPage() {
  const { state, dispatch } = useMockup()
  const [expiry, setExpiry] = useState('90 days')
  const [setup, setSetup] = useState(false)
  const [copied, setCopied] = useState(false)
  const sample =
    '{\n  "mcpServers": {\n    "konteks-demo": {\n      "url": "https://example.invalid/mcp",\n      "headers": { "Authorization": "Bearer DEMO-ONLY" }\n    }\n  }\n}'
  return (
    <>
      <ProductPageHeader
        title="Work Locally"
        description="Connect your local AI agent using the MCP protocol."
        onBack={() =>
          dispatch({ type: 'NAVIGATE_PRODUCT', route: 'activities' })
        }
        backLabel="Back to Activities"
        actions={
          <button
            className="kx-button"
            onClick={() =>
              dispatch({
                type: 'NAVIGATE_PRODUCT',
                route: 'customize-page',
                customizeSection: 'mcps',
              })
            }
          >
            View connections
          </button>
        }
      />
      <div className="kx-product-body">
        <ProductStateGate
          empty={
            <ProductEmpty title="No credentials yet">
              Generate a demo credential to preview setup.
            </ProductEmpty>
          }
        >
          <section className="kx-card">
            <h2>Your Credentials</h2>
            <div className="kx-list">
              {state.product.credentials.map((c) => (
                <article key={c.id} className="kx-list-row">
                  <div>
                    <strong>{c.name}</strong>
                    <span>
                      {c.id} · Platform MCP Access · {c.expiry}
                    </span>
                  </div>
                  <span className="kx-status">{c.status}</span>
                  <div className="kx-row-actions">
                    <button
                      className="kx-button kx-button--small"
                      disabled={c.status === 'Revoked'}
                      onClick={() => {
                        dispatch({
                          type: 'PRODUCT',
                          action: {
                            kind: 'credential-status',
                            id: c.id,
                            status: 'Revoked',
                          },
                        })
                        dispatch({
                          type: 'PRODUCT',
                          action: {
                            kind: 'create-credential',
                            expiry: c.expiry,
                          },
                        })
                        setSetup(true)
                      }}
                    >
                      Rotate Token
                    </button>
                    <button
                      className="kx-button kx-button--small"
                      onClick={() =>
                        dispatch({
                          type: 'PRODUCT',
                          action: {
                            kind: 'credential-status',
                            id: c.id,
                            status:
                              c.status === 'Active' ? 'Revoked' : 'Active',
                          },
                        })
                      }
                    >
                      {c.status === 'Active' ? 'Revoke Token' : 'Restore Token'}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </ProductStateGate>
        <form
          className="kx-card kx-stack"
          onSubmit={(e) => {
            e.preventDefault()
            dispatch({
              type: 'PRODUCT',
              action: { kind: 'create-credential', expiry },
            })
            setSetup(true)
          }}
        >
          <h2>Generate Credential</h2>
          <p>
            Platform MCP Access · Demo credentials are inert and only stored in
            memory.
          </p>
          <label className="kx-field">
            Expiry
            <select value={expiry} onChange={(e) => setExpiry(e.target.value)}>
              {['Platform default', '30 days', '90 days', '365 days'].map(
                (e) => (
                  <option key={e}>{e}</option>
                ),
              )}
            </select>
          </label>
          <button className="kx-button kx-button--primary">
            Generate Credential
          </button>
        </form>
        {setup && (
          <section className="kx-card kx-stack" aria-label="Demo setup">
            <h2>Setup instructions</h2>
            <p>
              Illustrative configuration · replace with actual connection
              details in a real integration.
            </p>
            <CodeBlock code={sample} meta="json" />
            <button
              className="kx-button"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(sample)
                  setCopied(true)
                } catch {
                  setCopied(false)
                }
              }}
            >
              {copied ? 'Copied' : 'Copy configuration'}
            </button>
          </section>
        )}
      </div>
    </>
  )
}
export function SupportPage() {
  const { dispatch } = useMockup()
  return (
    <>
      <ProductPageHeader
        title="Support"
        description="Explore the prototype and its design system."
        onBack={() =>
          dispatch({ type: 'NAVIGATE_PRODUCT', route: 'activities' })
        }
      />
      <div className="kx-product-body">
        <section className="kx-card kx-stack">
          <h2>Getting started</h2>
          <p>
            Create an initiative, choose a Software System, and add notes to its
            plan. Connect a runtime to explore local sessions.
          </p>
          <div className="kx-product-note__actions">
            <button
              className="kx-button"
              onClick={() =>
                dispatch({ type: 'NAVIGATE_PRODUCT', route: 'work' })
              }
            >
              View Work In Progress
            </button>
            <button
              className="kx-button"
              onClick={() =>
                dispatch({
                  type: 'NAVIGATE_PRODUCT',
                  route: 'customize-page',
                  customizeSection: 'runtimes',
                })
              }
            >
              Connect a runtime
            </button>
            <a className="kx-button" href="/catalog">
              Component catalog
            </a>
          </div>
          <p className="kx-product-reference-note">
            The live external support destination was not inspected. This page
            provides prototype guidance.
          </p>
        </section>
      </div>
    </>
  )
}
