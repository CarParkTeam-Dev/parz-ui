import { useMemo, useRef, useState } from 'react';
import { ParzToggle } from '../lib';
import { Seg, Range, ColorField, Sec } from './App';
import { useT } from './i18n';

type Size = 'sm' | 'md' | 'lg' | 'custom';
type O = {
  label: string; withLabel: boolean; pos: 'end' | 'start'; size: Size; px: number; disabled: boolean; draggable: boolean;
  accent: string; track: string; thumb: string; cooldown: number; reject: string;
};
const O0: O = { label: 'Wi-Fi', withLabel: true, pos: 'end', size: 'md', px: 24, disabled: false, draggable: true, accent: '#6ee7a0', track: '#2a2a30', thumb: '#ffffff', cooldown: 0, reject: '#ff5c5c' };
const LIGHT_TRACK = '#d9dae1';

const q = (s: string) => `'${s.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
function codeFor(o: O) {
  const a: string[] = ['checked={on}', 'onChange={setOn}'];
  if (o.withLabel) a.push(`label=${q(o.label)}`); else a.push(`ariaLabel=${q(o.label || 'Toggle')}`);
  if (o.withLabel && o.pos === 'start') a.push(`labelPosition='start'`);
  if (o.size === 'custom') a.push(`size={${o.px}}`); else if (o.size !== 'md') a.push(`size=${q(o.size)}`);
  if (o.disabled) a.push('disabled');
  if (!o.draggable) a.push('draggable={false}');
  if (o.accent !== O0.accent) a.push(`accent=${q(o.accent)}`);
  if (o.track !== O0.track) a.push(`trackColor=${q(o.track)}`);
  if (o.thumb !== O0.thumb) a.push(`thumbColor=${q(o.thumb)}`);
  if (o.cooldown > 0) { a.push(`cooldown={${o.cooldown}}`); a.push(`onReject={() => toast('Not so fast')}`); }
  if (o.reject !== O0.reject) a.push(`rejectColor=${q(o.reject)}`);
  return [`import { useState } from 'react';`, `import { ParzToggle } from '@parz/ui';`, `import '@parz/ui/style.css';`, ``,
    `const [on, setOn] = useState(true);`, ``, `<ParzToggle`, ...a.map(x => `  ${x}`), `/>`].join('\n');
}

export function ToggleEditor() {
  const t = useT();
  const [o, setO] = useState<O>(O0);
  const [a, setA] = useState(true);
  const [b, setB] = useState(false);
  const [c, setC] = useState(true);
  const [copied, setCopied] = useState(false);
  const [flash, setFlash] = useState('');
  const ft = useRef(0);
  const say = (m: string) => { setFlash(m); window.clearTimeout(ft.current); ft.current = window.setTimeout(() => setFlash(''), 1400); };
  const upd = (p: Partial<O>) => setO(x => ({ ...x, ...p }));
  const code = useMemo(() => codeFor(o), [o]);
  const copy = async () => { try { await navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 1600); } catch { /* буфер недоступен */ } };
  const size = o.size === 'custom' ? o.px : o.size;

  const panel = (bg: 'dark' | 'light') => {
    const p = { size, cooldown: o.cooldown, rejectColor: o.reject, onReject: () => say(t('Слишком часто — подождите')), labelPosition: o.pos, draggable: o.draggable, accent: o.accent, thumbColor: o.thumb, trackColor: bg === 'light' && o.track === O0.track ? LIGHT_TRACK : o.track };
    return (
      <div className={`tg-stage tg-stage--${bg}`}>
        <span className="tg-cap">{bg === 'dark' ? t('Тёмный фон') : t('Светлый фон')}</span>
        <ParzToggle {...p} checked={a} onChange={setA} disabled={o.disabled} label={o.withLabel ? o.label : undefined} ariaLabel={o.withLabel ? undefined : o.label || 'Toggle'} />
        <ParzToggle {...p} checked={b} onChange={setB} label={t('Bluetooth')} />
        <ParzToggle {...p} checked={c} onChange={setC} label={t('Тёмная тема')} />
        <ParzToggle {...p} defaultChecked disabled label={t('Недоступно')} />
      </div>
    );
  };

  return (
    <div className="ed">
      <aside className="ctl" aria-label={t('Настройки переключателя')}>
        <Sec title={t('Подпись')}>
          <ParzToggle className="chk" checked={o.withLabel} onChange={v => upd({ withLabel: v })} label={t('Показывать подпись')} />
          <label className="row"><span>{o.withLabel ? t('Текст подписи') : t('Подпись для экранного диктора')}</span><input className="txt" value={o.label} maxLength={40} onChange={e => upd({ label: e.target.value })} /></label>
          {o.withLabel && <Seg label={t('Сторона подписи')} value={o.pos} options={[['end', t('Справа')], ['start', t('Слева')]]} onChange={v => upd({ pos: v })} />}
        </Sec>
        <Sec title={t('Размер и поведение')}>
          <Seg label={t('Размер')} value={o.size} options={[['sm', 'S'], ['md', 'M'], ['lg', 'L'], ['custom', t('Свой')]]} onChange={v => upd({ size: v })} />
          {o.size === 'custom' && <Range label={t('Высота')} unit=" px" min={12} max={48} step={1} value={o.px} onChange={v => upd({ px: v })} />}
          <Range label={t('Пауза между переключениями')} unit={t(' мс')} min={0} max={3000} step={100} value={o.cooldown} onChange={v => upd({ cooldown: v })} />
          <div className="btns"><button onClick={() => upd({ cooldown: o.cooldown ? 0 : 1500 })}>{o.cooldown ? t('Без ограничения') : t('Попробовать ограничение')}</button></div>
          <ParzToggle className="chk" checked={o.draggable} onChange={v => upd({ draggable: v })} label={t('Можно тянуть бегунок')} />
          <ParzToggle className="chk" checked={o.disabled} onChange={v => upd({ disabled: v })} label={t('Отключён')} />
          <div className="btns"><button onClick={() => setO(O0)}>{t('По умолчанию')}</button></div>
        </Sec>
        <Sec title={t('Цвета')}>
          <div className="clrs">
            <ColorField label={t('Включён')} value={o.accent} onChange={v => upd({ accent: v })} />
            <ColorField label={t('Дорожка')} value={o.track} onChange={v => upd({ track: v })} />
            <ColorField label={t('Бегунок')} value={o.thumb} onChange={v => upd({ thumb: v })} />
            <ColorField label={t('Отказ')} value={o.reject} onChange={v => upd({ reject: v })} />
          </div>
        </Sec>
      </aside>

      <section className="stage">
        <div className="tg-stages">{panel('dark')}{panel('light')}</div>
        <p className="logo-hint">{o.cooldown ? t('Переключайте быстро подряд — лишняя попытка отклонится красным.') : t('Нажмите, потяните бегунок или переключите клавишами Пробел и Enter.')}</p>
        <div className="tg-flash-slot">{flash && <div className="flash flash--no" role="status">{flash}</div>}</div>
        <div className="code">
          <div className="code-h"><b>{t('Код')}</b><button onClick={copy}>{copied ? t('Скопировано') : t('Скопировать')}</button></div>
          <pre><code>{code}</code></pre>
        </div>
      </section>
    </div>
  );
}
