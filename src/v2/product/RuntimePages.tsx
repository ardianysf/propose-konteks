import { Laptop, Plus } from 'lucide-react'
import { useRef, useState, type RefObject } from 'react'
import { useMockup } from '../../state/MockupContext'
import StatusBadge from '../../components/technical/StatusBadge'
import CodeBlock from '../../components/technical/CodeBlock'
import { WORKLOADS, type Runtime } from './productState'
import {
  ProductDialog,
  ProductEmpty,
  ProductPageHeader,
  ProductRow,
  ProductStateGate,
} from './ProductPrimitives'

export function RuntimeConnectButton({ small = false }: { small?: boolean }) {
  const { dispatch } = useMockup()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [platform, setPlatform] = useState<Runtime['platform']>('macOS')
  const [workloads, setWorkloads] = useState<string[]>(
    WORKLOADS.filter((w) => w !== 'Operations'),
  )
  const [step, setStep] = useState<'form' | 'command'>('form')
  const [copied, setCopied] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const command =
    '# Illustrative setup — no service is contacted\nkonteks-remote connect --code DEMO-ONLY'
  const close = () => setOpen(false)
  return (
    <>
      <button
        ref={triggerRef}
        className={
          small
            ? 'kx-v2-menuitem kx-product-connect-runtime'
            : 'kx-button kx-button--primary'
        }
        aria-label="Connect a runtime"
        title="Connect a runtime"
        onClick={() => {
          setName('')
          setStep('form')
          setCopied(false)
          setOpen(true)
        }}
      >
        <Plus size={14} />
        <span>{small ? 'Add new runtime' : 'Connect a runtime'}</span>
      </button>
      {open && (
        <ProductDialog
          title="Connect a runtime"
          onClose={close}
          triggerRef={triggerRef}
          footer={
            <>
              <button className="kx-button" onClick={close}>
                Cancel
              </button>
              {step === 'form' ? (
                <button
                  form="connect-runtime"
                  type="submit"
                  className="kx-button kx-button--primary"
                  disabled={!name.trim() || workloads.length === 0}
                >
                  Get the command
                </button>
              ) : (
                <button
                  className="kx-button kx-button--primary"
                  onClick={() => {
                    dispatch({
                      type: 'PRODUCT',
                      action: {
                        kind: 'create-runtime',
                        name,
                        platform,
                        workloads,
                      },
                    })
                    close()
                  }}
                >
                  Finish setup
                </button>
              )}
            </>
          }
        >
          {step === 'form' ? (
            <form
              id="connect-runtime"
              className="kx-stack"
              onSubmit={(e) => {
                e.preventDefault()
                if (name.trim() && workloads.length) setStep('command')
              }}
            >
              <p>
                Your machines run the agents. Konteks never holds a provider key
                or account.
              </p>
              <label className="kx-field">
                Name
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Studio Mac"
                />
              </label>
              <label className="kx-field">
                Platform
                <select
                  value={platform}
                  onChange={(e) =>
                    setPlatform(e.target.value as Runtime['platform'])
                  }
                >
                  {['macOS', 'Linux', 'Windows'].map((p) => (
                    <option key={p}>{p}</option>
                  ))}
                </select>
              </label>
              <fieldset className="kx-product-fieldset">
                <legend>Workloads</legend>
                <p>What this computer may work on. You can change it later.</p>
                {WORKLOADS.map((w) => (
                  <label key={w}>
                    <input
                      type="checkbox"
                      checked={workloads.includes(w)}
                      onChange={() =>
                        setWorkloads((prev) =>
                          prev.includes(w)
                            ? prev.filter((x) => x !== w)
                            : [...prev, w],
                        )
                      }
                    />
                    {w}
                  </label>
                ))}
              </fieldset>
              {!workloads.length && (
                <p role="alert">Choose at least one workload.</p>
              )}
            </form>
          ) : (
            <div className="kx-stack">
              <h3>Connect {name}</h3>
              <p>
                This demo command illustrates the setup. Finish setup adds a
                waiting runtime to the prototype.
              </p>
              <CodeBlock meta="shell" code={command} />
              <button
                className="kx-button"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(command)
                    setCopied(true)
                  } catch {
                    setCopied(false)
                  }
                }}
              >
                {copied ? 'Copied' : 'Copy command'}
              </button>
            </div>
          )}
        </ProductDialog>
      )}
    </>
  )
}
export function RuntimesPanel() {
  const { state, dispatch } = useMockup()
  return (
    <div className="kx-stack">
      <div className="kx-section-heading">
        <div>
          <h2>Connected runtimes</h2>
          <p>
            Your machines run the agents. Konteks never holds a provider key or
            account.
          </p>
        </div>
        <RuntimeConnectButton />
      </div>
      <div className="kx-list">
        {state.product.runtimes.map((r) => (
          <ProductRow
            key={r.id}
            title={r.name}
            description={`${r.platform} · ${r.owner} · ${r.workloads.join(', ')}`}
            meta={
              r.status === 'Ready'
                ? 'Idle · Ready for work'
                : 'Not accepting work'
            }
            status={r.status === 'Ready' ? 'completed' : 'blocked'}
            statusLabel={r.status}
            onClick={() =>
              dispatch({ type: 'NAVIGATE_PRODUCT', route: 'runtime', id: r.id })
            }
          />
        ))}
      </div>
      <section className="kx-card">
        <h3>Workspace runtime policy</h3>
        <p>Where work goes when a session does not choose.</p>
        <label className="kx-field">
          Workspace runtime policy
          <select
            value={state.product.runtimePolicy}
            onChange={(e) =>
              dispatch({
                type: 'PRODUCT',
                action: { kind: 'runtime-policy', id: e.target.value },
              })
            }
          >
            <option value="automatic">Automatic · Least busy runtime</option>
            {state.product.runtimes
              .filter((r) => r.status !== 'Revoked')
              .map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
          </select>
        </label>
        <p>
          A specific runtime waits if it cannot take the work. Nothing moves
          elsewhere.
        </p>
      </section>
    </div>
  )
}
function RuntimeDetails({
  runtime,
  onClose,
  triggerRef,
}: {
  runtime: Runtime
  onClose: () => void
  triggerRef: RefObject<HTMLElement | null>
}) {
  const { dispatch } = useMockup()
  const [mode, setMode] = useState<'detail' | 'edit' | 'roles' | 'history'>(
    'detail',
  )
  const [name, setName] = useState(runtime.name)
  const [workloads, setWorkloads] = useState(runtime.workloads)
  const [notice, setNotice] = useState('')
  const update = (changes: Partial<Omit<Runtime, 'id'>>) => {
    dispatch({
      type: 'PRODUCT',
      action: { kind: 'update-runtime', id: runtime.id, changes },
    })
    setNotice('Runtime updated in this prototype.')
  }
  return (
    <ProductDialog title="Runtime" onClose={onClose} triggerRef={triggerRef}>
      <div className="kx-stack">
        <div className="kx-section-heading">
          <h3>{runtime.name}</h3>
          <StatusBadge
            status={runtime.status === 'Ready' ? 'completed' : 'blocked'}
            label={runtime.status}
          />
        </div>
        {notice && <p role="status">{notice}</p>}
        {mode !== 'detail' && (
          <button className="kx-product-back" onClick={() => setMode('detail')}>
            Back to runtime
          </button>
        )}
        {mode === 'edit' ? (
          <form
            className="kx-stack"
            onSubmit={(e) => {
              e.preventDefault()
              if (!name.trim()) return
              update({ name: name.trim() })
              setMode('detail')
            }}
          >
            <label className="kx-field">
              Name
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </label>
            <button className="kx-button kx-button--primary">
              Save details
            </button>
          </form>
        ) : mode === 'roles' ? (
          <form
            className="kx-stack"
            onSubmit={(e) => {
              e.preventDefault()
              if (!workloads.length) return
              update({ workloads })
              setMode('detail')
            }}
          >
            <fieldset className="kx-product-fieldset">
              <legend>Workloads</legend>
              {WORKLOADS.map((w) => (
                <label key={w}>
                  <input
                    type="checkbox"
                    checked={workloads.includes(w)}
                    onChange={() =>
                      setWorkloads((prev) =>
                        prev.includes(w)
                          ? prev.filter((x) => x !== w)
                          : [...prev, w],
                      )
                    }
                  />
                  {w}
                </label>
              ))}
            </fieldset>
            <button
              className="kx-button kx-button--primary"
              disabled={!workloads.length}
            >
              Save roles
            </button>
          </form>
        ) : mode === 'history' ? (
          <ol className="kx-product-updates">
            <li>Registered · 1 October 2026</li>
            <li>Current state · {runtime.status}</li>
          </ol>
        ) : (
          <>
            <dl className="kx-product-metadata">
              <dt>Utilization</dt>
              <dd>
                {runtime.status === 'Ready' ? 'Idle' : 'Not accepting work'}
              </dd>
              <dt>Version</dt>
              <dd>Demo bundle · protocol 1.0</dd>
              <dt>Platform</dt>
              <dd>{runtime.platform}</dd>
              <dt>Owner</dt>
              <dd>{runtime.owner}</dd>
              <dt>Workloads</dt>
              <dd>{runtime.workloads.join(', ')}</dd>
            </dl>
            <section className="kx-card">
              <h3>Previews</h3>
              <label>
                <input
                  role="switch"
                  type="checkbox"
                  checked={runtime.previews}
                  onChange={(e) => update({ previews: e.target.checked })}
                />
                Enable previews
              </label>
              <p>
                Lets people you share a session with open what your agent is
                building.
              </p>
            </section>
            <section className="kx-card">
              <h3>Agents</h3>
              <div className="kx-list">
                <div className="kx-list-row">
                  <strong>Codex</strong>
                  <StatusBadge status="completed" label="Ready" />
                </div>
                <div className="kx-list-row">
                  <strong>Claude Code</strong>
                  <StatusBadge status="waiting-input" label="Needs sign-in" />
                  <button
                    className="kx-button kx-button--small"
                    onClick={() =>
                      setNotice(
                        'Demo sign-in complete. No external account was contacted.',
                      )
                    }
                  >
                    Log in
                  </button>
                </div>
              </div>
            </section>
            <h3>Actions</h3>
            <div className="kx-product-note__actions">
              <button className="kx-button" onClick={() => setMode('edit')}>
                Edit details
              </button>
              <button className="kx-button" onClick={() => setMode('roles')}>
                Edit roles
              </button>
              <button
                className="kx-button"
                disabled={runtime.owner === 'Organization'}
                onClick={() => update({ owner: 'Organization' })}
              >
                Promote to organization
              </button>
              <button
                className="kx-button"
                disabled={runtime.status === 'Revoked'}
                onClick={() =>
                  update({
                    status:
                      runtime.status === 'Draining' ? 'Ready' : 'Draining',
                  })
                }
              >
                {runtime.status === 'Draining' ? 'Resume' : 'Drain'}
              </button>
              <button
                className="kx-button"
                onClick={() =>
                  update({
                    status:
                      runtime.status === 'Revoked'
                        ? 'Not connected'
                        : 'Revoked',
                  })
                }
              >
                {runtime.status === 'Revoked' ? 'Restore' : 'Revoke'}
              </button>
              <button className="kx-button" onClick={() => setMode('history')}>
                History
              </button>
            </div>
          </>
        )}
      </div>
    </ProductDialog>
  )
}
export function RuntimePage() {
  const { state, dispatch } = useMockup()
  const runtime = state.product.runtimes.find(
    (r) => r.id === state.product.selectedId,
  )
  const [agent, setAgent] = useState('All')
  const [details, setDetails] = useState(false)
  const [instructions, setInstructions] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const agents = [
    'All',
    'Claude Code',
    'Codex',
    'DeepSeek Harness',
    'OpenCode',
    'Google Antigravity',
  ]
  const back = () =>
    dispatch({
      type: 'NAVIGATE_PRODUCT',
      route: 'customize-page',
      customizeSection: 'runtimes',
    })
  if (!runtime)
    return (
      <>
        <ProductPageHeader title="Runtime not found" onBack={back} />
        <ProductEmpty title="Choose a connected runtime">
          Prototype-created runtimes reset on reload.
        </ProductEmpty>
      </>
    )
  return (
    <>
      <ProductPageHeader
        title={runtime.name}
        description={`${runtime.platform} · ${runtime.status}`}
        onBack={back}
        backLabel="Back to Runtimes"
        actions={
          <button
            ref={triggerRef}
            className="kx-button"
            onClick={() => setDetails(true)}
          >
            <Laptop size={14} />
            Runtime details
          </button>
        }
      />
      <div className="kx-product-body">
        <ProductStateGate
          empty={
            <ProductEmpty title="No sessions on this runtime">
              Start a session when your computer is ready.
            </ProductEmpty>
          }
        >
          <div
            className="kx-subtabs"
            role="tablist"
            aria-label="Agents on this computer"
          >
            {agents.map((a) => (
              <button
                key={a}
                role="tab"
                aria-selected={agent === a}
                aria-controls="runtime-sessions"
                id={`agent-${a.replaceAll(' ', '-')}`}
                onClick={() => setAgent(a)}
              >
                {a}
              </button>
            ))}
          </div>
          <section
            id="runtime-sessions"
            role="tabpanel"
            aria-labelledby={`agent-${agent.replaceAll(' ', '-')}`}
            className="kx-stack"
          >
            <div className="kx-section-heading">
              <h2>Sessions</h2>
              <button
                className="kx-button kx-button--primary"
                disabled={runtime.status !== 'Ready'}
                onClick={() =>
                  dispatch({ type: 'NAVIGATE', route: 'new-session' })
                }
              >
                New session
              </button>
            </div>
            {runtime.status === 'Ready' && ['All', 'Codex'].includes(agent) ? (
              <ProductRow
                title="Review the checkout changes"
                description="Direct session · Codex · 2 hours ago"
                meta="Ended: idle"
                status="completed"
                onClick={() =>
                  dispatch({ type: 'NAVIGATE', route: 'session-stream-detail' })
                }
              />
            ) : (
              <ProductEmpty title="No sessions for this agent">
                {runtime.status === 'Ready'
                  ? 'Sessions appear when you start work with this agent.'
                  : 'Reconnect this computer before starting a session.'}
              </ProductEmpty>
            )}
          </section>
          <button
            className="kx-button"
            aria-expanded={instructions}
            onClick={() => setInstructions(!instructions)}
          >
            On this computer
          </button>
          {instructions && (
            <div className="kx-card">
              <p>
                Run these in a terminal on {runtime.name} ({runtime.platform}).
              </p>
              <CodeBlock
                code="# Illustrative commands\nkonteks-remote status\nkonteks-remote agent list"
                meta="shell"
              />
            </div>
          )}
        </ProductStateGate>
      </div>
      {details && (
        <RuntimeDetails
          runtime={runtime}
          onClose={() => setDetails(false)}
          triggerRef={triggerRef}
        />
      )}
    </>
  )
}
