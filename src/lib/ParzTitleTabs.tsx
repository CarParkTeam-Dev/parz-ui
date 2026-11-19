import { createPortal } from 'react-dom';
import { forwardRef, useEffect, useImperativeHandle, useLayoutEffect, useRef, useState, type CSSProperties, type KeyboardEvent as RKeyboardEvent, type PointerEvent as RPointerEvent, type ReactNode, type RefObject } from 'react';
import { Icon, type IconSpec } from './Icon';
import { ParzNumberFlow } from './ParzNumberFlow';
import { parzRubber } from './ParzPager';
import { parzSpringCss, useParzMotion, type ParzMotionPreset } from './ParzProvider';
import './ParzTitleTabs.css';

export type ParzTitleTabsSize = 'md' | 'lg';
export type ParzTitleTabsTheme = 'dark' | 'light';
export interface ParzTitleTabsItem {
  /** Заголовок. */
  label: string;
  /** Число рядом с заголовком (перелистывается как Parz Number Flow). */
  count?: number;
  /** Значок в кружке: 'ms:star', 'mi:folder', эмодзи или свой элемент. */
  icon?: IconSpec;
  /** Цвет пункта: кружок значка и --parz-accent. */
  color?: string;
  /** Цвет значка в кружке. По умолчанию белый. */
  iconColor?: string;
}

/** Parz UI · Parz Title Tabs — полоса крупных заголовков-вкладок: листаются пальцем, цвет и значок перетекают, у края — «потяни, чтобы добавить». */
export interface ParzTitleTabsProps {
  items: ParzTitleTabsItem[];
  /** Выбранный пункт (управляемый режим). */
  index?: number;
  /** Начальный пункт (неуправляемый режим). По умолчанию 0. */
  defaultIndex?: number;
  onIndexChange?: (index: number) => void;
  /** Потянули за первый пункт дальше порога и отпустили. Без него у края — просто сопротивление. */
  onAdd?: () => void;
  /** Подпись кнопки «добавить». По умолчанию 'Add'. */
  addLabel?: string;
  /** Насколько тянуть до срабатывания, в долях пункта. По умолчанию 0.22. */
  addThreshold?: number;
  /** Дробная позиция каждый кадр, пока заголовки тянут или они едут сами (не когда их ведут снаружи) — например, для Parz Pager: ref.setProgress(p). */
  onProgress?: (progress: number) => void;
  /** Куда ещё записывать --parz-accent (например, вся страница), чтобы цвет перетекал и там. */
  accentRef?: RefObject<HTMLElement | null>;
  /** По умолчанию 'lg'. */
  size?: ParzTitleTabsSize;
  /** По умолчанию 'dark'. */
  theme?: ParzTitleTabsTheme;
  /** Пресет движения. По умолчанию из ParzProvider. */
  motion?: ParzMotionPreset;
  /** Список всех пунктов поверх контейнера: открывается нажатием на выбранный заголовок. По умолчанию true. */
  list?: boolean;
  /** Список открыт (управляемый режим). */
  listOpen?: boolean;
  /** Список открыт сразу (неуправляемый режим). */
  defaultListOpen?: boolean;
  onListOpenChange?: (open: boolean) => void;
  /** Что накрывает список. По умолчанию — родитель компонента (если он static, ему на время ставится position: relative). */
  listContainer?: RefObject<HTMLElement | null>;
  /** Пункты перетащили в списке: с места from на место to. Без него кнопки «Порядок» нет. */
  onReorder?: (from: number, to: number) => void;
  /** Кнопка «•••» у пункта в списке. Без него кнопки нет. */
  onItemMore?: (index: number, anchor: HTMLElement) => void;
  /** Свои действия в начале списка (после «Новый» и «Порядок»). */
  listActions?: ParzTitleTabsAction[];
  /** Подписи. */
  labels?: Partial<ParzTitleTabsLabels>;
  /** Имя для экранных дикторов. */
  ariaLabel?: string;
  className?: string;
  style?: CSSProperties;
}
export interface ParzTitleTabsAction { id: string; label: string; icon?: IconSpec; onClick: () => void }
export interface ParzTitleTabsLabels { new: string; reorder: string; done: string; more: string; list: string }
const LABELS: ParzTitleTabsLabels = { new: 'New', reorder: 'Reorder', done: 'Done', more: 'More', list: 'All lists' };

