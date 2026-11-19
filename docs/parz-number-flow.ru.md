# Parz Number Flow

`ParzNumberFlow` — число или короткий текст, где каждый знак меняется отдельно. Старая цифра уезжает и растворяется с размытием, новая въезжает с другой стороны на пружине. Знаки, которые не изменились, стоят на месте.

- **направление**: число растёт — цифры едут вверх, уменьшается — вниз (`direction="auto"`); можно задать `'up'` или `'down'`;
- **строки**: можно передать готовую строку — `'08:30'`, `'14:05:09'`, `'-12°'`;
- **слова**: короткие (до 8 букв) меняются по буквам и прокручиваются по алфавиту — английскому, русскому или армянскому, через соседние буквы; длинные — кусками по 3 буквы; `words` — `'letters'` или `'chunks'` всегда;
- **формат**: `locale` и `formatOptions` (Intl.NumberFormat) — валюта, проценты, разделители; или своя функция `format`;
- **ширина**: цифры одной ширины (`tabular`), а когда знаков становится больше или меньше, строка плавно раздвигается;
- **ParzProvider**: пружина — из пресета `calm` / `bouncy` / `snappy`;
- **меньше движения**: при `prefers-reduced-motion` значение меняется сразу;
- **доступность**: экранные дикторы читают значение целиком; `live` — объявлять каждое изменение.

```tsx
import { ParzProvider, ParzNumberFlow } from '@carparkteam/parz-ui';
import '@carparkteam/parz-ui/style.css';

<ParzProvider motion="bouncy">
  <ParzNumberFlow value={count} />
  <ParzNumberFlow value={price} locale="en-US" formatOptions={{ style: 'currency', currency: 'USD' }} />
  <ParzNumberFlow value="08:30" />
</ParzProvider>
```

| Проп | По умолчанию | Что делает |
|---|---|---|
| `value` | — | Число или строка |
| `format` | — | `(n) => string` — своё превращение числа в строку |
| `locale` | язык браузера | Язык для числа |
| `formatOptions` | — | Опции `Intl.NumberFormat` |
| `direction` | `'auto'` | `'auto'`, `'up'`, `'down'` |
| `tabular` | `true` | Цифры одной ширины |
| `blur` | `6` | Размытие на ходу, px; `0` — без него |
| `words` | `'auto'` | Как меняются слова: `'auto'`, `'letters'`, `'chunks'` |
| `motion` | из `ParzProvider` | `'calm'`, `'bouncy'`, `'snappy'` |
| `live` | `false` | `aria-live="polite"` |
| `className`, `style` | — | Размер шрифта, цвет и вес наследуются от родителя |
