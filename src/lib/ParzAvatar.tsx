import { Children, createContext, forwardRef, isValidElement, useContext, useEffect, useImperativeHandle, useLayoutEffect, useRef, useState, type CSSProperties, type MouseEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Icon, type IconSpec } from './Icon';
import { ParzBadge } from './ParzBadge';
import { parzSpringCss, useParzMotion, type ParzMotionPreset } from './ParzProvider';
import { PARZ_AVATAR_PRESETS } from './ParzAvatarPresets';
import './ParzAvatar.css';

export type ParzAvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type ParzAvatarShape = 'circle' | 'rounded' | 'square';
export type ParzAvatarStatus = 'online' | 'away' | 'busy' | 'offline';
export type ParzAvatarTheme = 'dark' | 'light';

/** Parz UI · Parz Avatar — фото, инициалы или значок; фото проявляется мягко, статус перетекает, кольцо «историй». */
export interface ParzAvatarProps {
  /** Адрес фото. Пока грузится — инициалы с мерцанием; если не загрузилось — инициалы или значок. */
  src?: string;
  /** Описание фото для экранных дикторов. По умолчанию — name. */
  alt?: string;
  /** Имя человека: из него берутся инициалы и цвет фона. */
  name?: string;
  /** Свои инициалы вместо вычисленных из name (1–2 знака). */
  initials?: string;
  /** Значок, если нет ни фото, ни имени: встроенный, 'ms:имя', 'mi:имя' или свой ReactNode. По умолчанию силуэт. */
  icon?: IconSpec;
  /** 'xs' 24, 'sm' 32, 'md' 40, 'lg' 56, 'xl' 72 или число в пикселях. По умолчанию 'md'. */
  size?: ParzAvatarSize | number;
  /** По умолчанию 'circle'. */
  shape?: ParzAvatarShape;
  /** Цвет фона инициалов. По умолчанию подбирается по имени — у одного имени всегда один цвет. */
  color?: string;
  /** Цвет инициалов. По умолчанию белый. */
  textColor?: string;
  /** Точка статуса в углу. */
  status?: ParzAvatarStatus;
  /** Текст статуса для экранных дикторов, например «в сети». */
  statusLabel?: string;
  /** Свой цвет точки статуса. */
  statusColor?: string;
  /** Пульс у статуса 'online'. По умолчанию true. */
  statusPulse?: boolean;
  /** Кольцо вокруг: true — яркое («есть новая история»), 'seen' — серое («просмотрено»), строка — свой цвет или градиент. */
  ring?: boolean | 'seen' | string;
  /** Градиент яркого кольца плавно течёт по кругу. По умолчанию true; false — кольцо неподвижно. */
  ringSpin?: boolean;
  /** Счётчик в углу (ParzBadge). 0 прячет его. */
  count?: number;
  /** Максимум для count. По умолчанию 99. */
  countMax?: number;
  /** Подсказка с именем при наведении. В группе по умолчанию включена. */
  tooltip?: boolean | ReactNode;
  /** Делает аватар кнопкой. */
  onClick?: (e: MouseEvent<HTMLElement>) => void;
  /** Делает аватар ссылкой. */
  href?: string;
  target?: string;
  /** Фон, на котором стоит аватар: от него обводка статуса, счётчика и разделитель в группе. По умолчанию 'dark'. */
  theme?: ParzAvatarTheme;
  /** Свой цвет этого фона (вместо theme). */
  surfaceColor?: string;
  /** Пресет движения. По умолчанию из ParzProvider. */
  motion?: ParzMotionPreset;
  /** Аватар можно сменить: по нажатию открывается окно с готовыми рисунками, инициалами и загрузкой с диска. */
  editable?: boolean;
  /** Готовые картинки в окне выбора. По умолчанию PARZ_AVATAR_PRESETS. */
  presets?: string[];
  /** Выбор в окне: готовая картинка, инициалы или загруженный файл. */
  onChange?: (v: ParzAvatarChange) => void;
  /** Загрузка файла на сервер; верните адрес готового фото. Пока идёт — размытое превью и бегущие точки.
   *  Без него фото показывается сразу из файла (адрес blob:). Ошибка — аватар возвращается к прежнему виду. */
  onUpload?: (file: File) => Promise<string> | string;
  /** Какие файлы можно выбрать. По умолчанию 'image/*'. */
  accept?: string;
  /** Ошибка onUpload: аватар уже вернулся к прежнему виду, здесь можно показать сообщение. */
  onUploadError?: (error: unknown, file: File) => void;
  /** Управляемый режим смены: показывается только то, что передано. Строка — адрес фото, null — инициалы.
   *  Выбор в окне лишь вызывает onChange; без value аватар меняется сам. */
  value?: string | null;
  /** Подписи окна выбора. */
  labels?: Partial<ParzAvatarLabels>;
  disabled?: boolean;
  className?: string;
  style?: CSSProperties;
}

