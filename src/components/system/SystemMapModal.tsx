/*
 * SystemMapModal — the per-system architecture map (sidebar SystemMenu map
 * action).
 *
 * A centered .kx-modal over the shared backdrop primitive, following the
 * CreateSystemModal conventions: role=dialog + aria-modal + labelled-by,
 * shared focus containment, an inert aria-hidden backdrop (dismissal is
 * owned by the OverlayLifecycle — Escape and the header Close control, not
 * backdrop clicks), and a deterministic inline SVG diagram — rounded-rect
 * subsystem nodes derived from the system's name, connected by edges —
 * rendered with theme tokens so it stays legible in both light and dark
 * themes. No network, no async state: the map is illustrative (spec AC46).
 */
import { useId, useRef } from 'react'
import { useMockup } from '../../state/MockupContext'
import { useOverlayLifecycle } from '../shell/OverlayLifecycle'
import { useFocusContainment } from '../shell/useFocusContainment'
import './SystemMapModal.css'
/** Close — the header dismiss control (same glyph as the other modals). */
function CloseIcon() {
  return (
    <svg
      data-icon="close"
      viewBox="0 0 16 16"
      width="14"
      height="14"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M4 4l8 8M12 4l-8 8"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  )
}

interface MapNode {
  id: string
  label: string
  x: number
  y: number
  w: number
  h: number
}

interface MapEdge {
  from: string
  to: string
}

const NODE_W = 150
const NODE_H = 44

/** Deterministic 640×360 canvas: a left entry column (client + API), a
 * middle services column, and a right data column — 8 nodes, 9 edges. */
function buildMap(systemName: string): { nodes: MapNode[]; edges: MapEdge[] } {
  const nodes: MapNode[] = [
    { id: 'client', label: 'Web client', x: 30, y: 90, w: NODE_W, h: NODE_H },
    { id: 'mobile', label: 'Mobile app', x: 30, y: 226, w: NODE_W, h: NODE_H },
    { id: 'api', label: `${systemName} API`, x: 245, y: 24, w: NODE_W, h: NODE_H },
    { id: 'auth', label: 'Auth service', x: 245, y: 112, w: NODE_W, h: NODE_H },
    { id: 'worker', label: 'Worker queue', x: 245, y: 200, w: NODE_W, h: NODE_H },
    { id: 'dashboard', label: 'Dashboard', x: 245, y: 288, w: NODE_W, h: NODE_H },
    { id: 'db', label: 'Postgres', x: 460, y: 68, w: NODE_W, h: NODE_H },
    { id: 'cache', label: 'Redis cache', x: 460, y: 200, w: NODE_W, h: NODE_H },
  ]
  const edges: MapEdge[] = [
    { from: 'client', to: 'api' },
    { from: 'client', to: 'auth' },
    { from: 'mobile', to: 'api' },
    { from: 'mobile', to: 'worker' },
    { from: 'api', to: 'db' },
    { from: 'auth', to: 'db' },
    { from: 'worker', to: 'cache' },
    { from: 'worker', to: 'db' },
    { from: 'dashboard', to: 'cache' },
  ]
  return { nodes, edges }
}

function center(node: MapNode): { x: number; y: number } {
  return { x: node.x + node.w / 2, y: node.y + node.h / 2 }
}

export default function SystemMapModal() {
  const { state } = useMockup()
  const { dismissOverlay } = useOverlayLifecycle()
  const titleId = useId()
  const dialogRef = useRef<HTMLDivElement>(null)

  useFocusContainment(dialogRef)

  // AppShell guards the overlay kind; resolve the system defensively so a
  // stale systemId (e.g. a removed system) falls back to the active system.
  const systemId = state.overlay.kind === 'system-map' ? state.overlay.systemId : null
  const system =
    state.systems.find((entry) => entry.id === systemId) ??
    state.systems.find((entry) => entry.id === state.activeSystemId) ??
    state.systems[0]

  const { nodes, edges } = buildMap(system.name)
  const nodeById = new Map(nodes.map((node) => [node.id, node]))

  return (
    <>
      <div aria-hidden="true" className="kx-modal-backdrop" />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="kx-modal kx-system-map"
      >
        <header className="kx-system-map__head">
          <h2 id={titleId} className="kx-system-map__title">
            {system.name} — system map
          </h2>
          <button
            type="button"
            className="kx-icon-btn kx-system-map__close"
            aria-label="Close"
            onClick={() => dismissOverlay()}
          >
            <CloseIcon />
          </button>
        </header>

        <div className="kx-system-map__canvas">
          <svg
            viewBox="0 0 640 360"
            role="img"
            aria-label={`System map for ${system.name}: web and mobile clients connect to the API, auth, worker, and dashboard services, backed by Postgres and Redis.`}
          >
            {edges.map((edge) => {
              const from = nodeById.get(edge.from)!
              const to = nodeById.get(edge.to)!
              const a = center(from)
              const b = center(to)
              return (
                <line
                  key={`${edge.from}-${edge.to}`}
                  className="kx-system-map__edge"
                  x1={a.x}
                  y1={a.y}
                  x2={b.x}
                  y2={b.y}
                />
              )
            })}
            {nodes.map((node) => (
              <g key={node.id} className="kx-system-map__node">
                <rect x={node.x} y={node.y} width={node.w} height={node.h} rx={12} />
                <text x={node.x + node.w / 2} y={node.y + node.h / 2}>{node.label}</text>
              </g>
            ))}
          </svg>
        </div>
      </div>
    </>
  )
}
