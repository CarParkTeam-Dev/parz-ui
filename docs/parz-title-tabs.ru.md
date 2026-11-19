# Parz Title Tabs

`ParzTitleTabs` — полоса крупных заголовков-вкладок. Её листают пальцем или нажимают на заголовок. Активный заголовок яркий, соседние гаснут. Значок в кружке и цвет пункта плавно перетекают за пальцем. Если потянуть за первый пункт, слева выезжает «Добавить» и срабатывает `onAdd`.

- **список поверх контейнера**: нажатие на выбранный заголовок открывает список всех пунктов поверх блока (`listContainer`, по умолчанию — родитель): переход к пункту, «Новый» (`onAdd`), «Порядок» — строки перетаскиваются (`onReorder(from, to)`), «•••» у пункта (`onItemMore(index, anchor)`), свои действия (`listActions`); Esc или нажатие мимо — закрыть; `listOpen` / `onListOpenChange` или `ref.openList()` / `closeList()`;
- **страницы — что угодно**: заголовки не знают, что под ними; в `ParzPager` кладите любые элементы и компоненты;
- **пункты**: `{ label, count?, icon?, color?, iconColor? }`; число перелистывается как Parz Number Flow;
- **цвет**: `--parz-accent` с цветом текущего пункта — на самом компоненте и на элементе из `accentRef`, чтобы вся страница перекрашивалась вместе с ним;
- **потянуть, чтобы добавить**: `onAdd`, `addLabel`, `addThreshold`; без `onAdd` у края просто сопротивление;
- **вместе с Parz Pager**: через `ref` — `setProgress(p)` из `onProgress` пейджера и `release(p)` из `onRelease`; заголовки едут за пальцем без перерисовки React;
- **клавиатура**: стрелки, Home / End; роли `tablist` / `tab`;
- **ParzProvider**: пружина из пресета `calm` / `bouncy` / `snappy`; при `prefers-reduced-motion` — без анимации.

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

| Проп | По умолчанию | Что делает |
|---|---|---|
| `items` | — | Пункты |
| `index` | — | Выбранный пункт (управляемый режим) |
| `defaultIndex` | `0` | Начальный пункт |
| `onIndexChange` | — | Пункт сменился |
| `onAdd` | — | Потянули за первый дальше порога |
| `addLabel` | `'Add'` | Подпись «добавить» |
| `addThreshold` | `0.22` | Порог в долях пункта |
| `accentRef` | — | Куда ещё писать `--parz-accent` |
| `size` | `'lg'` | `'lg'` или `'md'` |
| `theme` | `'dark'` | `'dark'` или `'light'` |
| `motion` | из `ParzProvider` | `'calm'`, `'bouncy'`, `'snappy'` |
| `list` | `true` | Список поверх контейнера по нажатию на выбранный заголовок |
| `listOpen`, `defaultListOpen`, `onListOpenChange` | — | Открыт ли список |
| `listContainer` | родитель | Что накрывает список (static-родителю на время ставится `position: relative`) |
| `onReorder` | — | `(from, to)` — пункты перетащили; без него нет «Порядка» |
| `onItemMore` | — | `(index, anchor)` — кнопка «•••»; без него её нет |
| `listActions` | — | Свои действия: `{ id, label, icon?, onClick }[]` |
| `labels` | английские | `new`, `reorder`, `done`, `more`, `list` |
| `ariaLabel` | — | Имя для экранных дикторов |