export type ParzAvatarChange = { kind: 'preset'; src: string } | { kind: 'initials' } | { kind: 'upload'; file: File; src: string };
export interface ParzAvatarLabels { title: string; initials: string; upload: string; uploading: string; edit: string; /** Подпись готовой картинки для экранных дикторов; {n} — её номер. */ preset: string }
const LABELS: ParzAvatarLabels = { title: 'Choose avatar', initials: 'Initials', upload: 'Upload photo', uploading: 'Uploading…', edit: 'Change avatar', preset: 'Avatar {n}' };

const SIZES: Record<ParzAvatarSize, number> = { xs: 24, sm: 32, md: 40, lg: 56, xl: 72 };
const SURFACE: Record<ParzAvatarTheme, string> = { dark: '#0c0c0f', light: '#f3f4f7' };
/* пары для градиента фона инициалов: ровная яркость, белый текст читается на всех */
const PALETTE: [string, string][] = [
  ['#ff9a6b', '#f2545b'], ['#ffc163', '#f08a24'], ['#62e0a1', '#17a66a'], ['#5fd3ff', '#2f78f0'], ['#9d8cff', '#5a46e8'],
  ['#ff86d6', '#b04ce6'], ['#f5cf55', '#d99a12'], ['#5ee8d6', '#119c90'], ['#a3b1ff', '#5d6be0'], ['#ffa1b4', '#e8506f']
];
const STATUS_COLOR: Record<ParzAvatarStatus, string> = { online: '#34d27b', away: '#ffb020', busy: '#ff4d5e', offline: '#8b8b96' };
/* где на краю садится точка статуса: для круга — на диагонали 45°, для скруглённого квадрата — в скруглении */
const CORNER: Record<ParzAvatarShape, number> = { circle: 0.146, rounded: 0.07, square: 0.02 };

function hash(s: string) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
/** Инициалы: первая буква первого и последнего слова; одно слово — одна буква. */
function initialsOf(name: string, one: boolean) {
  const w = name.trim().split(/[\s._-]+/).filter(Boolean);
  if (!w.length) return '';
  const a = Array.from(w[0])[0] ?? '', b = w.length > 1 ? Array.from(w[w.length - 1])[0] ?? '' : '';
  return (one ? a : a + b).toLocaleUpperCase();
}

type GroupCtx = { size?: ParzAvatarSize | number; shape?: ParzAvatarShape; theme?: ParzAvatarTheme; surfaceColor?: string; motion?: ParzMotionPreset; tooltip: boolean; index: number };
const GCtx = createContext<GroupCtx | null>(null);

function useEase(motion?: ParzMotionPreset) {
  const spec = useParzMotion(motion);
  const { easing, ms } = parzSpringCss(spec);
  return { vars: { '--pz-av-ease': easing, '--pz-av-dur': `${ms}ms` } as CSSProperties, ms, squish: spec.squish };
}

