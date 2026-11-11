import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { LiquidTabBar, ParzToggle, Wordmark, LTB_STRINGS, DEFAULT_MOTION, DEFAULT_THEME, BUILTIN_ICONS, GLASS_PRESETS, type GlassPreset, type LiquidMotion, type LiquidTabBarTheme, type TabItem, type BadgeValue } from '../lib';
import { slug } from './Markdown';
import { PRESETS } from './presets';
import { tr, retr, useT, type Lang } from './i18n';
import './App.css';

/* ---------- модель редактора ---------- */
type BadgeKind = 'none' | 'dot' | 'count' | 'text';
type EdItem = { id: string; label: string; icon: string; badge: BadgeKind; count: number; text: string };
type Layout = 'stacked' | 'inline' | 'icons';
type Position = 'bottom' | 'top' | 'static';
type Frame = 'phone' | 'tablet' | 'desktop';
type SearchKind = 'bar' | 'button' | 'expand' | 'none';
type Desk = { on: boolean; logo: string; anim: boolean; search: SearchKind; placeholder: string; breakpoint: number; align: 'end' | 'next' };
const FRAME_W: Record<Frame, number> = { phone: 390, tablet: 768, desktop: 1100 };
const DESK0: Desk = { on: true, logo: 'CARPARK', anim: true, search: 'bar', placeholder: 'Марка, модель или парковка…', breakpoint: 1100, align: 'end' };
/** Кнопка справа в редакторе. opens — открывает свой раздел (как уведомления); иначе это просто действие (как «+»). */
type Slot = { on: boolean; id: string; kind: 'icon' | 'avatar'; icon: string; text: string; label: string; badge: BadgeKind; count: number; variant: 'default' | 'accent'; opens: boolean };
const BELL: Slot = { on: true, id: 'notif', kind: 'icon', icon: 'bell', text: 'A', label: 'Уведомления', badge: 'dot', count: 3, variant: 'default', opens: true };
const AVATAR: Slot = { on: true, id: 'profile', kind: 'avatar', icon: 'ms:person', text: 'A', label: 'Профиль', badge: 'none', count: 1, variant: 'default', opens: true };
const PLUS: Slot = { on: true, id: 'add', kind: 'icon', icon: 'plus', text: 'A', label: 'Добавить', badge: 'none', count: 1, variant: 'accent', opens: false };
const SEARCH: Slot = { on: true, id: 'search', kind: 'icon', icon: 'ms:search', text: 'A', label: 'Поиск', badge: 'none', count: 1, variant: 'default', opens: true };
const OFF = (s: Slot): Slot => ({ ...s, on: false });
/** Готовые наборы для группы справа — только примеры, каждую кнопку можно настроить */
const SLOT_SETS: { name: string; slots: [Slot, Slot] }[] = [
  { name: 'Колокол и профиль', slots: [BELL, AVATAR] },
  { name: 'Колокол и «+»', slots: [BELL, PLUS] },
  { name: 'Поиск и профиль', slots: [SEARCH, AVATAR] },
  { name: 'Только «+»', slots: [PLUS, OFF(AVATAR)] }
];

const START_ITEMS: EdItem[] = [
  { id: 'garage', label: 'Гараж', icon: 'ms:directions_car', badge: 'none', count: 1, text: 'new' },
  { id: 'parts', label: 'Запчасти', icon: 'ms:settings', badge: 'count', count: 2, text: 'new' },
  { id: 'map', label: 'Карта', icon: 'pin', badge: 'dot', count: 1, text: 'new' }
];
const SPARE: Omit<EdItem, 'id'>[] = [
  { label: 'Поиск', icon: 'ms:search', badge: 'none', count: 1, text: 'new' },
  { label: 'Профиль', icon: 'ms:person', badge: 'none', count: 1, text: 'new' },
  { label: 'Заправки', icon: 'ms:local_gas_station', badge: 'none', count: 1, text: 'new' },
  { label: 'Зарядка', icon: 'ms:ev_station', badge: 'dot', count: 1, text: 'new' },
  { label: 'Мойка', icon: 'ms:local_car_wash', badge: 'none', count: 1, text: 'new' },
  { label: 'Сервис', icon: 'ms:car_repair', badge: 'count', count: 1, text: 'new' },
  { label: 'Штрафы', icon: 'ms:receipt_long', badge: 'count', count: 3, text: 'new' },
  { label: 'Акции', icon: 'gift', badge: 'text', count: 1, text: 'new' }
];
const MS_EXAMPLES = ['ms:home', 'ms:search', 'ms:favorite', 'ms:person', 'ms:notifications', 'ms:shopping_bag', 'ms:explore', 'ms:settings', 'ms:chat', 'ms:calendar_month', 'ms:directions_car', 'ms:local_parking', 'ms:garage', 'ms:ev_station', 'ms:local_gas_station', 'ms:car_repair', 'mi:home', 'mi:star', 'mi:place'];
const ICON_OPTIONS = [...Object.keys(BUILTIN_ICONS), ...MS_EXAMPLES];

