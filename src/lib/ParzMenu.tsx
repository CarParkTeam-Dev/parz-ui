import {
  useCallback, useEffect, useLayoutEffect, useMemo, useReducer, useRef, useState,
  type CSSProperties, type ReactNode
} from 'react';
import { Icon, loadMaterialFont, parseIcon, type IconSpec } from './Icon';
import './ParzMenu.css';

/** Бейдж: число (0 — скрыт), строка («new»), 'dot' или true — точка. */
export type BadgeValue = number | string | 'dot' | boolean | null | undefined;

export interface TabItem {
  id: string;
  label: string;
  icon: IconSpec;
  /** Иконка активного состояния. Не нужна для встроенных и Material Symbols — у них есть заливка. */
  activeIcon?: IconSpec;
  badge?: BadgeValue;
  disabled?: boolean;
  /** Подпись для экранного диктора, если label не подходит. */
  ariaLabel?: string;
}

export interface ActionItem {
  id: string;
  /** Подпись для экранного диктора — обязательна: у кнопки нет текста. */
  ariaLabel: string;
  icon?: IconSpec;
  activeIcon?: IconSpec;
  /** Кнопка-аватар вместо иконки: буквы или картинка. */
  avatar?: { text?: string; src?: string };
  badge?: BadgeValue;
  /** accent — залитая цветом кнопка для главного действия («+», «Купить»). default — обычная, как колокольчик. */
  variant?: 'default' | 'accent';
}

export interface LiquidTabBarTheme {
  /** Акцент: точка-бейдж, кольцо фокуса. */
  accent: string;
  text: string;
  textActive: string;
  /** Стекло панели: верх и низ градиента. */
  surfaceTop: string;
  surfaceBottom: string;
  /** Тонкая обводка панели. */
  border: string;
  /** Объёмный блик капсул: светлая линия сверху и тень снизу. На светлой теме нижнюю делайте почти прозрачной. */
  bevelTop: string;
  bevelBottom: string;
  /** Капля-подсветка активного пункта: верх и низ градиента. */
  highlightTop: string;
  highlightBottom: string;
  /** Тень и блик капли (CSS box-shadow). На светлой теме — мягкая тень снизу, как у «таблетки». */
  highlightShadow: string;
  /** Фон круглых кнопок справа. */
  actionBg: string;
  actionActiveBg: string;
  actionActiveText: string;
  /** Акцентная круглая кнопка (variant: 'accent'), например «+». */
  actionAccentBg: string;
  actionAccentText: string;
  badgeBg: string;
  badgeText: string;
  /** Кольцо вокруг бейджа — обычно цвет панели, чтобы бейдж «вырезался» из иконки. */
  badgeRing: string;
  avatarFrom: string;
  avatarTo: string;
  avatarText: string;
  fontFamily: string;
  /** Размеры — числа в px. */
  radius: number;
  padding: number;
  gap: number;
  itemPaddingY: number;
  iconSize: number;
  fontSize: number;
  actionSize: number;
  blur: number;
  maxWidth: number;
  /** Отступ от края экрана для position: 'bottom' | 'top'. */
  offset: number;
  /** Ширина пункта, когда меню без кнопок справа и стоит по центру. Если пункты не влезают, они делят ширину поровну. */
  itemMinWidth: number;
  /** Тень под панелью (CSS box-shadow). */
  shadow: string;
  /** Фон шапки на большом экране: сверху и в середине, ниже — растворяется. */
  headerTop: string;
  headerMid: string;
  /** Размытие под шапкой, px. */
  headerBlur: number;
  /** Строка поиска: фон и обводка. */
  searchBg: string;
  searchBorder: string;
}

export interface LiquidMotion {
  /** Время ведущего края капли, мс. */
  lead: number;
  /** Время отстающего края капли, мс. Чем больше разница с lead — тем сильнее капля тянется. */
  lag: number;
  /** Насколько капля сплющивается в полёте, 0…0.6. 0 — без сплющивания. */
  squash: number;
  /** Упругость кнопок справа и «всплеск» их капсулы при нажатии. */
  jelly: boolean;
  /** Пружинистость ведущего края, 1 — без перелёта, 1.6 — сильный перелёт. */
  overshoot: number;
  /** Время, за которое группа справа появляется/прячется и пункты переезжают по центру, мс. */
  shift: number;
  /** Упругая «волна» всей капсулы с пунктами при переключении — в сторону, куда уехала капля. 0 — выключено, 0.03–0.05 — мягко, 0.08 — сильно. */
  wave: number;
}

/** Режим шапки для больших экранов (beta). */
export interface DesktopOptions {
  /** Где кнопка поиска в группе справа (для search: 'button' | 'expand'): start — первой (по умолчанию), end — последней. */
  searchAt?: 'start' | 'end';
  /** С какой ширины включается шапка, px. По умолчанию 1100. */
  breakpoint?: number;
  /** По ширине чего решать: окна браузера (обычно) или родителя меню (если меню живёт в узком контейнере или в превью). */
  breakpointBy?: 'window' | 'parent';
  /** Логотип слева: строка — простая надпись, или любой React-элемент (например, анимированный логотип). */
  logo?: ReactNode;
  /** Поиск: строка (bar), круглая кнопка (button), кнопка, которая раскрывается в строку (expand), или без поиска (none). */
  search?: 'bar' | 'button' | 'expand' | 'none';
  searchPlaceholder?: string;
  /** Текст поиска (управляемый режим). */
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  /** Нажали Enter в строке поиска. */
  onSearch?: (value: string) => void;
  /** Нажали кнопку поиска (вид button). */
  onSearchClick?: () => void;
  /** Клавиша, которая открывает поиск. По умолчанию «/», false — выключить. */
  searchShortcut?: string | false;
  /** Ширина строки поиска, px. По умолчанию 420. */
  searchWidth?: number;
  /** Раскладка пунктов в шапке. По умолчанию inline — иконка и подпись в строку. */
  layout?: 'stacked' | 'inline' | 'icons';
  /** Где стоит группа справа, если нет строки поиска: end — прижата к правому краю (по умолчанию), next — сразу за пунктами. */
  actionsAlign?: 'end' | 'next';
  /** Ширина содержимого шапки, px. По умолчанию 1360. */
  maxWidth?: number;
  /** Высота шапки, px. По умолчанию 80. */
  height?: number;
}

/** Поиск на узком экране (как в iOS): лупа в группе справа раскрывается в строку на всю ширину. */
export interface MobileSearchOptions {
  /** Где лупа в группе справа: start — первой (по умолчанию), end — последней. */
  searchAt?: 'start' | 'end';
  searchPlaceholder?: string;
  /** Текст поиска (управляемый режим). */
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  /** Нажали стрелку «→» или Enter. */
  onSearch?: (value: string) => void;
}

