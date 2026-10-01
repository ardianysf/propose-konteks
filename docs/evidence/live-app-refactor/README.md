# V2 live-workflow refactor evidence

[Coverage matrix and reference limitations](coverage.md)

The prototype follows the inspected live information architecture with the proposed design-system tokens and components. Data and commands are illustrative. Session and product reducer changes are memory-only; the existing settings/customization store retains its existing local persistence. Reload restores fixture records, while direct links restore the selected route and fixture record.

## Screenshots

148 screenshots cover 37 menu, detail, dialog and state layouts. Desktop is 1440×900; mobile is 390×844. Captures use illustrative fixtures exclusively. Production reference captures are excluded.

| Surface | Light desktop | Dark desktop | Light mobile | Dark mobile |
| --- | --- | --- | --- | --- |
| activities | [View](screenshots/activities-light-1440.jpg) | [View](screenshots/activities-dark-1440.jpg) | [View](screenshots/activities-light-390.jpg) | [View](screenshots/activities-dark-390.jpg) |
| connect-runtime | [View](screenshots/connect-runtime-light-1440.jpg) | [View](screenshots/connect-runtime-dark-1440.jpg) | [View](screenshots/connect-runtime-light-390.jpg) | [View](screenshots/connect-runtime-dark-390.jpg) |
| customize-access | [View](screenshots/customize-access-light-1440.jpg) | [View](screenshots/customize-access-dark-1440.jpg) | [View](screenshots/customize-access-light-390.jpg) | [View](screenshots/customize-access-dark-390.jpg) |
| customize-connectors | [View](screenshots/customize-connectors-light-1440.jpg) | [View](screenshots/customize-connectors-dark-1440.jpg) | [View](screenshots/customize-connectors-light-390.jpg) | [View](screenshots/customize-connectors-dark-390.jpg) |
| customize-context | [View](screenshots/customize-context-light-1440.jpg) | [View](screenshots/customize-context-dark-1440.jpg) | [View](screenshots/customize-context-light-390.jpg) | [View](screenshots/customize-context-dark-390.jpg) |
| customize-mcps | [View](screenshots/customize-mcps-light-1440.jpg) | [View](screenshots/customize-mcps-dark-1440.jpg) | [View](screenshots/customize-mcps-light-390.jpg) | [View](screenshots/customize-mcps-dark-390.jpg) |
| customize-models | [View](screenshots/customize-models-light-1440.jpg) | [View](screenshots/customize-models-dark-1440.jpg) | [View](screenshots/customize-models-light-390.jpg) | [View](screenshots/customize-models-dark-390.jpg) |
| customize-operations | [View](screenshots/customize-operations-light-1440.jpg) | [View](screenshots/customize-operations-dark-1440.jpg) | [View](screenshots/customize-operations-light-390.jpg) | [View](screenshots/customize-operations-dark-390.jpg) |
| customize-runtimes | [View](screenshots/customize-runtimes-light-1440.jpg) | [View](screenshots/customize-runtimes-dark-1440.jpg) | [View](screenshots/customize-runtimes-light-390.jpg) | [View](screenshots/customize-runtimes-dark-390.jpg) |
| customize-skills | [View](screenshots/customize-skills-light-1440.jpg) | [View](screenshots/customize-skills-dark-1440.jpg) | [View](screenshots/customize-skills-light-390.jpg) | [View](screenshots/customize-skills-dark-390.jpg) |
| customize-tools | [View](screenshots/customize-tools-light-1440.jpg) | [View](screenshots/customize-tools-dark-1440.jpg) | [View](screenshots/customize-tools-light-390.jpg) | [View](screenshots/customize-tools-dark-390.jpg) |
| customize-vcs | [View](screenshots/customize-vcs-light-1440.jpg) | [View](screenshots/customize-vcs-dark-1440.jpg) | [View](screenshots/customize-vcs-light-390.jpg) | [View](screenshots/customize-vcs-dark-390.jpg) |
| empty | [View](screenshots/empty-light-1440.jpg) | [View](screenshots/empty-dark-1440.jpg) | [View](screenshots/empty-light-390.jpg) | [View](screenshots/empty-dark-390.jpg) |
| error | [View](screenshots/error-light-1440.jpg) | [View](screenshots/error-dark-1440.jpg) | [View](screenshots/error-light-390.jpg) | [View](screenshots/error-dark-390.jpg) |
| issues | [View](screenshots/issues-light-1440.jpg) | [View](screenshots/issues-dark-1440.jpg) | [View](screenshots/issues-light-390.jpg) | [View](screenshots/issues-dark-390.jpg) |
| leaderboard | [View](screenshots/leaderboard-light-1440.jpg) | [View](screenshots/leaderboard-dark-1440.jpg) | [View](screenshots/leaderboard-light-390.jpg) | [View](screenshots/leaderboard-dark-390.jpg) |
| loading | [View](screenshots/loading-light-1440.jpg) | [View](screenshots/loading-dark-1440.jpg) | [View](screenshots/loading-light-390.jpg) | [View](screenshots/loading-dark-390.jpg) |
| local-setup | [View](screenshots/local-setup-light-1440.jpg) | [View](screenshots/local-setup-dark-1440.jpg) | [View](screenshots/local-setup-light-390.jpg) | [View](screenshots/local-setup-dark-390.jpg) |
| new-initiative | [View](screenshots/new-initiative-light-1440.jpg) | [View](screenshots/new-initiative-dark-1440.jpg) | [View](screenshots/new-initiative-light-390.jpg) | [View](screenshots/new-initiative-dark-390.jpg) |
| payment-history | [View](screenshots/payment-history-light-1440.jpg) | [View](screenshots/payment-history-dark-1440.jpg) | [View](screenshots/payment-history-light-390.jpg) | [View](screenshots/payment-history-dark-390.jpg) |
| profile | [View](screenshots/profile-light-1440.jpg) | [View](screenshots/profile-dark-1440.jpg) | [View](screenshots/profile-light-390.jpg) | [View](screenshots/profile-dark-390.jpg) |
| releases | [View](screenshots/releases-light-1440.jpg) | [View](screenshots/releases-dark-1440.jpg) | [View](screenshots/releases-light-390.jpg) | [View](screenshots/releases-dark-390.jpg) |
| runtime | [View](screenshots/runtime-light-1440.jpg) | [View](screenshots/runtime-dark-1440.jpg) | [View](screenshots/runtime-light-390.jpg) | [View](screenshots/runtime-dark-390.jpg) |
| runtime-detail | [View](screenshots/runtime-detail-light-1440.jpg) | [View](screenshots/runtime-detail-dark-1440.jpg) | [View](screenshots/runtime-detail-light-390.jpg) | [View](screenshots/runtime-detail-dark-390.jpg) |
| settings-budgets | [View](screenshots/settings-budgets-light-1440.jpg) | [View](screenshots/settings-budgets-dark-1440.jpg) | [View](screenshots/settings-budgets-light-390.jpg) | [View](screenshots/settings-budgets-dark-390.jpg) |
| settings-general | [View](screenshots/settings-general-light-1440.jpg) | [View](screenshots/settings-general-dark-1440.jpg) | [View](screenshots/settings-general-light-390.jpg) | [View](screenshots/settings-general-dark-390.jpg) |
| settings-payments | [View](screenshots/settings-payments-light-1440.jpg) | [View](screenshots/settings-payments-dark-1440.jpg) | [View](screenshots/settings-payments-light-390.jpg) | [View](screenshots/settings-payments-dark-390.jpg) |
| settings-plan | [View](screenshots/settings-plan-light-1440.jpg) | [View](screenshots/settings-plan-dark-1440.jpg) | [View](screenshots/settings-plan-light-390.jpg) | [View](screenshots/settings-plan-dark-390.jpg) |
| settings-usage | [View](screenshots/settings-usage-light-1440.jpg) | [View](screenshots/settings-usage-dark-1440.jpg) | [View](screenshots/settings-usage-light-390.jpg) | [View](screenshots/settings-usage-dark-390.jpg) |
| support | [View](screenshots/support-light-1440.jpg) | [View](screenshots/support-dark-1440.jpg) | [View](screenshots/support-light-390.jpg) | [View](screenshots/support-dark-390.jpg) |
| system-detail | [View](screenshots/system-detail-light-1440.jpg) | [View](screenshots/system-detail-dark-1440.jpg) | [View](screenshots/system-detail-light-390.jpg) | [View](screenshots/system-detail-dark-390.jpg) |
| systems | [View](screenshots/systems-light-1440.jpg) | [View](screenshots/systems-dark-1440.jpg) | [View](screenshots/systems-light-390.jpg) | [View](screenshots/systems-dark-390.jpg) |
| tool-detail | [View](screenshots/tool-detail-light-1440.jpg) | [View](screenshots/tool-detail-dark-1440.jpg) | [View](screenshots/tool-detail-light-390.jpg) | [View](screenshots/tool-detail-dark-390.jpg) |
| updates | [View](screenshots/updates-light-1440.jpg) | [View](screenshots/updates-dark-1440.jpg) | [View](screenshots/updates-light-390.jpg) | [View](screenshots/updates-dark-390.jpg) |
| work | [View](screenshots/work-light-1440.jpg) | [View](screenshots/work-dark-1440.jpg) | [View](screenshots/work-light-390.jpg) | [View](screenshots/work-dark-390.jpg) |
| work-detail | [View](screenshots/work-detail-light-1440.jpg) | [View](screenshots/work-detail-dark-1440.jpg) | [View](screenshots/work-detail-light-390.jpg) | [View](screenshots/work-detail-dark-390.jpg) |
| work-locally | [View](screenshots/work-locally-light-1440.jpg) | [View](screenshots/work-locally-dark-1440.jpg) | [View](screenshots/work-locally-light-390.jpg) | [View](screenshots/work-locally-dark-390.jpg) |

