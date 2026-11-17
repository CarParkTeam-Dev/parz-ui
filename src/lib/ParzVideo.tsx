import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent as RKE, type PointerEvent as RPE, type ReactNode } from 'react';
import { ParzToggle } from './ParzToggle';
import { PARZ_CREDIT_URL } from './ParzCredit';
import './ParzVideo.css';

const PARZ_VERSION = typeof __PARZ_VERSION__ === 'string' ? __PARZ_VERSION__ : '';

/** Подписи плеера (для локализации и экранных дикторов). По умолчанию английские. */
export interface ParzVideoLabels {
  play: string; pause: string; replay: string; mute: string; unmute: string; volume: string; seek: string;
  speed: string; fullscreen: string; exitFullscreen: string; pip: string; player: string; normal: string;
  settings: string; quality: string; subtitles: string; off: string; loop: string; back: string; forward: string; remaining: string;
  more: string; cast: string; on: string; about: string; version: string;
  /** Заглушка во время трансляции: надпись и кнопка «вернуть на это устройство». */
  casting: string; castBack: string;
  /** Заглушка, пока видео в окне «картинка в картинке». */
  pipActive: string; pipBack: string;
  /** Плейлист: кнопка и список, «предыдущий», «следующий», карточка «Далее». */
  /** Пункт «Авто» в меню качества. */
  auto: string;
  playlist: string; previous: string; next: string; upNext: string; playNow: string; cancel: string; nowPlaying: string;
}
export const PARZ_VIDEO_LABELS: ParzVideoLabels = {
  play: 'Play', pause: 'Pause', replay: 'Replay', mute: 'Mute', unmute: 'Unmute', volume: 'Volume', seek: 'Seek',
  speed: 'Speed', fullscreen: 'Full screen', exitFullscreen: 'Exit full screen', pip: 'Picture in picture', player: 'Video player', normal: 'Normal',
  settings: 'Settings', quality: 'Quality', subtitles: 'Subtitles', off: 'Off', loop: 'Loop', back: 'Back {n} s', forward: 'Forward {n} s', remaining: 'Show remaining time',
  more: 'More', cast: 'Play on another device', on: 'On', about: 'About', version: 'Version',
  casting: 'Playing on another device', castBack: 'Play here',
  pipActive: 'In a separate window', pipBack: 'Back to player',
  auto: 'Auto',
  playlist: 'Playlist', previous: 'Previous', next: 'Next', upNext: 'Up next', playNow: 'Play now', cancel: 'Cancel', nowPlaying: 'Now playing'
};

/** Стиль анимаций плеера. */
export type ParzVideoMotion = 'liquid' | 'fade';

/** Один вариант качества: свой файл и подпись в меню («1080p», «720p»…). */
export interface ParzVideoSource { src: string; label: string; type?: string; /** Пометка: «4K», «HD»… По умолчанию — по подписи (2160p → 4K, 720p+ → HD); пустая строка — без пометки. */ badge?: string }
/** Субтитры WebVTT. */
export interface ParzVideoTrack { src: string; label: string; srclang: string; default?: boolean }
/** Глава: с какой секунды начинается и как называется. */
export interface ParzVideoChapter { start: number; title: string }

/** Ролик плейлиста: всё своё — адрес или качества, название, обложка, главы, субтитры. */
export interface ParzVideoItem {
  src?: string; sources?: ParzVideoSource[]; title?: ReactNode; poster?: string; chapters?: ParzVideoChapter[]; tracks?: ParzVideoTrack[]; audioBadge?: ReactNode;
  /** Длительность, с — для списка; если не задана, список её не показывает, пока ролик не открыт. */
  duration?: number;
}

/** Parz UI · Parz Video — видеоплеер с панелью из жидкого стекла: качество, скорость, субтитры, главы и кадр-превью на полосе перемотки. */
export interface ParzVideoProps {
  /** Адрес видео. Можно не задавать, если есть sources. */
  src?: string;
  /** Варианты качества. Переключение сохраняет время и паузу, а кадр плавно перетекает в новый. */
  sources?: ParzVideoSource[];
  /** Какое качество взять сначала (индекс в sources). По умолчанию 0. */
  /** Какое качество взять сначала: номер в sources или 'auto' (по умолчанию) — плеер сам выбирает по размеру плеера, плотности экрана и сети и снижает качество, если видео подвисает. Выбор вручную отключает автоматику. */
  defaultQuality?: number | 'auto';
  /** Субтитры WebVTT. */
  tracks?: ParzVideoTrack[];
  /** Главы: полоса перемотки делится на отрезки, в подсказке — название главы. */
  chapters?: ParzVideoChapter[];
  /** Кадр-превью над полосой перемотки при наведении. По умолчанию да. */
  previews?: boolean;
  /** Обложка: лежит поверх видео до запуска и плавно возвращается, когда ролик закончился (если нет loop). */
  poster?: string;
  /** Заголовок вверху (прячется вместе с панелью). */
  title?: ReactNode;
  /** Значок формата звука в правом верхнем углу, например «Dolby Atmos» или «5.1». Текст, без чужих логотипов. */
  audioBadge?: ReactNode;
  autoPlay?: boolean;
  muted?: boolean;
  loop?: boolean;
  /** Соотношение сторон. По умолчанию '16 / 9'. */
  aspectRatio?: string;
  accent?: string;
  /** Стиль анимаций: 'liquid' — элементы появляются и прячутся как капли, на упругой пружине (по умолчанию); 'fade' — спокойное проявление и растворение. */
  motion?: ParzVideoMotion;
  /** Радиус скругления, px. По умолчанию 18. */
  radius?: number;
  /** Кнопки перемотки назад и вперёд. По умолчанию да. Шаг — skipSeconds. */
  showSkip?: boolean;
  skipSeconds?: number;
  showVolume?: boolean;
  /** Кнопки качества, субтитров, скорости и «ещё» (повтор) над шкалой. По умолчанию да. */
  showSettings?: boolean;
  /** Трансляция на другое устройство (AirPlay, Chromecast через Remote Playback), если браузер её видит. По умолчанию да. */
  showCast?: boolean;
  showFullscreen?: boolean;
  showPip?: boolean;
  speeds?: number[];
  /** Через сколько мс без движения прятать панель. По умолчанию 2600. */
  hideDelay?: number;
  labels?: Partial<ParzVideoLabels>;
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
  onTimeUpdate?: (time: number, duration: number) => void;
  onQualityChange?: (index: number, source: ParzVideoSource) => void;
  /** Плейлист: ролики идут друг за другом; есть «предыдущий/следующий», список и карточка «Далее». src, sources, title, poster, chapters и tracks берутся из текущего ролика. */
  playlist?: ParzVideoItem[];
  /** Текущий ролик (управляемый режим). */
  index?: number;
  defaultIndex?: number;
  onIndexChange?: (index: number, item: ParzVideoItem) => void;
  /** Следующий ролик включается сам. По умолчанию да. */
  autoAdvance?: boolean;
  /** За сколько секунд до конца показывать карточку «Далее». 0 — не показывать. По умолчанию 8. */
  upNextSeconds?: number;
  className?: string;
  style?: CSSProperties;
}
type PlCtx = { items: ParzVideoItem[]; i: number; go: (i: number) => void };

const reduced = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
const fmt = (s: number) => {
  if (!isFinite(s) || s < 0) s = 0;
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), x = Math.floor(s % 60);
  return h ? `${h}:${String(m).padStart(2, '0')}:${String(x).padStart(2, '0')}` : `${m}:${String(x).padStart(2, '0')}`;
};
const clamp = (x: number) => Math.min(1, Math.max(0, x));
/* пометка качества: своя из badge, иначе по высоте из подписи — 2160p и выше «4K», 720p и выше «HD» */
const autoBadge = (s?: ParzVideoSource) => {
  if (!s) return undefined;
  if (s.badge !== undefined) return s.badge || undefined;
  const h = parseInt(/(\d{3,4})\s*p/i.exec(s.label)?.[1] ?? (/4k/i.test(s.label) ? "2160" : ""), 10);
  return h >= 2160 ? "4K" : h >= 720 ? "HD" : undefined;
};

/* «Авто» для обычных файлов: высота кадра из подписи (2160p, 4K…) */
const heightOf = (s: ParzVideoSource) => parseInt(/(\d{3,4})\s*p/i.exec(s.label)?.[1] ?? (/4k/i.test(s.label) ? '2160' : '0'), 10);
/* примерная скорость сети, нужная для качества, Мбит/с */
const NEED = (h: number) => (h >= 2160 ? 20 : h >= 1440 ? 12 : h >= 1080 ? 6 : h >= 720 ? 3 : h >= 480 ? 1.5 : 0.8);
/* выбор по ширине плеера × плотности экрана, с поправкой на сеть: экономия трафика, 2g/3g, downlink */
function autoPick(sources: ParzVideoSource[] | undefined, width: number, below?: number): number {
  if (!sources?.length) return 0;
  const hs = sources.map(heightOf);
  if (!hs.some(Boolean)) return 0;
  const dpr = typeof devicePixelRatio === 'number' ? Math.min(devicePixelRatio, 2) : 1;
  const want = (width * dpr * 9) / 16;
  type Conn = { saveData?: boolean; effectiveType?: string; downlink?: number };
  const c = typeof navigator !== 'undefined' ? (navigator as Navigator & { connection?: Conn }).connection : undefined;
  let cap = Infinity;
  if (c?.saveData || c?.effectiveType === 'slow-2g' || c?.effectiveType === '2g') cap = 360;
  else if (c?.effectiveType === '3g') cap = 480;
  if (below != null) cap = Math.min(cap, below - 1);
  const ok = hs.map((h, i) => ({ h, i })).filter(x => x.h > 0 && x.h <= cap && (!c?.downlink || NEED(x.h) <= c.downlink * 1.2));
  const pool = ok.length ? ok : hs.map((h, i) => ({ h, i })).filter(x => x.h > 0).sort((a, b) => a.h - b.h).slice(0, 1);
  const enough = pool.filter(x => x.h >= want * 1.25).sort((a, b) => a.h - b.h)[0];
  return (enough ?? pool.sort((a, b) => b.h - a.h)[0]).i;
}

