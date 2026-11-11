# Parz Menu

**English** · [Հայերեն](parz-menu.hy.md) · [Русский](parz-menu.ru.md)

The CarPark bottom navigation, packaged as a React component. The active-item highlight flows between tabs like a drop of liquid, and the round buttons on the right respond to taps with a springy bounce. Everything about the look is configurable: colors, sizes, corner radii, glass, animation speed and strength.

- 5–6 items with an icon and a label, a number or dot badge on any item;
- round buttons on the right: an icon or an avatar (letters or a photo), also with a badge;
- icons: built-in, Material Symbols, Material Icons or any React element of your own;
- three layouts: icon above label, inline, icons only;
- sticks to the bottom or top of the screen, or sits in the page flow;
- built-in labels in English, Armenian and Russian (`locale`);
- respects the system “reduce motion” setting and works with the keyboard.

## Installation

```bash
npm install @parz/ui
```

```tsx
import { ParzMenu } from '@parz/ui';
import '@parz/ui/style.css';
```

## Quick start

```tsx
import { useState } from 'react';
import { ParzMenu } from '@parz/ui';
import '@parz/ui/style.css';

export function AppNav() {
  const [tab, setTab] = useState('garage');
  const [panel, setPanel] = useState<string | null>(null);

  return (
    <ParzMenu
      items={[
        { id: 'garage', label: 'Garage', icon: 'ms:directions_car' },
        { id: 'parking', label: 'Parking', icon: 'ms:local_parking', badge: 2 },
        { id: 'map', label: 'Map', icon: 'pin' }
      ]}
      value={panel ?? tab}
      onChange={id => { setPanel(null); setTab(id); }}
      actions={[
        { id: 'notif', ariaLabel: 'Notifications', icon: 'bell', badge: 'dot' },
        { id: 'profile', ariaLabel: 'Profile', avatar: { text: 'A' } }
      ]}
      activeAction={panel}
      onAction={id => setPanel(p => (p === id ? null : id))}
    />
  );
}
```

When a section opened from a round button is showing, pass its id to `value`: the drop under the items hides, because there is no such item. That is how CarPark does it.

## Props

| Prop | Type | Default | What it does |
|---|---|---|---|
| `items` | `TabItem[]` | — | Menu items |
| `value` | `string \| null` | — | Active item (controlled mode). No such item or `null` — the drop hides |
| `defaultValue` | `string` | first item | Active item without outside control |
| `onChange` | `(id) => void` | — | An item was tapped |
| `actions` | `ActionItem[]` | `[]` | Round buttons on the right, two at most. Anything: a bell, a profile, “+”, search… |
| `activeAction` | `string \| null` | `null` | Which round button is highlighted |
| `onAction` | `(id) => void` | — | A round button was tapped |
| `hideActions` | `boolean` | `false` | Hide the round buttons. The menu shrinks to its items and centers |
| `position` | `'bottom' \| 'top' \| 'static'` | `'bottom'` | Stick to the bottom or top of the screen, or sit in the flow |
| `layout` | `'stacked' \| 'inline' \| 'icons'` | `'stacked'` | Icon above label, inline, or icons only |
| `theme` | `Partial<ParzMenuTheme>` | — | Colors and sizes, see below |
| `glass` | `number \| GlassPreset` | — | Glass transparency: 0…100 % or a preset, see “Glass” |
| `overflow` | `'more' \| 'none'` | `'more'` | What to do when items don’t fit: hide them in a “More” button or not |
| `minItemWidth` | `number` | 64 / 104 / 52 | Below this width an item moves into “More”, px. Default depends on `layout` |
| `locale` | `'en' \| 'ru' \| 'hy'` | `'en'` | Language of the built-in labels: “More”, search, badge announcements. Your own `moreLabel`, `ariaLabel`, `searchPlaceholder` take priority |
| `moreLabel` | `string` | from `locale` | Label of the “More” button |
| `mobileSearch` | `boolean \| MobileSearchOptions` | — | iOS-style search on narrow screens, see “Search on phones” |
| `desktop` | `boolean \| DesktopOptions` | — | **Beta.** Header for large screens, see “Desktop header” |
| `moreIcon` | `IconSpec` | `'more'` | Icon of the “More” button. By default three dots in a circle: outlined, filled while a hidden item is open |
| `motion` | `Partial<LiquidMotion>` | — | Animations, see below |
| `maxBadge` | `number` | `99` | Larger numbers show as “99+” |
| `badgeLabel` | `(label, badge) => string` | — | How a screen reader reads an item with a badge |
| `autoLoadFonts` | `boolean` | `true` | Load Material fonts automatically when icons use them |
| `ariaLabel` | `string` | from `locale` | Screen reader label of the whole menu |
| `className`, `style` | — | — | The usual |

