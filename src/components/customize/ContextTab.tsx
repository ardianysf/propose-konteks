/*
 * ContextTab — the Customize → Context tab content (Task 9 Part B,
 * spec §11, AC37).
 *
 * Three clear labelled sections — Files, Skills, Repositories — each a
 * compact row with a status/count line and representative illustrative
 * content from mockData (AGENTS.md-style context files, the preserved
 * skills, and the repository registry). Purely presentational: no
 * backend, no network — every value is illustrative (AC46).
 *
 * Repositories follow the session scope: the rows are only the
 * repositories selected for the session — the committed
 * `sessionContext.repoIds` when a context is committed, otherwise the
 * current global `selectedRepoIds`. With nothing selected the section
 * shows the concise "No repositories selected" message instead of a
 * fake list, and the count reflects the selected visible rows. The
 * Files and Skills sections are unchanged by this contract.
 */
import { useId } from 'react'
import {
  CONTEXT_FILES,
  PRESERVED_SKILLS,
  REPOSITORIES,
  SYSTEMS,
} from '../../data/mockData'
import { useMockup } from '../../state/MockupContext'
import './shared.css'
import './ContextTab.css'

export default function ContextTab() {
  const { state } = useMockup()
  const filesHeadingId = useId()
  const skillsHeadingId = useId()
  const repositoriesHeadingId = useId()

  const enabledSkills = PRESERVED_SKILLS.filter((skill) => skill.enabled)

  // The session's selected repositories: the committed session context
  // wins when one exists; otherwise the current global selection. Only
  // repositories present in the registry render — registry order keeps
  // the rows deterministic, and unknown ids simply drop out.
  const selectedRepoIds = state.sessionContext?.repoIds ?? state.selectedRepoIds
  const selectedRepositories = REPOSITORIES.filter((repository) =>
    selectedRepoIds.includes(repository.id),
  )

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
            {selectedRepositories.length} repositories · {SYSTEMS.length} systems
          </p>
        </header>
        <ul className="kx-context__list">
          {selectedRepositories.length === 0 ? (
            <li className="kx-context__item kx-context__item--empty">
              <span className="kx-context__item-note">No repositories selected</span>
            </li>
          ) : (
            selectedRepositories.map((repository) => (
              <li key={repository.id} className="kx-context__item">
                <span className="kx-context__item-name">{repository.name}</span>
                <span className="kx-context__item-note">
                  {repository.vcs} · updated {repository.updatedAt}
                </span>
              </li>
            ))
          )}
        </ul>
      </section>
    </section>
  )
}
