# Parz Expander

`ParzExpander`-ը Parz UI-ի սահուն բացվող բաժինն է։ Բարձրությունը մեղմ է սկսում և վերջում երկար «տարածվում», բովանդակությունը հայտնվում է, սլաքը պտտվում է թեթև զսպանակով։ Փակվելը մի փոքր ավելի արագ է։ Ոչ մի կտրուկ բան։

- **առանց չափումների** — բացվում է `grid-template-rows: 0fr → 1fr`-ով, ուստի ցանկացած բարձրության, նույնիսկ փոփոխվող բովանդակությունը բացվում է առանց ցնցումների;
- **ոչինչ չի կտրվում** — բացվելուց հետո ներսի ստվերներն ու ֆոկուսի օղակները ամբողջությամբ տեսանելի են;
- **հասանելիություն** — վերնագիրը իսկական `<button>` է `aria-expanded`-ով; փակ բովանդակությունը `inert` է և ֆոկուս չի ստանում;
- **քիչ շարժում** — `prefers-reduced-motion`-ի դեպքում բաժինը բացվում է անմիջապես։

```tsx
import { useState } from 'react';
import { ParzExpander } from '@carparkteam/parz-ui';
import '@carparkteam/parz-ui/style.css';

<ParzExpander title="Առաքում" defaultOpen>Կառաքենք վաղը՝ 10-ից 18-ը։</ParzExpander>

// բաց է միայն մեկ բաժին
const [open, setOpen] = useState<number | null>(0);
<ParzExpander title="Վճարում" open={open === 0} onOpenChange={v => setOpen(v ? 0 : null)}>…</ParzExpander>
<ParzExpander title="Վերադարձ" open={open === 1} onOpenChange={v => setOpen(v ? 1 : null)}>…</ParzExpander>
```

| Հատկություն | Լռելյայն | Ինչ է անում |
|---|---|---|
| `title` | — | Վերնագիրը՝ բացման կոճակը |
| `children` | — | Բովանդակությունը |
| `open` | — | Բաց է (կառավարվող ռեժիմ) |
| `defaultOpen` | `false` | Բաց է հայտնվելիս (չկառավարվող ռեժիմ) |
| `onOpenChange` | — | `(open: boolean) => void` |
| `disabled` | `false` | Չի բացվում, խամրած է |
| `variant` | `'plain'` | `'plain'` — բաժին ներքևի գծով, `'card'` — ապակե քարտ; հարևան քարտերը միանում են մեկ խմբի |
| `divider` | `true` | Ներքևի բաժանարար գիծ |
| `color` | `#f2f2f5` | Վերնագրի գույնը |
| `chevronColor` | `#9a9aa3` | Սլաքի գույնը |
| `dividerColor` | `#26262c` | Գծի գույնը |
| `id` / `className` / `style` | — | Արմատային `<section>`-ի վրա |

## CSS փոփոխականներ

Բաժնի կամ ցանկացած ծնողի վրա՝ `--pz-ex-fg`, `--pz-ex-chev`, `--pz-ex-line`, `--pz-ex-ring` (ֆոկուսի օղակ)։
