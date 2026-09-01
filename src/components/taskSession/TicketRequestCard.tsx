/*
 * TicketRequestCard — the user-style request message that opens the task
 * session: ticket title, description, acceptance criteria, dependency
 * (mono chip), and the instruction line. Right-aligned like a user
 * timeline bubble, wide enough for the structured content.
 */
import { TASK_SESSION_DETAIL } from '../../data/mockData'
import './TicketRequestCard.css'

export default function TicketRequestCard() {
  const { ticketRequest } = TASK_SESSION_DETAIL

  return (
    <article className="kx-ticket-request" data-testid="ticket-request-card" aria-label="Ticket request">
      <h2 className="kx-ticket-request__title">{ticketRequest.title}</h2>
      <p className="kx-ticket-request__desc">{ticketRequest.description}</p>

      <div className="kx-ticket-request__criteria">
        <p className="kx-ticket-request__criteria-label">Acceptance criteria:</p>
        <ul className="kx-ticket-request__criteria-list">
          {ticketRequest.acceptanceCriteria.map((criterion) => (
            <li key={criterion} className="kx-ticket-request__criterion">
              {criterion}
            </li>
          ))}
        </ul>
      </div>

      <p className="kx-ticket-request__depends">
        Depends on: <span className="kx-ticket-request__chip">{ticketRequest.dependsOn}</span>
      </p>
      <p className="kx-ticket-request__instruction">{ticketRequest.instruction}</p>
    </article>
  )
}
