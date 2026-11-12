# Parz UI

[English](README.md) · [Հայերեն](README.hy.md) · **Русский**

React-компоненты с жидкой анимацией — упругие, плавные, ничего резкого. Сделано командой **CarPark Team** и **Dev.CarPark**.

| Компонент | Что это | Документация |
|---|---|---|
| `ParzMenu` | Навигация: подсветка перетекает каплей, круглые кнопки пружинят; на компьютере становится шапкой с поиском | [docs](docs/parz-menu.ru.md) |
| `ParzToggle` | Переключатель с жидким бегунком: тянется, сплющивается, его можно тянуть; есть состояние отказа «слишком часто» | [docs](docs/parz-toggle.ru.md) |
| `ParzCheckbox` | Чекбокс: цвет растекается каплей, галочка дорисовывается; есть «частично выбрано» и ошибка | [docs](docs/parz-checkbox.ru.md) |
| `ParzSlider` | Ползунок, бегунок которого тянется по скорости движения | [docs](docs/parz-slider.ru.md) |
| `ParzRange` | Ползунок промежутка: от 2 до 5 бегунков на одной дорожке | [docs](docs/parz-slider.ru.md) |
| `AnimoLogo` | Живой логотип-надпись: буквы выплывают, ловят волну и загораются при удержании | [docs](docs/animologo.ru.md) |

## Установка

```bash
npm install @carparkteam/parz-ui
```

Или прямо с GitHub:

```bash
npm install github:CarParkTeam-Dev/parz-ui
```

Нужен React 18 или новее.

## Использование

Подключите стили один раз (например, в точке входа приложения) и используйте любые компоненты:

```tsx
import { useState } from 'react';
import { ParzMenu, ParzToggle, ParzCheckbox, ParzSlider, ParzRange, AnimoLogo } from '@carparkteam/parz-ui';
import '@carparkteam/parz-ui/style.css';

export function Settings() {
  const [wifi, setWifi] = useState(true);
  const [agree, setAgree] = useState(false);
  const [volume, setVolume] = useState(60);
  const [price, setPrice] = useState([20, 70]);

  return (
    <>
      <ParzToggle checked={wifi} onChange={setWifi} label="Wi-Fi" />
      <ParzCheckbox checked={agree} onChange={setAgree} label="Принимаю условия" />
      <ParzSlider value={volume} onChange={setVolume} label="Громкость" formatValue={v => `${v}%`} />
      <ParzRange value={price} onChange={setPrice} label="Цена" />
    </>
  );
}
```

Всё написано на TypeScript, типы идут вместе с пакетом. Все компоненты работают с клавиатуры и с экранными дикторами, выглядят правильно на телефоне и компьютере и уважают системную настройку «уменьшить движение».

## Площадка

В репозитории есть сайт с живым редактором для каждого компонента: настройте и скопируйте готовый код.

```bash
git clone https://github.com/CarParkTeam-Dev/parz-ui.git
cd parz-ui
npm install
npm run dev
```

Откроется `http://localhost:5280`. Сайт целиком — на [dev.carpark.am/parz-ui](https://dev.carpark.am/parz-ui). `npm run build` собирает эту площадку в `build/` для любого статического хостинга.

## Разработка

| Команда | Что делает |
|---|---|
| `npm run dev` | Площадка с горячей перезагрузкой |
| `npm run build:lib` | Сборка пакета в `dist/` (JS, CSS, типы) |
| `npm run build` | Сборка площадки в `build/` |
| `npm run typecheck` | Проверка типов |
| `npm run release -- patch` | Выпуск новой версии (`--beta` — пробная, `--dry-run` — посмотреть без изменений) |

## Лицензия

Parz UI можно использовать бесплатно, в том числе в коммерческих проектах, по [лицензии Parz UI](LICENSE) — это MIT с одним дополнительным условием:

**любой продукт, который использует Parz UI, должен показывать пользователям надпись «Components by CarPark Team» со ссылкой на [dev.carpark.am/parz-ui](https://dev.carpark.am/parz-ui)** — в подвале, на экране «О приложении» или «Благодарности», или в настройках. Надпись должна быть читаемой и не скрытой. Слова «Components by» можно перевести.

Проще всего — готовым компонентом `ParzCredit`:

```tsx
import { ParzCredit } from '@carparkteam/parz-ui';

<footer>
  © 2026 Моё приложение · <ParzCredit />
</footer>

// на языке вашего продукта
<ParzCredit prefix="Компоненты от" />
```

© 2026 CarPark Team & Dev.CarPark
