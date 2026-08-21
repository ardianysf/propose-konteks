/*
 * CatalogPreviewContext — signals when a component is being rendered
 * inside a catalog preview frame.
 *
 * Some production hooks (e.g. useFocusContainment) need to behave
 * differently in catalog previews: focus traps and modal semantics
 * would prevent catalog navigation (breadcrumb/backlink) from working
 * when the preview loads.
 *
 * Production app never provides this context, so all containment
 * remains enabled by default.
 */
import { createContext, useContext, type ReactNode } from 'react'

interface CatalogPreviewContextValue {
  /** Always true when this context is provided — catalog previews
   *  should not trap focus or enforce modal semantics. */
  isCatalogPreview: true
}

const CatalogPreviewContext = createContext<CatalogPreviewContextValue | null>(
  null,
)

export interface CatalogPreviewProviderProps {
  children: ReactNode
}

/**
 * Provider for catalog preview frames. Wraps LivePreview to disable
 * document-level focus traps and other containment that would block
 * catalog navigation.
 */
export function CatalogPreviewProvider({
  children,
}: CatalogPreviewProviderProps) {
  const value: CatalogPreviewContextValue = { isCatalogPreview: true }
  return (
    <CatalogPreviewContext.Provider value={value}>
      {children}
    </CatalogPreviewContext.Provider>
  )
}

/**
 * Hook for components that need to know if they're in a catalog preview.
 * Returns true only when rendered inside CatalogPreviewProvider.
 */
export function useIsCatalogPreview(): boolean {
  const context = useContext(CatalogPreviewContext)
  return context?.isCatalogPreview === true
}
