import { useId, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent, type ReactNode } from 'react';
import './ParzSlider.css';

export type ParzSliderSize = 'sm' | 'md' | 'lg' | number;
export type ParzSliderMark = number | { value: number; label?: ReactNode };

interface SliderCommon {
  /** Минимум. По умолчанию 0. */
  min?: number;
  /** Максимум. По умолчанию 100. */
  max?: number;
  /** Шаг. По умолчанию 1. */
  step?: number;
  disabled?: boolean;
  /** 'sm' | 'md' | 'lg' или диаметр бегунка в px. По умолчанию 'md' (20 px). */
  size?: ParzSliderSize;
  /** Цвет заполненной части. */
  accent?: string;
  /** Цвет дорожки. */
  trackColor?: string;
  /** Цвет бегунка. */
  thumbColor?: string;
  /** Пузырёк со значением над бегунком: 'auto' — пока тянут или фокус, 'always', 'never'. По умолчанию 'auto'. */
  showValue?: 'auto' | 'always' | 'never';
  /** Метки на дорожке: true — на каждом шаге, или список значений (можно с подписями). */
  marks?: boolean | ParzSliderMark[];
  /** Как показывать число: например v => `${v} ₽`. */
  formatValue?: (v: number) => string;
  /** Подпись над ползунком. */
  label?: ReactNode;
  /** Показывать текущее значение справа от подписи. По умолчанию да, если есть label. */
  showOutput?: boolean;
  /** Имя для форм — значения уходят скрытыми input. */
  name?: string;
  className?: string;
  style?: CSSProperties;
}

/** Parz UI · Parz Slider — ползунок с жидким бегунком. */
export interface ParzSliderProps extends SliderCommon {
  value?: number;
  defaultValue?: number;
  /** Вызывается при каждом движении. */
  onChange?: (value: number) => void;
  /** Вызывается, когда отпустили бегунок или закончили нажатие клавиши. */
  onChangeEnd?: (value: number) => void;
  /** Подпись для экранных дикторов, если нет label. */
  ariaLabel?: string;
}

/** Parz UI · Parz Range — ползунок промежутка: от 2 до 5 бегунков на одной дорожке. */
export interface ParzRangeProps extends SliderCommon {
  /** Значения бегунков по возрастанию: от 2 до 5 штук. */
  value?: number[];
  defaultValue?: number[];
  onChange?: (value: number[]) => void;
  onChangeEnd?: (value: number[]) => void;
  /** Минимальное расстояние между соседними бегунками. По умолчанию 0. */
  minDistance?: number;
  /** Подписи бегунков для экранных дикторов, например ['From', 'To']. */
  ariaLabels?: string[];
  /** Что заливать: 'span' — от первого до последнего бегунка, 'pairs' — пары 1–2, 3–4 (например, «работа — перерыв — работа»). По умолчанию 'span'. */
  fill?: 'span' | 'pairs';
}

const SIZES = { sm: 16, md: 20, lg: 26 };
const decimals = (n: number) => { const s = String(n); const i = s.indexOf('.'); return i < 0 ? 0 : s.length - i - 1; };
/** Число бегунков у Parz Range: не меньше 2 и не больше 5. */
export const RANGE_MIN_THUMBS = 2, RANGE_MAX_THUMBS = 5;

function normalize(vals: number[], min: number, max: number, multi: boolean) {
  let v = vals.slice(0, multi ? RANGE_MAX_THUMBS : 1).map(x => Math.min(max, Math.max(min, x)));
  if (multi) while (v.length < RANGE_MIN_THUMBS) v.push(max);
  return v.sort((a, b) => a - b);
}

type CoreProps = SliderCommon & {
  multi: boolean; vals: number[]; setVals: (v: number[]) => void; end: (v: number[]) => void; minDistance: number; labels: (string | undefined)[]; fill?: 'span' | 'pairs';
};