/** Слои фото: новое проявляется поверх старого, старое убирается после перехода. */
function usePhoto(src?: string) {
  const [layers, setLayers] = useState<{ src: string; k: number; fresh: boolean }[]>([]);
  const [state, setState] = useState<'none' | 'loading' | 'ok' | 'error'>(src ? 'loading' : 'none');
  const n = useRef(0);
  useEffect(() => {
    if (!src) { setLayers([]); setState('none'); return; }
    let live = true;
    setState(s => (s === 'ok' ? 'ok' : 'loading'));
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => {
      if (!live) return;
      const k = ++n.current;
      setLayers(l => [...l.slice(-1).map(x => ({ ...x, fresh: false })), { src, k, fresh: true }]);
      setState('ok');
      // после перехода старый слой убираем, а новый больше не «свежий» — если аватар перестроится (например, появится счётчик), фото не проявится заново
      window.setTimeout(() => live && setLayers(l => l.filter(x => x.k >= k).map(x => ({ ...x, fresh: false }))), 900);
    };
    img.onerror = () => { if (live) { setLayers([]); setState('error'); } };
    img.src = src;
    return () => { live = false; };
  }, [src]);
  return { layers, state };
}

const Silhouette = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className="pz-av-sil">
    <circle cx="12" cy="7.65" r="4.1" fill="currentColor" />
    <path d="M3.8 20.45c.6-4.5 4-7.1 8.2-7.1s7.6 2.6 8.2 7.1z" fill="currentColor" />
  </svg>
);