/* значки: пары перетекают друг в друга (прозрачность, масштаб, лёгкое размытие) */
const PlayPause = ({ playing, ended }: { playing: boolean; ended: boolean }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="pz-vd-sw">
    <g className={!playing && !ended ? 'on' : ''}><path className="f" transform="translate(-.75 .8)" d="M8.2 5.6c0-.8.9-1.3 1.6-.9l9.1 5.6c.7.4.7 1.4 0 1.8l-9.1 5.6c-.7.4-1.6-.1-1.6-.9z" /></g>
    <g className={playing ? 'on' : ''}><rect className="f" x="6.5" y="5" width="3.8" height="14" rx="1.3" /><rect className="f" x="13.7" y="5" width="3.8" height="14" rx="1.3" /></g>
    <g className={ended && !playing ? 'on' : ''}><path className="s" d="M5 12a7 7 0 1 0 2.05-4.95" /><path className="s" d="M5 5v3.6h3.6" /></g>
  </svg>
);
const Speaker = ({ level }: { level: number }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="pz-vd-sw">
    <path className="f" d="M4 9.6c0-.6.4-1 1-1h2.6l4-3.4c.6-.5 1.4-.1 1.4.7v12.2c0 .8-.8 1.2-1.4.7l-4-3.4H5c-.6 0-1-.4-1-1z" />
    <g className={level > 0 ? 'on' : ''}><path className="s" d="M16 9.2a4 4 0 0 1 0 5.6" /></g>
    <g className={level > 0.5 ? 'on' : ''}><path className="s" d="M18.6 6.6a7.6 7.6 0 0 1 0 10.8" /></g>
    <g className={level === 0 ? 'on' : ''}><path className="s" d="M16.4 9.6l4.4 4.8M20.8 9.6l-4.4 4.8" /></g>
  </svg>
);
const Full = ({ on }: { on: boolean }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="pz-vd-sw">
    <g className={!on ? 'on' : ''}><path className="s" d="M4.5 9V5.8c0-.7.6-1.3 1.3-1.3H9M15 4.5h3.2c.7 0 1.3.6 1.3 1.3V9M19.5 15v3.2c0 .7-.6 1.3-1.3 1.3H15M9 19.5H5.8c-.7 0-1.3-.6-1.3-1.3V15" /></g>
    <g className={on ? 'on' : ''}><path className="s" d="M9 4.5V9H4.5M15 4.5V9h4.5M19.5 15H15v4.5M4.5 15H9v4.5" /></g>
  </svg>
);
const Pip = () => <svg viewBox="0 0 24 24" aria-hidden="true"><rect className="s" x="3.5" y="5.5" width="17" height="13" rx="2.4" /><rect className="f" x="12" y="11.5" width="6.5" height="5" rx="1.2" /></svg>;
/* шестерёнка: кольцо и 8 одинаковых зубцов, посчитанных по кругу, — строго симметрично */
const GEAR_TEETH = Array.from({ length: 8 }, (_, i) => {
  const a = (i * Math.PI) / 4, c = Math.cos(a), s = Math.sin(a);
  return `M${(12 + c * 7.2).toFixed(2)} ${(12 + s * 7.2).toFixed(2)}L${(12 + c * 9.3).toFixed(2)} ${(12 + s * 9.3).toFixed(2)}`;
}).join('');
const Gear = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="pz-vd-gear">
    <path className="s" d={GEAR_TEETH} style={{ strokeWidth: 3.2 }} />
    <circle className="s" cx="12" cy="12" r="6.2" />
    <circle className="s" cx="12" cy="12" r="2.4" />
  </svg>
);
/* значок формата звука: волны по умолчанию, голова с волнами для Spatial Audio, знак Dolby Atmos (вместо текста) для Atmos */
const Waves = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <circle className="f" cx="12" cy="12" r="2.2" />
    <path className="s" d="M8.3 8.3a5.2 5.2 0 0 0 0 7.4M15.7 8.3a5.2 5.2 0 0 1 0 7.4M5.4 5.4a9.3 9.3 0 0 0 0 13.2M18.6 5.4a9.3 9.3 0 0 1 0 13.2" />
  </svg>
);
const SpatialHead = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <circle className="f" cx="10" cy="9" r="4" />
    <path className="f" d="M16.39 15.56C14.71 14.7 12.53 14 10 14s-4.71.7-6.39 1.56A2.97 2.97 0 0 0 2 18.22V21h16v-2.78c0-1.12-.61-2.15-1.61-2.66M16 1h-2a9 9 0 0 0 9 9V8c-3.86 0-7-3.14-7-7" />
    <path className="f" d="M20 1h-2c0 2.76 2.24 5 5 5V4c-1.65 0-3-1.35-3-3" />
  </svg>
);
/* рамка обрезана по самому знаку (он занимает x 2…22, y 8…16), чтобы он стоял ровно по центру капсулы */
const AtmosMark = ({ label }: { label: string }) => (
  <svg viewBox="1.6 7.7 20.8 8.6" role="img" aria-label={label} className="pz-vd-atmos">
    <path className="f" d="M15.413 8.076h.589v3.887h-.589Zm-3.443 7.238h-.007l-.786-2.016h-.571v2.624h.356v-2.194h.007l.868 2.194h.233l.871-2.194h.008v2.194h.367v-2.624h-.571ZM7.549 13.62h.842v2.302h.367V13.62H9.6v-.322H7.549Zm11.711 1.032a1 1 0 0 0-.236-.13a4 4 0 0 0-.257-.088l-.2-.069a.7.7 0 0 1-.162-.081a.4.4 0 0 1-.109-.116a.33.33 0 0 1-.041-.171a.36.36 0 0 1 .044-.182a.4.4 0 0 1 .115-.126a.5.5 0 0 1 .156-.074a.6.6 0 0 1 .172-.023a.6.6 0 0 1 .285.065a.6.6 0 0 1 .2.167l.246-.239a.8.8 0 0 0-.306-.208a1.1 1.1 0 0 0-.409-.078a1.2 1.2 0 0 0-.309.041a.8.8 0 0 0-.274.128a.7.7 0 0 0-.2.222a.75.75 0 0 0-.019.61a.6.6 0 0 0 .148.2a1 1 0 0 0 .208.13a2 2 0 0 0 .236.087q.12.038.227.075a1 1 0 0 1 .189.09a.4.4 0 0 1 .129.129a.35.35 0 0 1 .047.188a.4.4 0 0 1-.046.192a.4.4 0 0 1-.118.132a.5.5 0 0 1-.16.078a.7.7 0 0 1-.176.024a.66.66 0 0 1-.321-.08a.66.66 0 0 1-.236-.212l-.272.229a.9.9 0 0 0 .365.272a1.2 1.2 0 0 0 .457.091a1.1 1.1 0 0 0 .322-.046a.8.8 0 0 0 .277-.139a.7.7 0 0 0 .192-.236a.74.74 0 0 0 .072-.337a.63.63 0 0 0-.067-.308a.6.6 0 0 0-.169-.207m2.097-5.38l-.767 1.724l-.767-1.724h-.643l1.089 2.446l-.022.048l-.008.019l-.239.53a.315.315 0 0 1-.415.159l-.084-.037l-.164.369l-.074.164l.2.091a.764.764 0 0 0 1.006-.386L22 9.272Zm-9.314.745A1.944 1.944 0 0 0 10.1 8.075H8.7v3.883h1.4a1.944 1.944 0 0 0 1.943-1.941M9.7 11.37h-.412V8.664h.812a1.353 1.353 0 0 1 0 2.706Zm8.155-2.098a1.33 1.33 0 0 0-.769.242V8.076H16.5v3.887h.59v-.243a1.345 1.345 0 1 0 .769-2.448Zm0 2.151a.81.81 0 0 1-.769-.556a.8.8 0 0 1 0-.511a.811.811 0 1 1 .769 1.067m-1.243 2.237a1.3 1.3 0 0 0-.42-.266a1.52 1.52 0 0 0-1.056 0a1.3 1.3 0 0 0-.417.266a1.2 1.2 0 0 0-.275.413a1.48 1.48 0 0 0 0 1.064a1.2 1.2 0 0 0 .275.416a1.3 1.3 0 0 0 .417.272a1.5 1.5 0 0 0 1.056 0a1.3 1.3 0 0 0 .42-.272a1.3 1.3 0 0 0 .276-.416a1.45 1.45 0 0 0 0-1.064a1.2 1.2 0 0 0-.276-.413m-.067 1.338a1 1 0 0 1-.191.319a.9.9 0 0 1-.3.213a.95.95 0 0 1-.391.078a.9.9 0 0 1-.388-.078a.9.9 0 0 1-.3-.213a1 1 0 0 1-.19-.319a1.2 1.2 0 0 1-.067-.391a1.1 1.1 0 0 1 .067-.386a1 1 0 0 1 .189-.319a.9.9 0 0 1 .3-.217a1 1 0 0 1 .782 0a.9.9 0 0 1 .3.217a1 1 0 0 1 .191.319a1.1 1.1 0 0 1 .067.386a1.2 1.2 0 0 1-.069.391M2.573 8.076H2v3.882h.573a1.941 1.941 0 1 0 0-3.882m11.114 3.886a1.346 1.346 0 1 0-1.345-1.345a1.346 1.346 0 0 0 1.345 1.345m0-2.161a.811.811 0 1 1-.811.811a.815.815 0 0 1 .811-.811m-6.164 2.157V8.076h-.572a1.941 1.941 0 1 0 0 3.882Zm-1.885 1.34L4.5 15.922h.408l.263-.644h1.246l.267.644H7.1l-1.128-2.624ZM5.3 14.955l.493-1.231l.489 1.231Z" />
  </svg>
);
const AudioBadge = ({ value }: { value: ReactNode }) => {
  const s = typeof value === 'string' ? value : '';
  if (/atmos/i.test(s)) return <div className="pz-vd-audio pz-vd-audio--atmos" key="atmos"><AtmosMark label={s} /></div>;
  const spatial = /spatial|пространств|տարածական/i.test(s);
  return <div className="pz-vd-audio" key={s || undefined}>{spatial ? <SpatialHead /> : <Waves />}<span>{value}</span></div>;
};
const Skip = ({ dir, n }: { dir: 1 | -1; n: number }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="pz-vd-skip">
    <g style={dir < 0 ? undefined : { transform: 'scaleX(-1)', transformOrigin: '12px 12px' }}>
      <path className="s" d="M5.2 9.5A7.6 7.6 0 1 1 4.6 14" /><path className="s" d="M4.6 5.2v4.4H9" />
    </g>
    <text x="12.4" y="15.5" textAnchor="middle">{n}</text>
  </svg>
);
const Cast = () => <svg viewBox="0 0 24 24" aria-hidden="true"><path className="s" d="M7 17.5H5.4c-1 0-1.9-.8-1.9-1.9V6.4c0-1 .8-1.9 1.9-1.9h13.2c1 0 1.9.8 1.9 1.9v9.2c0 1-.8 1.9-1.9 1.9H17" /><path className="f" d="M12 13.2l4.6 6.3H7.4z" /></svg>;
const Subs = () => <svg viewBox="0 0 24 24" aria-hidden="true"><path className="s" d="M5.6 4.5h12.8c1.2 0 2.1.9 2.1 2.1v8.3c0 1.2-.9 2.1-2.1 2.1H11l-4.2 3v-3H5.6c-1.2 0-2.1-.9-2.1-2.1V6.6c0-1.2.9-2.1 2.1-2.1z" /><path className="s" d="M7.5 9.3h4M14 9.3h2.5M7.5 12.7h2.5M12.5 12.7h4" /></svg>;
const Gauge = () => <svg viewBox="0 0 24 24" aria-hidden="true"><circle className="s" cx="12" cy="12" r="8.5" /><path className="s" d="M12 12l3.6-3.6M12 5.8v1.4M5.8 12h1.4M16.8 12h1.4M7.6 7.6l1 1" /><circle className="f" cx="12" cy="12" r="1.6" /></svg>;
const Quality = () => <svg viewBox="0 0 24 24" aria-hidden="true"><path className="s" d="M4 7.5h9M17 7.5h3M4 16.5h3M11 16.5h9" /><circle className="s" cx="15" cy="7.5" r="2" /><circle className="s" cx="9" cy="16.5" r="2" /></svg>;
const Loop = () => <svg viewBox="0 0 24 24" aria-hidden="true"><path className="s" d="M17 4.5l2.5 2.5L17 9.5" /><path className="s" d="M4.5 11.5V10c0-1.7 1.3-3 3-3h12" /><path className="s" d="M7 19.5L4.5 17 7 14.5" /><path className="s" d="M19.5 12.5V14c0 1.7-1.3 3-3 3h-12" /></svg>;
const Prev = () => <svg viewBox="0 0 24 24" aria-hidden="true"><rect className="f" x="5" y="6" width="2.6" height="12" rx="1.1" /><path className="f" d="M18.6 6.9v10.2c0 .8-.9 1.3-1.6.8l-7.4-5.1a1 1 0 0 1 0-1.6L17 6.1c.7-.5 1.6 0 1.6.8z" /></svg>;
const Next = () => <svg viewBox="0 0 24 24" aria-hidden="true"><rect className="f" x="16.4" y="6" width="2.6" height="12" rx="1.1" /><path className="f" d="M5.4 6.9v10.2c0 .8.9 1.3 1.6.8l7.4-5.1a1 1 0 0 0 0-1.6L7 6.1c-.7-.5-1.6 0-1.6.8z" /></svg>;
const List = () => <svg viewBox="0 0 24 24" aria-hidden="true"><path className="s" d="M9 6.5h11M9 12h11M9 17.5h11" /><circle className="f" cx="4.8" cy="6.5" r="1.4" /><circle className="f" cx="4.8" cy="12" r="1.4" /><circle className="f" cx="4.8" cy="17.5" r="1.4" /></svg>;
const Dots = () => <svg viewBox="0 0 24 24" aria-hidden="true"><circle className="f" cx="5.5" cy="12" r="1.9" /><circle className="f" cx="12" cy="12" r="1.9" /><circle className="f" cx="18.5" cy="12" r="1.9" /></svg>;
/* знак Parz UI — тот же, что в логотипе */
const ParzMark = () => <svg viewBox="8 8 65 65" aria-hidden="true" className="pz-vd-mark"><g fill="none" stroke="currentColor" strokeWidth="6.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 61V31C21 19 28 14 39 14H48C58 14 64 21 64 30C64 39 58 45 48 45H38" /><path d="M39 56H58" /></g></svg>;
const Info = () => <svg viewBox="0 0 24 24" aria-hidden="true"><circle className="s" cx="12" cy="12" r="8.5" /><path className="s" d="M12 11v5.2" /><circle className="f" cx="12" cy="7.9" r="1.2" /></svg>;
const Chevron = ({ back }: { back?: boolean }) => <svg viewBox="0 0 24 24" aria-hidden="true" className="pz-vd-chev"><path className="s" d={back ? 'M14.5 6l-6 6 6 6' : 'M9.5 6l6 6-6 6'} /></svg>;
const Tick = () => <svg viewBox="0 0 24 24" aria-hidden="true" className="pz-vd-tick"><path className="s" d="M5.5 12.5l4 4 9-9" /></svg>;

