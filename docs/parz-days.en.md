# Parz Days

`ParzDays` is the Parz UI day strip. The selection card stays still while the days glide beneath it like a wheel. Drag the strip with a finger or mouse, swipe it with a trackpad or tap a day. When released, it coasts with inertia and springs onto the nearest date. At speed the card stretches and squashes a little, and days fade toward the edges.

- **endless strip**: past and future without limits, or only between `min` and `max`; past a limit the strip pulls with resistance;
- **unavailable days**: `isDisabled`; the strip never stops on them;
- **marks**: a dot under the number, with its own color per day;
- **language**: weekday and month names via `Intl` (`locale`);
- **keyboard**: ← → by day, PageUp / PageDown by week, Home for today;
- **ParzProvider**: the first component that reads the shared motion preset;
- **reduced motion**: with `prefers-reduced-motion` the strip lands on the day instantly.

```tsx
import { useState } from 'react';
import { ParzProvider, ParzDays } from '@carparkteam/parz-ui';
import '@carparkteam/parz-ui/style.css';

const [day, setDay] = useState(new Date());

<ParzProvider motion="bouncy">
  <ParzDays value={day} onChange={setDay} showMonth todayLabel="Today" marks={d => d.getDate() % 5 === 0} />
</ParzProvider>
```

| Prop | Default | What it does |
|---|---|---|
| `value` | — | Selected day (controlled) |
| `defaultValue` | today | Initial day (uncontrolled) |
| `onChange` | — | `(date: Date, iso: string) => void`; `iso` is `'YYYY-MM-DD'` in local time |
| `name` | — | Form field name: the date is sent with the form as `'YYYY-MM-DD'` |
| `min` / `max` | — | Strip limits |
| `isDisabled` | — | `(date) => boolean`: unavailable days |
| `disabledDates` | — | Specific unavailable dates, `Date[]` |
| `marks` | — | `(date) => boolean \| string`: a dot under the number; a string sets its color |
| `locale` | browser language | Label language |
| `weekday` | `'narrow'` | `'narrow'` for one letter, `'short'` for an abbreviation |
| `showMonth` | `false` | Month and year above the strip; they roll when they change |
| `picker` | — | Month and year picker on tapping the month: `'wheels'` slides year and month strips above the days, chosen levels shrink; `'compact'` is a mini window with months and a year field |
| `pickerYear` | `true` | The picker can change years; `false` shows only the current year’s months |
| `todayLabel` | — | “Today” button label; the button shows when another day is selected |
| `size` | `'md'` | `'sm'`, `'md'`, `'lg'` |
| `theme` | `'light'` | `'light'` or `'dark'` |
| `motion` | from `ParzProvider` | `'calm'`, `'bouncy'`, `'snappy'` |
| `cardColor`, `color`, `weekdayColor`, `markColor` | — | Colors |
| `highlightToday` | `true` | Highlight today with a color |
| `todayColor` | green | Color of today’s number |
| `highlightSunday` | `true` | Highlight Sunday’s name with a color |
| `sundayColor` | red | Color of Sunday’s name |
| `highlightCurrent` | `true` | Highlight the current year and month in the picker |
| `currentColor` | same as `todayColor` (green) | Their color |
| `ariaLabel` | — | Name for screen readers |
| `disabled` | `false` | The strip doesn’t move |


## Date limits

Whatever `min` / `max` you pass, the strip never goes before **January 1, 1900** or after **December 31, 100 years from today** (`PARZ_DAYS_MIN_YEAR`, `PARZ_DAYS_MAX_YEARS_AHEAD`). If limits are clamped, a warning is printed to the console.

## Date for your API

```tsx
import { ParzDays, toISODate } from '@carparkteam/parz-ui';

<ParzDays onChange={(date, iso) => fetch(`/api/slots?date=${iso}`)} />

// or in a plain form
<form action="/book"><ParzDays name="date" /><button>Book</button></form>
```

## ParzProvider

A shared motion preset for new components. Supported starting with **Parz Days**; components released earlier don’t read it yet.

| Preset | Feel |
|---|---|
| `calm` | soft, no overshoot |
| `bouncy` | lively spring with a slight overshoot (default) |
| `snappy` | quick and crisp |

A component’s own `motion` prop wins over the provider.
