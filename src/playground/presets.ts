import { DEFAULT_THEME, type LiquidTabBarTheme } from '../lib';

export type Preset = { id: string; name: string; theme: LiquidTabBarTheme; page: string };

const t = (o: Partial<LiquidTabBarTheme>): LiquidTabBarTheme => ({ ...DEFAULT_THEME, ...o });

/** Готовые темы для площадки. page — фон «экрана» в превью, чтобы было видно стекло. */
export const PRESETS: Preset[] = [
  { id: 'meridian', name: 'CarPark', theme: t({}), page: '#09090b' },
  {
    id: 'light', name: 'Светлая', page: '#eef0f4',
    theme: t({
      // светлое стекло: блик сверху белый, тень снизу почти не видна; активный пункт — белая «таблетка» с мягкой тенью
      accent: '#2563eb', text: '#71717a', textActive: '#0f0f12',
      surfaceTop: 'rgba(255,255,255,0.72)', surfaceBottom: 'rgba(246,247,250,0.82)', border: 'rgba(15,23,42,0.06)',
      bevelTop: 'rgba(255,255,255,0.95)', bevelBottom: 'rgba(15,23,42,0.05)',
      highlightTop: '#ffffff', highlightBottom: 'rgba(255,255,255,0.92)',
      highlightShadow: '0 1px 2px rgba(15,23,42,0.06),0 4px 14px -4px rgba(15,23,42,0.16),inset 0 0 0 1px rgba(15,23,42,0.04)',
      actionBg: 'rgba(15,23,42,0.05)', actionActiveBg: '#0f0f12', actionActiveText: '#ffffff', actionAccentBg: '#2563eb', actionAccentText: '#ffffff',
      badgeBg: '#e11d48', badgeRing: '#ffffff', avatarFrom: '#60a5fa', avatarTo: '#2563eb', avatarText: '#ffffff',
      shadow: '0 10px 30px -12px rgba(15,23,42,0.22),0 2px 6px -2px rgba(15,23,42,0.08)',
      headerTop: 'rgba(238,240,244,0.94)', headerMid: 'rgba(238,240,244,0.76)', searchBg: 'rgba(15,23,42,0.05)', searchBorder: 'rgba(15,23,42,0.08)'
    })
  },
  {
    id: 'ocean', name: 'Океан', page: '#06111c',
    theme: t({
      accent: '#38bdf8', text: '#7aa3bf', textActive: '#e0f2fe',
      surfaceTop: 'rgba(14,36,56,0.84)', surfaceBottom: 'rgba(6,18,30,0.92)', border: 'rgba(125,211,252,0.12)',
      highlightTop: 'rgba(56,189,248,0.3)', highlightBottom: 'rgba(56,189,248,0.1)',
      actionBg: 'rgba(56,189,248,0.1)', actionActiveBg: '#e0f2fe', actionActiveText: '#082f49', actionAccentBg: '#38bdf8', actionAccentText: '#082f49',
      badgeBg: '#f97316', badgeRing: '#0b2133', avatarFrom: '#38bdf8', avatarTo: '#1d4ed8', avatarText: '#ffffff',
      headerTop: 'rgba(6,17,28,0.95)', headerMid: 'rgba(6,17,28,0.8)', searchBg: 'rgba(56,189,248,0.08)', searchBorder: 'rgba(125,211,252,0.14)'
    })
  },
  {
    id: 'sunset', name: 'Закат', page: '#170a10',
    theme: t({
      accent: '#fb7185', text: '#b48a95', textActive: '#fff1f2',
      surfaceTop: 'rgba(48,22,32,0.86)', surfaceBottom: 'rgba(26,10,17,0.92)', border: 'rgba(251,113,133,0.12)',
      highlightTop: 'rgba(251,113,133,0.32)', highlightBottom: 'rgba(251,113,133,0.12)',
      actionBg: 'rgba(251,113,133,0.12)', actionActiveBg: '#fff1f2', actionActiveText: '#4c0519', actionAccentBg: '#fb7185', actionAccentText: '#ffffff',
      badgeBg: '#facc15', badgeText: '#422006', badgeRing: '#2a1019', avatarFrom: '#fb7185', avatarTo: '#9f1239', avatarText: '#ffffff',
      radius: 20,
      headerTop: 'rgba(23,10,16,0.95)', headerMid: 'rgba(23,10,16,0.8)', searchBg: 'rgba(251,113,133,0.08)', searchBorder: 'rgba(251,113,133,0.14)'
    })
  }
];
