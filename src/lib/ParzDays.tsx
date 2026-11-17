import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent as RPointerEvent, type ReactNode } from 'react';
import { useParzMotion, type ParzMotionPreset, type ParzMotionSpec } from './ParzProvider';
import './ParzDays.css';

export type ParzDaysSize = 'sm' | 'md' | 'lg';
export type ParzDaysTheme = 'light' | 'dark';
/** Выбор месяца и года: 'wheels' — над лентой дней выезжают ленты годов и месяцев; 'compact' — маленькое окно с сеткой месяцев и полем года. */
export type ParzDaysPicker = 'wheels' | 'compact';

/** Parz UI · Parz Days — лента дней под неподвижной карточкой: дни едут под ней, как колесо, и пружинят на выбранную дату. */
export interface ParzDaysProps {
  /** Выбранный день (управляемый режим). */
  value?: Date;
  /** Начальный день (неуправляемый режим). По умолчанию сегодня. */
  defaultValue?: Date;
  /** Новый день: Date (по местному времени) и та же дата строкой 'YYYY-MM-DD' — удобно для API. С showTime — Date со временем и строка 'YYYY-MM-DDTHH:mm'. */
  onChange?: (date: Date, iso: string) => void;
  /** Имя поля формы: внутри будет скрытый input со значением 'YYYY-MM-DD', и дата уйдёт вместе с формой. */
  name?: string;
  /** Самый ранний доступный день. */
  min?: Date;
  /** Самый поздний доступный день. */
  max?: Date;
  /** Недоступные дни: на них лента не останавливается. */
  isDisabled?: (date: Date) => boolean;
  /** Отдельные недоступные даты (вместе с isDisabled). */
  disabledDates?: Date[];
  /** Точка под числом: true — цвет по умолчанию, строка — свой цвет. */
  marks?: (date: Date) => boolean | string | undefined;
  /** Язык подписей (Intl). По умолчанию язык браузера. */
  locale?: string;
  /** День недели: 'narrow' — одна буква, 'short' — сокращение. По умолчанию 'narrow'. */
  weekday?: 'narrow' | 'short';
  /** Месяц и год над лентой; меняются, перекатываясь. */
  showMonth?: boolean;
  /** Выбор месяца и года по нажатию на месяц над лентой. Включает и showMonth. */
  picker?: ParzDaysPicker;
  /** Можно ли менять год в выборе. false — только месяцы. По умолчанию да. */
  pickerYear?: boolean;
  /** Выбор времени: рядом с месяцем появляется кнопка «14:30», в мини-окне — вертикальные барабаны часов и минут. Дата в onChange приходит со временем. */
  showTime?: boolean;
  /** Шаг минут в барабане. По умолчанию 5. */
  minuteStep?: number;
  /** Подпись кнопки «Сегодня». Кнопка появляется, когда выбран другой день. */
  todayLabel?: string;
  /** По умолчанию 'md'. */
  size?: ParzDaysSize;
  /** По умолчанию 'light'. */
  theme?: ParzDaysTheme;
  /** Пресет движения; без него — из ParzProvider (по умолчанию 'bouncy'). */
  motion?: ParzMotionPreset;
  /** Цвет карточки. */
  cardColor?: string;
  /** Цвет чисел. */
  color?: string;
  /** Цвет дней недели. */
  weekdayColor?: string;
  /** Цвет точек-меток по умолчанию. */
  markColor?: string;
  /** Выделять сегодняшний день цветом. По умолчанию да. */
  highlightToday?: boolean;
  /** Цвет числа сегодняшнего дня. По умолчанию зелёный. */
  todayColor?: string;
  /** В выборе выделять текущий год и месяц цветом. По умолчанию да. */
  highlightCurrent?: boolean;
  /** Цвет текущего года и месяца. По умолчанию как у сегодняшнего дня (todayColor, зелёный). */
  currentColor?: string;
  /** Выделять название воскресенья цветом. По умолчанию да. */
  highlightSunday?: boolean;
  /** Цвет названия воскресенья. По умолчанию красный. */
  sundayColor?: string;
  /** Имя для экранных дикторов. */
  ariaLabel?: string;
  disabled?: boolean;
  id?: string;
  className?: string;
  style?: CSSProperties;
}

const DAY = 864e5;
const toIdx = (d: Date) => Math.round(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / DAY);
const fromIdx = (i: number) => { const u = new Date(i * DAY); return new Date(u.getUTCFullYear(), u.getUTCMonth(), u.getUTCDate()); };
/** Дата строкой 'YYYY-MM-DD' по местному времени (без сдвига часового пояса, в отличие от toISOString). */
export const toISODate = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const reduced = () => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
/** Системные границы Parz Days: раньше 1 января 1900 и позже 31 декабря через 100 лет от сегодня лента не уходит, какие бы min/max ни передали. */
export const PARZ_DAYS_MIN_YEAR = 1900;
export const PARZ_DAYS_MAX_YEARS_AHEAD = 100;
const sysMin = () => toIdx(new Date(PARZ_DAYS_MIN_YEAR, 0, 1));
const sysMax = () => toIdx(new Date(new Date().getFullYear() + PARZ_DAYS_MAX_YEARS_AHEAD, 11, 31));
let warned = false;
// ширина ячейки: дни, месяцы, годы
const GEO: Record<ParzDaysSize, { d: number; m: number; y: number }> = { sm: { d: 48, m: 66, y: 70 }, md: { d: 62, m: 84, y: 88 }, lg: { d: 76, m: 102, y: 106 } };
const COMPACT = 0.6;