function Core({ multi, vals, setVals, end, minDistance, labels, min = 0, max = 100, step = 1, disabled = false, size = 'md', accent, trackColor, thumbColor,
  showValue = 'auto', marks, formatValue, label, showOutput, name, className, style, fill = 'span' }: CoreProps) {
  const uid = useId();
  const rail = useRef<HTMLDivElement>(null);
  const thumbs = useRef<(HTMLDivElement | null)[]>([]);
  const [active, setActive] = useState<number | null>(null);
  const [drag, setDrag] = useState(false);
  const d = useRef<{ i: number; pid: number; x: number; t: number; moved: boolean } | null>(null);
  const relax = useRef(0);
  const latest = useRef(vals);
  latest.current = vals;

  const span = max - min || 1;
  const pct = (v: number) => ((v - min) / span) * 100;
  const fmt = (v: number) => (formatValue ? formatValue(v) : String(v));
  const dec = decimals(step);
  const snap = (v: number) => +(Math.round((v - min) / step) * step + min).toFixed(dec);

  const place = (i: number, raw: number) => {
    const cur = latest.current;
    let v = Math.min(max, Math.max(min, snap(raw)));
    if (multi) {
      const lo = i > 0 ? cur[i - 1] + minDistance : min;
      const hi = i < cur.length - 1 ? cur[i + 1] - minDistance : max;
      v = Math.min(hi, Math.max(lo, v));
    }
    if (v === cur[i]) return cur;
    const next = cur.slice(); next[i] = v;
    latest.current = next;
    setVals(next);
    return next;
  };

  const fromX = (x: number) => {
    const r = rail.current!.getBoundingClientRect();
    return min + Math.min(1, Math.max(0, (x - r.left) / r.width)) * span;
  };

  // бегунок тянется по скорости движения и мягко возвращается в круг
  const stretch = (i: number, speed: number) => {
    const el = thumbs.current[i];
    if (!el) return;
    const s = Math.min(0.42, Math.abs(speed) * 0.22);
    el.style.setProperty('--pz-sl-sx', String(1 + s));
    el.style.setProperty('--pz-sl-sy', String(1 - s * 0.55));
    window.clearTimeout(relax.current);
    relax.current = window.setTimeout(() => { el.style.setProperty('--pz-sl-sx', '1'); el.style.setProperty('--pz-sl-sy', '1'); }, 70);
  };

  const down = (e: PointerEvent<HTMLDivElement>) => {
    if (disabled || e.button !== 0) return;
    const v = fromX(e.clientX);
    const cur = latest.current;
    const ti = thumbs.current.findIndex(t => t && t.contains(e.target as Node));
    let i = ti;
    if (i < 0) {
      // ближайший бегунок; если несколько стоят в одной точке — тот, что может уйти в сторону нажатия
      let best = Infinity;
      cur.forEach((x, k) => {
        const dist = Math.abs(x - v);
        if (dist < best || (dist === best && v > x)) { best = dist; i = k; }
      });
    }
    e.preventDefault();
    try { rail.current?.setPointerCapture(e.pointerId); } catch { /* нет захвата */ }
    thumbs.current[i]?.focus({ preventScroll: true });
    setActive(i);
    d.current = { i, pid: e.pointerId, x: e.clientX, t: performance.now(), moved: false };
    if (ti < 0) place(i, v);
  };
  const move = (e: PointerEvent<HTMLDivElement>) => {
    const s = d.current;
    if (!s || s.pid !== e.pointerId) return;
    const now = performance.now();
    if (!s.moved) { if (Math.abs(e.clientX - s.x) < 2) return; s.moved = true; setDrag(true); }
    stretch(s.i, (e.clientX - s.x) / Math.max(1, now - s.t));
    s.x = e.clientX; s.t = now;
    place(s.i, fromX(e.clientX));
  };
  const up = (e: PointerEvent<HTMLDivElement>) => {
    const s = d.current;
    if (!s || s.pid !== e.pointerId) return;
    d.current = null;
    setDrag(false); setActive(null);
    stretch(s.i, 0);
    end(latest.current);
  };

  const key = (i: number) => (e: KeyboardEvent<HTMLDivElement>) => {
    if (disabled) return;
    const big = Math.max(step, Math.round(span / 10 / step) * step);
    const v = latest.current[i];
    const m: Record<string, number> = {
      ArrowRight: v + step, ArrowUp: v + step, ArrowLeft: v - step, ArrowDown: v - step,
      PageUp: v + big, PageDown: v - big, Home: min, End: max
    };
    if (!(e.key in m)) return;
    e.preventDefault();
    end(place(i, m[e.key]));
  };

  const markList: { value: number; label?: ReactNode }[] =
    marks === true ? (span / step <= 60 ? Array.from({ length: Math.round(span / step) + 1 }, (_, k) => ({ value: +(min + k * step).toFixed(dec) })) : [])
      : Array.isArray(marks) ? marks.map(m => (typeof m === 'number' ? { value: m } : m)) : [];
  const hasMarkLabels = markList.some(m => m.label != null);

  const d0 = typeof size === 'number' ? size : SIZES[size];
  const lo = multi ? vals[0] : min, hi = vals[vals.length - 1];
  const segs: [number, number][] = multi && fill === 'pairs'
    ? vals.reduce<[number, number][]>((a, v, i) => (i % 2 && a.push([vals[i - 1], v]), a), [])
    : [[lo, hi]];
  const inFill = (v: number) => segs.some(([a, b]) => v >= a && v <= b);
  const vars = {
    '--pz-sl-d': `${d0}px`, '--pz-sl-h': `${Math.max(3, Math.round(d0 * 0.3))}px`,
    ...(accent && { '--pz-sl-accent': accent }),
    ...(trackColor && { '--pz-sl-track': trackColor }),
    ...(thumbColor && { '--pz-sl-knob': thumbColor }),
    ...style
  } as CSSProperties;
  const cls = ['pz-sl', multi && 'pz-sl--range', drag && 'is-drag', disabled && 'is-disabled', `pz-sl--tip-${showValue}`, hasMarkLabels && 'has-labels', className]
    .filter(Boolean).join(' ');
  const out = showOutput ?? label != null;

  return (
    <div className={cls} style={vars}>
      {(label != null || out) && (
        <div className="pz-sl-head">
          {label != null && <span className="pz-sl-label" id={`${uid}l`}>{label}</span>}
          {out && <output className="pz-sl-out" aria-live="off">{vals.map(fmt).join(' – ')}</output>}
        </div>
      )}
      <div className="pz-sl-rail" ref={rail} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}>
        <div className="pz-sl-track" />
        {segs.map(([a, b], k) => <div key={k} className="pz-sl-fill" style={{ left: `${pct(a)}%`, width: `${pct(b) - pct(a)}%` }} />)}
        {markList.map(m => (
          <span key={m.value} className={`pz-sl-mark${inFill(m.value) ? ' is-in' : ''}`} style={{ left: `${pct(m.value)}%` }}>
            {m.label != null && <span className="pz-sl-mark-l">{m.label}</span>}
          </span>
        ))}
        {vals.map((v, i) => (
          <div key={i} ref={el => { thumbs.current[i] = el; }} className={`pz-sl-thumb${active === i ? ' is-active' : ''}`} style={{ left: `${pct(v)}%`, zIndex: active === i ? 3 : 2 }}
            role="slider" tabIndex={disabled ? -1 : 0} aria-valuemin={min} aria-valuemax={max} aria-valuenow={v} aria-valuetext={fmt(v)}
            aria-label={labels[i]} aria-labelledby={!labels[i] && label != null ? `${uid}l` : undefined} aria-disabled={disabled || undefined}
            aria-orientation="horizontal" onKeyDown={key(i)}>
            <span className="pz-sl-blob" />
            {showValue !== 'never' && <span className="pz-sl-tip">{fmt(v)}</span>}
          </div>
        ))}
      </div>
      {name && vals.map((v, i) => <input key={i} type="hidden" name={name} value={v} />)}
    </div>
  );
}

