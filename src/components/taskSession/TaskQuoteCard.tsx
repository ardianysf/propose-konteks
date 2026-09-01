/*
 * TaskQuoteCard — the "QUOTE PREPARED" notice card for the task session
 * page. Unlike SessionQuoteCard (driven by the regular session's quote
 * records + approval state), this renders the task fixture's static
 * quote notice: overline label, text, and expiry line. No actions — the
 * decision/estimate card below carries the approval affordances.
 */
import { TASK_SESSION_DETAIL } from '../../data/mockData'
import './TaskQuoteCard.css'

export default function TaskQuoteCard() {
  const { quote } = TASK_SESSION_DETAIL

  return (
    <article className="kx-task-quote" data-testid="task-quote-card" aria-label="Quote prepared">
      <p className="kx-task-quote__label">{quote.label}</p>
      <p className="kx-task-quote__text">{quote.text}</p>
      <p className="kx-task-quote__expires">{quote.expires}</p>
    </article>
  )
}
