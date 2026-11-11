# Parz Checkbox

`ParzCheckbox`-ը Parz UI-ի նշիչն է՝ հեղուկ անիմացիայով։ Նշելիս գույնը կենտրոնից տարածվում է կաթիլի պես և թեթև անցնում սահմանը, քառակուսին տափակում է ու հետ զսպանակում, իսկ նշանը գծվում է։ Հանելիս ամեն ինչ մեղմ հետ է քաշվում։ Ոչինչ կտրուկ չէ։

- **սեղմում կամ կտտոց** — քառակուսու կամ պիտակի վրա;
- **պահում** — քառակուսին մեղմ սեղմվում է;
- **ստեղնաշար** — Tab-ը տալիս է ֆոկուս (երևում է օղակ), Space կամ Enter՝ փոխարկում;
- **մասամբ ընտրված** — `indeterminate`-ը ցույց է տալիս գծիկ, օրինակ «Ընտրել բոլորը»-ի համար;
- **սխալ** — `invalid`-ը եզրագիծը և լցումը ներկում է կարմիր;
- **քիչ շարժում** — `prefers-reduced-motion`-ի դեպքում մնում են միայն կարճ գունային անցումներ։

Ներսում իսկական `<input type="checkbox">` է, ուստի ձևերը, `name` / `value`-ն, էկրանի ընթերցողները և ֆոկուսը աշխատում են սովորականի պես։

```tsx
import { useState } from 'react';
import { ParzCheckbox } from '@parz/ui';
import '@parz/ui/style.css';

const [on, setOn] = useState(false);

<ParzCheckbox checked={on} onChange={setOn} label="Հիշել ինձ" />

// «Ընտրել բոլորը» ցուցակի վրա
const all = items.every(i => i.on), some = items.some(i => i.on);
<ParzCheckbox checked={all} indeterminate={some && !all} onChange={selectAll} label="Ընտրել բոլորը" />

// պարտադիր համաձայնություն
<ParzCheckbox checked={agree} onChange={setAgree} invalid={submitted && !agree}
  label="Ընդունում եմ պայմանները" description="Առանց դրա շարունակել հնարավոր չէ" />
```

| Prop | Լռելյայն | Ինչ է անում |
|---|---|---|
| `checked` | — | Վիճակ (կառավարվող ռեժիմ) |
| `defaultChecked` | `false` | Սկզբնական վիճակ (չկառավարվող ռեժիմ) |
| `onChange` | — | `(checked: boolean) => void` — կտտոցով կամ ստեղնաշարով |
| `indeterminate` | `false` | Մասամբ ընտրված՝ նշանի փոխարեն գծիկ |
| `label` | — | Տեքստ կամ տարր նշիչի կողքին |
| `description` | — | Փոքր բացատրող տեքստ պիտակի տակ |
| `labelPosition` | `'end'` | `'end'` — պիտակը աջից, `'start'` — ձախից |
| `ariaLabel` | — | Անուն էկրանի ընթերցողների համար, եթե տեսանելի `label` չկա |
| `disabled` | `false` | Անջատված, խամրած, ֆոկուս չի ստանում |
| `invalid` | `false` | Սխալ՝ կարմիր եզրագիծ և լցում, `aria-invalid` |
| `size` | `'md'` | `'sm'` (16 px), `'md'` (20 px), `'lg'` (26 px) կամ քառակուսու կողմը px-ով |
| `radius` | չափի մոտ մեկ երրորդը | Անկյունների կլորացում, px |
| `accent` | `#6ee7a0` | Լցման գույնը, երբ նշված է |
| `borderColor` | `#4a4a55` | Եզրագիծը, երբ նշված չէ։ Բաց էջում՝ օրինակ `#b9bac6` |
| `checkColor` | `#04130a` | Նշանի գույնը |
| `name` / `value` / `id` | — | Փոխանցվում են ներքին checkbox-ին |
| `className` / `style` | — | Արմատային `<label>`-ի վրա |

## CSS փոփոխականներ

Գույները կարելի է տալ նաև CSS-ով՝ նշիչի կամ ցանկացած ծնողի վրա՝ `--pz-cb-accent`, `--pz-cb-border`, `--pz-cb-check`, `--pz-cb-invalid`։

```css
.form { --pz-cb-accent: #7aa7ff; --pz-cb-check: #fff; }
```