type Page = 'more' | 'speed' | 'quality' | 'subs';
/* пункты меню настроек — отдельные постоянные компоненты, чтобы при смене значения ничего не пересоздавалось */
type Go = (p: Page | null, d?: 1 | -1) => void;
const Row = ({ label, value, to, go, icon }: { label: string; value: ReactNode; to: Page; go: Go; icon?: ReactNode }) => (
  <button type="button" role="menuitem" className="pz-vd-mi" onClick={() => go(to)}>
    {icon && <span className="pz-vd-mi-i">{icon}</span>}<span className="pz-vd-mi-l">{label}</span><span className="pz-vd-mi-v">{value}</span><Chevron />
  </button>
);
/* заголовок меню: приглушённое название; если пришли из «ещё» — стрелка назад */
const Head = ({ label, back, go, icon }: { label: string; back?: boolean; go: Go; icon?: ReactNode }) => back
  ? <button type="button" className="pz-vd-mh" onClick={() => go('more', -1)}><Chevron back /><span>{label}</span></button>
  : <div className="pz-vd-mh pz-vd-mh--t">{icon && <span className="pz-vd-mi-i">{icon}</span>}<span>{label}</span></div>;
const Opt = ({ on, onPick, children }: { on: boolean; onPick: () => void; children: ReactNode }) => (
  <button type="button" role="menuitemradio" aria-checked={on} className={`pz-vd-opt${on ? ' is-on' : ''}`} onClick={onPick}><Tick /><span>{children}</span></button>
);

type Flash = { k: number; kind: 'play' | 'pause' | 'fwd' | 'back' | 'vol' | 'mute' | 'info'; text?: string };

/** Плейлист — обёртка: держит номер ролика и подставляет его данные в плеер. */
export function ParzVideo(props: ParzVideoProps) {
  const { playlist, index, defaultIndex = 0, onIndexChange } = props;
  const n = playlist?.length ?? 0;
  const [own, setOwn] = useState(defaultIndex);
  const i = Math.min(Math.max(0, index ?? own), Math.max(0, n - 1));
  if (!playlist || !n) return <Player {...props} />;
  const it = playlist[i];
  const go = (j: number) => { if (j < 0 || j >= n || j === i) return; if (index == null) setOwn(j); onIndexChange?.(j, playlist[j]); };
  return <Player {...props} src={it.src} sources={it.sources} poster={it.poster} title={it.title ?? props.title} chapters={it.chapters} tracks={it.tracks}
    audioBadge={it.audioBadge ?? props.audioBadge} pl={{ items: playlist, i, go }} />;
}