export interface LiquidTabBarProps {
  items: TabItem[];
  /** Активный пункт (управляемый режим). Можно передать id действия справа или null — тогда капля прячется. */
  value?: string | null;
  /** Активный пункт по умолчанию (неуправляемый режим). */
  defaultValue?: string;
  onChange?: (id: string) => void;
  /** Круглые кнопки справа — не больше двух. Любые: уведомления, профиль, «+», поиск… Лишние отбрасываются. */
  actions?: ActionItem[];
  /** Какая кнопка справа сейчас «нажата» (подсвечена). */
  activeAction?: string | null;
  onAction?: (id: string) => void;
  /** Спрятать круглые кнопки справа, не убирая actions. Без них меню сжимается по пунктам и встаёт по центру. */
  hideActions?: boolean;
  /** bottom / top — прилипает к краю экрана; static — встаёт в поток страницы. */
  position?: 'bottom' | 'top' | 'static';
  /** stacked — иконка над подписью (как в Meridian); inline — в строку; icons — только иконки. */
  layout?: 'stacked' | 'inline' | 'icons';
  theme?: Partial<LiquidTabBarTheme>;
  motion?: Partial<LiquidMotion>;
  /** Числа больше этого показываются как «99+». */
  maxBadge?: number;
  /** Подпись бейджа для экранного диктора. */
  badgeLabel?: (label: string, badge: Exclude<BadgeValue, null | undefined | false>) => string;
  /**
   * Прозрачность стекла капсул: число 0…100 (% прозрачности) или готовый пресет.
   * 0 — сплошной фон, 100 — фона нет совсем. Цвет берётся из темы (surfaceTop/surfaceBottom), меняется только прозрачность.
   * Пресет задаёт ещё и размытие; число меняет только прозрачность, размытие тогда из theme.blur.
   */
  glass?: number | GlassPreset;
  /**
   * Что делать, если пункты не помещаются по ширине.
   * more — последние пункты прячутся в кнопку «Меню» (•••), по нажатию всплывает их список; none — ничего не прятать.
   */
  overflow?: 'more' | 'none';
  /** Меньше какой ширины пункт считается «не помещается», px. По умолчанию 64 (stacked), 104 (inline), 52 (icons). */
  minItemWidth?: number;
  /** Подпись кнопки «Меню». */
  moreLabel?: string;
  /** Иконка кнопки «Меню». По умолчанию — встроенная 'more' (три точки в круге, IconMCP): контур, у активной — заливка. */
  moreIcon?: IconSpec;
  /**
   * Шапка для больших экранов (beta): на широком экране меню становится верхней шапкой во всю ширину —
   * логотип, пункты в строку, поиск и кнопки справа, под шапкой затенение с размытием. На узком экране всё как обычно.
   * true — с настройками по умолчанию.
   */
  desktop?: boolean | DesktopOptions;
  /**
   * Поиск на узком экране, как в iOS: лупа встаёт первой в группу справа (из кнопок остаётся последняя — всего две).
   * По нажатию группа растекается на всю ширину: слева «✕» (закрыть), посередине поле, справа «→» (искать). Пункты на это время уходят.
   */
  mobileSearch?: boolean | MobileSearchOptions;
  /** Язык встроенных подписей: «Меню», поиск, озвучка бейджей. По умолчанию en. Свои moreLabel, ariaLabel, searchPlaceholder важнее. */
  locale?: LiquidLocale;
  /** Сам подключать шрифты Material, если они встретились в иконках. По умолчанию — да. */
  autoLoadFonts?: boolean;
  ariaLabel?: string;
  className?: string;
  style?: CSSProperties;
}

export const DEFAULT_THEME: LiquidTabBarTheme = {
  accent: '#6ee7a0', text: '#8b8b93', textActive: '#ffffff',
  surfaceTop: 'rgba(38,38,42,.82)', surfaceBottom: 'rgba(20,20,23,.88)', border: 'rgba(255,255,255,.06)', bevelTop: 'rgba(255,255,255,.14)', bevelBottom: 'rgba(0,0,0,.4)',
  highlightTop: 'rgba(255,255,255,.13)', highlightBottom: 'rgba(255,255,255,.05)',
  highlightShadow: 'inset 0 1px 0 rgba(255,255,255,.16),inset 0 -1px 0 rgba(0,0,0,.25)',
  actionBg: 'rgba(255,255,255,.07)', actionActiveBg: '#ffffff', actionActiveText: '#000000',
  actionAccentBg: '#6ee7a0', actionAccentText: '#04130a',
  badgeBg: '#ff4d5e', badgeText: '#ffffff', badgeRing: '#1d1d21',
  avatarFrom: '#6ee7a0', avatarTo: '#2d6a4f', avatarText: '#04130a',
  fontFamily: 'inherit',
  radius: 999, padding: 6, gap: 10, itemPaddingY: 8, iconSize: 22, fontSize: 11, actionSize: 50, blur: 20, maxWidth: 540, offset: 12, itemMinWidth: 84,
  shadow: '0 18px 40px -12px rgba(0,0,0,.8)',
  headerTop: 'rgba(9,9,11,.96)', headerMid: 'rgba(9,9,11,.82)', headerBlur: 14,
  searchBg: 'rgba(255,255,255,.06)', searchBorder: 'rgba(255,255,255,.08)'
};

export type GlassPreset = 'solid' | 'frosted' | 'glass' | 'clear' | 'none';
/** Готовые пресеты стекла: прозрачность фона в % и размытие в px. frosted — как в Meridian. */
export const GLASS_PRESETS: Record<GlassPreset, { label: string; transparency: number; blur: number }> = {
  solid: { label: 'Сплошной', transparency: 0, blur: 0 },
  frosted: { label: 'Матовое', transparency: 15, blur: 20 },
  glass: { label: 'Стекло', transparency: 40, blur: 16 },
  clear: { label: 'Прозрачное', transparency: 70, blur: 10 },
  none: { label: 'Без фона', transparency: 100, blur: 0 }
};