/** Управление снаружи — например, от Parz Pager: заголовки едут за пальцем без перерисовки React. */
export interface ParzTitleTabsHandle {
  /** Дробная позиция: 1.5 — между вторым и третьим; меньше 0 — тянут за первый. */
  setProgress: (progress: number) => void;
  /** Палец отпустили на позиции progress: если потянули за первый дальше порога — сработает onAdd. */
  release: (progress: number) => void;
  /** Открыть список поверх контейнера. */
  openList: () => void;
  /** Закрыть список. */
  closeList: () => void;
}

const reduced = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
const DEFAULT_COLOR = '#8b8b96';

export const ParzTitleTabs = forwardRef<ParzTitleTabsHandle, ParzTitleTabsProps>(function ParzTitleTabs(
  { items, index, defaultIndex = 0, onIndexChange, onProgress, onAdd, addLabel = 'Add', addThreshold = 0.22, accentRef, size = 'lg', theme = 'dark', motion,
    list = true, listOpen, defaultListOpen = false, onListOpenChange, listContainer, onReorder, onItemMore, listActions, labels, ariaLabel, className, style }, ref) {
  const spec = useParzMotion(motion);
  const L = { ...LABELS, ...labels };
  const [openInner, setOpenInner] = useState(defaultListOpen);
  const isOpen = list && (listOpen ?? openInner);
  const setOpen = (o: boolean) => { setOpenInner(o); onListOpenChange?.(o); };
  const n = items.length;
  const [inner, setInner] = useState(defaultIndex);
  const cur = Math.max(0, Math.min(n - 1, index ?? inner));
  const [shownIcon, setShownIcon] = useState(cur);

  const root = useRef<HTMLDivElement>(null);
  const strip = useRef<HTMLDivElement>(null);
  const view = useRef<HTMLDivElement>(null);
  const addEl = useRef<HTMLSpanElement>(null);
  const addInner = useRef<HTMLSpanElement>(null);
  const iconBox = useRef<HTMLSpanElement>(null);
  const tabs = useRef<HTMLButtonElement[]>([]);
  const st = useRef({ p: cur, v: 0, target: cur, mode: 'idle' as 'idle' | 'drag' | 'spring' | 'follow', raf: 0, last: 0, followAt: 0,
    lefts: [] as number[], widths: [] as number[], addW: 0, sx: 0, sxPx: 0, moved: false, samples: [] as { t: number; p: number }[], committed: cur, icon: cur });
  const live = useRef({ items, onIndexChange, onAdd, addThreshold, accentRef, spec, n, onProgress });
  live.current = { items, onIndexChange, onAdd, addThreshold, accentRef, spec, n, onProgress };

  /* геометрия: позиция ↔ пиксели */
  const unit0 = () => (st.current.widths[0] ?? 100) + 8;
  const xAt = (p: number) => {
    const { lefts, widths } = st.current, last = lefts.length - 1;
    if (last < 0) return 0;
    if (p <= 0) return p * unit0();
    if (p >= last) return lefts[last] + (p - last) * (widths[last] + 8);
    const i = Math.floor(p), f = p - i;
    return lefts[i] + f * (lefts[i + 1] - lefts[i]);
  };
  const pAt = (x: number) => {
    const { lefts, widths } = st.current, last = lefts.length - 1;
    if (last < 0 || x <= 0) return x / unit0();
    if (x >= lefts[last]) return last + (x - lefts[last]) / (widths[last] + 8);
    let i = 0; while (i < last && lefts[i + 1] <= x) i++;
    return i + (x - lefts[i]) / (lefts[i + 1] - lefts[i]);
  };

  const colorAt = (p: number) => {
    const its = live.current.items, last = its.length - 1;
    const c = Math.max(0, Math.min(last, p)), i = Math.floor(c), f = c - i;
    const a = its[i]?.color ?? DEFAULT_COLOR, b = its[Math.min(last, i + 1)]?.color ?? DEFAULT_COLOR;
    if (f < 0.002 || a === b) return a;
    if (f > 0.998) return b;
    return `color-mix(in srgb, ${a} ${Math.round((1 - f) * 1000) / 10}%, ${b})`;
  };

  const paint = () => {
    const s = st.current, { addThreshold, accentRef, n } = live.current;
    const p = s.p;
    // тянут за первый: выезжает «добавить», заголовки сдвигаются вправо
    const pull = p < 0 ? -p * unit0() : 0;
    const r = live.current.onAdd ? Math.min(1, -Math.min(0, p) / addThreshold) : 0;
    const frac = Math.abs(Math.max(0, p) - Math.round(Math.max(0, p)));
    view.current?.style.setProperty('--pz-tt-lf', `${Math.round(Math.min(1, frac * 5) * 24)}px`);
    // неактивные — чуть меньше; к активному размеру растут плавно, ровно за позицией (палец, пружина, клик)
    const pc = Math.max(0, Math.min(n - 1, p)), { lefts, widths } = s;
    const sc = widths.map((_, i) => 0.8 + 0.2 * Math.max(0, 1 - Math.abs(pc - i)));
    let acc = 0;
    const pos = widths.map((w, i) => { const x = acc; acc += w * sc[i] + 8; return x; });
    const posAt = (q: number) => {
      const last = pos.length - 1;
      if (last < 0) return 0;
      if (q <= 0) return q * unit0();
      if (q >= last) return pos[last] + (q - last) * (widths[last] * sc[last] + 8);
      const i = Math.floor(q), f = q - i;
      return pos[i] + f * (pos[i + 1] - pos[i]);
    };
    tabs.current.forEach((t, i) => { if (t && lefts[i] != null) t.style.transform = `translate3d(${Math.round((pos[i] - lefts[i]) * 100) / 100}px,0,0) scale(${Math.round(sc[i] * 1000) / 1000})`; });
    if (strip.current) strip.current.style.transform = `translate3d(${-Math.round(posAt(Math.max(0, p)) * 100) / 100}px,0,0)`;
    if (addEl.current) {
      addEl.current.style.width = `${live.current.onAdd ? Math.round(Math.min(1.2, -Math.min(0, p) / addThreshold) * s.addW * 100) / 100 : 0}px`;
      addEl.current.style.opacity = r > 0 ? '1' : '0';
    }
    if (iconBox.current) { iconBox.current.style.setProperty('--pz-tt-pull', String(Math.round(r * 1000) / 1000)); iconBox.current.style.setProperty('--pz-tt-a', String(Math.round(Math.min(1, r / 0.3) * 1000) / 1000)); }
    if (!live.current.onAdd && strip.current && p < 0) strip.current.style.transform = `translate3d(${Math.round(pull * 100) / 100}px,0,0)`;
    tabs.current.forEach((t, i) => { if (t) t.style.opacity = String(Math.round((1 - 0.68 * Math.min(1, Math.abs(Math.max(0, Math.min(n - 1, p)) - i))) * (i === 0 ? 1 - 0.6 * r : 1) * 1000) / 1000); });
    const col = colorAt(p);
    root.current?.style.setProperty('--parz-accent', col);
    accentRef?.current?.style.setProperty('--parz-accent', col);
    const ic = Math.max(0, Math.min(n - 1, Math.round(p)));
    if (ic !== s.icon) { s.icon = ic; setShownIcon(ic); }
    // свой жест или своя пружина — сообщаем наружу; если ведут снаружи — молчим, чтобы не было эха
    if (s.mode === 'drag' || s.mode === 'spring') live.current.onProgress?.(p);
  };
  const commit = (i: number) => {
    const s = st.current;
    if (i === s.committed) return;
    s.committed = i; setInner(i); live.current.onIndexChange?.(i);
  };
  const tick = (t: number) => {
    const s = st.current, sp = live.current.spec;
    const dt = Math.min(0.032, s.last ? (t - s.last) / 1000 : 0.016); s.last = t;
    if (s.mode === 'spring') {
      const steps = 4, h = dt / steps;
      for (let i = 0; i < steps; i++) { s.v += (-sp.stiffness * (s.p - s.target) - sp.damping * s.v) * h; s.p += s.v * h; }
      if (Math.abs(s.p - s.target) < 0.0005 && Math.abs(s.v) < 0.005) { s.p = s.target; s.v = 0; s.mode = 'idle'; }
    }
    paint();
    if (s.mode !== 'spring' && s.mode !== 'drag') { s.raf = 0; s.last = 0; return; }
    s.raf = requestAnimationFrame(tick);
  };
  const run = () => { const s = st.current; if (!s.raf) { s.last = 0; s.raf = requestAnimationFrame(tick); } };
  const go = (i: number, v = 0) => {
    const s = st.current;
    i = Math.max(0, Math.min(live.current.n - 1, i));
    s.target = i; commit(i);
    if (reduced()) { s.p = i; s.v = 0; s.mode = 'idle'; paint(); return; }
    s.v = v; s.mode = 'spring'; run();
  };
  const releaseAt = (p: number) => {
    const { onAdd, addThreshold } = live.current;
    if (onAdd && p <= -addThreshold) onAdd();
  };

  useImperativeHandle(ref, () => ({
    setProgress: (p: number) => {
      const s = st.current;
      if (s.mode === 'drag') return;
      cancelAnimationFrame(s.raf); s.raf = 0;
      s.mode = 'follow'; s.followAt = performance.now(); s.p = p; s.v = 0;
      const i = Math.round(Math.max(0, Math.min(live.current.n - 1, p)));
      if (Math.abs(p - i) < 0.0005) { s.p = i; s.committed = i; s.target = i; s.mode = 'idle'; setInner(i); }
      paint();
    },
    release: releaseAt,
    openList: () => setOpen(true),
    closeList: () => setOpen(false)
  }), [onListOpenChange]);

  /* размеры пунктов */
  const measure = () => {
    const s = st.current;
    s.lefts = tabs.current.slice(0, live.current.n).map(t => t?.offsetLeft ?? 0);
    s.widths = tabs.current.slice(0, live.current.n).map(t => t?.offsetWidth ?? 0);
    s.addW = addInner.current?.offsetWidth ?? 0;
    paint();
  };
  useLayoutEffect(() => {
    measure();
    const ro = new ResizeObserver(measure);
    if (strip.current) ro.observe(strip.current);
    if (addInner.current) ro.observe(addInner.current);
    return () => ro.disconnect();
  }, [n]);
  useLayoutEffect(() => { measure(); }, [items.map(i => `${i.label}|${i.count ?? ''}`).join('\n'), size, addLabel]);
  useEffect(() => () => cancelAnimationFrame(st.current.raf), []);
  // выбор поменяли снаружи — едем, если нас прямо сейчас не ведёт пейджер
  useEffect(() => {
    const s = st.current;
    if (cur === s.committed || s.mode === 'drag') return;
    s.committed = cur;
    if (s.mode === 'follow' || performance.now() - s.followAt < 200) { s.target = cur; return; }
    go(cur, s.v);
  }, [cur]);

  /* свой жест */
  const down = (e: RPointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    const s = st.current;
    s.sx = e.clientX; s.sxPx = xAt(s.p); s.moved = false; s.mode = 'drag'; s.v = 0; s.samples = [{ t: performance.now(), p: s.p }];
    run();
  };
  const move = (e: RPointerEvent<HTMLDivElement>) => {
    const s = st.current;
    if (s.mode !== 'drag') return;
    const dx = e.clientX - s.sx;
    if (!s.moved) {
      if (Math.abs(dx) < 5) return;
      s.moved = true;
      try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* без захвата тоже работает */ }
    }
    let x = s.sxPx - dx;
    const end = xAt(live.current.n - 1);
    if (x < 0 && live.current.onAdd) {
      // «добавить» идёт почти за пальцем (85% хода): ширина = ход пальца; после порога — сопротивление
      const full = Math.max(1, st.current.addW), k = (-x * 0.85) / full;
      s.p = -(k <= 1 ? k : 1 + parzRubber(k - 1, 0.4)) * live.current.addThreshold;
    } else {
      if (x < 0) x = -parzRubber(-x, unit0() * 0.6);
      else if (x > end) x = end + parzRubber(x - end, 80);
      s.p = pAt(x);
    }
    const now = performance.now();
    s.samples.push({ t: now, p: s.p }); while (s.samples.length > 2 && now - s.samples[0].t > 100) s.samples.shift();
  };
  const up = (e: RPointerEvent<HTMLDivElement>) => {
    const s = st.current;
    if (s.mode !== 'drag') return;
    try { e.currentTarget.releasePointerCapture(e.pointerId); } catch { /* уже отпущен */ }
    // нажатие — его обработает кнопка пункта; если лента ещё ехала — пусть доедет, а не замрёт
    if (!s.moved) { s.mode = 'idle'; if (Math.abs(s.p - s.target) > 0.0005) go(Math.round(s.target)); return; }
    releaseAt(s.p);
    const a = s.samples[0], b = s.samples[s.samples.length - 1];
    const v = b.t > a.t && performance.now() - b.t < 80 ? ((b.p - a.p) / (b.t - a.t)) * 1000 : 0;
    const to = Math.round(s.p + Math.max(-1.5, Math.min(1.5, v * 0.18)));
    go(to, Math.max(-6, Math.min(6, v)));
  };

  const key = (e: RKeyboardEvent, i: number) => {
    const m: Record<string, number> = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: n - 1 };
    if (!(e.key in m)) return;
    e.preventDefault();
    const to = Math.max(0, Math.min(n - 1, m[e.key]));
    go(to); tabs.current[to]?.focus();
  };

  const it = items[shownIcon];
  const spring = parzSpringCss(spec);
  const hasIcons = items.some(x => x.icon != null);
  return (
    <div ref={root} className={`pz-tt pz-tt--${size} pz-tt--${theme}${className ? ' ' + className : ''}`}
      style={{ '--pz-tt-ease': spring.easing, '--pz-tt-dur': `${spring.ms}ms`, ...style } as CSSProperties}
      onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}>
      {(hasIcons || onAdd) && (
        <span ref={iconBox} className="pz-tt-icon" aria-hidden="true">
          <span key={shownIcon} className="pz-tt-glyph" style={{ color: it?.iconColor ?? '#fff' }}>{it?.icon != null ? <Icon icon={it.icon} /> : null}</span>
          {onAdd && <svg className="pz-tt-plus" viewBox="0 0 14 14" aria-hidden="true"><path d="M7 1.5v11M1.5 7h11" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>}
        </span>
      )}
      {onAdd && (
        <span ref={addEl} className="pz-tt-add" aria-hidden="true"><span ref={addInner} className="pz-tt-add-in">{addLabel}</span></span>
      )}
      <div ref={view} className="pz-tt-view">
        <div ref={strip} className="pz-tt-strip" role="tablist" aria-label={ariaLabel}>
          {items.map((x, i) => (
            <button key={i} ref={e => { if (e) tabs.current[i] = e; }} type="button" role="tab" aria-selected={i === cur} tabIndex={i === cur ? 0 : -1}
              className={`pz-tt-item${i === cur ? ' is-on' : ''}`} aria-haspopup={list && i === cur ? 'dialog' : undefined}
              onClick={() => { if (st.current.moved) return; if (list && i === cur && Math.abs(st.current.p - i) < 0.01) setOpen(true); else go(i); }} onKeyDown={e => key(e, i)}>
              <span className="pz-tt-label">{x.label}</span>
              {x.count != null && <ParzNumberFlow className="pz-tt-count" value={x.count} motion={motion} />}
            </button>
          ))}
        </div>
      </div>
      {onAdd && <button type="button" className="pz-tt-sr" onClick={onAdd}>{addLabel}</button>}
      {list && <TitleList open={isOpen} onClose={() => { setOpen(false); tabs.current[cur]?.focus({ preventScroll: true }); }} items={items} cur={cur} theme={theme} size={size}
        container={() => listContainer?.current ?? root.current?.parentElement ?? null} labels={L} motion={spring} squish={spec.squish}
        onSelect={i => { go(i); setOpen(false); }} onNew={onAdd ? () => { setOpen(false); onAdd(); } : undefined}
        onReorder={onReorder} onItemMore={onItemMore} actions={listActions} />}
    </div>
  );
});

