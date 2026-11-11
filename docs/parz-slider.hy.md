# Parz Slider և Parz Range

Parz UI-ի երկու սահիչ՝ ընդհանուր հեղուկ միջուկով։

- **`ParzSlider`** — մեկ արժեք՝ ձայն, պայծառություն, չափ։
- **`ParzRange`** — միջակայք, մեկ ուղու վրա **2-ից 5 սահնակ**՝ գին «սկսած–մինչև», աշխատանքային ժամեր ընդմիջումով, մի քանի գոտի։

Ինչպես են շարժվում.

- **քաշել** — սահնակը մի փոքր մեծանում է և ձգվում շարժման արագությանը համապատասխան, հետո մեղմ զսպանակով կլորանում;
- **սեղմել ուղուն** — մոտակա սահնակը մոտենում է թեթև անցումով, լցումը հասնում է;
- **արժեքի պղպջակ** — հայտնվում է սահնակի վերևում, երբ այն քաշում են կամ ֆոկուսում է;
- **ստեղնաշար** — Tab՝ սահնակին, սլաքներ ±`step`, PageUp/PageDown ±10%, Home/End՝ եզրերին;
- **քիչ շարժում** — `prefers-reduced-motion`-ի դեպքում մնում են միայն կարճ պարզ տեղաշարժեր։

`ParzRange`-ում սահնակները միմյանց վրայով չեն ցատկում, իսկ `minDistance`-ը պահում է բացը հարևանների միջև։

```tsx
import { useState } from 'react';
import { ParzSlider, ParzRange } from '@carparkteam/parz-ui';
import '@carparkteam/parz-ui/style.css';

const [volume, setVolume] = useState(60);
<ParzSlider value={volume} onChange={setVolume} label="Ձայն" formatValue={v => `${v}%`} />

const [price, setPrice] = useState([2000, 7000]);
<ParzRange value={price} onChange={setPrice} min={0} max={10000} step={500}
  label="Գին" formatValue={v => `${v} ֏`} onChangeEnd={loadResults} />

// չորս սահնակ՝ աշխատանք 9–13, ընդմիջում, աշխատանք 14–18
<ParzRange defaultValue={[9, 13, 14, 18]} min={0} max={24} minDistance={1} fill="pairs" formatValue={v => `${v}:00`} />
```

## Ընդհանուր props

| Prop | Լռելյայն | Ինչ է անում |
|---|---|---|
| `min` / `max` / `step` | `0` / `100` / `1` | Սահմաններ և քայլ |
| `label` | — | Պիտակ սահիչի վերևում |
| `showOutput` | `true`, եթե կա `label` | Ընթացիկ արժեքը պիտակի աջ կողմում |
| `formatValue` | — | Ինչպես ցույց տալ թիվը, օրինակ ``v => `${v} կմ` `` |
| `showValue` | `'auto'` | Պղպջակ սահնակի վրա՝ `'auto'` — քաշելիս կամ ֆոկուսում, `'always'`, `'never'` |
| `marks` | — | `true` — կետ ամեն քայլին, կամ ցուցակ՝ `[0, 50, { value: 100, label: 'Max' }]` |
| `size` | `'md'` | `'sm'` (16 px), `'md'` (20 px), `'lg'` (26 px) կամ սահնակի տրամագիծը px-ով |
| `disabled` | `false` | Անջատված և խամրած |
| `accent` | `#6ee7a0` | Լցման գույնը |
| `trackColor` | `#2a2a30` | Ուղու գույնը։ Բաց էջում՝ օրինակ `#d9dae1` |
| `thumbColor` | `#fff` | Սահնակի գույնը |
| `name` | — | Արժեքները ձևի հետ ուղարկվում են թաքնված input-ներով |
| `className` / `style` | — | Արմատային տարրի վրա |

## ParzSlider

| Prop | Լռելյայն | Ինչ է անում |
|---|---|---|
| `value` / `defaultValue` | — / `min` | Արժեք (կառավարվող / չկառավարվող) |
| `onChange` | — | `(value: number) => void` — ամեն շարժման ժամանակ |
| `onChangeEnd` | — | `(value: number) => void` — բաց թողնելիս կամ ստեղնը սեղմելուց հետո |
| `ariaLabel` | — | Անուն էկրանի ընթերցողների համար, եթե `label` չկա |

## ParzRange

| Prop | Լռելյայն | Ինչ է անում |
|---|---|---|
| `value` / `defaultValue` | — / 25% և 75% | Արժեքներ աճման կարգով, **2-ից 5**։ Ավելորդները կտրվում են, պակասողները ավելացվում են `max`-ում |
| `onChange` | — | `(value: number[]) => void` |
| `onChangeEnd` | — | `(value: number[]) => void` — հարմար է արդյունքները բեռնելու համար |
| `minDistance` | `0` | Նվազագույն բացը հարևան սահնակների միջև |
| `fill` | `'span'` | `'span'` — լցում առաջինից մինչև վերջին սահնակը, `'pairs'` — միայն զույգերը 1–2, 3–4 (աշխատանք — ընդմիջում — աշխատանք) |
| `ariaLabels` | — | Սահնակների անուններ էկրանի ընթերցողների համար, օրինակ `['Սկսած', 'Մինչև']` |

Սահմանները նույնպես արտահանվում են՝ `RANGE_MIN_THUMBS` (2) և `RANGE_MAX_THUMBS` (5)։

## CSS փոփոխականներ

`--pz-sl-accent`, `--pz-sl-track`, `--pz-sl-knob`, `--pz-sl-tip-bg`, `--pz-sl-tip-fg` — սահիչի կամ ցանկացած ծնողի վրա։
