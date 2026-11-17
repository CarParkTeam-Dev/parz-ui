# Parz Days

`ParzDays`-ը Parz UI-ի օրերի ժապավենն է։ Ընտրության քարտը մնում է տեղում, իսկ օրերը սահում են նրա տակով՝ անիվի պես։ Ժապավենը կարելի է քաշել մատով կամ մկնիկով, սահեցնել թաչփադով կամ սեղմել օրը։ Բաց թողնելուց հետո այն շարժվում է իներցիայով և զսպանակով կանգնում մոտակա ամսաթվի վրա։

- **անվերջ ժապավեն**՝ կամ միայն `min`-ի և `max`-ի միջև. սահմանից այն կողմ ժապավենը ձգվում է դիմադրությամբ;
- **անհասանելի օրեր**՝ `isDisabled`. ժապավենը դրանց վրա չի կանգնում;
- **նշաններ**՝ կետ թվի տակ, յուրաքանչյուր օրվա համար՝ իր գույնով;
- **լեզու**՝ շաբաթվա օրերն ու ամիսը `Intl`-ով (`locale`);
- **ստեղնաշար**՝ ← → ըստ օրերի, PageUp / PageDown ըստ շաբաթների, Home՝ այսօր;
- **ParzProvider**՝ առաջին բաղադրիչը, որը կարդում է շարժման ընդհանուր նախադրվածքը;
- **ավելի քիչ շարժում**՝ `prefers-reduced-motion`-ի դեպքում ժապավենն անմիջապես կանգնում է օրվա վրա։

```tsx
import { useState } from 'react';
import { ParzProvider, ParzDays } from '@carparkteam/parz-ui';
import '@carparkteam/parz-ui/style.css';

const [day, setDay] = useState(new Date());

<ParzProvider motion="bouncy">
  <ParzDays value={day} onChange={setDay} showMonth todayLabel="Այսօր" marks={d => d.getDate() % 5 === 0} />
</ParzProvider>
```

| Հատկություն | Լռելյայն | Ինչ է անում |
|---|---|---|
| `value` | — | Ընտրված օրը (կառավարվող) |
| `defaultValue` | այսօր | Սկզբնական օրը |
| `onChange` | — | `(date: Date, iso: string) => void`; `iso`՝ `'YYYY-MM-DD'` տեղական ժամով |
| `name` | — | Ձևի դաշտի անունը՝ ամսաթիվը կուղարկվի ձևի հետ `'YYYY-MM-DD'` տեսքով |
| `min` / `max` | — | Ժապավենի սահմանները |
| `isDisabled` | — | `(date) => boolean`՝ անհասանելի օրեր |
| `disabledDates` | — | Առանձին անհասանելի ամսաթվեր, `Date[]` |
| `marks` | — | `(date) => boolean \| string`՝ կետ թվի տակ, տողը՝ դրա գույնը |
| `locale` | դիտարկչի լեզուն | Պիտակների լեզուն |
| `weekday` | `'narrow'` | `'narrow'`՝ մեկ տառ, `'short'`՝ կրճատ |
| `showMonth` | `false` | Ամիսն ու տարին ժապավենի վերևում |
| `picker` | — | Ամսի և տարվա ընտրություն ամսի վրա սեղմելիս. `'wheels'`՝ օրերի վերևում բացվում են տարիների և ամիսների ժապավենները, ընտրվածները փոքրանում են; `'compact'`՝ մինի պատուհան ամիսներով և տարվա դաշտով |
| `pickerYear` | `true` | Ընտրության մեջ կարելի է փոխել տարին. `false`՝ միայն ընթացիկ տարվա ամիսները |
| `showTime` | `false` | Ժամի կոճակ ամսի կողքին. մինի պատուհանում ժամերի և րոպեների թմբուկներ՝ iOS-ի ոճով։ `onChange`-ը տալիս է `'YYYY-MM-DDTHH:mm'` |
| `minuteStep` | `5` | Րոպեների քայլը թմբուկում |
| `todayLabel` | — | «Այսօր» կոճակի պիտակը |
| `size` | `'md'` | `'sm'`, `'md'`, `'lg'` |
| `theme` | `'light'` | `'light'` կամ `'dark'` |
| `motion` | `ParzProvider`-ից | `'calm'`, `'bouncy'`, `'snappy'` |
| `cardColor`, `color`, `weekdayColor`, `markColor` | — | Գույներ |
| `highlightToday` | `true` | Ընդգծել այսօրվա օրը գույնով |
| `todayColor` | կանաչ | Այսօրվա թվի գույնը |
| `highlightSunday` | `true` | Ընդգծել կիրակիի անունը գույնով |
| `sundayColor` | կարմիր | Կիրակիի անվան գույնը |
| `highlightCurrent` | `true` | Ընտրության մեջ ընդգծել ընթացիկ տարին և ամիսը |
| `currentColor` | ինչպես `todayColor`-ը (կանաչ) | Դրանց գույնը |
| `ariaLabel` | — | Անուն էկրանային ընթերցիչների համար |
| `disabled` | `false` | Ժապավենը չի շարժվում |


## Ամսաթվերի սահմաններ

Ինչ `min` / `max` էլ փոխանցեք, ժապավենը չի գնում **1900 թ. հունվարի 1**-ից առաջ և այսօրվանից **100 տարի հետո դեկտեմբերի 31**-ից հետո (`PARZ_DAYS_MIN_YEAR`, `PARZ_DAYS_MAX_YEARS_AHEAD`)։

## Ամսաթիվ API-ի համար

```tsx
import { ParzDays, toISODate } from '@carparkteam/parz-ui';

<ParzDays onChange={(date, iso) => fetch(`/api/slots?date=${iso}`)} />
```

## ParzProvider

Շարժման ընդհանուր նախադրվածք նոր բաղադրիչների համար։ Աջակցվում է սկսած **Parz Days**-ից. ավելի վաղ թողարկված բաղադրիչները դեռ այն չեն կարդում։

| Նախադրվածք | Բնույթ |
|---|---|
| `calm` | մեղմ, առանց թռիչքի |
| `bouncy` | կենդանի զսպանակ՝ թեթև թռիչքով (լռելյայն) |
| `snappy` | արագ և հստակ |

Բաղադրիչի սեփական `motion`-ը գերակա է մատակարարից։
