# Parz Number Flow

`ParzNumberFlow`-ը թիվ կամ կարճ տեքստ է, որտեղ յուրաքանչյուր նշան փոխվում է առանձին։ Հին թվանշանը դուրս է սահում և մշուշով անհետանում, նորը մտնում է մյուս կողմից՝ զսպանակով։ Չփոխված նշանները մնում են տեղում։

- **ուղղություն**. թիվը մեծանում է՝ թվանշանները բարձրանում են, փոքրանում է՝ իջնում (`direction="auto"`); կարելի է տալ `'up'` կամ `'down'`;
- **տողեր**. կարելի է տալ պատրաստի տող՝ `'08:30'`, `'14:05:09'`, `'-12°'`;
- **բառեր**. կարճերը (մինչև 8 տառ) փոխվում են տառ առ տառ՝ պտտվելով այբուբենով (անգլերեն, ռուսերեն, հայերեն), երկարները՝ 3 տառանոց կտորներով; `words`՝ `'letters'` կամ `'chunks'`;
- **ձևաչափ**. `locale` և `formatOptions` (Intl.NumberFormat)՝ արժույթ, տոկոս, բաժանիչներ, կամ սեփական `format` ֆունկցիա;
- **լայնություն**. նույն լայնության թվանշաններ (`tabular`), իսկ երբ նշանները շատանում կամ պակասում են, տողը սահուն լայնանում է;
- **ParzProvider**. զսպանակը հետևում է `calm` / `bouncy` / `snappy` նախադրվածքին;
- **քիչ շարժում**. `prefers-reduced-motion`-ի դեպքում արժեքը փոխվում է անմիջապես;
- **մատչելիություն**. էկրանի ընթերցիչները կարդում են ամբողջ արժեքը; `live`՝ հայտարարել յուրաքանչյուր փոփոխություն։

```tsx
import { ParzProvider, ParzNumberFlow } from '@carparkteam/parz-ui';
import '@carparkteam/parz-ui/style.css';

<ParzProvider motion="bouncy">
  <ParzNumberFlow value={count} />
  <ParzNumberFlow value={price} locale="en-US" formatOptions={{ style: 'currency', currency: 'USD' }} />
  <ParzNumberFlow value="08:30" />
</ParzProvider>
```

| Հատկություն | Լռելյայն | Ինչ է անում |
|---|---|---|
| `value` | — | Թիվ կամ տող |
| `format` | — | `(n) => string`՝ թվի սեփական ձևաչափում |
| `locale` | բրաուզերի լեզուն | Թվի լեզուն |
| `formatOptions` | — | `Intl.NumberFormat`-ի կարգավորումներ |
| `direction` | `'auto'` | `'auto'`, `'up'`, `'down'` |
| `tabular` | `true` | Նույն լայնության թվանշաններ |
| `blur` | `6` | Մշուշ շարժման ժամանակ, px; `0`՝ առանց |
| `words` | `'auto'` | Ինչպես են փոխվում բառերը. `'auto'`, `'letters'`, `'chunks'` |
| `motion` | `ParzProvider`-ից | `'calm'`, `'bouncy'`, `'snappy'` |
| `live` | `false` | `aria-live="polite"` |
| `className`, `style` | — | Տառաչափը, գույնը և հաստությունը ժառանգվում են ծնողից |
