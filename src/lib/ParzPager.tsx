import { Children, forwardRef, useEffect, useImperativeHandle, useLayoutEffect, useRef, useState, type CSSProperties, type KeyboardEvent as RKeyboardEvent, type PointerEvent as RPointerEvent, type ReactNode } from 'react';
import { parzSpringCss, useParzMotion, type ParzMotionPreset } from './ParzProvider';
import './ParzPager.css';

export type ParzPagerEffect = 'slide' | 'scale' | 'tilt' | 'fade';
export type ParzPagerTheme = 'dark' | 'light';

/** Parz UI · Parz Pager — страницы, которые листаются свайпом: едут за пальцем, по инерции и пружиной встают на место. */
export interface ParzPagerProps {
  /** Страницы: каждый ребёнок — одна страница. */
  children?: ReactNode;
  /** Текущая страница (управляемый режим). */
  index?: number;
  /** Начальная страница (неуправляемый режим). По умолчанию 0. */
  defaultIndex?: number;
  /** Страница сменилась. */
  onIndexChange?: (index: number) => void;
  /** Дробная позиция каждый кадр: 1.5 — между второй и третьей. За краем меньше 0 или больше последней. */
  onProgress?: (progress: number) => void;
  /** Палец отпустили: позиция в этот момент (например, −0.3 — потянули за первую страницу). */
  onRelease?: (progress: number) => void;
  /** Как выглядит перелистывание. По умолчанию 'slide'. */
  effect?: ParzPagerEffect;
  /** Сколько px соседних страниц видно по краям. По умолчанию 0. */
  peek?: number;
  /** Наибольшая ширина страницы, px: в широком контейнере страница встаёт по центру, соседи видны с обеих сторон. По умолчанию — во всю ширину. */
  pageWidth?: number;
  /** Промежуток между страницами, px. По умолчанию 12. */
  gap?: number;
  /** Точки под страницами: активная тянется каплей, по точке можно нажать. По умолчанию false. */
  dots?: boolean;
  /** Круглые стрелки по краям. По умолчанию false. */
  arrows?: boolean;
  /** Бесконечная лента: после последней дальше в ту же сторону идёт первая. По умолчанию false — края фиксированы. */
  loop?: boolean;
  /** Листать само каждые N мс; замирает, пока страницу трогают, наводят или в ней фокус. С loop — бесконечно вперёд, без него — до последней. */
  autoplay?: number;
  /** Поставить автолистание на паузу снаружи (заливка точки стоит, потом продолжит с того же места). */
  paused?: boolean;
  /** Листать колесом и тачпадом. По умолчанию true. */
  wheel?: boolean;
  /** Цвет точек и стрелок. По умолчанию 'dark' (для тёмного фона). */
  theme?: ParzPagerTheme;
  /** Пресет движения. По умолчанию из ParzProvider. */
  motion?: ParzMotionPreset;
  /** Подписи: стрелки и точки. */
  labels?: Partial<ParzPagerLabels>;
  /** Имя для экранных дикторов. */
  ariaLabel?: string;
  className?: string;
  style?: CSSProperties;
}
export interface ParzPagerLabels { prev: string; next: string; page: string }
const LABELS: ParzPagerLabels = { prev: 'Previous', next: 'Next', page: 'Page {n}' };

const reduced = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
/** Сопротивление за краем: чем дальше тянут, тем туже. */
export const parzRubber = (over: number, size = 1) => (over * size * 0.55) / (size + Math.abs(over) * 0.55);
/** Где свайп страниц не начинается. Свой элемент — атрибут data-parz-noswipe. */
const NO_SWIPE = 'button, a[href], input, select, textarea, label, summary, [contenteditable="true"], [role="slider"], [role="switch"], [role="button"], [role="checkbox"], [role="tab"], [role="textbox"], [data-parz-noswipe]';
const r2 = (x: number) => Math.round(x * 100) / 100;