### TabItem

| Field | Type | What it does |
|---|---|---|
| `id` | `string` | Unique key |
| `label` | `string` | Label |
| `icon` | `IconSpec` | Icon, see “Icons” |
| `activeIcon` | `IconSpec` | Custom icon for the active state. Not needed for built-in and Material Symbols icons |
| `badge` | `number \| string \| 'dot' \| boolean` | Badge. `0`, `false`, `null` — no badge |
| `disabled` | `boolean` | The item is disabled |
| `ariaLabel` | `string` | Screen reader label instead of `label` |

### ActionItem

| Field | Type | What it does |
|---|---|---|
| `id` | `string` | Unique key |
| `ariaLabel` | `string` | Screen reader label. Required: the button has no text |
| `icon`, `activeIcon` | `IconSpec` | Icon |
| `avatar` | `{ text?: string; src?: string }` | Avatar instead of an icon: letters or a photo |
| `badge` | same as an item | Badge |
| `variant` | `'default' \| 'accent'` | `accent` — a color-filled button for the main action, such as “+” |

## Right buttons

The group on the right holds up to two round buttons of any kind. The bell and avatar in the examples are just the most common choice. Pass more than two and the first two are shown, with a warning in the console.

A button comes in three kinds:
- **icon** — like the bell: `{ id: 'notif', ariaLabel: 'Notifications', icon: 'bell' }`;
- **accent** — filled with color, for the main action: `{ id: 'add', ariaLabel: 'Add', icon: 'plus', variant: 'accent' }`;
- **avatar** — letters or a photo: `{ id: 'profile', ariaLabel: 'Profile', avatar: { src: '/me.jpg' } }`.

A button can open its own section (then pass its id to `activeAction` — it lights up and the drop under the items hides) or just perform an action, like “+”: then nothing needs highlighting.

```tsx
<ParzMenu
  items={items}
  value={panel ?? tab}
  onChange={id => { setPanel(null); setTab(id); }}
  actions={[
    { id: 'notif', ariaLabel: 'Notifications', icon: 'bell', badge: 3 },
    { id: 'add', ariaLabel: 'Add', icon: 'plus', variant: 'accent' }
  ]}
  activeAction={panel}
  onAction={id => (id === 'add' ? openCreateSheet() : setPanel(p => (p === id ? null : id)))}
/>
```

## Adding items on the fly

Items and right buttons can be added and removed at any moment — say, a script turns on an “Offers” item when a sale starts. Nothing jumps:

- a leaving item or button collapses smoothly, its neighbors slide into its place;
- a new one “grows” from zero with a springy overshoot;
- the “More” button appears and disappears the same way when items stop or start fitting;
- the drop travels together with its item.

The duration is the same `motion.shift`. Just change the `items` or `actions` array:

```tsx
const items = [garage, parking, ...(saleIsOn ? [sale] : [])];
```

## Menu without right buttons

If you don’t pass `actions` or set `hideActions`, there is no right group. Toggling `hideActions` is animated: the group folds away, the item capsule smoothly narrows and moves to the center, the drop follows its item. `motion.shift` sets the speed. The item capsule then doesn’t stretch to full width but shrinks to its content and centers. The freed space can go to items: 5–6 fit comfortably on a phone.

```tsx
<ParzMenu
  items={[
    { id: 'home', label: 'Home', icon: 'ms:home' },
    { id: 'search', label: 'Search', icon: 'ms:search' },
    { id: 'parking', label: 'Parking', icon: 'ms:local_parking', badge: 2 },
    { id: 'saved', label: 'Saved', icon: 'ms:favorite' },
    { id: 'profile', label: 'Profile', icon: 'ms:person', badge: 'dot' }
  ]}
  value={tab}
  onChange={setTab}
/>
```

