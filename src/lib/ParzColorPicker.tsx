import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type KeyboardEvent as RKeyboardEvent, type PointerEvent as RPointerEvent } from 'react';
import { createPortal } from 'react-dom';
import { ParzTabs } from './ParzTabs';
import { parzSpringCss, useParzMotion, type ParzMotionPreset, type ParzMotionSpec } from './ParzProvider';
import './ParzColorPicker.css';

export type ParzColorFormat = 'hex' | 'rgb' | 'hsl';
export type ParzColorPickerTheme = 'dark' | 'light';
/** Цвет во всех видах сразу: строка в нужном формате и числа. */
export interface ParzColorValue { hex: string; rgb: { r: number; g: number; b: number; a: number }; hsl: { h: number; s: number; l: number; a: number }; hsv: { h: number; s: number; v: number; a: number }; css: string }

/** Parz UI · Parz Color Picker — выбор цвета: жидкий бегунок в поле цвета, оттенок, прозрачность, ввод HEX / RGB / HSL, образцы и пипетка. */
export interface ParzColorPickerProps {
  /** Цвет (управляемый режим): '#7a5cff', '#7a5cff80', 'rgb(…)', 'rgba(…)', 'hsl(…)'. */
  value?: string;
  /** Начальный цвет (неуправляемый режим). По умолчанию '#7a5cff'. */
  defaultValue?: string;
  /** Каждое изменение: строка в текущем формате и цвет во всех видах. */
  onChange?: (value: string, color: ParzColorValue) => void;
  /** Когда отпустили бегунок или подтвердили ввод — удобно для сохранения. */
  onChangeEnd?: (value: string, color: ParzColorValue) => void;
  /** Ползунок прозрачности. По умолчанию true. */
  alpha?: boolean;
  /** Формат строки в onChange и в поле ввода. По умолчанию 'hex'. */
  format?: ParzColorFormat;
  /** Смена формата в поле ввода. */
  onFormatChange?: (f: ParzColorFormat) => void;
  /** Поле ввода с переключателем формата. По умолчанию true. */
  showInput?: boolean;
  /** Готовые цвета. По умолчанию набор Parz; [] — без образцов. */
  swatches?: string[];
  /** Пипетка (где браузер её поддерживает). По умолчанию true. */
  eyeDropper?: boolean;
  /** 'inline' — прямо на странице; 'popover' — кружок-образец, по нажатию всплывает окно. По умолчанию 'inline'. */
  mode?: 'inline' | 'popover';
  /** Подпись рядом с кружком в режиме popover. */
  label?: string;
  /** По умолчанию 'dark'. */
  theme?: ParzColorPickerTheme;
  /** Пресет движения. По умолчанию из ParzProvider. */
  motion?: ParzMotionPreset;
  /** Имя поля формы: цвет уйдёт с формой строкой в текущем формате. */
  name?: string;
  /** Имя для экранных дикторов. */
  ariaLabel?: string;
  /** Подписи. */
  labels?: Partial<ParzColorPickerLabels>;
  disabled?: boolean;
  className?: string;
  style?: CSSProperties;
}
export interface ParzColorPickerLabels { area: string; hue: string; alpha: string; eyeDropper: string; input: string; swatch: string; open: string }
const LABELS: ParzColorPickerLabels = { area: 'Saturation and brightness', hue: 'Hue', alpha: 'Opacity', eyeDropper: 'Pick a color from the screen', input: 'Color value', swatch: 'Color {c}', open: 'Choose color' };

export const PARZ_COLOR_SWATCHES = ['#ff453a', '#ff9f0a', '#ffd60a', '#34d27b', '#13c2c2', '#4d9bff', '#7a5cff', '#d64fc8', '#ff6b9a', '#f4f4f6', '#8b8b96', '#16161b'];

