import { useMemo, useState } from 'react';
import { ParzCheckbox, ParzToggle } from '../lib';
import { Seg, Range, ColorField, Sec } from './App';
import { useT } from './i18n';

type Size = 'sm' | 'md' | 'lg' | 'custom';
type O = {
  label: string; desc: string; withLabel: boolean; pos: 'end' | 'start'; size: Size; px: number; radius: number; roundAuto: boolean;
  disabled: boolean; invalid: boolean; accent: string; border: string; check: string;
};
const O0: O = { label: 'Remember me', desc: '', withLabel: true, pos: 'end', size: 'md', px: 22, radius: 6, roundAuto: true, disabled: false, invalid: false, accent: '#6ee7a0', border: '#4a4a55', check: '#04130a' };
const LIGHT_BORDER = '#b9bac6';
const SIZES = { sm: 16, md: 20, lg: 26 };

const q = (s: string) => `'${s.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
function codeFor(o: O) {
  const a: string[] = ['checked={on}', 'onChange={setOn}'];
  if (o.withLabel) { a.push(`label=${q(o.label)}`); if (o.desc) a.push(`description=${q(o.desc)}`); } else a.push(`ariaLabel=${q(o.label || 'Checkbox')}`);
  if (o.withLabel && o.pos === 'start') a.push(`labelPosition='start'`);
  if (o.size === 'custom') a.push(`size={${o.px}}`); else if (o.size !== 'md') a.push(`size=${q(o.size)}`);
  if (!o.roundAuto) a.push(`radius={${o.radius}}`);
  if (o.disabled) a.push('disabled');
  if (o.invalid) a.push('invalid={!on}');
  if (o.accent !== O0.accent) a.push(`accent=${q(o.accent)}`);
  if (o.border !== O0.border) a.push(`borderColor=${q(o.border)}`);
  if (o.check !== O0.check) a.push(`checkColor=${q(o.check)}`);
  return [`import { useState } from 'react';`, `import { ParzCheckbox } from '@parz/ui';`, `import '@parz/ui/style.css';`, ``,
    `const [on, setOn] = useState(false);`, ``, `<ParzCheckbox`, ...a.map(x => `  ${x}`), `/>`].join('\n');
}

export function CheckboxEditor() {
  const t = useT();
  const [o, setO] = useState<O>(O0);
  const [main, setMain] = useState(true);
  const [list, setList] = useState([true, false, true]);
  const [copied, setCopied] = useState(false);
  const upd = (p: Partial<O>) => setO(x => ({ ...x, ...p }));
  const code = useMemo(() => codeFor(o), [o]);
  const copy = async () => { try { await navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 1600); } catch { /* буфер недоступен */ } };
  const size = o.size === 'custom' ? o.px : o.size;
  const maxR = Math.round((o.size === 'custom' ? o.px : SIZES[o.size]) / 2);
  const all = list.every(Boolean), some = list.some(Boolean);
  const names = [t('Фильтры'), t('Уведомления'), t('Геолокация')];

  const panel = (bg: 'dark' | 'light') => {
    const p = { size, radius: o.roundAuto ? undefined : Math.min(o.radius, maxR), labelPosition: o.pos, accent: o.accent, checkColor: o.check,
      borderColor: bg === 'light' && o.border === O0.border ? LIGHT_BORDER : o.border };
    return (
      <div className={`tg-stage cb-stage tg-stage--${bg}`}>
        <span className="tg-cap">{bg === 'dark' ? t('Тёмный фон') : t('Светлый фон')}</span>
        <ParzCheckbox {...p} checked={main} onChange={setMain} disabled={o.disabled} invalid={o.invalid && !main}
          label={o.withLabel ? o.label : undefined} description={o.withLabel && o.desc ? o.desc : undefined} ariaLabel={o.withLabel ? undefined : o.label || 'Checkbox'} />
        <div className="cb-group">
          <ParzCheckbox {...p} checked={all} indeterminate={some && !all} onChange={v => setList(list.map(() => v))} label={t('Выбрать все')} />
          <div className="cb-sub">
            {list.map((v, i) => <ParzCheckbox key={i} {...p} checked={v} onChange={nv => setList(l => l.map((x, j) => (j === i ? nv : x)))} label={names[i]} />)}
          </div>
        </div>
        <ParzCheckbox {...p} defaultChecked disabled label={t('Недоступно')} />
      </div>
    );
  };

  return (
    <div className="ed">
      <aside className="ctl" aria-label={t('Настройки чекбокса')}>
        <Sec title={t('Подпись')}>
          <ParzToggle className="chk" checked={o.withLabel} onChange={v => upd({ withLabel: v })} label={t('Показывать подпись')} />
          <label className="row"><span>{o.withLabel ? t('Текст подписи') : t('Подпись для экранного диктора')}</span><input className="txt" value={o.label} maxLength={40} onChange={e => upd({ label: e.target.value })} /></label>
          {o.withLabel && <label className="row"><span>{t('Пояснение под подписью')}</span><input className="txt" value={o.desc} maxLength={80} placeholder={t('Необязательно')} onChange={e => upd({ desc: e.target.value })} /></label>}
          {o.withLabel && <Seg label={t('Сторона подписи')} value={o.pos} options={[['end', t('Справа')], ['start', t('Слева')]]} onChange={v => upd({ pos: v })} />}
        </Sec>
        <Sec title={t('Размер и форма')}>
          <Seg label={t('Размер')} value={o.size} options={[['sm', 'S'], ['md', 'M'], ['lg', 'L'], ['custom', t('Свой')]]} onChange={v => upd({ size: v })} />
          {o.size === 'custom' && <Range label={t('Сторона')} unit=" px" min={12} max={40} step={1} value={o.px} onChange={v => upd({ px: v })} />}
          <ParzToggle className="chk" checked={o.roundAuto} onChange={v => upd({ roundAuto: v })} label={t('Скругление по размеру')} />
          {!o.roundAuto && <Range label={t('Скругление')} unit=" px" min={0} max={maxR} step={1} value={Math.min(o.radius, maxR)} onChange={v => upd({ radius: v })} />}
        </Sec>
        <Sec title={t('Состояние')}>
          <ParzToggle className="chk" checked={o.invalid} onChange={v => upd({ invalid: v })} label={t('Ошибка, пока не отмечен')} />
          <ParzToggle className="chk" checked={o.disabled} onChange={v => upd({ disabled: v })} label={t('Отключён')} />
          <div className="btns"><button onClick={() => setO(O0)}>{t('По умолчанию')}</button></div>
        </Sec>
        <Sec title={t('Цвета')}>
          <div className="clrs">
            <ColorField label={t('Заливка')} value={o.accent} onChange={v => upd({ accent: v })} />
            <ColorField label={t('Рамка')} value={o.border} onChange={v => upd({ border: v })} />
            <ColorField label={t('Галочка')} value={o.check} onChange={v => upd({ check: v })} />
          </div>
        </Sec>
      </aside>

      <section className="stage">
        <div className="tg-stages">{panel('dark')}{panel('light')}</div>
        <p className="logo-hint">{t('Нажмите на флажок или подпись. «Выбрать все» показывает чёрточку, когда отмечена только часть.')}</p>
        <div className="code">
          <div className="code-h"><b>{t('Код')}</b><button onClick={copy}>{copied ? t('Скопировано') : t('Скопировать')}</button></div>
          <pre><code>{code}</code></pre>
        </div>
      </section>
    </div>
  );
}