/* ---------- жидкое нажатие строки: сплющивание → желе → капля от точки касания ---------- */
function liquidPress(e: RPointerEvent<HTMLElement>, squish: number) {
  if (e.pointerType === 'mouse' && e.button !== 0) return;
  const el = e.currentTarget;
  if (reduced()) return;
  const r = el.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
  el.classList.add('is-press');
  const done = () => {
    el.removeEventListener('pointerup', done); el.removeEventListener('pointerleave', done); el.removeEventListener('pointercancel', cancel);
    el.classList.remove('is-press');
    // размах желе — от пресета; строка широкая, поэтому мягче, чем у кнопки
    const a = (v: number) => (1 + (v - 1) * Math.max(0.35, squish)).toFixed(3);
    el.animate([{ scale: '.97 .92' }, { scale: `${a(1.025)} ${a(0.97)}`, offset: 0.3 }, { scale: `${a(0.99)} ${a(1.025)}`, offset: 0.55 }, { scale: `${a(1.005)} ${a(0.995)}`, offset: 0.78 }, { scale: '1 1' }],
      { duration: 560, easing: 'ease-out' });
    const d = document.createElement('span');
    d.className = 'pz-tt-drop'; d.style.left = `${x}px`; d.style.top = `${y}px`;
    el.appendChild(d);
    window.setTimeout(() => d.remove(), 700);
  };
  const cancel = () => { el.classList.remove('is-press'); el.removeEventListener('pointerup', done); el.removeEventListener('pointerleave', done); el.removeEventListener('pointercancel', cancel); };
  el.addEventListener('pointerup', done); el.addEventListener('pointerleave', done); el.addEventListener('pointercancel', cancel);
}

