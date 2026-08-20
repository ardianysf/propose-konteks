/*
 * IntegrationsTab — the shared Customize tab content for the three
 * integration tabs, MCP / Connectors / VCS (Task 9 Part B, spec §11,
 * AC37).
 *
 * One parameterized component, one variant per tab: each variant keeps
 * its own title and concise action, then renders either a compact
 * semantic table (MCP servers, VCS connectors with repository counts
 * derived from REPOSITORIES) or — when the variant has no entries, the
 * Connectors tab today — a designed empty state. Everything is local
 * illustrative data: no network, no backend (AC46).
 */
import {
  CONNECTORS,
  MCP_SERVERS,
  REPOSITORIES,
  VCS_CONNECTORS,
  type ConnectorEntry,
  type McpServerEntry,
} from '../../data/mockData'
import './shared.css'
import './IntegrationsTab.css'

export type IntegrationsVariant = 'mcp' | 'connectors' | 'vcs'

const VARIANT_LABELS: Record<IntegrationsVariant, string> = {
  mcp: 'MCP',
  connectors: 'Connectors',
  vcs: 'VCS',
}

const STATUS_LABELS = { connected: 'Connected', 'needs-setup': 'Needs setup' } as const

/** Compact status chip shared by every integration table row. */
function Status({ status }: { status: 'connected' | 'needs-setup' }) {
  return (
    <span
      className={
        status === 'connected'
          ? 'kx-integrations__status kx-integrations__status--connected'
          : 'kx-integrations__status kx-integrations__status--setup'
      }
    >
      {STATUS_LABELS[status]}
    </span>
  )
}

/** MCP — compact table of configured servers. */
function McpTable() {
  return (
    <table className="kx-customize-tab__table kx-integrations__table" aria-label="MCP servers">
      <thead>
        <tr>
          <th scope="col">Server</th>
          <th scope="col">Transport</th>
          <th scope="col">Status</th>
        </tr>
      </thead>
      <tbody>
        {MCP_SERVERS.map((server: McpServerEntry) => (
          <tr key={server.id}>
            <th scope="row">{server.name}</th>
            <td>{server.transport}</td>
            <td>
              <Status status={server.status} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

/** VCS — compact table of connectors with repository counts from the registry. */
function VcsTable() {
  return (
    <table className="kx-customize-tab__table kx-integrations__table" aria-label="VCS connectors">
      <thead>
        <tr>
          <th scope="col">Connector</th>
          <th scope="col">Repositories</th>
          <th scope="col">Status</th>
        </tr>
      </thead>
      <tbody>
        {VCS_CONNECTORS.map((connector) => {
          const count = REPOSITORIES.filter((repo) => repo.vcs === connector.name).length
          return (
            <tr key={connector.id}>
              <th scope="row">{connector.name}</th>
              <td>
                {count > 0
                  ? `${count} ${count === 1 ? 'repository' : 'repositories'}`
                  : 'None yet'}
              </td>
              <td>
                <Status status={count > 0 ? 'connected' : 'needs-setup'} />
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

/** Connectors — compact table of workspace connectors, or the designed
 * empty state while the workspace has none. */
function ConnectorsContent() {
  if (CONNECTORS.length === 0) {
    return (
      <div className="kx-integrations__empty" role="status">
        <h4 className="kx-integrations__empty-title">No connectors yet</h4>
        <p className="kx-integrations__empty-text">
          Connect Jira, Slack, or Sentry so sessions can act on your tools.
          Setup takes one click per connector.
        </p>
      </div>
    )
  }
  return (
    <table className="kx-customize-tab__table kx-integrations__table" aria-label="Connectors">
      <thead>
        <tr>
          <th scope="col">Connector</th>
          <th scope="col">Scope</th>
          <th scope="col">Status</th>
        </tr>
      </thead>
      <tbody>
        {CONNECTORS.map((connector: ConnectorEntry) => (
          <tr key={connector.id}>
            <th scope="row">{connector.name}</th>
            <td>{connector.hint}</td>
            <td>
              <Status status={connector.status} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

const VARIANT_CONTENT: Record<IntegrationsVariant, () => JSX.Element> = {
  mcp: McpTable,
  connectors: ConnectorsContent,
  vcs: VcsTable,
}

const VARIANT_ACTIONS: Record<IntegrationsVariant, string> = {
  mcp: 'Add MCP server',
  connectors: 'Add connector',
  vcs: 'Connect VCS',
}

export default function IntegrationsTab({ variant }: { variant: IntegrationsVariant }) {
  const Content = VARIANT_CONTENT[variant]
  return (
    <section className={`kx-customize-tab kx-customize-tab--${variant}`}>
      <header className="kx-customize-tab__bar">
        <h3 className="kx-customize-tab__title">{VARIANT_LABELS[variant]}</h3>
        <button type="button" className="kx-btn kx-btn--ghost kx-integrations__action">
          {VARIANT_ACTIONS[variant]}
        </button>
      </header>
      <Content />
    </section>
  )
}