/* ---------- цвет ---------- */
type HSVA = { h: number; s: number; v: number; a: number };
const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const r1 = (x: number, d = 0) => { const k = 10 ** d; return Math.round(x * k) / k; };
function hsvToRgb({ h, s, v }: HSVA) {
  const f = (n: number) => { const k = (n + h / 60) % 6; return v - v * s * Math.max(0, Math.min(k, 4 - k, 1)); };
  return { r: f(5) * 255, g: f(3) * 255, b: f(1) * 255 };
}
function rgbToHsv(r: number, g: number, b: number) {
  r /= 255; g /= 255; b /= 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
  let h = 0;
  if (d) h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return { h: (h * 60 + 360) % 360, s: mx ? d / mx : 0, v: mx };
}
function hslToHsv(h: number, s: number, l: number) { const v = l + s * Math.min(l, 1 - l); return { h, s: v ? 2 * (1 - l / v) : 0, v }; }
function hsvToHsl({ h, s, v }: HSVA) { const l = v * (1 - s / 2); return { h, s: l === 0 || l === 1 ? 0 : (v - l) / Math.min(l, 1 - l), l }; }
const hex2 = (x: number) => Math.round(clamp(x, 0, 255)).toString(16).padStart(2, '0');

/** Разбор строки цвета; null — не цвет. */
export function parseColor(input: string): HSVA | null {
  const s = input.trim().toLowerCase();
  let m = /^#?([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/.exec(s);
  if (m) {
    let x = m[1];
    if (x.length <= 4) x = x.split('').map(c => c + c).join('');
    const n = (i: number) => parseInt(x.slice(i, i + 2), 16);
    return { ...rgbToHsv(n(0), n(2), n(4)), a: x.length === 8 ? n(6) / 255 : 1 };
  }
  const num = (t: string, max: number) => (t.endsWith('%') ? (parseFloat(t) / 100) * max : parseFloat(t));
  m = /^rgba?\(\s*([^)]+)\)$/.exec(s);
  if (m) {
    const p = m[1].split(/[\s,/]+/).filter(Boolean);
    if (p.length < 3) return null;
    const [r, g, b] = p.slice(0, 3).map(t => num(t, 255));
    const a = p[3] != null ? num(p[3], 1) : 1;
    if ([r, g, b, a].some(Number.isNaN)) return null;
    return { ...rgbToHsv(clamp(r, 0, 255), clamp(g, 0, 255), clamp(b, 0, 255)), a: clamp(a) };
  }
  m = /^hsla?\(\s*([^)]+)\)$/.exec(s);
  if (m) {
    const p = m[1].split(/[\s,/]+/).filter(Boolean);
    if (p.length < 3) return null;
    const h = parseFloat(p[0]), sat = parseFloat(p[1]) / 100, l = parseFloat(p[2]) / 100, a = p[3] != null ? num(p[3], 1) : 1;
    if ([h, sat, l, a].some(Number.isNaN)) return null;
    return { ...hslToHsv(((h % 360) + 360) % 360, clamp(sat), clamp(l)), a: clamp(a) };
  }
  return null;
}
function toValue(c: HSVA): ParzColorValue {
  const { r, g, b } = hsvToRgb(c);
  const hsl = hsvToHsl(c), a = r1(c.a, 2);
  const hex = `#${hex2(r)}${hex2(g)}${hex2(b)}${a < 1 ? hex2(a * 255) : ''}`;
  return {
    hex, rgb: { r: Math.round(r), g: Math.round(g), b: Math.round(b), a }, hsl: { h: Math.round(hsl.h), s: Math.round(hsl.s * 100), l: Math.round(hsl.l * 100), a },
    hsv: { h: c.h, s: c.s, v: c.v, a: c.a }, css: a < 1 ? `rgb(${Math.round(r)} ${Math.round(g)} ${Math.round(b)} / ${a})` : hex
  };
}
function fmt(v: ParzColorValue, f: ParzColorFormat) {
  if (f === 'hex') return v.hex;
  if (f === 'rgb') return v.rgb.a < 1 ? `rgba(${v.rgb.r}, ${v.rgb.g}, ${v.rgb.b}, ${v.rgb.a})` : `rgb(${v.rgb.r}, ${v.rgb.g}, ${v.rgb.b})`;
  return v.hsl.a < 1 ? `hsla(${v.hsl.h}, ${v.hsl.s}%, ${v.hsl.l}%, ${v.hsl.a})` : `hsl(${v.hsl.h}, ${v.hsl.s}%, ${v.hsl.l}%)`;
}
const same = (a: HSVA, b: HSVA) => toValue(a).hex === toValue(b).hex;
const reduced = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- жидкий бегунок: пружина к цели, на скорости вытягивается по направлению движения ---------- */
function useLiquidThumb(spec: ParzMotionSpec) {
  const el = useRef<HTMLSpanElement>(null);
  const st = useRef({ x: 0, y: 0, vx: 0, vy: 0, tx: 0, ty: 0, drag: false, raf: 0, last: 0, init: false });
  const specRef = useRef(spec); specRef.current = spec;
  const paint = () => {
    const s = st.current, e = el.current;
    if (!e) return;
    const sp = Math.hypot(s.vx, s.vy), amt = Math.min(0.32, sp / 2600) * specRef.current.squish;
    const ang = Math.atan2(s.vy, s.vx) * 180 / Math.PI;
    e.style.transform = `translate(${s.x}px, ${s.y}px) translate(-50%, -50%) rotate(${ang}deg) scale(${1 + amt}, ${1 - amt * 0.7}) rotate(${-ang}deg)`;
  };
  const tick = (t: number) => {
    const s = st.current, sp = specRef.current;
    const dt = Math.min(0.032, s.last ? (t - s.last) / 1000 : 0.016); s.last = t;
    const steps = 4, h = dt / steps;
    // во время перетаскивания пружина жёстче — бегунок почти под пальцем, но без рывков
    const k = s.drag ? sp.stiffness * 6 : sp.stiffness, c = s.drag ? sp.damping * 2.45 : sp.damping;
    for (let i = 0; i < steps; i++) {
      s.vx += (-k * (s.x - s.tx) - c * s.vx) * h; s.vy += (-k * (s.y - s.ty) - c * s.vy) * h;
      s.x += s.vx * h; s.y += s.vy * h;
    }
    paint();
    if (!s.drag && Math.abs(s.x - s.tx) < 0.05 && Math.abs(s.y - s.ty) < 0.05 && Math.hypot(s.vx, s.vy) < 2) {
      s.x = s.tx; s.y = s.ty; s.vx = s.vy = 0; s.raf = 0; s.last = 0; paint(); return;
    }
    s.raf = requestAnimationFrame(tick);
  };
  const to = (x: number, y: number, jump = false) => {
    const s = st.current;
    s.tx = x; s.ty = y;
    if (jump || !s.init || reduced()) { s.init = true; s.x = x; s.y = y; s.vx = s.vy = 0; paint(); return; }
    if (!s.raf) { s.last = 0; s.raf = requestAnimationFrame(tick); }
  };
  const drag = (on: boolean) => { st.current.drag = on; if (!st.current.raf && st.current.init) { st.current.last = 0; st.current.raf = requestAnimationFrame(tick); } };
  useEffect(() => () => cancelAnimationFrame(st.current.raf), []);
  return { el, to, drag };
}

