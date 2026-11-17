import { useMemo, useState } from 'react';
import { ParzTabs, ParzToggle, type ParzTabsSize, type ParzTabsOverflow, type ParzTabsBadgePlacement } from '../lib';
import { Seg, Range, ColorField, Sec } from './App';
import { useT } from './i18n';

type O = { count: number; ov: ParzTabsOverflow; fade: boolean; arrows: boolean; badges: boolean; bdPos: ParzTabsBadgePlacement; pulse: boolean; size: ParzTabsSize; full: boolean; icons: boolean; disabled: boolean; offOne: boolean; bg: string; pill: string; on: string; fg: string };
const O0: O = { count: 3, ov: 'wrap', fade: true, arrows: false, badges: true, bdPos: 'inline', pulse: false, size: 'md', full: false, icons: false, disabled: false, offOne: false, bg: '#1c1c21', pill: '#ffffff', on: '#000000', fg: '#9a9aa3' };
const LIGHT = { bg: '#e6e7ec', fg: '#6b6b75', on: '#111114' };
const ITEMS: [string, string, string][] = [['day', 'День', 'today'], ['week', 'Неделя', 'date_range'], ['month', 'Месяц', 'calendar_month'], ['year', 'Год', 'event_note'], ['all', 'Всё время', 'all_inclusive'], ['quarter', 'Квартал', 'view_week'], ['hour', 'Час', 'schedule'], ['custom', 'Свой период', 'tune']];
/* для примера: точка на «Неделе», число на «Годе» и «Своём периоде» */
const BADGE: Record<string, number | 'dot'> = { week: 'dot', year: 3, custom: 1 };

