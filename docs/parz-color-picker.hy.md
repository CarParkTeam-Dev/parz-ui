# Parz Color Picker

`ParzColorPicker`-ը Parz UI-ի գույնի ընտրիչն է։ Հագեցվածության և պայծառության դաշտում հեղուկ սահիչ է. արագ քաշելիս այն ձգվում է շարժման ուղղությամբ, իսկ դաշտի այլ տեղում սեղմելիս զսպանակով թռչում է այնտեղ։ Դաշտի տակ են երանգի և թափանցիկության սահիչները, գույնի նախադիտումը, մուտքագրման դաշտը և պատրաստի նմուշները։

- **երկու ռեժիմ**. անմիջապես էջում (`mode="inline"`) կամ նմուշ-կոճակ, որը բացում է թռուցիկ պատուհան (`mode="popover"`);
- **ձևաչափեր**. HEX, RGB և HSL՝ փոխվում են մուտքագրման դաշտում, `onChange`-ը օգտագործում է նույն ձևաչափը;
- **թափանցիկություն**. սահիչ շախմատային ֆոնի վրա, `#rrggbbaa` / `rgba()` / `hsla()`; `alpha={false}`՝ առանց դրա;
- **կաթոցիչ**. վերցնում է գույնը էկրանից, որտեղ բրաուզերը աջակցում է (Chrome, Edge);
- **ստեղնաշար**. սլաքները տեղաշարժում են սահիչը 1%-ով, Shift-ով՝ 10%-ով; Home / End՝ դեպի եզր;
- **ձև**. `name`-ով գույնը կուղարկվի ձևի հետ;
- **ParzProvider**. սահիչների և պատուհանի զսպանակները՝ `calm` / `bouncy` / `snappy` նախադրվածքից;
- **քիչ շարժում**. `prefers-reduced-motion`-ի դեպքում սահիչն անմիջապես կանգնում է տեղում։

```tsx
import { useState } from 'react';
import { ParzProvider, ParzColorPicker } from '@carparkteam/parz-ui';
import '@carparkteam/parz-ui/style.css';

const [color, setColor] = useState('#7a5cff');

<ParzProvider motion="bouncy">
  <ParzColorPicker value={color} onChange={setColor} />
  <ParzColorPicker value={color} onChange={setColor} mode="popover" label="Գույն" />
</ParzProvider>
```

| Հատկություն | Լռելյայն | Ինչ է անում |
|---|---|---|
| `value` | — | Գույն (կառավարվող ռեժիմ). `'#7a5cff'`, `'#7a5cff80'`, `'rgb(…)'`, `'rgba(…)'`, `'hsl(…)'` |
| `defaultValue` | `'#7a5cff'` | Սկզբնական գույն (չկառավարվող ռեժիմ) |
| `onChange` | — | `(value, color)`՝ տող ընթացիկ ձևաչափով և գույնը բոլոր տեսքերով. `hex`, `rgb`, `hsl`, `hsv`, `css` |
| `onChangeEnd` | — | Նույնը, երբ սահիչը բաց է թողնվել, ընտրվել է նմուշ կամ հաստատվել է մուտքագրումը |
| `format` | `'hex'` | `'hex'`, `'rgb'`, `'hsl'` |
| `onFormatChange` | — | Ձևաչափի փոփոխություն մուտքագրման դաշտում |
| `alpha` | `true` | Թափանցիկության սահիչ |
| `showInput` | `true` | Մուտքագրման դաշտ՝ ձևաչափի փոխարկիչով |
| `swatches` | `PARZ_COLOR_SWATCHES` | Պատրաստի գույներ; `[]`՝ առանց նմուշների |
| `eyeDropper` | `true` | Կաթոցիչ, եթե բրաուզերն աջակցում է |
| `mode` | `'inline'` | `'inline'` կամ `'popover'` |
| `label` | — | Գրություն նմուշի կողքին `popover` ռեժիմում |
| `theme` | `'dark'` | `'dark'` կամ `'light'` |
| `motion` | `ParzProvider`-ից | `'calm'`, `'bouncy'`, `'snappy'` |
| `name` | — | Ձևի դաշտի անունը |
| `labels` | անգլերեն | `area`, `hue`, `alpha`, `eyeDropper`, `input`, `swatch` (`'Color {c}'`), `open` |
| `ariaLabel` | — | Անուն էկրանային ընթերցիչների համար |
| `disabled` | `false` | Անջատված է |

Մուտքագրման դաշտում սխալ արժեքը չի կիրառվում. դաշտը կարճ թափահարվում է և վերադարձնում ընթացիկ գույնը։ Գրադարանի `parseColor(տող)`-ը վերլուծում է նույն ձևաչափերը։