/** Поле или полоса с бегунком: тянуть, нажимать, стрелками с клавиатуры. */
function Track({ kind, value, y, onMove, onEnd, spec, label, valueText, style, disabled }: {
  kind: 'area' | 'bar'; value: number; y?: number; onMove: (x: number, y: number) => void; onEnd: () => void; spec: ParzMotionSpec;
  label: string; valueText: string; style?: CSSProperties; disabled?: boolean;
}) {
  const box = useRef<HTMLDivElement>(null);
  const th = useLiquidThumb(spec);
  const size = useRef({ w: 0, h: 0 });
  const dragging = useRef(false);
  const place = (jump = false) => {
    const { w, h } = size.current;
    th.to(value * w, kind === 'area' ? (1 - (y ?? 0)) * h : h / 2, jump);
  };
  useLayoutEffect(() => {
    const b = box.current; if (!b) return;
    const ro = new ResizeObserver(() => { size.current = { w: b.clientWidth, h: b.clientHeight }; place(true); });
    ro.observe(b);
    return () => ro.disconnect();
  }, []);
  useLayoutEffect(() => { place(); }, [value, y]);
  const at = (e: { clientX: number; clientY: number }) => {
    const r = box.current!.getBoundingClientRect();
    onMove(clamp((e.clientX - r.left) / r.width), clamp(1 - (e.clientY - r.top) / r.height));
  };
  const down = (e: RPointerEvent<HTMLDivElement>) => {
    if (disabled || e.button !== 0) return;
    e.preventDefault();
    box.current!.focus({ preventScroll: true });
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* захват недоступен — тянем и без него */ }
    dragging.current = true; th.drag(true); at(e);
  };
  const move = (e: RPointerEvent<HTMLDivElement>) => { if (dragging.current) at(e); };
  const up = (e: RPointerEvent<HTMLDivElement>) => {
    if (!dragging.current) return;
    dragging.current = false;
    try { e.currentTarget.releasePointerCapture(e.pointerId); } catch { /* уже отпущен */ }
    th.drag(false); onEnd();
  };
  const key = (e: RKeyboardEvent<HTMLDivElement>) => {
    const step = e.shiftKey ? 0.1 : 0.01;
    const d: Record<string, [number, number]> = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: kind === 'area' ? [0, step] : [step, 0], ArrowDown: kind === 'area' ? [0, -step] : [-step, 0] };
    if (e.key === 'Home') { e.preventDefault(); onMove(0, y ?? 0); onEnd(); return; }
    if (e.key === 'End') { e.preventDefault(); onMove(1, y ?? 0); onEnd(); return; }
    const m = d[e.key]; if (!m) return;
    e.preventDefault(); onMove(clamp(value + m[0]), clamp((y ?? 0) + m[1])); onEnd();
  };
  return (
    <div ref={box} className={`pz-cp-${kind}`} style={style} tabIndex={disabled ? -1 : 0} role="slider" aria-label={label} aria-valuetext={valueText}
      aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(value * 100)} aria-disabled={disabled || undefined}
      onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} onKeyDown={key}>
      <span ref={th.el} className="pz-cp-th" />
    </div>
  );
}

