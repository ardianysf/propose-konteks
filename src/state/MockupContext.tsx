/*
 * Konteks — mockup state context (Task 4, plan step 3).
 * Minimal typed bridge between App's useReducer store and feature
 * components. App owns the single reducer instance and provides it here;
 * features read state and dispatch actions exclusively through useMockup.
 */
import { createContext, useContext } from 'react'
import type { Dispatch, ReactNode } from 'react'
import type { MockupAction, MockupState } from './mockupReducer'

export interface MockupContextValue {
  state: MockupState
  dispatch: Dispatch<MockupAction>
}

export const MockupContext = createContext<MockupContextValue | null>(null)
MockupContext.displayName = 'Mockup'

export function MockupProvider({ value, children }: { value: MockupContextValue; children: ReactNode }) {
  return <MockupContext.Provider value={value}>{children}</MockupContext.Provider>
}

export function useMockup(): MockupContextValue {
  const value = useContext(MockupContext)
  if (!value) {
    throw new Error('useMockup: no MockupContext.Provider above — App must provide the mockup store')
  }
  return value
}
