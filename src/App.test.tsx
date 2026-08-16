import { render, screen } from '@testing-library/react'
import App from './App'

it('renders the Konteks app root', () => {
  render(<App />)
  expect(screen.getByRole('heading', { name: /konteks/i })).toBeInTheDocument()
})
