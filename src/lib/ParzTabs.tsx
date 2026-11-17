import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type ReactNode } from 'react';
import { Icon, type IconSpec } from './Icon';
import { ParzBadge } from './ParzBadge';
import './ParzTabs.css';

export type ParzTabsSize = 'sm' | 'md' | 'lg';
/** Что делать, если пункты не помещаются: 'wrap' — переносить на новую строку, 'more' — спрятать лишние в «•••», 'scroll' — прокручивать по горизонтали. */
export type ParzTabsOverflow = 'wrap' | 'more' | 'scroll';

export interface ParzTabsOption<T extends string = string> {
  value: T;
  label?: ReactNode;
  /** Иконка перед подписью: 'ms:имя' (Material Symbols), встроенная иконка или свой элемент. */
  icon?: IconSpec;
  /** Бейдж после подписи: число, короткий текст или 'dot' — точка без текста. */
  badge?: number | string;
  /** Цвет бейджа. По умолчанию красный. */
  badgeColor?: string;
  /** Мягкий пульс вокруг бейджа (удобно для точки). */
  badgePulse?: boolean;
  /** Имя для экранных дикторов, если label — только иконка. */
  ariaLabel?: string;
  disabled?: boolean;
}

/** Parz UI · Parz Tabs — сегментированный переключатель: плашка выбора перетекает к новому значению, ведущий край первым, хвост догоняет. */
export interface ParzTabsProps<T extends string = string> {
  options: ParzTabsOption<T>[];
  /** Выбранное значение (управляемый режим). */
  value?: T;
  /** Начальное значение (неуправляемый режим). По умолчанию первое доступное. */
  defaultValue?: T;
  onChange?: (value: T) => void;
  /** Имя группы для экранных дикторов. */
  ariaLabel?: string;
  /** По умолчанию 'md'. */
  size?: ParzTabsSize;
  /** Растянуть на всю ширину, сегменты поровну. */
  fullWidth?: boolean;
  /** Если пункты не помещаются. По умолчанию 'wrap'. */
  overflow?: ParzTabsOverflow;
  /** Для overflow='scroll': затенять края, за которыми есть ещё пункты. По умолчанию да. */
  fadeEdges?: boolean;
  /** Для overflow='scroll': маленькие кнопки-стрелки по краям. С ними выбранный пункт не прокручивается к центру сам. По умолчанию нет. */
  scrollButtons?: boolean;
  /** Где бейджи: 'inline' — рядом с подписью, 'corner' — в правом верхнем углу пункта, ширину не меняет. По умолчанию 'inline'. */
  badgePlacement?: ParzTabsBadgePlacement;
  /** Иконка кнопки с остальными пунктами. По умолчанию встроенная 'more' — та же, что в Parz Menu. */
  moreIcon?: IconSpec;
  /** Подпись кнопки «•••» для экранных дикторов. По умолчанию 'More'. */
  moreLabel?: string;
  disabled?: boolean;
  /** Фон дорожки. */
  background?: string;
  /** Цвет плашки. */
  pillColor?: string;
  /** Цвет текста выбранного сегмента. */
  activeColor?: string;
  /** Цвет текста остальных сегментов. */
  color?: string;
  id?: string;
  className?: string;
  style?: CSSProperties;
}

type Pill = { l: number; r: number; t: number; h: number; iw: number; dir: 1 | -1; ready: boolean; snap: boolean };
export type ParzTabsBadgePlacement = 'inline' | 'corner';
const reduced = () => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

