import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import './ParzProgress.css';

export type ParzProgressSize = 'sm' | 'md' | 'lg';
export type ParzProgressVariant = 'bar' | 'ring';
export type ParzProgressLabelPosition = 'end' | 'start' | 'bottom';
export type ParzProgressStatus = 'default' | 'success' | 'warning' | 'error' | 'paused';

/** Parz UI · Parz Progress — прогресс, который перетекает к новому значению на пружине, а не прыгает. */
export interface ParzProgressProps {
  /** Текущее значение. Без него (или с indeterminate) — режим «неизвестно сколько». */
  value?: number;
  /** Максимум. По умолчанию 100. */
  max?: number;
  /** Неизвестно, сколько осталось: по дорожке течёт жидкая капля. */
  indeterminate?: boolean;
  /** 'bar' — полоса, 'ring' — кольцо. По умолчанию 'bar'. */
  variant?: ParzProgressVariant;
  /** По умолчанию 'md'. */
  size?: ParzProgressSize;
  /** Подпись над полосой; у кольца — рядом или под ним (см. labelPosition). */
  label?: ReactNode;
  /** Где подпись у кольца: 'end' — справа, 'start' — слева, 'bottom' — под кольцом. По умолчанию 'end'. */
  labelPosition?: ParzProgressLabelPosition;
  /** Показывать значение: у полосы — справа от подписи, у кольца — в центре. По умолчанию да, если есть value. */
  showValue?: boolean;
  /** Как показать значение. По умолчанию проценты. */
  formatValue?: (value: number, max: number) => ReactNode;
  /** Состояние: 'success' — успех, 'warning' — внимание (заливка спокойно дышит), 'error' — ошибка (один мягкий вздрог),
   *  'paused' — задержка или пауза (цвет приглушён, движение замедлено). По умолчанию 'default'. */
  status?: ParzProgressStatus;
  /** Бета. Когда дошли до 100% и status='success', полоса стягивается в каплю и превращается в круг с галочкой,
   *  а кольцо заливается цветом с галочкой внутри. Обратимо: значение упало или состояние сменилось — плавно назад. */
  successMorph?: boolean;
  /** Мягкая вспышка, когда дошли до конца. По умолчанию да. */
  celebrate?: boolean;
  /** Цвет заливки. */
  accent?: string;
  /** Цвет дорожки. */
  trackColor?: string;
  /** Подпись для экранных дикторов, если нет видимой label. */
  ariaLabel?: string;
  className?: string;
  style?: CSSProperties;
}

const reduced = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
/* пружина: жёсткость и вязкость подобраны почти без перелёта (ζ≈0.9) — заливка «натекает», а не дёргается */
const K = 90, C = 17;
const RING = { sm: 28, md: 44, lg: 68 };

