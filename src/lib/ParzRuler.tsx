import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent as RKeyboardEvent, type PointerEvent as RPointerEvent } from 'react';
import { ParzNumberFlow } from './ParzNumberFlow';
import { useParzMotion, type ParzMotionPreset } from './ParzProvider';
import './ParzRuler.css';

export type ParzRulerTheme = 'dark' | 'light';

/** Parz UI · Parz Ruler — шкала с засечками под неподвижным указателем: тянется пальцем, едет по инерции и пружинит на ближайшую засечку. */
export interface ParzRulerProps {
  /** Значение (управляемый режим). */
  value?: number;
  /** Начальное значение (неуправляемый режим). По умолчанию min. */
  defaultValue?: number;
  /** Каждое новое значение — и пока шкала едет. */
  onChange?: (value: number) => void;
  /** Когда шкала остановилась. */
  onChangeEnd?: (value: number) => void;
  /** По умолчанию 0. */
  min?: number;
  /** По умолчанию 100. */
  max?: number;
  /** Шаг: одна засечка. По умолчанию 1. */
  step?: number;
  /** Расстояние между засечками, px (целое). По умолчанию 16. */
  tickGap?: number;
  /** Каждая N-я засечка длиннее. По умолчанию 0 — все одинаковые. */
  majorEvery?: number;
  /** Короткие засечки-украшения между шагами (на них не встать). По умолчанию 0, с labels — 3. */
  minorTicks?: number;
  /** Значения, на которые шкала не встаёт: список или проверка. Шкала проедет к ближайшему разрешённому. */
  exclude?: number[] | ((value: number) => boolean);
  /** Текстовая шкала: каждая длинная засечка — своё имя, значение — номер имени (0, 1, 2…). min / max / step тогда не нужны. */
  labels?: string[];
  /** Число над шкалой (Parz Number Flow). По умолчанию true. */
  showValue?: boolean;
  /** Как показать значение: число → строка. */
  formatValue?: (value: number) => string;
  /** Цвет указателя. По умолчанию '#ff453a'. */
  accent?: string;
  /** По умолчанию 'dark'. */
  theme?: ParzRulerTheme;
  /** Пресет движения. По умолчанию из ParzProvider. */
  motion?: ParzMotionPreset;
  /** Имя поля формы. */
  name?: string;
  /** Имя для экранных дикторов. */
  ariaLabel?: string;
  disabled?: boolean;
  className?: string;
  style?: CSSProperties;
}

const reduced = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
const decimals = (n: number) => { const s = String(n); const i = s.indexOf('.'); return i < 0 ? 0 : s.length - i - 1; };

const H_LONG = 32, H_MID = 24, H_SHORT = 12;

