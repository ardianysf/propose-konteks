/*
 * ContextTab — the Customize → Context tab content (Task 9 Part B,
 * spec §11, AC37).
 *
 * Three clear labelled sections — Files, Skills, Repositories — each a
 * compact row with a status/count line and representative illustrative
 * content from mockData (AGENTS.md-style context files, the preserved
 * skills, and the repository registry). Purely presentational: no
 * backend, no network — every value is illustrative (AC46).
 */
import { useId } from 'react'
import {
  CONTEXT_FILES,
  PRESERVED_SKILLS,
  REPOSITORIES,
  SYSTEMS,
} from '../../data/mockData'

/** Representative repositories shown in the compact row. */
const SHOWN_REPOSITORIES = REPOSITORIES.slice(0, 3)

export default function ContextTab() {
  const filesHeadingId = useId()
  const skillsHeadingId = useId()
  const repositoriesHeadingId = useId()

  const enabledSkills = PRESERVED_SKILLS.filter((skill) => skill.enabled)

  return (
    <section className="kx-customize-tab kx-customize-tab--context">
      <h3 className="kx-customize-tab__title">Context</h3>

      <section className="kx-context__row" aria-labelledby={filesHeadingId}>
        <header className="kx-context__row-head">
          <h4 id={filesHeadingId} className="kx-context__row-title">
            Files
          </h4>
          <p className="kx-context__count">
            {CONTEXT_FILES.length} files · synced with workspace
          </p>
        </header>
        <ul className="kx-context__list">
          {CONTEXT_FILES.map((file) => (
            <li key={file.id} className="kx-context__item">
              <span className="kx-context__item-name">{file.path}</span>
              <span className="kx-context__item-note">{file.note}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="kx-context__row" aria-labelledby={skillsHeadingId}>
        <header className="kx-context__row-head">
          <h4 id={skillsHeadingId} className="kx-context__row-title">
            Skills
          </h4>
          <p className="kx-context__count">
            {enabledSkills.length} of {PRESERVED_SKILLS.length} enabled
          </p>
        </header>
        <ul className="kx-context__list">
          {PRESERVED_SKILLS.map((skill) => (
            <li key={skill.id} className="kx-context__item">
              <span className="kx-context__item-name">{skill.name}</span>
              <span className="kx-context__item-note">
                {skill.enabled ? 'Enabled' : 'Disabled'} · {skill.scope}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="kx-context__row" aria-labelledby={repositoriesHeadingId}>
        <header className="kx-context__row-head">
          <h4 id={repositoriesHeadingId} className="kx-context__row-title">
            Repositories
          </h4>
          <p className="kx-context__count">
            {REPOSITORIES.length} repositories · {SYSTEMS.length} systems
          </p>
        </header>
        <ul className="kx-context__list">
          {SHOWN_REPOSITORIES.map((repository) => (
            <li key={repository.id} className="kx-context__item">
              <span className="kx-context__item-name">{repository.name}</span>
              <span className="kx-context__item-note">
                {repository.vcs} · updated {repository.updatedAt}
              </span>
            </li>
          ))}
          <li className="kx-context__item">
            <span className="kx-context__item-note">
              and {REPOSITORIES.length - SHOWN_REPOSITORIES.length} more
            </span>
          </li>
        </ul>
      </section>
    </section>
  )
}
