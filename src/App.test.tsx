import { fireEvent, render, screen, within } from '@testing-library/react'
import App from './App'

const getMenu = () => screen.getByRole('menu', { name: 'Systems' })
const getWorkspaceMenu = () => screen.getByRole('menu', { name: 'Workspace' })

it('renders the shell — sidebar navigation with the Konteks logo and the main route placeholder', () => {
  render(<App />)
  expect(screen.getByRole('navigation', { name: 'Sidebar' })).toBeInTheDocument()
  expect(screen.getByRole('img', { name: 'Konteks' })).toHaveAttribute(
    'src',
    '/assets/konteks/logo-text-main.png',
  )
  expect(screen.getByRole('heading', { name: /new session/i })).toBeInTheDocument()
})

it('frames the AppShell — one .kx-app grid with a single sidebar and one main region', () => {
  const { container } = render(<App />)
  const app = container.querySelector('.kx-app')
  expect(app).not.toBeNull()
  expect(app).not.toHaveClass('kx-app--rail')
  expect(app!.children[0]).toHaveClass('kx-sidebar')
  expect(app!.children[1]).toHaveClass('kx-main')
  expect(container.querySelectorAll('.kx-sidebar')).toHaveLength(1)
  expect(container.querySelectorAll('main.kx-main')).toHaveLength(1)
})

it('keeps the sidebar untouched while the route placeholder switches (AC11)', () => {
  const { container } = render(<App />)
  const before = container.querySelector('.kx-sidebar')!.outerHTML
  fireEvent.click(screen.getByRole('button', { name: /view all/i }))
  expect(screen.getByRole('heading', { name: /session history/i })).toBeInTheDocument()
  expect(container.querySelectorAll('.kx-sidebar')).toHaveLength(1)
  expect(container.querySelector('.kx-sidebar')!.outerHTML).toBe(before)
})

it('mounts the system menu overlay slot only after the system control opens it', () => {
  render(<App />)
  expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: /open system menu/i }))
  const menu = getMenu()
  expect(menu).toHaveClass('kx-menu', 'kx-system-menu')
  // Floating menu: anchored inside the shell grid, right of the sidebar —
  // never inside the sidebar, never behind a modal backdrop.
  expect(menu.closest('.kx-sidebar')).toBeNull()
  expect(menu.closest('.kx-app')).not.toBeNull()
  expect(document.querySelector('.kx-modal-backdrop')).toBeNull()
})

it('switching systems from the floating menu updates the sidebar control and closes the menu', () => {
  render(<App />)
  fireEvent.click(screen.getByRole('button', { name: /open system menu/i }))
  fireEvent.click(within(getMenu()).getByRole('menuitem', { name: /kookree/i }))
  expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  expect(screen.getByRole('button', { name: /kookree.*open system menu/i })).toBeInTheDocument()
})

it('mounts the workspace menu overlay slot only after the workspace control opens it (AC7)', () => {
  render(<App />)
  expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: /refactory workspace/i }))
  const menu = getWorkspaceMenu()
  expect(menu).toHaveClass('kx-menu', 'kx-workspace-menu')
  // Floating menu: anchored inside the shell grid, right of the sidebar —
  // never inside the sidebar, never behind a modal backdrop.
  expect(menu.closest('.kx-sidebar')).toBeNull()
  expect(menu.closest('.kx-app')).not.toBeNull()
  expect(document.querySelector('.kx-modal-backdrop')).toBeNull()
  // The current workspace renders as the selected illustrative row, and
  // the sidebar keeps exactly one persistent boxed container (AC6).
  expect(within(menu).getByRole('menuitem', { name: /refactory/i })).toHaveAttribute(
    'aria-current',
    'true',
  )
  expect(document.querySelectorAll('.kx-sidebar-box')).toHaveLength(1)
  // Escape closes through the CLOSE_OVERLAY contract (AC45).
  fireEvent.keyDown(menu, { key: 'Escape' })
  expect(screen.queryByRole('menu')).not.toBeInTheDocument()
})

it('renders exactly one overlay at a time — workspace and system menus are mutually exclusive', () => {
  render(<App />)
  fireEvent.click(screen.getByRole('button', { name: /refactory workspace/i }))
  expect(getWorkspaceMenu()).toBeInTheDocument()
  expect(screen.queryByRole('menu', { name: 'Systems' })).not.toBeInTheDocument()

  fireEvent.click(screen.getByRole('button', { name: /open system menu/i }))
  expect(getMenu()).toBeInTheDocument()
  expect(screen.queryByRole('menu', { name: 'Workspace' })).not.toBeInTheDocument()

  fireEvent.click(screen.getByRole('button', { name: /refactory workspace/i }))
  expect(getWorkspaceMenu()).toBeInTheDocument()
  expect(screen.queryByRole('menu', { name: 'Systems' })).not.toBeInTheDocument()
})
