import { Bell, MessageSquare, Paperclip, Plus, ThumbsUp } from 'lucide-react'
import { useRef, useState, type RefObject } from 'react'
import { useMockup } from '../../state/MockupContext'
import StatusBadge from '../../components/technical/StatusBadge'
import type { Initiative, ProductNote, ProductRoute } from './productState'
import {
  ProductDialog,
  ProductEmpty,
  ProductFilters,
  ProductPageHeader,
  ProductRow,
  ProductStateGate,
} from './ProductPrimitives'
import ProductCustomizePage from './ProductCustomizePage'
import ProductSettingsPage from './ProductSettingsPage'
import { RuntimePage } from './RuntimePages'
import { SystemsPage, WorkLocallyPage, SupportPage } from './SupportingPages'

export function ProductNotifications() {
  const { state, dispatch } = useMockup()
  const [open, setOpen] = useState(false)
  const trigger = useRef<HTMLButtonElement>(null)
  return (
    <>
      <button
        ref={trigger}
        className="kx-v2-iconbtn kx-product-notifications"
        aria-label="Notifications"
        onClick={() => setOpen(true)}
      >
        <Bell size={17} />
      </button>
      {open && (
        <ProductDialog
          title="Notifications"
          triggerRef={trigger}
          onClose={() => setOpen(false)}
        >
          <div className="kx-list">
            {state.product.initiatives.slice(0, 2).map((i) => (
              <ProductRow
                key={i.id}
                title={i.title}
                description={i.update}
                meta="A moment ago"
                onClick={() => {
                  setOpen(false)
                  dispatch({
                    type: 'NAVIGATE_PRODUCT',
                    route: 'work-detail',
                    id: i.id,
                    from: 'activities',
                  })
                }}
              />
            ))}
          </div>
        </ProductDialog>
      )}
    </>
  )
}
function NewInitiative({
  onClose,
  triggerRef,
}: {
  onClose: () => void
  triggerRef: RefObject<HTMLElement | null>
}) {
  const { state, dispatch } = useMockup()
  const [title, setTitle] = useState('')
  const [systemId, setSystemId] = useState(state.systems[0]?.id ?? '')
  const [attachment, setAttachment] = useState('')
  return (
    <ProductDialog
      title="New initiative"
      onClose={onClose}
      triggerRef={triggerRef}
      footer={
        <>
          <button className="kx-button" onClick={onClose}>
            Cancel
          </button>
          <button
            className="kx-button kx-button--primary"
            type="submit"
            form="new-initiative"
          >
            Start
          </button>
        </>
      }
    >
      <p>A planning session opens behind it, ready to read your notes.</p>
      <form
        id="new-initiative"
        className="kx-stack"
        onSubmit={(e) => {
          e.preventDefault()
          if (!title.trim() || !systemId) return
          dispatch({
            type: 'PRODUCT',
            action: { kind: 'create-initiative', title, systemId, attachment },
          })
          onClose()
        }}
      >
        <label className="kx-field">
          What is this initiative about?
          <textarea
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            rows={4}
          />
        </label>
        <label className="kx-field">
          Software System
          <select
            required
            value={systemId}
            onChange={(e) => setSystemId(e.target.value)}
          >
            {state.systems.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
        <label className="kx-product-attachment">
          <Paperclip size={15} />
          Attach meeting transcript
          <input
            type="file"
            accept=".txt,.md,.pdf"
            onChange={(e) => setAttachment(e.target.files?.[0]?.name ?? '')}
          />
        </label>
        {attachment && <p role="status">Attached: {attachment}</p>}
      </form>
    </ProductDialog>
  )
}
function NoteCard({
  initiative,
  note,
}: {
  initiative: Initiative
  note: ProductNote
}) {
  const { dispatch } = useMockup()
  const [commenting, setCommenting] = useState(false)
  const [comment, setComment] = useState('')
  const [choosingReaction, setChoosingReaction] = useState(false)
  return (
    <article className="kx-product-note">
      <div className="kx-product-note__author">
        <span className="kx-product-avatar" aria-hidden="true">
          {initiative.owner.slice(0, 1)}
        </span>
        <strong>{initiative.owner}</strong>
        <small>Just now</small>
      </div>
      <p>{note.body}</p>
      {note.attachment && (
        <p className="kx-product-file">
          <Paperclip size={13} />
          {note.attachment}
        </p>
      )}
      <div className="kx-product-note__actions">
        <button
          className="kx-button kx-button--small"
          aria-expanded={choosingReaction}
          onClick={() => setChoosingReaction(!choosingReaction)}
        >
          <ThumbsUp size={13} />
          React{note.reactions.length ? ` · ${note.reactions.join(', ')}` : ''}
        </button>
        <button
          className="kx-button kx-button--small"
          aria-expanded={commenting}
          onClick={() => setCommenting(!commenting)}
        >
          <MessageSquare size={13} />
          Comment{note.comments.length ? ` · ${note.comments.length}` : ''}
        </button>
      </div>
      {choosingReaction && (
        <div
          role="group"
          aria-label="Reactions"
          className="kx-product-note__actions"
        >
          {['Like', 'Watching', 'Celebrate'].map((reaction) => (
            <button
              key={reaction}
              className="kx-button kx-button--small"
              aria-pressed={note.reactions.includes(reaction)}
              onClick={() =>
                dispatch({
                  type: 'PRODUCT',
                  action: {
                    kind: 'react',
                    initiativeId: initiative.id,
                    noteId: note.id,
                    reaction,
                  },
                })
              }
            >
              {reaction}
            </button>
          ))}
        </div>
      )}
      {commenting && (
        <div className="kx-stack">
          {note.comments.map((body, n) => (
            <blockquote key={n}>{body}</blockquote>
          ))}
          <form
            onSubmit={(e) => {
              e.preventDefault()
              if (!comment.trim()) return
              dispatch({
                type: 'PRODUCT',
                action: {
                  kind: 'comment',
                  initiativeId: initiative.id,
                  noteId: note.id,
                  body: comment,
                },
              })
              setComment('')
            }}
          >
            <label className="kx-field">
              Comment
              <textarea
                required
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={2}
              />
            </label>
            <button className="kx-button" disabled={!comment.trim()}>
              Post comment
            </button>
          </form>
        </div>
      )}
    </article>
  )
}
export function InitiativeUpdates({
  initiative,
  onClose,
  triggerRef,
}: {
  initiative: Initiative
  onClose: () => void
  triggerRef: RefObject<HTMLElement | null>
}) {
  const { dispatch } = useMockup()
  return (
    <ProductDialog title="Updates" triggerRef={triggerRef} onClose={onClose}>
      <h3>{initiative.title}</h3>
      <p>{initiative.update}</p>
      <ol className="kx-product-updates">
        {initiative.notes.map((n) => (
          <li key={n.id}>
            <strong>Note added</strong>
            <p>{n.body}</p>
          </li>
        ))}
      </ol>
      <button
        className="kx-button"
        onClick={() => {
          onClose()
          dispatch({
            type: 'OPEN_INITIATIVE_SESSION',
            initiativeId: initiative.id,
          })
        }}
      >
        Open planning session
      </button>
    </ProductDialog>
  )
}
function ActivitiesOrWork({ activity }: { activity: boolean }) {
  const { state, dispatch } = useMockup()
  const [query, setQuery] = useState('')
  const [creating, setCreating] = useState(false)
  const [updates, setUpdates] = useState<Initiative | null>(null)
  const triggerRef = useRef<HTMLButtonElement | null>(null)
  const items = state.product.initiatives.filter(
    (i) =>
      (state.product.systemFilter === 'all' ||
        i.systemId === state.product.systemFilter) &&
      i.title.toLowerCase().includes(query.toLowerCase()),
  )
  const route: ProductRoute = activity ? 'activities' : 'work'
  const createButton = (
    <button
      className="kx-button kx-button--primary"
      onClick={(e) => {
        triggerRef.current = e.currentTarget
        setCreating(true)
      }}
    >
      <Plus size={14} />
      New initiative
    </button>
  )
  return (
    <>
      <ProductPageHeader
        title={activity ? 'Activities' : 'Work In Progress'}
        description={
          activity
            ? 'What happened across your Systems.'
            : 'What people are driving. Agents do the rest.'
        }
        actions={createButton}
      />
      <div className="kx-product-body">
        <ProductFilters
          query={query}
          onQuery={setQuery}
          showCreate={!activity}
        />
        <ProductStateGate
          key={route}
          empty={
            <ProductEmpty title="Nothing here yet">
              Start an initiative to bring your team’s work together.
              {createButton}
            </ProductEmpty>
          }
        >
          {!activity && (
            <div className="kx-product-discovery">
              <span>Discovery of your repositories · Open</span>
              <button
                className="kx-button kx-button--small"
                onClick={() =>
                  dispatch({ type: 'NAVIGATE', route: 'new-session' })
                }
              >
                Continue
              </button>
            </div>
          )}
          <div className="kx-product-list">
            {items.map((i) =>
              activity ? (
                <article className="kx-product-activity" key={i.id}>
                  <div className="kx-product-activity__meta">
                    <span>Initiative</span>
                    <StatusBadge
                      status={
                        i.status === 'Needs attention'
                          ? 'blocked'
                          : i.status === 'Planning'
                            ? 'draft'
                            : 'running'
                      }
                      label={i.status}
                    />
                    <span>
                      {state.systems.find((s) => s.id === i.systemId)?.name}
                    </span>
                  </div>
                  <button
                    className="kx-product-title-link"
                    onClick={() =>
                      dispatch({
                        type: 'NAVIGATE_PRODUCT',
                        route: 'work-detail',
                        id: i.id,
                        from: route,
                      })
                    }
                  >
                    {i.title}
                  </button>
                  <NoteCard initiative={i} note={i.notes[0]} />
                  <button
                    className="kx-product-back"
                    onClick={(e) => {
                      triggerRef.current = e.currentTarget
                      setUpdates(i)
                    }}
                  >
                    {i.notes.length} updates · Just now
                  </button>
                </article>
              ) : (
                <ProductRow
                  key={i.id}
                  title={i.title}
                  description={`Driven by ${i.owner} · ${state.systems.find((s) => s.id === i.systemId)?.name ?? 'System'}`}
                  meta={i.update}
                  status={
                    i.status === 'Needs attention'
                      ? 'blocked'
                      : i.status === 'Planning'
                        ? 'draft'
                        : 'running'
                  }
                  statusLabel={i.status}
                  onClick={() =>
                    dispatch({
                      type: 'NAVIGATE_PRODUCT',
                      route: 'work-detail',
                      id: i.id,
                      from: route,
                    })
                  }
                />
              ),
            )}
            {items.length === 0 && (
              <ProductEmpty title="No matching initiatives">
                Try another search or Software System.
              </ProductEmpty>
            )}
          </div>
        </ProductStateGate>
      </div>
      {creating && (
        <NewInitiative
          triggerRef={triggerRef}
          onClose={() => setCreating(false)}
        />
      )}
      {updates && (
        <InitiativeUpdates
          initiative={updates}
          triggerRef={triggerRef}
          onClose={() => setUpdates(null)}
        />
      )}
    </>
  )
}
function WorkDetail() {
  const { state, dispatch } = useMockup()
  const initiative = state.product.initiatives.find(
    (i) => i.id === state.product.selectedId,
  )
  const [note, setNote] = useState('')
  const [attachment, setAttachment] = useState('')
  const [updates, setUpdates] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const back = () =>
    dispatch({ type: 'NAVIGATE_PRODUCT', route: state.product.returnRoute })
  if (!initiative)
    return (
      <>
        <ProductPageHeader title="Initiative not found" onBack={back} />
        <ProductEmpty title="This initiative is unavailable">
          Return to the list to choose another initiative. Prototype-created
          records reset on reload.
        </ProductEmpty>
      </>
    )
  return (
    <>
      <ProductPageHeader
        title={initiative.title}
        description={`${state.systems.find((s) => s.id === initiative.systemId)?.name ?? 'System'} · Driven by ${initiative.owner}`}
        onBack={back}
        backLabel={
          state.product.returnRoute === 'activities'
            ? 'Back to Activities'
            : 'Back to Work In Progress'
        }
        actions={
          <button
            ref={triggerRef}
            className="kx-button"
            onClick={() => setUpdates(true)}
          >
            Updates
          </button>
        }
      />
      <div className="kx-product-body kx-product-reading">
        <ProductStateGate>
          <div className="kx-product-detail-status">
            <StatusBadge
              status={
                initiative.status === 'Needs attention'
                  ? 'blocked'
                  : initiative.status === 'Planning'
                    ? 'draft'
                    : 'running'
              }
              label={initiative.status}
            />
            <p>{initiative.update}</p>
          </div>
          <form
            className="kx-product-composer"
            onSubmit={(e) => {
              e.preventDefault()
              if (!note.trim()) return
              dispatch({
                type: 'PRODUCT',
                action: {
                  kind: 'post-note',
                  initiativeId: initiative.id,
                  body: note,
                  attachment,
                },
              })
              setNote('')
              setAttachment('')
            }}
          >
            <label className="kx-field">
              Draft your thinking… notes feed the plan
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={4}
                required
              />
            </label>
            <div className="kx-toolbar">
              <label className="kx-product-attachment">
                <Paperclip size={14} />
                Attach
                <input
                  key={attachment}
                  type="file"
                  onChange={(e) =>
                    setAttachment(e.target.files?.[0]?.name ?? '')
                  }
                />
              </label>
              <span>{attachment}</span>
              <button
                className="kx-button kx-button--primary"
                disabled={!note.trim()}
              >
                Post note
              </button>
            </div>
          </form>
          {initiative.notes.map((n) => (
            <NoteCard key={n.id} initiative={initiative} note={n} />
          ))}
        </ProductStateGate>
      </div>
      {updates && (
        <InitiativeUpdates
          initiative={initiative}
          triggerRef={triggerRef}
          onClose={() => setUpdates(false)}
        />
      )}
    </>
  )
}
function EmptyCollection({ releases }: { releases: boolean }) {
  const [query, setQuery] = useState('')
  return (
    <>
      <ProductPageHeader
        title={releases ? 'Releases' : 'Issues'}
        description={
          releases
            ? 'Ready to ship first, then what shipped.'
            : 'What is wrong, by severity.'
        }
      />
      <div className="kx-product-body">
        <ProductFilters query={query} onQuery={setQuery} showSearch={false} />
        <ProductStateGate>
          <ProductEmpty
            title={releases ? 'Nothing here yet' : 'Nothing is open'}
          >
            {releases
              ? 'Accepted initiatives gather into a release candidate for their System.'
              : 'When something breaks, reported by a person or caught by a channel, it appears here.'}
          </ProductEmpty>
          <p className="kx-product-reference-note">
            The live workspace had no {releases ? 'releases' : 'issues'} to
            inspect. Detail screens require a populated reference.
          </p>
        </ProductStateGate>
      </div>
    </>
  )
}
function Leaderboard() {
  const { state } = useMockup()
  return (
    <>
      <ProductPageHeader
        title="Leaderboard"
        description="People by involvement. Models by value."
      />
      <div className="kx-product-body">
        <ProductStateGate
          empty={
            <ProductEmpty title="No activity yet">
              Rankings appear when people contribute to initiatives.
            </ProductEmpty>
          }
        >
          <div className="kx-product-columns">
            <section className="kx-card" aria-label="People">
              <h2>People</h2>
              <ol className="kx-product-ranking">
                {state.product.initiatives.map((i, n) => (
                  <li key={i.id}>
                    <span className="kx-product-rank">{n + 1}</span>
                    <span>
                      <strong>{i.owner}</strong>
                      <small>
                        1 started · {i.notes.length} contributions ·{' '}
                        {i.notes.reduce(
                          (sum, note) => sum + note.reactions.length,
                          0,
                        )}{' '}
                        reactions
                      </small>
                    </span>
                    <strong>{5 + i.notes.length * 2}</strong>
                  </li>
                ))}
              </ol>
            </section>
            <section className="kx-card" aria-label="Model value">
              <h2>Model value</h2>
              <ol className="kx-product-ranking">
                <li>
                  <span className="kx-product-rank">1</span>
                  <span>
                    <strong>Demo model</strong>
                    <small>Local agent · Illustrative usage</small>
                  </span>
                  <strong>84K tokens</strong>
                </li>
              </ol>
            </section>
          </div>
        </ProductStateGate>
      </div>
    </>
  )
}
export default function ProductPages() {
  const { state } = useMockup()
  switch (state.route) {
    case 'activities':
      return <ActivitiesOrWork activity />
    case 'work':
      return <ActivitiesOrWork activity={false} />
    case 'work-detail':
      return <WorkDetail key={state.product.selectedId} />
    case 'issues':
      return <EmptyCollection releases={false} />
    case 'releases':
      return <EmptyCollection releases />
    case 'leaderboard':
      return <Leaderboard />
    case 'customize-page':
      return <ProductCustomizePage />
    case 'settings-page':
      return <ProductSettingsPage />
    case 'profile':
      return <ProductSettingsPage profile />
    case 'runtime':
      return <RuntimePage key={state.product.selectedId} />
    case 'systems':
      return <SystemsPage />
    case 'work-locally':
      return <WorkLocallyPage />
    case 'support':
      return <SupportPage />
    default:
      return null
  }
}
