import { isValidElement, type ReactNode } from 'react';
import { BUILTIN_ICONS } from './icons';

/**
 * Иконка пункта меню. Варианты:
 *  - 'film', 'ticket', 'pin', 'bell'…      — встроенные иконки (как в Meridian): контур, у активного — заливка
 *  - 'ms:home' / 'ms:home:outlined'          — Material Symbols (Rounded по умолчанию; стиль: rounded | outlined | sharp).
 *                                              У активного пункта заливка плавно перетекает (FILL 0 → 1)
 *  - 'mi:home' / 'mi:home:outlined'          — классические Material Icons (filled | outlined | round | sharp | two-tone)
 *  - любой ReactNode                          — своя иконка (svg, картинка, компонент из любой библиотеки)
 */
export type IconSpec = string | ReactNode;

const MS_STYLES = { rounded: 'Rounded', outlined: 'Outlined', sharp: 'Sharp' } as const;
const MI_STYLES = { filled: '', outlined: 'Outlined', round: 'Round', sharp: 'Sharp', 'two-tone': 'Two Tone' } as const;
type MsStyle = keyof typeof MS_STYLES;
type MiStyle = keyof typeof MI_STYLES;

export function parseIcon(spec: IconSpec): { kind: 'builtin'; name: string } | { kind: 'ms'; name: string; style: MsStyle } | { kind: 'mi'; name: string; style: MiStyle } | { kind: 'node' } {
  if (typeof spec !== 'string') return { kind: 'node' };
  const [pfx, name, style] = spec.split(':');
  if (pfx === 'ms' && name) return { kind: 'ms', name, style: (style in MS_STYLES ? style : 'rounded') as MsStyle };
  if (pfx === 'mi' && name) return { kind: 'mi', name, style: (style in MI_STYLES ? style : 'filled') as MiStyle };
  return { kind: 'builtin', name: spec };
}

/** Подключает шрифт Material Symbols / Material Icons с Google Fonts (один раз на страницу). */
export function loadMaterialFont(kind: 'ms' | 'mi', style = kind === 'ms' ? 'rounded' : 'filled') {
  if (typeof document === 'undefined') return;
  const fam = kind === 'ms'
    ? `Material+Symbols+${(MS_STYLES[style as MsStyle] || 'Rounded').replace(' ', '+')}:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200`
    : `Material+Icons${MI_STYLES[style as MiStyle] ? '+' + MI_STYLES[style as MiStyle].replace(' ', '+') : ''}`;
  const id = 'ltb-font-' + fam.replace(/[^a-z0-9]/gi, '');
  if (document.getElementById(id)) return;
  const l = document.createElement('link');
  l.id = id; l.rel = 'stylesheet';
  l.href = `https://fonts.googleapis.com/css2?family=${fam}&display=block`;
  document.head.appendChild(l);
}

/** Шрифт-класс, который ждёт Google Fonts для каждого стиля. */
const msClass = (s: MsStyle) => 'material-symbols-' + s;
const miClass = (s: MiStyle) => (s === 'filled' ? 'material-icons' : 'material-icons-' + s);

function Svg({ body, cls }: { body: string; cls: string }) {
  return (
    <svg className={cls} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.1} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: body }} />
  );
}

/**
 * Рисует иконку. `activeIcon` — отдельная иконка для активного состояния (необязательно):
 * у встроенных и Material Symbols активный вид и так есть (заливка).
 */
export function Icon({ icon, activeIcon }: { icon: IconSpec; activeIcon?: IconSpec }) {
  // своя иконка для активного состояния: показываем обе, CSS переключает
  if (activeIcon !== undefined) {
    return (
      <span className="ltb-icon ltb-icon--pair">
        <span className="ltb-off"><Single spec={icon} /></span>
        <span className="ltb-on"><Single spec={activeIcon} /></span>
      </span>
    );
  }
  return <span className="ltb-icon"><Single spec={icon} dual /></span>;
}

function Single({ spec, dual }: { spec: IconSpec; dual?: boolean }) {
  const p = parseIcon(spec);
  if (p.kind === 'node') return <>{isValidElement(spec) || spec != null ? spec : null}</>;
  if (p.kind === 'ms') return <span className={`${msClass(p.style)} ltb-ms`} aria-hidden="true">{p.name}</span>;
  if (p.kind === 'mi') return <span className={`${miClass(p.style)} ltb-mi`} aria-hidden="true">{p.name}</span>;
  const v = BUILTIN_ICONS[p.name];
  if (!v) return <span className="ltb-missing" title={`Нет иконки «${p.name}»`}>?</span>;
  const outline = v[0] || v[1]!, solid = v[1] || v[0]!;
  if (!dual) return <Svg body={outline} cls="ltb-svg" />;
  return (
    <>
      <Svg body={outline} cls="ltb-svg ltb-o" />
      <Svg body={solid} cls="ltb-svg ltb-s" />
    </>
  );
}
