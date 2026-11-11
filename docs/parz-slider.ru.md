# Parz Slider и Parz Range

Два ползунка Parz UI с общим жидким ядром.

- **`ParzSlider`** — одно значение: громкость, яркость, размер.
- **`ParzRange`** — промежуток, на одной дорожке **от 2 до 5 бегунков**: цена «от и до», рабочие часы с перерывом, несколько зон.

Как двигаются:

- **перетаскивание** — бегунок чуть увеличивается и тянется по скорости движения, потом мягко пружинит обратно в круг;
- **нажатие на дорожку** — ближайший бегунок подъезжает с лёгким перелётом, заливка догоняет;
- **пузырёк со значением** — выпрыгивает над бегунком, пока его тянут или он в фокусе;
- **клавиатура** — Tab на бегунок, стрелки ±`step`, PageUp/PageDown ±10%, Home/End — к краям;
- **меньше движения** — при `prefers-reduced-motion` остаются только короткие простые сдвиги.

В `ParzRange` бегунки не перепрыгивают друг через друга, а `minDistance` держит зазор между соседями.

```tsx
import { useState } from 'react';
import { ParzSlider, ParzRange } from '@carparkteam/parz-ui';
import '@carparkteam/parz-ui/style.css';

const [volume, setVolume] = useState(60);
<ParzSlider value={volume} onChange={setVolume} label="Громкость" formatValue={v => `${v}%`} />

const [price, setPrice] = useState([2000, 7000]);
<ParzRange value={price} onChange={setPrice} min={0} max={10000} step={500}
  label="Цена" formatValue={v => `${v} ₽`} onChangeEnd={loadResults} />

// четыре бегунка: работа 9–13, перерыв, работа 14–18
<ParzRange defaultValue={[9, 13, 14, 18]} min={0} max={24} minDistance={1} fill="pairs" formatValue={v => `${v}:00`} />
```

## Общие пропсы

| Проп | По умолчанию | Что делает |
|---|---|---|
| `min` / `max` / `step` | `0` / `100` / `1` | Границы и шаг |
| `label` | — | Подпись над ползунком |
| `showOutput` | `true`, если есть `label` | Текущее значение справа от подписи |
| `formatValue` | — | Как печатать число, например ``v => `${v} км` `` |
| `showValue` | `'auto'` | Пузырёк над бегунком: `'auto'` — пока тянут или фокус, `'always'`, `'never'` |
| `marks` | — | `true` — точка на каждом шаге, или список: `[0, 50, { value: 100, label: 'Макс' }]` |
| `size` | `'md'` | `'sm'` (16 px), `'md'` (20 px), `'lg'` (26 px) или диаметр бегунка в px |
| `disabled` | `false` | Отключён и приглушён |
| `accent` | `#6ee7a0` | Цвет заливки |
| `trackColor` | `#2a2a30` | Цвет дорожки. На светлой странице — например, `#d9dae1` |
| `thumbColor` | `#fff` | Цвет бегунка |
| `name` | — | Значения уходят с формой скрытыми input |
| `className` / `style` | — | На корневом элементе |

## ParzSlider

| Проп | По умолчанию | Что делает |
|---|---|---|
| `value` / `defaultValue` | — / `min` | Значение (управляемый / неуправляемый режим) |
| `onChange` | — | `(value: number) => void` — при каждом движении |
| `onChangeEnd` | — | `(value: number) => void` — когда отпустили или после нажатия клавиши |
| `ariaLabel` | — | Имя для экранных дикторов, если нет `label` |

## ParzRange

| Проп | По умолчанию | Что делает |
|---|---|---|
| `value` / `defaultValue` | — / 25% и 75% | Значения по возрастанию, **от 2 до 5**. Лишние отбрасываются, недостающие добавляются на `max` |
| `onChange` | — | `(value: number[]) => void` |
| `onChangeEnd` | — | `(value: number[]) => void` — удобно загружать результаты здесь |
| `minDistance` | `0` | Минимальный зазор между соседними бегунками |
| `fill` | `'span'` | `'span'` — заливка от первого до последнего бегунка, `'pairs'` — только пары 1–2, 3–4 (работа — перерыв — работа) |
| `ariaLabels` | — | Имена бегунков для экранных дикторов, например `['От', 'До']` |

Ограничения тоже экспортируются: `RANGE_MIN_THUMBS` (2) и `RANGE_MAX_THUMBS` (5).

## CSS-переменные

`--pz-sl-accent`, `--pz-sl-track`, `--pz-sl-knob`, `--pz-sl-tip-bg`, `--pz-sl-tip-fg` — на ползунке или любом родителе.
