import { describe, expect, it } from 'vitest'
import { initialState, mockupReducer } from '../../state/mockupReducer'
import { initialProductState, productReducer } from './productState'
import { readV2Location, v2Path } from './navigation'

describe('product prototype state', () => {
  it('creates initiatives with a stable distinct identity and preserves existing records', () => {
    const before = initialProductState()
    const existing = structuredClone(before.initiatives)
    const after = productReducer(before, {
      kind: 'create-initiative',
      title: '  Ship a better checkout  ',
      systemId: 'bsi-hris',
    })
    expect(after.initiatives[0].title).toBe('Ship a better checkout')
    expect(after.selectedId).toBe(after.initiatives[0].id)
    expect(after.initiatives.slice(1)).toEqual(existing)
    expect(before.initiatives).toEqual(existing)
    const again = productReducer(after, {
      kind: 'create-initiative',
      title: 'Another initiative',
      systemId: 'bsi-hris',
    })
    expect(new Set(again.initiatives.map((i) => i.id)).size).toBe(
      again.initiatives.length,
    )
  })
  it('rejects blank initiatives and unknown Software Systems', () => {
    const state = initialState()
    expect(
      mockupReducer(state, {
        type: 'PRODUCT',
        action: {
          kind: 'create-initiative',
          title: '   ',
          systemId: 'bsi-hris',
        },
      }),
    ).toBe(state)
    expect(
      mockupReducer(state, {
        type: 'PRODUCT',
        action: {
          kind: 'create-initiative',
          title: 'A plan',
          systemId: 'missing',
        },
      }),
    ).toBe(state)
  })
  it('posts notes, toggles reactions and adds comments to only the selected initiative', () => {
    const before = initialProductState()
    const action = {
      kind: 'post-note',
      initiativeId: 'initiative-1',
      body: '  Keep the totals visible  ',
      attachment: 'meeting.txt',
    } as const
    const after = productReducer(before, action)
    const note = after.initiatives[0].notes.at(-1)!
    expect(note.body).toBe('Keep the totals visible')
    expect(note.attachment).toBe('meeting.txt')
    expect(after.initiatives[1]).toBe(before.initiatives[1])
    const reacted = productReducer(after, {
      kind: 'react',
      initiativeId: 'initiative-1',
      noteId: note.id,
      reaction: 'Like',
    })
    expect(reacted.initiatives[0].notes.at(-1)?.reactions).toEqual(['Like'])
    const unreacted = productReducer(reacted, {
      kind: 'react',
      initiativeId: 'initiative-1',
      noteId: note.id,
      reaction: 'Like',
    })
    expect(unreacted.initiatives[0].notes.at(-1)?.reactions).toEqual([])
    const commented = productReducer(after, {
      kind: 'comment',
      initiativeId: 'initiative-1',
      noteId: note.id,
      body: '  Agreed  ',
    })
    expect(commented.initiatives[0].notes.at(-1)?.comments).toEqual(['Agreed'])
    expect(before.initiatives[0].notes).toHaveLength(1)
  })
  it('validates runtime setup and updates only that runtime', () => {
    const before = initialProductState()
    expect(
      productReducer(before, {
        kind: 'create-runtime',
        name: '   ',
        platform: 'Linux',
        workloads: ['Planning'],
      }),
    ).toBe(before)
    expect(
      productReducer(before, {
        kind: 'create-runtime',
        name: 'Build',
        platform: 'Linux',
        workloads: [],
      }),
    ).toBe(before)
    const after = productReducer(before, {
      kind: 'create-runtime',
      name: 'Build',
      platform: 'Linux',
      workloads: ['Planning'],
    })
    expect(after.runtimes.at(-1)?.status).toBe('Not connected')
    const updated = productReducer(after, {
      kind: 'update-runtime',
      id: after.selectedId,
      changes: { name: 'Build node', status: 'Draining', previews: true },
    })
    expect(updated.runtimes.at(-1)).toMatchObject({
      name: 'Build node',
      status: 'Draining',
      previews: true,
    })
    expect(updated.runtimes[0]).toBe(before.runtimes[0])
  })
})
describe('V2 deep links', () => {
  it.each([
    [
      '/v2/work-detail/initiative-2',
      '?from=activities',
      'work-detail',
      'initiative-2',
    ],
    ['/v2/runtime/runtime-mac', '', 'runtime', 'runtime-mac'],
    ['/v2/customize/tools/tool-1', '', 'customize-page', 'tool-1'],
    ['/v2/settings/usage', '', 'settings-page', ''],
  ])('reads and round-trips %s', (pathname, search, route, id) => {
    const action = readV2Location({ pathname, search })
    expect(action).toMatchObject({ route, id })
    const state = mockupReducer(initialState(), action)
    expect(v2Path(state, search)).toBe(pathname + search)
  })
  it('retains demo variant query and the correct return-to-list destination', () => {
    const action = readV2Location({
      pathname: '/v2/work-detail/initiative-1',
      search: '?mock=error&from=activities',
    })
    const state = mockupReducer(initialState('?mock=error'), action)
    expect(state.demoVariant).toBe('error')
    expect(state.product.returnRoute).toBe('activities')
    expect(v2Path(state, '?mock=error&from=activities')).toBe(
      '/v2/work-detail/initiative-1?mock=error&from=activities',
    )
  })
  it('handles unknown routes and malformed record identifiers', () => {
    expect(readV2Location({ pathname: '/v2/nope', search: '' }).route).toBe(
      'new-session',
    )
    expect(
      readV2Location({ pathname: '/v2/work-detail/%ZZ', search: '' }).id,
    ).toBe('')
  })
})
