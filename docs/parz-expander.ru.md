# Parz Expander

`ParzExpander` — секция Parz UI, которая плавно раскрывается. Высота мягко стартует и долго «растекается» в конце, содержимое проявляется, стрелка поворачивается с лёгкой пружиной. Закрытие чуть быстрее. Ничего резкого.

- **высота без замеров** — раскрытие через `grid-template-rows: 0fr → 1fr`, поэтому содержимое любой высоты и меняющееся на ходу раскрывается без рывков;
- **ничего не обрезается** — после раскрытия тени и кольца фокуса внутри видны целиком;
- **доступность** — заголовок — настоящая `<button>` с `aria-expanded`; закрытое содержимое помечено `inert` и не получает фокус;
- **меньше движения** — при `prefers-reduced-motion` секция открывается сразу.

```tsx
import { useState } from 'react';
import { ParzExpander } from '@carparkteam/parz-ui';
import '@carparkteam/parz-ui/style.css';

<ParzExpander title="Доставка" defaultOpen>Привезём завтра с 10 до 18.</ParzExpander>

// открыта только одна секция
const [open, setOpen] = useState<number | null>(0);
<ParzExpander title="Оплата" open={open === 0} onOpenChange={v => setOpen(v ? 0 : null)}>…</ParzExpander>
<ParzExpander title="Возврат" open={open === 1} onOpenChange={v => setOpen(v ? 1 : null)}>…</ParzExpander>
```

| Проп | По умолчанию | Что делает |
|---|---|---|
| `title` | — | Заголовок — кнопка раскрытия |
| `children` | — | Содержимое |
| `open` | — | Открыта (управляемый режим) |
| `defaultOpen` | `false` | Открыта при появлении (неуправляемый режим) |
| `onOpenChange` | — | `(open: boolean) => void` |
| `disabled` | `false` | Не раскрывается, приглушена |
| `variant` | `'plain'` | `'plain'` — секция с линией снизу, `'card'` — стеклянная карточка; соседние карточки склеиваются в одну группу |
| `divider` | `true` | Нижняя линия-разделитель |
| `color` | `#f2f2f5` | Цвет заголовка |
| `chevronColor` | `#9a9aa3` | Цвет стрелки |
| `dividerColor` | `#26262c` | Цвет линии |
| `id` / `className` / `style` | — | На корневой `<section>` |

## CSS-переменные

На самой секции или любом родителе: `--pz-ex-fg`, `--pz-ex-chev`, `--pz-ex-line`, `--pz-ex-ring` (кольцо фокуса).