/* ───────── Лента ─────────
   Общая механика для дней, месяцев и годов: позиция x (дробный индекс под карточкой) едет пружиной к цели,
   карточка — «желе» со своей недодемпфированной пружиной, за границами — стенка и сопротивление. */
interface WheelProps {
  value: number; lo: number; hi: number; ok: (i: number) => boolean;
  onCommit: (i: number) => void; W: number; spec: ParzMotionSpec; disabled: boolean; page: number; home?: () => number;
  cell: (i: number, dist: number) => { node: ReactNode; cls?: string };
  ariaLabel?: string; valueText: (i: number) => string; kind: string;
  compact: boolean; onActivate?: () => void;
}

function Wheel({ value, lo, hi, ok, onCommit, W, spec, disabled, page, home, cell, ariaLabel, valueText, kind, compact, onActivate }: WheelProps) {
  const st = useRef({ x: value, v: 0, target: value, raf: 0, last: 0, j: 0, jv: 0, drag: false, moveAt: 0 });
  const [, tick] = useState(0);
  const redraw = () => tick(n => (n + 1) & 0xffff);
  const track = useRef<HTMLDivElement>(null);
  const view = useRef<HTMLDivElement>(null);
  const [cw, setCw] = useState(0);
  useLayoutEffect(() => {
    const el = track.current; if (!el) return;
    const ro = new ResizeObserver(() => setCw(el.clientWidth)); ro.observe(el); setCw(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  const nearest = useCallback((i: number, dir = 1) => {
    i = Math.min(hi, Math.max(lo, i));
    if (ok(i)) return i;
    const s = dir < 0 ? -1 : 1;
    for (let n = 1; n < 400; n++) { if (ok(i + s * n)) return i + s * n; if (ok(i - s * n)) return i - s * n; }
    return i;
  }, [lo, hi, ok]);

  const stop = () => { cancelAnimationFrame(st.current.raf); st.current.raf = 0; };
  const run = useCallback(() => {
    const s = st.current;
    if (reduced()) { if (!s.drag) { stop(); s.x = s.target; s.v = 0; } s.j = s.jv = 0; redraw(); return; }
    if (s.raf) return;
    s.last = performance.now();
    // желе мягче ленты и почти без затухания — карточка успевает пару раз качнуться
    const jk = spec.stiffness * 1.3, jc = spec.damping * 0.45;
    const step = (t: number) => {
      const dt = Math.min((t - s.last) / 1000, 1 / 30); s.last = t;
      // палец остановился, но не отпущен — скорость гаснет, и карточка успокаивается прямо под пальцем
      if (s.drag && t - s.moveAt > 40) s.v *= Math.exp(-dt * 14);
      // пружина (полунеявный Эйлер, по два подшага — стабильно и для жёсткого пресета)
      for (let k = 0; k < 2; k++) {
        const h = dt / 2;
        if (!s.drag) { const a = -spec.stiffness * (s.x - s.target) - spec.damping * s.v; s.v += a * h; s.x += s.v * h; }
        const T = Math.max(-1, Math.min(1, s.v / 12)) * spec.squish;
        const ja = -jk * (s.j - T) - jc * s.jv; s.jv += ja * h; s.j += s.jv * h;
      }
      const restX = !s.drag && Math.abs(s.x - s.target) < 0.0015 && Math.abs(s.v) < 0.02;
      if (restX) { s.x = s.target; s.v = 0; }
      if (restX && Math.abs(s.j) < 0.002 && Math.abs(s.jv) < 0.02) { s.j = s.jv = 0; s.raf = 0; redraw(); return; }
      redraw();
      s.raf = requestAnimationFrame(step);
    };
    s.raf = requestAnimationFrame(step);
  }, [spec]);
  useEffect(() => stop, []);

  const commit = (i: number) => { st.current.target = i; run(); if (i !== value) onCommit(i); };
  // значение поменялось снаружи (например, сменили месяц) — лента едет к нему; издалека — с короткого разгона, а не через сотни ячеек
  useEffect(() => {
    const s = st.current;
    if (value === s.target) return;
    if (!reduced() && !s.drag && Math.abs(value - s.x) > 12) { const dir = Math.sign(value - s.x); s.x = value - dir * 6; s.v = dir * 24; }
    s.target = value; run();
  }, [value, run]);

  const drag = useRef<{ x0: number; p0: number; moved: boolean; hit: number | null; hist: [number, number][] } | null>(null);
  // в компактном виде ячейки мельче — палец двигает ленту на столько же ячеек, сколько видит глаз
  const pxW = W * (compact ? COMPACT : 1);
  const rubber = (raw: number) => {
    if (raw < lo) return lo - (1 - 1 / ((lo - raw) * 0.6 + 1)) / 0.6;
    if (raw > hi) return hi + (1 - 1 / ((raw - hi) * 0.6 + 1)) / 0.6;
    return raw;
  };
  const onDown = (e: RPointerEvent<HTMLDivElement>) => {
    if (disabled || (e.pointerType === 'mouse' && e.button !== 0)) return;
    const c = (e.target as HTMLElement).closest('[data-i]');
    st.current.drag = true; st.current.moveAt = performance.now(); run();
    drag.current = { x0: e.clientX, p0: st.current.x, moved: false, hit: c ? Number(c.getAttribute('data-i')) : null, hist: [[performance.now(), st.current.x]] };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onMove = (e: RPointerEvent<HTMLDivElement>) => {
    const d = drag.current; if (!d) return;
    const dx = e.clientX - d.x0;
    if (!d.moved && Math.abs(dx) < 5) return;
    d.moved = true;
    const s = st.current, now = performance.now();
    s.moveAt = now;
    s.x = rubber(d.p0 - dx / pxW);
    d.hist.push([now, s.x]); while (d.hist.length > 2 && now - d.hist[0][0] > 90) d.hist.shift();
    const [t0, x0] = d.hist[0]; s.v = now - t0 > 0 ? (s.x - x0) / ((now - t0) / 1000) : 0;
    redraw();
  };
  const onUp = () => {
    const d = drag.current; if (!d) return; drag.current = null;
    const s = st.current; s.drag = false;
    onActivate?.();
    if (!d.moved) { if (d.hit !== null && ok(d.hit)) commit(d.hit); else run(); return; }
    if (performance.now() - d.hist[d.hist.length - 1][0] > 80) s.v = 0; // палец остановился перед отпусканием
    // годы и месяцы — крупные шаги: инерция короче, чтобы рывок не уносил на десяток лет
    const lim = kind === 'day' ? 40 : 14, proj = kind === 'day' ? 0.24 : 0.12;
    const v = Math.max(-lim, Math.min(lim, s.v));
    s.v = v;
    commit(nearest(Math.round(s.x + v * proj), v));
  };

  // колесо и тачпад: только горизонтальная прокрутка (или Shift + колесо), вертикальную страницу не трогаем
  // таймер фиксации живёт вне эффекта: обработчик переподключается на каждой перерисовке, а фиксация не должна теряться
  const wt = useRef(0);
  const late = useRef<() => void>(() => {});
  useEffect(() => () => clearTimeout(wt.current), []);
  useEffect(() => {
    const el = view.current; if (!el) return;
    const wheel = (e: WheelEvent) => {
      if (disabled) return;
      const d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.shiftKey ? e.deltaY : 0;
      if (!d) return;
      e.preventDefault();
      const s = st.current, now = performance.now();
      // скорость колеса/тачпада — по времени между событиями, сглаженная: от неё тянется «желе» карточки
      const dt = Math.max(0.008, Math.min(0.1, (now - s.moveAt) / 1000));
      const inst = s.drag ? (d / pxW) / dt : (d / pxW) * 60;
      s.v = Math.max(-30, Math.min(30, s.v * 0.4 + inst * 0.6));
      s.drag = true; s.moveAt = now;
      s.x = rubber(s.x + d / pxW);
      run();
      late.current = () => { s.drag = false; onActivate?.(); commit(nearest(Math.round(s.x), d)); };
      clearTimeout(wt.current);
      wt.current = window.setTimeout(() => late.current(), 130);
    };
    el.addEventListener('wheel', wheel, { passive: false });
    return () => el.removeEventListener('wheel', wheel);
  });

  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (disabled) return;
    const rtl = getComputedStyle(e.currentTarget).direction === 'rtl';
    const k = e.key, cur = st.current.target;
    const step = k === 'ArrowRight' ? (rtl ? -1 : 1) : k === 'ArrowLeft' ? (rtl ? 1 : -1) : k === 'PageDown' ? page : k === 'PageUp' ? -page : 0;
    let n: number | null = null;
    if (step) {
      let j = cur + step;
      while (j >= lo && j <= hi && !ok(j) && Math.abs(j - cur) < 400) j += Math.sign(step);
      if (ok(j)) n = j;
    } else if (k === 'Home' && home) n = nearest(home());
    if (n === null) return;
    e.preventDefault(); onActivate?.(); commit(n);
  };

  const s = st.current, x = s.x;
  // желе: вытягивается вдоль движения, сплющивается, наклоняется и чуть отстаёт; при остановке качается и успокаивается
  const j = Math.max(-1.4, Math.min(1.4, s.j)), aj = Math.abs(j);
  // за границей карточка упирается в стенку: сплющивается и прижимается к ней
  const over = x < lo ? lo - x : x > hi ? x - hi : 0, os = x < lo ? -1 : 1, ov = Math.min(over * 2.2, 1);
  const cardT = `translate3d(${-j * 7 + os * ov * 5}px,0,0) skewX(${-j * 7}deg) scale(${(1 + 0.2 * aj) * (1 - 0.18 * ov)},${(1 - 0.11 * aj) * (1 + 0.08 * ov)})`;
  // хвост капли круглее, нос острее
  const r0 = 1 + 0.45 * aj, rLead = 1 - 0.25 * aj;
  const rl = j > 0 ? r0 : rLead, rr = j > 0 ? rLead : r0;
  const cardR = `calc(var(--cr) * ${rl}) calc(var(--cr) * ${rr}) calc(var(--cr) * ${rr}) calc(var(--cr) * ${rl})`;

  const R = Math.ceil(cw / W / 2) + 2;
  const c0 = Math.round(x);
  const cells = [];
  if (cw > 0) for (let i = c0 - R; i <= c0 + R; i++) {
    const dist = Math.abs(i - x);
    const out = i < lo || i > hi, off = !ok(i);
    const left = cw / 2 + (i - x) * W - W / 2;
    const sc = (1 - Math.min(dist, 1.4) * 0.09) * (out ? 0.82 : 1);
    const op = Math.max(0, 1 - Math.max(0, dist - 0.6) * 0.2) * (out ? 0.18 : off ? 0.35 : 1);
    const c = cell(i, dist);
    cells.push(
      <div key={i} data-i={i} className={`pz-days-c${off ? ' is-off' : ''}${c.cls ? ' ' + c.cls : ''}`} aria-hidden="true"
        style={{ transform: `translate3d(${left}px,0,0) scale(${sc})`, opacity: op, width: W }}>{c.node}</div>
    );
  }
  // стенки-границы: ярче по мере приближения, выгибаются, когда в них упираются
  const walls = cw > 0 ? ([[lo, -1], [hi, 1]] as const).map(([b, side]) => {
    const pos = cw / 2 + (b + side * 0.5 - x) * W;
    if (pos < -10 || pos > cw + 10) return null;
    const near = Math.max(0, 1 - Math.abs(b - x) / 2.5);
    const push = side === os ? ov : 0;
    return <span key={side} className={`pz-days-wall${push > 0.05 ? ' is-hit' : ''}`} aria-hidden="true"
      style={{ transform: `translate3d(${pos}px,0,0) scaleY(${0.7 + 0.3 * near + 0.35 * push})`, opacity: 0.15 + 0.55 * near + 0.3 * push,
        borderRadius: push ? (side > 0 ? '0 999px 999px 0' : '999px 0 0 999px') : undefined, width: 3 + 3 * push }} />;
  }) : null;

  return (
    <div ref={view} className={`pz-days-v pz-days-v--${kind}${compact ? ' is-compact' : ''}`} tabIndex={disabled ? -1 : 0} role="slider" aria-label={ariaLabel}
      style={kind === 'day' ? undefined : { '--cw': `${W - 10}px` } as CSSProperties}
      aria-valuenow={s.target} aria-valuemin={lo} aria-valuemax={hi} aria-valuetext={valueText(s.target)} aria-disabled={disabled || undefined}
      onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp} onKeyDown={onKey}>
      <div ref={track} className="pz-days-tr">
        <span className="pz-days-card" aria-hidden="true" style={{ transform: cardT, borderRadius: cardR }} />
        {walls}
        {cells}
      </div>
    </div>
  );
}

/* ───────── Барабан ─────────
   Вертикальное колесо по кругу, как в iOS: строки заворачиваются в 3D, в центре — полоса выбора; инерция и пружина те же, что у ленты. */
const ROW = 34;
interface DrumProps { count: number; value: number; onCommit: (i: number) => void; format: (i: number) => string; spec: ParzMotionSpec; ariaLabel: string; disabled: boolean; onJelly?: (j: number) => void }
function Drum({ count, value, onCommit, format, spec, ariaLabel, disabled, onJelly }: DrumProps) {
  // j — «желе» полосы выбора: тянется за скоростью барабана и покачивается, когда он встаёт
  const st = useRef({ x: value, v: 0, target: value, raf: 0, last: 0, drag: false, moveAt: 0, j: 0, jv: 0 });
  const [, tick] = useState(0);
  const redraw = () => tick(n => (n + 1) & 0xffff);
  const el = useRef<HTMLDivElement>(null);
  const mod = (i: number) => ((Math.round(i) % count) + count) % count;
  const stop = () => { cancelAnimationFrame(st.current.raf); st.current.raf = 0; };
  const run = useCallback(() => {
    const s = st.current;
    if (reduced()) { if (!s.drag) { stop(); s.x = s.target; s.v = 0; } s.j = s.jv = 0; redraw(); return; }
    if (s.raf) return;
    s.last = performance.now();
    const jk = spec.stiffness * 1.3, jc = spec.damping * 0.45;
    const step = (t: number) => {
      const dt = Math.min((t - s.last) / 1000, 1 / 30); s.last = t;
      if (s.drag && t - s.moveAt > 40) s.v *= Math.exp(-dt * 14);
      for (let k = 0; k < 2; k++) {
        const h = dt / 2;
        if (!s.drag) { const a = -spec.stiffness * 1.2 * (s.x - s.target) - spec.damping * 1.15 * s.v; s.v += a * h; s.x += s.v * h; }
        const T = Math.max(-1, Math.min(1, s.v / 10)) * spec.squish;
        const ja = -jk * (s.j - T) - jc * s.jv; s.jv += ja * h; s.j += s.jv * h;
      }
      const restX = !s.drag && Math.abs(s.x - s.target) < 0.002 && Math.abs(s.v) < 0.02;
      if (restX) { s.x = s.target; s.v = 0; }
      if (restX && Math.abs(s.j) < 0.002 && Math.abs(s.jv) < 0.02) { s.j = s.jv = 0; s.raf = 0; redraw(); return; }
      redraw(); s.raf = requestAnimationFrame(step);
    };
    s.raf = requestAnimationFrame(step);
  }, [spec]);
  useEffect(() => stop, []);
  // значение снаружи: едем к ближайшему такому же индексу по кругу
  useEffect(() => {
    const s = st.current; if (mod(s.target) === value) return;
    let d = value - mod(s.target); if (d > count / 2) d -= count; if (d < -count / 2) d += count;
    s.target = Math.round(s.target) + d; run();
  }, [value, count, run]);
  const commit = (i: number) => { st.current.target = i; run(); if (mod(i) !== value) onCommit(mod(i)); };

  const drag = useRef<{ y0: number; p0: number; moved: boolean; hit: number | null; hist: [number, number][] } | null>(null);
  const onDown = (e: RPointerEvent<HTMLDivElement>) => {
    if (disabled || (e.pointerType === 'mouse' && e.button !== 0)) return;
    const c = (e.target as HTMLElement).closest('[data-i]');
    st.current.drag = true; st.current.moveAt = performance.now(); run();
    drag.current = { y0: e.clientY, p0: st.current.x, moved: false, hit: c ? Number(c.getAttribute('data-i')) : null, hist: [[performance.now(), st.current.x]] };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onMove = (e: RPointerEvent<HTMLDivElement>) => {
    const d = drag.current; if (!d) return;
    const dy = e.clientY - d.y0;
    if (!d.moved && Math.abs(dy) < 4) return;
    d.moved = true;
    const s = st.current, now = performance.now();
    s.moveAt = now; s.x = d.p0 - dy / ROW;
    d.hist.push([now, s.x]); while (d.hist.length > 2 && now - d.hist[0][0] > 90) d.hist.shift();
    const [t0, x0] = d.hist[0]; s.v = now - t0 > 0 ? (s.x - x0) / ((now - t0) / 1000) : 0;
    redraw();
  };
  const onUp = () => {
    const d = drag.current; if (!d) return; drag.current = null;
    const s = st.current; s.drag = false;
    if (!d.moved) { if (d.hit !== null) commit(d.hit); else run(); return; }
    if (performance.now() - d.hist[d.hist.length - 1][0] > 80) s.v = 0;
    const v = Math.max(-30, Math.min(30, s.v)); s.v = v;
    commit(Math.round(s.x + v * 0.2));
  };
  // колесо мыши и тачпад: внутри маленького окна вертикальная прокрутка крутит барабан
  const wt = useRef(0);
  const late = useRef<() => void>(() => {});
  useEffect(() => () => clearTimeout(wt.current), []);
  useEffect(() => {
    const node = el.current; if (!node) return;
    const wheel = (e: WheelEvent) => {
      if (disabled) return;
      e.preventDefault();
      const s = st.current, now = performance.now();
      // одно деление колеса мыши — примерно одна строка; тачпад даёт мелкие шаги и крутит плавно
      const step = Math.max(-1.2, Math.min(1.2, e.deltaY / ROW / 2.4));
      const dt = Math.max(0.008, Math.min(0.1, (now - s.moveAt) / 1000));
      const inst = s.drag ? step / dt : step * 30;
      s.v = Math.max(-25, Math.min(25, s.v * 0.4 + inst * 0.6));
      s.drag = true; s.moveAt = now;
      s.x += step; run();
      late.current = () => { s.drag = false; commit(Math.round(s.x)); };
      clearTimeout(wt.current); wt.current = window.setTimeout(() => late.current(), 120);
    };
    node.addEventListener('wheel', wheel, { passive: false });
    return () => node.removeEventListener('wheel', wheel);
  });
  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const k = e.key, cur = st.current.target;
    const n = k === 'ArrowDown' ? cur + 1 : k === 'ArrowUp' ? cur - 1 : k === 'PageDown' ? cur + 5 : k === 'PageUp' ? cur - 5 : null;
    if (n === null || disabled) return;
    e.preventDefault(); commit(n);
  };

  const s = st.current, x = s.x, c0 = Math.round(x), rows = [];
  useLayoutEffect(() => { onJelly?.(s.j); });
  for (let i = c0 - 3; i <= c0 + 3; i++) {
    const d = i - x, ad = Math.abs(d);
    if (ad > 3) continue;
    // строки уходят по цилиндру: поворот, сдвиг в глубину и затухание к краям
    const ang = Math.max(-80, Math.min(80, d * 22));
    rows.push(<div key={i} data-i={i} className={`pz-days-dr-r${ad < 0.5 ? ' is-on' : ''}`} aria-hidden="true"
      style={{ transform: `translateY(${d * ROW * (1 - ad * 0.06)}px) rotateX(${-ang}deg)`, opacity: Math.max(0, 1 - ad * 0.3) }}>{format(mod(i))}</div>);
  }
  return (
    <div ref={el} className="pz-days-dr" tabIndex={disabled ? -1 : 0} role="spinbutton" aria-label={ariaLabel} aria-valuenow={mod(s.target)} aria-valuetext={format(mod(s.target))}
      aria-valuemin={0} aria-valuemax={count - 1} onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp} onKeyDown={onKey}>{rows}</div>
  );
}

/* ───────── Parz Days ───────── */
export function ParzDays({
  value, defaultValue, onChange, name, min, max, isDisabled, disabledDates, marks, locale, weekday = 'narrow', showMonth = false, picker, pickerYear = true, showTime = false, minuteStep = 5, todayLabel,
  size = 'md', theme = 'light', motion, cardColor, color, weekdayColor, markColor, highlightToday = true, todayColor, highlightSunday = true, sundayColor, highlightCurrent = true, currentColor, ariaLabel, disabled = false, id, className, style
}: ParzDaysProps) {
  const spec = useParzMotion(motion);
  const today = toIdx(new Date());
  const [inner, setInner] = useState(() => toIdx(defaultValue ?? new Date()));
  const valIdx = value ? toIdx(value) : inner;
  const sLo = sysMin(), sHi = sysMax();
  const rawLo = min ? toIdx(min) : sLo, rawHi = max ? toIdx(max) : sHi;
  const lo = Math.min(sHi, Math.max(sLo, rawLo)), hi = Math.max(lo, Math.min(sHi, Math.max(sLo, rawHi)));
  if (!warned && (rawLo < sLo || rawHi > sHi) && typeof console !== 'undefined') {
    warned = true;
    console.warn(`Parz Days: min/max limited to ${PARZ_DAYS_MIN_YEAR}-01-01 … ${new Date().getFullYear() + PARZ_DAYS_MAX_YEARS_AHEAD}-12-31.`);
  }
  const G = GEO[size];
  const root = useRef<HTMLDivElement>(null);

  const offKey = disabledDates?.map(toIdx).sort((a, b) => a - b).join(',') ?? '';
  const offSet = useMemo(() => new Set(offKey ? offKey.split(',').map(Number) : []), [offKey]);
  const ok = useCallback((i: number) => i >= lo && i <= hi && !offSet.has(i) && !isDisabled?.(fromIdx(i)), [lo, hi, isDisabled, offSet]);
  const nearest = useCallback((i: number, dir = 1) => {
    i = Math.min(hi, Math.max(lo, i));
    if (ok(i)) return i;
    const s = dir < 0 ? -1 : 1;
    for (let n = 1; n < 400; n++) { if (ok(i + s * n)) return i + s * n; if (ok(i - s * n)) return i - s * n; }
    return i;
  }, [lo, hi, ok]);

  // время в минутах от полуночи; шаг — minuteStep
  const stepM = Math.max(1, Math.min(30, Math.round(minuteStep)));
  const snapM = (m: number) => (Math.round(m / stepM) * stepM) % 1440;
  const [innerT, setInnerT] = useState(() => {
    const d = value ?? defaultValue;
    if (d) return snapM(d.getHours() * 60 + d.getMinutes());
    const n = new Date(); return (Math.ceil((n.getHours() * 60 + n.getMinutes()) / stepM) * stepM) % 1440;
  });
  const tMin = value && showTime ? snapM(value.getHours() * 60 + value.getMinutes()) : innerT;
  const withTime = (i: number, t: number) => { const d = fromIdx(i); if (showTime) d.setHours(Math.floor(t / 60), t % 60, 0, 0); return d; };
  const isoOf = (d: Date) => showTime ? `${toISODate(d)}T${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}` : toISODate(d);
  const emit = (i: number, t: number) => { const d = withTime(i, t); onChange?.(d, isoOf(d)); };
  const setDay = (i: number) => {
    if (i === valIdx) return;
    if (!value) setInner(i);
    emit(i, tMin);
  };
  const setTime = (t: number) => {
    if (t === tMin) return;
    if (!value || !showTime) setInnerT(t);
    emit(valIdx, t);
  };
  // границы поменялись и текущий день стал недоступен — переезжаем на ближайший
  useEffect(() => { const n = nearest(valIdx); if (n !== valIdx) setDay(n); }, [lo, hi, isDisabled, offSet]); // eslint-disable-line react-hooks/exhaustive-deps

  // переход на месяц: число сохраняется (обрезается по длине месяца); если день недоступен — ближайший доступный в этом же месяце
  const goMonth = (y: number, m: number) => {
    const cur = fromIdx(valIdx);
    const dd = Math.min(cur.getDate(), new Date(y, m + 1, 0).getDate());
    const first = toIdx(new Date(y, m, 1)), last = toIdx(new Date(y, m + 1, 0));
    let n = nearest(toIdx(new Date(y, m, dd)));
    if (n < first || n > last) { for (let i = Math.max(first, lo); i <= Math.min(last, hi); i++) if (ok(i)) { n = i; break; } }
    setDay(n);
  };

  const cur = fromIdx(valIdx);
  const yLo = fromIdx(lo).getFullYear(), yHi = fromIdx(hi).getFullYear();
  const mLo = yLo * 12 + fromIdx(lo).getMonth(), mHi = yHi * 12 + fromIdx(hi).getMonth();
  const curY = cur.getFullYear(), curMi = curY * 12 + cur.getMonth();

  // ── выбор месяца и года
  const [open, setOpen] = useState(false);
  type Level = 'year' | 'month' | 'day';
  const [level, setLevel] = useState<Level>('day');
  const adv = useRef(0);
  // после выбора уровень сжимается, и фокус переходит ниже — с паузой, чтобы можно было докрутить
  const advance = (to: Level) => { clearTimeout(adv.current); adv.current = window.setTimeout(() => setLevel(to), reduced() ? 0 : 650); };
  useEffect(() => () => clearTimeout(adv.current), []);
  const [tOpen, setTOpen] = useState(false);
  useEffect(() => {
    if (!tOpen) return;
    const key = (e: globalThis.KeyboardEvent) => { if (e.key === 'Escape') { setTOpen(false); (root.current?.querySelector('.pz-days-tbtn') as HTMLElement | null)?.focus(); } };
    const down = (e: PointerEvent) => { if (!root.current?.querySelector('.pz-days-tgrp')?.contains(e.target as Node)) setTOpen(false); };
    document.addEventListener('keydown', key); document.addEventListener('pointerdown', down);
    return () => { document.removeEventListener('keydown', key); document.removeEventListener('pointerdown', down); };
  }, [tOpen]);
  const toggle = () => {
    setTOpen(false);
    if (open) { setOpen(false); setLevel('day'); clearTimeout(adv.current); return; }
    setOpen(true);
    if (picker === 'wheels') setLevel(pickerYear ? 'year' : 'month');
    else setPk({ y: curY, dir: 1, draft: String(curY), bad: false });
  };
  // компактное окно: закрывается кликом мимо и Escape
  const [pk, setPk] = useState({ y: curY, dir: 1, draft: String(curY), bad: false });
  useEffect(() => {
    if (!open) return;
    const key = (e: globalThis.KeyboardEvent) => { if (e.key === 'Escape') { setOpen(false); setLevel('day'); (root.current?.querySelector('.pz-days-mbtn') as HTMLElement | null)?.focus(); } };
    const down = (e: PointerEvent) => { if (picker === 'compact' && !root.current?.querySelector('.pz-days-h')?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('keydown', key); document.addEventListener('pointerdown', down);
    return () => { document.removeEventListener('keydown', key); document.removeEventListener('pointerdown', down); };
  }, [open, picker]);
  // поле года: цифры; верный год применяется сразу при 4 цифрах, неверный — лёгкая встряска и возврат
  const applyYear = (raw: string) => {
    const y = Number(raw);
    if (raw.length === 4 && y >= yLo && y <= yHi) { setPk(p => ({ y, dir: y >= p.y ? 1 : -1, draft: raw, bad: false })); return true; }
    return false;
  };
  const yearInput = (raw: string) => {
    const v = raw.replace(/\D/g, '').slice(0, 4);
    if (!applyYear(v)) setPk(p => ({ ...p, draft: v, bad: v.length === 4 }));
  };
  const yearDone = () => { if (!applyYear(pk.draft)) setPk(p => ({ ...p, draft: String(p.y), bad: false })); };
  const monthOk = (y: number, m: number) => toIdx(new Date(y, m + 1, 0)) >= lo && toIdx(new Date(y, m, 1)) <= hi;

  const fmtW = useMemo(() => new Intl.DateTimeFormat(locale, { weekday }), [locale, weekday]);
  const fmtMl = useMemo(() => new Intl.DateTimeFormat(locale, { month: 'long' }), [locale]);
  const fmtMs = useMemo(() => new Intl.DateTimeFormat(locale, { month: 'short' }), [locale]);
  const fmtFull = useMemo(() => new Intl.DateTimeFormat(locale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }), [locale]);
  // «ноябрь 2026» — без «г.», который добавляет русский Intl
  const monthYear = (d: Date) => { const m = fmtMl.format(d); return `${m.charAt(0).toLocaleUpperCase(locale)}${m.slice(1)} ${d.getFullYear()}`; };
  const short = (d: Date) => fmtMs.format(d).replace('.', '');

  // месяц над лентой перекатывается вверх или вниз — в сторону движения
  const mKey = curMi;
  const prevM = useRef(mKey); const mDir = useRef(1);
  if (prevM.current !== mKey) { mDir.current = mKey > prevM.current ? 1 : -1; prevM.current = mKey; }
  const showToday = !!todayLabel && valIdx !== today && ok(today);
  const hasMonth = showMonth || !!picker;
  const wheels = picker === 'wheels';

  const vars: Record<string, string> = {};
  if (cardColor) vars['--pz-days-card'] = cardColor;
  if (color) vars['--pz-days-fg'] = color;
  if (weekdayColor) vars['--pz-days-wd'] = weekdayColor;
  if (markColor) vars['--pz-days-mark'] = markColor;
  if (todayColor) vars['--pz-days-now'] = todayColor;
  if (sundayColor) vars['--pz-days-sun'] = sundayColor;
  if (currentColor) vars['--pz-days-cur'] = currentColor;
  const nowD = new Date(), nowMi = nowD.getFullYear() * 12 + nowD.getMonth();

  // полоса выбора времени — жидкая: тянется по вертикали в сторону прокрутки, чуть сужается, отстаёт и покачивается
  const band = useRef<HTMLSpanElement>(null);
  const jl = useRef([0, 0]);
  const jelly = (k: number, j: number) => {
    jl.current[k] = j;
    const el = band.current; if (!el) return;
    const v = Math.max(-1.4, Math.min(1.4, jl.current[0] + jl.current[1])), a = Math.abs(v);
    el.style.transform = `translateY(${-v * 5}px) scale(${1 - 0.05 * a},${1 + 0.42 * a})`;
    el.style.borderRadius = `${10 + 8 * a}px`;
  };
  const hh = String(Math.floor(tMin / 60)).padStart(2, '0'), mm = String(tMin % 60).padStart(2, '0');
  const timeGroup = showTime && (
    <span className="pz-days-tgrp">
      <button type="button" className="pz-days-mbtn pz-days-tbtn" aria-expanded={tOpen} aria-haspopup="dialog" disabled={disabled}
        onClick={() => { if (!tOpen && wheels) { setOpen(false); setLevel('day'); } else if (!tOpen) setOpen(false); setTOpen(v => !v); }}>
        <span className="pz-days-m pz-days-tm">{hh}:{mm}</span>
        <svg className="pz-days-chev" viewBox="0 0 10 6" aria-hidden="true"><path d="M1 1l4 4 4-4" /></svg>
      </button>
      <div role="dialog" aria-label={`${hh}:${mm}`} className={`pz-days-pk pz-days-tp${tOpen ? ' is-open' : ''}`} {...(tOpen ? {} : { inert: '' }) as object}>
        <span ref={band} className="pz-days-band" aria-hidden="true" />
        <Drum count={24} value={Math.floor(tMin / 60)} onJelly={j => jelly(0, j)} onCommit={h => setTime(h * 60 + (tMin % 60))} format={i => String(i).padStart(2, '0')} spec={spec} ariaLabel="hours" disabled={disabled} />
        <span className="pz-days-colon" aria-hidden="true">:</span>
        <Drum count={60 / stepM | 0 || 1} value={Math.floor((tMin % 60) / stepM)} onJelly={j => jelly(1, j)} onCommit={k => setTime(Math.floor(tMin / 60) * 60 + k * stepM)} format={i => String(i * stepM).padStart(2, '0')} spec={spec} ariaLabel="minutes" disabled={disabled} />
      </div>
    </span>
  );
  const label = <span className="pz-days-m"><span key={mKey} className={mDir.current > 0 ? 'pz-days-roll-up' : 'pz-days-roll-down'}>{monthYear(cur)}</span></span>;
  const dayWheel = (
    <Wheel kind="day" value={valIdx} lo={lo} hi={hi} ok={ok} onCommit={setDay} W={G.d} spec={spec} disabled={disabled} page={7} home={() => today}
      ariaLabel={ariaLabel} valueText={i => fmtFull.format(fromIdx(i))} compact={wheels && open && level !== 'day'} onActivate={open ? () => setLevel('day') : undefined}
      cell={i => {
        const date = fromIdx(i), mk = marks?.(date);
        return {
          cls: `${i === today && highlightToday ? 'is-today' : ''}${highlightSunday && date.getDay() === 0 ? ' is-sun' : ''}`,
          node: <>
            <span className="pz-days-w">{fmtW.format(date)}</span>
            <span className="pz-days-n">{date.getDate()}</span>
            <span className="pz-days-dot" style={mk ? { opacity: 1, transform: 'none', ...(typeof mk === 'string' ? { background: mk } : null) } : undefined} />
          </>
        };
      }} />
  );

  return (
    <div ref={root} id={id} className={['pz-days', `pz-days--${size}`, `pz-days--${theme}`, open && 'is-open', disabled && 'is-disabled', className].filter(Boolean).join(' ')} style={{ ...vars, ...style } as CSSProperties}>
      {(hasMonth || todayLabel || showTime) && (
        <div className={`pz-days-h${open ? ' is-open' : ''}`}>
          {picker ? (
            <button type="button" className="pz-days-mbtn" aria-expanded={open} aria-haspopup={picker === 'compact' ? 'dialog' : undefined} disabled={disabled} onClick={toggle}>
              {label}
              <svg className="pz-days-chev" viewBox="0 0 10 6" aria-hidden="true"><path d="M1 1l4 4 4-4" /></svg>
            </button>
          ) : hasMonth ? <span aria-hidden="true">{label}</span> : null}
          {timeGroup}
          {todayLabel && <button type="button" className={`pz-days-today${showToday ? ' is-shown' : ''}`} tabIndex={showToday ? 0 : -1} aria-hidden={!showToday}
            disabled={disabled} onClick={() => setDay(nearest(today))}>{todayLabel}</button>}

          {picker === 'compact' && (
            <div role="dialog" aria-label={monthYear(cur)} className={`pz-days-pk${open ? ' is-open' : ''}`} {...(open ? {} : { inert: '' }) as object}>
              <div className="pz-days-pk-y">
                {pickerYear
                  ? <input className={`pz-days-yi${pk.bad ? ' is-bad' : ''}`} inputMode="numeric" enterKeyHint="done" maxLength={4} value={pk.draft} aria-label={`${yLo}–${yHi}`}
                      onChange={e => yearInput(e.target.value)} onBlur={yearDone} onFocus={e => e.target.select()}
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); yearDone(); } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') { e.preventDefault(); const y = Math.min(yHi, Math.max(yLo, pk.y + (e.key === 'ArrowUp' ? 1 : -1))); setPk({ y, dir: e.key === 'ArrowUp' ? 1 : -1, draft: String(y), bad: false }); } }} />
                  : <span className="pz-days-pk-yv">{pk.y}</span>}
              </div>
              <div className="pz-days-pk-g" key={pk.y}>
                {Array.from({ length: 12 }, (_, m) => {
                  const on = curY === pk.y && cur.getMonth() === m;
                  return <button key={m} type="button" style={{ '--i': m } as CSSProperties} className={`pz-days-pk-m${on ? ' is-on' : ''}${highlightCurrent && !on && pk.y * 12 + m === nowMi ? ' is-cur' : ''}`} aria-pressed={on}
                    disabled={!monthOk(pk.y, m)} onClick={() => { goMonth(pk.y, m); setOpen(false); }}>{short(new Date(pk.y, m, 1))}</button>;
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {wheels ? (
        <div className={`pz-days-stack lv-${open ? level : 'closed'}`}>
          {/* годы и месяцы выезжают над лентой дней; пока закрыто — свёрнуты и недоступны */}
          <div className="pz-days-more" {...(open ? {} : { inert: '' }) as object}>
            <div className="pz-days-more-in">
              {pickerYear && (
                <Wheel kind="year" value={curY} lo={yLo} hi={yHi} ok={y => y >= yLo && y <= yHi} W={G.y} spec={spec} disabled={disabled} page={10} home={() => new Date().getFullYear()}
                  ariaLabel={String(curY)} valueText={String} compact={level !== 'year'} onActivate={() => setLevel('year')}
                  onCommit={y => { goMonth(y, cur.getMonth()); advance('month'); }}
                  cell={y => ({ cls: highlightCurrent && y === nowD.getFullYear() ? 'is-cur' : '', node: <span className="pz-days-n pz-days-n--y">{y}</span> })} />
              )}
              <Wheel kind="month" value={curMi} lo={mLo} hi={mHi} ok={mi => monthOk(Math.floor(mi / 12), mi % 12)} W={G.m} spec={spec} disabled={disabled} page={12}
                ariaLabel={monthYear(cur)} valueText={mi => monthYear(new Date(Math.floor(mi / 12), mi % 12, 1))} compact={level !== 'month'} onActivate={() => setLevel('month')}
                onCommit={mi => { goMonth(Math.floor(mi / 12), mi % 12); advance('day'); }}
                cell={mi => {
                  const d = new Date(Math.floor(mi / 12), mi % 12, 1);
                  return { cls: highlightCurrent && mi === nowMi ? 'is-cur' : '', node: <><span className="pz-days-w">{d.getFullYear()}</span><span className="pz-days-n pz-days-n--m">{short(d)}</span></> };
                }} />
            </div>
          </div>
          {dayWheel}
        </div>
      ) : dayWheel}
      {name && <input type="hidden" name={name} value={isoOf(withTime(valIdx, tMin))} disabled={disabled} />}
    </div>
  );
}