/** Тот же цвет с другой прозрачностью. Понимает #rgb, #rrggbb, rgb() и rgba(); остальные цвета возвращает как есть. */
export function withAlpha(color: string, alpha: number): string {
  const a = Math.max(0, Math.min(1, alpha));
  let r: number, g: number, b: number;
  const m = /^rgba?\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)/i.exec(color.trim());
  if (m) [r, g, b] = [+m[1], +m[2], +m[3]];
  else if (/^#[0-9a-f]{6}$/i.test(color)) { const n = parseInt(color.slice(1), 16); [r, g, b] = [n >> 16, (n >> 8) & 255, n & 255]; }
  else if (/^#[0-9a-f]{3}$/i.test(color)) [r, g, b] = [...color.slice(1)].map(x => parseInt(x + x, 16));
  else return color;
  return `rgba(${r},${g},${b},${+a.toFixed(3)})`;
}

export const DEFAULT_MOTION: LiquidMotion = { lead: 360, lag: 660, squash: 0.26, jelly: true, overshoot: 1.35, shift: 550, wave: 0.035 };

const VARS: Record<keyof LiquidTabBarTheme, string> = {
  accent: '--ltb-accent', text: '--ltb-text', textActive: '--ltb-text-active',
  surfaceTop: '--ltb-surface-top', surfaceBottom: '--ltb-surface-bottom', border: '--ltb-border', bevelTop: '--ltb-bevel-top', bevelBottom: '--ltb-bevel-bottom',
  highlightTop: '--ltb-hl-top', highlightBottom: '--ltb-hl-bottom', highlightShadow: '--ltb-hl-shadow',
  actionBg: '--ltb-action-bg', actionActiveBg: '--ltb-action-active-bg', actionActiveText: '--ltb-action-active-text',
  actionAccentBg: '--ltb-action-accent-bg', actionAccentText: '--ltb-action-accent-text',
  badgeBg: '--ltb-badge-bg', badgeText: '--ltb-badge-text', badgeRing: '--ltb-badge-ring',
  avatarFrom: '--ltb-avatar-from', avatarTo: '--ltb-avatar-to', avatarText: '--ltb-avatar-text',
  fontFamily: '--ltb-font',
  radius: '--ltb-radius', padding: '--ltb-pad', gap: '--ltb-gap', itemPaddingY: '--ltb-item-py', iconSize: '--ltb-icon',
  fontSize: '--ltb-font-size', actionSize: '--ltb-action', blur: '--ltb-blur', maxWidth: '--ltb-max-width', offset: '--ltb-offset', itemMinWidth: '--ltb-item-min',
  shadow: '--ltb-shadow',
  headerTop: '--ltb-header-top', headerMid: '--ltb-header-mid', headerBlur: '--ltb-header-blur',
  searchBg: '--ltb-search-bg', searchBorder: '--ltb-search-border'
};

export type LiquidLocale = 'en' | 'ru' | 'hy';
/** Встроенные подписи компонента (кнопка «Меню», поиск, озвучка бейджа) на трёх языках. */
export const LTB_STRINGS: Record<LiquidLocale, { more: string; nav: string; search: string; closeSearch: string; go: string; hasNew: string }> = {
  en: { more: 'More', nav: 'Navigation', search: 'Search', closeSearch: 'Close search', go: 'Search', hasNew: 'new' },
  ru: { more: 'Меню', nav: 'Навигация', search: 'Поиск', closeSearch: 'Закрыть поиск', go: 'Искать', hasNew: 'есть новое' },
  hy: { more: 'Մենյու', nav: 'Նավիգացիա', search: 'Որոնում', closeSearch: 'Փակել որոնումը', go: 'Որոնել', hasNew: 'նոր' }
};
const makeBadgeLabel = (hasNew: string) => (label: string, b: Exclude<BadgeValue, null | undefined | false>) =>
  b === 'dot' || b === true ? `${label}, ${hasNew}` : `${label}, ${b}`;

function useReducedMotion() {
  const [r, setR] = useState(() => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches);
  useEffect(() => {
    const m = matchMedia('(prefers-reduced-motion: reduce)');
    const f = () => setR(m.matches);
    m.addEventListener('change', f);
    return () => m.removeEventListener('change', f);
  }, []);
  return r;
}

/** Кривая на КАЖДЫЙ отрезок между кадрами — так работает CSS animation-timing-function в Meridian.
 *  В Web Animations опция easing растягивает кривую на всю анимацию, а между кадрами движение идёт ровно — получается вязко, без «пружины». */
const SPRING = 'cubic-bezier(.22,1,.36,1)';
const eased = (frames: Keyframe[]): Keyframe[] => frames.map(f => ({ easing: SPRING, ...f }));

const MORE_ID = '__ltb_more__';

/**
 * «Присутствие» элементов списка: если пункт или кнопку убрали (например, скрипт на сайте выключил её на лету),
 * она не исчезает разом, а остаётся на ms миллисекунд с пометкой leaving — за это время CSS плавно её схлопывает.
 * Новые элементы помечаются entering на первую отрисовку — их «выращивает» анимация появления.
 */
type Presence<T> = { item: T; leaving: boolean; entering: boolean };
function usePresence<T extends { id: string }>(list: T[], ms: number): Presence<T>[] {
  const [, force] = useReducer((x: number) => x + 1, 0);
  const prev = useRef<T[]>(list);
  const gone = useRef(new Map<string, { item: T; at: number }>());
  const known = useRef(new Set(list.map(i => i.id)));
  const ids = new Set(list.map(i => i.id));
  gone.current.forEach((_, id) => { if (ids.has(id)) gone.current.delete(id); }); // вернули обратно — уже не уходит
  prev.current.forEach((it, i) => { if (!ids.has(it.id) && !gone.current.has(it.id)) gone.current.set(it.id, { item: it, at: i }); });
  const out: Presence<T>[] = list.map(item => ({ item, leaving: false, entering: !known.current.has(item.id) }));
  [...gone.current.values()].sort((a, b) => a.at - b.at).forEach(({ item, at }) => out.splice(Math.min(at, out.length), 0, { item, leaving: true, entering: false }));
  useLayoutEffect(() => { prev.current = list; list.forEach(i => known.current.add(i.id)); });
  const leavingKey = [...gone.current.keys()].join('|');
  useEffect(() => {
    if (!leavingKey) return;
    const t = window.setTimeout(() => { gone.current.forEach((_, id) => known.current.delete(id)); gone.current.clear(); force(); }, ms + 40);
    return () => window.clearTimeout(t);
  }, [leavingKey, ms]);
  return out;
}
const MAX_ACTIONS = 2;

const hasBadge = (b: BadgeValue) => !(b == null || b === false || b === 0 || b === '');

export function Badge({ value, max = 99, inline }: { value: BadgeValue; max?: number; inline?: boolean }) {
  if (!hasBadge(value)) return null;
  if (value === 'dot' || value === true) return <span className={`ltb-badge ltb-badge--dot${inline ? ' ltb-badge--inline' : ''}`} aria-hidden="true" />;
  const text = typeof value === 'number' ? (value > max ? `${max}+` : String(value)) : String(value);
  // key — при смене числа бейдж «подпрыгивает» заново
  return <span key={text} className={`ltb-badge ltb-badge--count${text.length > 2 ? ' ltb-badge--wide' : ''}${inline ? ' ltb-badge--inline' : ''}`} aria-hidden="true"><span className="ltb-badge-n">{text}</span></span>;
}

export function LiquidTabBar({
  items, value, defaultValue, onChange, actions: allActions = [], activeAction = null, onAction, hideActions = false,
  position: positionProp = 'bottom', layout: layoutProp = 'stacked', theme, motion, maxBadge = 99, badgeLabel: badgeLabelProp, locale = 'en',
  glass, overflow = 'more', minItemWidth, moreLabel: moreLabelProp, moreIcon, desktop, mobileSearch, autoLoadFonts = true, ariaLabel: ariaLabelProp, className, style
}: LiquidTabBarProps) {
  const L = LTB_STRINGS[locale] ?? LTB_STRINGS.en;
  const moreLabel = moreLabelProp ?? L.more, ariaLabel = ariaLabelProp ?? L.nav;
  const badgeLabel = badgeLabelProp ?? makeBadgeLabel(L.hasNew);
  // в группе справа — не больше двух кнопок: так она остаётся компактной и пунктам хватает места
  const actions = allActions.length > MAX_ACTIONS ? allActions.slice(0, MAX_ACTIONS) : allActions;
  if (allActions.length > MAX_ACTIONS && typeof console !== 'undefined')
    console.warn(`LiquidTabBar: в actions ${allActions.length} кнопки, показаны первые ${MAX_ACTIONS}.`);
  const showSide = !hideActions && actions.length > 0;
  const [inner, setInner] = useState<string | null | undefined>(defaultValue ?? items[0]?.id);
  const current = value !== undefined ? value : inner;
  const M = { ...DEFAULT_MOTION, ...motion };
  const reduce = useReducedMotion();

  const navRef = useRef<HTMLElement>(null);

  /* ---- шапка для больших экранов (beta) ---- */
  const D: DesktopOptions | null = desktop ? (desktop === true ? {} : desktop) : null;
  const bp = D?.breakpoint ?? 1100, bpBy = D?.breakpointBy ?? 'window';
  const [isDesk, setDesk] = useState(() => !!D && bpBy === 'window' && typeof window !== 'undefined' && window.innerWidth >= bp);
  useLayoutEffect(() => {
    if (!D) { setDesk(false); return; }
    const check = () => {
      const w = bpBy === 'parent' ? (navRef.current?.parentElement?.clientWidth ?? window.innerWidth) : window.innerWidth;
      setDesk(w >= bp);
    };
    check();
    const parent = navRef.current?.parentElement;
    const ro = typeof ResizeObserver !== 'undefined' && bpBy === 'parent' && parent ? new ResizeObserver(check) : null;
    if (ro && parent) ro.observe(parent);
    window.addEventListener('resize', check);
    return () => { ro?.disconnect(); window.removeEventListener('resize', check); };
  }, [!!D, bp, bpBy]);
  const layout = isDesk ? (D?.layout ?? 'inline') : layoutProp;
  const position = isDesk ? 'top' : positionProp;
  const MS: MobileSearchOptions | null = mobileSearch ? (mobileSearch === true ? {} : mobileSearch) : null;
  const searchKind: 'bar' | 'button' | 'expand' | 'none' | 'full' = isDesk ? (D?.search ?? 'bar') : MS ? 'full' : 'none';
  /** настройки поиска для текущей раскладки: шапка или узкий экран */
  const SO: MobileSearchOptions | null = isDesk ? D : MS;
  // кнопка поиска (и раскрывающийся поиск) на ПК живёт внутри группы справа — первой кнопкой; строка — отдельно
  const searchInSide = searchKind === 'button' || searchKind === 'expand' || searchKind === 'full';
  // на узком экране с поиском в группе — две кнопки: лупа и последняя из actions
  const sideActs = searchKind === 'full' ? actions.slice(-1) : actions;
  /** группа справа видна: есть кнопки или в ней сидит поиск */
  const sideOn = showSide || searchInSide;
  /** сколько круглых кнопок в группе */
  const sideCount = (showSide ? sideActs.length : 0) + (searchInSide ? 1 : 0);
  const searchInW = D?.searchWidth ?? 320;
  const logoRef = useRef<HTMLDivElement>(null);
  const hasLogo = D?.logo != null && D.logo !== false && D.logo !== '';
  const searchOpenRef = useRef(false);
  const measureRef = useRef<HTMLDivElement>(null);

  const mainRef = useRef<HTMLDivElement>(null);
  const hlRef = useRef<HTMLSpanElement>(null);
  const moreRef = useRef<HTMLButtonElement | null>(null);

  /* ---- адаптивность: сколько пунктов помещается. Лишние прячутся в «Меню» ---- */
  const minW = minItemWidth ?? (layout === 'inline' ? 104 : layout === 'icons' ? 52 : 64);
  const [slots, setSlots] = useState(Infinity);
  const [sideSpace, setSideSpace] = useState(0);
  const measure = useCallback(() => {
    const nav = navRef.current;
    if (!nav) return;
    const cs = getComputedStyle(nav), px = (v: string) => parseFloat(cs.getPropertyValue(v)) || 0;
    const pad = px('--ltb-pad'), gap = px('--ltb-gap'), act = px('--ltb-action');
    // ширину группы справа считаем по итоговому размеру, а не по текущему — пока она анимируется, пункты не должны прыгать
    const hg = isDesk ? parseFloat(cs.columnGap) || 0 : gap; // зазор между капсулами: в шапке свой
    let side = sideCount ? sideCount * (act + pad) + pad + hg : 0;
    if (searchInSide && searchKind !== 'full' && searchOpenRef.current) side += Math.max(0, searchInW - act); // раскрытый поиск в группе (на узком экране пункты в это время скрыты — не пересчитываем)
    let avail = nav.clientWidth - side - 2 * pad;
    let n: number;
    if (isDesk) {
      // шапка: вычитаем её поля, логотип и распорку (строке поиска — не меньше 220 px)
      avail -= (parseFloat(cs.paddingLeft) || 0) + (parseFloat(cs.paddingRight) || 0);
      if (logoRef.current && hasLogo) avail -= logoRef.current.offsetWidth + hg;
      avail -= (searchKind === 'bar' ? 220 : 0) + (searchKind === 'bar' || D?.actionsAlign !== 'next' ? hg : 0);
      // у пунктов в шапке своя ширина (подпись, бейдж) — меряем каждый в невидимом ряду и берём столько, сколько влезает целиком
      const row = measureRef.current, ws = row ? [...row.children].map(c => (c as HTMLElement).offsetWidth) : [];
      const moreW = ws.pop() ?? 0;
      const total = ws.reduce((a, b) => a + b, 0);
      if (!ws.length || total <= avail) n = Infinity;
      else {
        let k = 0, sum = 0;
        while (k < ws.length && sum + ws[k] + moreW <= avail) sum += ws[k++];
        n = Math.max(1, k) + 1; // видимые пункты + «Меню»
      }
    } else n = Math.max(1, Math.floor(avail / minW));
    setSlots(s => (s === n ? s : n));
    setSideSpace(s => (s === side ? s : side));
  }, [sideCount, searchInSide, searchInW, minW, isDesk, searchKind, hasLogo, D?.actionsAlign]);
  useLayoutEffect(() => { measure(); }, [measure, layout]);
  useEffect(() => {
    const nav = navRef.current;
    if (!nav || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => measure());
    ro.observe(nav);
    if (measureRef.current) ro.observe(measureRef.current); // пункты поменяли ширину (подпись, бейдж) — пересчитываем
    return () => ro.disconnect();
  }, [measure]);
  const overflowing = overflow === 'more' && items.length > slots;
  const visible = overflowing ? items.slice(0, Math.max(1, slots - 1)) : items;
  const hidden = overflowing ? items.slice(visible.length) : [];
  const hiddenActive = hidden.some(i => i.id === current);
  /** куда встаёт капля: на пункт или на «Меню», если открыт спрятанный пункт */
  const target = hiddenActive ? MORE_ID : current;
  // бейдж «Меню»: сумма чисел скрытых пунктов, иначе точка, если у кого-то есть точка или текст
  const moreBadge: BadgeValue = (() => {
    const bs = hidden.map(i => i.badge).filter(hasBadge);
    if (!bs.length) return undefined;
    const sum = bs.reduce<number>((a, b) => a + (typeof b === 'number' ? b : 0), 0);
    return sum > 0 ? sum : 'dot';
  })();
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => { if (!hidden.length) setMenuOpen(false); }, [hidden.length]);
  // пункты и кнопки справа появляются и уходят плавно — даже если их включает или выключает скрипт на лету
  const presenceMs = reduce ? 0 : M.shift;
  type MainEntry = { id: string; it?: TabItem };
  const mainList = usePresence<MainEntry>(useMemo(() => [...visible.map(it => ({ id: it.id, it })), ...(overflowing ? [{ id: MORE_ID }] : [])],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [visible.map(i => i.id + '\u0001' + i.label).join('|'), overflowing, visible]), presenceMs);
  const sideList = usePresence(sideActs, presenceMs);
  const searchList = usePresence(useMemo(() => (searchInSide ? [{ id: `search-${searchKind}` }] : []), [searchInSide, searchKind]), presenceMs);
  // переход «телефон ↔ шапка»: меню мягко проявляется на новом месте, а не перескакивает
  const firstDesk = useRef(true);
  useLayoutEffect(() => {
    if (firstDesk.current) { firstDesk.current = false; return; }
    const nav = navRef.current;
    if (!nav?.animate || reduce) return;
    nav.animate(eased([{ opacity: 0, transform: `translateY(${isDesk ? -16 : 16}px)` }, { opacity: 1, transform: 'none' }]), { duration: 520 });
  }, [isDesk]);
  // закрываем по клику мимо и по Esc
  useEffect(() => {
    if (!menuOpen) return;
    const down = (e: PointerEvent) => { if (!navRef.current?.contains(e.target as Node)) setMenuOpen(false); };
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') { setMenuOpen(false); moreRef.current?.focus(); } };
    document.addEventListener('pointerdown', down);
    document.addEventListener('keydown', key);
    return () => { document.removeEventListener('pointerdown', down); document.removeEventListener('keydown', key); };
  }, [menuOpen]);
  const sideRef = useRef<HTMLDivElement>(null);
  const btns = useRef(new Map<string, HTMLButtonElement>());
  const prevLeft = useRef<number | null>(null);

  // шрифты Material — только если они реально используются
  useEffect(() => {
    if (!autoLoadFonts) return;
    [...items, ...actions].flatMap(i => [i.icon, i.activeIcon]).forEach(sp => {
      const p = parseIcon(sp);
      if (p.kind === 'ms' || p.kind === 'mi') loadMaterialFont(p.kind, p.style);
    });
  }, [items, actions, autoLoadFonts]);

  /** Ставит каплю под активный пункт. Края едут с разной скоростью — отсюда «растяжение». */
  /** Капля коротко сплющивается — при переходе и при повторном нажатии. */
  const squashHl = useCallback((dur: number, k = 1) => {
    const hl = hlRef.current, s = M.squash * k;
    if (!hl?.animate || reduce || s <= 0) return;
    hl.animate(eased(
      [{ transform: 'scaleY(1)' }, { transform: `scaleY(${1 - s})`, offset: 0.28 }, { transform: `scaleY(${1 + s * 0.27})`, offset: 0.62 },
       { transform: `scaleY(${1 - s * 0.08})`, offset: 0.82 }, { transform: 'scaleY(1)' }]),
      { duration: dur }
    );
  }, [M.squash, reduce]);

  /** Упругая волна всей капсулы: dir > 0 — тянется вправо, dir < 0 — влево, 0 — от центра (повторное нажатие). */
  const waveMain = useCallback((dir: number) => {
    const main = mainRef.current, w = M.wave;
    if (!main?.animate || reduce || w <= 0) return;
    main.style.transformOrigin = dir > 0 ? '0 50%' : dir < 0 ? '100% 50%' : '50% 50%';
    main.animate(eased(
      [{ transform: 'none' }, { transform: `scale(${1 + w},${1 - w * 0.9})`, offset: 0.22 }, { transform: `scale(${1 - w * 0.35},${1 + w * 0.45})`, offset: 0.48 },
       { transform: `scale(${1 + w * 0.2},${1 - w * 0.1})`, offset: 0.72 }, { transform: 'none' }]),
      { duration: 750 }
    );
  }, [M.wave, reduce]);

  const mounted = useRef(false);
  const place = useCallback((animate: boolean) => {
    const main = mainRef.current, hl = hlRef.current;
    if (!main || !hl) return;
    const btn = target != null ? btns.current.get(target) : undefined;
    if (!btn) { hl.style.opacity = '0'; prevLeft.current = null; return; }
    const left = btn.offsetLeft, right = main.clientWidth - left - btn.offsetWidth;
    const wasHidden = hl.style.opacity === '0' || prevLeft.current == null;
    // капля была спрятана не из-за первой отрисовки, а потому что был открыт раздел из группы справа — вернулись оттуда
    const fromSide = animate && wasHidden && mounted.current;
    mounted.current = true;
    const dir = !animate || wasHidden ? 0 : Math.sign(left - (prevLeft.current ?? left));
    prevLeft.current = left;
    const fast = reduce ? 160 : M.lead, slow = reduce ? 160 : M.lag;
    const ease = `cubic-bezier(.3,${reduce ? 1 : M.overshoot},.5,1)`;
    hl.style.transitionProperty = 'left, right, opacity';
    hl.style.transitionTimingFunction = `${ease}, ${ease}, ease`;
    hl.style.transitionDuration = wasHidden || !animate ? '0ms, 0ms, 300ms' : `${dir > 0 ? slow : fast}ms, ${dir < 0 ? slow : fast}ms, 300ms`;
    hl.style.left = left + 'px';
    hl.style.right = right + 'px';
    hl.style.opacity = '1';
    // вся капсула пружинит в сторону перехода, как группа справа при нажатии: тянется вдоль хода капли и упруго собирается
    if (dir) { squashHl(700); waveMain(dir); }
    // вернулись из группы справа: капля «проявляется» с упругим сплющиванием, капсула тянется влево — оттуда пришли
    else if (fromSide) { squashHl(700, 0.7); waveMain(-1); }
  }, [target, M.lead, M.lag, M.overshoot, reduce, squashHl, waveMain]);

  useLayoutEffect(() => { place(true); }, [place]);
  // размеры поменялись (подписи, шрифт, окно) — переставляем без анимации.
  // Наблюдатель не пересоздаётся при смене пункта и пропускает свой первый вызов (он приходит сразу после observe),
  // иначе он мгновенно ставил бы каплю на место и съедал анимацию перехода.
  const placeRef = useRef(place);
  placeRef.current = place;
  // сменилась раскладка (число пунктов, layout, есть ли кнопки справа) — пункты стали другой ширины: ставим каплю сразу
  useLayoutEffect(() => { placeRef.current(false); }, [items.length, visible.length, layout, showSide]);
  // группа справа появилась/спряталась: пока пункты едут, каплю ведёт наблюдатель за размерами,
  // а в конце подстраиваем ещё раз — последний кадр перехода он может и не застать
  const firstShift = useRef(true);
  useEffect(() => {
    if (firstShift.current) { firstShift.current = false; return; }
    const main = mainRef.current;
    const done = (e?: TransitionEvent) => { if (!e || e.target === main) placeRef.current(false); };
    main?.addEventListener('transitionend', done);
    const t = window.setTimeout(done, (reduce ? 0 : M.shift) + 80);
    // группа появилась: капсула «вливается» с упругим всплеском, кнопки выпрыгивают по очереди
    const side = sideRef.current, anims: Animation[] = [];
    if (showSide && side?.animate && !reduce && M.jelly) {
      const d = M.shift;
      side.style.transformOrigin = '0 50%';
      anims.push(side.animate(eased(
        [{ transform: 'scale(.55,.7)', opacity: 0 }, { transform: 'scale(1.1,.9)', opacity: 1, offset: 0.45 }, { transform: 'scale(.96,1.05)', offset: 0.68 },
         { transform: 'scale(1.02,.99)', offset: 0.85 }, { transform: 'none', opacity: 1 }]),
        { duration: d + 250 }
      ));
      [...side.children].forEach((b, i) => anims.push((b as HTMLElement).animate(eased(
        [{ transform: 'scale(.3)', opacity: 0 }, { transform: 'scale(1.18,.86)', opacity: 1, offset: 0.4 }, { transform: 'scale(.9,1.1)', offset: 0.62 },
         { transform: 'scale(1.04,.97)', offset: 0.8 }, { transform: 'none', opacity: 1 }]),
        { duration: 700, delay: d * 0.35 + i * 90, fill: 'backwards' }
      )));
    }
    return () => { main?.removeEventListener('transitionend', done); window.clearTimeout(t); anims.forEach(a => a.cancel()); };
  }, [showSide]);
  useEffect(() => {
    const main = mainRef.current;
    if (!main || typeof ResizeObserver === 'undefined') return;
    let first = true, alive = true;
    const ro = new ResizeObserver(() => { if (first) { first = false; return; } placeRef.current(false); });
    ro.observe(main);
    btns.current.forEach(b => ro.observe(b));
    document.fonts?.ready.then(() => { if (alive) placeRef.current(false); });
    return () => { alive = false; ro.disconnect(); };
  }, [items.length, visible.length, overflowing, layout, showSide]);

  const select = (it: TabItem) => {
    if (it.disabled) return;
    // повторное нажатие на открытый пункт: капсула пружинит от центра, капля коротко сплющивается
    if (it.id === current) { squashHl(560, 0.6); waveMain(0); }
    setMenuOpen(false);
    if (value === undefined) setInner(it.id);
    onChange?.(it.id);
  };
  const [menuRight, setMenuRight] = useState<number | null>(null);
  const toggleMenu = () => {
    if (!menuOpen) {
      squashHl(520, 0.5);
      // в шапке список встаёт под кнопкой «Меню», а не над группой справа
      const nav = navRef.current, main = mainRef.current, more = moreRef.current;
      setMenuRight(isDesk && nav && main && more ? nav.clientWidth - (main.offsetLeft + more.offsetLeft + more.offsetWidth) : null);
    }
    setMenuOpen(o => !o);
  };

  /* ---- поиск в шапке ---- */
  const [qInner, setQInner] = useState('');
  const query = SO?.searchValue !== undefined ? SO.searchValue : qInner;
  const setQuery = (v: string) => { if (SO?.searchValue === undefined) setQInner(v); SO?.onSearchChange?.(v); };
  const [searchOpen, setSearchOpen] = useState(false);
  searchOpenRef.current = searchOpen;
  useLayoutEffect(() => { measure(); }, [searchOpen, measure]);
  const searchInput = useRef<HTMLInputElement>(null);
  const pillRef = useRef<HTMLDivElement>(null);
  const openSearch = () => {
    if ((searchKind !== 'expand' && searchKind !== 'full') || searchOpen) return searchInput.current?.focus();
    setSearchOpen(true);
    // «вливание» капсулы поиска: тянется влево и упруго собирается, как группа справа
    const pill = searchInSide ? sideRef.current : pillRef.current;
    if (pill?.animate && !reduce && M.jelly) {
      pill.style.transformOrigin = searchKind === 'full' ? '100% 50%' : '100% 50%';
      pill.animate(eased([{ transform: 'none' }, { transform: 'scale(1.05,.9)', offset: 0.3 }, { transform: 'scale(.98,1.04)', offset: 0.6 }, { transform: 'none' }]), { duration: M.shift + 200 });
    }
    window.setTimeout(() => searchInput.current?.focus(), 60);
  };
  const closeSearch = () => { if (searchKind === 'expand' || searchKind === 'full') setSearchOpen(false); };
  /** «✕» на узком экране: очистить и свернуть; группа собирается обратно, пункты возвращаются */
  const cancelSearch = () => {
    setQuery(''); setSearchOpen(false);
    const side = sideRef.current;
    if (side?.animate && !reduce && M.jelly) {
      side.style.transformOrigin = '100% 50%';
      side.animate(eased([{ transform: 'none' }, { transform: 'scale(.94,1.06)', offset: 0.3 }, { transform: 'scale(1.03,.97)', offset: 0.6 }, { transform: 'none' }]), { duration: M.shift + 200 });
    }
  };
  // ширина строки поиска на узком экране — вся ширина меню
  const [navW, setNavW] = useState(0);
  const [navH, setNavH] = useState(0); // высота ряда: капсула «→» круглая и такой же высоты, как соседние
  useLayoutEffect(() => {
    if (searchKind !== 'full') return;
    const nav = navRef.current;
    if (!nav) return;
    const upd = () => { const cs = getComputedStyle(nav); setNavW(nav.clientWidth - (parseFloat(cs.paddingLeft) || 0) - (parseFloat(cs.paddingRight) || 0)); setNavH(nav.clientHeight); };
    upd();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(upd) : null;
    ro?.observe(nav);
    return () => ro?.disconnect();
  }, [searchKind]);
  useEffect(() => { setSearchOpen(false); }, [isDesk, searchKind]); // сменился вид поиска или ушли с ПК — раскрытая строка сворачивается
  // раскрытый пустой поиск сворачивается по клику мимо
  useEffect(() => {
    if (!searchOpen) return;
    const down = (e: PointerEvent) => { if (!query && !pillRef.current?.contains(e.target as Node) && !navRef.current?.contains(e.target as Node)) setSearchOpen(false); };
    document.addEventListener('pointerdown', down);
    return () => document.removeEventListener('pointerdown', down);
  }, [searchOpen, query]);
  // клавиша «/» — к поиску, если сейчас не печатают в поле
  const shortcut = D?.searchShortcut === undefined ? '/' : D.searchShortcut;
  useEffect(() => {
    if (!isDesk || searchKind === 'none' || !shortcut) return;
    const k = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (e.key !== shortcut || e.ctrlKey || e.metaKey || e.altKey || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || t.isContentEditable) return;
      e.preventDefault();
      if (searchKind === 'button') D?.onSearchClick?.(); else openSearch();
    };
    document.addEventListener('keydown', k);
    return () => document.removeEventListener('keydown', k);
  });

  /** Упругий отклик круглой кнопки и «всплеск» капсулы в сторону нажатия. */
  const jelly = (el: HTMLElement, index: number, withSide = true) => {
    if (!M.jelly || reduce || !el.animate) return;
    el.animate(eased(
      [{ transform: 'scale(.9)' }, { transform: 'scale(1.18,.8)', offset: 0.2 }, { transform: 'scale(.88,1.12)', offset: 0.42 },
       { transform: 'scale(1.06,.95)', offset: 0.62 }, { transform: 'scale(.98,1.02)', offset: 0.8 }, { transform: 'scale(1)' }]),
      { duration: 750 }
    );
    const side = sideRef.current;
    if (withSide && side?.animate) {
      side.style.transformOrigin = index < actions.length / 2 ? '100% 50%' : '0 50%';
      side.animate(eased(
        [{ transform: 'none' }, { transform: 'scale(1.09,.92)', offset: 0.22 }, { transform: 'scale(.97,1.04)', offset: 0.48 },
         { transform: 'scale(1.02,.99)', offset: 0.72 }, { transform: 'none' }]),
        { duration: 750 }
      );
    }
  };

  const vars = useMemo(() => {
    const out: Record<string, string> = {};
    if (theme) (Object.keys(theme) as (keyof LiquidTabBarTheme)[]).forEach(k => {
      const v = theme[k];
      if (v === undefined || !VARS[k]) return;
      out[VARS[k]] = typeof v === 'number' ? `${v}px` : v;
    });
    // стекло: прозрачность капсул в процентах; низ градиента чуть плотнее верха — как в Meridian
    if (glass !== undefined) {
      const preset = typeof glass === 'string' ? GLASS_PRESETS[glass] : undefined;
      const p = Math.max(0, Math.min(100, preset ? preset.transparency : +glass || 0)) / 100;
      const top = 1 - p, bottom = p >= 1 ? 0 : Math.min(1, top + 0.06);
      out['--ltb-surface-top'] = withAlpha(theme?.surfaceTop ?? DEFAULT_THEME.surfaceTop, top);
      out['--ltb-surface-bottom'] = withAlpha(theme?.surfaceBottom ?? DEFAULT_THEME.surfaceBottom, bottom);
      if (preset) out['--ltb-blur'] = `${preset.blur}px`; // пресет задаёт и размытие
    }
    return out as CSSProperties;
  }, [theme, glass]);

  const label = (text: string, b: BadgeValue) => (hasBadge(b) ? badgeLabel(text, b as Exclude<BadgeValue, null | undefined | false>) : text);

  /** в раскладке «в строку» бейдж с числом или текстом ставим после подписи — в углу иконки он наезжает на текст */
  const badgeAfter = (b: BadgeValue) => layout === 'inline' && hasBadge(b) && b !== 'dot' && b !== true;

  const renderMore = (leaving: boolean, entering: boolean) => (
    <button
      key={MORE_ID}
      type="button"
      ref={el => { if (leaving) return; moreRef.current = el; if (el) btns.current.set(MORE_ID, el); else btns.current.delete(MORE_ID); }}
      className={`ltb-item ltb-more${hiddenActive && !leaving ? ' is-active' : ''}${menuOpen ? ' is-open' : ''}${leaving ? ' is-leaving' : ''}`}
      data-enter={entering ? '1' : undefined}
      aria-hidden={leaving || undefined}
      tabIndex={leaving ? -1 : undefined}
      aria-haspopup="menu"
      aria-expanded={menuOpen}
      aria-label={label(hiddenActive ? `${moreLabel}: ${hidden.find(i => i.id === current)?.label}` : moreLabel, moreBadge)}
      title={layout === 'icons' ? moreLabel : undefined}
      onClick={() => { if (!leaving) toggleMenu(); }}
    >
      <span className="ltb-ico">
        <Icon icon={moreIcon ?? 'more'} />
        {!badgeAfter(moreBadge) && <Badge value={moreBadge} max={maxBadge} />}
      </span>
      {layout !== 'icons' && <span className="ltb-label">{moreLabel}</span>}
      {badgeAfter(moreBadge) && <Badge value={moreBadge} max={maxBadge} inline />}
    </button>
  );

  // новые пункты и кнопки «вырастают» с пружинкой: ширина от нуля, масштаб и прозрачность
  useLayoutEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    const els = nav.querySelectorAll<HTMLElement>('[data-enter="1"]');
    const gone = nav.querySelectorAll<HTMLElement>('.is-leaving:not([data-left])');
    const cs = getComputedStyle(nav);
    const fixedItems = nav.classList.contains('ltb--desktop'); // в шапке пункты своей ширины — анимируем ширину, а не растяжение
    let mainMoved = 0, sideMoved = false;
    // уходящие: в шапке схлопываем ширину от текущей до нуля (в нижнем меню это делает CSS)
    gone.forEach(el => {
      el.dataset.left = '1';
      if (el.closest('.ltb-main')) mainMoved = mainMoved || -1; else if (el.closest('.ltb-side')) sideMoved = true;
      if (reduce || !el.animate || !fixedItems || !el.classList.contains('ltb-item')) return;
      const w = el.offsetWidth;
      el.animate(eased([{ width: `${w}px`, minWidth: '0px', paddingLeft: getComputedStyle(el).paddingLeft, paddingRight: getComputedStyle(el).paddingRight, opacity: 1, transform: 'none' },
        { width: '0px', minWidth: '0px', paddingLeft: '0px', paddingRight: '0px', opacity: 0, transform: 'scale(.6)' }]), { duration: M.shift, fill: 'forwards' });
    });
    const actW = `${parseFloat(cs?.getPropertyValue('--ltb-action') || '') || 50}px`, padW = `${-(parseFloat(cs?.getPropertyValue('--ltb-pad') || '') || 6)}px`;
    els.forEach(el => {
      el.dataset.enter = '0';
      if (el.closest('.ltb-main')) mainMoved = 1; else if (el.closest('.ltb-side')) sideMoved = true;
      if (reduce || !el.animate) return;
      const isAction = el.classList.contains('ltb-action') || el.classList.contains('ltb-expand');
      const d = M.shift + 150;
      if (fixedItems && !isAction) {
        // пункт в шапке «вырастает» до своей настоящей ширины
        const w = el.offsetWidth, pl = getComputedStyle(el).paddingLeft, pr = getComputedStyle(el).paddingRight;
        el.animate(eased([{ width: '0px', paddingLeft: '0px', paddingRight: '0px', opacity: 0, transform: 'scale(.55)' },
          { width: `${w}px`, paddingLeft: pl, paddingRight: pr, opacity: 1, transform: 'scale(1.06,.95)', offset: 0.6 },
          { width: `${w}px`, paddingLeft: pl, paddingRight: pr, transform: 'scale(.98,1.02)', offset: 0.8 },
          { width: `${w}px`, paddingLeft: pl, paddingRight: pr, opacity: 1, transform: 'none' }]), { duration: d });
        window.setTimeout(() => placeRef.current(false), d + 30);
        return;
      }
      el.animate(eased(isAction
        ? [{ width: '0px', marginLeft: padW, opacity: 0, transform: 'scale(.3)' },
           { width: actW, marginLeft: '0px', opacity: 1, transform: 'scale(1.12,.9)', offset: 0.6 },
           { width: actW, marginLeft: '0px', transform: 'scale(.96,1.04)', offset: 0.8 }, { width: actW, marginLeft: '0px', opacity: 1, transform: 'none' }]
        : [{ flexGrow: 0, opacity: 0, transform: 'scale(.55)' },
           { flexGrow: 1, opacity: 1, transform: 'scale(1.08,.94)', offset: 0.6 },
           { flexGrow: 1, transform: 'scale(.97,1.03)', offset: 0.8 }, { flexGrow: 1, opacity: 1, transform: 'none' }]),
        { duration: d });
      // соседи раздвигаются — каплю ведёт наблюдатель за размерами, в конце ставим точно
      window.setTimeout(() => placeRef.current(false), d + 30);
    });
    // пункт появился или ушёл — весь блок пружинит, как группа справа: появился — тянется вправо, ушёл — вздрагивает от центра
    if (mainMoved) waveMain(mainMoved > 0 ? 1 : 0);
    if (sideMoved) {
      const side = sideRef.current;
      if (side?.animate && !reduce && M.jelly) {
        side.style.transformOrigin = '0 50%';
        side.animate(eased([{ transform: 'none' }, { transform: 'scale(1.07,.93)', offset: 0.25 }, { transform: 'scale(.97,1.04)', offset: 0.5 },
          { transform: 'scale(1.015,.99)', offset: 0.75 }, { transform: 'none' }]), { duration: 750 });
      }
    }
    if (gone.length) window.setTimeout(() => placeRef.current(false), M.shift + 60);
  });

  return (
    <nav
      ref={navRef}
      className={`ltb ltb--${position} ltb--${layout}${sideOn ? '' : ' ltb--solo'}${isDesk ? ' ltb--desktop' : ''}${isDesk && D?.actionsAlign === 'next' ? ' ltb--actions-next' : ''}${searchKind === 'full' && searchOpen ? ' ltb--searching' : ''}${className ? ' ' + className : ''}`}
      style={{ '--ltb-n': visible.length + (overflowing ? 1 : 0), '--ltb-menu-right': `${menuRight ?? sideSpace}px`,
        ...(isDesk ? { '--ltb-header-max': `${D?.maxWidth ?? 1360}px`, '--ltb-header-h': `${D?.height ?? 80}px`, '--ltb-search-w': `${D?.searchWidth ?? 420}px`, '--ltb-search-in': `${searchInW}px` } : {}),
        '--ltb-side-extra': searchInSide && searchOpen ? 'calc(var(--ltb-search-in) - var(--ltb-action))' : '0px', '--ltb-na': sideCount || actions.length, '--ltb-full-w': `${navW}px`, '--ltb-row-h': `${navH}px`, '--ltb-shift': `${reduce ? 0 : M.shift}ms`, ...vars, ...style } as CSSProperties}
      aria-label={ariaLabel}
    >
      {isDesk && (
        <div className={`ltb-logo${hasLogo ? '' : ' is-empty'}`} ref={logoRef} aria-hidden={!hasLogo || undefined}>
          {hasLogo && <span className="ltb-logo-in" key={typeof D?.logo === 'string' ? D.logo : 'node'}>{typeof D?.logo === 'string' ? <span className="ltb-wordmark">{D.logo}</span> : D?.logo}</span>}
        </div>
      )}
      {isDesk && (
        <div className="ltb-main ltb-measure" ref={measureRef} aria-hidden="true">
          {items.map(it => (
            <span key={it.id} className="ltb-item">
              <span className="ltb-ico" />
              {layout !== 'icons' && <span className="ltb-label">{it.label}</span>}
              {badgeAfter(it.badge) && <Badge value={it.badge} max={maxBadge} inline />}
            </span>
          ))}
          <span className="ltb-item"><span className="ltb-ico" />{layout !== 'icons' && <span className="ltb-label">{moreLabel}</span>}{badgeAfter(moreBadge) && <Badge value={moreBadge} max={maxBadge} inline />}</span>
        </div>
      )}
      <div className="ltb-main" ref={mainRef}>
        <span className="ltb-hl" ref={hlRef} aria-hidden="true" style={{ opacity: 0 }} />
        {mainList.map(({ item: e, leaving, entering }) => {
          if (e.id === MORE_ID) return renderMore(leaving, entering);
          const it = e.it!;
          const on = it.id === current && !leaving;
          return (
            <button
              key={it.id}
              type="button"
              ref={el => { if (leaving) return; if (el) btns.current.set(it.id, el); else btns.current.delete(it.id); }}
              className={`ltb-item${on ? ' is-active' : ''}${leaving ? ' is-leaving' : ''}`}
              data-enter={entering ? '1' : undefined}
              aria-hidden={leaving || undefined}
              tabIndex={leaving ? -1 : undefined}
              aria-current={on ? 'page' : undefined}
              aria-label={label(it.ariaLabel || it.label, it.badge)}
              title={layout === 'icons' ? it.label : undefined}
              disabled={it.disabled}
              onClick={() => { if (!leaving) select(it); }}
            >
              <span className="ltb-ico">
                <Icon icon={it.icon} activeIcon={it.activeIcon} />
                {!badgeAfter(it.badge) && <Badge value={it.badge} max={maxBadge} />}
              </span>
              {layout !== 'icons' && <span className="ltb-label">{it.label}</span>}
              {badgeAfter(it.badge) && <Badge value={it.badge} max={maxBadge} inline />}
            </button>
          );
        })}
      </div>
      {hidden.length > 0 && (
        // список спрятанных пунктов; стоит над кнопкой «Меню» (под ней — если меню вверху экрана)
        <div className={`ltb-menu${menuOpen ? ' is-open' : ''}`} role="menu" aria-label={moreLabel} aria-hidden={!menuOpen || undefined} {...(!menuOpen ? { inert: '' } : {})}>
          {hidden.map((it, i) => {
            const on = it.id === current;
            return (
              <button key={it.id} type="button" role="menuitem" style={{ '--i': i } as CSSProperties}
                className={`ltb-row${on ? ' is-active' : ''}`} aria-current={on ? 'page' : undefined}
                aria-label={label(it.ariaLabel || it.label, it.badge)} disabled={it.disabled} onClick={() => select(it)}>
                <span className="ltb-ico"><Icon icon={it.icon} activeIcon={it.activeIcon} /></span>
                <span className="ltb-row-label">{it.label}</span>
                <Badge value={it.badge} max={maxBadge} inline />
              </button>
            );
          })}
        </div>
      )}
      {isDesk && (
        <div className={`ltb-search-slot${searchKind !== 'bar' && D?.actionsAlign === 'next' ? ' is-collapsed' : ''}`}>
          {(
            <label className={`ltb-search${searchKind === 'bar' ? '' : ' is-hidden'}`} aria-hidden={searchKind !== 'bar' || undefined} {...(searchKind !== 'bar' ? { inert: '' } : {})}>
              <span className="ltb-ico"><Icon icon="search" /></span>
              <input ref={searchKind === 'bar' ? searchInput : undefined} type="search" value={query} placeholder={SO?.searchPlaceholder ?? L.search} aria-label={SO?.searchPlaceholder ?? L.search}
                onChange={e => setQuery(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') SO?.onSearch?.(query); if (e.key === 'Escape') (e.target as HTMLInputElement).blur(); }} />
              {shortcut && <kbd aria-hidden="true">{shortcut}</kbd>}
            </label>
          )}
        </div>
      )}
      {(sideList.length > 0 || searchList.length > 0) && (
        // группа не исчезает из разметки, а сворачивается — так появление и скрытие анимируются
        <div className={`ltb-side${sideOn ? '' : ' is-hidden'}${SO?.searchAt === 'end' ? ' ltb-side--search-end' : ''}`} ref={sideRef} aria-hidden={!sideOn || undefined} {...(!sideOn ? { inert: '' } : {})}>
          {searchList.map(({ item: s, leaving, entering }) => s.id === 'search-full' ? (
            // узкий экран, как в iOS: лупа → «✕» слева, поле посередине, «→» справа; группа растекается на всю ширину
            <div key={s.id} ref={leaving ? undefined : pillRef} className={`ltb-expand ltb-expand--full${searchOpen && !leaving ? ' is-open' : ''}${leaving ? ' is-leaving' : ''}`} data-enter={entering ? '1' : undefined}
              aria-hidden={leaving || undefined} role="search">
              <button type="button" className={`ltb-action ltb-swap${searchOpen ? ' is-open' : ''}`} aria-label={searchOpen ? L.closeSearch : (SO?.searchPlaceholder ?? L.search)} aria-expanded={searchOpen} tabIndex={leaving ? -1 : undefined}
                onClick={e => { if (leaving) return; if (searchOpen) cancelSearch(); else { jelly(e.currentTarget, 0, false); openSearch(); } }}>
                <span className="ltb-ico"><span className="ltb-swap-a"><Icon icon="search" /></span><span className="ltb-swap-b"><Icon icon="close" /></span></span>
              </button>
              <input ref={leaving ? undefined : searchInput} type="search" enterKeyHint="search" value={query} placeholder={SO?.searchPlaceholder ?? L.search} aria-label={SO?.searchPlaceholder ?? L.search} tabIndex={searchOpen && !leaving ? 0 : -1}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') SO?.onSearch?.(query); if (e.key === 'Escape') cancelSearch(); }} />
            </div>
          ) : s.id === 'search-button' ? (
            <button key={s.id} type="button" className={`ltb-action ltb-search-btn${leaving ? ' is-leaving' : ''}`} data-enter={entering ? '1' : undefined}
              aria-hidden={leaving || undefined} tabIndex={leaving ? -1 : undefined} aria-label={SO?.searchPlaceholder ?? L.search}
              onClick={e => { if (leaving) return; jelly(e.currentTarget, 0); D?.onSearchClick?.(); }}>
              <span className="ltb-ico"><Icon icon="search" /></span>
            </button>
          ) : (
            // поиск внутри группы: круг раскрывается в строку, вместе с ним растёт вся группа
            <div key={s.id} ref={leaving ? undefined : pillRef} className={`ltb-expand${searchOpen && !leaving ? ' is-open' : ''}${leaving ? ' is-leaving' : ''}`} data-enter={entering ? '1' : undefined}
              aria-hidden={leaving || undefined}
              onBlur={e => { if (!query && !e.currentTarget.contains(e.relatedTarget as Node)) closeSearch(); }}>
              <button type="button" className={`ltb-action${searchOpen ? ' is-open' : ''}`} aria-label={SO?.searchPlaceholder ?? L.search} aria-expanded={searchOpen} tabIndex={leaving ? -1 : undefined}
                onClick={() => { if (leaving) return; if (searchOpen) { if (query) SO?.onSearch?.(query); else closeSearch(); } else openSearch(); }}>
                <span className="ltb-ico"><Icon icon="search" /></span>
              </button>
              <input ref={leaving ? undefined : searchInput} type="search" value={query} placeholder={SO?.searchPlaceholder ?? L.search} aria-label={SO?.searchPlaceholder ?? L.search} tabIndex={searchOpen && !leaving ? 0 : -1}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') SO?.onSearch?.(query); if (e.key === 'Escape') { setQuery(''); closeSearch(); } }} />
            </div>
          ))}
          {sideList.map(({ item: a, leaving, entering }, i) => {
            const on = a.id === activeAction && !leaving;
            return (
              <button
                key={a.id}
                type="button"
                className={`ltb-action${a.avatar ? ' ltb-action--avatar' : a.variant === 'accent' ? ' ltb-action--accent' : ''}${on ? ' is-active' : ''}${leaving ? ' is-leaving' : ''}`}
                data-enter={entering ? '1' : undefined}
                aria-hidden={leaving || undefined}
                tabIndex={leaving ? -1 : undefined}
                aria-label={label(a.ariaLabel, a.badge)}
                aria-pressed={on}
                onClick={e => { if (leaving) return; jelly(e.currentTarget, i); onAction?.(a.id); }}
              >
                {a.avatar
                  ? (a.avatar.src ? <img src={a.avatar.src} alt="" /> : <span className="ltb-avatar-text">{a.avatar.text}</span>)
                  : <span className="ltb-ico">{a.icon !== undefined && <Icon icon={a.icon} activeIcon={a.activeIcon} />}</span>}
                <Badge value={a.badge} max={maxBadge} />
              </button>
            );
          })}
        </div>
      )}
      {searchKind === 'full' && (
        // «→» — отдельная круглая кнопка в своём стекле справа; при раскрытии поиска «отпочковывается» от группы
        <div className={`ltb-pill ltb-go-pill${searchOpen ? ' is-open' : ''}`} aria-hidden={!searchOpen || undefined} {...(!searchOpen ? { inert: '' } : {})}>
          <button type="button" className={`ltb-action ltb-go${query ? ' is-ready' : ''}`} aria-label={L.go} disabled={!query}
            onClick={e => { jelly(e.currentTarget, 1, false); SO?.onSearch?.(query); }}>
            <span className="ltb-ico"><Icon icon="arrowR" /></span>
          </button>
        </div>
      )}
    </nav>
  );
}

/** Parz UI · Parz Menu — основное имя компонента. LiquidTabBar оставлен для совместимости. */
export const ParzMenu = LiquidTabBar;
export type ParzMenuProps = LiquidTabBarProps;

export type { ReactNode };