Items are equally wide; `theme.itemMinWidth` (84 px) sets the width. The capsule is “items × that width” wide, but no wider than the screen. If items don’t fit, they share the width equally and long labels get an ellipsis — `layout="icons"` works better then.

## When items don’t fit

The component watches its own width. When an item gets narrower than `minItemWidth` (64 px for the “icon above label” layout), the last items move into a “More” button (three dots in a circle). Tapping it pops up a list of the hidden items: icon, label and badge.

- If a hidden item is open, the drop sits under “More” and the item is highlighted in the list.
- Badges of hidden items gather on “More”: numbers add up, and if there are no numbers a dot appears.
- The list closes on choosing an item, tapping “More” again, clicking outside, or the Esc key.
- The width is recalculated on resize, so tablets and desktops show more items.

```tsx
<ParzMenu items={tenItems} value={tab} onChange={setTab} moreLabel="Other" />
```

To never hide anything, set `overflow="none"` — items just shrink then.

## Search on phones

`mobileSearch` adds iOS-style search on narrow screens. The magnifier becomes the first button in the right group; only the last of the `actions` stays, so the group still has two buttons.

Tapping the magnifier makes the group flow, liquid-like, to the full width of the menu while the item capsule collapses. Inside:
- on the left the magnifier turns into a smaller “✕” — closes search and clears the field, the items come back;
- in the middle is the input, with the keyboard already open;
- on the right, as a separate round button in its own glass, is “→” (search); it rolls out from behind the group and lights up in the accent color once the field has text.

```tsx
<ParzMenu
  items={items}
  actions={[bell, profile]}            // on a phone the group shows the magnifier and the profile
  mobileSearch={{ searchPlaceholder: 'Make or parking', onSearch: q => navigate(`/search?q=${q}`) }}
/>
```

The fields are the same as for the header search: `searchPlaceholder`, `searchValue` / `onSearchChange`, `onSearch`. On a wide screen with the header enabled, the header search is used.

## Desktop header (beta)

On a wide screen the menu can turn into a full top header: logo on the left, then inline items, search in the middle, buttons on the right. Below the header is a blurred shade, so content slides nicely under it while scrolling. On a narrow screen the menu stays a regular bottom bar.

```tsx
<ParzMenu
  items={items}
  value={tab}
  onChange={setTab}
  actions={actions}
  desktop={{
    logo: 'CARPARK',                  // a string or any element: <img>, svg, an animated logo
    search: 'expand',                 // 'bar' | 'button' | 'expand' | 'none'
    searchPlaceholder: 'Make, model or parking…',
    onSearch: q => navigate(`/search?q=${q}`)
  }}
/>
```

| Field | Default | What it does |
|---|---|---|
| `breakpoint` | `1100` | Width from which the header turns on, px |
| `breakpointBy` | `'window'` | Measure the window or the menu’s parent (`'parent'` — for narrow containers and previews) |
| `logo` | — | Logo on the left: a string or a React element |
| `search` | `'bar'` | `bar` — a separate search bar; `button` — a round search button in the right group; `expand` — a button in the right group that expands into a bar right inside the group; `none` — no search |
| `searchPlaceholder` | from `locale` | Placeholder in the bar |
| `searchValue` / `onSearchChange` | — | Search text, if you want to control it yourself |
| `onSearch` | — | Enter was pressed (or the search button in the expanded bar) |
| `onSearchClick` | — | The search button of the `button` kind was pressed — for example, to open your own search |
| `searchShortcut` | `'/'` | Key that opens search; `false` — off |
| `searchWidth` | `420` / `320` | Search bar width, px: 420 for the separate bar, 320 when expanded inside the group |
| `searchAt` | `'start'` | Where the search button sits in the right group (`button`, `expand`, and the phone search): `start` — first, `end` — last |
| `actionsAlign` | `'end'` | Where the right group sits when there is no search bar: `end` — at the right edge, `next` — right after the items |
| `layout` | `'inline'` | Item layout in the header |
| `maxWidth` | `1360` | Header content width, px |
| `height` | `80` | Header height, px |

Header colors are in the theme: `headerTop`, `headerMid` (shade), `headerBlur` (blur), `searchBg`, `searchBorder` (search bar). If items don’t fit next to the logo and search, the same “More” works, only its list opens downward. All header transitions are smooth: switching the search kind (the bar collapses, the button “grows” in the group), moving the group between the edge and the items, the logo appearing or changing, switching between header and bottom bar on resize.