export function ParzRuler({ value, defaultValue, onChange, onChangeEnd, min: min0 = 0, max: max0 = 100, step: step0 = 1, tickGap, majorEvery = 0, minorTicks, exclude, labels,
  showValue = true, formatValue, accent = '#ff453a', theme = 'dark', motion, name, ariaLabel, disabled, className, style }: ParzRulerProps) {
  const spec = useParzMotion(motion);
  const isText = !!labels?.length;
  const min = isText ? 0 : min0, max = isText ? labels!.length - 1 : max0, step = isText ? 1 : step0;
  const minor = Math.max(0, Math.round(minorTicks ?? (isText ? 3 : 0)));
  const gap = Math.max(4, Math.round(tickGap ?? (isText ? 48 : minor ? 24 : 16)));
  const fmt = formatValue ?? (isText ? (v: number) => labels![v] ?? '' : undefined);
  const dec = decimals(step);
  const count = Math.max(0, Math.round((max - min) / step));
  const snap = (v: number) => Math.min(max, Math.max(min, Number((min + Math.round((v - min) / step) * step).toFixed(dec))));
  const toPx = (v: number) => ((v - min) / step) * gap;
  const fromPx = (p: number) => min + (p / gap) * step;

  const isOff = (i: number) => {
    if (!exclude) return false;
    const v = Number((min + i * step).toFixed(dec));
    return Array.isArray(exclude) ? exclude.some(x => Math.abs(x - v) < step / 1000) : exclude(v);
  };
  /** Ближайший разрешённый шаг; pref — куда искать сначала. */
  const okIdx = (i: number, pref: 1 | -1 = 1) => {
    i = Math.min(count, Math.max(0, Math.round(i)));
    if (!isOff(i)) return i;
    for (let d = 1; d <= count; d++) {
      const a = i + d * pref, b = i - d * pref;
      if (a >= 0 && a <= count && !isOff(a)) return a;
      if (b >= 0 && b <= count && !isOff(b)) return b;
    }
    return i;
  };
  const okVal = (v: number) => Number((min + okIdx((snap(v) - min) / step) * step).toFixed(dec));
  const [inner, setInner] = useState(() => okVal(value ?? defaultValue ?? min));
  const cur = value != null ? okVal(value) : inner;

  const track = useRef<HTMLDivElement>(null);
  const strips = useRef<HTMLDivElement[]>([]);
  const ind = useRef<HTMLSpanElement>(null);
  const st = useRef({ pos: toPx(cur), vel: 0, target: toPx(cur), mode: 'idle' as 'idle' | 'drag' | 'spring', raf: 0, last: 0, cx: 0, w: 0,
    sx: 0, spos: 0, moved: false, samples: [] as { t: number; p: number }[], emitted: cur, wheelT: 0, ext: false });
  const props = useRef({ onChange, onChangeEnd, spec, gap, count, min, step, okIdx });
  props.current = { onChange, onChangeEnd, spec, gap, count, min, step, okIdx };

  const emit = (v: number) => {
    const s = st.current;
    if (v === s.emitted) return;
    s.emitted = v; setInner(v);
    // едем к значению, пришедшему снаружи, — не отправляем его обратно
    if (!s.ext) props.current.onChange?.(v);
  };

  /* отрисовка без React: двигаем полосы засечек и тянем указатель от скорости */
  const paint = () => {
    const s = st.current, { gap, count } = props.current;
    const off = s.cx - s.pos; // где на экране засечка min
    // засечка шириной 2px стоит центром на своей точке
    const left = Math.max(0, off - 1), right = Math.min(s.w, off + count * gap + 1);
    for (const el of strips.current) {
      if (!el) continue;
      el.style.left = `${left}px`;
      el.style.width = `${Math.max(0, right - left)}px`;
      el.style.setProperty('--pz-rl-x', `${off - 1 - left}px`);
    }
    if (ind.current) {
      ind.current.style.left = `${s.cx}px`;
      const amt = s.mode === 'idle' ? 0 : Math.min(0.9, Math.abs(s.vel) / 2400) * props.current.spec.squish;
      ind.current.style.transform = `translateX(-50%) scale(${1 + amt}, ${1 - amt * 0.18})`;
    }
  };
  const valueAt = (p: number) => {
    const { min, step, count } = props.current;
    return Number((min + props.current.okIdx(p / props.current.gap) * step).toFixed(dec));
  };
  const tick = (t: number) => {
    const s = st.current, sp = props.current.spec;
    const dt = Math.min(0.032, s.last ? (t - s.last) / 1000 : 0.016); s.last = t;
    if (s.mode === 'spring') {
      const steps = 4, h = dt / steps;
      for (let i = 0; i < steps; i++) { s.vel += (-sp.stiffness * (s.pos - s.target) - sp.damping * s.vel) * h; s.pos += s.vel * h; }
      emit(valueAt(s.pos));
      if (Math.abs(s.pos - s.target) < 0.05 && Math.abs(s.vel) < 3) {
        s.pos = s.target; s.vel = 0; s.mode = 'idle'; s.raf = 0; s.last = 0;
        const v = valueAt(s.pos); emit(v); paint(); if (!s.ext) props.current.onChangeEnd?.(v); s.ext = false; return;
      }
    }
    else if (s.mode === 'drag') emit(valueAt(s.pos));
    paint();
    if (s.mode === 'idle') { s.raf = 0; s.last = 0; return; }
    s.raf = requestAnimationFrame(tick);
  };
  const run = () => { const s = st.current; if (!s.raf) { s.last = 0; s.raf = requestAnimationFrame(tick); } };
  const springTo = (px: number, vel = st.current.vel) => {
    const s = st.current;
    s.target = px;
    if (reduced()) { s.pos = px; s.vel = 0; s.mode = 'idle'; const v = valueAt(px); emit(v); paint(); if (!s.ext) props.current.onChangeEnd?.(v); s.ext = false; return; }
    s.vel = vel; s.mode = 'spring'; run();
  };

  /* размеры */
  useLayoutEffect(() => {
    const el = track.current; if (!el) return;
    const ro = new ResizeObserver(() => { st.current.w = el.clientWidth; st.current.cx = Math.round(el.clientWidth / 2); paint(); });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  useLayoutEffect(() => { paint(); }, [gap, count, min, step, minor, majorEvery]);
  useEffect(() => () => cancelAnimationFrame(st.current.raf), []);

  /* значение снаружи поменялось — едем к нему пружиной */
  useEffect(() => {
    const s = st.current;
    if (cur === s.emitted || s.mode === 'drag') return;
    s.emitted = cur; s.ext = true;
    springTo(toPx(cur), 0);
  }, [cur]);

  /* перетаскивание */
  const rubber = (p: number) => {
    const end = props.current.count * props.current.gap;
    if (p < 0) return -Math.pow(-p, 0.8) * 0.5;
    if (p > end) return end + Math.pow(p - end, 0.8) * 0.5;
    return p;
  };
  const down = (e: RPointerEvent<HTMLDivElement>) => {
    if (disabled || (e.pointerType === 'mouse' && e.button !== 0)) return;
    const s = st.current;
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* без захвата тоже работает */ }
    s.ext = false; s.mode = 'drag'; s.vel = 0; s.sx = e.clientX; s.spos = s.pos; s.moved = false; s.samples = [{ t: performance.now(), p: s.pos }];
    run();
  };
  const move = (e: RPointerEvent<HTMLDivElement>) => {
    const s = st.current;
    if (s.mode !== 'drag') return;
    const dx = e.clientX - s.sx;
    if (Math.abs(dx) > 3) s.moved = true;
    const raw = s.spos - dx, end = props.current.count * props.current.gap;
    s.pos = rubber(raw);
    const now = performance.now();
    s.samples.push({ t: now, p: s.pos }); while (s.samples.length > 2 && now - s.samples[0].t > 90) s.samples.shift();
    const a = s.samples[0], b = s.samples[s.samples.length - 1];
    s.vel = b.t > a.t ? ((b.p - a.p) / (b.t - a.t)) * 1000 : 0;
  };
  const up = (e: RPointerEvent<HTMLDivElement>) => {
    const s = st.current;
    if (s.mode !== 'drag') return;
    try { e.currentTarget.releasePointerCapture(e.pointerId); } catch { /* уже отпущен */ }
    const end = props.current.count * props.current.gap;
    if (!s.moved) {
      // нажатие по шкале — едем к этой засечке
      const r = track.current!.getBoundingClientRect();
      const p = s.pos + (e.clientX - r.left - s.cx);
      s.vel = 0;
      springTo(props.current.okIdx(p / props.current.gap) * props.current.gap, 0);
      return;
    }
    if (performance.now() - s.samples[s.samples.length - 1].t > 80) s.vel = 0;
    const v = Math.max(-4000, Math.min(4000, s.vel));
    const projected = s.pos + v * 0.22;
    springTo(props.current.okIdx(projected / props.current.gap, v < 0 ? -1 : 1) * props.current.gap, v * 0.6);
  };

  /* колесо и тачпад */
  const onWheel = (e: WheelEvent) => {
    if (disabled) return;
    const d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    if (!d) return;
    e.preventDefault();
    const s = st.current, end = props.current.count * props.current.gap;
    s.ext = false; s.mode = 'drag'; run();
    s.pos = Math.min(end, Math.max(0, s.pos + d * 0.6)); s.vel = d * 20;
    emit(valueAt(s.pos));
    window.clearTimeout(s.wheelT);
    s.wheelT = window.setTimeout(() => springTo(props.current.okIdx(s.pos / props.current.gap) * props.current.gap, 0), 120);
  };
  useEffect(() => {
    const el = track.current; if (!el) return;
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  });

  const key = (e: RKeyboardEvent) => {
    if (disabled) return;
    const big = Math.max(1, Math.round(count / 10));
    const map: Record<string, number> = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1, PageUp: big, PageDown: -big };
    // если шкала ещё едет — считаем от цели, чтобы быстрые нажатия складывались
    const ci = st.current.mode === 'spring' && !st.current.ext ? Math.round(st.current.target / gap) : Math.round((cur - min) / step);
    let ni: number | null = null;
    if (e.key in map) {
      const d = map[e.key] * (e.shiftKey ? 10 : 1), dir: 1 | -1 = d > 0 ? 1 : -1;
      ni = Math.min(count, Math.max(0, ci + d));
      while (ni >= 0 && ni <= count && isOff(ni)) ni += dir; // через исключённые — дальше
      if (ni < 0 || ni > count) ni = okIdx(ci + d, dir === 1 ? -1 : 1);
    } else if (e.key === 'Home') ni = okIdx(0); else if (e.key === 'End') ni = okIdx(count, -1);
    if (ni == null) return;
    e.preventDefault();
    st.current.ext = false;
    springTo(ni * gap, st.current.mode === 'spring' ? st.current.vel : 0);
  };

  const [shown, setShown] = useState(cur);
  const shownAt = useRef(0);
  useEffect(() => {
    if (shown === cur) return;
    const wait = 110 - (performance.now() - shownAt.current);
    const go = () => { shownAt.current = performance.now(); setShown(cur); };
    if (wait <= 0) { go(); return; }
    const id = window.setTimeout(go, wait);
    return () => window.clearTimeout(id);
  }, [cur, shown]);
  const prev = useRef(shown);
  const flowDir = shown < prev.current ? 'down' : 'up';
  useEffect(() => { prev.current = shown; }, [shown]);
  const shownText = fmt ? fmt(shown) : String(shown);
  const text = fmt ? fmt(cur) : String(cur);

  /* рисунок засечек на один период: под длинной нет короткой, короткие — только в промежутках */
  const ticksBg = useMemo(() => {
    const major = majorEvery > 1 ? majorEvery : 1, P = gap * major;
    const stepH = isText ? H_LONG : H_MID;
    const groups = new Map<number, number[]>();
    const put = (h: number, x: number) => { const arr = groups.get(h) ?? []; arr.push(Math.round(x)); groups.set(h, arr); };
    for (let k = 0; k < major; k++) {
      put(major > 1 && k === 0 ? H_LONG : stepH, k * gap);
      for (let j = 1; j <= minor; j++) put(H_SHORT, k * gap + (j * gap) / (minor + 1));
    }
    const imgs: string[] = [], sizes: string[] = [], pos: string[] = [];
    groups.forEach((xs, h) => {
      const stops = ['transparent 0'];
      for (const x of xs.sort((a, b) => a - b)) stops.push(`transparent ${x}px`, `var(--pz-rl-c) ${x}px`, `var(--pz-rl-c) ${x + 2}px`, `transparent ${x + 2}px`);
      imgs.push(`linear-gradient(90deg, ${stops.join(', ')})`); sizes.push(`${P}px ${h}px`); pos.push('var(--pz-rl-x, 0px) 50%');
    });
    return { backgroundImage: imgs.join(', '), backgroundSize: sizes.join(', '), backgroundPosition: pos.join(', ') } as CSSProperties;
  }, [gap, majorEvery, minor, isText]);
  const vars = { '--pz-rl-accent': accent, '--pz-rl-gap': `${gap}px` } as CSSProperties;
  return (
    <div className={`pz-rl pz-rl--${theme}${isText ? ' is-text' : ''}${disabled ? ' is-disabled' : ''}${className ? ' ' + className : ''}`} style={{ ...vars, ...style }}>
      {showValue && <ParzNumberFlow className="pz-rl-value" value={shownText} direction={isText ? 'auto' : flowDir} motion={motion} />}
      <div ref={track} className="pz-rl-track" role="slider" tabIndex={disabled ? -1 : 0} aria-label={ariaLabel} aria-valuemin={min} aria-valuemax={max} aria-valuenow={cur}
        aria-valuetext={text} aria-disabled={disabled || undefined} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} onKeyDown={key}>
        <div className="pz-rl-ticks"><div className="pz-rl-strip" style={ticksBg} ref={e => { if (e) strips.current[0] = e; }} /></div>
        <div className="pz-rl-ticks pz-rl-ticks--hi"><div className="pz-rl-strip" style={ticksBg} ref={e => { if (e) strips.current[1] = e; }} /></div>
        <span className="pz-rl-ind" ref={ind} />
      </div>
      {name && <input type="hidden" name={name} value={cur} />}
    </div>
  );
}
