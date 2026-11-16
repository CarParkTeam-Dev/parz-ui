import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type MouseEvent, type PointerEvent, type ReactNode } from 'react';
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
  // бегунок — капсула, как в iOS: шире, чем выше; дорожка длиннее, чтобы ходу хватало
  const thumbW = Math.round(thumb * 1.55);
  const w = Math.round(h * 2.25);
  const travel = w - thumbW - pad * 2;

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
    setByDrag(false);
    if (checked === undefined) setInner(v);
    onChange?.(v);
  };

  // нажатие — свой флаг вместо :active: на телефонах :active «залипает» после касания, и бегунок оставался раздутым
  const [press, setPress] = useState(false);
  // переключили перетаскиванием — анимацию переезда не повторяем: бегунок уже на месте и просто сдувается из стекла
  const [byDrag, setByDrag] = useState(false);
  const dragNow = useRef<number | null>(null);
  dragNow.current = drag;
  const live = useRef({ on, travel, set: (_: boolean) => {} });
  // потеря фокуса посреди нажатия или перетаскивания (сменили вкладку, всплыло окно, касание прервано):
  // ничего не застревает — бегунок спокойно доезжает к ближайшей стороне и сдувается
  const settle = () => {
    const s = d.current, x = dragNow.current;
    d.current = null;
    setPress(false);
    if (s && s.moved && x !== null) {
      skipClick.current = true;
      setTimeout(() => { skipClick.current = false; }, 0);
      setDrag(null);
      const next = x > live.current.travel / 2;
      if (next !== live.current.on) live.current.set(next);
      setByDrag(true);
    }
  };
  useEffect(() => {
    const vis = () => { if (document.visibilityState === 'hidden') settle(); };
    window.addEventListener('blur', settle);
    document.addEventListener('visibilitychange', vis);
    return () => { window.removeEventListener('blur', settle); document.removeEventListener('visibilitychange', vis); };
  }, []);
  const down = (e: PointerEvent) => {
    if (disabled || e.button !== 0) return;
    setPress(true);
    const off = () => { setPress(false); window.removeEventListener('pointerup', off); window.removeEventListener('pointercancel', off); };
    window.addEventListener('pointerup', off); window.addEventListener('pointercancel', off);
    if (!draggable) return;
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
    // и при отмене касания (например, страницу начали прокручивать) — к ближайшей стороне, а не рывком назад
    const next = x > travel / 2;
    if (e.type !== 'pointercancel' || next !== on) set(next);
    setByDrag(true);
  };
  const click = (e: MouseEvent) => { if (skipClick.current) { e.preventDefault(); skipClick.current = false; } };
  const key = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') { e.preventDefault(); set(!on); }
  };

  const vars = {
    '--pz-tg-h': `${h}px`, '--pz-tg-w': `${w}px`, '--pz-tg-pad': `${pad}px`, '--pz-tg-thumb': `${thumb}px`, '--pz-tg-tw': `${thumbW}px`,
    '--pz-tg-x': `${drag ?? (on ? travel : 0)}px`,
    ...(accent && { '--pz-tg-accent': accent }),
    ...(trackColor && { '--pz-tg-track': trackColor }),
    ...(thumbColor && { '--pz-tg-knob': thumbColor }),
    ...(rejectColor && { '--pz-tg-reject': rejectColor }),
    ...style
  } as CSSProperties;

  live.current = { on, travel, set };
  // дорожка меняет цвет сразу, как бегунок перетащили за середину, — не дожидаясь отпускания
  const lit = drag !== null ? drag > travel / 2 : on;
  const cls = ['pz-tg', on && 'is-on', lit && 'is-lit', disabled && 'is-disabled', drag !== null && 'is-drag', press && 'is-press', byDrag && 'is-by-drag', moved && 'is-moved', rejecting && 'is-reject', rejecting && (reject % 2 ? 'is-reject-a' : 'is-reject-b'), labelPosition === 'start' && 'pz-tg--start', className]
    .filter(Boolean).join(' ');

  return (
    <label className={cls} style={vars} onClick={click} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} onLostPointerCapture={() => { if (d.current?.moved) settle(); }}>
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
