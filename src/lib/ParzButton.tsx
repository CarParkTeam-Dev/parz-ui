import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type MouseEvent, type PointerEvent, type ReactNode } from 'react';
import { Icon, type IconSpec } from './Icon';
import './ParzMenu.css';
import './ParzButton.css';

export type ParzButtonVariant = 'solid' | 'soft' | 'outline' | 'ghost' | 'glass';
export type ParzButtonSize = 'sm' | 'md' | 'lg';
export type ParzButtonShape = 'pill' | 'rounded' | 'square';

/** Parz UI · Parz Button — кнопка, которая мягко поджимается при нажатии, а из точки касания растекается капля. */
export interface ParzButtonProps {
  children?: ReactNode;
  /** Вид. По умолчанию 'solid'. */
  variant?: ParzButtonVariant;
  /** По умолчанию 'md'. */
  size?: ParzButtonSize;
  /** Скругление. По умолчанию 'pill'. */
  shape?: ParzButtonShape;
  /** Иконка слева: встроенная, 'ms:имя', 'mi:имя' или свой ReactNode. */
  icon?: IconSpec;
  /** Иконка справа. */
  iconEnd?: IconSpec;
  /** Только иконка, квадратная кнопка. Тогда обязателен ariaLabel. */
  iconOnly?: boolean;
  /** Подпись для экранных дикторов. */
  ariaLabel?: string;
  /** Загрузка: подпись плавно уходит, вместо неё живые точки. Кнопку нельзя нажать. */
  loading?: boolean;
  /** Текст рядом с точками во время загрузки. */
  loadingText?: ReactNode;
  disabled?: boolean;
  /** Растянуть на всю ширину. */
  fullWidth?: boolean;
  /** Если задан — рендерится ссылка `<a>`. */
  href?: string;
  target?: string;
  rel?: string;
  /** Тип `<button>`. По умолчанию 'button'. */
  type?: 'button' | 'submit' | 'reset';
  onClick?: (e: MouseEvent<HTMLButtonElement | HTMLAnchorElement>) => void;
  /** Нажатие с удержанием: пока держат, капля наполняет кнопку; когда наполнится — вызывается это, а обычный onClick уже нет. */
  onLongPress?: () => void;
  /** Сколько держать для onLongPress, мс. По умолчанию 600. */
  longPressDelay?: number;
  /** Основной цвет. */
  accent?: string;
  /** Цвет текста и иконок. */
  textColor?: string;
  /** Капля из точки нажатия. По умолчанию да. */
  ripple?: boolean;
  id?: string;
  name?: string;
  value?: string;
  className?: string;
  style?: CSSProperties;
}

/* ---- расчёт движения ----
   Нажатие — пружина (масса 1, жёсткость k, вязкость c), считается по кадрам с учётом реального времени кадра,
   поэтому на любом мониторе одинаково и без рывков: прервать можно в любой момент, скорость сохраняется. */
const SPRING_DOWN = { k: 520, c: 34 };   // поджатие: быстро, почти без перелёта (ζ≈0.75)
const SPRING_UP = { k: 300, c: 15 };     // отпустили: мягко, с одним лёгким перелётом (ζ≈0.43)
const PRESS = 0.955;                      // насколько поджимается
const HOLD_PRESS = 0.935;                 // при удержании — чуть глубже, плавно
const reduced = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

type Drop = { id: number; x: number; y: number; r: number; t0: number; up: number | null; hold: boolean };

// плавные кривые без изломов
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
const smooth = (t: number) => t * t * (3 - 2 * t);
const GROW = 520;   // капля растекается, мс
const FADE = 520;   // капля тает после отпускания, мс