export const ParzAvatar = forwardRef<HTMLElement, ParzAvatarProps>(function ParzAvatar(p, ref) {
  const g = useContext(GCtx);
  const size = p.size ?? g?.size ?? 'md';
  const shape = p.shape ?? g?.shape ?? 'circle';
  const theme = p.theme ?? g?.theme ?? 'dark';
  const surface = p.surfaceColor ?? g?.surfaceColor;
  const { vars: motionVars, ms, squish } = useEase(p.motion ?? g?.motion);
  const s = typeof size === 'number' ? Math.max(16, size) : SIZES[size];

  // смена аватара: своё значение после выбора в окне; новый src снаружи его сбрасывает
  const [own, setOwn] = useState<{ src?: string } | null>(null);
  useEffect(() => { setOwn(null); }, [p.src]);
  const controlled = p.value !== undefined;
  const shownSrc = controlled ? p.value ?? undefined : own ? own.src : p.src;
  const { layers, state } = usePhoto(shownSrc);
  // загрузка: размытое превью из файла и бегущие точки, пока не придёт готовое фото
  const [up, setUp] = useState<{ preview: string; final?: string; k: number } | null>(null);
  const upK = useRef(0);
  const upDone = !!up?.final && layers.some(l => l.src === up.final);
  useEffect(() => {
    if (!upDone || !up) return;
    const t = window.setTimeout(() => setUp(u => (u && u.k === up.k ? null : u)), 700);
    return () => window.clearTimeout(t);
  }, [upDone]);
  // в управляемом режиме value может не принять загруженное фото — тогда превью тоже уходит, а не висит вечно
  useEffect(() => {
    if (!up?.final || upDone) return;
    const k = up.k, t = window.setTimeout(() => setUp(u => (u && u.k === k ? null : u)), 2500);
    return () => window.clearTimeout(t);
  }, [up?.final, upDone]);
  // временные адреса blob: (загрузка без onUpload) освобождаем, когда их больше нигде не показывают, и при уходе со страницы
  const blobs = useRef(new Set<string>());
  useEffect(() => {
    for (const b of blobs.current) if (b !== shownSrc && b !== p.src && b !== p.value && b !== up?.preview) { URL.revokeObjectURL(b); blobs.current.delete(b); }
  }, [shownSrc, p.src, p.value, up?.preview]);
  useEffect(() => () => { for (const b of blobs.current) URL.revokeObjectURL(b); blobs.current.clear(); }, []);

  const name = p.name?.trim() ?? '';
  const ini = (p.initials ?? (name ? initialsOf(name, s < 28) : '')).slice(0, 2);
  const [c1, c2] = PALETTE[hash(name || ini || 'parz') % PALETTE.length];
  const bg = p.color ? `linear-gradient(135deg, color-mix(in srgb, ${p.color} 72%, #fff), ${p.color})` : `linear-gradient(135deg, ${c1}, ${c2})`;
  const hasPhoto = layers.length > 0;
  const showIcon = !ini;

  const dot = Math.max(7, Math.round(s * 0.26));
  // дырка у «не в сети» — целые пиксели той же чётности, что и точка: центр ложится ровно на пиксель, без сдвига от сглаживания
  const hole = Math.max(3, dot - 2 * Math.round(dot * 0.27));
  const stInset = Math.round(s * CORNER[shape] - dot / 2);
  const ringOn = p.ring != null && p.ring !== false;
  const ringW = Math.max(2, Math.round(s * 0.065)), ringGap = Math.max(2, Math.round(s * 0.045));

  const label = p.alt ?? (name || undefined);
  const fullLabel = [label, p.status && p.statusLabel].filter(Boolean).join(', ') || undefined;
  const editable = !!p.editable && !p.disabled;
  const interactive = (!!(p.onClick || p.href) || editable) && !p.disabled;
  const L = { ...LABELS, ...p.labels };
  const presets = p.presets ?? PARZ_AVATAR_PRESETS;

  // жидкое нажатие: при нажатии аватар сплющивается, после — пружинит как желе, от точки касания расходится капля
  const root = useRef<HTMLElement>(null);
  useImperativeHandle(ref, () => root.current as HTMLElement);
  const [pressed, setPressed] = useState(false);
  const [drop, setDrop] = useState<{ k: number; x: number; y: number } | null>(null);
  const dk = useRef(0), at = useRef({ x: 50, y: 50 });
  const jelly = (x = 50, y = 50) => {
    const el = root.current;
    if (!el || (typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches)) return;
    const k = ++dk.current;
    setDrop({ k, x, y });
    window.setTimeout(() => setDrop(d => (d && d.k === k ? null : d)), 700);
    // размах «желе» — от пресета: calm мягче, bouncy сильнее, snappy коротко и чётко
    const amp = (v: number) => (1 + (v - 1) * Math.max(0.35, squish)).toFixed(3);
    el.animate([
      { scale: '.9 .88' }, { scale: `${amp(1.08)} ${amp(0.95)}`, offset: 0.28 }, { scale: `${amp(0.97)} ${amp(1.04)}`, offset: 0.5 },
      { scale: `${amp(1.015)} ${amp(0.99)}`, offset: 0.72 }, { scale: '1 1' }
    ], { duration: Math.max(520, Math.min(900, ms)), easing: 'ease-out' });
  };
  const press = interactive ? {
    onPointerDown: (e: React.PointerEvent<HTMLElement>) => {
      if (e.button !== 0) return;
      const r = e.currentTarget.getBoundingClientRect();
      at.current = { x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 };
      setPressed(true);
    },
    onPointerUp: () => { if (pressed) { setPressed(false); jelly(at.current.x, at.current.y); } },
    onPointerLeave: () => { if (pressed) { setPressed(false); jelly(at.current.x, at.current.y); } },
    onPointerCancel: () => setPressed(false),
    onKeyDown: (e: React.KeyboardEvent<HTMLElement>) => { if (e.key === 'Enter' || e.key === ' ') jelly(); }
  } : {};
  // окно выбора: открывается по нажатию, закрывается нажатием мимо и Esc; не уходит за край экрана
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLSpanElement>(null), pk = useRef<HTMLDivElement>(null), file = useRef<HTMLInputElement>(null);
  // окно живёт в слое поверх страницы (портал), чтобы его не обрезали контейнеры; ставим под аватаром, а если внизу нет места — над ним
  const [pos, setPos] = useState<{ x: number; y: number; ox: number; up: boolean } | null>(null);
  useLayoutEffect(() => {
    if (!open) return;
    const place = () => {
      const a = root.current?.getBoundingClientRect(), el = pk.current;
      if (!a || !el) return;
      const w = el.offsetWidth, h = el.offsetHeight, vw = document.documentElement.clientWidth, vh = window.innerHeight, m = 8, gap = 10;
      const cx = a.left + a.width / 2;
      const x = Math.min(Math.max(cx, m + w / 2), vw - m - w / 2);
      const up = a.bottom + gap + h > vh - m && a.top - gap - h > m;
      const y = up ? a.top - gap - h : a.bottom + gap;
      setPos(q => (q && Math.abs(q.x - x) < 0.5 && Math.abs(q.y - y) < 0.5 && q.up === up ? q : { x, y, ox: cx - (x - w / 2), up }));
    };
    place();
    window.addEventListener('resize', place); window.addEventListener('scroll', place, true);
    return () => { window.removeEventListener('resize', place); window.removeEventListener('scroll', place, true); };
  }, [open]);
  useEffect(() => {
    if (!open) return;
    const down = (e: PointerEvent) => { const t = e.target as Node; if (!wrap.current?.contains(t) && !pk.current?.contains(t)) setOpen(false); };
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') { setOpen(false); root.current?.focus(); } };
    document.addEventListener('pointerdown', down); document.addEventListener('keydown', key);
    return () => { document.removeEventListener('pointerdown', down); document.removeEventListener('keydown', key); };
  }, [open]);
  useEffect(() => {
    if (!open || !pk.current) return;
    const first = (pk.current.querySelector('.is-on') ?? pk.current.querySelector('button')) as HTMLElement | null;
    first?.focus({ preventScroll: true });
  }, [open]);
  const choose = (v: ParzAvatarChange) => {
    setOpen(false);
    if (v.kind === 'preset') setOwn({ src: v.src });
    if (v.kind === 'initials') setOwn({ src: undefined });
    p.onChange?.(v);
  };
  const pickFile = async (f?: File) => {
    if (!f) return;
    setOpen(false);
    const preview = URL.createObjectURL(f), k = ++upK.current;
    blobs.current.add(preview);
    setUp({ preview, k });
    try {
      const src = p.onUpload ? await p.onUpload(f) : preview;
      if (upK.current !== k) return;
      setUp(u => (u && u.k === k ? { ...u, final: src } : u));
      setOwn({ src });
      p.onChange?.({ kind: 'upload', file: f, src });
    } catch (err) {
      if (upK.current === k) setUp(null);
      p.onUploadError?.(err, f);
    }
  };
  const tip = p.tooltip === undefined ? (g?.tooltip ? name || undefined : undefined) : p.tooltip === true ? name || undefined : p.tooltip || undefined;

  const vars = {
    ...motionVars,
    '--pz-av-s': `${s}px`, '--pz-av-fs': `${Math.round(s * 0.4 * 10) / 10}px`, '--pz-av-bg': bg,
    '--pz-av-dot': `${dot}px`, '--pz-av-hole': `${hole}px`, '--pz-av-st-in': `${stInset}px`, '--pz-av-rw': `${ringW}px`, '--pz-av-rg': `${ringGap}px`,
    ...(surface ? { '--pz-av-surface': surface } : { '--pz-av-surface': SURFACE[theme] }),
    ...(p.textColor && { '--pz-av-fg': p.textColor }),
    ...(p.status && { '--pz-av-st': p.statusColor ?? STATUS_COLOR[p.status] }),
    ...(typeof p.ring === 'string' && p.ring !== 'seen' && { '--pz-av-ring': p.ring }),
    ...(g && { '--i': g.index })
  } as CSSProperties;

  const cls = ['pz-av', `pz-av--${shape}`, `pz-av--${theme}`, interactive && 'is-int', pressed && 'is-press', p.disabled && 'is-disabled', g && 'pz-av--in-group',
    showIcon && !p.color && 'is-anon', ringOn && 'has-ring', p.ring === 'seen' && 'is-seen', p.ringSpin !== false && p.ring !== 'seen' && 'is-spin', hasPhoto && 'has-photo',
    state === 'loading' && !up && 'is-loading', editable && 'is-editable', open && 'is-open', up && 'is-uploading', p.className].filter(Boolean).join(' ');

  const face = (
    <>
      {ringOn && <span className="pz-av-ring" aria-hidden="true" />}
      <span className="pz-av-face" aria-hidden="true">
        <span className="pz-av-fb">
          {showIcon ? <span className="pz-av-ico">{p.icon !== undefined ? <Icon icon={p.icon} /> : <Silhouette />}</span> : <span className="pz-av-ini">{ini}</span>}
        </span>
        {drop && <span key={drop.k} className="pz-av-drop" style={{ left: `${drop.x}%`, top: `${drop.y}%` }} />}
        {layers.map((l, i) => <img key={l.k} className={`pz-av-img${i === layers.length - 1 && l.fresh ? ' is-top' : ''}`} src={l.src} alt="" draggable={false} />)}
        {up && (
          <span key={up.k} className={`pz-av-up${upDone ? ' is-done' : ''}`}>
            <img src={up.preview} alt="" draggable={false} />
            <span className="pz-av-dots"><i /><i /><i /></span>
          </span>
        )}
        {editable && !up && (
          <span className="pz-av-cam">
            <svg viewBox="0 0 24 24"><path d="M8.6 6.6l1.2-2.2h4.4l1.2 2.2H18a3 3 0 0 1 3 3v7a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3v-7a3 3 0 0 1 3-3z" /><circle cx="12" cy="12.9" r="3.4" /></svg>
          </span>
        )}
      </span>
      {p.status && <span key={p.status} className={`pz-av-st pz-av-st--${p.status}${p.status === 'online' && p.statusPulse !== false ? ' is-pulse' : ''}`} aria-hidden="true" />}
      {/* счётчик живёт внутри аватара: его появление не перестраивает аватар, кольцо и статус не перезапускаются */}
      {p.count !== undefined && (
        <span className="pz-av-count" style={{ '--pz-bd-ring': surface ?? SURFACE[theme] } as CSSProperties}>
          <ParzBadge count={p.count} max={p.countMax} size={s >= 56 ? 'md' : 'sm'} />
        </span>
      )}
      {tip != null && <span className="pz-av-tip" aria-hidden="true">{tip}</span>}
    </>
  );

  const common = { className: cls, style: { ...vars, ...p.style }, ref: root as never, ...press };
  if (editable) {
    const onIni = !shownSrc && !up;
    return (
      <span ref={wrap} className={`pz-av-edit${open ? ' is-open' : ''}`}>
        <button type="button" {...common} aria-label={[fullLabel, up ? L.uploading : L.edit].filter(Boolean).join(', ')} aria-haspopup="dialog" aria-expanded={open} aria-busy={!!up || undefined}
          onClick={e => { setOpen(o => !o); p.onClick?.(e); }}>{face}</button>
        {typeof document !== 'undefined' && createPortal(
        <div ref={pk} role="dialog" aria-label={L.title} className={`pz-av-pk pz-av-pk--${theme}${open && pos ? ' is-open' : ''}${pos?.up ? ' is-up' : ''}`}
          style={{ ...motionVars, '--pz-av-pk-x': `${pos?.x ?? -9999}px`, '--pz-av-pk-y': `${pos?.y ?? -9999}px`, '--pz-av-pk-ox': `${pos?.ox ?? 150}px` } as CSSProperties}
          {...(open ? {} : { inert: '' }) as object}>
          <div className="pz-av-pk-t">{L.title}</div>
          <div className="pz-av-pk-g">
            <button type="button" style={{ '--i': 0 } as CSSProperties} className={`pz-av-pk-o${onIni ? ' is-on' : ''}`} aria-pressed={onIni} aria-label={L.initials} title={L.initials}
              onClick={() => choose({ kind: 'initials' })}>
              <span className={`pz-av-pk-ini${showIcon && !p.color ? ' is-anon' : ''}`} style={{ background: showIcon && !p.color ? undefined : bg }}>{showIcon ? <Silhouette /> : <b>{ini}</b>}</span>
            </button>
            {presets.map((src, i) => {
              const on = shownSrc === src && !up;
              return <button key={src} type="button" style={{ '--i': i + 1 } as CSSProperties} className={`pz-av-pk-o${on ? ' is-on' : ''}`} aria-pressed={on} aria-label={L.preset.split('{n}').join(String(i + 1))}
                onClick={() => choose({ kind: 'preset', src })}><img src={src} alt="" draggable={false} /></button>;
            })}
          </div>
          <button type="button" className="pz-av-pk-up" onClick={() => file.current?.click()}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 15V4M7.5 8.5 12 4l4.5 4.5M5 14v4a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4" /></svg>
            <span>{L.upload}</span>
          </button>
          <input ref={file} type="file" accept={p.accept ?? 'image/*'} hidden tabIndex={-1} onChange={e => { void pickFile(e.target.files?.[0]); e.target.value = ''; }} />
        </div>, document.body)}
      </span>
    );
  }

  const el = p.href && !p.disabled
    ? <a {...common} href={p.href} target={p.target} rel={p.target === '_blank' ? 'noopener noreferrer' : undefined} aria-label={fullLabel} onClick={p.onClick}>{face}</a>
    : p.onClick
      ? <button type="button" {...common} aria-label={fullLabel} onClick={p.onClick} disabled={p.disabled}>{face}</button>
      : <span {...common} role="img" aria-label={fullLabel}>{face}</span>;

  return el;
});

