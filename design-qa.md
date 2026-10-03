# Design QA — 小荷包

## Source of truth

- `references/01-月度总览-毛玻璃增强.png`
- `references/02-快速记账-毛玻璃增强.png`
- `references/03-月度分析-毛玻璃增强.png`

QA was performed against iPhone content inside the supplied device frame. Pixel 10 was also checked as a responsive runtime target.

## Iteration 1

- P1: Home used a blue summary card and two-column category grid instead of the reference budget ring and vertical budget rows.
- P1: Analysis separated the donut and category list instead of using the reference two-column chart card.
- P1: The add-expense save action was partly covered by the persistent bottom navigation.
- P1: After dismissing the simulated keyboard, the browser could retain a scrolled device viewport.

## Corrections

- Rebuilt the home budget section with the month allowance, 43% ring, spent/remaining split, and six vertical category budget rows.
- Rebuilt analysis with total/remaining summary cards and a donut-plus-legend glass card.
- Tightened add-expense spacing so the save action remains fully reachable above navigation.
- Reset the device viewport after tab changes and successful saves.
- Fixed Android safe-area positioning so the glass navigation remains above Pixel system navigation.

## Final comparison evidence

- `qa/comparisons/01-home-v2.png`
- `qa/comparisons/02-add-v3.png`
- `qa/comparisons/03-analysis-v2.png`

The final app preserves the reference hierarchy, density, blue/green palette, rounded cards, and enhanced translucent-glass treatment. Intentional product differences are limited to functional additions: month switching, editable history below the fold, local-only settings, and install/offline support.

## Functional verification

- Added a ¥35 expense and verified monthly total, category total, remaining budget, record count, and analysis all updated together.
- Verified iPhone and Pixel 10 navigation placement.
- Verified keyboard dismissal and viewport restoration.
- Verified production build, Sites packaging, runtime integrity, and all eight mobile runtime tests.

final result: passed
