/*
 * App — owns the single mockup store and provides it to the tree.
 * The ?mock= query parameter is parsed exactly once, here (Task 3
 * contract — initialState owns that parsing). All chrome lives in
 * AppShell; this component stays the provider boundary only.
 */
import { useReducer } from 'react'
import AppShell from './components/shell/AppShell'
import { initialState, mockupReducer } from './state/mockupReducer'
import { MockupProvider } from './state/MockupContext'

export default function App() {
  const [state, dispatch] = useReducer(mockupReducer, initialState(window.location.search))

  return (
    <MockupProvider value={{ state, dispatch }}>
      <AppShell />
    </MockupProvider>
  )
}