function Player({
  pl, autoAdvance = true, upNextSeconds = 8,
  src, sources, defaultQuality = 'auto', tracks, chapters, previews = true, poster, title, audioBadge, autoPlay, muted: muted0 = false, loop: loop0 = false,
  aspectRatio = '16 / 9', accent, radius, motion = 'liquid', showSkip = true, skipSeconds = 10, showVolume = true, showSettings = true, showFullscreen = true, showPip = false, showCast = true,
  speeds = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2], hideDelay = 2600, labels, onPlay, onPause, onEnded, onTimeUpdate, onQualityChange, className, style
}: ParzVideoProps & { pl?: PlCtx }) {
  const L = { ...PARZ_VIDEO_LABELS, ...labels };
  const sk = (s: string) => s.replace('{n}', String(skipSeconds));
  const root = useRef<HTMLDivElement>(null);
  const vid = useRef<HTMLVideoElement>(null);
  const prevVid = useRef<HTMLVideoElement>(null);
  const prevCv = useRef<HTMLCanvasElement>(null);
  const snapCv = useRef<HTMLCanvasElement>(null);
  const curEl = useRef<HTMLSpanElement>(null);
  const seekEl = useRef<HTMLDivElement>(null);
  const [auto, setAuto] = useState(defaultQuality === 'auto');
  const [q, setQ] = useState(() => defaultQuality === 'auto' ? autoPick(sources, typeof window !== 'undefined' ? Math.min(window.innerWidth, 1280) : 1280) : Math.min(Math.max(0, defaultQuality), Math.max(0, (sources?.length ?? 1) - 1)));
  const url = sources?.[Math.min(q, sources.length - 1)]?.src ?? src ?? '';
  const [playing, setPlaying] = useState(false);
  const [ended, setEnded] = useState(false);
  const [started, setStarted] = useState(!!autoPlay);
  const [dur, setDur] = useState(0);
  const [muted, setMuted] = useState(muted0);
  const [vol, setVol] = useState(1);
  const [rate, setRate] = useState(1);
  const [loop, setLoop] = useState(loop0);
  /* субтитры по умолчанию выключены, даже если дорожки есть — включает зритель */
  const [sub, setSub] = useState(-1);
  const [cue, setCue] = useState('');
  const [wait, setWait] = useState(false);
  const [ready, setReady] = useState(false);
  const [posterIn, setPosterIn] = useState(false);
  const posterEl = useRef<HTMLImageElement>(null);
  useEffect(() => { const im = posterEl.current; setPosterIn(!!im && im.complete && im.naturalWidth > 0); }, [poster]);
  useEffect(() => setReady(false), [src, sources]);
  const [fs, setFs] = useState(false);
  const [page, setPage] = useState<Page | null>(null);
  const [nested, setNested] = useState(false);
  const [narrow, setNarrow] = useState(false);
  const [tiny, setTiny] = useState(false);
  const [castOk, setCastOk] = useState(false);
  /* идёт трансляция: браузер больше не рисует кадры — вместо чёрного экрана заглушка */
  const [remote, setRemote] = useState(false);
  /* видео в окне «картинка в картинке»: браузер рисует свою надпись на чёрном — закрываем своей заглушкой */
  const [pipOn, setPipOn] = useState(false);
  /* меню правого клика: своё, в стиле плеера; только для мыши */
  const [ctx, setCtx] = useState<{ x: number; y: number; k: number } | null>(null);
  const ctxEl = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ctx) return;
    const off = (e: Event) => { if (!(e.target as Element).closest?.('.pz-vd-ctx')) setCtx(null); };
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setCtx(null); };
    document.addEventListener('pointerdown', off); document.addEventListener('keydown', esc); window.addEventListener('blur', () => setCtx(null), { once: true });
    return () => { document.removeEventListener('pointerdown', off); document.removeEventListener('keydown', esc); };
  }, [ctx]);
  /* меню не выходит за края плеера */
  useLayoutEffect(() => {
    const m = ctxEl.current, r = root.current; if (!ctx || !m || !r) return;
    const x = Math.min(ctx.x, r.clientWidth - m.offsetWidth - 8), y = Math.min(ctx.y, r.clientHeight - m.offsetHeight - 8);
    m.style.left = `${Math.max(8, x)}px`; m.style.top = `${Math.max(8, y)}px`;
  }, [ctx]);
  const onCtx = (e: React.MouseEvent) => {
    if ((e.nativeEvent as PointerEvent).pointerType === 'touch') return;
    e.preventDefault();
    const b = root.current!.getBoundingClientRect();
    setPage(null);
    setCtx({ x: e.clientX - b.left, y: e.clientY - b.top, k: (ctx?.k ?? 0) + 1 });
  };
  /* дорожка громкости — только там, где есть мышь (ПК, любой ширины); на сенсорных устройствах кнопка звука просто включает и выключает звук */
  const [canHover, setCanHover] = useState(() => typeof matchMedia === "function" && matchMedia("(hover: hover) and (pointer: fine)").matches);
  useEffect(() => {
    if (typeof matchMedia !== "function") return;
    const mq = matchMedia("(hover: hover) and (pointer: fine)");
    const on = () => setCanHover(mq.matches);
    on(); mq.addEventListener?.("change", on);
    return () => mq.removeEventListener?.("change", on);
  }, []);
  const [dir, setDir] = useState<1 | -1>(1);
  const [shown, setShown] = useState(true);
  const [drag, setDrag] = useState(false);
  const [hover, setHover] = useState<{ x: number; t: number } | null>(null);
  const lastHover = useRef({ x: 0, t: 0 });
  if (hover) lastHover.current = hover;
  const [remain, setRemain] = useState(true);
  const restEl = useRef<HTMLSpanElement>(null);
  const [snap, setSnap] = useState(false);
  const [flash, setFlash] = useState<Flash | null>(null);
  const hideT = useRef(0);
  const flashK = useRef(0);
  const dragging = useRef(false);
  const raf = useRef(0);
  const resume = useRef<{ t: number; play: boolean } | null>(null);
  const pip = showPip && typeof document !== 'undefined' && 'pictureInPictureEnabled' in document && document.pictureInPictureEnabled;
  useEffect(() => setLoop(loop0), [loop0]);

  const segs = useMemo(() => {
    if (!chapters?.length || !dur) return [{ s: 0, e: 1, title: '' }];
    const c = [...chapters].filter(x => x.start < dur).sort((a, b) => a.start - b.start);
    if (!c.length || c[0].start > 0) c.unshift({ start: 0, title: '' });
    return c.map((x, i) => ({ s: x.start / dur, e: (c[i + 1]?.start ?? dur) / dur, title: x.title }));
  }, [chapters, dur]);
  const chapterAt = (f: number) => segs.find(x => f >= x.s && f < x.e)?.title ?? segs[segs.length - 1].title;

  /* позиция пишется прямо в CSS-переменную на каждом кадре — полоса течёт, а не скачет */
  const remainRef = useRef(remain); remainRef.current = remain;
  const paint = useCallback((p?: number) => {
    const v = vid.current, r = root.current;
    if (!v || !r) return;
    const d = v.duration || 0;
    const x = clamp(p ?? (d ? v.currentTime / d : 0));
    r.style.setProperty('--pz-vd-p', x.toFixed(5));
    const txt = fmt(x * d), rest = remainRef.current ? `−${fmt(d - x * d)}` : fmt(d);
    if (curEl.current && curEl.current.textContent !== txt) curEl.current.textContent = txt;
    if (restEl.current && restEl.current.textContent !== rest) restEl.current.textContent = rest;
    const s = seekEl.current;
    if (s) { s.setAttribute('aria-valuenow', String(Math.round(x * d))); s.setAttribute('aria-valuetext', `${fmt(x * d)} / ${fmt(d)}`); }
  }, []);
  useEffect(() => { if (!playing) paint(); }, [remain]);
  const paintBuf = () => {
    const v = vid.current, r = root.current;
    if (!v || !r || !v.duration) return;
    let end = 0;
    for (let i = 0; i < v.buffered.length; i++) if (v.buffered.start(i) <= v.currentTime + 0.5) end = Math.max(end, v.buffered.end(i));
    r.style.setProperty('--pz-vd-b', clamp(end / v.duration).toFixed(4));
  };
  useEffect(() => {
    if (!playing) return;
    const tick = () => { if (!dragging.current) paint(); raf.current = requestAnimationFrame(tick); };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [playing, paint]);

  const menuOpen = page !== null;
  /* подсказки к кнопкам (только мышь): первый показ — с задержкой; пока подсказка видна или только что погасла,
     переход на соседнюю кнопку мгновенный — подсказка перетекает к ней */
  const tipEl = useRef<HTMLDivElement>(null);
  const [bt, setBt] = useState<{ on: boolean; move: boolean; text: string; x: number; y: number; below: boolean }>({ on: false, move: false, text: '', x: 0, y: 0, below: false });
  const tipT = useRef(0), tipWarm = useRef(0), tipFor = useRef<Element | null>(null);
  const tipAt = (b: Element) => {
    const r0 = root.current?.getBoundingClientRect(), rb = b.getBoundingClientRect();
    if (!r0) return;
    const below = !!b.closest('.pz-vd-topr');
    const next = { on: true, text: b.getAttribute('data-tip') ?? '', x: rb.left + rb.width / 2 - r0.left, y: below ? rb.bottom - r0.top + 10 : rb.top - r0.top - 10, below };
    /* перетекает только к соседней кнопке в том же ряду; к дальней — гаснет и появляется уже на месте, без полёта через плеер */
    const near = bt.on && Math.abs(next.x - bt.x) <= 120 && Math.abs(next.y - bt.y) < 4;
    if (bt.on && !near) {
      setBt(t => ({ ...t, on: false, move: false }));
      tipT.current = window.setTimeout(() => setBt({ ...next, move: false }), 160);
      return;
    }
    setBt({ ...next, move: near });
  };
  const tipOver = (e: RPE<HTMLDivElement>) => {
    if (e.pointerType !== 'mouse') return;
    const b = (e.target as Element).closest?.('[data-tip]');
    if (!b || b === tipFor.current) return;
    tipFor.current = b;
    window.clearTimeout(tipT.current);
    if (bt.on || performance.now() - tipWarm.current < 400) tipAt(b);
    else tipT.current = window.setTimeout(() => tipAt(b), 450);
  };
  const tipOut = (e: RPE<HTMLDivElement>) => {
    const to = (e.relatedTarget as Element | null)?.closest?.('[data-tip]');
    if (to && root.current?.contains(to)) return;
    /* щель между соседними кнопками — не повод гаснуть: ждём чуть-чуть, вдруг курсор уже на следующей */
    window.clearTimeout(tipT.current);
    tipT.current = window.setTimeout(tipHide, 120);
  };
  const tipHide = () => {
    window.clearTimeout(tipT.current); tipFor.current = null;
    tipWarm.current = performance.now();
    setBt(t => (t.on ? { ...t, on: false } : t));
  };
  /* подсказка не выходит за плеер: центр над кнопкой, но прижимается к краям */
  useLayoutEffect(() => {
    const el = tipEl.current, r0 = root.current; if (!el || !r0 || !bt.text) return;
    const w = el.offsetWidth, W = r0.clientWidth, m = 8;
    el.style.left = `${Math.min(Math.max(m, bt.x - w / 2), W - m - w)}px`;
    el.style.top = `${bt.y}px`;
  }, [bt]);
  /* при закрытии меню содержимое остаётся до конца анимации окна — окно и пункты уходят вместе */
  const lastPage = useRef<Page>('more');
  if (page) lastPage.current = page;
  const view = page ?? lastPage.current;
  const poke = useCallback(() => {
    setShown(true);
    window.clearTimeout(hideT.current);
    hideT.current = window.setTimeout(() => { if (!dragging.current) { setShown(false); setHover(null); } }, hideDelay);
  }, [hideDelay]);
  useEffect(() => {
    if (!playing) { window.clearTimeout(hideT.current); setShown(true); } else poke();
    return () => window.clearTimeout(hideT.current);
  }, [playing, poke]);
  useEffect(() => { if (!shown && playing && !menuOpen) setPage(null); }, [shown]);

  useEffect(() => {
    const on = () => setFs(document.fullscreenElement === root.current);
    document.addEventListener('fullscreenchange', on);
    return () => document.removeEventListener('fullscreenchange', on);
  }, []);
  useEffect(() => { if (vid.current) vid.current.muted = muted; }, [muted]);
  useEffect(() => { if (vid.current) vid.current.volume = vol; }, [vol]);
  /* defaultPlaybackRate — его берёт системный плеер iPhone в полном экране */
  useEffect(() => { const v = vid.current; if (v) { v.defaultPlaybackRate = rate; v.playbackRate = rate; } }, [rate, url]);
  /* системный полный экран iPhone: наши субтитры там не видны — показываем дорожку средствами браузера, а при выходе забираем выбор оттуда */
  const [nfs, setNfs] = useState(false);
  useEffect(() => {
    const v = vid.current; if (!v) return;
    const on = () => setNfs(true);
    const offFs = () => {
      setNfs(false);
      const list = v.textTracks; let s = -1;
      for (let i = 0; i < list.length; i++) if (list[i].mode === 'showing') s = i;
      setSub(s);
      if (v.playbackRate > 0) setRate(v.playbackRate);
    };
    v.addEventListener('webkitbeginfullscreen', on); v.addEventListener('webkitendfullscreen', offFs);
    return () => { v.removeEventListener('webkitbeginfullscreen', on); v.removeEventListener('webkitendfullscreen', offFs); };
  }, []);

  /* субтитры рисуем сами — в стиле плеера, и они мягко приподнимаются, когда видна панель */
  useEffect(() => {
    const v = vid.current; if (!v) return;
    const list = v.textTracks;
    const sync = () => {
      for (let i = 0; i < list.length; i++) list[i].mode = i === sub ? (nfs ? 'showing' : 'hidden') : 'disabled';
      const t = sub >= 0 ? list[sub] : null;
      const act = t?.activeCues;
      setCue(act && act.length ? Array.from(act).map(c => (c as VTTCue).text).join('\n') : '');
    };
    sync();
    const onCue = () => sync();
    for (let i = 0; i < list.length; i++) list[i].addEventListener('cuechange', onCue);
    list.addEventListener?.('addtrack', onCue);
    return () => { for (let i = 0; i < list.length; i++) list[i].removeEventListener('cuechange', onCue); list.removeEventListener?.('addtrack', onCue); };
  }, [sub, tracks, url, nfs]);

  /* меню: высота перетекает между страницами, страницы въезжают сбоку */
  const popEl = useRef<HTMLDivElement>(null);
  const pageEl = useRef<HTMLDivElement>(null);
  const [popH, setPopH] = useState<number | undefined>(undefined);
  const wasOpen = useRef(false);
  const [snapH, setSnapH] = useState(false);
  useLayoutEffect(() => {
    if (page && pageEl.current) { setSnapH(!wasOpen.current); setPopH(pageEl.current.offsetHeight); }
    wasOpen.current = !!page;
  }, [page, q, rate, sub, loop, tracks, sources, narrow, tiny, castOk, pl?.i]);
  const go = (p: Page | null, d: 1 | -1 = 1) => { setDir(d); setNested(p !== null && p !== 'more' && (d < 0 ? false : page === 'more')); setPage(p); };
  const open = (p: Page) => { setDir(1); setNested(false); setPage(cur => (cur === p ? null : p)); };
  /* узкий плеер (телефон): качество и скорость уходят в «ещё», громкость — только кнопкой */
  useEffect(() => {
    const r = root.current; if (!r) return;
    const check = () => {
      const w = r.clientWidth, h = r.clientHeight;
      setNarrow(w > 0 && w <= 460);
      /* совсем маленький плеер: кнопки встают в ряд со шкалой, а «картинка в картинке» и трансляция уходят в «…» */
      setTiny(w > 0 && w <= 460 && h <= 230);
    };
    check();
    window.addEventListener('resize', check);
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(check) : null;
    ro?.observe(r);
    return () => { window.removeEventListener('resize', check); ro?.disconnect(); };
  }, []);
  useEffect(() => {
    type RV = HTMLVideoElement & { remote?: EventTarget & { state: string }; webkitCurrentPlaybackTargetIsWireless?: boolean };
    const v = vid.current as RV | null; if (!v) return;
    const sync = () => setRemote(v.remote?.state === 'connected' || v.remote?.state === 'connecting' || !!v.webkitCurrentPlaybackTargetIsWireless);
    sync();
    v.remote?.addEventListener('connect', sync); v.remote?.addEventListener('connecting', sync); v.remote?.addEventListener('disconnect', sync);
    v.addEventListener('webkitcurrentplaybacktargetiswirelesschanged', sync);
    return () => {
      v.remote?.removeEventListener('connect', sync); v.remote?.removeEventListener('connecting', sync); v.remote?.removeEventListener('disconnect', sync);
      v.removeEventListener('webkitcurrentplaybacktargetiswirelesschanged', sync);
    };
  }, []);
  useEffect(() => {
    type WV = HTMLVideoElement & { webkitPresentationMode?: string };
    const v = vid.current as WV | null; if (!v) return;
    const sync = () => setPipOn(document.pictureInPictureElement === v || v.webkitPresentationMode === 'picture-in-picture');
    v.addEventListener('enterpictureinpicture', sync); v.addEventListener('leavepictureinpicture', sync); v.addEventListener('webkitpresentationmodechanged', sync);
    return () => { v.removeEventListener('enterpictureinpicture', sync); v.removeEventListener('leavepictureinpicture', sync); v.removeEventListener('webkitpresentationmodechanged', sync); };
  }, []);
  /* трансляция: кнопка есть, только если браузер видит устройство (Remote Playback или AirPlay в Safari) */
  useEffect(() => {
    const v = vid.current as (HTMLVideoElement & { remote?: { watchAvailability: (cb: (a: boolean) => void) => Promise<number>; cancelWatchAvailability: (id?: number) => Promise<void> } }) | null;
    if (!showCast || !v) return;
    let id: number | undefined;
    if (v.remote?.watchAvailability) v.remote.watchAvailability(a => setCastOk(a)).then(x => { id = x; }).catch(() => setCastOk(false));
    const wk = (e: Event) => setCastOk((e as Event & { availability?: string }).availability === 'available');
    v.addEventListener('webkitplaybacktargetavailabilitychanged', wk);
    return () => { v.removeEventListener('webkitplaybacktargetavailabilitychanged', wk); if (id != null) v.remote?.cancelWatchAvailability(id).catch(() => {}); };
  }, [showCast, url]);
  const cast = () => {
    const v = vid.current as (HTMLVideoElement & { remote?: { prompt: () => Promise<void> }; webkitShowPlaybackTargetPicker?: () => void }) | null;
    if (!v) return;
    if (v.webkitShowPlaybackTargetPicker) v.webkitShowPlaybackTargetPicker(); else void v.remote?.prompt().catch(() => {});
  };
  useEffect(() => {
    if (!menuOpen) return;
    const off = (e: PointerEvent) => { if (!(e.target as Element).closest?.('.pz-vd-tools, .pz-vd-pop')) setPage(null); };
    document.addEventListener('pointerdown', off);
    return () => document.removeEventListener('pointerdown', off);
  }, [menuOpen]);

  const show = (f: Omit<Flash, 'k'>) => { if (!reduced()) setFlash({ ...f, k: ++flashK.current }); };
  const toggle = (fb = false) => {
    const v = vid.current; if (!v) return;
    setStarted(true);
    if (v.paused || v.ended) { void v.play().catch(() => { /* браузер запретил запуск — остаёмся на паузе */ }); }
    else v.pause();
  };
  const seekTo = (t: number) => { const v = vid.current; if (!v || !v.duration) return; v.currentTime = Math.min(v.duration, Math.max(0, t)); setEnded(false); paint(); };
  const seekBy = (s: number, fb = true) => {
    const v = vid.current; if (!v) return;
    seekTo(v.currentTime + s);
    if (fb) show({ kind: s > 0 ? 'fwd' : 'back', text: `${s > 0 ? '+' : '−'}${Math.abs(s)} s` });
  };
  const setVolume = (x: number, fb = false) => {
    const n = clamp(x); setVol(n); setMuted(n === 0);
    if (fb) show({ kind: n === 0 ? 'mute' : 'vol', text: `${Math.round(n * 100)}%` });
  };
  const toggleMute = () => { if (muted || vol === 0) { setMuted(false); if (vol === 0) setVol(0.6); } else setMuted(true); };
  const toggleFs = () => {
    const r = root.current, v = vid.current as (HTMLVideoElement & { webkitEnterFullscreen?: () => void }) | null;
    if (!r) return;
    if (document.fullscreenElement) void document.exitFullscreen();
    else if (r.requestFullscreen) void r.requestFullscreen().catch(() => {});
    else v?.webkitEnterFullscreen?.();
  };
  const togglePip = () => {
    const v = vid.current; if (!v) return;
    if (document.pictureInPictureElement) void document.exitPictureInPicture(); else void v.requestPictureInPicture().catch(() => {});
  };

  /* смена качества: последний кадр остаётся на холсте, новое видео встаёт на то же время, и кадр плавно растворяется */
  const pickQuality = (i: number, fromAuto = false) => {
    if (!fromAuto) setAuto(false);
    if (!sources || i === q) { if (!fromAuto) go(null); return; }
    const v = vid.current;
    if (v) {
      resume.current = { t: v.currentTime, play: !v.paused && !v.ended };
      const c = snapCv.current;
      if (c && v.videoWidth) {
        try { c.width = v.videoWidth; c.height = v.videoHeight; c.getContext('2d')?.drawImage(v, 0, 0); setSnap(true); } catch { /* чужой домен без CORS — без перетекания */ }
      }
    }
    setQ(i); onQualityChange?.(i, sources[i]);
    if (!fromAuto) { show({ kind: 'info', text: sources[i].label }); go(null); }
  };
  /* «Авто»: до запуска и при смене ролика выбираем сразу; во время просмотра — повышаем только в полном экране,
     а если видео дважды подвисло за 20 с — мягко опускаемся на ступень ниже (с тем же растворением кадра) */
  const stalls = useRef<number[]>([]);
  const autoNow = (below?: number) => autoPick(sources, fs ? (typeof screen !== 'undefined' ? screen.width : 1920) : root.current?.clientWidth || 1280, below);
  const turnAuto = () => { setAuto(true); stalls.current = []; const i = autoNow(); started ? pickQuality(i, true) : setQ(i); go(null); };
  useEffect(() => { if (auto && sources) { stalls.current = []; if (!started) setQ(autoNow()); } }, [sources, narrow, tiny]);
  useEffect(() => { if (auto && sources && fs) { const i = autoNow(); if (heightOf(sources[i]) > heightOf(sources[q] ?? sources[0])) pickQuality(i, true); } }, [fs]);
  const onStall = () => {
    const v = vid.current;
    if (!auto || !sources || !v || v.paused || v.seeking || v.currentTime < 1) return;
    const now = performance.now();
    stalls.current = [...stalls.current.filter(x => now - x < 20000), now];
    if (stalls.current.length < 2) return;
    stalls.current = [];
    const cur = heightOf(sources[q] ?? sources[0]);
    const i = autoNow(cur);
    if (heightOf(sources[i]) < cur) pickQuality(i, true);
  };
  /* плейлист: последний кадр остаётся на холсте и растворяется в первом кадре нового ролика; играл — играет дальше */
  const hasPrev = !!pl && pl.i > 0, hasNext = !!pl && pl.i < pl.items.length - 1;
  const goItem = (j: number, play?: boolean) => {
    if (!pl || j < 0 || j >= pl.items.length || j === pl.i) return;
    const v = vid.current;
    const p = play ?? (!!v && !v.paused && !v.ended);
    resume.current = { t: 0, play: p };
    if (v && v.videoWidth && !v.ended) {
      const c = snapCv.current;
      if (c) { try { c.width = v.videoWidth; c.height = v.videoHeight; c.getContext('2d')?.drawImage(v, 0, 0); setSnap(true); } catch { /* без CORS — без перетекания */ } }
    }
    if (p) setStarted(true);
    setEnded(false); setUnOff(false); setUnOn(false); setPlaying(false);
    pl.go(j);
  };
  /* «Далее»: карточка за upNextSeconds до конца; её можно отменить — тогда ролик просто закончится */
  const [unOn, setUnOn] = useState(false);
  /* плейлист: панель-лента снизу поверх кнопок; при открытии лента сразу стоит на текущем ролике */
  const [listOpen, setListOpen] = useState(false);
  const laneEl = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const ln = laneEl.current; if (!listOpen || !ln || !pl) return;
    const c = ln.children[pl.i] as HTMLElement | undefined;
    if (c) ln.scrollLeft = c.offsetLeft - (ln.clientWidth - c.offsetWidth) / 2;
  }, [listOpen]);
  /* колесо мыши листает ленту вбок */
  useEffect(() => {
    const ln = laneEl.current; if (!ln) return;
    const w = (e: WheelEvent) => { if (Math.abs(e.deltaY) > Math.abs(e.deltaX) && ln.scrollWidth > ln.clientWidth) { e.preventDefault(); ln.scrollLeft += e.deltaY; } };
    ln.addEventListener('wheel', w, { passive: false });
    return () => ln.removeEventListener('wheel', w);
  }, [pl ? 1 : 0]);
  const [unOff, setUnOff] = useState(false);
  const upNext = (t: number, d: number, isPlaying: boolean) => {
    const left = d - t;
    const on = !!pl && autoAdvance && hasNext && upNextSeconds > 0 && !unOff && isPlaying && d > upNextSeconds * 2 && left > 0 && left <= upNextSeconds;
    setUnOn(on);
    if (on) root.current?.style.setProperty('--pz-vd-un', clamp(1 - left / upNextSeconds).toFixed(3));
  };
  const afterLoad = () => {
    const v = vid.current, r = resume.current;
    if (!v || !r) return;
    resume.current = null;
    v.currentTime = r.t;
    const done = () => { v.removeEventListener('seeked', done); if (r.play) void v.play().catch(() => {}); window.setTimeout(() => setSnap(false), 60); };
    v.addEventListener('seeked', done);
  };

  /* кадр-превью: отдельное скрытое видео встаёт на время под курсором и рисуется на холст; запросы не копятся */
  const want = useRef<number | null>(null);
  const busy = useRef(false);
  const [thumb, setThumb] = useState(false);
  const pumpPreview = () => {
    const pv = prevVid.current;
    if (!pv || busy.current || want.current == null || pv.readyState < 1) return;
    busy.current = true; pv.currentTime = want.current; want.current = null;
  };
  const onPrevSeeked = () => {
    const pv = prevVid.current, c = prevCv.current;
    busy.current = false;
    if (pv && c) { try { c.getContext('2d')?.drawImage(pv, 0, 0, c.width, c.height); setThumb(true); } catch { setThumb(false); } }
    pumpPreview();
  };
  useEffect(() => { setThumb(false); }, [url]);

  const frac = (e: { clientX: number }) => { const b = seekEl.current!.getBoundingClientRect(); return clamp((e.clientX - b.left) / b.width); };
  const seekDown = (e: RPE<HTMLDivElement>) => {
    if (e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragging.current = true; setDrag(true);
    const x = frac(e); paint(x);
    const v = vid.current; if (v?.duration) v.currentTime = x * v.duration;
    setEnded(false);
  };
  const seekMove = (e: RPE<HTMLDivElement>) => {
    const x = frac(e), d = vid.current?.duration || 0;
    setHover({ x: x * seekEl.current!.clientWidth, t: x * d });
    root.current?.style.setProperty('--pz-vd-h', x.toFixed(4));
    if (previews) { want.current = x * d; pumpPreview(); }
    if (!dragging.current) return;
    paint(x);
    const v = vid.current; if (v?.duration) v.currentTime = x * v.duration;
    poke();
  };
  const seekUp = () => { dragging.current = false; setDrag(false); };

  const volEl = useRef<HTMLDivElement>(null);
  const volDrag = useRef(false);
  /* как в ParzSlider: щелчок — значение плавно перетекает; режим перетаскивания (без задержки) — только когда палец сдвинулся больше чем на 2 px */
  const volX = useRef<number | null>(null);
  const [vdrag, setVdrag] = useState(false);
  /* капля громкости «втягивается» только после первого раскрытия — иначе вздрагивала бы при загрузке */
  const [volArmed, setVolArmed] = useState(false);
  /* громкость при перетаскивании: сразу в видео и в CSS-переменную — без задержки за пальцем */
  const volAt = (e: { clientX: number }) => {
    const b = volEl.current!.getBoundingClientRect(), n = clamp((e.clientX - b.left) / b.width), v = vid.current;
    volEl.current!.style.setProperty('--v', String(n));
    if (v) { v.volume = n; v.muted = n === 0; }
  };
  const volEnd = () => { volDrag.current = false; volX.current = null; setVdrag(false); };

  const key = (e: RKE<HTMLDivElement>) => {
    const t = e.target as HTMLElement;
    const k = e.key.toLowerCase();
    if (listOpen && k === 'escape') { e.preventDefault(); setListOpen(false); root.current?.querySelector<HTMLElement>('.pz-vd-tools [aria-expanded="true"], .pz-vd-tools .pz-vd-btn')?.focus(); return; }
    if (t.closest('.pz-vd-pop')) { if (k === 'escape') { e.preventDefault(); nested ? go('more', -1) : go(null); root.current?.querySelector<HTMLElement>('.pz-vd-tools .is-on')?.focus(); } return; }
    const onSeek = t === seekEl.current, onVol = t === volEl.current;
    if (k === ' ' || k === 'k') { if (t.tagName === 'BUTTON' && k === ' ') return; e.preventDefault(); toggle(true); }
    else if (k === 'arrowright' || k === 'l') { e.preventDefault(); onVol ? setVolume(vol + 0.05) : seekBy(k === 'l' ? skipSeconds : 5); }
    else if (k === 'arrowleft' || k === 'j') { e.preventDefault(); onVol ? setVolume(vol - 0.05) : seekBy(k === 'j' ? -skipSeconds : -5); }
    else if (k === 'arrowup' && !onSeek) { e.preventDefault(); setVolume((muted ? 0 : vol) + 0.05, true); }
    else if (k === 'arrowdown' && !onSeek) { e.preventDefault(); setVolume((muted ? 0 : vol) - 0.05, true); }
    else if (pl && e.shiftKey && k === 'n') { e.preventDefault(); goItem(pl.i + 1); }
    else if (pl && e.shiftKey && k === 'p') { e.preventDefault(); goItem(pl.i - 1); }
    else if (k === 'm') toggleMute();
    else if (k === 'f' && showFullscreen) toggleFs();
    else if (k === 'c' && tracks?.length) { const n = sub >= 0 ? -1 : Math.max(0, tracks.findIndex(t => t.default)); setSub(n); show({ kind: 'info', text: n >= 0 ? tracks[n].label : L.off }); }
    else if (/^[0-9]$/.test(k) && !e.ctrlKey && !e.metaKey) { const v = vid.current; if (v?.duration) seekTo(v.duration * (+k / 10)); }
    else if (k === 'home' && onSeek) { e.preventDefault(); seekTo(0); }
    else if (k === 'end' && onSeek) { e.preventDefault(); seekTo(1e9); }
    poke();
  };

  /* касание: первое показывает панель, двойное по краю — перемотка; мышь: щелчок — пауза, двойной — полный экран */
  const lastTap = useRef(0);
  const surfaceUp = (e: RPE<HTMLDivElement>) => {
    if (e.button !== 0) return;
    if (menuOpen) { setPage(null); return; }
    if (listOpen) { setListOpen(false); return; }
    const now = performance.now(), b = e.currentTarget.getBoundingClientRect(), side = (e.clientX - b.left) / b.width;
    const dbl = now - lastTap.current < 300;
    lastTap.current = dbl ? 0 : now;
    if (e.pointerType === 'mouse') { if (dbl) { toggle(); if (showFullscreen) toggleFs(); } else toggle(true); return; }
    if (dbl && (side < 0.35 || side > 0.65)) { seekBy(side < 0.5 ? -skipSeconds : skipSeconds); poke(); return; }
    if (!started || !playing) { toggle(true); return; }
    if (shown) { setShown(false); window.clearTimeout(hideT.current); } else poke();
  };

  const level = muted ? 0 : vol;
  const visible = shown || !playing || menuOpen || listOpen;
  /* значок звука: когда интерфейс спрятался, отъезжает в угол и держится ещё 3 с, потом тоже растворяется */
  const [aStay, setAStay] = useState(false);
  useEffect(() => {
    if (visible) { setAStay(false); return; }
    setAStay(true);
    const id = window.setTimeout(() => setAStay(false), 3000);
    return () => window.clearTimeout(id);
  }, [visible]);
  const vars = { '--_tn': (showSettings ? 1 : 0) + (showFullscreen ? 1 : 0), ...(accent && { '--pz-vd-accent': accent }), ...(radius != null && { '--pz-vd-r': `${radius}px` }), aspectRatio, ...style } as CSSProperties;
  const cls = ['pz-vd', `pz-vd--${motion}`, playing && 'is-playing', visible ? 'is-shown' : 'is-hidden', drag && 'is-drag', fs && 'is-fs', !started && 'is-idle', menuOpen && 'is-menu', aStay && 'is-astay', narrow && 'is-narrow', tiny && 'is-tiny', (remote || pipOn) && 'is-remote', unOn && 'is-un', listOpen && 'is-sheet', className].filter(Boolean).join(' ');
  const rateTxt = (s: number) => (s === 1 ? L.normal : `${s}×`);
  const cur = sources?.[Math.min(q, sources.length - 1)];
  const hasQ = !!sources && sources.length > 1;
  const hasSubs = !!tracks?.length;
  const qBadge = autoBadge(cur);
  const fsBtn = showFullscreen && <button type="button" className="pz-vd-btn" onClick={toggleFs} aria-label={fs ? L.exitFullscreen : L.fullscreen} data-tip={fs ? L.exitFullscreen : L.fullscreen}><Full on={fs} /></button>;
  const share = (pip || (showCast && (castOk || remote))) && <>
    {pip && <button type="button" className={`pz-vd-btn${pipOn ? ' is-on' : ''}`} onClick={togglePip} aria-label={pipOn ? L.pipBack : L.pip} data-tip={pipOn ? L.pipBack : L.pip} aria-pressed={pipOn}><Pip /></button>}
    {showCast && (castOk || remote) && <button type="button" className={`pz-vd-btn${remote ? ' is-on' : ''}`} onClick={cast} aria-label={remote ? L.castBack : L.cast} data-tip={remote ? L.castBack : L.cast} aria-pressed={remote}><Cast /></button>}
  </>;
  /* над шкалой: слева — картинка в картинке и трансляция, справа — настройки и полный экран */
  const tool = (id: Page, label: string, icon: ReactNode) => (
    <button type="button" className={`pz-vd-btn${page === id ? ' is-on' : ''}`} onClick={() => open(id)} aria-label={label} data-tip={label} aria-haspopup="menu" aria-expanded={page === id}>{icon}</button>
  );

  return (
    <div ref={root} className={cls} style={vars} tabIndex={0} role="region" aria-label={L.player} onKeyDown={key} onContextMenu={onCtx}
      onPointerMove={e => { if (e.pointerType === 'mouse') poke(); }}
      onPointerOver={tipOver} onPointerOut={tipOut} onPointerDown={tipHide}
      onPointerLeave={e => { if (e.pointerType !== 'mouse') return; /* палец после каждого касания «уходит» — прятать по этому нельзя */ if (playing && !dragging.current && !menuOpen) { window.clearTimeout(hideT.current); hideT.current = window.setTimeout(() => setShown(false), 600); } setHover(null); }}>
      <video ref={vid} className="pz-vd-video" src={url} autoPlay={autoPlay} muted={muted0} loop={loop} playsInline preload="metadata" crossOrigin={tracks?.length ? 'anonymous' : undefined}
        x-webkit-airplay="allow"
        onPlay={() => { setPlaying(true); setEnded(false); setStarted(true); onPlay?.(); }}
        onPause={() => { setPlaying(false); paint(); onPause?.(); }}
        onEnded={() => { setPlaying(false); onEnded?.(); if (pl && autoAdvance && hasNext && !unOff) { goItem(pl.i + 1, true); return; } setEnded(true); setUnOn(false); paint(1); }}
        onLoadedMetadata={e => { setDur(e.currentTarget.duration); setReady(true); e.currentTarget.defaultPlaybackRate = rate; e.currentTarget.playbackRate = rate; afterLoad(); paint(); paintBuf(); }}
        onDurationChange={e => { setDur(e.currentTarget.duration); paint(); }}
        onTimeUpdate={e => { if (!playing && !dragging.current) paint(); upNext(e.currentTarget.currentTime, e.currentTarget.duration, !e.currentTarget.paused); onTimeUpdate?.(e.currentTarget.currentTime, e.currentTarget.duration); }}
        onProgress={paintBuf} onSeeked={() => { paint(); paintBuf(); }}
        onWaiting={() => { setWait(true); onStall(); }} onCanPlay={() => { setWait(false); setReady(true); }} onLoadedData={() => setReady(true)} onPlaying={() => setWait(false)}
        onRateChange={e => { const r = e.currentTarget.playbackRate; if (r > 0) setRate(r); }}
        onVolumeChange={e => { setMuted(e.currentTarget.muted); setVol(e.currentTarget.volume); }}>
        {tracks?.map(t => <track key={t.src} kind="subtitles" src={t.src} srcLang={t.srclang} label={t.label} />)}
      </video>
      {poster && <img ref={posterEl} className={`pz-vd-poster${posterIn ? ' is-in' : ''}${started && !ended ? ' is-off' : ''}`} src={poster} alt="" aria-hidden="true" draggable={false} decoding="async" onLoad={() => setPosterIn(true)} />}
      {/* трансляция: обложка (или тёмный фон), значок и надпись; «вернуть» открывает системный выбор устройства —
          отключить трансляцию сам сайт не может, это делает пользователь в окне браузера */}
      {/* то же для «картинки в картинке»: здесь вернуть видео сайт может сам */}
      <div className={`pz-vd-remote${remote || pipOn ? ' on' : ''}`} aria-hidden={!(remote || pipOn)}>
        {poster && <img className="pz-vd-remote-bg" src={poster} alt="" draggable={false} />}
        <div className="pz-vd-remote-c" key={remote ? 'cast' : 'pip'}>
          <span className="pz-vd-remote-i">{remote ? <Cast /> : <Pip />}</span>
          <span className="pz-vd-remote-t">{remote ? L.casting : L.pipActive}</span>
          <button type="button" className="pz-vd-remote-b" onClick={remote ? cast : togglePip} tabIndex={remote || pipOn ? 0 : -1} onPointerUp={e => e.stopPropagation()}>{remote ? L.castBack : L.pipBack}</button>
        </div>
      </div>
      <canvas ref={snapCv} className={`pz-vd-snap${snap ? ' on' : ''}`} aria-hidden="true" />
      {previews && <video ref={prevVid} className="pz-vd-pv" src={url} muted playsInline preload="metadata" aria-hidden="true" tabIndex={-1} onSeeked={onPrevSeeked} onLoadedMetadata={pumpPreview} />}

      <div className="pz-vd-surface" onPointerUp={surfaceUp} aria-hidden="true" />
      <div className="pz-vd-scrim" aria-hidden="true" />
      <div className="pz-vd-cue" aria-live="off">{cue && <span key={cue}>{cue}</span>}</div>
      <div className={`pz-vd-spin${(wait && playing) || snap ? ' on' : ''}`} aria-hidden="true"><svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="16" /></svg></div>

      {flash && (
        <div key={flash.k} className={`pz-vd-flash pz-vd-flash--${flash.kind}`} aria-hidden="true" onAnimationEnd={() => setFlash(null)}>
          {flash.kind === 'vol' || flash.kind === 'mute' ? <><Speaker level={flash.kind === 'mute' ? 0 : 1} /><b>{flash.text}</b></>
            : flash.kind === 'fwd' || flash.kind === 'back' ? <><Skip dir={flash.kind === 'fwd' ? 1 : -1} n={skipSeconds} /><b>{flash.text}</b></>
            : <b>{flash.text}</b>}
        </div>
      )}


      {/* верх слева: название, пометка качества, глава (на узком — под верхним рядом) */}
      {(title != null || qBadge || chapters?.length) && (
        <div className="pz-vd-head">
          <div className="pz-vd-head-t">
            {title != null && <span className="pz-vd-title">{title}</span>}
            {qBadge && <span className="pz-vd-q" key={qBadge}>{qBadge}</span>}
          </div>
          {chapters?.length ? <span className="pz-vd-chap"><ChapterName segs={segs} root={root} /></span> : null}
        </div>
      )}

      {/* верх справа: формат звука и отдельная капсула громкости */}
      <div className="pz-vd-topr">
        {audioBadge != null && <AudioBadge value={audioBadge} />}
        {showVolume && (
          <div className={`pz-vd-cap pz-vd-vol${vdrag ? ' is-drag' : ''}${volArmed ? ' is-armed' : ''}`} onPointerEnter={e => { if (e.pointerType === 'mouse') setVolArmed(true); }} onFocus={() => setVolArmed(true)}>
            {canHover && (
              <div ref={volEl} className="pz-vd-vrail" role="slider" tabIndex={0} aria-label={L.volume} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(level * 100)}
                style={{ '--v': level } as CSSProperties}
                onPointerDown={e => { e.currentTarget.setPointerCapture(e.pointerId); volX.current = e.clientX; volAt(e); }}
                onPointerMove={e => { if (volX.current == null) return; if (!volDrag.current) { if (Math.abs(e.clientX - volX.current) < 2) return; volDrag.current = true; setVdrag(true); } volAt(e); poke(); }} onPointerUp={volEnd} onPointerCancel={volEnd}>
                <i /><b />
              </div>
            )}
            <button type="button" className="pz-vd-btn" onClick={toggleMute} aria-label={level === 0 ? L.unmute : L.mute} data-tip={level === 0 ? L.unmute : L.mute}><Speaker level={level} /></button>
          </div>
        )}
      </div>

      {/* центр, как в плеере Apple */}
      <div className="pz-vd-center">
        {/* плейлист: «предыдущий/следующий» по краям; на узком плеере — вместо ±10 */}
        {pl && <button type="button" className="pz-vd-cbtn pz-vd-cskip pz-vd-cnav pz-vd-cskip--b" onClick={() => { goItem(pl.i - 1); poke(); }} disabled={!hasPrev} aria-label={L.previous} tabIndex={-1}><Prev /></button>}
        {showSkip && !(pl && narrow) && <button type="button" className="pz-vd-cbtn pz-vd-cskip pz-vd-cskip--b" onClick={() => { seekBy(-skipSeconds, false); poke(); }} aria-label={sk(L.back)} tabIndex={-1}><Skip dir={-1} n={skipSeconds} /></button>}
        <button type="button" className={`pz-vd-cbtn pz-vd-cplay${!ready && !started ? ' is-load' : ''}`} onClick={() => { toggle(); poke(); }} aria-label={playing ? L.pause : ended ? L.replay : L.play} aria-busy={!ready && !started || undefined}>
          <PlayPause playing={playing} ended={ended} />
          <span className="pz-vd-dots" aria-hidden="true"><i /><i /><i /></span>
        </button>
        {showSkip && !(pl && narrow) && <button type="button" className="pz-vd-cbtn pz-vd-cskip pz-vd-cskip--f" onClick={() => { seekBy(skipSeconds, false); poke(); }} aria-label={sk(L.forward)} tabIndex={-1}><Skip dir={1} n={skipSeconds} /></button>}
        {pl && <button type="button" className="pz-vd-cbtn pz-vd-cskip pz-vd-cnav pz-vd-cskip--f" onClick={() => { goItem(pl.i + 1); poke(); }} disabled={!hasNext} aria-label={L.next} tabIndex={-1}><Next /></button>}
      </div>

      {/* над шкалой справа: две отдельные капсулы */}
      <div className="pz-vd-tools" onPointerDown={e => e.stopPropagation()}>
        {showSettings && (
          <div className="pz-vd-cap">
            {!narrow && hasQ && tool('quality', L.quality, <Quality />)}
            {!narrow && hasSubs && tool('subs', L.subtitles, <Subs />)}
            {!narrow && tool('speed', L.speed, <Gauge />)}
            {pl && !narrow && <button type="button" className={`pz-vd-btn${listOpen ? ' is-on' : ''}`} onClick={() => { setPage(null); setListOpen(o => !o); }} aria-label={L.playlist} data-tip={L.playlist} aria-expanded={listOpen}><List /></button>}
            {tool('more', L.more, <Dots />)}
          </div>
        )}
        {fsBtn && <div className="pz-vd-cap">{fsBtn}</div>}
      </div>
      {pl && (
        <div className={`pz-vd-sheet${listOpen ? ' on' : ''}`} role="dialog" aria-label={L.playlist} aria-hidden={!listOpen} onPointerDown={e => e.stopPropagation()}>
          <div className="pz-vd-sheet-h">
            <span className="pz-vd-sheet-i"><List /></span><b>{L.playlist}</b><small>{pl.i + 1} / {pl.items.length}</small>
            <button type="button" className="pz-vd-sheet-x" onClick={() => setListOpen(false)} tabIndex={listOpen ? 0 : -1} aria-label={L.cancel}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path className="s" d="M7 7l10 10M17 7L7 17" /></svg>
            </button>
          </div>
          <div ref={laneEl} className="pz-vd-lane" role="listbox" aria-label={L.playlist}>
            {pl.items.map((it, j) => (
              <button key={j} type="button" role="option" aria-selected={j === pl.i} tabIndex={listOpen ? 0 : -1} className={`pz-vd-card${j === pl.i ? ' is-on' : ''}`} style={{ '--i': j } as CSSProperties}
                onClick={() => { setListOpen(false); goItem(j); }}>
                <span className="pz-vd-card-th">{it.poster && <img src={it.poster} alt="" draggable={false} loading="lazy" />}
                  {j === pl.i ? <i className="pz-vd-pli-eq" aria-hidden="true"><b /><b /><b /></i> : it.duration ? <em>{fmt(it.duration)}</em> : null}</span>
                <span className="pz-vd-card-t">{it.title ?? `${j + 1}`}</span>
                {j === pl.i && <small>{L.nowPlaying}</small>}
              </button>
            ))}
          </div>
        </div>
      )}
      {pl && hasNext && (
        <div className={`pz-vd-un${unOn ? ' on' : ''}`} aria-hidden={!unOn} onPointerDown={e => e.stopPropagation()}>
          <button type="button" className="pz-vd-un-go" onClick={() => goItem(pl.i + 1, true)} tabIndex={unOn ? 0 : -1} aria-label={`${L.playNow}: ${typeof pl.items[pl.i + 1].title === 'string' ? pl.items[pl.i + 1].title : ''}`}>
            <span className="pz-vd-un-th">{pl.items[pl.i + 1].poster && <img src={pl.items[pl.i + 1].poster} alt="" draggable={false} />}
              <svg viewBox="0 0 28 28" aria-hidden="true" className="pz-vd-un-ring"><circle cx="14" cy="14" r="11" /><circle className="p" cx="14" cy="14" r="11" /></svg>
              <span className="pz-vd-un-play"><Next /></span></span>
            <span className="pz-vd-un-t"><small>{L.upNext}</small><b>{pl.items[pl.i + 1].title}</b></span>
          </button>
          <button type="button" className="pz-vd-un-x" onClick={() => { setUnOff(true); setUnOn(false); }} tabIndex={unOn ? 0 : -1} aria-label={L.cancel}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path className="s" d="M7 7l10 10M17 7L7 17" /></svg>
          </button>
        </div>
      )}
      {share && !tiny && <div className="pz-vd-tools pz-vd-tools--l" onPointerDown={e => e.stopPropagation()}><div className="pz-vd-cap">{share}</div></div>}

      {/* меню — над капсулами справа; высота перетекает между страницами */}
      <div ref={popEl} className={`pz-vd-pop${menuOpen ? ' on' : ''}${snapH ? ' is-snap' : ''}`} role="menu" aria-label={L.settings} aria-hidden={!menuOpen} {...(!menuOpen && { inert: "" })} style={{ height: popH }} onPointerDown={e => e.stopPropagation()}>
        {view && (
          <div ref={pageEl} key={view} className={`pz-vd-page pz-vd-page--${dir > 0 ? 'in' : 'back'}`}>
            {view === 'more' && <>
              {!narrow && <Head go={go} icon={<Dots />} label={L.more} />}
              {narrow && pl && <button type="button" role="menuitem" className="pz-vd-mi" onClick={() => { go(null); setListOpen(true); }}><span className="pz-vd-mi-i"><List /></span><span className="pz-vd-mi-l">{L.playlist}</span><span className="pz-vd-mi-v">{pl.i + 1} / {pl.items.length}</span><Chevron /></button>}
              {narrow && hasQ && <Row go={go} icon={<Quality />} label={L.quality} value={auto ? `${L.auto} · ${cur?.label ?? ''}` : cur?.label} to="quality" />}
              {narrow && <Row go={go} icon={<Gauge />} label={L.speed} value={rateTxt(rate)} to="speed" />}
              {narrow && hasSubs && <Row go={go} icon={<Subs />} label={L.subtitles} value={sub >= 0 ? tracks![sub]?.label : L.off} to="subs" />}
              {tiny && pip && <button type="button" role="menuitem" className="pz-vd-mi" onClick={() => { go(null); togglePip(); }}><span className="pz-vd-mi-i"><Pip /></span><span className="pz-vd-mi-l">{L.pip}</span></button>}
              {tiny && showCast && (castOk || remote) && <button type="button" role="menuitem" className="pz-vd-mi" onClick={() => { go(null); cast(); }}><span className="pz-vd-mi-i"><Cast /></span><span className="pz-vd-mi-l">{L.cast}</span></button>}
              <div className="pz-vd-mi pz-vd-mi--sw">
                <span className="pz-vd-mi-i"><Loop /></span><span className="pz-vd-mi-l">{L.loop}</span>
                <ParzToggle size="sm" checked={loop} onChange={setLoop} ariaLabel={L.loop} accent={accent ?? 'var(--pz-vd-accent)'} />
              </div>
            </>}
            {view === 'quality' && sources && <>
              <Head go={go} back={nested} icon={<Quality />} label={L.quality} />
              <Opt on={auto} onPick={turnAuto}>{L.auto}{auto && cur && <small className="pz-vd-opt-sub">{cur.label}</small>}</Opt>
              {sources.map((s, i) => <Opt key={s.src + i} on={!auto && i === q} onPick={() => pickQuality(i)}>{s.label}{autoBadge(s) && <em>{autoBadge(s)}</em>}</Opt>)}
            </>}
            {view === 'speed' && <>
              <Head go={go} back={nested} icon={<Gauge />} label={L.speed} />
              {[...speeds].reverse().map(s => <Opt key={s} on={s === rate} onPick={() => { setRate(s); go(nested ? 'more' : null, -1); }}>{rateTxt(s)}</Opt>)}
            </>}
            {view === 'subs' && tracks && <>
              <Head go={go} back={nested} icon={<Subs />} label={L.subtitles} />
              <Opt on={sub < 0} onPick={() => { setSub(-1); go(nested ? 'more' : null, -1); }}>{L.off}</Opt>
              {tracks.map((t, i) => <Opt key={t.src} on={i === sub} onPick={() => { setSub(i); go(nested ? 'more' : null, -1); }}>{t.label}</Opt>)}
            </>}
          </div>
        )}
      </div>

      {/* общая подсказка к кнопкам: при переходе на соседнюю кнопку не гаснет, а перетекает к ней */}
      <div ref={tipEl} className={`pz-vd-bt${bt.on ? ' on' : ''}${bt.on && bt.move ? ' is-move' : ''}${bt.below ? ' is-below' : ''}`} aria-hidden="true"><span key={bt.text}>{bt.text}</span></div>
      {/* меню правого клика: знак, «Parz UI — by CarPark Team», версия и «О Parz UI» */}
      {ctx && (
        <div ref={ctxEl} key={ctx.k} className="pz-vd-ctx" role="menu" aria-label="Parz UI" onPointerDown={e => e.stopPropagation()} onContextMenu={e => e.preventDefault()}>
          <div className="pz-vd-ctx-h">
            <span className="pz-vd-ctx-logo"><ParzMark /></span>
            <span className="pz-vd-ctx-t"><b>Parz UI</b><small>by CarPark Team</small></span>
          </div>
          {PARZ_VERSION && <div className="pz-vd-ctx-v">{L.version} {PARZ_VERSION}</div>}
          <a className="pz-vd-mi pz-vd-ctx-a" role="menuitem" href={PARZ_CREDIT_URL} target="_blank" rel="noopener" onClick={() => setCtx(null)}>
            <span className="pz-vd-mi-i"><Info /></span><span className="pz-vd-mi-l">{L.about}</span>
          </a>
        </div>
      )}

      {/* внизу: шкала в своей капсуле — время, полоса, сколько осталось */}
      <div className="pz-vd-bar" onPointerDown={e => e.stopPropagation()}>
        <span className="pz-vd-t" ref={curEl}>0:00</span>
        <div ref={seekEl} className="pz-vd-seek" role="slider" tabIndex={0} aria-label={L.seek} aria-valuemin={0} aria-valuemax={Math.round(dur)}
          onPointerDown={seekDown} onPointerMove={seekMove} onPointerUp={seekUp} onPointerCancel={seekUp} onPointerLeave={() => !dragging.current && setHover(null)}>
          <div className="pz-vd-segs">
            {/* одна сплошная дорожка; начало главы — тонкая черта, которая окрашивается, когда её прошли */}
            <div className="pz-vd-rail" style={{ '--s': 0, '--l': 1 } as CSSProperties}>
              <i className="pz-vd-buf" /><i className="pz-vd-hov" /><i className="pz-vd-fill" />
            </div>
            {segs.slice(1).map(x => <i key={x.s} className="pz-vd-cmark" style={{ '--s': x.s } as CSSProperties} />)}
          </div>
          <i className="pz-vd-knob" />
          <div className={`pz-vd-tip${hover ? ' on' : ''}${previews && thumb ? ' has-pv' : ''}`} style={{ '--x': `${lastHover.current.x}px` } as CSSProperties}>
            {previews && <canvas ref={prevCv} width={192} height={108} className="pz-vd-tip-pv" aria-hidden="true" />}
            {chapters?.length ? <span className="pz-vd-tip-ch" key={chapterAt(lastHover.current.t / (dur || 1))}>{chapterAt(lastHover.current.t / (dur || 1))}</span> : null}
            <b>{fmt(lastHover.current.t)}</b>
          </div>
        </div>
        <button type="button" className="pz-vd-t pz-vd-t--r" onClick={() => setRemain(r => !r)} aria-label={L.remaining} aria-pressed={remain}><span ref={restEl}>−0:00</span></button>
      </div>
    </div>
  );
}

/* название текущей главы рядом со временем: следит за позицией сам, без перерисовки всего плеера; смена — плавная */
function ChapterName({ segs, root }: { segs: { s: number; e: number; title: string }[]; root: React.RefObject<HTMLDivElement> }) {
  const [t, setT] = useState(segs[0]?.title ?? '');
  useEffect(() => {
    let id = 0;
    const tick = () => {
      const p = parseFloat(root.current?.style.getPropertyValue('--pz-vd-p') || '0');
      const x = segs.find(z => p >= z.s && p < z.e)?.title ?? segs[segs.length - 1]?.title ?? '';
      setT(o => (o === x ? o : x));
      id = window.setTimeout(tick, 250);
    };
    tick();
    return () => window.clearTimeout(id);
  }, [segs, root]);
  return t ? <span key={t}>{t}</span> : null;
}
