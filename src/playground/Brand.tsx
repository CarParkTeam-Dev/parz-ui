import { useEffect, useState } from 'react';
import { AnimoLogo } from '../lib';
import animatedRaw from './brand/parz-ui-animated.svg?raw';

/** Полный логотип из PARZ-UI-Logo-Pack (анимированная версия). Цвет — currentColor, правила :root из файла убраны,
 *  чтобы встроенный svg не перекрашивал всю страницу. */
const FULL = animatedRaw
  .replace(/:root\s*\{[^}]*\}/g, '')
  .replace(/@media\s*\(prefers-color-scheme:\s*dark\)\s*\{\s*\}/g, '')
  .replace(/<title>[\s\S]*?<\/title>/, '')
  .replace(/width="296" height="100"/, 'width="100%" height="auto"');

export function ParzLogo({ replay = 0, className }: { replay?: number; className?: string }) {
  return <span key={replay} className={`pz-full${className ? ' ' + className : ''}`} role="img" aria-label="PARZ UI — by CarPark Team" dangerouslySetInnerHTML={{ __html: FULL }} />;
}

/** Знак «P» из логопака: верх рисуется линией, нижняя черта въезжает — как в animated-версии. */
export function ParzMark({ size = 30 }: { size?: number }) {
  return (
    <svg className="pz-mark" width={size} height={size} viewBox="8 8 65 65" aria-hidden="true">
      <g fill="none" stroke="currentColor" strokeWidth="6.5" strokeLinecap="round" strokeLinejoin="round">
        <path className="pz-mark-top" d="M21 61V31C21 19 28 14 39 14H48C58 14 64 21 64 30C64 39 58 45 48 45H38" />
        <path className="pz-mark-accent" d="M39 56H58" />
      </g>
    </svg>
  );
}

/** Логотип в меню сайта: знак + живая надпись AnimoLogo. */
export function ParzBrand({ onClick }: { onClick?: () => void }) {
  return (
    <span className="pz-brand">
      <ParzMark />
      <AnimoLogo text="PARZ UI" size={16} spacing={0.22} onClick={onClick} ariaLabel="PARZ UI" />
    </span>
  );
}

/** Полноэкранный загрузчик при открытии главной: знак рисуется, под ним «Parz UI» с переливом, внизу подпись команды.
 *  Держится, пока знак дорисуется и загрузятся шрифты, потом плавно растворяется. */
export function Splash({ onDone, onLeave }: { onDone: () => void; onLeave?: () => void }) {
  const [leaving, setLeaving] = useState(false);
  useEffect(() => {
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const minShow = new Promise(r => setTimeout(r, reduce ? 300 : 1650));
    const fonts = (document as Document & { fonts?: FontFaceSet }).fonts?.ready ?? Promise.resolve();
    const cap = new Promise(r => setTimeout(r, 3500)); // шрифты долго — не держим дольше
    let t = 0, alive = true;
    Promise.all([minShow, Promise.race([fonts, cap])]).then(() => {
      if (!alive) return;
      setLeaving(true);
      onLeave?.();
      t = window.setTimeout(onDone, reduce ? 150 : 700);
    });
    return () => { alive = false; clearTimeout(t); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div className={`pz-splash${leaving ? ' is-leaving' : ''}`} role="status" aria-label="Parz UI">
      <div className="pz-splash-c">
        <ParzMark size={84} />
        <span className="pz-splash-name">Parz UI</span>
      </div>
      <p className="pz-splash-by">Crafted by <b>CarPark Team</b> &amp; <b>Dev.CarPark</b></p>
    </div>
  );
}
