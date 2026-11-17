import { useId, useState, type CSSProperties, type ReactNode } from 'react';
import './ParzExpander.css';

/** Parz UI · Parz Expander — секция, которая плавно раскрывается: высота «растекается», содержимое проявляется. */
export type ParzExpanderVariant = 'plain' | 'card';

export interface ParzExpanderProps {
  /** Заголовок — кнопка раскрытия. */
  title: ReactNode;
  children?: ReactNode;
  /** Открыта (управляемый режим). */
  open?: boolean;
  /** Открыта при появлении (неуправляемый режим). По умолчанию false. */
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  disabled?: boolean;
  /** 'plain' — секция с линией снизу; 'card' — стеклянная карточка, соседние карточки склеиваются в одну группу. По умолчанию 'plain'. */
  variant?: ParzExpanderVariant;
  /** Показывать нижнюю линию-разделитель. По умолчанию да. */
  divider?: boolean;
  /** Цвет заголовка. */
  color?: string;
  /** Цвет стрелки. */
  chevronColor?: string;
  /** Цвет линии-разделителя. */
  dividerColor?: string;
  id?: string;
  className?: string;
  style?: CSSProperties;
}

export function ParzExpander({
  title, children, open, defaultOpen = false, onOpenChange, disabled = false, divider = true, variant = 'plain',
  color, chevronColor, dividerColor, id, className, style
}: ParzExpanderProps) {
  const [inner, setInner] = useState(defaultOpen);
  const on = open ?? inner;
  const auto = useId();
  const bodyId = `${id ?? auto}-body`;
  const toggle = () => { if (disabled) return; if (open === undefined) setInner(!on); onOpenChange?.(!on); };
  const vars: Record<string, string> = {};
  if (color) vars['--pz-ex-fg'] = color;
  if (chevronColor) vars['--pz-ex-chev'] = chevronColor;
  if (dividerColor) vars['--pz-ex-line'] = dividerColor;
  return (
    <section id={id} className={['pz-ex', on && 'is-open', variant === 'card' && 'pz-ex--card', !divider && 'pz-ex--flat', disabled && 'is-disabled', className].filter(Boolean).join(' ')}
      style={{ ...vars, ...style } as CSSProperties}>
      <button type="button" className="pz-ex-h" aria-expanded={on} aria-controls={bodyId} disabled={disabled} onClick={toggle}>
        <span className="pz-ex-t">{title}</span><span className="pz-ex-chev" aria-hidden="true" />
      </button>
      {/* раскрытие — через grid-rows 0fr→1fr: браузер сам считает высоту, без замеров и рывков */}
      <div className="pz-ex-w" id={bodyId} {...(on ? {} : { inert: '' }) as object}>
        <div className="pz-ex-c"><div className="pz-ex-b">{children}</div></div>
      </div>
    </section>
  );
}