export function ParzTabs<T extends string = string>({
  options, value, defaultValue, onChange, ariaLabel, size = 'md', fullWidth = false, overflow = 'wrap', fadeEdges = true, scrollButtons = false, badgePlacement = 'inline', moreLabel = 'More', moreIcon = 'more',
  disabled = false, background, pillColor, activeColor, color, id, className, style
}: ParzTabsProps<T>) {
  const [inner, setInner] = useState<T | undefined>(defaultValue ?? options.find(o => !o.disabled)?.value);
  const cur = value ?? inner;
  const root = useRef<HTMLDivElement>(null);
  const box = useRef<HTMLDivElement>(null);
  const meas = useRef<HTMLDivElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const [pill, setPill] = useState<Pill | null>(null);
  const lastPos = useRef(-2);
  const movedAt = useRef(0);
  const [hint, setHint] = useState({ l: false, r: false });
  const [fit, setFit] = useState(options.length);
  const [open, setOpen] = useState(false);
  const [side, setSide] = useState<'end' | 'start'>('end');
  const [fade, setFade] = useState({ l: false, r: false });
  const idx = options.findIndex(o => o.value === cur);
  const more = overflow === 'more';
  const shown = more ? Math.min(fit, options.length) : options.length;
  const hasMore = more && shown < options.length;
  const hidden = hasMore ? options.slice(shown) : [];
  // где стоит плашка: на выбранном пункте; если он спрятан или меню открыто — на «•••»
  const pos = hasMore && (open || idx >= shown) ? shown : idx;

  // сколько пунктов помещается: меряем невидимую копию всех кнопок и «•••»
  useLayoutEffect(() => {
    if (!more) return;
    const r = root.current, m = meas.current, p = r?.parentElement; if (!r || !m || !p) return;
    const calc = () => {
      const ps = getComputedStyle(p), rs = getComputedStyle(r);
      const avail = p.clientWidth - parseFloat(ps.paddingLeft) - parseFloat(ps.paddingRight) - parseFloat(rs.paddingLeft) - parseFloat(rs.paddingRight);
      const w = Array.from(m.children).map(c => (c as HTMLElement).getBoundingClientRect().width);
      const moreW = w.pop() ?? 0;
      const total = w.reduce((a, b) => a + b, 0);
      if (total <= avail + 0.5) { setFit(options.length); return; }
      let acc = moreW, n = 0;
      while (n < w.length && acc + w[n] <= avail + 0.5) acc += w[n++];
      setFit(Math.max(1, n));
    };
    calc();
    const ro = new ResizeObserver(calc); ro.observe(p); ro.observe(m);
    return () => ro.disconnect();
  }, [more, options, size]);

  useLayoutEffect(() => {
    const el = box.current; if (!el) return;
    const place = () => {
      const b = el.children[pos + 1] as HTMLElement | undefined; // [0] — сама плашка
      if (!b || pos < 0) { setPill(null); return; }
      setPill(p => {
        // r — правый край пункта; в CSS это calc(100% - r), так что ширина контейнера в расчёт не входит
        // дробные координаты (offsetLeft округляет до целых — плашка и текст в ней расходились на полпикселя)
        const er = el.getBoundingClientRect(), br = b.getBoundingClientRect();
        const l = br.left - er.left - el.clientLeft + el.scrollLeft, t = br.top - er.top - el.clientTop + el.scrollTop;
        const n = { l, r: l + br.width, t, h: br.height, iw: er.width };
        if (p && p.l === n.l && p.r === n.r && p.t === n.t && p.h === n.h && p.iw === n.iw) return p;
        // плашка перетекает, только когда выбор переехал; если меняется ширина или размер — идёт за пунктом кадр в кадр, без опоздания
        // пока плашка ещё едет к новому пункту (~0.5 с), замеры не обрывают её переезд
        const now = performance.now();
        if (lastPos.current !== pos) { lastPos.current = pos; movedAt.current = now; }
        const moved = now - movedAt.current < 520;
        return { ...n, dir: p && n.l < p.l ? -1 : 1, ready: !!p, snap: !!p && !moved };
      });
    };
    place();
    const ro = new ResizeObserver(place); ro.observe(el);
    for (const c of Array.from(el.children)) ro.observe(c);
    // страховка: после плавной смены размера пунктов ещё раз сверяемся, даже если ResizeObserver что-то пропустил
    const end = (e: TransitionEvent) => { if (e.target !== el.firstElementChild) place(); };
    el.addEventListener('transitionend', end);
    return () => { ro.disconnect(); el.removeEventListener('transitionend', end); };
  }, [pos, shown, options.length, size, fullWidth, overflow, badgePlacement]);

  // прокрутка: выбранный пункт плавно выезжает в центр, края затеняются там, где есть ещё пункты
  const edges = () => {
    const s = box.current; if (!s || overflow !== 'scroll') return;
    const l = s.scrollLeft > 1, r = s.scrollLeft + s.clientWidth < s.scrollWidth - 1;
    setFade(f => (f.l === l && f.r === r ? f : { l, r }));
    // есть ли бейджи у пунктов за левым или правым краем — тогда в затенении (или на стрелке) загорается точка
    let hl = false, hr = false;
    options.forEach((o, i) => {
      if (o.badge === undefined || o.badge === 0) return;
      const b = s.children[i + 1] as HTMLElement | undefined; if (!b) return;
      const mid = b.offsetLeft + b.offsetWidth / 2;
      if (mid < s.scrollLeft + 20) hl = true;
      else if (mid > s.scrollLeft + s.clientWidth - 20) hr = true;
    });
    setHint(h => (h.l === hl && h.r === hr ? h : { l: hl, r: hr }));
  };
  useLayoutEffect(() => {
    if (overflow !== 'scroll') return;
    edges();
    const s = box.current; if (!s) return;
    const ro = new ResizeObserver(edges); ro.observe(s);
    for (const c of Array.from(s.children)) ro.observe(c);
    return () => ro.disconnect();
  }, [overflow, options]);
  useEffect(() => {
    const s = box.current; if (overflow !== 'scroll' || scrollButtons || !s || idx < 0) return;
    const b = s.children[idx + 1] as HTMLElement | undefined; if (!b) return;
    s.scrollTo({ left: b.offsetLeft - (s.clientWidth - b.offsetWidth) / 2, behavior: reduced() ? 'auto' : 'smooth' });
  }, [idx, overflow, scrollButtons]);
  // настройки поменялись (режим, размер, ширина, пункты) — выбранный пункт не должен остаться за краем
  useEffect(() => {
    const s = box.current; if (overflow !== 'scroll' || !s || idx < 0) return;
    const f = window.setTimeout(() => {
      const b = s.children[idx + 1] as HTMLElement | undefined; if (!b) return;
      const pad = 28, l = b.offsetLeft, r = l + b.offsetWidth;
      if (l < s.scrollLeft + pad || r > s.scrollLeft + s.clientWidth - pad)
        s.scrollTo({ left: l - (s.clientWidth - b.offsetWidth) / 2, behavior: reduced() ? 'auto' : 'smooth' });
    }, reduced() ? 0 : 460); // ждём, пока пункты плавно сменят размер
    return () => window.clearTimeout(f);
  }, [overflow, size, fullWidth, options.length, scrollButtons]);
  const nudge = (d: 1 | -1) => { const s = box.current; if (s) s.scrollBy({ left: d * s.clientWidth * 0.7, behavior: reduced() ? 'auto' : 'smooth' }); };
  const arrows = overflow === 'scroll' && scrollButtons;

  // меню «•••»: закрывается кликом мимо и Escape
  // меню растёт от правого края «•••»; если слева не хватает места — от левого края переключателя
  useLayoutEffect(() => {
    if (!open) return;
    const r = root.current?.getBoundingClientRect(), m = menu.current; if (!r || !m) return;
    setSide(r.right - m.offsetWidth >= 8 ? 'end' : 'start');
  }, [open]);
  useEffect(() => {
    if (!open) return;
    const down = (e: PointerEvent) => { if (!root.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('pointerdown', down);
    const f = window.setTimeout(() => (menu.current?.querySelector('[aria-checked=true],button:not(:disabled)') as HTMLElement | null)?.focus({ preventScroll: true }), 60);
    return () => { document.removeEventListener('pointerdown', down); window.clearTimeout(f); };
  }, [open]);
  useEffect(() => { if (!hasMore) setOpen(false); }, [hasMore]);

  const pick = (v: T) => { setOpen(false); if (v === cur) return; if (value === undefined) setInner(v); onChange?.(v); };
  const moreBtn = () => box.current?.children[shown + 1] as HTMLElement | undefined;

  // стрелки ходят по видимым пунктам и «•••»; на «•••» только фокус, Enter открывает меню
  const onKey = (e: KeyboardEvent<HTMLButtonElement>, i: number) => {
    const n = shown + (hasMore ? 1 : 0);
    const ok = (j: number) => j === shown ? hasMore : !options[j].disabled;
    const rtl = getComputedStyle(e.currentTarget).direction === 'rtl';
    const k = e.key, step = k === 'ArrowRight' || k === 'ArrowDown' ? 1 : k === 'ArrowLeft' || k === 'ArrowUp' ? -1 : 0;
    let j = -1;
    if (step) {
      const s = (k === 'ArrowRight' || k === 'ArrowLeft') && rtl ? -step : step;
      for (let m = 1; m <= n; m++) { const c = ((i + s * m) % n + n) % n; if (ok(c)) { j = c; break; } }
    } else if (k === 'Home') { for (let c = 0; c < n; c++) if (ok(c)) { j = c; break; } }
    else if (k === 'End') { for (let c = n - 1; c >= 0; c--) if (ok(c)) { j = c; break; } }
    if (j < 0) return;
    e.preventDefault();
    if (j < shown) pick(options[j].value);
    (box.current?.children[j + 1] as HTMLElement | undefined)?.focus();
  };
  const onMenuKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const items = Array.from(menu.current?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)') ?? []);
    const i = items.indexOf(document.activeElement as HTMLButtonElement);
    if (e.key === 'Escape') { e.preventDefault(); setOpen(false); moreBtn()?.focus(); }
    else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); items[(i + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length]?.focus(); }
    else if (e.key === 'Tab') setOpen(false);
  };

  const content = (o: ParzTabsOption<T>) => <>
    {o.icon !== undefined && <span className="pz-tabs-ico" aria-hidden="true"><Icon icon={o.icon} /></span>}
    {o.label}
    {o.badge !== undefined && (o.badge === 'dot'
      ? <ParzBadge dot pulse={o.badgePulse} size="sm" color={o.badgeColor} className="pz-tabs-bd" />
      : <ParzBadge size="sm" pulse={o.badgePulse} color={o.badgeColor} className="pz-tabs-bd" {...(typeof o.badge === 'number' ? { count: o.badge } : { label: o.badge })} />)}
  </>;
  const alert = hidden.some(o => o.badge !== undefined && o.badge !== 0);

  const vars: Record<string, string> = {};
  if (background) vars['--pz-tabs-bg'] = background;
  if (pillColor) vars['--pz-tabs-pill'] = pillColor;
  if (activeColor) vars['--pz-tabs-on'] = activeColor;
  if (color) vars['--pz-tabs-fg'] = color;
  if (pill) Object.assign(vars, { '--l': `${pill.l}px`, '--r': `calc(100% - ${pill.r}px)`, '--t': `${pill.t}px`, '--h': `${pill.h}px`, '--iw': `${pill.iw}px` });
  const focusIdx = idx >= 0 && idx < shown && !options[idx].disabled ? idx : hasMore && idx >= shown ? shown : options.findIndex(o => !o.disabled);

  return (
    <div ref={root} id={id} role="radiogroup" aria-label={ariaLabel} aria-disabled={disabled || undefined}
      className={['pz-tabs', `pz-tabs--${size}`, `pz-tabs--${overflow}`, fullWidth && 'pz-tabs--full', pill?.ready && 'is-ready', pill?.snap && 'is-snap', `pz-tabs--bd-${badgePlacement}`, pill?.dir === -1 && 'to-left',
        overflow === 'scroll' && fadeEdges && fade.l && 'fade-l', overflow === 'scroll' && fadeEdges && fade.r && 'fade-r', arrows && 'has-arr', disabled && 'is-disabled', open && 'is-menu', className].filter(Boolean).join(' ')}
      style={{ ...vars, ...style } as CSSProperties}>
      <div ref={box} className="pz-tabs-in" onScroll={overflow === 'scroll' ? edges : undefined}>
        {/* внутри плашки — копия подписей в «выбранном» цвете, сдвинутая ровно навстречу плашке. Плашка обрезает её своей формой,
            поэтому текст окрашивается там, где плашка сейчас, — на полпути половина слова уже тёмная, а не всё слово сразу */}
        <span className="pz-tabs-pill" aria-hidden="true" style={{ opacity: pill ? 1 : 0 }}>
          <span className="pz-tabs-ovl" {...{ inert: '' } as object}>
            {options.slice(0, shown).map(o => <span key={o.value} className={`pz-tabs-b${o.disabled || disabled ? ' is-off' : ''}`}>{content(o)}</span>)}
            {hasMore && <span className="pz-tabs-b pz-tabs-more"><span className="pz-tabs-ico"><Icon icon={moreIcon} /></span><ParzBadge count={hidden.length} size="sm" variant="soft" color="currentColor" className="pz-tabs-bd" /></span>}
          </span>
        </span>
        {options.slice(0, shown).map((o, i) => {
          const on = o.value === cur;
          return (
            <button key={o.value} type="button" role="radio" aria-checked={on} aria-label={o.ariaLabel}
              disabled={disabled || o.disabled} tabIndex={i === focusIdx ? 0 : -1}
              className={`pz-tabs-b${on && pos === i ? ' is-on' : ''}`} onClick={() => pick(o.value)} onKeyDown={e => onKey(e, i)}>{content(o)}</button>
          );
        })}
        {hasMore && (
          <button type="button" className={`pz-tabs-b pz-tabs-more${pos === shown ? ' is-on' : ''}${alert ? ' has-alert' : ''}`} aria-haspopup="menu" aria-expanded={open}
            aria-label={`${moreLabel}: ${hidden.length}`} disabled={disabled} tabIndex={focusIdx === shown ? 0 : -1}
            onClick={() => setOpen(v => !v)} onKeyDown={e => onKey(e, shown)}>
            <span className="pz-tabs-ico" aria-hidden="true"><Icon icon={moreIcon} /></span>
            <ParzBadge count={hidden.length} size="sm" variant="soft" color="currentColor" className="pz-tabs-bd" />
          </button>
        )}
      </div>
      {overflow === 'scroll' && !arrows && fadeEdges && <>
        <span className={`pz-tabs-hint pz-tabs-hint--l${fade.l && hint.l ? ' is-shown' : ''}`} aria-hidden="true" />
        <span className={`pz-tabs-hint pz-tabs-hint--r${fade.r && hint.r ? ' is-shown' : ''}`} aria-hidden="true" />
      </>}
      {arrows && <>
        <button type="button" className={`pz-tabs-arr pz-tabs-arr--l${fade.l ? ' is-shown' : ''}${hint.l ? ' has-alert' : ''}`} tabIndex={-1} aria-hidden="true" onClick={() => nudge(-1)}><i /></button>
        <button type="button" className={`pz-tabs-arr pz-tabs-arr--r${fade.r ? ' is-shown' : ''}${hint.r ? ' has-alert' : ''}`} tabIndex={-1} aria-hidden="true" onClick={() => nudge(1)}><i /></button>
      </>}
      {hasMore && (
        <div ref={menu} role="menu" aria-label={moreLabel} className={`pz-tabs-menu pz-tabs-menu--${side}${open ? ' is-open' : ''}`} onKeyDown={onMenuKey} {...(open ? {} : { inert: '' }) as object}>
          {hidden.map(o => (
            <button key={o.value} type="button" role="menuitemradio" aria-checked={o.value === cur} aria-label={o.ariaLabel} disabled={o.disabled}
              className={`pz-tabs-mi${o.value === cur ? ' is-on' : ''}`} onClick={() => pick(o.value)}>{content(o)}</button>
          ))}
        </div>
      )}
      {more && (
        <div className="pz-tabs-meas" aria-hidden="true"><div ref={meas} className="pz-tabs-meas-row">
          {options.map(o => <span key={o.value} className="pz-tabs-b">{content(o)}</span>)}
          <span className="pz-tabs-b pz-tabs-more"><span className="pz-tabs-ico"><Icon icon={moreIcon} /></span><ParzBadge count={88} size="sm" className="pz-tabs-bd" /></span>
        </div></div>
      )}
    </div>
  );
}
