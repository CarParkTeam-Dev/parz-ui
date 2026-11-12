# Changelog

**English** · [Հայերեն](CHANGELOG.hy.md) · [Русский](CHANGELOG.ru.md)

All notable changes to Parz UI. Versions follow [semantic versioning](https://semver.org): **patch** — fixes, **minor** — new components and options, **major** — changes that may break existing code.

Update in your project:

```bash
npm update @carparkteam/parz-ui
```

## Unreleased

## 1.0.2 — 2026-11-12

### Added
- Test versions: new features can be tried before the release with `npm install @carparkteam/parz-ui@next`. A regular install keeps the stable version.

### Changed
- The playground in this repository now focuses on the library: components with live editors and docs, plus the changelog (`npm run dev`).
- The update check on the “What’s new” page now speaks up only when a newer version is out.

## 1.0.1 — 2026-11-12

### Added
- “What’s new” page on the site with this changelog in three languages.
- The current version is shown next to the install command on the home page.
- `CHANGELOG.md` is now shipped with the package.
- The “What’s new” page tells you when a newer version of Parz UI is out.

### Fixed
- **Parz Menu:** tapping the search field on iPhone (Safari) and some Android browsers no longer zooms the page — on touch screens the field text is now 16 px.

## 1.0.0 — 2026-11-11

First public release on npm as `@carparkteam/parz-ui`.

### Added
- **Parz Menu** (`ParzMenu`) — navigation bar where the highlight flows between tabs like a drop; on desktop it turns into a header with search.
- **Parz Toggle** (`ParzToggle`) — switch with a liquid, draggable thumb and a “too fast” rejected state (`cooldown`, `canChange`, `onReject`).
- **Parz Checkbox** (`ParzCheckbox`) — color spreads like a drop, the tick draws itself; indeterminate and error states.
- **Parz Slider** (`ParzSlider`) — the thumb stretches with the speed of the drag.
- **Parz Range** (`ParzRange`) — 2 to 5 thumbs on one track, `minDistance`, `fill="pairs"`.
- **AnimoLogo** — living text logo.
- **ParzCredit** — ready-made “Components by CarPark Team” attribution required by the license.
- Playground site with a live editor and docs for every component in English, Russian and Armenian.
