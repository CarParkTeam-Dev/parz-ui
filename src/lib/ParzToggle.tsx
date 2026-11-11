import { useRef, useState, type CSSProperties, type KeyboardEvent, type MouseEvent, type PointerEvent, type ReactNode } from 'react';
import './ParzToggle.css';

export type ParzToggleSize = 'sm' | 'md' | 'lg' | number;

/** Parz UI · Parz Toggle — переключатель с жидким бегунком: тянется, сплющивается и чуть перелетает. */
export interface ParzToggleProps {
  /** Состояние (управляемый режим). */
  checked?: boolean;
  /** Начальное состояние (неуправляемый режим). */
  defaultChecked?: boolean;
  /** Вызывается при переключении — кликом, клавиатурой или перетаскиванием. */
  onChange?: (checked: boolean) => void;
  /** Подпись рядом с тумблером. Без неё задайте ariaLabel. */
  label?: ReactNode;
  /** С какой стороны подпись. По умолчанию 'end' (справа). */
  labelPosition?: 'start' | 'end';
  disabled?: boolean;
  /** 'sm' | 'md' | 'lg' или высота дорожки в px. По умолчанию 'md' (20 px). */
  size?: ParzToggleSize;
  /** Цвет включённой дорожки. */
  accent?: string;
  /** Цвет выключенной дорожки. */
  trackColor?: string;
  /** Цвет бегунка. */
  thumbColor?: string;
  /** Подпись для экранных дикторов, если нет видимой label. */
  ariaLabel?: string;
  /** Можно ли тянуть бегунок пальцем или мышью. По умолчанию да. */
  draggable?: boolean;
  /** Минимальная пауза между переключениями, мс. Слишком частая попытка отклоняется: тумблер на секунду краснеет и вздрагивает. По умолчанию 0 — без ограничения. */
  cooldown?: number;
  /** Своя проверка: вернёт false — переключение отклоняется так же, как при cooldown. */
  canChange?: (next: boolean) => boolean;
  /** Вызывается, когда попытку отклонили. */
  onReject?: (next: boolean) => void;
  /** Цвет отказа. По умолчанию #ff5c5c. */
  rejectColor?: string;
  name?: string;
  id?: string;
  className?: string;
  style?: CSSProperties;
}

const SIZES = { sm: 16, md: 20, lg: 28 };

export function ParzToggle({
  checked, defaultChecked = false, onChange, label, labelPosition = 'end', disabled = false, size = 'md',
  accent, trackColor, thumbColor, ariaLabel, draggable = true, cooldown = 0, canChange, onReject, rejectColor, name, id, className, style
}: ParzToggleProps) {
  const [inner, setInner] = useState(defaultChecked);
  const on = checked ?? inner;
  // анимация сплющивания включается после первого действия — при загрузке страницы ничего не дёргается
  const [moved, setMoved] = useState(false);
  const [drag, setDrag] = useState<number | null>(null);
  const d = useRef<{ x0: number; start: number; pid: number; moved: boolean } | null>(null);
  const skipClick = useRef(false);
  const track = useRef<HTMLSpanElement>(null);
  const last = useRef(0);
  const [reject, setReject] = useState(0); // счётчик отказов: чётность перезапускает анимацию
  const rejT = useRef(0);
  const [rejecting, setRejecting] = useState(false);

  const h = typeof size === 'number' ? size : SIZES[size];
  const pad = Math.max(2, Math.round(h / 10));
  const thumb = h - pad * 2;
  const w = Math.round(h * 1.7);
  const travel = w - thumb - pad * 2;

  const set = (v: boolean) => {
    if (disabled || v === on) return;
    const now = Date.now();
    if ((cooldown > 0 && now - last.current < cooldown) || (canChange && !canChange(v))) {
      setReject(n => n + 1); setRejecting(true);
      window.clearTimeout(rejT.current);
      rejT.current = window.setTimeout(() => setRejecting(false), 1000);
      onReject?.(v);
      return;
    }
    last.current = now;
    setMoved(true);
    if (checked === undefined) setInner(v);
    onChange?.(v);
  };

  const down = (e: PointerEvent) => {
    if (disabled || !draggable || e.button !== 0) return;
    d.current = { x0: e.clientX, start: on ? travel : 0, pid: e.pointerId, moved: false };
  };
  const move = (e: PointerEvent) => {
    const s = d.current;
    if (!s || s.pid !== e.pointerId) return;
    const dx = e.clientX - s.x0;
    if (!s.moved && Math.abs(dx) < 4) return;
    if (!s.moved) { s.moved = true; try { track.current?.setPointerCapture(e.pointerId); } catch { /* нет захвата */ } }
    const dir = getComputedStyle(e.currentTarget).direction === 'rtl' ? -1 : 1;
    setDrag(Math.min(travel, Math.max(0, s.start + dx * dir)));
  };
  const up = (e: PointerEvent) => {
    const s = d.current;
    d.current = null;
    if (!s || !s.moved) return;
    skipClick.current = true; // клик после перетаскивания не должен переключать второй раз
    setTimeout(() => { skipClick.current = false; }, 0);
    const x = drag ?? s.start;
    setDrag(null);
    if (e.type !== 'pointercancel') set(x > travel / 2);
  };
  const click = (e: MouseEvent) => { if (skipClick.current) { e.preventDefault(); skipClick.current = false; } };
  const key = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') { e.preventDefault(); set(!on); }
  };

  const vars = {
    '--pz-tg-h': `${h}px`, '--pz-tg-w': `${w}px`, '--pz-tg-pad': `${pad}px`, '--pz-tg-thumb': `${thumb}px`,
    '--pz-tg-x': `${drag ?? (on ? travel : 0)}px`,
    ...(accent && { '--pz-tg-accent': accent }),
    ...(trackColor && { '--pz-tg-track': trackColor }),
    ...(thumbColor && { '--pz-tg-knob': thumbColor }),
    ...(rejectColor && { '--pz-tg-reject': rejectColor }),
    ...style
  } as CSSProperties;

  const cls = ['pz-tg', on && 'is-on', disabled && 'is-disabled', drag !== null && 'is-drag', moved && 'is-moved', rejecting && 'is-reject', rejecting && (reject % 2 ? 'is-reject-a' : 'is-reject-b'), labelPosition === 'start' && 'pz-tg--start', className]
    .filter(Boolean).join(' ');

  return (
    <label className={cls} style={vars} onClick={click} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}>
      <span className="pz-tg-track" ref={track}>
        <input type="checkbox" role="switch" className="pz-tg-in" checked={on} aria-checked={on} disabled={disabled} aria-label={ariaLabel}
          name={name} id={id} onChange={e => set(e.target.checked)} onKeyDown={key} />
        <span className="pz-tg-ring" aria-hidden="true" />
        <span className="pz-tg-thumb" aria-hidden="true"><span className="pz-tg-blob"><span className="pz-tg-core" /></span></span>
      </span>
      {label != null && label !== '' && <span className="pz-tg-label">{label}</span>}
    </label>
  );
}
