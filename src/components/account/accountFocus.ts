/*
 * Account focus return — the single source of truth for where focus goes
 * after the account menu / Settings modal closes.
 *
 * The sidebar account trigger is always mounted (the sidebar is persistent
 * across routes and overlays), so the account overlays can return focus to
 * it by id. Keeping the id + helper in one tiny module avoids magic-string
 * duplication across the trigger and the two overlay components.
 */

export const ACCOUNT_TRIGGER_ID = 'account-trigger'

export function focusAccountTrigger(): void {
  document.getElementById(ACCOUNT_TRIGGER_ID)?.focus()
}