/** Parz UI · Parz Avatar Group — аватары стопкой: лишние сворачиваются в «+N», при наведении стопка раздвигается. */
export interface ParzAvatarGroupProps {
  /** ParzAvatar внутри. Размер, форма, фон и движение группы передаются им, если у них не задано своё. */
  children?: ReactNode;
  /** Сколько показывать; остальные — «+N». */
  max?: number;
  /** Сколько всего людей, если в children только часть (например, первые 5 из 128). */
  total?: number;
  size?: ParzAvatarSize | number;
  shape?: ParzAvatarShape;
  /** Насколько аватары заходят друг на друга: 'tight', 'normal', 'loose'. По умолчанию 'normal'. */
  spacing?: 'tight' | 'normal' | 'loose';
  /** Стопка раздвигается при наведении. По умолчанию true. */
  spread?: boolean;
  /** Подсказки с именами при наведении. По умолчанию true. */
  tooltips?: boolean;
  /** Нажатие на «+N»; без него «+N» — просто надпись. */
  onMoreClick?: (e: MouseEvent<HTMLElement>) => void;
  /** Текст «+N» для экранных дикторов. По умолчанию «+N». */
  moreLabel?: (n: number) => string;
  theme?: ParzAvatarTheme;
  surfaceColor?: string;
  motion?: ParzMotionPreset;
  /** Имя группы для экранных дикторов, например «Участники». */
  ariaLabel?: string;
  className?: string;
  style?: CSSProperties;
}