The search button in the `button` and `expand` kinds is the first in the right group and doesn’t count toward the two-button limit. The expanding search stretches the whole group; if items get cramped, the extra ones glide into “More”. It closes on Esc or a click outside when nothing is typed.

## Badges

```tsx
{ id: 'fines', label: 'Fines', icon: 'ms:receipt_long', badge: 3 }     // number
{ id: 'fines', label: 'Fines', icon: 'ms:receipt_long', badge: 150 }   // shows “99+”
{ id: 'news', label: 'New', icon: 'sparkles', badge: 'dot' }           // dot
{ id: 'sale', label: 'Offers', icon: 'gift', badge: 'new' }            // text
```

A badge appears with a springy “hop” and hops again when the number changes. Colors: `badgeBg` and `badgeText` for numbers, `accent` for the dot.

## Icons

| Value | What it is |
|---|---|
| `'pin'` | Built-in icon. On the active item the outline turns into a fill |
| `'ms:home'` | Material Symbols Rounded. On the active item the fill flows in smoothly |
| `'ms:home:outlined'`, `'ms:home:sharp'` | Material Symbols in another style |
| `'mi:home'` | Classic Material Icons (filled) |
| `'mi:home:outlined'` | Also `round`, `sharp`, `two-tone` |
| `<MyIcon />` | Any React element: svg, image, an icon from any library |

Built-in: `film`, `ticket`, `pin`, `bell`, `glasses3d`, `clapperboard`, `flame`, `gift`, `card`, `globe`, `sparkles`, `info`, `logout`, `bulb`, `rotate`, `star`, `check`, `chevL`, `chevR`, `popcorn`, `calendar`, `wallet`, `route`, `users`, `more`, `plus`, `search`, `close`, `arrowR`.