const toBadge = (it: { badge: BadgeKind; count: number; text: string }): BadgeValue =>
  it.badge === 'dot' ? 'dot' : it.badge === 'count' ? it.count : it.badge === 'text' ? it.text : undefined;

/* ---------- цвет с прозрачностью: <input type=color> не умеет альфу ---------- */
export function splitColor(c: string): { hex: string; a: number } {
  const m = /rgba?\(\s*(\d+)[ ,]+(\d+)[ ,]+(\d+)(?:[ ,/]+([\d.]+))?/i.exec(c);
  if (m) return { hex: '#' + [m[1], m[2], m[3]].map(v => (+v).toString(16).padStart(2, '0')).join(''), a: m[4] === undefined ? 1 : +m[4] };
  if (/^#[0-9a-f]{6}$/i.test(c)) return { hex: c, a: 1 };
  if (/^#[0-9a-f]{3}$/i.test(c)) return { hex: '#' + [...c.slice(1)].map(x => x + x).join(''), a: 1 };
  return { hex: '#000000', a: 1 };
}
function joinColor(hex: string, a: number) {
  if (a >= 1) return hex;
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${+a.toFixed(2)})`;
}

const COLOR_FIELDS: [keyof LiquidTabBarTheme, string][] = [
  ['accent', 'Акцент'], ['text', 'Текст'], ['textActive', 'Текст активного'],
  ['surfaceTop', 'Стекло, верх'], ['surfaceBottom', 'Стекло, низ'], ['border', 'Обводка'],
  ['bevelTop', 'Блик сверху'], ['bevelBottom', 'Тень снизу'],
  ['highlightTop', 'Капля, верх'], ['highlightBottom', 'Капля, низ'],
  ['actionBg', 'Круглые кнопки'], ['actionActiveBg', 'Нажатая кнопка'], ['actionActiveText', 'Иконка нажатой'],
  ['actionAccentBg', 'Акцентная кнопка'], ['actionAccentText', 'Иконка акцентной'],
  ['badgeBg', 'Бейдж'], ['badgeText', 'Текст бейджа'], ['badgeRing', 'Кольцо бейджа'],
  ['avatarFrom', 'Аватар, от'], ['avatarTo', 'Аватар, до'], ['avatarText', 'Буквы аватара']
];
const SIZE_FIELDS: [keyof LiquidTabBarTheme, string, number, number, number][] = [
  ['radius', 'Скругление', 0, 999, 1], ['padding', 'Отступ внутри', 2, 14, 1], ['gap', 'Между капсулами', 0, 24, 1],
  ['itemPaddingY', 'Высота пунктов', 2, 18, 1], ['iconSize', 'Иконки', 14, 32, 1], ['fontSize', 'Подписи', 9, 16, 0.5],
  ['actionSize', 'Круглые кнопки', 34, 64, 1], ['blur', 'Размытие стекла', 0, 40, 1], ['maxWidth', 'Ширина', 320, 900, 10], ['offset', 'Отступ от края', 0, 40, 1], ['itemMinWidth', 'Ширина пункта (без группы)', 48, 140, 1]
];
const MOTION_FIELDS: [keyof Omit<LiquidMotion, 'jelly'>, string, number, number, number, string][] = [
  ['lead', 'Ведущий край', 120, 900, 10, ' мс'], ['lag', 'Отстающий край', 120, 1400, 10, ' мс'],
  ['squash', 'Сплющивание', 0, 0.6, 0.01, ''], ['overshoot', 'Пружинистость', 1, 1.7, 0.01, ''],
  ['wave', 'Волна капсулы при переходе', 0, 0.1, 0.005, ''],
  ['shift', 'Появление группы справа', 0, 1400, 10, ' мс']
];

/* ---------- код для вставки ---------- */
const q = (s: string) => `'${s.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
function codeFor(o: { lang: Lang; mSearch: boolean; desk: Desk; more: boolean; minItem: number | null; moreLabel: string; glass: number | GlassPreset | undefined; items: EdItem[]; group: boolean; slots: Slot[]; layout: Layout; position: Position; theme: LiquidTabBarTheme; motion: LiquidMotion }) {
  const L: string[] = [], t = (k: string) => tr(o.lang, k);
  const badgeStr = (it: { badge: BadgeKind; count: number; text: string }) => {
    const b = toBadge(it);
    return b === undefined ? '' : `, badge: ${typeof b === 'number' ? b : q(String(b))}`;
  };
  L.push(`import { useState } from 'react';`, `import { ParzMenu${o.desk.on && o.desk.anim && o.desk.logo ? ', AnimoLogo' : ''} } from '@carparkteam/parz-ui';`, `import '@carparkteam/parz-ui/style.css';`, ``);
  L.push(`export function AppNav() {`, `  const [tab, setTab] = useState(${q(o.items[0]?.id ?? '')});`);
  const on = o.slots.filter(s => s.on), side = o.group && on.length > 0, panels = on.some(s => s.opens);
  if (side && panels) L.push(`  const [panel, setPanel] = useState<string | null>(null);`);
  L.push(``, `  return (`, `    <ParzMenu`);
  L.push(`      items={[`);
  o.items.forEach((it, i) => L.push(`        { id: ${q(it.id)}, label: ${q(it.label)}, icon: ${q(it.icon)}${badgeStr(it)} }${i < o.items.length - 1 ? ',' : ''}`));
  L.push(`      ]}`);
  if (side) {
    L.push(panels ? `      value={panel ?? tab}` : `      value={tab}`, panels ? `      onChange={id => { setPanel(null); setTab(id); }}` : `      onChange={setTab}`, `      actions={[`);
    const acts = on.map(s => `        { id: ${q(s.id)}, ariaLabel: ${q(s.label)}, ${s.kind === 'avatar' ? `avatar: { text: ${q(s.text)} }` : `icon: ${q(s.icon)}`}${s.variant === 'accent' && s.kind === 'icon' ? `, variant: 'accent'` : ''}${badgeStr({ badge: s.badge, count: s.count, text: 'new' })} }`);
    L.push(acts.join(',\n'), `      ]}`);
    const opens = on.filter(s => s.opens).map(s => q(s.id)), acts2 = on.filter(s => !s.opens);
    if (panels) L.push(`      activeAction={panel}`);
    if (panels && !acts2.length) L.push(`      onAction={id => setPanel(p => (p === id ? null : id))}`);
    else if (panels) L.push(`      onAction={id => {`, `        if ([${opens.join(', ')}].includes(id)) setPanel(p => (p === id ? null : id));`, `        else { /* ${acts2.map(s => s.label).join(', ')} — ${t('ваше действие')} */ }`, `      }}`);
    else L.push(`      onAction={id => { /* ${acts2.map(s => s.label).join(', ')} — ${t('ваше действие')} */ }}`);
  } else L.push(`      value={tab}`, `      onChange={setTab}`);
  if (o.lang !== 'en') L.push(`      locale=${q(o.lang)}`);
  if (o.layout !== 'stacked') L.push(`      layout=${q(o.layout)}`);
  if (o.position !== 'bottom') L.push(`      position=${q(o.position)}`);
  if (!o.more) L.push(`      overflow='none'`);
  if (o.more && o.minItem != null) L.push(`      minItemWidth={${o.minItem}}`);
  if (o.more && o.moreLabel !== LTB_STRINGS[o.lang].more) L.push(`      moreLabel=${q(o.moreLabel)}`);
  if (o.mSearch) L.push(`      mobileSearch={{ searchPlaceholder: ${q(o.desk.placeholder)}, onSearch: q => { /* ${t('ваш поиск')} */ } }}`);
  if (o.desk.on) {
    const f = [o.desk.logo ? (o.desk.anim ? `logo: <AnimoLogo text=${q(o.desk.logo)} />` : `logo: ${q(o.desk.logo)}`) : '', o.desk.search !== 'bar' ? `search: ${q(o.desk.search)}` : '',
      o.desk.search !== 'none' ? `searchPlaceholder: ${q(o.desk.placeholder)}` : '', o.desk.breakpoint !== 1100 ? `breakpoint: ${o.desk.breakpoint}` : '', o.desk.search !== 'bar' && o.desk.align === 'next' ? `actionsAlign: 'next'` : ''].filter(Boolean);
    L.push(f.length ? `      desktop={{ ${f.join(', ')} }}` : `      desktop`);
  }
  if (o.glass !== undefined) L.push(`      glass=${typeof o.glass === 'number' ? `{${o.glass}}` : q(o.glass)}`);
  const th = (Object.keys(o.theme) as (keyof LiquidTabBarTheme)[]).filter(k => o.theme[k] !== DEFAULT_THEME[k]);
  if (th.length) {
    L.push(`      theme={{`);
    th.forEach((k, i) => { const v = o.theme[k]; L.push(`        ${k}: ${typeof v === 'number' ? v : q(String(v))}${i < th.length - 1 ? ',' : ''}`); });
    L.push(`      }}`);
  }
  const mo = (Object.keys(o.motion) as (keyof LiquidMotion)[]).filter(k => o.motion[k] !== DEFAULT_MOTION[k]);
  if (mo.length) L.push(`      motion={{ ${mo.map(k => `${k}: ${o.motion[k]}`).join(', ')} }}`);
  L.push(`    />`, `  );`, `}`);
  return L.join('\n');
}

/* ---------- мелкие контролы ---------- */
export function Seg<T extends string>({ value, options, onChange, label }: { value: T; options: [T, string][]; onChange: (v: T) => void; label: string }) {
  return (
    <div className="seg" role="radiogroup" aria-label={label}>
      {options.map(([v, t]) => <button key={v} role="radio" aria-checked={v === value} className={v === value ? 'on' : ''} onClick={() => onChange(v)}>{t}</button>)}
    </div>
  );
}
export function Range({ label, value, min, max, step, unit = '', onChange }: { label: string; value: number; min: number; max: number; step: number; unit?: string; onChange: (v: number) => void }) {
  return (
    <label className="rng">
      <span>{label}</span><output>{step < 1 ? value.toFixed(step < 0.01 ? 3 : 2) : value}{unit}</output>
      <input type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(+e.target.value)} />
    </label>
  );
}
export function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const t = useT();
  const { hex, a } = splitColor(value);
  return (
    <div className="clr">
      <input type="color" value={hex} onChange={e => onChange(joinColor(e.target.value, a))} aria-label={label} />
      <span>{label}</span>
      <input type="range" min={0} max={1} step={0.01} value={a} onChange={e => onChange(joinColor(hex, +e.target.value))} aria-label={t('{l}: прозрачность', { l: label })} title={t('Прозрачность')} />
    </div>
  );
}
export function Sec({ title, children, open = true }: { title: string; children: React.ReactNode; open?: boolean }) {
  return <details className="sec" open={open}><summary>{title}</summary><div className="sec-b">{children}</div></details>;
}

/* ---------- редактор ---------- */
export function MenuEditor({ lang }: { lang: Lang }) {
  const t = useT();
  const locItems = (a: EdItem[]) => a.map(x => ({ ...x, label: tr(lang, x.label) }));
  const locSlot = (x: Slot): Slot => ({ ...x, label: tr(lang, x.label) });
  const locSets = SLOT_SETS.map(st => ({ name: st.name, slots: st.slots.map(locSlot) as [Slot, Slot] }));
  const locDesk = { ...DESK0, placeholder: tr(lang, DESK0.placeholder) };
  const [items, setItems] = useState<EdItem[]>(() => locItems(START_ITEMS));
  const [group, setGroup] = useState(true);
  const [glass, setGlass] = useState<number | GlassPreset | undefined>(undefined);
  const [more, setMore] = useState(true);
  const [desk, setDesk] = useState<Desk>(locDesk);
  const [mSearch, setMSearch] = useState(false);
  const updDesk = (p: Partial<Desk>) => setDesk(d => ({ ...d, ...p }));
  const [minItem, setMinItem] = useState<number | null>(null);
  const [moreLabel, setMoreLabel] = useState(() => LTB_STRINGS[lang].more);
  const [slots, setSlots] = useState<[Slot, Slot]>(() => [locSlot(BELL), locSlot(AVATAR)]);
  const [flash, setFlash] = useState('');
  const updSlot = (i: number, p: Partial<Slot>) => setSlots(s => s.map((x, j) => (j === i ? { ...x, ...p } : x)) as [Slot, Slot]);
  const [layout, setLayout] = useState<Layout>('stacked');
  const [position, setPosition] = useState<Position>('bottom');
  const [frame, setFrame] = useState<Frame>('phone');
  const [preset, setPreset] = useState('meridian');
  const [theme, setTheme] = useState<LiquidTabBarTheme>(DEFAULT_THEME);
  const [motion, setMotion] = useState<LiquidMotion>(DEFAULT_MOTION);
  const [tab, setTab] = useState<string>('garage');
  const [panel, setPanel] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  // масштаб рамки: устройство рисуется в настоящем размере и уменьшается целиком, чтобы влезть в окно редактора
  const stageRef = useRef<HTMLElement>(null), barRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  useLayoutEffect(() => {
    const SIZES: Record<Frame, [number, number]> = { phone: [390, 780], tablet: [768, 620], desktop: [1100, 620] };
    const fit = () => {
      const st = stageRef.current, bar = barRef.current;
      if (!st || !bar) return;
      const cs = getComputedStyle(st), padX = parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight), padY = parseFloat(cs.paddingTop);
      const narrow = matchMedia('(max-width:900px)').matches;
      const [w, h] = SIZES[frame];
      const availW = st.clientWidth - padX - 20;
      const availH = (narrow ? window.innerHeight * 0.82 : st.clientHeight) - padY - bar.offsetHeight - 50;
      setZoom(Math.max(0.3, Math.min(1, availW / w, availH / h)));
    };
    fit();
    const ro = new ResizeObserver(fit);
    if (stageRef.current) ro.observe(stageRef.current);
    window.addEventListener('resize', fit);
    return () => { ro.disconnect(); window.removeEventListener('resize', fit); };
  }, [frame]);
  // сменили язык — переводим примерные подписи; то, что пользователь переписал сам, не трогаем
  const prevLang = useRef(lang);
  useEffect(() => {
    const from = prevLang.current; prevLang.current = lang;
    if (from === lang) return;
    setItems(a => a.map(x => ({ ...x, label: retr(x.label, from, lang) })));
    setSlots(a => a.map(x => ({ ...x, label: retr(x.label, from, lang) })) as [Slot, Slot]);
    setMoreLabel(m => (m === LTB_STRINGS[from].more ? LTB_STRINGS[lang].more : m));
    setDesk(d => ({ ...d, placeholder: retr(d.placeholder, from, lang) }));
  }, [lang]);
  const logoNode = !desk.logo ? undefined : desk.anim ? <Wordmark key={desk.logo} text={desk.logo} size={15} accent={theme.accent} /> : desk.logo;
  const page = PRESETS.find(p => p.id === preset)?.page ?? '#09090b';
  const light = preset === 'light';

  const setT = <K extends keyof LiquidTabBarTheme>(k: K, v: LiquidTabBarTheme[K]) => setTheme(t => ({ ...t, [k]: v }));
  const upd = (i: number, p: Partial<EdItem>) => setItems(a => a.map((x, j) => (j === i ? { ...x, ...p } : x)));
  const addItem = () => setItems(a => {
    if (a.length >= 10) return a; // лимит и при быстрых кликах
    const s0 = SPARE[(a.length - 3 + SPARE.length) % SPARE.length], s = { ...s0, label: tr(lang, s0.label) };
    const base = slug(s0.label) || 'item';
    let id = base, n = 2;
    while (a.some(x => x.id === id)) id = `${base}-${n++}`;
    return [...a, { ...s, id }];
  });
  const removeItem = (i: number) => setItems(a => a.filter((_, j) => j !== i));

  // если активный пункт удалили — переходим на первый
  useEffect(() => { if (!items.some(i => i.id === tab) && items[0]) setTab(items[0].id); }, [items, tab]);

  // демо: пробегает по пунктам, чтобы посмотреть анимацию без кликов
  const demo = useRef<number>(0);
  const runDemo = () => {
    window.clearTimeout(demo.current);
    setPanel(null);
    const ids = [...items.map(i => i.id), ...items.map(i => i.id).reverse().slice(1)];
    let k = 0;
    const step = () => { setTab(ids[k]); if (++k < ids.length) demo.current = window.setTimeout(step, Math.max(motion.lag, motion.lead) + 260); };
    step();
  };
  useEffect(() => () => window.clearTimeout(demo.current), []);

  const tabItems: TabItem[] = useMemo(() => items.map(it => ({ id: it.id, label: it.label, icon: it.icon, badge: toBadge(it) })), [items]);
  const actions = useMemo(() => [
    ...slots.filter(s => s.on).map(s => ({
      id: s.id, ariaLabel: s.label, badge: toBadge({ badge: s.badge, count: s.count, text: 'new' }),
      ...(s.kind === 'avatar' ? { avatar: { text: s.text } } : { icon: s.icon, variant: s.variant })
    }))
  ], [slots]);
  // кнопка справа: открывает свой раздел или просто выполняет действие (в превью — короткая подсказка)
  const onAction = (id: string) => {
    const s = slots.find(x => x.id === id);
    if (s?.opens) return setPanel(p => (p === id ? null : id));
    setFlash(t('Нажата кнопка «{l}»', { l: s?.label ?? id }));
    window.clearTimeout(flashT.current);
    flashT.current = window.setTimeout(() => setFlash(''), 1600);
  };
  const flashT = useRef(0);

  const code = useMemo(() => codeFor({ lang, mSearch, desk, more, minItem, moreLabel, glass, items, group, slots, layout, position, theme, motion }),
    [lang, mSearch, desk, more, minItem, moreLabel, glass, items, group, slots, layout, position, theme, motion]);
  const copy = async () => { try { await navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 1600); } catch { /* буфер недоступен */ } };

  const activeTitle = (panel && slots.find(s => s.id === panel)?.label) || items.find(i => i.id === tab)?.label || '';
  const badgeOpts: [BadgeKind, string][] = [['none', t('Нет')], ['dot', t('Точка')], ['count', t('Число')], ['text', t('Текст')]];

  return (
    <div className="ed">
      <aside className="ctl" aria-label={t('Настройки меню')}>
        <Sec title={t('Тема')}>
          <div className="presets">
            {PRESETS.map(p => (
              <button key={p.id} className={p.id === preset ? 'on' : ''} onClick={() => { setPreset(p.id); setTheme(p.theme); setGlass(undefined); }}>
                <i style={{ background: `linear-gradient(135deg, ${p.theme.surfaceTop}, ${p.theme.accent})`, boxShadow: `0 0 0 1px ${p.page === '#eef0f4' ? '#d4d4dc' : '#2a2a30'}` }} />{t(p.name)}
              </button>
            ))}
          </div>
        </Sec>

        <Sec title={t('Пункты меню')}>
          <datalist id="icons">{ICON_OPTIONS.map(n => <option key={n} value={n} />)}</datalist>
          {items.map((it, i) => (
            <div className="it" key={it.id}>
              <div className="it-h">
                <input value={it.label} onChange={e => upd(i, { label: e.target.value })} aria-label={t('Подпись пункта {n}', { n: i + 1 })} />
                <input list="icons" value={it.icon} onChange={e => upd(i, { icon: e.target.value })} aria-label={t('Иконка пункта {n}', { n: i + 1 })} spellCheck={false} />
                <button className="x" onClick={() => removeItem(i)} disabled={items.length < 3} aria-label={t('Убрать пункт {l}', { l: it.label })}>✕</button>
              </div>
              <div className="it-b">
                <Seg label={t('Бейдж пункта {l}', { l: it.label })} value={it.badge} options={badgeOpts} onChange={v => upd(i, { badge: v })} />
                {it.badge === 'count' && (
                  <span className="stp">
                    <button onClick={() => upd(i, { count: Math.max(0, it.count - 1) })} aria-label={t('Меньше')}>−</button>
                    <input type="number" min={0} value={it.count} onChange={e => upd(i, { count: Math.max(0, +e.target.value || 0) })} aria-label={t('Число на бейдже')} />
                    <button onClick={() => upd(i, { count: it.count + 1 })} aria-label={t('Больше')}>+</button>
                  </span>
                )}
                {it.badge === 'text' && <input className="bt" value={it.text} maxLength={4} onChange={e => upd(i, { text: e.target.value })} aria-label={t('Текст бейджа')} />}
              </div>
            </div>
          ))}
          <button className="add" onClick={addItem} disabled={items.length >= 10}>{t('Добавить пункт')}</button>
          <p className="hint">{t('Иконка: встроенная')} (<code>pin</code>), Material Symbols (<code>ms:directions_car</code>) {t('или')} Material Icons (<code>mi:home</code>). {t('Названия — на')} fonts.google.com/icons.</p>
        </Sec>

        <Sec title={t('Кнопки справа')}>
          <ParzToggle className="chk" checked={group} onChange={v => setGroup(v)} label={t('Показывать группу')} />
          <p className="hint" style={{ margin: '0 0 8px 44px' }}>{t('Без неё меню сжимается по пунктам и встаёт по центру, и места хватает на больше пунктов.')}</p>
          <fieldset className="grp-fs" disabled={!group}>
          <p className="hint" style={{ marginTop: 0 }}>{t('До двух любых кнопок. Колокол и профиль — только пример.')}</p>
          <ParzToggle className="chk" checked={mSearch} onChange={v => setMSearch(v)} label={t('Поиск на телефоне, как в iOS')} />
          <p className="hint" style={{ margin: '0 0 8px 44px' }}>{t('Лупа встаёт первой в группу (из кнопок остаётся последняя). По нажатию группа растекается на всю ширину: «✕» слева, поле, «→» справа.')}</p>
          <div className="presets sets">
            {locSets.map(st => (
              <button key={st.name} className={JSON.stringify(st.slots) === JSON.stringify(slots) ? 'on' : ''} onClick={() => { setSlots(st.slots); setPanel(null); }}>{t(st.name)}</button>
            ))}
          </div>
          {slots.map((s, i) => (
            <div className="slot" key={i}>
              <ParzToggle className="chk" checked={s.on} onChange={v => updSlot(i, { on: v })} label={t('Кнопка {n}', { n: i + 1 })} />
              {s.on && <div className="slot-b">
                <div className="it-h two">
                  <input value={s.label} onChange={e => updSlot(i, { label: e.target.value })} aria-label={t('Подпись кнопки {n} для диктора', { n: i + 1 })} placeholder={t('Подпись для диктора')} />
                  {s.kind === 'avatar'
                    ? <input value={s.text} maxLength={2} onChange={e => updSlot(i, { text: e.target.value })} aria-label={t('Буквы аватара')} />
                    : <input list="icons" value={s.icon} onChange={e => updSlot(i, { icon: e.target.value })} aria-label={t('Иконка кнопки {n}', { n: i + 1 })} spellCheck={false} />}
                </div>
                <div className="it-b">
                  <Seg label={t('Вид кнопки {n}', { n: i + 1 })} value={s.kind === 'avatar' ? 'avatar' : s.variant} options={[['default', t('Иконка')], ['accent', t('Акцентная')], ['avatar', t('Аватар')]]}
                    onChange={v => updSlot(i, v === 'avatar' ? { kind: 'avatar' } : { kind: 'icon', variant: v as Slot['variant'] })} />
                </div>
                <div className="it-b">
                  <Seg label={t('Бейдж кнопки {n}', { n: i + 1 })} value={s.badge} options={badgeOpts.filter(o => o[0] !== 'text')} onChange={v => updSlot(i, { badge: v })} />
                  {s.badge === 'count' && <span className="stp"><button onClick={() => updSlot(i, { count: Math.max(0, s.count - 1) })} aria-label={t('Меньше')}>−</button><input type="number" min={0} value={s.count} onChange={e => updSlot(i, { count: Math.max(0, +e.target.value || 0) })} aria-label={t('Число')} /><button onClick={() => updSlot(i, { count: s.count + 1 })} aria-label={t('Больше')}>+</button></span>}
                </div>
                <ParzToggle className="chk sm" checked={s.opens} onChange={v => updSlot(i, { opens: v })} label={t('Открывает свой раздел (иначе — просто действие)')} />
              </div>}
            </div>
          ))}
          </fieldset>
        </Sec>

        <Sec title={t('Раскладка')}>
          <div className="row"><span>{t('Пункты')}</span><Seg label={t('Раскладка')} value={layout} options={[['stacked', t('Иконка над текстом')], ['inline', t('В строку')], ['icons', t('Только иконки')]]} onChange={setLayout} /></div>
          <div className="row"><span>{t('Если пункты не помещаются')}</span><Seg label={t('Переполнение')} value={more ? 'more' : 'none'} options={[['more', t('Прятать в «Меню»')], ['none', t('Не прятать')]]} onChange={v => setMore(v === 'more')} /></div>
          {more && <>
            <Range label={t('Мин. ширина пункта')} unit=" px" min={44} max={140} step={1} value={minItem ?? (layout === 'inline' ? 104 : layout === 'icons' ? 52 : 64)} onChange={setMinItem} />
            <label className="row"><span>{t('Подпись кнопки')}</span><input className="txt" value={moreLabel} maxLength={14} onChange={e => setMoreLabel(e.target.value)} /></label>
          </>}
          <div className="row"><span>{t('Где стоит')}</span><Seg label={t('Положение')} value={position} options={[['bottom', t('Внизу')], ['top', t('Вверху')], ['static', t('В потоке')]]} onChange={setPosition} /></div>
        </Sec>

        <Sec title={t('Компьютер (beta)')}>
          <ParzToggle className="chk" checked={desk.on} onChange={v => updDesk({ on: v })} label={t('Шапка на больших экранах')} />
          <p className="hint" style={{ margin: '0 0 8px 44px' }}>{t('Шире {n} px меню становится верхней шапкой: логотип, пункты в строку, поиск и кнопки справа. Смотрите в рамке «Компьютер».', { n: desk.breakpoint })}</p>
          <fieldset className="grp-fs" disabled={!desk.on}>
            <ParzToggle className="chk" checked={desk.anim} onChange={v => updDesk({ anim: v })} label={t('Живой логотип (Wordmark)')} />
            <p className="hint" style={{ margin: '0 0 8px 44px' }}>{t('Наведите — волна, зажмите — буквы сходятся и загораются. На телефоне стоит над заголовком.')}</p>
            <label className="row"><span>{t('Логотип (надпись)')}</span><input className="txt" value={desk.logo} maxLength={20} onChange={e => updDesk({ logo: e.target.value })} /></label>
            <div className="row"><span>{t('Поиск')}</span><Seg label={t('Вид поиска')} value={desk.search} options={[['bar', t('Строка')], ['button', t('Кнопка')], ['expand', t('Раскрывается')], ['none', t('Нет')]]} onChange={v => updDesk({ search: v })} /></div>
            {desk.search !== 'bar' && <div className="row"><span>{t('Кнопки справа')}</span><Seg label={t('Где кнопки справа')} value={desk.align} options={[['end', t('У правого края')], ['next', t('Сразу за пунктами')]]} onChange={v => updDesk({ align: v })} /></div>}
            {desk.search !== 'none' && <label className="row"><span>{t('Подсказка в поиске')}</span><input className="txt" value={desk.placeholder} maxLength={40} onChange={e => updDesk({ placeholder: e.target.value })} /></label>}
            <Range label={t('Включать шапку с ширины')} unit=" px" min={700} max={1400} step={10} value={desk.breakpoint} onChange={v => updDesk({ breakpoint: v })} />
          </fieldset>
        </Sec>

        <Sec title={t('Анимация')}>
          {MOTION_FIELDS.map(([k, lbl, a, b, s, u]) => <Range key={k} label={t(lbl)} value={motion[k]} min={a} max={b} step={s} unit={t(u)} onChange={v => setMotion(m => ({ ...m, [k]: v }))} />)}
          <ParzToggle className="chk" checked={motion.jelly} onChange={v => setMotion(m => ({ ...m, jelly: v }))} label={t('Упругие круглые кнопки')} />
          <div className="btns"><button onClick={runDemo}>{t('Прогнать по пунктам')}</button><button onClick={() => setMotion(DEFAULT_MOTION)}>{t('По умолчанию')}</button></div>
        </Sec>

        <Sec title={t('Стекло')}>
          <div className="presets glass">
            <button className={glass === undefined ? 'on' : ''} onClick={() => setGlass(undefined)}>{t('Из темы')}</button>
            {(Object.keys(GLASS_PRESETS) as GlassPreset[]).map(k => (
              <button key={k} className={glass === k ? 'on' : ''} onClick={() => setGlass(k)}>{t(GLASS_PRESETS[k].label)}<small>{GLASS_PRESETS[k].transparency}%</small></button>
            ))}
          </div>
          <Range label={t('Прозрачность фона')} unit=" %" min={0} max={100} step={1}
            value={glass === undefined ? Math.round((1 - (splitColor(theme.surfaceTop).a)) * 100) : typeof glass === 'number' ? glass : GLASS_PRESETS[glass].transparency}
            onChange={v => setGlass(v)} />
          <p className="hint">{t('Пресет меняет прозрачность и размытие, ползунок — только прозрачность. Цвет стекла — в «Цветах».')}</p>
        </Sec>

        <Sec title={t('Цвета')} open={false}>
          <div className="clrs">{COLOR_FIELDS.map(([k, lbl]) => <ColorField key={k} label={t(lbl)} value={String(theme[k])} onChange={v => setT(k, v as never)} />)}</div>
          <p className="hint">{t('Ползунок справа от цвета — прозрачность.')}</p>
        </Sec>

        <Sec title={t('Размеры')} open={false}>
          {SIZE_FIELDS.map(([k, lbl, a, b, s]) => <Range key={k} label={t(lbl)} value={theme[k] as number} min={a} max={b} step={s} unit=" px" onChange={v => setT(k, v as never)} />)}
        </Sec>
      </aside>

      <section className="stage" ref={stageRef}>
        <div className="stage-bar" ref={barRef}>
          <Seg label={t('Размер экрана')} value={frame} options={[['phone', t('Телефон')], ['tablet', t('Планшет')], ['desktop', t('Компьютер')]]} onChange={setFrame} />
          <button className="reset" onClick={() => { setItems(locItems(START_ITEMS)); setGroup(true); setGlass(undefined); setMore(true); setDesk(locDesk); setMSearch(false); setMinItem(null); setMoreLabel(LTB_STRINGS[lang].more); setSlots([locSlot(BELL), locSlot(AVATAR)]); setLayout('stacked'); setPosition('bottom'); setPreset('meridian'); setTheme(DEFAULT_THEME); setMotion(DEFAULT_MOTION); setTab('garage'); setPanel(null); }}>{t('Сбросить всё')}</button>
        </div>
        <div className={`dev dev--${frame}${light ? ' dev--light' : ''}`} style={{ background: page, zoom } as React.CSSProperties}>
          <div className="screen">
           <div className="scroll">
            {position === 'static' && <div className="static-wrap"><LiquidTabBar items={tabItems} value={panel ?? tab} onChange={id => { setPanel(null); setTab(id); }} actions={actions} activeAction={panel} onAction={onAction} desktop={desk.on ? { breakpointBy: 'parent', breakpoint: desk.breakpoint, actionsAlign: desk.align, logo: logoNode, search: desk.search, searchPlaceholder: desk.placeholder, onSearch: v => { setFlash(t('Поиск: «{v}»', { v })); window.clearTimeout(flashT.current); flashT.current = window.setTimeout(() => setFlash(''), 1600); }, onSearchClick: () => { setFlash(t('Нажата кнопка поиска')); window.clearTimeout(flashT.current); flashT.current = window.setTimeout(() => setFlash(''), 1600); } } : undefined} mobileSearch={mSearch ? { searchPlaceholder: desk.placeholder, onSearch: v => { setFlash(t('Поиск: «{v}»', { v })); window.clearTimeout(flashT.current); flashT.current = window.setTimeout(() => setFlash(''), 1600); } } : undefined} hideActions={!group} glass={glass} overflow={more ? 'more' : 'none'} minItemWidth={minItem ?? undefined} locale={lang} moreLabel={moreLabel} layout={layout} position="static" theme={theme} motion={motion} /></div>}
            <div className={`fake${desk.on && FRAME_W[frame] >= desk.breakpoint ? ' fake--desk' : ''}`}>
              {desk.on && desk.anim && desk.logo && !(FRAME_W[frame] >= desk.breakpoint) ? <Wordmark key={desk.logo} text={desk.logo} accent={theme.accent} dimColor={light ? '#9a9aa6' : undefined} brightColor={light ? '#1a1a1f' : undefined} hoverColor={light ? '#000' : undefined} /> : <small>{t('Превью')}</small>}
              <h2>{activeTitle}</h2>
              {flash && <div className="flash" role="status">{flash}</div>}
              <div className="cards">{Array.from({ length: 14 }, (_, i) => <div key={i} className="card" style={{ background: `hsl(${(i * 47 + 200) % 360} ${light ? '70% 82%' : '45% 28%'})` }} />)}</div>
            </div>
           </div>
            {position !== 'static' && (
              <LiquidTabBar items={tabItems} value={panel ?? tab} onChange={id => { setPanel(null); setTab(id); }} actions={actions} activeAction={panel}
                onAction={onAction} desktop={desk.on ? { breakpointBy: 'parent', breakpoint: desk.breakpoint, actionsAlign: desk.align, logo: logoNode, search: desk.search, searchPlaceholder: desk.placeholder, onSearch: v => { setFlash(t('Поиск: «{v}»', { v })); window.clearTimeout(flashT.current); flashT.current = window.setTimeout(() => setFlash(''), 1600); }, onSearchClick: () => { setFlash(t('Нажата кнопка поиска')); window.clearTimeout(flashT.current); flashT.current = window.setTimeout(() => setFlash(''), 1600); } } : undefined} mobileSearch={mSearch ? { searchPlaceholder: desk.placeholder, onSearch: v => { setFlash(t('Поиск: «{v}»', { v })); window.clearTimeout(flashT.current); flashT.current = window.setTimeout(() => setFlash(''), 1600); } } : undefined} hideActions={!group} glass={glass} overflow={more ? 'more' : 'none'} minItemWidth={minItem ?? undefined} locale={lang} moreLabel={moreLabel} layout={layout} position={position} theme={theme} motion={motion} />
            )}
          </div>
        </div>
        {zoom < 0.995 && <p className="dev-scale">{t('Показано в масштабе {n}% — внутри настоящий размер экрана', { n: Math.round(zoom * 100) })}</p>}
        <div className="code">
          <div className="code-h"><b>{t('Код')}</b><button onClick={copy}>{copied ? t('Скопировано') : t('Скопировать')}</button></div>
          <pre><code>{code}</code></pre>
        </div>
      </section>
    </div>
  );
}
