import { useMemo, useState } from 'react';
import { ParzVideo, ParzToggle, ParzSlider, type ParzVideoLabels, type ParzVideoSource, type ParzVideoChapter, type ParzVideoTrack, type ParzVideoMotion } from '../lib';
import { Seg, ColorField, Sec } from './App';
import { useT } from './i18n';
import clip from '../../playback.mp4';
import poster from './assets/playback-poster.jpg';

type Ratio = '16 / 9' | '4 / 3' | '1 / 1' | '9 / 16';
type O = {
  withTitle: boolean; title: string; poster: boolean; audio: boolean; audioText: string; ratio: Ratio; radius: number; accent: string; motion: ParzVideoMotion;
  volume: boolean; skip: boolean; settings: boolean; fullscreen: boolean; pip: boolean;
  quality: boolean; chapters: boolean; subs: boolean; previews: boolean; loop: boolean; muted: boolean;
};
const O0: O = {
  withTitle: true, title: 'Parz UI', poster: true, audio: true, audioText: 'Dolby Atmos', ratio: '16 / 9', radius: 18, accent: '#6ee7a0', motion: 'liquid',
  volume: true, skip: true, settings: true, fullscreen: true, pip: false, quality: true, chapters: true, subs: true, previews: true, loop: false, muted: false
};