const Dropper = () => (
  <svg viewBox="0.33 -1.08 24 24" aria-hidden="true"><path d="M14.6 4.6a2.6 2.6 0 0 1 3.7 3.7l-1.6 1.6.9.9-1.5 1.5-.9-.9-6.6 6.6H5.6v-3l6.6-6.6-.9-.9 1.5-1.5.9.9z" /></svg>
);

export function ParzColorPicker(p: ParzColorPickerProps) {
  const spec = useParzMotion(p.motion);
  const { easing, ms } = parzSpringCss(spec);
  const L = { ...LABELS, ...p.labels };
  const theme = p.theme ?? 'dark', alphaOn = p.alpha !== false;
  const swatches = p.swatches ?? PARZ_COLOR_SWATCHES;

  const [fmtOwn, setFmtOwn] = useState<ParzColorFormat>(p.format ?? 'hex');
  useEffect(() => { if (p.format) setFmtOwn(p.format); }, [p.format]);
  const format = fmtOwn;

  const [c, setC] = useState<HSVA>(() => parseColor(p.value ?? p.defaultValue ?? '#7a5cff') ?? { h: 255, s: 0.64, v: 1, a: 1 });
  // управляемый режим: новое value снаружи — но оттенок не сбрасываем, если цвет тот же (у серого и чёрного оттенок не определён)
  useEffect(() => {
    if (p.value == null) return;
    const n = parseColor(p.value);
    if (n && !same(n, c)) setC(x => ({ ...n, h: n.s === 0 || n.v === 0 ? x.h : n.h }));
  }, [p.value]);
  const cv = toValue(c);
  const emit = (n: HSVA, end = false) => {
    const nn = alphaOn ? n : { ...n, a: 1 };
    setC(nn);
    const v = toValue(nn);
    p.onChange?.(fmt(v, format), v);
    if (end) p.onChangeEnd?.(fmt(v, format), v);
  };
  const end = () => { p.onChangeEnd?.(fmt(cv, format), cv); };

  // поле ввода
  const [draft, setDraft] = useState<string | null>(null);
  const [bad, setBad] = useState(0);
  const commit = () => {
    if (draft == null) return;
    const n = parseColor(draft);
    if (n) emit({ ...n, h: n.s === 0 || n.v === 0 ? c.h : n.h, a: alphaOn ? n.a : 1 }, true); else setBad(b => b + 1);
    setDraft(null);
  };

  const hasDropper = p.eyeDropper !== false && typeof window !== 'undefined' && 'EyeDropper' in window;
  const pickScreen = async () => {
    try {
      const E = (window as unknown as { EyeDropper: new () => { open: () => Promise<{ sRGBHex: string }> } }).EyeDropper;
      const r = await new E().open();
      const n = parseColor(r.sRGBHex);
      if (n) emit({ ...n, a: c.a }, true);
    } catch { /* отменили */ }
  };

  const pure = toValue({ h: c.h, s: 1, v: 1, a: 1 }).hex;
  const solid = toValue({ ...c, a: 1 }).hex;
  const vars = { '--pz-cp-ease': easing, '--pz-cp-dur': `${ms}ms`, '--pz-cp-c': cv.css, '--pz-cp-solid': solid } as CSSProperties;
  const swOn = (s: string) => { const n = parseColor(s); return !!n && toValue(n).hex === cv.hex; };

  const panel = (
    <div className={['pz-cp', `pz-cp--${theme}`, p.disabled && 'is-disabled', p.mode !== 'popover' && p.className].filter(Boolean).join(' ')}
      style={{ ...vars, ...(p.mode !== 'popover' ? p.style : null) }} role="group" aria-label={p.ariaLabel}>
      <Track kind="area" value={c.s} y={c.v} spec={spec} label={L.area} valueText={`${Math.round(c.s * 100)}%, ${Math.round(c.v * 100)}%`} disabled={p.disabled}
        style={{ '--pz-cp-pure': pure } as CSSProperties} onMove={(x, y) => emit({ ...c, s: x, v: y })} onEnd={end} />
      <div className="pz-cp-row">
        <span className="pz-cp-prev" aria-hidden="true"><i /></span>
        <div className="pz-cp-bars">
          <Track kind="bar" value={c.h / 360} spec={spec} label={L.hue} valueText={`${Math.round(c.h)}°`} disabled={p.disabled}
            style={{ background: 'linear-gradient(90deg,#f00,#ff0 17%,#0f0 33%,#0ff 50%,#00f 67%,#f0f 83%,#f00)' }} onMove={x => emit({ ...c, h: Math.min(359.9, x * 360) })} onEnd={end} />
          {alphaOn && <Track kind="bar" value={c.a} spec={spec} label={L.alpha} valueText={`${Math.round(c.a * 100)}%`} disabled={p.disabled}
            style={{ '--pz-cp-to': solid } as CSSProperties} onMove={x => emit({ ...c, a: r1(x, 2) })} onEnd={end} />}
        </div>
        {hasDropper && <button type="button" className="pz-cp-ico" aria-label={L.eyeDropper} title={L.eyeDropper} onClick={pickScreen} disabled={p.disabled}><Dropper /></button>}
      </div>
      {p.showInput !== false && (
        <div className="pz-cp-in">
          <ParzTabs size="sm" ariaLabel={L.input} value={format} disabled={p.disabled}
            {...(theme === 'light' ? { background: '#e6e7ec', color: '#6b6b75', activeColor: '#111114', className: 'pz-cp-tabs--light' } : {})}
            onChange={f => { setFmtOwn(f); p.onFormatChange?.(f); }}
            options={[{ value: 'hex', label: 'HEX' }, { value: 'rgb', label: 'RGB' }, { value: 'hsl', label: 'HSL' }]} />
          <input key={bad} className={`pz-cp-txt${bad ? ' is-bad' : ''}`} spellCheck={false} autoComplete="off" aria-label={L.input} disabled={p.disabled}
            value={draft ?? fmt(cv, format)} onChange={e => setDraft(e.target.value)} onFocus={e => e.target.select()} onBlur={commit}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); commit(); } if (e.key === 'Escape') setDraft(null); }} />
        </div>
      )}
      {swatches.length > 0 && (
        <div className="pz-cp-sw">
          {swatches.map((s, i) => (
            <button key={s + i} type="button" className={`pz-cp-s${swOn(s) ? ' is-on' : ''}`} style={{ '--pz-cp-s': s, '--i': i } as CSSProperties}
              aria-label={L.swatch.split('{c}').join(s)} aria-pressed={swOn(s)} disabled={p.disabled}
              onClick={() => { const n = parseColor(s); if (n) emit({ ...n, h: n.s === 0 || n.v === 0 ? c.h : n.h, a: alphaOn ? n.a : 1 }, true); }} />
          ))}
        </div>
      )}
      {p.name && <input type="hidden" name={p.name} value={fmt(cv, format)} />}
    </div>
  );

  // ---------- всплывающий режим ----------
  const [open, setOpen] = useState(false);
  const trig = useRef<HTMLButtonElement>(null), pop = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ x: number; y: number; ox: number; up: boolean } | null>(null);
  useLayoutEffect(() => {
    if (!open) return;
    const place = () => {
      const a = trig.current?.getBoundingClientRect(), el = pop.current;
      if (!a || !el) return;
      const w = el.offsetWidth, h = el.offsetHeight, vw = document.documentElement.clientWidth, vh = window.innerHeight, m = 8, gap = 10;
      const cx = a.left + a.width / 2, x = Math.min(Math.max(cx, m + w / 2), vw - m - w / 2);
      const up = a.bottom + gap + h > vh - m && a.top - gap - h > m;
      setPos({ x, y: up ? a.top - gap - h : a.bottom + gap, ox: cx - (x - w / 2), up });
    };
    place();
    window.addEventListener('resize', place); window.addEventListener('scroll', place, true);
    return () => { window.removeEventListener('resize', place); window.removeEventListener('scroll', place, true); };
  }, [open]);
  useEffect(() => {
    if (!open) return;
    const down = (e: PointerEvent) => { const t = e.target as Node; if (!trig.current?.contains(t) && !pop.current?.contains(t)) setOpen(false); };
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') { setOpen(false); trig.current?.focus(); } };
    document.addEventListener('pointerdown', down); document.addEventListener('keydown', key);
    return () => { document.removeEventListener('pointerdown', down); document.removeEventListener('keydown', key); };
  }, [open]);

  // жидкое нажатие кнопки: при нажатии сплющивается, после — пружинит как желе (размах от пресета), от точки касания — капля
  const [pressed, setPressed] = useState(false);
  const [drop, setDrop] = useState<{ k: number; x: number; y: number } | null>(null);
  const dk = useRef(0), at = useRef({ x: 50, y: 50 });
  const jelly = () => {
    const el = trig.current;
    if (!el || reduced()) return;
    const k = ++dk.current, { x, y } = at.current;
    setDrop({ k, x, y });
    window.setTimeout(() => setDrop(d => (d && d.k === k ? null : d)), 700);
    const amp = (v: number) => (1 + (v - 1) * Math.max(0.35, spec.squish)).toFixed(3);
    el.animate([
      { scale: '.94 .88' }, { scale: `${amp(1.06)} ${amp(0.95)}`, offset: 0.3 }, { scale: `${amp(0.98)} ${amp(1.03)}`, offset: 0.52 },
      { scale: `${amp(1.01)} ${amp(0.995)}`, offset: 0.74 }, { scale: '1 1' }
    ], { duration: Math.max(520, Math.min(900, ms)), easing: 'ease-out' });
  };
  const release = () => { if (pressed) { setPressed(false); jelly(); } };

  if (p.mode !== 'popover') return panel;
  return (
    <>
      <button ref={trig} type="button" className={['pz-cp-trig', `pz-cp-trig--${theme}`, open && 'is-open', pressed && 'is-press', p.className].filter(Boolean).join(' ')} style={{ ...vars, ...p.style }}
        aria-haspopup="dialog" aria-expanded={open} aria-label={[p.label ?? L.open, fmt(cv, format)].join(', ')} disabled={p.disabled} onClick={() => setOpen(o => !o)}
        onPointerDown={e => { if (e.button !== 0 || p.disabled) return; const r = e.currentTarget.getBoundingClientRect(); at.current = { x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 }; setPressed(true); }}
        onPointerUp={release} onPointerLeave={release} onPointerCancel={() => setPressed(false)}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { at.current = { x: 50, y: 50 }; jelly(); } }}>
        {drop && <span key={drop.k} className="pz-cp-drop" style={{ left: `${drop.x}%`, top: `${drop.y}%` }} />}
        <span className="pz-cp-dot" aria-hidden="true"><i /></span>
        {p.label && <span className="pz-cp-lbl">{p.label}</span>}
        <span className="pz-cp-code" aria-hidden="true">{fmt(cv, format)}</span>
      </button>
      {typeof document !== 'undefined' && createPortal(
        <div ref={pop} role="dialog" aria-label={p.label ?? L.open} className={`pz-cp-pop${open && pos ? ' is-open' : ''}${pos?.up ? ' is-up' : ''}`}
          style={{ ...vars, '--pz-cp-x': `${pos?.x ?? -9999}px`, '--pz-cp-y': `${pos?.y ?? -9999}px`, '--pz-cp-ox': `${pos?.ox ?? 140}px` } as CSSProperties}
          {...(open ? {} : { inert: '' }) as object}>
          {panel}
        </div>, document.body)}
    </>
  );
}
