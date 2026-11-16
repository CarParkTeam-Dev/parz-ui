import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { Icon, type IconSpec } from './Icon';
import './ParzMenu.css';
import './ParzBadge.css';

export type ParzBadgeVariant = 'solid' | 'soft' | 'outline' | 'glass';
export type ParzBadgeSize = 'sm' | 'md' | 'lg';
export type ParzBadgePlacement = 'top-end' | 'top-start' | 'bottom-end' | 'bottom-start';

/** Parz UI · Parz Badge — метка или счётчик: появляется каплей, число перекатывается, ширина перетекает. */
export interface ParzBadgeProps {
  /** Текст метки: «Новое», «Beta»… */
  label?: ReactNode;
  /** Число. Больше max — показывается «max+». 0 прячет бейдж (если не showZero). */
  count?: number;
  /** Максимум для count. По умолчанию 99. */
  max?: number;
  /** Показывать 0. По умолчанию нет. */
  showZero?: boolean;
  /** Точка без текста. */
  dot?: boolean;
  /** Мягкий пульс вокруг (удобно для точки «в сети» или «идёт запись»). */
  pulse?: boolean;
  /** Иконка перед текстом: встроенная, 'ms:имя', 'mi:имя' или свой ReactNode. */
  icon?: IconSpec;
  /** Вид. По умолчанию 'solid'. */
  variant?: ParzBadgeVariant;
  /** По умолчанию 'md'. */
  size?: ParzBadgeSize;
  /** Основной цвет. По умолчанию красный #ff4d5e. */
  color?: string;
  /** Цвет текста. */
  textColor?: string;
  /** Элемент, на который садится бейдж (кнопка, аватар…). Без него бейдж стоит в строке. */
  children?: ReactNode;
  /** Угол, если есть children. По умолчанию 'top-end'. */
  placement?: ParzBadgePlacement;
  /** Текст для экранных дикторов, например «3 новых сообщения». */
  ariaLabel?: string;
  className?: string;
  style?: CSSProperties;
}

const reduced = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
const LEAVE = 360; // мс — бейдж стягивается в каплю и исчезает

export function ParzBadge({
  label, count, max = 99, showZero = false, dot = false, pulse = false, icon, variant = 'solid', size = 'md',
  color, textColor, children, placement = 'top-end', ariaLabel, className, style
}: ParzBadgeProps) {
  const text: string | null = dot ? null
    : count != null ? (count > 0 || showZero ? (count > max ? `${max}+` : String(count)) : null)
    : null;
  const visible = dot || text != null || (label != null && label !== '') || icon !== undefined;

  // появление и исчезновение: при скрытии бейдж ещё немного живёт, чтобы плавно стянуться
  const [shown, setShown] = useState(visible);
  const [leaving, setLeaving] = useState(false);
  const lt = useRef(0);
  useEffect(() => {
    window.clearTimeout(lt.current);
    if (visible) { setShown(true); setLeaving(false); return; }
    if (!shown) return;
    if (reduced()) { setShown(false); return; }
    setLeaving(true);
    lt.current = window.setTimeout(() => { setShown(false); setLeaving(false); }, LEAVE);
    return () => window.clearTimeout(lt.current);
  }, [visible]);

  // последнее видимое содержимое — чтобы при исчезновении стягивалось то, что было, а не пустота
  const lastText = useRef(text);
  if (text != null) lastText.current = text;
  const shownText = text ?? (leaving ? lastText.current : null);

  // перекат числа: старое уезжает, новое въезжает; направление — по росту или убыванию
  const prev = useRef<{ text: string | null; n: number | undefined }>({ text: shownText, n: count });
  const [roll, setRoll] = useState<{ id: number; old: string; dir: 'up' | 'down' } | null>(null);
  const rid = useRef(0);
  if (prev.current.text !== shownText) {
    const old = prev.current.text, up = (count ?? 0) >= (prev.current.n ?? 0);
    prev.current = { text: shownText, n: count };
    if (old != null && shownText != null && !reduced()) {
      const id = ++rid.current;
      queueMicrotask(() => setRoll({ id, old, dir: up ? 'up' : 'down' }));
      window.setTimeout(() => setRoll(r => (r && r.id === id ? null : r)), 460);
    }
  }

  // ширина перетекает: меряем содержимое невидимой копией и задаём ширину явно
  const sizer = useRef<HTMLSpanElement>(null);
  const [w, setW] = useState<number | null>(null);
  useLayoutEffect(() => {
    const s = sizer.current;
    if (!s) return;
    // offsetWidth — без учёта transform: во время появления бейдж ещё сжат анимацией, а замер нужен настоящий
    const nw = Math.ceil(s.offsetWidth);
    setW(x => (x === nw ? x : nw));
  });

  const isDot = dot;
  const cls = ['pz-bd', `pz-bd--${variant}`, `pz-bd--${size}`, isDot && 'pz-bd--dot', pulse && 'is-pulse', leaving && 'is-leaving',
    children != null && `pz-bd--at pz-bd--${placement}`, className].filter(Boolean).join(' ');
  const vars = { ...(color && { '--pz-bd-color': color }), ...(textColor && { '--pz-bd-fg': textColor }), ...(w != null && !isDot && { '--pz-bd-w': `${w}px` }) } as CSSProperties;

  const content = (
    <>
      {icon !== undefined && !isDot && <span className="pz-bd-ico"><Icon icon={icon} /></span>}
      {label != null && label !== '' && !isDot && <span className="pz-bd-label">{label}</span>}
      {shownText != null && !isDot && (
        <span className="pz-bd-num">
          {roll && <span key={`o${roll.id}`} className={`pz-bd-n pz-bd-n--out-${roll.dir}`}>{roll.old}</span>}
          <span key={roll ? `i${roll.id}` : 'n'} className={`pz-bd-n${roll ? ` pz-bd-n--in-${roll.dir}` : ''}`}>{shownText}</span>
        </span>
      )}
    </>
  );

  const badge = shown ? (
    <span className={cls} style={children != null ? vars : { ...vars, ...style }} aria-hidden={ariaLabel ? true : undefined}>
      {/* невидимая копия содержимого для замера ширины */}
      {!isDot && <span className="pz-bd-sizer" ref={sizer} aria-hidden="true">
        {icon !== undefined && <span className="pz-bd-ico"><Icon icon={icon} /></span>}
        {label != null && label !== '' && <span className="pz-bd-label">{label}</span>}
        {shownText != null && <span className="pz-bd-n">{shownText}</span>}
      </span>}
      <span className="pz-bd-in">{content}</span>
    </span>
  ) : null;
  const sr = ariaLabel && visible ? <span className="pz-bd-sr">{ariaLabel}</span> : null;

  if (children != null) {
    return <span className={`pz-bd-anchor${className ? ` ${className}-anchor` : ''}`} style={style}>{children}{badge}{sr}</span>;
  }
  return <>{badge}{sr}</>;
}