/** Управление снаружи — например, от Parz Title Tabs: страницы едут за заголовками без перерисовки React. */
export interface ParzPagerHandle {
  /** Поставить дробную позицию (1.5 — между второй и третьей) и стоять, пока не придёт следующая. */
  setProgress: (progress: number) => void;
}

export const ParzPager = forwardRef<ParzPagerHandle, ParzPagerProps>(function ParzPager({ children, index, defaultIndex = 0, onIndexChange, onProgress, onRelease, effect = 'slide', peek = 0, pageWidth, loop = false, gap = 12, dots = false, arrows = false,
  autoplay, paused = false, wheel = true, theme = 'dark', motion, labels, ariaLabel, className, style }, ref) {
  const spec = useParzMotion(motion);
  const L = { ...LABELS, ...labels };
  const spring = parzSpringCss(spec);
  const pages = Children.toArray(children);
  const n = pages.length;
  const [inner, setInner] = useState(defaultIndex);
  const cur = Math.max(0, Math.min(n - 1, index ?? inner));

  const root = useRef<HTMLDivElement>(null);
  const box = useRef<HTMLDivElement>(null);
  const strip = useRef<HTMLDivElement>(null);
  const pageEls = useRef<HTMLDivElement[]>([]);
  const dotEls = useRef<HTMLButtonElement[]>([]);
  const st = useRef({ p: cur, v: 0, target: cur, mode: 'idle' as 'idle' | 'drag' | 'spring', raf: 0, last: 0, w: 0,
    sx: 0, sy: 0, sp: 0, intent: 0 as 0 | 1 | -1, samples: [] as { t: number; p: number }[], committed: cur, wheelT: 0, wheelAcc: 0 });
  const isLoop = loop && n > 1;
  const live = useRef({ onIndexChange, onProgress, onRelease, spec, n, gap, peek, effect, pageWidth, isLoop });
  live.current = { onIndexChange, onProgress, onRelease, spec, n, gap, peek, effect, pageWidth, isLoop };
  /** Номер страницы по позиции (по кругу). */
  const wrap = (x: number) => { const m = live.current.n; return ((x % m) + m) % m; };
  /** Кратчайшее расстояние по кругу: от −n/2 до n/2. */
  const wdist = (d: number) => { const m = live.current.n; return ((((d + m / 2) % m) + m) % m) - m / 2; };

  // ширина страницы — целая, чтобы края не размывались
  const pageW = () => Math.max(1, Math.round(Math.min(st.current.w - 2 * live.current.peek, live.current.pageWidth ?? Infinity)));
  const offset = () => Math.round((st.current.w - pageW()) / 2);
  const unit = () => pageW() + live.current.gap;

  /* отрисовка без React: лента, эффект страниц и точки — в одном кадре */
  const paint = (emit = true) => {
    const s = st.current, { effect, n, isLoop } = live.current, p = s.p, pw = pageW(), u = unit(), off = offset();
    if (strip.current) strip.current.style.transform = effect === 'fade' || isLoop ? 'none' : `translate3d(${r2(off - p * u)}px,0,0)`;
    pageEls.current.forEach((e, i) => {
      if (!e) return;
      e.style.flexBasis = `${pw}px`; e.style.width = `${pw}px`;
      if (effect === 'fade') e.style.marginLeft = `${offset()}px`;
      else e.style.marginLeft = '';
      const d = isLoop ? wdist(i - p) : i - p, a = Math.min(1, Math.abs(d)), dc = Math.max(-1, Math.min(1, d));
      // по кругу: страница стоит там, где ближе к текущей, а не на своём месте в ряду
      const place = isLoop && effect !== 'fade' ? `translate3d(${r2(off + d * u - i * u)}px,0,0) ` : '';
      if (effect === 'scale') { e.style.transform = `${place}scale(${r2(1 - a * 0.1)})`; e.style.opacity = String(r2(1 - a * 0.45)); e.style.zIndex = ''; }
      else if (effect === 'tilt') { e.style.transform = `${place}perspective(900px) rotateY(${r2(dc * -18)}deg) scale(${r2(1 - a * 0.06)})`; e.style.opacity = String(r2(1 - a * 0.3)); e.style.zIndex = ''; }
      else if (effect === 'fade') { e.style.transform = `translate3d(${r2(dc * 24)}px,0,0)`; e.style.opacity = String(r2(1 - a)); e.style.zIndex = String(a < 0.5 ? 2 : 1); }
      else { e.style.transform = place.trim(); e.style.opacity = ''; e.style.zIndex = ''; }
    });
    const c = isLoop ? wrap(p) : Math.max(0, Math.min(n - 1, p));
    dotEls.current.forEach((d, i) => {
      if (!d) return;
      const k = Math.max(0, 1 - Math.abs(isLoop ? wdist(c - i) : c - i));
      d.style.width = `${8 + Math.round(k * 16)}px`;
      d.style.setProperty('--pz-pgr-k', String(r2(k)));
    });
    // ведут снаружи — назад не сообщаем, чтобы не было эха
    if (emit) live.current.onProgress?.(isLoop ? wrap(p) : p);
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
    if (s.mode === 'idle') { s.raf = 0; s.last = 0; return; }
    s.raf = requestAnimationFrame(tick);
  };
  const run = () => { const s = st.current; if (!s.raf) { s.last = 0; s.raf = requestAnimationFrame(tick); } };
  useImperativeHandle(ref, () => ({
    setProgress: (pos: number) => {
      const s = st.current;
      if (s.mode === 'drag') return;
      cancelAnimationFrame(s.raf); s.raf = 0; s.mode = 'idle'; s.v = 0;
      s.p = pos; s.target = Math.round(pos);
      paint(false);
    }
  }), []);
  const goAbs = (pos: number, v = 0) => {
    const s = st.current;
    if (!live.current.isLoop) pos = Math.max(0, Math.min(live.current.n - 1, pos));
    s.target = pos; commit(live.current.isLoop ? wrap(pos) : pos);
    if (reduced()) { s.p = pos; s.v = 0; s.mode = 'idle'; paint(); return; }
    s.v = v; s.mode = 'spring'; run();
  };
  /** К странице i; по кругу — кратчайшим путём. */
  const go = (i: number, v = 0) => {
    const s = st.current;
    if (!live.current.isLoop) return goAbs(i, v);
    const base = Math.round(s.mode === 'spring' ? s.target : s.p);
    goAbs(base + wdist(i - wrap(base)), v);
  };
  /** На d страниц вперёд или назад от той, куда едем. */
  const step = (d: number, v = 0) => {
    const s = st.current;
    if (live.current.isLoop) goAbs(Math.round(s.mode === 'spring' ? s.target : s.p) + d, v);
    else goAbs(s.committed + d, v);
  };

  useLayoutEffect(() => {
    const el = box.current; if (!el) return;
    const ro = new ResizeObserver(() => { st.current.w = el.clientWidth; el.style.setProperty('--pz-pgr-ay', `${Math.round(el.clientHeight / 2 - 4)}px`); paint(); });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  useLayoutEffect(() => {
    // выключили loop — вернуть позицию в ряд
    if (!isLoop) { const s = st.current; s.p = wrap(Math.round(s.p)); s.target = s.p; }
    paint();
  }, [gap, peek, effect, n, dots, pageWidth, isLoop]);
  useEffect(() => () => { cancelAnimationFrame(st.current.raf); window.clearTimeout(st.current.wheelT); }, []);
  // страницу поменяли снаружи — едем к ней
  useEffect(() => {
    const s = st.current;
    if (cur === s.committed || s.mode === 'drag') return;
    s.committed = cur; go(cur, s.v);
  }, [cur]);

  /* автолистание: пауза, пока страницу трогают, наводят или в ней фокус — и продолжение с того же места */
  const [hover, setHeld] = useState(false);
  const held = hover || paused;
  const playing = !!autoplay && n > 1 && (isLoop || cur < n - 1);
  const rem = useRef(autoplay ?? 0);
  // новая страница или новый таймер — отсчёт заново
  useEffect(() => { rem.current = autoplay ?? 0; }, [cur, autoplay, isLoop, n]);
  useEffect(() => {
    if (!playing || held) return;
    const startAt = performance.now();
    const id = window.setTimeout(() => { if (document.visibilityState === 'visible') step(1); else rem.current = autoplay ?? 0; }, Math.max(0, rem.current));
    return () => { window.clearTimeout(id); rem.current = Math.max(0, rem.current - (performance.now() - startAt)); };
  }, [playing, held, cur, autoplay]);

  const clampP = (raw: number) => {
    const last = live.current.n - 1;
    if (live.current.isLoop) return raw;
    return raw < 0 ? parzRubber(raw) : raw > last ? last + parzRubber(raw - last) : raw;
  };
  const down = (e: RPointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    // свайп только с пустых мест: на кнопках, полях, переключателях и слайдерах внутри страниц — их собственный жест
    if ((e.target as HTMLElement).closest(`.pz-pgr-arrow, ${NO_SWIPE}`)) return;
    const s = st.current;
    s.sx = e.clientX; s.sy = e.clientY; s.sp = s.p; s.intent = 0; s.mode = 'drag'; s.v = 0;
    s.samples = [{ t: performance.now(), p: s.p }];
    setHeld(true);
    run();
  };
  const move = (e: RPointerEvent<HTMLDivElement>) => {
    const s = st.current;
    if (s.mode !== 'drag' || s.intent === -1) return;
    const dx = e.clientX - s.sx, dy = e.clientY - s.sy;
    if (s.intent === 0) {
      if (Math.hypot(dx, dy) < 6) return;
      // вертикальный жест — это прокрутка страницы, не листание
      if (Math.abs(dy) > Math.abs(dx)) { s.intent = -1; goAbs(Math.round(s.p)); return; }
      s.intent = 1; s.sx = e.clientX; s.sp = s.p;
      try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* без захвата тоже работает */ }
    }
    // за краем — сопротивление; внутри — ровно за пальцем
    s.p = clampP(s.sp + (s.sx - e.clientX) / unit());
    const now = performance.now();
    s.samples.push({ t: now, p: s.p }); while (s.samples.length > 2 && now - s.samples[0].t > 100) s.samples.shift();
  };
  const up = (e: RPointerEvent<HTMLDivElement>) => {
    const s = st.current;
    if (s.mode !== 'drag') return;
    try { e.currentTarget.releasePointerCapture(e.pointerId); } catch { /* уже отпущен */ }
    if (e.pointerType !== 'mouse') setHeld(false);
    if (s.intent !== 1) {
      if (s.intent === 0) { const t = live.current.isLoop ? Math.round(s.target) : Math.max(0, Math.min(live.current.n - 1, Math.round(s.target))); goAbs(t, 0); }
      return;
    }
    live.current.onRelease?.(s.p);
    const a = s.samples[0], b = s.samples[s.samples.length - 1];
    const v = b.t > a.t && performance.now() - b.t < 80 ? ((b.p - a.p) / (b.t - a.t)) * 1000 : 0;
    const from = Math.round(s.sp);
    // бросок — на соседнюю страницу; медленно — куда ближе
    let to = Math.abs(v) > 0.35 ? (v > 0 ? Math.floor(s.p) + 1 : Math.ceil(s.p) - 1) : Math.round(s.p);
    to = Math.max(from - 1, Math.min(from + 1, to));
    goAbs(to, Math.max(-6, Math.min(6, v)));
  };

  useEffect(() => {
    const el = box.current; if (!el || !wheel) return;
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY) || st.current.mode === 'drag') return;
      e.preventDefault();
      const s = st.current, now = performance.now();
      const px = e.deltaMode === 1 ? e.deltaX * 16 : e.deltaMode === 2 ? e.deltaX * s.w : e.deltaX;
      // начало жеста — запоминаем, откуда; тачпад ведёт ленту, как палец
      if (s.mode !== 'drag' && now - s.wheelAcc > 160) { s.sp = Math.round(s.mode === 'spring' ? s.target : s.p); s.samples = []; }
      s.wheelAcc = now;
      s.mode = 'idle'; cancelAnimationFrame(s.raf); s.raf = 0; s.v = 0;
      const lo = s.sp - 1, hi = s.sp + 1;
      s.p = clampP(Math.max(lo, Math.min(hi, s.p + px / unit())));
      s.samples.push({ t: now, p: s.p }); while (s.samples.length > 2 && now - s.samples[0].t > 100) s.samples.shift();
      paint();
      window.clearTimeout(s.wheelT);
      s.wheelT = window.setTimeout(() => {
        const a = s.samples[0], b2 = s.samples[s.samples.length - 1];
        const v = a && b2 && b2.t > a.t ? ((b2.p - a.p) / (b2.t - a.t)) * 1000 : 0;
        let to = Math.abs(v) > 0.6 ? (v > 0 ? Math.floor(s.p) + 1 : Math.ceil(s.p) - 1) : Math.round(s.p);
        to = Math.max(lo, Math.min(hi, to));
        goAbs(to, 0);
      }, 90);
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [wheel]);

  const key = (e: RKeyboardEvent) => {
    if (e.target !== e.currentTarget) return;
    const m: Record<string, number> = { ArrowRight: 1, ArrowLeft: -1 };
    if (e.key in m) { e.preventDefault(); step(m[e.key]); }
    else if (e.key === 'Home') { e.preventDefault(); go(0); }
    else if (e.key === 'End') { e.preventDefault(); go(n - 1); }
  };

  const chev = (d: 1 | -1) => (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d={d > 0 ? 'M6 3l5 5-5 5' : 'M10 3L5 8l5 5'} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
  );
  return (
    <div ref={root} className={`pz-pgr pz-pgr--${theme} pz-pgr--${effect}${playing ? ' is-playing' : ''}${held ? ' is-held' : ''}${className ? ' ' + className : ''}`} style={{ '--pz-pgr-ease': spring.easing, '--pz-pgr-dur': `${spring.ms}ms`, '--pz-pgr-auto': `${autoplay ?? 0}ms`, ...style } as CSSProperties}
      onMouseEnter={() => setHeld(true)} onMouseLeave={() => setHeld(false)} onFocus={() => setHeld(true)} onBlur={e => { if (!root.current?.contains(e.relatedTarget as Node)) setHeld(false); }}>
      <div ref={box} className="pz-pgr-view" role="region" aria-roledescription="carousel" aria-label={ariaLabel} tabIndex={0}
        onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} onKeyDown={key}>
        <div ref={strip} className="pz-pgr-strip" style={{ gap: effect === 'fade' ? 0 : gap }}>
          {pages.map((p, i) => (
            <div key={i} ref={el => { if (el) { pageEls.current[i] = el; el.toggleAttribute('inert', i !== cur); } }} className="pz-pgr-page"
              role="group" aria-roledescription="slide" aria-label={`${i + 1} / ${n}`} aria-hidden={i !== cur || undefined}>{p}</div>
          ))}
        </div>
        {arrows && n > 1 && <>
          <button type="button" className="pz-pgr-arrow pz-pgr-arrow--prev" aria-label={L.prev} disabled={!isLoop && cur === 0} onClick={() => step(-1)}>{chev(-1)}</button>
          <button type="button" className="pz-pgr-arrow pz-pgr-arrow--next" aria-label={L.next} disabled={!isLoop && cur === n - 1} onClick={() => step(1)}>{chev(1)}</button>
        </>}
      </div>
      {dots && n > 1 && (
        <div className="pz-pgr-dots">
          {pages.map((_, i) => (
            <button key={i} type="button" ref={el => { if (el) dotEls.current[i] = el; }} className="pz-pgr-dot" aria-label={L.page.replace('{n}', String(i + 1))}
              aria-current={i === cur || undefined} onClick={() => go(i)}>{i === cur && playing && <span key={cur} className="pz-pgr-fill" />}</button>
          ))}
        </div>
      )}
    </div>
  );
});
