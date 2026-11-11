# Parz UI

[English](README.md) · **Հայերեն** · [Русский](README.ru.md)

React կոմպոնենտներ հեղուկ անիմացիայով՝ առաձգական, սահուն, ոչինչ կտրուկ։ Պատրաստել են **CarPark Team**-ը և **Dev.CarPark**-ը։

| Կոմպոնենտ | Ինչ է | Փաստաթղթեր |
|---|---|---|
| `ParzMenu` | Նավիգացիա՝ ընդգծումը հոսում է կաթիլի պես, կլոր կոճակները զսպանակում են; համակարգչում դառնում է վերնագիր՝ որոնմամբ | [docs](docs/parz-menu.hy.md) |
| `ParzToggle` | Անջատիչ հեղուկ սահնակով՝ ձգվում է, տափակում, կարելի է քաշել; կա «չափազանց հաճախ» մերժման վիճակ | [docs](docs/parz-toggle.hy.md) |
| `ParzCheckbox` | Նշիչ՝ գույնը տարածվում է կաթիլի պես, նշանը գծվում է; կա «մասամբ ընտրված» և սխալի վիճակ | [docs](docs/parz-checkbox.hy.md) |
| `ParzSlider` | Սահիչ, որի սահնակը ձգվում է շարժման արագությամբ | [docs](docs/parz-slider.hy.md) |
| `ParzRange` | Միջակայքի սահիչ՝ 2-ից 5 սահնակ մեկ ուղու վրա | [docs](docs/parz-slider.hy.md) |
| `AnimoLogo` | Կենդանի տեքստային լոգո՝ տառերը լողում են, բռնում ալիքը և վառվում պահելիս | [docs](docs/animologo.hy.md) |

## Տեղադրում

```bash
npm install @parz/ui
```

Կամ անմիջապես GitHub-ից՝

```bash
npm install github:CarParkTeam-Dev/parz-ui
```

Անհրաժեշտ է React 18 կամ ավելի նոր։

## Օգտագործում

Միացրեք ոճերը մեկ անգամ (օրինակ՝ հավելվածի մուտքի կետում) և օգտագործեք ցանկացած կոմպոնենտ՝

```tsx
import { useState } from 'react';
import { ParzMenu, ParzToggle, ParzCheckbox, ParzSlider, ParzRange, AnimoLogo } from '@parz/ui';
import '@parz/ui/style.css';

export function Settings() {
  const [wifi, setWifi] = useState(true);
  const [agree, setAgree] = useState(false);
  const [volume, setVolume] = useState(60);
  const [price, setPrice] = useState([20, 70]);

  return (
    <>
      <ParzToggle checked={wifi} onChange={setWifi} label="Wi-Fi" />
      <ParzCheckbox checked={agree} onChange={setAgree} label="Ընդունում եմ պայմանները" />
      <ParzSlider value={volume} onChange={setVolume} label="Ձայն" formatValue={v => `${v}%`} />
      <ParzRange value={price} onChange={setPrice} label="Գին" />
    </>
  );
}
```

Ամեն ինչ գրված է TypeScript-ով, տիպերը գալիս են փաթեթի հետ։ Բոլոր կոմպոնենտներն աշխատում են ստեղնաշարով և էկրանի ընթերցողներով, ճիշտ են երևում հեռախոսում և համակարգչում և հարգում են համակարգի «քիչ շարժում» կարգավորումը։

## Կոնֆիգուրատոր

Ռեպոզիտորիայում կա կայք՝ կենդանի խմբագրիչով յուրաքանչյուր կոմպոնենտի համար. կարգավորեք և պատճենեք պատրաստի կոդը։

```bash
git clone https://github.com/CarParkTeam-Dev/parz-ui.git
cd parz-ui
npm install
npm run dev
```

Կբացվի `http://localhost:5280`։ `npm run build`-ը կայքը հավաքում է `site/`-ում ցանկացած ստատիկ հոսթինգի համար։

## Մշակում

| Հրաման | Ինչ է անում |
|---|---|
| `npm run dev` | Կոնֆիգուրատոր՝ տաք վերաբեռնմամբ |
| `npm run build:lib` | Հավաքում է փաթեթը `dist/`-ում (JS, CSS, տիպեր) |
| `npm run build` | Հավաքում է կայքը `site/`-ում |
| `npm run typecheck` | Տիպերի ստուգում |

## Լիցենզիա

Parz UI-ն կարելի է օգտագործել անվճար, այդ թվում՝ կոմերցիոն նախագծերում, [Parz UI լիցենզիայով](LICENSE). դա MIT է՝ մեկ լրացուցիչ պայմանով՝

**Parz UI օգտագործող ցանկացած արտադրանք պետք է իր օգտատերերին ցույց տա «Components by CarPark Team» գրությունը՝ [dev.carpark.am/parz-ui](https://dev.carpark.am/parz-ui) հղումով** — էջատակում, «Հավելվածի մասին» կամ «Շնորհակալություններ» էկրանին, կամ կարգավորումներում։ Գրությունը պետք է ընթեռնելի լինի և թաքցված չլինի։ «Components by» բառերը կարելի է թարգմանել։

Ամենահեշտը պատրաստի `ParzCredit` կոմպոնենտն է՝

```tsx
import { ParzCredit } from '@parz/ui';

<footer>
  © 2026 Իմ հավելվածը · <ParzCredit />
</footer>

// ձեր արտադրանքի լեզվով
<ParzCredit prefix="Կոմպոնենտները՝" />
```

© 2026 CarPark Team & Dev.CarPark
