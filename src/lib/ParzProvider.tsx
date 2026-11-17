import { createContext, useContext, type ReactNode } from 'react';

/** Parz UI · пресеты движения. calm — мягко, без перелёта; bouncy — живая пружина с лёгким перелётом; snappy — быстро и чётко. */
export type ParzMotionPreset = 'calm' | 'bouncy' | 'snappy';

export interface ParzMotionSpec {
  /** Жёсткость пружины. */
  stiffness: number;
  /** Затухание пружины. */
  damping: number;
  /** Сила «жидкой» деформации от скорости, 0…1. */
  squish: number;
}

export const PARZ_MOTION_PRESETS: Record<ParzMotionPreset, ParzMotionSpec> = {
  calm: { stiffness: 120, damping: 22, squish: 0.5 },
  bouncy: { stiffness: 210, damping: 18, squish: 1 },
  snappy: { stiffness: 380, damping: 34, squish: 0.35 }
};

const Ctx = createContext<ParzMotionPreset>('bouncy');

export interface ParzProviderProps {
  /** Пресет движения для всех новых компонентов внутри. По умолчанию 'bouncy'. */
  motion?: ParzMotionPreset;
  children?: ReactNode;
}

/** Parz UI · ParzProvider — общий пресет движения. Поддерживается компонентами начиная с Parz Days. */
export function ParzProvider({ motion = 'bouncy', children }: ParzProviderProps) {
  return <Ctx.Provider value={motion}>{children}</Ctx.Provider>;
}

/** Пружина пресета как CSS-переход: кривая linear() по шагам настоящей пружины и её длительность.
 *  Нужна компонентам, у которых движение идёт через CSS, а не через кадры JS. */
const springCache = new Map<string, { easing: string; ms: number }>();
export function parzSpringCss(spec: ParzMotionSpec): { easing: string; ms: number } {
  const key = `${spec.stiffness}/${spec.damping}`;
  const hit = springCache.get(key);
  if (hit) return hit;
  const h = 1 / 240, pts: number[] = [];
  let x = 0, v = 0, t = 0, still = 0;
  while (t < 2.5) {
    const a = -spec.stiffness * (x - 1) - spec.damping * v;
    v += a * h; x += v * h; t += h;
    pts.push(x);
    still = Math.abs(1 - x) < 0.002 && Math.abs(v) < 0.02 ? still + 1 : 0;
    if (still > 12) break;
  }
  const n = 48, step = (pts.length - 1) / n, out: string[] = [];
  for (let i = 0; i <= n; i++) out.push(i === n ? '1' : String(Math.round(pts[Math.round(i * step)] * 1000) / 1000));
  const supports = typeof CSS !== 'undefined' && CSS.supports?.('transition-timing-function', 'linear(0, 1)');
  const r = { easing: supports ? `linear(0, ${out.slice(1).join(', ')})` : 'cubic-bezier(.34,1.3,.64,1)', ms: Math.round(t * 1000) };
  springCache.set(key, r);
  return r;
}

/** Пресет из ближайшего ParzProvider; свой проп компонента важнее. */
export function useParzMotion(own?: ParzMotionPreset): ParzMotionSpec {
  const ctx = useContext(Ctx);
  return PARZ_MOTION_PRESETS[own ?? ctx];
}
