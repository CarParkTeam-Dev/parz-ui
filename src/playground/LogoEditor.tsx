import { useMemo, useRef, useState } from 'react';
import { AnimoLogo, ParzToggle } from '../lib';
import { Seg, Range, ColorField, Sec } from './App';
import { useT } from './i18n';

type Bg = 'dark' | 'light';
type L = {
  text: string; size: number; intro: boolean; introDelay: number; idle: boolean; hoverWave: boolean;
  holdEffect: boolean; holdDuration: number; spacing: number; dim: string; bright: string; hover: string; accent: string; clickable: boolean;
};
const DARK = { dim: '#7d7d87', bright: '#fafafa', hover: '#ffffff' };
const LIGHT = { dim: '#9a9aa6', bright: '#16161b', hover: '#000000' };
const L0: L = { text: 'PARZ', size: 44, intro: true, introDelay: 150, idle: true, hoverWave: true, holdEffect: true, holdDuration: 1000, spacing: 0.34, ...DARK, accent: '#6ee7a0', clickable: false };

const q = (s: string) => `'${s.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
function codeFor(o: L) {
  const a: string[] = [`text=${q(o.text)}`];
  if (o.size !== 13) a.push(`size={${o.size}}`);
  if (!o.intro) a.push('intro={false}'); else if (o.introDelay !== 150) a.push(`introDelay={${o.introDelay}}`);
  if (!o.idle) a.push('idle={false}');
  if (!o.hoverWave) a.push('hoverWave={false}');
  if (!o.holdEffect) a.push('holdEffect={false}'); else if (o.holdDuration !== 1000) a.push(`holdDuration={${o.holdDuration}}`);
  if (o.spacing !== 0.34) a.push(`spacing={${o.spacing}}`);
  if (o.dim !== DARK.dim) a.push(`dimColor=${q(o.dim)}`);
  if (o.bright !== DARK.bright) a.push(`brightColor=${q(o.bright)}`);
  if (o.hover !== DARK.hover) a.push(`hoverColor=${q(o.hover)}`);
  if (o.accent !== L0.accent) a.push(`accent=${q(o.accent)}`);
  if (o.clickable) a.push(`onClick={() => navigate('/')}`);
  if (o.holdEffect) a.push(`onHoldComplete={() => { /* … */ }}`);
  return [`import { AnimoLogo } from '@carparkteam/parz-ui';`, `import '@carparkteam/parz-ui/style.css';`, ``, `<AnimoLogo`, ...a.map(x => `  ${x}`), `/>`].join('\n');
}

export function LogoEditor() {
  const t = useT();
  const [o, setO] = useState<L>(L0);
  const [bg, setBg] = useState<Bg>('dark');
  const [run, setRun] = useState(0); // ключ — перезапуск появления
  const [flash, setFlash] = useState('');
  const [copied, setCopied] = useState(false);
  const ft = useRef(0);
  const upd = (p: Partial<L>) => setO(x => ({ ...x, ...p }));
  const say = (m: string) => { setFlash(m); window.clearTimeout(ft.current); ft.current = window.setTimeout(() => setFlash(''), 1600); };
  const code = useMemo(() => codeFor(o), [o]);
  const copy = async () => { try { await navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 1600); } catch { /* буфер недоступен */ } };
  const switchBg = (b: Bg) => { setBg(b); upd(b === 'light' ? LIGHT : DARK); };

  return (
    <div className="ed">
      <aside className="ctl" aria-label={t('Настройки логотипа')}>
        <Sec title={t('Текст')}>
          <label className="row"><span>{t('Надпись')}</span><input className="txt" value={o.text} maxLength={16} onChange={e => upd({ text: e.target.value })} /></label>
          <Range label={t('Размер букв')} unit=" px" min={10} max={96} step={1} value={o.size} onChange={v => upd({ size: v })} />
          <Range label={t('Между буквами')} unit=" em" min={0} max={1} step={0.01} value={o.spacing} onChange={v => upd({ spacing: v })} />
        </Sec>
        <Sec title={t('Анимация')}>
          <ParzToggle className="chk" checked={o.intro} onChange={v => upd({ intro: v })} label={t('Появление')} />
          {o.intro && <Range label={t('Задержка появления')} unit={t(' мс')} min={0} max={2000} step={50} value={o.introDelay} onChange={v => upd({ introDelay: v })} />}
          <ParzToggle className="chk" checked={o.idle} onChange={v => upd({ idle: v })} label={t('Мерцание в покое')} />
          <ParzToggle className="chk" checked={o.hoverWave} onChange={v => upd({ hoverWave: v })} label={t('Волна при наведении')} />
          <ParzToggle className="chk" checked={o.holdEffect} onChange={v => upd({ holdEffect: v })} label={t('Эффект удержания')} />
          {o.holdEffect && <Range label={t('Сколько держать')} unit={t(' мс')} min={300} max={3000} step={50} value={o.holdDuration} onChange={v => upd({ holdDuration: v })} />}
          <ParzToggle className="chk" checked={o.clickable} onChange={v => upd({ clickable: v })} label={t('Логотип — кнопка')} />
          <div className="btns"><button onClick={() => setRun(r => r + 1)}>{t('Повторить появление')}</button><button onClick={() => setO({ ...L0, ...(bg === 'light' ? LIGHT : DARK) })}>{t('По умолчанию')}</button></div>
        </Sec>
        <Sec title={t('Цвета')}>
          <div className="clrs">
            <ColorField label={t('Крайние буквы')} value={o.dim} onChange={v => upd({ dim: v })} />
            <ColorField label={t('Центральные буквы')} value={o.bright} onChange={v => upd({ bright: v })} />
            <ColorField label={t('При наведении')} value={o.hover} onChange={v => upd({ hover: v })} />
            <ColorField label={t('Акцент')} value={o.accent} onChange={v => upd({ accent: v })} />
          </div>
        </Sec>
      </aside>

      <section className="stage">
        <div className="stage-bar">
          <Seg label={t('Фон')} value={bg} options={[['dark', t('Тёмный')], ['light', t('Светлый')]]} onChange={switchBg} />
          <button className="reset" onClick={() => setRun(r => r + 1)}>{t('Повторить появление')}</button>
        </div>
        <div className={`logo-stage logo-stage--${bg}`}>
          <AnimoLogo key={run} text={o.text || ' '} size={o.size} intro={o.intro} introDelay={o.introDelay} idle={o.idle} hoverWave={o.hoverWave}
            holdEffect={o.holdEffect} holdDuration={o.holdDuration} spacing={o.spacing} dimColor={o.dim} brightColor={o.bright} hoverColor={o.hover} accent={o.accent}
            onClick={o.clickable ? () => say(t('Нажали на логотип')) : undefined} onHoldComplete={() => say(t('Удержание завершено'))} />
          <p className="logo-hint">{t('Наведите — волна. Зажмите и держите — буквы сходятся и загораются.')}</p>
          {flash && <div className="flash" role="status">{flash}</div>}
        </div>
        <div className="code">
          <div className="code-h"><b>{t('Код')}</b><button onClick={copy}>{copied ? t('Скопировано') : t('Скопировать')}</button></div>
          <pre><code>{code}</code></pre>
        </div>
      </section>
    </div>
  );
}
