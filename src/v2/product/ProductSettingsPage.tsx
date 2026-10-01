import { useState } from 'react'
import { useMockup } from '../../state/MockupContext'
import { GeneralPanel } from '../../components/account/SettingsModal'
import BillingWorkspace from '../../components/account/BillingWorkspace'
import type { BillingSubtab } from '../../state/mockupReducer'
import { SETTINGS_SECTIONS, SECTION_LABELS } from './productState'
import {
  ProductEmpty,
  ProductPageHeader,
  ProductStateGate,
} from './ProductPrimitives'

export default function ProductSettingsPage({
  profile = false,
}: {
  profile?: boolean
}) {
  const { state, dispatch } = useMockup()
  const section = profile ? 'general' : state.product.settingsSection
  const [workspaceName, setWorkspaceName] = useState(
    state.product.workspaceName,
  )
  const [saved, setSaved] = useState(false)
  const [paymentTab, setPaymentTab] = useState<BillingSubtab>('topup')
  const billingTab: BillingSubtab =
    section === 'plan'
      ? 'plans'
      : section === 'usage'
        ? 'usage'
        : section === 'budgets'
          ? 'budgets'
          : paymentTab
  return (
    <>
      <ProductPageHeader
        title={profile ? 'Profile' : 'Settings'}
        description={
          profile
            ? 'How your name appears to your team.'
            : 'Manage your workspace and preferences.'
        }
        onBack={() =>
          dispatch({ type: 'NAVIGATE_PRODUCT', route: 'activities' })
        }
        backLabel="Back to Activities"
      />
      <div className="kx-product-settings-layout">
        <nav aria-label="Settings" className="kx-product-section-nav">
          {SETTINGS_SECTIONS.map((s) => (
            <button
              key={s}
              aria-current={section === s ? 'page' : undefined}
              onClick={() =>
                dispatch({
                  type: 'NAVIGATE_PRODUCT',
                  route: 'settings-page',
                  settingsSection: s,
                })
              }
            >
              {SECTION_LABELS[s]}
            </button>
          ))}
        </nav>
        <section
          className="kx-product-panel"
          aria-label={profile ? 'Profile' : SECTION_LABELS[section]}
        >
          <ProductStateGate
            key={section}
            empty={
              <ProductEmpty title="No settings data">
                Settings will appear when this workspace is configured.
              </ProductEmpty>
            }
          >
            {section === 'general' ? (
              <div className="kx-stack">
                {!profile && (
                  <section className="kx-card">
                    <h3>Workspace</h3>
                    <p>
                      The name everyone in this workspace sees. Its id stays the
                      same.
                    </p>
                    <form
                      className="kx-form-row"
                      onSubmit={(e) => {
                        e.preventDefault()
                        if (!workspaceName.trim()) return
                        dispatch({
                          type: 'PRODUCT',
                          action: {
                            kind: 'workspace-name',
                            name: workspaceName,
                          },
                        })
                        setSaved(true)
                      }}
                    >
                      <label className="kx-field">
                        Workspace name
                        <input
                          required
                          value={workspaceName}
                          onChange={(e) => {
                            setWorkspaceName(e.target.value)
                            setSaved(false)
                          }}
                        />
                      </label>
                      <button
                        className="kx-button kx-button--primary"
                        disabled={!workspaceName.trim()}
                      >
                        Save workspace
                      </button>
                    </form>
                    {saved && <p role="status">Workspace saved</p>}
                  </section>
                )}
                <GeneralPanel />
              </div>
            ) : (
              <>
                {section === 'budgets' && (
                  <p className="kx-product-reference-note">
                    Budget controls were unavailable in the live workspace. The
                    existing proposed budget controls are retained below.
                  </p>
                )}
                {section === 'payments' && (
                  <div
                    className="kx-subtabs"
                    role="tablist"
                    aria-label="Payments"
                  >
                    {(['topup', 'transactions'] as const).map((t) => (
                      <button
                        role="tab"
                        key={t}
                        aria-selected={paymentTab === t}
                        onClick={() => setPaymentTab(t)}
                      >
                        {t === 'topup' ? 'Buy Story Points' : 'Payment history'}
                      </button>
                    ))}
                  </div>
                )}
                <BillingWorkspace
                  subtab={billingTab}
                  select={setPaymentTab}
                  demoVariant={state.demoVariant}
                  showTabs={false}
                />
              </>
            )}
          </ProductStateGate>
        </section>
      </div>
    </>
  )
}
