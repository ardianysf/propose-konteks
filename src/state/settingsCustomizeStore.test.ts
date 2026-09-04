import {
  getSettingsCustomizeState,
  INITIAL_SETTINGS_CUSTOMIZE_STATE,
  resetSettingsCustomizeStore,
  updateSettingsCustomizeState,
} from './settingsCustomizeStore'

describe('settings/customize session store', () => {
  beforeEach(() => resetSettingsCustomizeStore())

  it('preserves mutations while overlays close and reopen', () => {
    updateSettingsCustomizeState((state) => ({ ...state, displayName: 'Dewi Owner' }))
    expect(getSettingsCustomizeState().displayName).toBe('Dewi Owner')
    expect(getSettingsCustomizeState()).not.toBe(INITIAL_SETTINGS_CUSTOMIZE_STATE)
  })

  it('supports typed mock CRUD without mutating the initial fixture', () => {
    const created = { id: 'group-quality', slug: 'refactory-quality', displayName: 'Quality', description: 'Quality engineering', role: 'member' as const, memberIds: [], protected: false }
    updateSettingsCustomizeState((state) => ({ ...state, groups: [...state.groups, created] }))
    expect(getSettingsCustomizeState().groups).toContainEqual(created)
    updateSettingsCustomizeState((state) => ({ ...state, groups: state.groups.filter((group) => group.id !== created.id) }))
    expect(getSettingsCustomizeState().groups).not.toContainEqual(created)
    expect(INITIAL_SETTINGS_CUSTOMIZE_STATE.groups).not.toContainEqual(created)
  })

  it('derives direct group membership from member identifiers without creating an invitation', () => {
    updateSettingsCustomizeState((state) => ({
      ...state,
      groups: state.groups.map((group) => group.id === 'engineering'
        ? { ...group, memberIds: [...group.memberIds, 'member-samira'] }
        : group),
    }))

    expect(getSettingsCustomizeState().groups.find((group) => group.id === 'engineering')?.memberIds).toContain('member-samira')
    expect(getSettingsCustomizeState().invitations).toHaveLength(1)
  })

  it('resets the complete mock domain deterministically', () => {
    updateSettingsCustomizeState((state) => ({ ...state, subscription: { ...state.subscription, planId: 'enterprise', planName: 'Enterprise' } }))
    resetSettingsCustomizeStore()
    expect(getSettingsCustomizeState()).toEqual(INITIAL_SETTINGS_CUSTOMIZE_STATE)
  })

  it('keeps Story Point, subscription, provider-money, and transaction facts separate', () => {
    const state = getSettingsCustomizeState()
    expect(state.storyPointLedger.currency).toBe('IDR')
    expect(state.subscription.includedStoryPoints).toBe(8000)
    expect(state.providers[0].externalSpend).toEqual(expect.objectContaining({ currency: 'IDR' }))
    expect(state.transactions[0]).toEqual(expect.objectContaining({ netAmount: expect.any(Number), taxAmount: expect.any(Number) }))
    expect(state.usageAnalytics).toEqual(expect.objectContaining({
      totalSessions: expect.any(Number),
      totalInputTokens: expect.any(Number),
      totalOutputTokens: expect.any(Number),
    }))
  })
})
