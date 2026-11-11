import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type ReactNode } from 'react';
import './ParzCheckbox.css';

export type ParzCheckboxSize = 'sm' | 'md' | 'lg' | number;

/** Parz UI · Parz Checkbox — флажок с жидкой заливкой: капля цвета растекается по квадрату, галочка дорисовывается штрихом. */
export interface ParzCheckboxProps {
  /** Состояние (управляемый режим). */
  checked?: boolean;
  /** Начальное состояние (неуправляемый режим). */
  defaultChecked?: boolean;
  /** Вызывается при переключении — кликом или с клавиатуры. */
  onChange?: (checked: boolean) => void;
  /** «Частично выбрано» — вместо галочки чёрточка. Например, у «Выбрать все», когда выбрана часть списка. */
  indeterminate?: boolean;
  /** Подпись рядом с флажком. Без неё задайте ariaLabel. */
  label?: ReactNode;
  /** Мелкий поясняющий текст под подписью. */
  description?: ReactNode;
  /** С какой стороны подпись. По умолчанию 'end' (справа). */
  labelPosition?: 'start' | 'end';
  disabled?: boolean;
  /** Ошибка: рамка и заливка красным, например «нужно согласиться с условиями». */
  invalid?: boolean;
  /** 'sm' | 'md' | 'lg' или сторона квадрата в px. По умолчанию 'md' (20 px). */
  size?: ParzCheckboxSize;
  /** Скругление углов в px. По умолчанию — треть от размера. */
  radius?: number;
  /** Цвет заливки, когда отмечен. */
  accent?: string;
  /** Цвет рамки, когда не отмечен. */
  borderColor?: string;
  /** Цвет галочки. */
  checkColor?: string;
  /** Подпись для экранных дикторов, если нет видимой label. */
  ariaLabel?: string;
  name?: string;
  value?: string;
  id?: string;
  className?: string;
  style?: CSSProperties;
}

const SIZES = { sm: 16, md: 20, lg: 26 };

export function ParzCheckbox({
  checked, defaultChecked = false, onChange, indeterminate = false, label, description, labelPosition = 'end', disabled = false, invalid = false,
  size = 'md', radius, accent, borderColor, checkColor, ariaLabel, name, value, id, className, style
}: ParzCheckboxProps) {
  const [inner, setInner] = useState(defaultChecked);
  const on = checked ?? inner;
  const [moved, setMoved] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => { if (input.current) input.current.indeterminate = indeterminate; }, [indeterminate]);

  const s = typeof size === 'number' ? size : SIZES[size];
  const filled = on || indeterminate;

  const set = (v: boolean) => {
    if (disabled) return;
    setMoved(true);
    if (checked === undefined) setInner(v);
    onChange?.(v);
  };
  const key = (e: KeyboardEvent<HTMLInputElement>) => { if (e.key === 'Enter') { e.preventDefault(); set(!on); } };

  const vars = {
    '--pz-cb-s': `${s}px`, '--pz-cb-r': `${radius ?? Math.round(s / 3.4)}px`,
    ...(accent && { '--pz-cb-accent': accent }),
    ...(borderColor && { '--pz-cb-border': borderColor }),
    ...(checkColor && { '--pz-cb-check': checkColor }),
    ...style
  } as CSSProperties;

  const cls = ['pz-cb', filled && 'is-on', indeterminate && 'is-mixed', disabled && 'is-disabled', invalid && 'is-invalid', moved && 'is-moved',
    labelPosition === 'start' && 'pz-cb--start', className].filter(Boolean).join(' ');

  return (
    <label className={cls} style={vars}>
      <span className="pz-cb-box">
        <input ref={input} type="checkbox" className="pz-cb-in" checked={on} disabled={disabled} aria-label={ariaLabel} aria-invalid={invalid || undefined}
          aria-checked={indeterminate ? 'mixed' : on} name={name} value={value} id={id} onChange={e => set(e.target.checked)} onKeyDown={key} />
        <span className="pz-cb-ring" aria-hidden="true" />
        <span className="pz-cb-fill" aria-hidden="true" />
        <svg className="pz-cb-mark" viewBox="0 0 20 20" aria-hidden="true">
          <path className="pz-cb-tick" d="M5 10.4 8.6 14 15.2 6.6" pathLength={1} />
          <path className="pz-cb-dash" d="M5.5 10h9" pathLength={1} />
        </svg>
      </span>
      {(label != null && label !== '') || description ? (
        <span className="pz-cb-text">
          {label != null && label !== '' && <span className="pz-cb-label">{label}</span>}
          {description && <span className="pz-cb-desc">{description}</span>}
        </span>
      ) : null}
    </label>
  );
}
