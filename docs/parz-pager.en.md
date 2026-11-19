# Parz Pager

`ParzPager` is a set of pages you swipe through. The page follows the finger exactly, after a flick it springs onto the next one, and past the ends it stretches with resistance. Put anything inside: cards, onboarding, a gallery, lists.

- **loop**: `loop` — after the last page the strip keeps going the same way to the first, no rewind; without `loop` the first is first and the last is last, with resistance past the ends;
- **look**: `effect` — `'slide'`, `'scale'` (neighbours smaller and dimmer), `'tilt'` (a light 3D turn), `'fade'`; `peek` — how many px of the neighbours show at the edges;
- **dots and arrows**: `dots` — the active one stretches like a drop in the same frame as the strip, tap a dot to jump; `arrows` — glass circles at the edges: on desktop they pop in like a drop on hover and hide when the cursor leaves, on touch screens they are always visible; `theme` — for dark or light backgrounds;
- **autoplay**: `autoplay={3000}` — the active dot fills from the left over the timer; pauses while the pager is touched, hovered or focused; with `loop` — forward endlessly, without it — until the last page;
- **shadows**: the strip clips only horizontally, so card shadows above and below stay whole;
- **gesture**: a vertical swipe stays page scrolling, a horizontal one flips pages; a flick moves to the neighbour;
- **wheel and trackpad**: a horizontal gesture is one page; `wheel={false}` turns it off;
- **onProgress**: fractional position every frame — for dots, parallax or Parz Title Tabs; below 0 or above the last past the ends;
- **onRelease**: the position when the finger is lifted;
- **keyboard**: arrows, Home / End; hidden pages can't take focus;
- **ParzProvider**: the spring follows the preset; with `prefers-reduced-motion` — no animation.

```tsx
import { useState } from 'react';
import { ParzProvider, ParzPager } from '@carparkteam/parz-ui';
import '@carparkteam/parz-ui/style.css';

const [index, setIndex] = useState(0);

<ParzProvider motion="bouncy">
  <ParzPager index={index} onIndexChange={setIndex} onProgress={p => moveDots(p)}>
    <Slide1 />
    <Slide2 />
    <Slide3 />
  </ParzPager>
</ParzProvider>
```

| Prop | Default | What it does |
|---|---|---|
| `children` | — | Pages |
| `index` | — | Current page (controlled) |
| `defaultIndex` | `0` | Initial page |
| `onIndexChange` | — | Page changed |
| `onProgress` | — | Fractional position every frame |
| `onRelease` | — | Position when the finger is lifted |
| `effect` | `'slide'` | `'slide'`, `'scale'`, `'tilt'`, `'fade'` |
| `pageWidth` | — | Max page width, px: in a wide container the page is centered with neighbours on both sides |
| `peek` | `0` | Px of neighbouring pages visible |
| `dots` | `false` | Dots under the pages |
| `arrows` | `false` | Arrows at the edges |
| `loop` | `false` | Endless strip: the first page comes after the last; without it the ends are fixed |
| `autoplay` | — | Flip on its own every N ms |
| `paused` | `false` | Pause autoplay from outside |
| `theme` | `'dark'` | Dots and arrows color: `'dark'` or `'light'` |
| `labels` | English | `prev`, `next`, `page` (`'Page {n}'`) |
| `gap` | `12` | Space between pages, px |
| `wheel` | `true` | Wheel and trackpad |
| `motion` | from `ParzProvider` | `'calm'`, `'bouncy'`, `'snappy'` |
| `ariaLabel` | — | Name for screen readers |