const q = (s: string) => `'${s.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
function codeFor(o: O) {
  const a: string[] = o.quality
    ? ['sources={[', "  { src: '/video-2160.mp4', label: '2160p' },   // на панели — 4K", "  { src: '/video-1080.mp4', label: '1080p' },   // — HD", "  { src: '/video-720.mp4', label: '720p' },", "  { src: '/video-480.mp4', label: '480p' }", ']}']
    : ['src="/video.mp4"'];
  if (o.chapters) a.push("chapters={[{ start: 0, title: 'Intro' }, { start: 16, title: 'Logo' }, { start: 40, title: 'Outro' }]}");
  if (o.subs) a.push("tracks={[{ src: '/subs.en.vtt', label: 'English', srclang: 'en' }]}");
  if (o.poster) a.push('poster="/poster.jpg"');
  if (o.withTitle) a.push(`title=${q(o.title)}`);
  if (o.audio) a.push(`audioBadge=${q(o.audioText)}`);
  if (o.ratio !== O0.ratio) a.push(`aspectRatio=${q(o.ratio)}`);
  if (o.radius !== O0.radius) a.push(`radius={${o.radius}}`);
  if (o.motion !== O0.motion) a.push(`motion=${q(o.motion)}`);
  if (o.accent !== O0.accent) a.push(`accent=${q(o.accent)}`);
  if (!o.previews) a.push('previews={false}');
  if (!o.skip) a.push('showSkip={false}');
  if (!o.volume) a.push('showVolume={false}');
  if (!o.settings) a.push('showSettings={false}');
  if (!o.fullscreen) a.push('showFullscreen={false}');
  if (o.pip) a.push('showPip');
  if (o.loop) a.push('loop');
  if (o.muted) a.push('muted');
  return [`import { ParzVideo } from '@carparkteam/parz-ui';`, `import '@carparkteam/parz-ui/style.css';`, ``, `<ParzVideo`, ...a.map(x => `  ${x}`), `/>`].join('\n');
}

/** подписи плеера на языке площадки */
export function useVideoLabels(): Partial<ParzVideoLabels> {
  const t = useT();
  return {
    play: t('Смотреть'), pause: t('Поставить на паузу'), replay: t('Смотреть снова'), mute: t('Выключить звук'), unmute: t('Включить звук'), volume: t('Громкость'),
    seek: t('Перемотка'), speed: t('Скорость'), fullscreen: t('Во весь экран'), exitFullscreen: t('Выйти из полного экрана'), pip: t('Картинка в картинке'),
    player: t('Видеоплеер'), normal: t('Обычная'), settings: t('Настройки'), quality: t('Качество'), subtitles: t('Субтитры'), off: t('Выключены'),
    loop: t('По кругу'), back: t('Назад на {n} с'), forward: t('Вперёд на {n} с'), remaining: t('Показать, сколько осталось'),
    more: t('Ещё'), cast: t('Смотреть на другом устройстве'), on: t('Вкл.'), about: t('О Parz UI'), version: t('Версия')
  };
}
export const DEMO_CLIP = clip;
/* демо: файл один, поэтому у «качеств» общий файл (разный адрес); в жизни это разные файлы */
export const DEMO_SOURCES: ParzVideoSource[] = [{ src: clip, label: '2160p' }, { src: clip + '#q1080', label: '1080p' }, { src: clip + '#q720', label: '720p' }, { src: clip + '#q480', label: '480p' }];

function vtt(lines: [number, number, string][]) {
  const ts = (s: number) => `00:${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}.000`;
  const body = 'WEBVTT\n\n' + lines.map(([a, b, x]) => `${ts(a)} --> ${ts(b)}\n${x}`).join('\n\n');
  return URL.createObjectURL(new Blob([body], { type: 'text/vtt' }));
}
function useDemo() {
  const t = useT();
  const a = t('Вступление');
  const chapters: ParzVideoChapter[] = useMemo(() => [{ start: 0, title: a }, { start: 16, title: t('Логотип') }, { start: 40, title: t('Финал') }], [a]);
  const tracks: ParzVideoTrack[] = useMemo(() => [{
    src: vtt([[1, 5, t('Это Parz Video — плеер в стиле Parz UI.')], [6, 11, t('Наведите на полосу — увидите кадр и главу.')], [12, 18, t('Шестерёнка — качество, скорость и субтитры.')]]),
    label: t('Русский'), srclang: 'ru', default: true
  }], [a]);
  return { chapters, tracks };
}

/* демо-обложка: заранее сохранённый кадр ролика (35-я секунда, без надписей) — грузится сразу, без вырезания кадра в браузере */
export function usePoster() { return poster; }

export function VideoEditor() {
  const t = useT();
  const labels = useVideoLabels();
  const demo = useDemo();
  const posterUrl = usePoster();
  const [o, setO] = useState<O>(O0);
  const [copied, setCopied] = useState(false);
  const upd = (p: Partial<O>) => setO(x => ({ ...x, ...p }));
  const code = useMemo(() => codeFor(o), [o]);
  const copy = async () => { try { await navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 1600); } catch { /* буфер недоступен */ } };

  const panel = (bg: 'dark' | 'light') => (
    <div className={`tg-stage tg-stage--${bg} vd-stage`}>
      <span className="tg-cap">{bg === 'dark' ? t('Тёмный фон') : t('Светлый фон')}</span>
      <div className={`vd-box${o.ratio === '9 / 16' ? ' vd-box--tall' : ''}`}>
        <ParzVideo src={clip} sources={o.quality ? DEMO_SOURCES : undefined} chapters={o.chapters ? demo.chapters : undefined} tracks={o.subs ? demo.tracks : undefined}
          previews={o.previews} poster={o.poster ? posterUrl : undefined} title={o.withTitle ? o.title : undefined} audioBadge={o.audio && o.audioText ? o.audioText : undefined} aspectRatio={o.ratio} radius={o.radius} motion={o.motion} accent={o.accent} labels={labels}
          showSkip={o.skip} showVolume={o.volume} showSettings={o.settings} showFullscreen={o.fullscreen} showPip={o.pip} loop={o.loop} muted={o.muted} />
      </div>
    </div>
  );

  return (
    <div className="ed">
      <aside className="ctl" aria-label={t('Настройки плеера')}>
        <Sec title={t('Заголовок')}>
          <ParzToggle className="chk" checked={o.poster} onChange={v => upd({ poster: v })} label={t('Обложка до запуска')} />
          <ParzToggle className="chk" checked={o.withTitle} onChange={v => upd({ withTitle: v })} label={t('Показывать заголовок')} />
          {o.withTitle && <label className="row"><span>{t('Текст заголовка')}</span><input className="txt" value={o.title} maxLength={60} onChange={e => upd({ title: e.target.value })} /></label>}
          <ParzToggle className="chk" checked={o.audio} onChange={v => upd({ audio: v })} label={t('Значок формата звука')} />
          {o.audio && <label className="row"><span>{t('Текст значка')}</span><input className="txt" value={o.audioText} maxLength={24} onChange={e => upd({ audioText: e.target.value })} /></label>}
          {o.audio && <div className="btns btns--pick">{['Dolby Atmos', 'Spatial Audio', '5.1', '7.1'].map(x => <button key={x} className={o.audioText === x ? 'on' : ''} aria-pressed={o.audioText === x} onClick={() => upd({ audioText: x })}>{x}</button>)}</div>}
        </Sec>
        <Sec title={t('Вид')}>
          <div className="row"><span>{t('Соотношение сторон')}</span><Seg label={t('Соотношение сторон')} value={o.ratio} options={[['16 / 9', '16:9'], ['4 / 3', '4:3'], ['1 / 1', '1:1'], ['9 / 16', '9:16']]} onChange={v => upd({ ratio: v })} /></div>
          <div className="row"><span>{t('Анимация')}</span><Seg label={t('Анимация')} value={o.motion} options={[['liquid', t('Жидкая')], ['fade', t('Плавная')]]} onChange={v => upd({ motion: v })} /></div>
          <ParzSlider value={o.radius} min={0} max={32} onChange={v => upd({ radius: v })} label={t('Скругление')} formatValue={x => `${x} px`} />
        </Sec>
        <Sec title={t('Возможности')}>
          <ParzToggle className="chk" checked={o.quality} onChange={v => upd({ quality: v })} label={t('Выбор качества')} />
          <ParzToggle className="chk" checked={o.chapters} onChange={v => upd({ chapters: v })} label={t('Главы')} />
          <ParzToggle className="chk" checked={o.subs} onChange={v => upd({ subs: v })} label={t('Субтитры')} />
          <ParzToggle className="chk" checked={o.previews} onChange={v => upd({ previews: v })} label={t('Кадр при наведении')} />
        </Sec>
        <Sec title={t('Кнопки')}>
          <ParzToggle className="chk" checked={o.skip} onChange={v => upd({ skip: v })} label={t('Перемотка ±10 с')} />
          <ParzToggle className="chk" checked={o.volume} onChange={v => upd({ volume: v })} label={t('Громкость')} />
          <ParzToggle className="chk" checked={o.settings} onChange={v => upd({ settings: v })} label={t('Настройки')} />
          <ParzToggle className="chk" checked={o.fullscreen} onChange={v => upd({ fullscreen: v })} label={t('Во весь экран')} />
          <ParzToggle className="chk" checked={o.pip} onChange={v => upd({ pip: v })} label={t('Картинка в картинке')} />
        </Sec>
        <Sec title={t('Воспроизведение')}>
          <ParzToggle className="chk" checked={o.loop} onChange={v => upd({ loop: v })} label={t('По кругу')} />
          <ParzToggle className="chk" checked={o.muted} onChange={v => upd({ muted: v })} label={t('Без звука при запуске')} />
          <div className="btns"><button onClick={() => setO(O0)}>{t('По умолчанию')}</button></div>
        </Sec>
        <Sec title={t('Цвета')}>
          <div className="clrs"><ColorField label={t('Акцент')} value={o.accent} onChange={v => upd({ accent: v })} /></div>
        </Sec>
      </aside>

      <section className="stage">
        <div className="tg-stages vd-stages">{panel('dark')}{panel('light')}</div>
        <p className="logo-hint">{t('Пробел — пауза, стрелки — перемотка и громкость, 0–9 — переход по ролику, C — субтитры, F — во весь экран. Щелчок по времени показывает, сколько осталось. На телефоне двойное касание по краю перематывает на 10 секунд.')}</p>
        <div className="code">
          <div className="code-h"><b>{t('Код')}</b><button onClick={copy}>{copied ? t('Скопировано') : t('Скопировать')}</button></div>
          <pre><code>{code}</code></pre>
        </div>
      </section>
    </div>
  );
}