## Validation results

Verified on 1 October 2026 using Chromium:

| Check | Result |
| --- | --- |
| Type checking | Passed (`tsc -b`) |
| Production build | Passed |
| Unit/component tests | 61 files, 1,471 tests passed |
| Full Playwright suite | 169 passed, 111 pre-existing retired V1 tests skipped, zero failures |
| Menu/detail evidence matrix | 112 tests passed (108 surface combinations plus four dialog/state flows) |
| Assets | 5/5 verified |
| Catalog manifest | 57 entries verified; 53 visual entries smoke-tested |
| Diff whitespace | Passed |

## Reproduction

```sh
npm run typecheck
npm run build
npm test
npm run verify:assets
npm run verify:manifest
npm run test:e2e -- --workers=4
KONTEKS_CAPTURE_EVIDENCE=1 npm run test:e2e -- tests/e2e/product-evidence.spec.ts --workers=4
```

The evidence suite checks headings, themes, document/main overflow, and Axe WCAG 2 A/AA on all 108 menu/detail combinations. Behavior tests cover browser history, record selection, filtering, validated forms, local changes, runtime actions, error retry, mobile dialog focus containment and focus return. The catalog smoke follows all 53 visual manifest entries. V2 composer smoke verifies repository-dialog focus return and creating a session.

Pre-existing retired V1 suites remain marked `fixme` in the repository; they are reported separately as skipped, not claimed as passing. The active shell regression tests now target `/v2`.

## Reference limits

Live Issues and Releases were empty, so no inaccessible record detail was invented. Access, Models and Skills content remained loading; tool versions failed to load. Budgets was unavailable. Plan content could not be verified after its initial loading state; the existing proposed billing components were retained. External support and all production system-management routes were not inspected. See the coverage matrix for each counterpart and limitation.
