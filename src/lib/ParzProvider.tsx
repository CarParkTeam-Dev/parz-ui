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

/** Пресет из ближайшего ParzProvider; свой проп компонента важнее. */
export function useParzMotion(own?: ParzMotionPreset): ParzMotionSpec {
  const ctx = useContext(Ctx);
  return PARZ_MOTION_PRESETS[own ?? ctx];
}
