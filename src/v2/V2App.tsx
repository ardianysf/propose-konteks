/*
 * V2App — the /v2 provider boundary. Mirrors src/App.tsx exactly: the
 * single mockup store (useReducer + MockupProvider, ?mock= parsed once
 * by initialState) wrapping the V2 shell. No chrome lives here.
 */
import { useReducer } from 'react'
import { initialState, mockupReducer } from '../state/mockupReducer'
import { MockupProvider } from '../state/MockupContext'
import V2Shell from './V2Shell'

export default function V2App() {
  const [state, dispatch] = useReducer(mockupReducer, initialState(window.location.search))

  return (
    <MockupProvider value={{ state, dispatch }}>
      <V2Shell />
    </MockupProvider>
  )
}