const q = (s: string) => `'${s.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
function codeFor(o: O, labels: string[]) {
  const a: string[] = ['value={tab}', 'onChange={setTab}', `ariaLabel=${q(labels[labels.length - 1])}`];
  if (o.size !== 'md') a.push(`size=${q(o.size)}`);
  if (o.full) a.push('fullWidth');
  if (o.ov !== 'wrap') a.push(`overflow=${q(o.ov)}`);
  if (o.ov === 'scroll' && !o.fade) a.push('fadeEdges={false}');
  if (o.ov === 'scroll' && o.arrows) a.push('scrollButtons');
  if (o.badges && o.bdPos !== 'inline') a.push(`badgePlacement=${q(o.bdPos)}`);
  if (o.disabled) a.push('disabled');
  if (o.bg !== O0.bg) a.push(`background=${q(o.bg)}`);
  if (o.pill !== O0.pill) a.push(`pillColor=${q(o.pill)}`);
  if (o.on !== O0.on) a.push(`activeColor=${q(o.on)}`);
  if (o.fg !== O0.fg) a.push(`color=${q(o.fg)}`);
  const opts = ITEMS.slice(0, o.count).map(([v], i) => {
    return `    { value: ${q(v)}, ${o.icons ? `icon: ${q('ms:' + ITEMS[i][2])}, ` : ''}label: ${q(labels[i])}${o.badges && BADGE[v] !== undefined ? `, badge: ${typeof BADGE[v] === 'number' ? BADGE[v] : q('dot')}${o.pulse && BADGE[v] === 'dot' ? ', badgePulse: true' : ''}` : ''}${o.offOne && i === o.count - 1 ? ', disabled: true' : ''} }`;
  });
  return [`import { useState } from 'react';`, `import { ParzTabs } from '@carparkteam/parz-ui';`, `import '@carparkteam/parz-ui/style.css';`, ``,
    `const [tab, setTab] = useState(${q(ITEMS[0][0])});`, ``, `<ParzTabs`, `  options={[`, opts.join(',\n'), `  ]}`, ...a.map(x => `  ${x}`), `/>`].join('\n');
}

export function TabsEditor() {
  const t = useT();
  const [o, setO] = useState<O>(O0);
  const [v, setV] = useState('day');
  const [copied, setCopied] = useState(false);
  const upd = (p: Partial<O>) => setO(x => ({ ...x, ...p }));
  const labels = [...ITEMS.map(x => t(x[1])), t('Период')];
  const code = useMemo(() => codeFor(o, labels), [o, labels.join()]);
  const copy = async () => { try { await navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 1600); } catch { /* буфер недоступен */ } };
  const options = ITEMS.slice(0, o.count).map(([val, , ic], i) => ({
    value: val, disabled: o.offOne && i === o.count - 1,
    icon: o.icons ? `ms:${ic}` : undefined, label: labels[i], badge: o.badges ? BADGE[val] : undefined, badgePulse: o.pulse && BADGE[val] === 'dot'
  }));
  const cur = options.some(x => x.value === v && !x.disabled) ? v : options[0].value;

  const panel = (bg: 'dark' | 'light') => {
    const lt = bg === 'light';
    const p = {
      options, size: o.size, fullWidth: o.full, disabled: o.disabled, pillColor: o.pill, ariaLabel: t('Период'), overflow: o.ov, fadeEdges: o.fade, scrollButtons: o.arrows, badgePlacement: o.bdPos, moreLabel: t('Ещё'),
      background: lt && o.bg === O0.bg ? LIGHT.bg : o.bg, color: lt && o.fg === O0.fg ? LIGHT.fg : o.fg, activeColor: lt && o.on === O0.on ? LIGHT.on : o.on
    };
    return (
      <div className={`tg-stage tg-stage--${bg} tb-stage`}>
        <span className="tg-cap">{lt ? t('Светлый фон') : t('Тёмный фон')}</span>
        <ParzTabs {...p} value={cur} onChange={setV} />
      </div>
    );
  };

  return (
    <div className="ed">
      <aside className="ctl" aria-label={t('Настройки табов')}>
        <Sec title={t('Пункты')}>
          <Range label={t('Сколько пунктов')} min={2} max={ITEMS.length} step={1} value={o.count} onChange={n => upd({ count: n })} />
          <ParzToggle className="chk" checked={o.icons} onChange={x => upd({ icons: x })} label={t('Иконки')} />
          <ParzToggle className="chk" checked={o.badges} onChange={x => upd({ badges: x })} label={t('Бейджи на пунктах')} />
          {o.badges && <Seg label={t('Где бейдж')} value={o.bdPos} options={[['inline', t('Рядом с названием')], ['corner', t('В углу')]]} onChange={x => upd({ bdPos: x })} />}
          {o.badges && <ParzToggle className="chk" checked={o.pulse} onChange={x => upd({ pulse: x })} label={t('Пульс у точки')} />}
          <ParzToggle className="chk" checked={o.offOne} onChange={x => upd({ offOne: x })} label={t('Последний пункт недоступен')} />
        </Sec>
        <Sec title={t('Размер и поведение')}>
          <Seg label={t('Размер')} value={o.size} options={[['sm', 'S'], ['md', 'M'], ['lg', 'L']]} onChange={x => upd({ size: x })} />
          <div className="row"><span>{t('Если не помещаются')}</span></div>
          <Seg label={t('Если не помещаются')} value={o.ov} options={[['wrap', t('Перенос')], ['more', t('Группа «•••»')], ['scroll', t('Прокрутка')]]} onChange={x => upd({ ov: x, count: x !== 'wrap' && o.count < 7 ? ITEMS.length : o.count })} />
          {o.ov === 'scroll' && <ParzToggle className="chk" checked={o.fade} onChange={x => upd({ fade: x })} label={t('Затенение по краям')} />}
          {o.ov === 'scroll' && <ParzToggle className="chk" checked={o.arrows} onChange={x => upd({ arrows: x })} label={t('Стрелки по краям')} />}
          <ParzToggle className="chk" checked={o.full} onChange={x => upd({ full: x })} label={t('На всю ширину')} />
          <ParzToggle className="chk" checked={o.disabled} onChange={x => upd({ disabled: x })} label={t('Отключён')} />
          <div className="btns"><button onClick={() => setO(O0)}>{t('По умолчанию')}</button></div>
        </Sec>
        <Sec title={t('Цвета')}>
          <div className="clrs">
            <ColorField label={t('Дорожка')} value={o.bg} onChange={x => upd({ bg: x })} />
            <ColorField label={t('Плашка')} value={o.pill} onChange={x => upd({ pill: x })} />
            <ColorField label={t('Выбранный текст')} value={o.on} onChange={x => upd({ on: x })} />
            <ColorField label={t('Текст')} value={o.fg} onChange={x => upd({ fg: x })} />
          </div>
        </Sec>
      </aside>

      <section className="stage">
        <div className="tg-stages">{panel('dark')}{panel('light')}</div>
        <p className="logo-hint">{t('Нажмите пункт или переключайте стрелками — плашка перетекает каплей.')}</p>
        <div className="code">
          <div className="code-h"><b>{t('Код')}</b><button onClick={copy}>{copied ? t('Скопировано') : t('Скопировать')}</button></div>
          <pre><code>{code}</code></pre>
        </div>
      </section>
    </div>
  );
}
