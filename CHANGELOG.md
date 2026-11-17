# Changelog

**English** · [Հայերեն](CHANGELOG.hy.md) · [Русский](CHANGELOG.ru.md)

All notable changes to Parz UI. Versions follow [semantic versioning](https://semver.org): **patch** — fixes, **minor** — new components and options, **major** — changes that may break existing code.

Update in your project:

```bash
npm update @carparkteam/parz-ui
```

## Unreleased

### Added
- **Parz Video**: playlists — `playlist` with “previous / next”, a list with thumbnails, an “Up next” card with a countdown and smooth switching between videos; `Shift+N` / `Shift+P`.
- **Parz Video**: “Auto” quality, on by default (`defaultQuality="auto"`) — picked by player size, screen density and network, and lowered if the video keeps stalling.

### Fixed
- **Parz Video**: on touch screens the controls no longer hide right after a tap; no endless loader in iOS/iPadOS Safari; the iPhone system full screen now keeps the chosen speed and subtitles; a compact layout for very small players; picture-in-picture and AirPlay sit on the left above the timeline; chapters are marked with thin lines on a continuous timeline; calmer, smaller subtitles on phones; while casting, the player shows a placeholder with a “Play here” button instead of a black screen. The same placeholder covers the browser’s black “picture in picture” screen, with a “Back to player” button.

### Changed
- **Parz Video**: subtitles are off by default even when tracks are given; `default` now picks the track the C key turns on.

## 1.1.0 — 2026-11-16

### Added
- **Parz Button** (`ParzButton`) — button that gently squeezes when pressed while a drop spreads from the touch point; five looks (`solid`, `soft`, `outline`, `ghost`, `glass`), icons, links and smooth loading.
- **Parz Progress** (`ParzProgress`) — progress bar or ring where the fill flows to each new value; unknown-duration mode, states (`success`, `warning`, `error`, `paused`), a soft glow at 100% and a beta `successMorph`: on success the bar turns into a circle with a check.
- **Parz Badge** (`ParzBadge`) — label or counter that appears like a drop; digits roll and the width flows when the number changes; on its own or in the corner of a button, with a pulsing dot.
- **Parz Video** (`ParzVideo`) — video player in liquid glass with an Apple-style layout: play/pause with −10 / +10 in the center, a timeline capsule and separate capsules for volume, quality, subtitles, speed, picture in picture, cast and full screen; a compact layout for phones. Quality switching with a frame crossfade and an automatic 4K / HD mark, chapters, a frame preview on the timeline, WebVTT subtitles, an audio format badge (e.g. Dolby Atmos), a poster that fades out on start and returns at the end, a right-click menu, keyboard shortcuts and two motion styles — `liquid` (elements appear and hide like drops) and `fade`.

### Changed
- Parz Toggle: the thumb is now a capsule, like on iOS, and the track is a little longer. While pressed, dragged or switching, the thumb swells well past the track and turns into translucent glass with a light rim, then settles back.
- Parz Slider and Parz Range: the thumb is now a capsule too; while pressed or dragged it swells past the track and turns into clear glass with a light rim, then settles back.

### Fixed
- Parz Checkbox: no more small black dots on the box in Safari on iPhone and iPad.
- Parz Slider and Parz Range: on phones the thumb now stays right under the finger while dragging instead of lagging behind.

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