The component loads Material fonts from Google Fonts by itself when it sees `ms:` or `mi:`. If you already load the fonts or Google Fonts is unavailable, turn it off: `autoLoadFonts={false}`. Icon names are at [fonts.google.com/icons](https://fonts.google.com/icons).

For your own icons, set a different active look with `activeIcon`:

```tsx
{ id: 'home', label: 'Home', icon: <HomeOutline />, activeIcon: <HomeFilled /> }
```

## Language

`locale` switches the component’s own labels: the “More” button, the menu label for screen readers, search placeholders and buttons, and how a dot badge is announced.

| `locale` | “More” | Search | Dot badge |
|---|---|---|---|
| `'en'` (default) | More | Search | “Parking, new” |
| `'hy'` | Մենյու | Որոնում | “Կայանատեղի, նոր” |
| `'ru'` | Меню | Поиск | “Парковка, есть новое” |

```tsx
<ParzMenu locale="hy" items={items} />
```

Item labels and `ariaLabel` of the buttons are yours — translate them in your app. The strings themselves are exported as `LTB_STRINGS` if you need them elsewhere.

## Theme

All fields are optional. Colors are any CSS colors, sizes are numbers in pixels.

| Field | Default | What it sets |
|---|---|---|
| `accent` | `#6ee7a0` | Dot badge, focus ring, active avatar outline |
| `text` / `textActive` | `#8b8b93` / `#fff` | Labels and icons |
| `surfaceTop` / `surfaceBottom` | dark glass | Capsule gradient |
| `border` | `rgba(255,255,255,.06)` | Thin capsule border |
| `bevelTop` / `bevelBottom` | white 14% / black 40% | Capsule bevel: a line on top and a shade below. On a light theme make the bottom one almost transparent |
| `highlightTop` / `highlightBottom` | white 13% / 5% | Drop gradient |
| `highlightShadow` | thin highlight | Drop shadow and highlight (CSS box-shadow). On a light theme — a soft shadow below |
| `actionBg` | white 7% | Round button background |
| `actionActiveBg` / `actionActiveText` | `#fff` / `#000` | Pressed round button |
| `actionAccentBg` / `actionAccentText` | `#6ee7a0` / `#04130a` | Accent round button (`variant: 'accent'`) |
| `badgeBg` / `badgeText` | `#ff4d5e` / `#fff` | Number badge |
| `badgeRing` | `#1d1d21` | Ring around the badge — use the bar color |
| `avatarFrom` / `avatarTo` / `avatarText` | green gradient | Avatar |
| `fontFamily` | `inherit` | Label font |
| `radius` | `999` | Capsule and drop corner radius |
| `padding` | `6` | Padding inside capsules |
| `gap` | `10` | Space between capsules |
| `itemPaddingY` | `8` | Item height |
| `iconSize` | `22` | Icon size |
| `fontSize` | `11` | Label size |
| `actionSize` | `50` | Round button diameter |
| `blur` | `20` | Glass blur |
| `maxWidth` | `540` | Menu width on wide screens |
| `offset` | `12` | Offset from the screen edge |
| `itemMinWidth` | `84` | Item width in a menu without right buttons |
| `shadow` | soft shadow | Shadow under the capsules |
| `headerTop` / `headerMid` | near-black 96% / 82% | Shade under the header on large screens: top and middle, fades out below |
| `headerBlur` | `14` | Blur under the header |
| `searchBg` / `searchBorder` | white 6% / 8% | Search bar background and border |

The same can be set in CSS — every field is a `--ltb-*` variable:

```css
.my-bar {
  --ltb-accent: #ff7a00;
  --ltb-surface-top: rgba(255, 255, 255, .8);
  --ltb-surface-bottom: rgba(240, 240, 245, .9);
  --ltb-text: #6b6b75;
  --ltb-text-active: #111;
}
```

```tsx
<ParzMenu className="my-bar" items={items} />
```

## Glass

The `glass` prop sets how transparent the capsule background is: a number from 0 to 100 (percent transparency) or a ready preset. The color stays from the theme (`surfaceTop` / `surfaceBottom`); only the transparency changes.

| Preset | Transparency | Blur | Looks like |
|---|---|---|---|
| `'solid'` | 0 % | 0 | A solid plate, content doesn’t show through |
| `'frosted'` | 15 % | 20 px | Frosted glass — like in CarPark |
| `'glass'` | 40 % | 16 px | Noticeably see-through |
| `'clear'` | 70 % | 10 px | Almost transparent, held together by blur and border |
| `'none'` | 100 % | 0 | No background — only icons, labels and the drop |

```tsx
<ParzMenu glass="glass" items={items} />      // preset
<ParzMenu glass={55} items={items} />          // 55 % transparency, blur from the theme
```

A preset sets the blur too. Need your own blur — pass `glass` as a number and set the blur in `theme.blur`. Without `glass` the transparency comes from the theme colors as is. For colors in `hsl()`, `oklch()` and names like `navy` the transparency doesn’t change — use `#rrggbb` or `rgb()`.

## Animations

| Field | Default | What it sets |
|---|---|---|
| `lead` | `360` | Duration of the drop’s leading edge, ms |
| `lag` | `660` | Duration of the trailing edge, ms. The bigger the gap to `lead`, the more the drop stretches |
| `squash` | `0.26` | How much the drop flattens in flight. `0` — not at all |
| `overshoot` | `1.35` | Springiness: `1` — no overshoot, `1.6` — strong |
| `jelly` | `true` | Springy response of round buttons and a “splash” of their capsule |
| `wave` | `0.035` | A springy wave of the whole item capsule: on a switch — in the drop’s direction, on returning from the right buttons — to the left, on tapping the open item again — from the center. `0` — off, `0.08` — strong |
| `shift` | `550` | How many ms the right group takes to appear or hide while items move to the center |

```tsx
<ParzMenu motion={{ lead: 280, lag: 820, squash: 0.35 }} items={items} />
```

With the system “reduce motion” setting the drop just moves quickly, without stretching or springiness.

## Accessibility

- The menu is a `nav` element, the active item has `aria-current="page"`, round buttons use `aria-pressed`.
- A badge is read together with its item: “Fines, 3”, “New, new”. Change the wording with `badgeLabel` or the language with `locale`.
- Everything works from the keyboard: Tab and Enter, with a visible focus ring.

## What’s not here

- Your own messages, routing and page state: the component only shows the menu and reports taps.
- Dragging items and swiping between tabs.
- Support for browsers without `backdrop-filter`: capsules there will have a background but no blur.