/* ---------- список поверх контейнера ---------- */
function TitleList({ open, onClose, items, cur, theme, size, container, labels, motion, squish, onSelect, onNew, onReorder, onItemMore, actions }: {
  open: boolean; onClose: () => void; items: ParzTitleTabsItem[]; cur: number; theme: ParzTitleTabsTheme; size: ParzTitleTabsSize;
  container: () => HTMLElement | null; labels: ParzTitleTabsLabels; motion: { easing: string; ms: number }; squish: number;
  onSelect: (i: number) => void; onNew?: () => void; onReorder?: (from: number, to: number) => void; onItemMore?: (i: number, a: HTMLElement) => void; actions?: ParzTitleTabsAction[];
}) {
  const [mounted, setMounted] = useState(open);
  const [shown, setShown] = useState(false);
  const [target, setTarget] = useState<HTMLElement | null>(null);
  const [reorder, setReorder] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const rows = useRef<HTMLDivElement[]>([]);
  const drag = useRef<{ from: number; to: number; y0: number; h: number; dy: number } | null>(null);
  const flip = useRef<{ to: number; offset: number } | null>(null);

  // открыть: найти контейнер, смонтировать, на следующем кадре — проявить; закрыть: спрятать и размонтировать
  useLayoutEffect(() => {
    if (open) {
      const t = container();
      if (!t) return;
      const restore = getComputedStyle(t).position === 'static';
      if (restore) t.style.position = 'relative';
      setTarget(t); setMounted(true);
      const id = requestAnimationFrame(() => requestAnimationFrame(() => setShown(true)));
      return () => { cancelAnimationFrame(id); if (restore) window.setTimeout(() => { t.style.position = ''; }, 320); };
    }
    setShown(false); setReorder(false);
    const id = window.setTimeout(() => setMounted(false), reduced() ? 0 : 260);
    return () => window.clearTimeout(id);
  }, [open]);
  useEffect(() => {
    if (!shown) return;
    box.current?.querySelector<HTMLElement>('.pz-tt-row-main[aria-current="true"], .pz-tt-row-main')?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.preventDefault(); onClose(); } };
    document.addEventListener('keydown', onKey);
    const sc = box.current?.querySelector<HTMLElement>('.pz-tt-list-in');
    const fade = () => {
      if (!sc) return;
      const max = sc.scrollHeight - sc.clientHeight, over = max > 4;
      sc.style.setProperty('--pz-tt-ft', over && sc.scrollTop > 2 ? '28px' : '0px');
      sc.style.setProperty('--pz-tt-fb', over && sc.scrollTop < max - 2 ? '28px' : '0px');
      sc.style.overflowY = over ? 'auto' : 'hidden';
    };
    fade();
    sc?.addEventListener('scroll', fade, { passive: true });
    const ro = new ResizeObserver(fade);
    if (sc) { ro.observe(sc); Array.from(sc.children).forEach(c => ro.observe(c)); }
    return () => { document.removeEventListener('keydown', onKey); sc?.removeEventListener('scroll', fade); ro.disconnect(); };
  }, [shown, items.length, reorder]);

  // после перестановки — строка доезжает на своё место (FLIP), без скачка
  useLayoutEffect(() => {
    const f = flip.current; if (!f) return;
    flip.current = null;
    const el = rows.current[f.to]; if (!el) return;
    el.style.transition = 'none'; el.style.transform = `translateY(${f.offset}px)`;
    void el.offsetHeight;
    el.style.transition = ''; el.style.transform = '';
  }, [items.map(i => i.label).join('\n')]);

  /* перетаскивание в режиме «Порядок»: слушаем всё окно — отпускание ловится где угодно, строка не залипает */
  const dDown = (i: number, e: RPointerEvent<HTMLElement>) => {
    if (!reorder || !onReorder || drag.current) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    e.preventDefault();
    const list = rows.current.slice(0, items.length);
    const a = list[0], b = list[1];
    const h = a && b ? b.offsetTop - a.offsetTop : (list[i]?.offsetHeight ?? 48);
    const pid = e.pointerId;
    drag.current = { from: i, to: i, y0: e.clientY, h, dy: 0 };
    list[i]?.classList.add('is-drag');
    const move = (ev: PointerEvent) => {
      if (ev.pointerId !== pid) return;
      // кнопку уже отпустили, а события «вверх» не было — заканчиваем
      if (ev.pointerType === 'mouse' && ev.buttons === 0) { end(); return; }
      const d = drag.current; if (!d) return;
      d.dy = ev.clientY - d.y0;
      d.to = Math.max(0, Math.min(items.length - 1, d.from + Math.round(d.dy / d.h)));
      list.forEach((el, j) => {
        if (!el) return;
        if (j === d.from) { el.style.transform = `translateY(${d.dy}px)`; return; }
        const sh = d.from < j && j <= d.to ? -d.h : d.to <= j && j < d.from ? d.h : 0;
        el.style.transform = sh ? `translateY(${sh}px)` : '';
      });
    };
    const up = (ev: PointerEvent) => { if (ev.pointerId === pid) end(); };
    const end = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
      window.removeEventListener('blur', end);
      const d = drag.current; if (!d) return;
      drag.current = null;
      const el = list[d.from];
      el?.classList.remove('is-drag');
      if (d.to === d.from) { list.forEach(r => { if (r) r.style.transform = ''; }); return; }
      // остальные уже стоят на новых местах — убираем сдвиги без анимации, перетаскиваемую доводим FLIP-ом
      list.forEach(r => { if (r) { r.style.transition = 'none'; r.style.transform = ''; void r.offsetHeight; r.style.transition = ''; } });
      flip.current = { to: d.to, offset: d.dy - (d.to - d.from) * d.h };
      onReorder?.(d.from, d.to);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
    window.addEventListener('blur', end);
  };

  if (!mounted || !target) return null;
  const acts: { id: string; label: string; icon: ReactNode; onClick: () => void; on?: boolean }[] = [];
  if (onNew) acts.push({ id: 'new', label: labels.new, icon: <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M8 2v12M2 8h12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>, onClick: onNew });
  if (onReorder) acts.push({ id: 'reorder', label: reorder ? labels.done : labels.reorder, on: reorder, icon: <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M5 13V3M5 3 2.5 5.5M5 3l2.5 2.5M11 3v10m0 0-2.5-2.5M11 13l2.5-2.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>, onClick: () => setReorder(r => !r) });
  (actions ?? []).forEach(a => acts.push({ id: a.id, label: a.label, icon: a.icon != null ? <Icon icon={a.icon} /> : null, onClick: () => { a.onClick(); onClose(); } }));
  let k = 0;
  return createPortal(
    <div ref={box} className={`pz-tt-list pz-tt-list--${theme} pz-tt-list--${size}${shown ? ' is-open' : ''}${reorder ? ' is-reorder' : ''}`}
      style={{ '--pz-tt-ease': motion.easing, '--pz-tt-dur': `${motion.ms}ms` } as CSSProperties} role="dialog" aria-label={labels.list}
      onPointerDown={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="pz-tt-list-in" onPointerDown={e => { if (e.target === e.currentTarget) onClose(); }}>
        {acts.map(a => (
          <div key={a.id} className={`pz-tt-row pz-tt-row--act${a.on ? ' is-on' : ''}`} style={{ '--i': k++ } as CSSProperties}>
            <button type="button" className="pz-tt-row-main" onPointerDown={e => liquidPress(e, squish)} onClick={a.onClick}>
              <span className="pz-tt-row-ic pz-tt-row-ic--act">{a.icon}</span><span className="pz-tt-row-l">{a.label}</span>
            </button>
          </div>
        ))}
        {acts.length > 0 && <span className="pz-tt-list-gap" />}
        {items.map((x, i) => (
          <div key={i} ref={el => { if (el) rows.current[i] = el; }} className={`pz-tt-row${i === cur ? ' is-cur' : ''}`} style={{ '--i': k++ } as CSSProperties}>
            <button type="button" className="pz-tt-row-main" aria-current={i === cur || undefined}
              onClick={() => { if (!reorder) onSelect(i); }} onPointerDown={e => { if (reorder) dDown(i, e); else liquidPress(e, squish); }}>
              <span className="pz-tt-row-ic" style={{ background: x.color ?? DEFAULT_COLOR, color: x.iconColor ?? '#fff' }}>{x.icon != null ? <Icon icon={x.icon} /> : null}</span>
              <span className="pz-tt-row-l">{x.label}</span>
              {x.count != null && <span className="pz-tt-row-n">{x.count}</span>}
            </button>
            {reorder && onReorder ? (
              <span className="pz-tt-grip" aria-hidden="true"><svg width="18" height="18" viewBox="0 0 18 18"><path d="M3 6h12M3 12h12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg></span>
            ) : onItemMore ? (
              <button type="button" className="pz-tt-more" aria-label={`${labels.more}: ${x.label}`} onClick={e => onItemMore(i, e.currentTarget)}>
                <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true"><circle cx="4" cy="10" r="2" /><circle cx="10" cy="10" r="2" /><circle cx="16" cy="10" r="2" /></svg>
              </button>
            ) : null}
          </div>
        ))}
      </div>
    </div>,
    target
  );
}

