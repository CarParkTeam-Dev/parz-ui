# Parz Title Tabs

`ParzTitleTabs` is a strip of large title tabs. Swipe it or tap a title. The active title is bright, the neighbours fade. The circled icon and the item color flow along with the finger. Pull the first item and “Add” slides in from the left, firing `onAdd`.

- **list over the container**: tapping the selected title opens a list of all items over the block (`listContainer`, the parent by default): jump to an item, “New” (`onAdd`), “Reorder” — drag the rows (`onReorder(from, to)`), “•••” per item (`onItemMore(index, anchor)`), your own actions (`listActions`); Esc or a tap outside closes it; `listOpen` / `onListOpenChange` or `ref.openList()` / `closeList()`;
- **pages are anything**: the titles don't care what's below; put any elements and components inside `ParzPager`;
- **items**: `{ label, count?, icon?, color?, iconColor? }`; the count flips like Parz Number Flow;
- **color**: `--parz-accent` with the current item color — on the component and on the `accentRef` element, so the whole page can recolor with it;
- **pull to add**: `onAdd`, `addLabel`, `addThreshold`; without `onAdd` the edge just resists;
- **with Parz Pager**: via `ref` — `setProgress(p)` from the pager's `onProgress` and `release(p)` from `onRelease`; titles follow the finger without React re-renders;
- **keyboard**: arrows, Home / End; `tablist` / `tab` roles;
- **ParzProvider**: the spring follows `calm` / `bouncy` / `snappy`; with `prefers-reduced-motion` — no animation.

```tsx
import { useRef, useState } from 'react';
import { ParzProvider, ParzTitleTabs, ParzPager, type ParzTitleTabsHandle } from '@carparkteam/parz-ui';
import '@carparkteam/parz-ui/style.css';

const lists = [
  { label: 'Today', count: 0, icon: 'ms:star', color: '#e8b923' },
  { label: 'Work', count: 2, icon: 'ms:work', color: '#4d9bff' },
];
const tabs = useRef<ParzTitleTabsHandle>(null);
const page = useRef<HTMLDivElement>(null);
const [index, setIndex] = useState(0);

<ParzProvider motion="bouncy">
  <div ref={page}>
    <ParzTitleTabs ref={tabs} items={lists} index={index} onIndexChange={setIndex} accentRef={page} onAdd={addList} />
    <ParzPager index={index} onIndexChange={setIndex}
      onProgress={p => tabs.current?.setProgress(p)} onRelease={p => tabs.current?.release(p)}>
      {lists.map(l => <TaskList key={l.label} list={l} />)}
    </ParzPager>
  </div>
</ParzProvider>
```

| Prop | Default | What it does |
|---|---|---|
| `items` | — | Items |
| `index` | — | Selected item (controlled) |
| `defaultIndex` | `0` | Initial item |
| `onIndexChange` | — | Item changed |
| `onAdd` | — | The first item was pulled past the threshold |
| `addLabel` | `'Add'` | “Add” label |
| `addThreshold` | `0.22` | Threshold, in item widths |
| `accentRef` | — | Where else to write `--parz-accent` |
| `size` | `'lg'` | `'lg'` or `'md'` |
| `theme` | `'dark'` | `'dark'` or `'light'` |
| `motion` | from `ParzProvider` | `'calm'`, `'bouncy'`, `'snappy'` |
| `list` | `true` | List over the container on tapping the selected title |
| `listOpen`, `defaultListOpen`, `onListOpenChange` | — | Whether the list is open |
| `listContainer` | parent | What the list covers (a static parent gets `position: relative` for the time) |
| `onReorder` | — | `(from, to)` — items were dragged; without it there's no “Reorder” |
| `onItemMore` | — | `(index, anchor)` — the “•••” button; without it there's none |
| `listActions` | — | Your actions: `{ id, label, icon?, onClick }[]` |
| `labels` | English | `new`, `reorder`, `done`, `more`, `list` |
| `ariaLabel` | — | Name for screen readers |
