# Parz Title Tabs

`ParzTitleTabs`-ը խոշոր վերնագրեր-ներդիրների շերտ է։ Այն թերթում են մատով կամ սեղմում վերնագրին։ Ակտիվ վերնագիրը պայծառ է, հարևանները՝ մարած։ Շրջանակի պատկերակը և կետի գույնը սահուն հոսում են մատի հետ։ Եթե քաշեք առաջին կետը, ձախից դուրս է գալիս «Ավելացնել»-ը և աշխատում է `onAdd`-ը։

- **ցուցակ տարայի վրա**. ընտրված վերնագրին սեղմելը բացում է բոլոր կետերի ցուցակը բլոկի վրա (`listContainer`, լռելյայն՝ ծնողը). անցում կետին, «Նոր» (`onAdd`), «Հերթականություն»՝ տողերը քաշվում են (`onReorder(from, to)`), «•••» կետի մոտ (`onItemMore(index, anchor)`), սեփական գործողություններ (`listActions`); Esc կամ սեղմում դրսում՝ փակել; `listOpen` / `onListOpenChange` կամ `ref.openList()` / `closeList()`;
- **էջերում՝ ինչ ուզեք**. վերնագրերը չգիտեն, թե ինչ կա տակը; `ParzPager`-ի մեջ դրեք ցանկացած տարր և կոմպոնենտ;
- **կետեր**. `{ label, count?, icon?, color?, iconColor? }`; թիվը թերթվում է Parz Number Flow-ի պես;
- **գույն**. `--parz-accent`՝ ընթացիկ կետի գույնով, կոմպոնենտի և `accentRef` տարրի վրա, որպեսզի ամբողջ էջը ներկվի դրա հետ;
- **քաշել՝ ավելացնելու համար**. `onAdd`, `addLabel`, `addThreshold`; առանց `onAdd`-ի եզրը պարզապես դիմադրում է;
- **Parz Pager-ի հետ**. `ref`-ով՝ `setProgress(p)` էջերի `onProgress`-ից և `release(p)` `onRelease`-ից; վերնագրերը հետևում են մատին առանց React-ի վերանկարման;
- **ստեղնաշար**. սլաքներ, Home / End; `tablist` / `tab` դերեր;
- **ParzProvider**. զսպանակը՝ `calm` / `bouncy` / `snappy`; `prefers-reduced-motion`-ի դեպքում՝ առանց անիմացիայի։

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

| Հատկություն | Լռելյայն | Ինչ է անում |
|---|---|---|
| `items` | — | Կետեր |
| `index` | — | Ընտրված կետ (կառավարվող) |
| `defaultIndex` | `0` | Սկզբնական կետ |
| `onIndexChange` | — | Կետը փոխվեց |
| `onAdd` | — | Առաջին կետը քաշեցին շեմից այն կողմ |
| `addLabel` | `'Add'` | «Ավելացնել» պիտակ |
| `addThreshold` | `0.22` | Շեմը՝ կետի մասերով |
| `accentRef` | — | Որտեղ էլ գրել `--parz-accent` |
| `size` | `'lg'` | `'lg'` կամ `'md'` |
| `theme` | `'dark'` | `'dark'` կամ `'light'` |
| `motion` | `ParzProvider`-ից | `'calm'`, `'bouncy'`, `'snappy'` |
| `list` | `true` | Ցուցակ տարայի վրա՝ ընտրված վերնագրին սեղմելիս |
| `listOpen`, `defaultListOpen`, `onListOpenChange` | — | Բաց է արդյոք ցուցակը |
| `listContainer` | ծնողը | Ինչն է ծածկում ցուցակը (static ծնողին ժամանակավորապես տրվում է `position: relative`) |
| `onReorder` | — | `(from, to)`՝ կետերը քաշեցին; առանց դրա «Հերթականություն» չկա |
| `onItemMore` | — | `(index, anchor)`՝ «•••» կոճակ; առանց դրա այն չկա |
| `listActions` | — | Սեփական գործողություններ. `{ id, label, icon?, onClick }[]` |
| `labels` | անգլերեն | `new`, `reorder`, `done`, `more`, `list` |
| `ariaLabel` | — | Անուն էկրանի ընթերցիչների համար |