export function ParzProgress({
  value, max = 100, indeterminate, variant = 'bar', size = 'md', label, labelPosition = 'end', status = 'default', successMorph = false, showValue, formatValue, celebrate = true,
  accent, trackColor, ariaLabel, className, style
}: ParzProgressProps) {
  const indet = indeterminate || value == null;
  const target = indet ? 0 : Math.min(1, Math.max(0, (value as number) / (max || 1)));
  const fillEl = useRef<HTMLElement | null>(null);
  const numEl = useRef<HTMLSpanElement>(null);
  const sp = useRef({ x: target, v: 0 });
  const raf = useRef(0);
  const last = useRef(0);
  const first = useRef(true);
  // вспышка «дошли до конца»: счётчик перезапускает анимацию, флаг снимается сразу после неё —
  // иначе она повторялась бы сама, например при смене вида полоса ↔ кольцо
  const [done, setDone] = useState(0);
  const [glow, setGlow] = useState(false);
  const glowT = useRef(0);
  useEffect(() => () => window.clearTimeout(glowT.current), []);

  const fmt = (frac: number) => (formatValue ? formatValue(frac * (max || 1), max) : `${Math.round(frac * 100)}%`);

  // рисуем текущее положение пружины прямо в DOM — без перерисовки React на каждом кадре
  const arcEl = useRef<SVGCircleElement>(null);
  const circ = useRef(0);
  const paint = (x: number) => {
    const el = fillEl.current;
    if (el) el.style.setProperty('--pz-pg-p', x.toFixed(5));
    // дуга кольца — в пикселях прямо в атрибуте: без calc() внутри SVG, одинаково во всех браузерах
    const a = arcEl.current;
    if (a && circ.current && !indet) {
      const c = circ.current;
      a.style.strokeDasharray = `${c} ${c}`;
      a.style.strokeDashoffset = `${(c * (1 - x)).toFixed(3)}`;
      a.style.opacity = String(Math.min(1, x * 80));
    }
    const n = numEl.current;
    if (n && !formatValue) {
      const txt = `${Math.round(x * 100)}%`;
      if (n.textContent !== txt) { n.textContent = txt; fit(); }
    }
  };
  // текст в кольце подстраивается: если не помещается внутрь — плавно ужимается
  const fit = () => {
    const n = numEl.current, box = n?.parentElement;
    if (!n || !box || variant !== 'ring') return;
    const room = box.clientWidth;
    const w = n.scrollWidth;
    n.style.transform = w > room && w > 0 ? `scale(${(room / w).toFixed(3)})` : '';
  };

  useLayoutEffect(() => { fit(); });

  useEffect(() => {
    if (indet) { cancelAnimationFrame(raf.current); raf.current = 0; return; }
    const s = sp.current;
    if (first.current || reduced()) { first.current = false; s.x = target; s.v = 0; paint(target); return; }
    const was = s.x;
    const tick = (now: number) => {
      const dt = Math.min(0.032, (now - (last.current || now)) / 1000);
      last.current = now;
      const steps = Math.max(1, Math.ceil(dt / 0.004));
      for (let i = 0; i < steps; i++) { const h = dt / steps; s.v += (-K * (s.x - target) - C * s.v) * h; s.x += s.v * h; }
      // заливка никогда не выходит за 0…1 — перелёт гасим у краёв мягко
      if (s.x > 1) { s.x = 1; s.v = Math.min(0, s.v); }
      if (s.x < 0) { s.x = 0; s.v = Math.max(0, s.v); }
      paint(s.x);
      if (Math.abs(s.x - target) < 0.0004 && Math.abs(s.v) < 0.002) { s.x = target; s.v = 0; paint(target); raf.current = 0; last.current = 0; return; }
      raf.current = requestAnimationFrame(tick);
    };
    cancelAnimationFrame(raf.current);
    last.current = 0;
    raf.current = requestAnimationFrame(tick);
    if (celebrate && target >= 1 && was < 1 && !reduced()) {
      setDone(d => d + 1); setGlow(true);
      window.clearTimeout(glowT.current);
      glowT.current = window.setTimeout(() => setGlow(false), 1300);
    }
    return () => { cancelAnimationFrame(raf.current); raf.current = 0; };
  }, [target, indet]);

  const vars = {
    ...(accent && { '--pz-pg-accent': accent }),
    ...(trackColor && { '--pz-pg-track': trackColor }),
    '--pz-pg-p': String(sp.current.x),
    ...style
  } as CSSProperties;
  const show = showValue ?? !indet;
  const full = !indet && target >= 1;
  const cls = ['pz-pg', `pz-pg--${variant}`, `pz-pg--${size}`, variant === 'ring' && `pz-pg--lp-${labelPosition}`, status !== 'default' && `is-${status}`, successMorph && !indet && target >= 1 && status === 'success' && 'is-morph', indet && 'is-indet', full && 'is-full', glow && (done % 2 ? 'is-done-a' : 'is-done-b'), className].filter(Boolean).join(' ');
  const aria = {
    role: 'progressbar' as const, 'aria-label': ariaLabel, 'aria-valuemin': indet ? undefined : 0, 'aria-valuemax': indet ? undefined : 100,
    'aria-valuenow': indet ? undefined : Math.round(target * 100), 'aria-valuetext': indet ? undefined : String(formatValue ? fmt(target) : `${Math.round(target * 100)}%`),
    'aria-busy': (indet && status !== 'paused') || undefined, 'aria-invalid': status === 'error' || undefined, 'data-status': status !== 'default' ? status : undefined
  };
  // у успеха, ошибки и паузы вместо числа — понятный значок; смена плавная (новый элемент проявляется)
  // при successMorph галочка будет в самом круге — значок успеха в углу не рисуем вовсе
  const icon = status === 'success' && successMorph ? null : status === 'success' ? <path d="M5 12.5l4.2 4.2L19 7" /> : status === 'error' ? <><path d="M12 6.5v7" /><path d="M12 17.6v.01" /></>
    : status === 'paused' ? <><path d="M9.2 7v10" /><path d="M14.8 7v10" /></> : null;
  const valueNode = !show ? null
    : icon ? <span className="pz-pg-val pz-pg-ico" key={status}><svg viewBox="0 0 24 24" aria-hidden="true">{icon}</svg></span>
    : !indet ? <span className="pz-pg-val" key="num" ref={numEl}>{formatValue ? fmt(target) : fmt(sp.current.x)}</span> : null;

  if (variant === 'ring') {
    const d = RING[size];
    const sw = Math.max(3, Math.round(d * 0.11));
    const r = (d - sw) / 2;
    const c = 2 * Math.PI * r;
    circ.current = c;
    const p = sp.current.x;
    return (
      <div className={cls} style={vars}>
        <div className="pz-pg-ringbox" style={{ width: d, height: d, '--pz-pg-fs': `${Math.round(d * 0.27)}px`, '--pz-pg-room': `${Math.round(d - sw * 2 - 6)}px` } as CSSProperties} ref={el => { fillEl.current = el; }} {...aria}>
          <svg className="pz-pg-svg" viewBox={`0 0 ${d} ${d}`} aria-hidden="true">
            <circle className="pz-pg-rtrack" cx={d / 2} cy={d / 2} r={r} strokeWidth={sw} />
            {/* «неизвестно сколько» — дуга в треть круга плавно вращается; иначе длину дуги задаёт пружина */}
            <circle ref={arcEl} className="pz-pg-rfill" cx={d / 2} cy={d / 2} r={r} strokeWidth={sw}
              style={indet ? { strokeDasharray: `${(c * 0.3).toFixed(2)} ${c.toFixed(2)}`, strokeDashoffset: 0, opacity: 1 }
                : { strokeDasharray: `${c} ${c}`, strokeDashoffset: (c * (1 - p)).toFixed(3), opacity: Math.min(1, p * 80) }} />
          </svg>
          {valueNode && size !== 'sm' && <span className="pz-pg-center">{valueNode}</span>}
          {successMorph && <span className="pz-pg-disc" aria-hidden="true"><svg className="pz-pg-check" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 12.6l3.4 3.4L17 9.2" /></svg></span>}
        </div>
        {label != null && <span className="pz-pg-label" key={typeof label === 'string' || typeof label === 'number' ? String(label) : undefined}>{label}</span>}
      </div>
    );
  }

  return (
    <div className={cls} style={vars}>
      {(label != null || valueNode) && (
        <div className="pz-pg-head">
          {label != null && <span className="pz-pg-label" key={typeof label === 'string' || typeof label === 'number' ? String(label) : undefined}>{label}</span>}
          {valueNode}
        </div>
      )}
      <div className="pz-pg-bar">
        <div className="pz-pg-track" ref={el => { fillEl.current = el; }} {...aria}>
          <div className="pz-pg-fill"><span className="pz-pg-sheen" /></div>
          <div className="pz-pg-drop" />
        </div>
        {successMorph && <span className="pz-pg-badge" aria-hidden="true"><svg className="pz-pg-check" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 12.6l3.4 3.4L17 9.2" /></svg></span>}
      </div>
    </div>
  );
}