const OVERLAP = { tight: 0.38, normal: 0.26, loose: 0.12 };

export function ParzAvatarGroup({ children, max, total, size = 'md', shape = 'circle', spacing = 'normal', spread = true, tooltips = true, onMoreClick, moreLabel, theme = 'dark', surfaceColor, motion, ariaLabel, className, style }: ParzAvatarGroupProps) {
  const { vars: motionVars } = useEase(motion);
  const items = Children.toArray(children).filter(isValidElement);
  const shown = max != null && max >= 1 ? items.slice(0, Math.floor(max)) : items;
  const all = Math.max(total ?? items.length, items.length);
  const rest = all - shown.length;
  const s = typeof size === 'number' ? Math.max(16, size) : SIZES[size];

  // «+N» перекатывается при смене числа
  const lastRest = useRef(rest);
  const [bump, setBump] = useState(0);
  useEffect(() => { if (lastRest.current !== rest) { lastRest.current = rest; setBump(b => b + 1); } }, [rest]);

  // не помещается в контейнер — аватары сами заходят друг на друга плотнее (и тогда не раздвигаются)
  const box = useRef<HTMLDivElement>(null);
  const [fit, setFit] = useState<number | null>(null);
  const [sp, setSp] = useState(0.08); // насколько раздвигаться: не шире контейнера
  const n = shown.length + (rest > 0 ? 1 : 0);
  useLayoutEffect(() => {
    const el = box.current, parent = el?.parentElement;
    if (!el || !parent) return;
    const measure = () => {
      const cs = getComputedStyle(parent);
      const avail = parent.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
      const base = OVERLAP[spacing];
      const room = n > 1 && avail > 0 ? (avail - s * n) / ((n - 1) * s) : 0.08;
      setSp(x => { const v = Math.min(0.08, room); return Math.abs(x - v) < 0.002 ? x : v; });
      if (n < 2 || avail <= 0 || s * n - (n - 1) * s * base <= avail) { setFit(null); return; }
      const ov = Math.min(0.72, (s * n - avail) / ((n - 1) * s));
      setFit(f => (f != null && Math.abs(f - ov) < 0.002 ? f : ov));
    };
    measure();
    const ro = new ResizeObserver(measure); ro.observe(parent);
    return () => ro.disconnect();
  }, [n, s, spacing]);

  const vars = { ...motionVars, '--pz-av-s': `${s}px`, '--pz-avg-ov': fit ?? OVERLAP[spacing], '--pz-avg-sp': sp, '--pz-av-surface': surfaceColor ?? SURFACE[theme] } as CSSProperties;
  const ctx = (i: number): GroupCtx => ({ size, shape, theme, surfaceColor, motion, tooltip: tooltips, index: i });
  const moreText = `+${rest > 999 ? '999' : rest}`;
  const moreAria = moreLabel ? moreLabel(rest) : `+${rest}`;
  const moreCls = `pz-av pz-av--${shape} pz-av--${theme} pz-av--in-group pz-av--more${onMoreClick ? ' is-int' : ''}`;
  const moreVars = { '--pz-av-s': `${s}px`, '--pz-av-fs': `${Math.round(s * (moreText.length > 3 ? 0.3 : 0.36) * 10) / 10}px`, '--i': shown.length } as CSSProperties;
  const moreFace = <span className="pz-av-face" aria-hidden="true"><span className="pz-av-fb"><span key={bump} className={`pz-av-ini${bump ? ' is-bump' : ''}`}>{moreText}</span></span></span>;

  return (
    <div ref={box} className={`pz-avg${spread && fit == null && sp > -OVERLAP[spacing] + 0.04 ? ' is-spread' : ''}${className ? ` ${className}` : ''}`} role="group" aria-label={ariaLabel} style={{ ...vars, ...style }}>
      {shown.map((c, i) => <GCtx.Provider key={c.key ?? i} value={ctx(i)}>{c}</GCtx.Provider>)}
      {rest > 0 && (onMoreClick
        ? <button type="button" className={moreCls} style={moreVars} onClick={onMoreClick} aria-label={moreAria}>{moreFace}</button>
        : <span className={moreCls} style={moreVars} role="img" aria-label={moreAria}>{moreFace}</span>)}
    </div>
  );
}
