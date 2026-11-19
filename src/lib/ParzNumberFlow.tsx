import { useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { parzSpringCss, useParzMotion, type ParzMotionPreset } from './ParzProvider';
import './ParzNumberFlow.css';

export type ParzNumberFlowDirection = 'auto' | 'up' | 'down';

/** Parz UI · Parz Number Flow — число или текст, где каждый знак меняется отдельно: старый уезжает с размытием, новый въезжает на пружине. */
export interface ParzNumberFlowProps {
  /** Число или строка ('08:30', '$1 200'). */
  value: number | string;
  /** Как превратить число в строку. По умолчанию — toLocaleString(locale, formatOptions). */
  format?: (value: number) => string;
  /** Язык для числа. По умолчанию из браузера. */
  locale?: string;
  /** Intl.NumberFormat: валюта, проценты, знаки после запятой. */
  formatOptions?: Intl.NumberFormatOptions;
  /** Куда едут цифры: 'auto' — вверх, когда значение растёт. По умолчанию 'auto'. */
  direction?: ParzNumberFlowDirection;
  /** Цифры одинаковой ширины, чтобы строка не прыгала. По умолчанию true. */
  tabular?: boolean;
  /** Сила размытия на ходу, px. По умолчанию 6; 0 — без размытия. */
  blur?: number;
  /** Пресет движения. По умолчанию из ParzProvider. */
  motion?: ParzMotionPreset;
  /** Как меняются слова: 'auto' — короткие (до 8 букв) по буквам с прокруткой по алфавиту, длинные — кусками; 'letters'; 'chunks'. По умолчанию 'auto'. */
  words?: 'auto' | 'letters' | 'chunks';
  /** Объявлять новое значение экранным дикторам (aria-live="polite"). */
  live?: boolean;
  className?: string;
  style?: CSSProperties;
}

type Cell = { key: number; ch: string; gone?: boolean; fresh?: boolean };
type Layer = { id: number; ch: string; out?: boolean; dir?: 1 | -1 };

/* алфавиты: буква крутится через соседние, как табло */
const ALPHABETS = ['abcdefghijklmnopqrstuvwxyz', 'абвгдеёжзийклмнопрстуфхцчшщъыьэюя', 'աբգդեզէըթժիլխծկհձղճմյնշոչպջռսվտրցւփքօֆ'];
const alphaOf = (c: string) => ALPHABETS.find(al => al.includes(c.toLowerCase()));
const pick = (al: string, not: string[], upper: boolean) => {
  let c = al[Math.floor(Math.random() * al.length)];
  for (let k = 0; k < 4 && not.includes(c); k++) c = al[Math.floor(Math.random() * al.length)];
  return upper ? c.toUpperCase() : c;
};
function alphaPath(a: string, b: string): { dir: 1 | -1; hops: string[] } | null {
  const la = a.toLowerCase(), lb = b.toLowerCase();
  const A = alphaOf(a), B = alphaOf(b);
  if (A && B && A !== B) {
    // разные языки: крутим случайными буквами старого алфавита, потом нового — и встаём на нужную
    const ua = a !== la, ub = b !== lb, hops: string[] = [];
    hops.push(pick(A, [la], ua), pick(A, [la, hops[0]?.toLowerCase()], ua));
    hops.push(pick(B, [lb], ub), pick(B, [lb, hops[2]?.toLowerCase()], ub));
    return { dir: 1, hops };
  }
  for (const al of ALPHABETS) {
    const i = al.indexOf(la), j = al.indexOf(lb);
    if (i < 0 || j < 0 || i === j) continue;
    const dir: 1 | -1 = j > i ? 1 : -1, dist = Math.abs(j - i);
    // до трёх промежуточных букв, ровно по пути
    const n = Math.min(3, dist - 1), hops: string[] = [];
    for (let k = 1; k <= n; k++) {
      const c = al[i + dir * Math.round((dist * k) / (n + 1))];
      hops.push(b !== lb ? c.toUpperCase() : c); // регистр — как у новой буквы
    }
    return { dir, hops };
  }
  return null;
}
const HOP_MS = 60;
const reduced = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
const numOf = (v: number | string) => (typeof v === 'number' ? v : parseFloat(String(v).replace(/[^\d.-]/g, '')));

/** Один знак: текущий — в потоке, уходящие — поверх, ширина плавно подстраивается. */
function Slot({ ch, gone, fresh, dir, alpha, spring, blur, onGone }: { ch: string; gone?: boolean; fresh?: boolean; dir: 1 | -1; alpha?: boolean; spring: { easing: string; ms: number }; blur: number; onGone: () => void }) {
  const cur = gone ? '' : ch;
  // новая буква в слове начинает с пустого места и докручивается до себя
  const [layers, setLayers] = useState<Layer[]>(() => [{ id: fresh ? 1 : 0, ch: fresh && alpha ? '' : cur }]);
  const last = layers[layers.length - 1];
  const changedAt = useRef(0);
  const hopT = useRef<number[]>([]);
  const push = (c: string, d: 1 | -1) => setLayers(ls => { const top = ls[ls.length - 1]; return [{ ...top, out: true }, { id: top.id + 1, ch: c, dir: d }]; });
  // знак сменился: старый слой уходит, новый приходит; если новый ещё только въезжает — меняем его на месте
  useLayoutEffect(() => {
    if (last.ch === cur && !hopT.current.length) return;
    hopT.current.forEach(t => window.clearTimeout(t)); hopT.current = [];
    const now = performance.now(), young = now - changedAt.current < 70 && layers.length > 1;
    changedAt.current = now;
    let path = alpha && !young && !reduced() && last.ch.length === 1 && cur.length === 1 ? alphaPath(last.ch, cur) : null;
    // буква появляется или пропадает (имена разной длины) — тоже крутится случайными буквами своего алфавита
    if (!path && alpha && !young && !reduced() && (last.ch === '' || cur === '') && (last.ch + cur).length === 1) {
      const c = last.ch || cur, al = alphaOf(c);
      if (al) { const up = c !== c.toLowerCase(); path = { dir: 1, hops: [pick(al, [c.toLowerCase()], up), pick(al, [c.toLowerCase()], up)] }; }
    }
    if (path) {
      // буква прокручивается по алфавиту: через соседние к нужной
      const seq = [...path.hops, cur];
      seq.forEach((c, k) => {
        if (k === 0) push(c, path.dir);
        else hopT.current.push(window.setTimeout(() => { push(c, path.dir); if (k === seq.length - 1) hopT.current = []; }, k * HOP_MS));
      });
      return;
    }
    if (young) setLayers(ls => ls.map((l, i) => (i === ls.length - 1 ? { ...l, ch: cur } : l)));
    else push(cur, dir);
  }, [cur]);
  useLayoutEffect(() => () => hopT.current.forEach(t => window.clearTimeout(t)), []);
  const box = useRef<HTMLSpanElement>(null);
  const w = useRef<number | null>(fresh ? 0 : null);
  useLayoutEffect(() => {
    const b = box.current; if (!b) return;
    const quiet = reduced();
    b.getAnimations().forEach(a => a.cancel());
    const nw = b.getBoundingClientRect().width;
    const ow = w.current ?? nw;
    w.current = nw;
    if (!quiet && Math.abs(ow - nw) > 0.5) b.animate([{ width: `${ow}px` }, { width: `${nw}px` }], { duration: spring.ms, easing: spring.easing });
    if (gone) {
      const t = window.setTimeout(onGone, quiet ? 0 : spring.ms);
      return () => window.clearTimeout(t);
    }
  }, [last.id, gone]);
  return (
    <span className="pz-nf-slot" ref={box}>
      {layers.map(l => (
        <Glyph key={l.id} ch={l.ch} out={!!l.out} first={l.id === 0} dir={l.dir ?? dir} spring={l.dir && hopT.current.length ? fast(spring) : spring} blur={blur}
          onDone={() => setLayers(ls => ls.filter(x => x.id !== l.id))} />
      ))}
    </span>
  );
}

/* промежуточные буквы мелькают быстрее */
const fast = (sp: { easing: string; ms: number }) => ({ easing: 'cubic-bezier(.3,.7,.4,1)', ms: Math.min(sp.ms, 220) });

/* Сдвиг слоя сейчас, в em: чтобы прерванное движение продолжалось с того же места, без рывка. */
function shiftNow(e: HTMLElement) {
  const m = new DOMMatrixReadOnly(getComputedStyle(e).transform === 'none' ? undefined : getComputedStyle(e).transform);
  const fs = parseFloat(getComputedStyle(e).fontSize) || 16;
  return { y: m.m42 / fs, o: parseFloat(getComputedStyle(e).opacity) };
}

function Glyph({ ch, out, first, dir, spring, blur, onDone }: { ch: string; out: boolean; first: boolean; dir: 1 | -1; spring: { easing: string; ms: number }; blur: number; onDone: () => void }) {
  const el = useRef<HTMLSpanElement>(null);
  const dirAtStart = useRef(dir);
  // вход: снизу (или сверху) в окошко, как барабан
  useLayoutEffect(() => {
    const e = el.current; if (!e || first || reduced()) return;
    const d = dirAtStart.current;
    e.animate([{ transform: `translateY(${d}em)` }, { transform: 'translateY(0)' }], { duration: spring.ms, easing: spring.easing });
    e.animate([{ opacity: 0, filter: `blur(${blur}px)` }, { opacity: 1, filter: 'blur(0px)' }], { duration: spring.ms * 0.55, easing: 'cubic-bezier(.25,.6,.3,1)', fill: 'backwards' });
  }, []);
  // выход: продолжает с того места, где был, и уезжает за край окошка
  useLayoutEffect(() => {
    const e = el.current; if (!e || !out) return;
    if (reduced()) { onDone(); return; }
    const d = dir;
    const from = shiftNow(e);
    e.getAnimations().forEach(x => x.cancel());
    e.animate([{ transform: `translateY(${from.y}em)` }, { transform: `translateY(${-d}em)` }], { duration: spring.ms, easing: spring.easing, fill: 'forwards' });
    const a = e.animate([{ opacity: from.o, filter: 'blur(0px)' }, { opacity: 0, filter: `blur(${blur}px)` }], { duration: spring.ms * 0.45, easing: 'cubic-bezier(.4,0,.8,.6)', fill: 'forwards' });
    a.onfinish = onDone;
    return () => { a.onfinish = null; };
  }, [out]);
  return <span ref={el} className={`pz-nf-g${out ? ' is-out' : ''}`}>{ch || '​'}</span>;
}

/** Слово длиннее 8 букв — кусками по 3; пробелы — отдельно. */
function chunk(text: string) {
  const out: string[] = [];
  for (const part of text.split(/(\s+)/)) {
    if (!part) continue;
    if (/^\s+$/.test(part)) { out.push(part); continue; }
    const cs = [...part];
    for (let i = 0; i < cs.length; i += 3) out.push(cs.slice(i, i + 3).join(''));
  }
  return out;
}

export function ParzNumberFlow({ value, format, locale, formatOptions, direction = 'auto', tabular = true, blur = 6, motion, words = 'auto', live, className, style }: ParzNumberFlowProps) {
  const spec = useParzMotion(motion);
  const spring = parzSpringCss({ ...spec, damping: Math.max(spec.damping, 2 * Math.sqrt(spec.stiffness) * 0.82) });
  const text = typeof value === 'number' ? (format ? format(value) : value.toLocaleString(locale, formatOptions)) : value;
  // слова (без цифр): короткие — по буквам с алфавитом, длинные — кусками; выравнивание слева
  const wordy = typeof value === 'string' && !/\d/.test(text);
  const useChunks = wordy && (words === 'chunks' || (words === 'auto' && [...text].length > 8));
  const chars = useChunks ? chunk(text) : [...text];

  const prevNum = useRef(numOf(value));
  const [dir, setDir] = useState<1 | -1>(1);
  const [cells, setCells] = useState<Cell[]>(() => chars.map((ch, i) => ({ key: chars.length - 1 - i, ch })));
  const [lastText, setLastText] = useState(text);
  const nextKey = useRef(chars.length);

  if (text !== lastText) {
    const n = numOf(value);
    const d: 1 | -1 = direction === 'up' ? 1 : direction === 'down' ? -1 : (Number.isFinite(n) && Number.isFinite(prevNum.current) && n < prevNum.current ? -1 : 1);
    prevNum.current = n;
    // числа — по месту справа (единицы остаются единицами), слова — слева
    const alive = cells.filter(c => !c.gone);
    const out: Cell[] = [];
    const len = Math.max(chars.length, alive.length);
    for (let r = len - 1; r >= 0; r--) {
      const ci = wordy ? len - 1 - r : chars.length - 1 - r, ai = wordy ? len - 1 - r : alive.length - 1 - r;
      if (wordy && ci >= chars.length && ai >= alive.length) continue;
      const old = ai >= 0 && ai < alive.length ? alive[ai] : null;
      if (ci >= 0 && ci < chars.length) out.push(old ? { key: old.key, ch: chars[ci] } : { key: nextKey.current++, ch: chars[ci], fresh: true });
      else if (old) out.push({ ...old, gone: true });
    }
    setDir(d); setLastText(text); setCells(out);
  }

  return (
    <span className={`pz-nf${tabular ? ' pz-nf--tab' : ''}${className ? ' ' + className : ''}`} style={style}>
      <span className="pz-nf-sr" aria-live={live ? 'polite' : undefined}>{text}</span>
      <span className="pz-nf-row" aria-hidden="true">
        {cells.map(c => (
          <Slot key={c.key} ch={c.ch} gone={c.gone} fresh={c.fresh} dir={dir} alpha={wordy && !useChunks && direction === 'auto'} spring={spring} blur={blur}
            onGone={() => setCells(cs => cs.filter(x => x.key !== c.key))} />
        ))}
      </span>
    </span>
  );
}