export function ParzSlider({ value, defaultValue, onChange, onChangeEnd, ariaLabel, ...rest }: ParzSliderProps) {
  const min = rest.min ?? 0, max = rest.max ?? 100;
  const [inner, setInner] = useState(() => defaultValue ?? min);
  const v = normalize([value ?? inner], min, max, false);
  return (
    <Core {...rest} multi={false} vals={v} minDistance={0} labels={[ariaLabel]}
      setVals={n => { if (value === undefined) setInner(n[0]); onChange?.(n[0]); }} end={n => onChangeEnd?.(n[0])} />
  );
}

export function ParzRange({ value, defaultValue, onChange, onChangeEnd, minDistance = 0, ariaLabels = [], fill, ...rest }: ParzRangeProps) {
  const min = rest.min ?? 0, max = rest.max ?? 100;
  const [inner, setInner] = useState(() => defaultValue ?? [min + (max - min) * 0.25, min + (max - min) * 0.75]);
  const v = normalize(value ?? inner, min, max, true);
  return (
    <Core {...rest} multi fill={fill} vals={v} minDistance={minDistance} labels={v.map((_, i) => ariaLabels[i])}
      setVals={n => { if (value === undefined) setInner(n); onChange?.(n); }} end={n => onChangeEnd?.(n)} />
  );
}