export function ParzButton({
  children, variant = 'solid', size = 'md', shape = 'pill', icon, iconEnd, iconOnly = false, ariaLabel,
  loading = false, loadingText, disabled = false, fullWidth = false, href, target, rel, type = 'button', onClick,
  onLongPress, longPressDelay = 600, accent, textColor, ripple = true, id, name, value, className, style
}: ParzButtonProps) {
  const off = disabled || loading;
  const root = useRef<HTMLElement | null>(null);
  const dropsEl = useRef<HTMLSpanElement>(null);
  const [, force] = useState(0);
  const drops = useRef<Drop[]>([]);
  const sp = useRef({ x: 1, v: 0, to: 1, k: SPRING_UP.k, c: SPRING_UP.c });
  const raf = useRef(0);
  const last = useRef(0);
  const pid = useRef<number | null>(null);
  const holdT = useRef(0);
  const holdStart = useRef(0);
  const longFired = useRef(false);
  const n = useRef(0);
  const holdEl = useRef<HTMLSpanElement>(null);
  const holdLv = useRef(0);

  // один цикл кадров на пружину и капли; сам останавливается, когда всё успокоилось
  const tick = (now: number) => {
    const dt = Math.min(0.032, (now - (last.current || now)) / 1000);
    last.current = now;
    const s = sp.current;
    let target = s.to;
    // удержание: глубина поджатия плавно растёт до HOLD_PRESS
    if (pid.current !== null && onLongPress) {
      const p = smooth(Math.min(1, (now - holdStart.current) / longPressDelay));
      target = PRESS + (HOLD_PRESS - PRESS) * p;
    }
    // полунеявный Эйлер с подшагами — устойчиво при любом dt
    const steps = Math.max(1, Math.ceil(dt / 0.004));
    for (let i = 0; i < steps; i++) {
      const h = dt / steps;
      s.v += (-s.k * (s.x - target) - s.c * s.v) * h;
      s.x += s.v * h;
    }
    const el = root.current;
    if (el) el.style.transform = Math.abs(s.x - 1) < 1e-4 ? '' : `scale(${s.x.toFixed(5)})`;

    // капли
    const box = dropsEl.current;
    if (box) {
      let gone = false;
      drops.current.forEach((d, i) => {
        const node = box.children[i] as HTMLElement | undefined;
        if (!node) return;
        const age = now - d.t0;
        // при удержании капля растёт до конца ровно за время удержания
        const dur = d.hold ? Math.max(GROW, longPressDelay) : GROW;
        const g = easeOut(Math.min(1, age / dur));
        let a = 0.22 * Math.min(1, age / 90); // проявляется без вспышки
        if (d.up !== null) {
          // тает только после того, как хотя бы наполовину выросла — короткий тап тоже дорисовывается до конца
          const start = Math.max(d.up, d.t0 + GROW * 0.45);
          const f = Math.min(1, Math.max(0, (now - start) / FADE));
          a *= 1 - smooth(f);
          if (f >= 1) gone = true;
        }
        node.style.transform = `translate3d(${d.x - d.r}px,${d.y - d.r}px,0) scale(${(0.08 + 0.92 * g).toFixed(4)})`;
        node.style.opacity = a.toFixed(3);
      });
      if (gone) {
        drops.current = drops.current.filter(d => d.up === null || now - Math.max(d.up, d.t0 + GROW * 0.45) < FADE);
        force(x => x + 1);
      }
    }

    // удержание: текущий градиент под кнопкой — яркость плавно догоняет цель (экспонента, не зависит от частоты кадров)
    const held = pid.current !== null ? smooth(Math.min(1, Math.max(0, (now - holdStart.current - 160) / 700))) : 0;
    holdLv.current += (held - holdLv.current) * (1 - Math.exp(-dt * (pid.current !== null ? 7 : 5)));
    if (Math.abs(held - holdLv.current) < 0.002) holdLv.current = held;
    if (holdEl.current) holdEl.current.style.opacity = holdLv.current.toFixed(3);

    const springRest = Math.abs(s.x - target) < 1e-4 && Math.abs(s.v) < 1e-3 && pid.current === null;
    if (springRest && drops.current.length === 0 && holdLv.current === 0) { s.x = target; if (el) el.style.transform = ''; raf.current = 0; last.current = 0; return; }
    raf.current = requestAnimationFrame(tick);
  };
  const run = () => { if (!raf.current) { last.current = 0; raf.current = requestAnimationFrame(tick); } };
  useEffect(() => () => { cancelAnimationFrame(raf.current); clearTimeout(holdT.current); }, []);

  const press = () => { const s = sp.current; s.to = PRESS; s.k = SPRING_DOWN.k; s.c = SPRING_DOWN.c; run(); };
  const release = () => { const s = sp.current; s.to = 1; s.k = SPRING_UP.k; s.c = SPRING_UP.c; run(); };

  const addDrop = (el: HTMLElement, x: number, y: number, hold: boolean) => {
    if (!ripple || reduced()) return;
    const b = el.getBoundingClientRect();
    // масштаб кнопки сейчас может быть < 1 — переводим координаты в её собственные
    const k = b.width / el.offsetWidth || 1;
    const w = el.offsetWidth, h = el.offsetHeight;
    const lx = x / k, ly = y / k;
    const r = Math.hypot(Math.max(lx, w - lx), Math.max(ly, h - ly));
    drops.current = [...drops.current.slice(-3), { id: ++n.current, x: lx, y: ly, r, t0: performance.now(), up: null, hold }];
    force(v => v + 1);
    run();
  };
  const liftDrops = () => { const t = performance.now(); drops.current.forEach(d => { if (d.up === null) d.up = t; }); run(); };

  const down = (e: PointerEvent<HTMLElement>) => {
    if (off || e.button !== 0 || pid.current !== null) return;
    pid.current = e.pointerId;
    longFired.current = false;
    holdStart.current = performance.now();
    const b = e.currentTarget.getBoundingClientRect();
    if (!reduced()) press();
    addDrop(e.currentTarget, e.clientX - b.left, e.clientY - b.top, !!onLongPress);
    if (onLongPress) {
      clearTimeout(holdT.current);
      holdT.current = window.setTimeout(() => { longFired.current = true; onLongPress(); }, longPressDelay);
    }
  };
  const up = (e: PointerEvent<HTMLElement>) => {
    if (pid.current !== e.pointerId) return;
    pid.current = null;
    clearTimeout(holdT.current);
    release();
    liftDrops();
  };

  // нажатие с клавиатуры: та же пружина и капля из центра
  const keyDown = useRef(false);
  const kd = (e: KeyboardEvent<HTMLElement>) => {
    if (off || e.repeat || (e.key !== ' ' && e.key !== 'Enter') || keyDown.current) return;
    keyDown.current = true;
    const el = e.currentTarget;
    if (!reduced()) press();
    addDrop(el, el.offsetWidth / 2, el.offsetHeight / 2, false);
    // у ссылки Пробел по умолчанию не нажимает — делаем как у кнопки
    if (e.key === ' ' && el.tagName === 'A') e.preventDefault();
  };
  const ku = (e: KeyboardEvent<HTMLElement>) => {
    if (!keyDown.current) return;
    keyDown.current = false;
    release();
    liftDrops();
    if (e.key === ' ' && e.currentTarget.tagName === 'A' && !off) e.currentTarget.click();
  };

  const click = (e: MouseEvent<HTMLButtonElement | HTMLAnchorElement>) => {
    if (off || longFired.current) { e.preventDefault(); longFired.current = false; return; }
    onClick?.(e);
  };

  /* смена содержимого (текст, иконки): старое растворяется, новое проявляется, ширина перетекает */
  const sig = [typeof children === 'string' || typeof children === 'number' ? String(children) : '', typeof icon === 'string' ? icon : icon === undefined ? '' : '*', typeof iconEnd === 'string' ? iconEnd : iconEnd === undefined ? '' : '*', iconOnly ? 1 : 0].join('|');
  const body = (
    <>
      {icon !== undefined && <span className="pz-btn-ico"><Icon icon={icon} /></span>}
      {!iconOnly && children != null && <span className="pz-btn-label">{children}</span>}
      {iconEnd !== undefined && !iconOnly && <span className="pz-btn-ico"><Icon icon={iconEnd} /></span>}
    </>
  );
  const prev = useRef<{ sig: string; body: ReactNode; loading: boolean }>({ sig, body, loading });
  const [leaving, setLeaving] = useState<{ id: number; body: ReactNode }[]>([]);
  const swapW = useRef(0);
  const swapped = useRef(false); // после первой смены новое содержимое всегда проявляется плавно
  if (prev.current.sig !== sig) {
    // запоминаем ширину до смены — после рендера плавно перетечём к новой
    swapW.current = root.current?.getBoundingClientRect().width ?? 0;
    swapped.current = true;
    const old = prev.current.body, wasHidden = prev.current.loading;
    prev.current = { sig, body, loading };
    // старая подпись была спрятана загрузкой — уводить нечего, новая просто проявится вместе с уходом точек
    if (!wasHidden && !loading) { const lid = ++n.current; queueMicrotask(() => setLeaving(l => [...l.slice(-1), { id: lid, body: old }])); window.setTimeout(() => setLeaving(l => l.filter(y => y.id !== lid)), 600); }
  } else { prev.current.body = body; prev.current.loading = loading; }
  useLayoutEffect(() => {
    const el = root.current, w0 = swapW.current;
    swapW.current = 0;
    if (!el || !w0 || fullWidth || reduced()) return;
    const w1 = el.getBoundingClientRect().width;
    if (Math.abs(w1 - w0) < 0.5) return;
    const k = el.offsetWidth ? w1 / el.offsetWidth : 1;
    el.style.transition = 'none';
    el.style.width = `${w0 / k}px`;
    void el.offsetWidth;
    el.style.transition = '';
    el.style.width = `${w1 / k}px`;
    el.classList.add('is-resizing');
    const done = (e?: TransitionEvent) => {
      if (e && (e.target !== el || e.propertyName !== 'width')) return;
      el.style.width = ''; el.classList.remove('is-resizing'); el.removeEventListener('transitionend', done);
    };
    el.addEventListener('transitionend', done);
    const t = window.setTimeout(done, 800);
    return () => { clearTimeout(t); el.removeEventListener('transitionend', done); };
  }, [sig, fullWidth]);

  const cls = ['pz-btn', `pz-btn--${variant}`, `pz-btn--${size}`, `pz-btn--${shape}`,
    iconOnly && 'pz-btn--icon', fullWidth && 'pz-btn--full', loading && 'is-loading', disabled && 'is-disabled', className].filter(Boolean).join(' ');
  const vars: CSSProperties = { ...(accent ? { '--pz-btn-accent': accent } : {}), ...(textColor ? { '--pz-btn-fg': textColor } : {}), ...style } as CSSProperties;

  const inner = (
    <>
      <span className="pz-btn-hold" aria-hidden="true" ref={holdEl} />
      <span className="pz-btn-drops" aria-hidden="true" ref={dropsEl}>
        {drops.current.map(d => <span key={d.id} className="pz-btn-drop" style={{ width: d.r * 2, height: d.r * 2, opacity: 0 }} />)}
      </span>
      <span className="pz-btn-stack">
        {leaving.map(l => (
          <span key={l.id} className="pz-btn-body is-leaving" aria-hidden="true" onAnimationEnd={() => setLeaving(x => x.filter(y => y.id !== l.id))}>{l.body}</span>
        ))}
        <span className={`pz-btn-body${swapped.current ? ' is-entering' : ''}`} key={sig}>{body}</span>
        <span className="pz-btn-load" aria-hidden={!loading}>
          <span className="pz-btn-dots"><i /><i /><i /></span>
          {loadingText != null && !iconOnly && <span className="pz-btn-label">{loadingText}</span>}
        </span>
      </span>
    </>
  );

  const common = {
    id, className: cls, style: vars, 'aria-label': ariaLabel, 'aria-busy': loading || undefined,
    onPointerDown: down, onPointerUp: up, onPointerCancel: up, onPointerLeave: up,
    onKeyDown: kd, onKeyUp: ku, onBlur: () => { if (keyDown.current) { keyDown.current = false; release(); liftDrops(); } },
    onClick: click, onContextMenu: onLongPress ? (e: MouseEvent) => e.preventDefault() : undefined
  };

  if (href !== undefined) {
    return (
      <a {...common} ref={el => { root.current = el; }} href={off ? undefined : href} target={target} rel={rel ?? (target === '_blank' ? 'noopener noreferrer' : undefined)}
        role={off ? 'link' : undefined} aria-disabled={off || undefined} tabIndex={disabled ? -1 : undefined}>{inner}</a>
    );
  }
  return (
    <button {...common} ref={el => { root.current = el; }} type={type} name={name} value={value} disabled={disabled} aria-disabled={loading || undefined}>{inner}</button>
  );
}
