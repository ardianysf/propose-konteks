import type {
  MockupAction,
  MockupRoute,
  MockupState,
} from '../../state/mockupReducer'
import {
  CUSTOMIZE_SECTIONS,
  PRODUCT_ROUTES,
  SETTINGS_SECTIONS,
  type ProductCustomizeSection,
  type ProductSettingsSection,
} from './productState'
const LEGACY_ROUTES: readonly MockupRoute[] = [
  'new-session',
  'session-history',
  'session-detail',
  'task-session-detail',
  'session-demo',
  'session-stream-detail',
]
const PATHS: Partial<Record<MockupRoute, string>> = {
  'customize-page': 'customize',
  'settings-page': 'settings',
}
export function readV2Location(
  location: Pick<Location, 'pathname' | 'search'>,
): Extract<MockupAction, { type: 'NAVIGATE_PRODUCT' }> {
  const segments = location.pathname
    .replace(/^\/v2\/?/, '')
    .split('/')
    .filter(Boolean)
  const key = segments[0] || 'new-session'
  const route =
    key === 'customize'
      ? 'customize-page'
      : key === 'settings'
        ? 'settings-page'
        : ([...PRODUCT_ROUTES, ...LEGACY_ROUTES].find((r) => r === key) ??
          'new-session')
  const query = new URLSearchParams(location.search)
  const from = PRODUCT_ROUTES.find((r) => r === query.get('from'))
  let id = ''
  try {
    id = decodeURIComponent(segments[key === 'customize' ? 2 : 1] ?? '')
  } catch {
    /* malformed links render the not-found state */
  }
  return {
    type: 'NAVIGATE_PRODUCT',
    route,
    id: [
      'work-detail',
      'runtime',
      'systems',
      'task-session-detail',
      'customize-page',
    ].includes(route)
      ? id
      : '',
    from,
    customizeSection: CUSTOMIZE_SECTIONS.find((s) => s === segments[1]) as
      ProductCustomizeSection | undefined,
    settingsSection: SETTINGS_SECTIONS.find((s) => s === segments[1]) as
      ProductSettingsSection | undefined,
  }
}
export function v2Path(state: MockupState, search = ''): string {
  const route = state.route
  let path = route === 'new-session' ? '/v2' : `/v2/${PATHS[route] ?? route}`
  if (route === 'customize-page')
    path += `/${state.product.customizeSection}${state.product.selectedId ? '/' + encodeURIComponent(state.product.selectedId) : ''}`
  else if (route === 'settings-page')
    path += `/${state.product.settingsSection}`
  else if (
    ['work-detail', 'runtime', 'systems'].includes(route) &&
    state.product.selectedId
  )
    path += `/${encodeURIComponent(state.product.selectedId)}`
  else if (route === 'task-session-detail')
    path += `/${encodeURIComponent(state.activeTaskSessionId)}`
  const query = new URLSearchParams(search)
  query.delete('from')
  if (route === 'work-detail') query.set('from', state.product.returnRoute)
  return path + (query.size ? `?${query}` : '')
}
