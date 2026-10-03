# Design QA — 小米 15 全屏适配

## Source visual truth

- User device evidence: `C:\Users\Lenovo\AppData\Local\Temp\codex-clipboard-4ef7b547-8a3c-449e-a5f5-f8aa4fcb70a6.jpg`
- Design reference: `references/01-月度总览-毛玻璃增强.png`
- Implementation screenshot: `qa/xiaomi15-after.png`
- Side-by-side evidence: `qa/xiaomi15-comparison.png`

## Viewport and state

- Device target: Xiaomi 15 portrait.
- CSS viewport: `400 × 890`.
- Device scale factor: `3`.
- Implementation pixels: `1200 × 2670`.
- Source user screenshot pixels: `1200 × 2670`.
- State: home screen, October demo data, Android user agent, touch input.
- Density normalization: implementation was captured directly at the same physical pixel dimensions as the user screenshot. The design reference was cropped to its app content and proportionally resized in the side-by-side sheet; its iPhone chrome is not treated as Android app content.

## Comparison history

### Iteration 1 — blocked

- [P1] Desktop device preview appeared inside the installed mobile PWA.
  - Evidence: the user screenshot showed the `iPhone` picker, large outer canvas, simulated device screen, duplicate status area, and a scaled-down app.
  - Impact: the app used only part of the Xiaomi 15 display and did not feel like an installed app.
  - Fix: added a native viewport mode for installed PWAs and narrow touch devices while retaining the framed preview on desktop.
- [P1] Preview assets used root-relative paths and failed under the GitHub Pages `/xiaohebao/` base path.
  - Evidence: broken bezel and status-indicator images were visible in the user screenshot.
  - Fix: all runtime assets now resolve through Vite's deployment base URL.
- [P1] The simulated keyboard would have competed with the Android system keyboard.
  - Fix: native viewport mode uses the phone keyboard and does not mount the simulated keyboard dock.

### Iteration 2 — passed

- Post-fix evidence: `qa/xiaomi15-after.png` and `qa/xiaomi15-comparison.png`.
- The app screen measures exactly `400 × 890` CSS px and fills the viewport.
- Device picker, simulated bezel, status bar, home indicator, camera, cursor, and simulated keyboard are absent on the Xiaomi target.
- Desktop verification remains `393 × 852` for the iPhone screen with picker, loaded bezel, status bar, and home indicator intact.
- No horizontal overflow or browser console errors were observed.

## Required fidelity surfaces

- Fonts and typography: hierarchy, weights, line wrapping, numeric emphasis, and Chinese system-font fallbacks remain consistent with the selected mock.
- Spacing and layout rhythm: content now uses the Xiaomi viewport directly; the top margin, card spacing, category rhythm, and floating navigation remain balanced without the desktop canvas.
- Colors and visual tokens: blue/green budget semantics, pale category fills, translucent cards, shadows, and ambient background are unchanged.
- Image quality and asset fidelity: no broken runtime images remain. App icons continue to use the existing Phosphor icon set; desktop-only device assets load correctly.
- Copy and content: budget values, categories, recent records, and navigation labels are preserved.

## Functional verification

- Runtime integrity: 28 protected files passed the lock check after the approved runtime update.
- Runtime suite: 8/8 tests passed.
- Android input: `记一笔` opens the amount field with focus while the simulated keyboard remains unmounted.
- Desktop preview: picker, frame, status bar, home indicator, and 1:1 iPhone screen remain functional.
- Primary interactions checked: home navigation and entering the add-expense screen.
- Console errors checked: none.
- Update delivery: service worker cache upgraded to `glass-finance-v3`; navigations use network-first with an offline cached fallback so installed phones receive new releases.

## Follow-up polish

- P3: Xiaomi models with unusually large accessibility font scaling may need a separate typography pass after another real-device screenshot.

final result: passed
