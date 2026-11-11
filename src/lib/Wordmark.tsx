import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react';
import './Wordmark.css';

/** Parz UI · AnimoLogo — живой логотип-надпись (из Meridian). Каждая буква — отдельный «огонёк». */
export interface AnimoLogoProps {
  /** Текст логотипа. По умолчанию 'PARZ'. */
  text?: string;
  /** Анимация появления при монтировании: буквы выплывают из размытия, по ним проходит блик. По умолчанию да. */
  intro?: boolean;
  /** Задержка перед появлением, мс. */
  introDelay?: number;
  /** Редкое мерцание букв в покое. По умолчанию да. */
  idle?: boolean;
  /** Волна акцентного цвета при наведении мышью. По умолчанию да. */
  hoverWave?: boolean;
  /** Удержание: буквы сходятся и гаснут, снизу заполняется линия, по окончании — загораются акцентом. По умолчанию да. */
  holdEffect?: boolean;
  /** Сколько держать до «заполнения», мс. */
  holdDuration?: number;
  /** Удержали до конца — например, открыть секретное меню или «О приложении». */
  onHoldComplete?: () => void;
  /** Обычное нажатие (клик или Enter). Если есть — логотип становится кнопкой. */
  onClick?: () => void;
  /** Размер букв: число (px) или любая CSS-величина. По умолчанию 13. */
  size?: number | string;
  /** Цвет крайних (тусклых) букв. */
  dimColor?: string;
  /** Цвет центральных (ярких) букв. */
  brightColor?: string;
  /** Цвет при наведении. */
  hoverColor?: string;
  /** Акцент: волна, линия удержания, свечение. */
  accent?: string;
  /** Межбуквенный интервал, em. По умолчанию 0.34. */
  spacing?: number;
  ariaLabel?: string;
  className?: string;
  style?: CSSProperties;
}

export function AnimoLogo({
  text = 'PARZ', intro = true, introDelay = 150, idle = true, hoverWave = true, holdEffect = true, holdDuration = 1000,
  onHoldComplete, onClick, size = 13, dimColor, brightColor, hoverColor, accent, spacing, ariaLabel, className, style
}: AnimoLogoProps) {
  const chars = [...text];
  const mid = (chars.length - 1) / 2 || 1;
  const [state, setState] = useState<{ intro: boolean; wave: number; hold: boolean; full: boolean; pop: boolean }>({ intro, wave: 0, hold: false, full: false, pop: false });
  const t = useRef({ intro: 0, wave: 0, hold: 0, pop: 0 });
  const holdRef = useRef(false);

  // появление: длительность = задержка + каскад букв + блик
  useEffect(() => {
    if (!intro) return;
    setState(s => ({ ...s, intro: true }));
    const ms = introDelay + chars.length * 70 + 1700;
    t.current.intro = window.setTimeout(() => setState(s => ({ ...s, intro: false })), ms);
    return () => window.clearTimeout(t.current.intro);
  }, [intro, introDelay, text]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => () => Object.values(t.current).forEach(id => window.clearTimeout(id)), []);

  const wave = () => {
    if (!hoverWave || holdRef.current || state.intro) return;
    // новый ключ перезапускает CSS-анимацию, не обрывая остальное
    setState(s => ({ ...s, wave: s.wave + 1 }));
    window.clearTimeout(t.current.wave);
    t.current.wave = window.setTimeout(() => setState(s => ({ ...s, wave: 0 })), 700 + chars.length * 55);
  };
  const down = () => {
    if (!holdEffect) return;
    holdRef.current = true;
    window.clearTimeout(t.current.pop);
    setState(s => ({ ...s, pop: false, hold: true }));
    t.current.hold = window.setTimeout(() => { setState(s => ({ ...s, full: true })); onHoldComplete?.(); }, holdDuration);
  };
  const up = () => {
    if (!holdRef.current) return;
    holdRef.current = false;
    window.clearTimeout(t.current.hold);
    setState(s => ({ ...s, hold: false, full: false, pop: true }));
    t.current.pop = window.setTimeout(() => setState(s => ({ ...s, pop: false })), 480);
  };

  const cls = ['pz-wm', state.intro && 'is-intro', state.wave && 'is-wave', state.hold && 'is-hold', state.full && 'is-full', state.pop && 'is-pop', !idle && 'no-idle', onClick && 'is-btn', className].filter(Boolean).join(' ');
  const vars: Record<string, string | number> = { '--pz-size': typeof size === 'number' ? `${size}px` : size, '--pz-hold': `${holdDuration}ms`, '--pz-intro': `${introDelay}ms` };
  if (dimColor) vars['--pz-dim'] = dimColor;
  if (brightColor) vars['--pz-bright'] = brightColor;
  if (hoverColor) vars['--pz-hover'] = hoverColor;
  if (accent) vars['--pz-accent'] = accent;
  if (spacing != null) vars['--pz-gap'] = `${spacing}em`;

  return (
    <span
      className={cls}
      style={{ ...vars, ...style } as CSSProperties}
      role={onClick ? 'button' : 'img'}
      tabIndex={onClick ? 0 : undefined}
      aria-label={ariaLabel ?? text}
      onClick={onClick}
      onKeyDown={onClick ? (e: KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } } : undefined}
      onPointerEnter={e => { if (e.pointerType === 'mouse') wave(); }}
      onPointerDown={down}
      onPointerUp={up}
      onPointerLeave={up}
      onPointerCancel={up}
      onContextMenu={e => holdEffect && e.preventDefault()}
    >
      {chars.map((c, i) => (
        <span
          key={`${i}-${state.wave}`}
          aria-hidden="true"
          style={{ '--i': i, '--b': (1 - Math.abs(i - mid) / mid).toFixed(2), '--c': (mid - i).toFixed(2) } as CSSProperties}
        >{c === ' ' ? ' ' : c}</span>
      ))}
    </span>
  );
}

/** Старое имя — оставлено для совместимости. */
export const Wordmark = AnimoLogo;
export type WordmarkProps = AnimoLogoProps;
