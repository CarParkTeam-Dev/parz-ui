import { useMemo, useState } from 'react';
import { ParzExpander, ParzToggle, ParzCheckbox, ParzButton } from '../lib';
import { ColorField, Sec, Seg } from './App';
import { useT } from './i18n';

type O = { card: boolean; single: boolean; divider: boolean; disabled: boolean; fg: string; chev: string; line: string };
const O0: O = { card: false, single: false, divider: true, disabled: false, fg: '#f2f2f5', chev: '#9a9aa3', line: '#26262c' };
const LIGHT = { fg: '#16161b', chev: '#6b6b75', line: '#dcdde4' };
const FAQ: [string, string][] = [
  ['Доставка', 'Привезём завтра с 10 до 18.'],
  ['Уведомления', ''],
  ['Возврат', 'В течение 14 дней — без объяснения причин.']
];

const SETTINGS_CODE = `<ParzToggle checked={push} onChange={setPush} label='Push' />
  <ParzCheckbox checked={mail} onChange={setMail} label='Email' />
  <ParzButton size='sm'>Save</ParzButton>`;
const q = (s: string) => `'${s.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
function codeFor(o: O, faq: [string, string][]) {
  const a: string[] = [];
  if (o.card) a.push(`variant='card'`);
  if (!o.divider) a.push('divider={false}');
  if (o.disabled) a.push('disabled');
  if (o.fg !== O0.fg) a.push(`color=${q(o.fg)}`);
  if (o.chev !== O0.chev) a.push(`chevronColor=${q(o.chev)}`);
  if (o.line !== O0.line) a.push(`dividerColor=${q(o.line)}`);
  const extra = a.length ? ' ' + a.join(' ') : '';
  const head = [`import { useState } from 'react';`, `import { ParzExpander, ParzToggle, ParzCheckbox, ParzButton } from '@carparkteam/parz-ui';`, `import '@carparkteam/parz-ui/style.css';`, ``];
  const st = [`const [push, setPush] = useState(true);`, `const [mail, setMail] = useState(false);`];
  if (o.single) return [...head, `const [open, setOpen] = useState<number | null>(0);`, ...st, ``,
    ...faq.map(([h, b], i) => `<ParzExpander title=${q(h)} open={open === ${i}} onOpenChange={v => setOpen(v ? ${i} : null)}${extra}>\n  ${b || SETTINGS_CODE}\n</ParzExpander>`)].join('\n');
  return [...head, ...st, ``, ...faq.map(([h, b], i) => `<ParzExpander title=${q(h)}${i === 0 ? ' defaultOpen' : ''}${extra}>\n  ${b || SETTINGS_CODE}\n</ParzExpander>`)].join('\n');
}

export function ExpanderEditor() {
  const t = useT();
  const [o, setO] = useState<O>(O0);
  const [open, setOpen] = useState<boolean[]>([true, false, false]);
  const [copied, setCopied] = useState(false);
  const [push, setPush] = useState(true);
  const [mail, setMail] = useState(false);
  const [sound, setSound] = useState(true);
  const upd = (p: Partial<O>) => setO(x => ({ ...x, ...p }));
  const faq = FAQ.map(([h, b]) => [t(h), t(b)] as [string, string]);
  const code = useMemo(() => codeFor(o, faq), [o, faq.join()]);
  const copy = async () => { try { await navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 1600); } catch { /* буфер недоступен */ } };
  const set = (i: number, v: boolean) => setOpen(s => s.map((x, j) => (j === i ? v : o.single && v ? false : x)));

  const panel = (bg: 'dark' | 'light') => {
    const lt = bg === 'light';
    const p = { variant: o.card ? 'card' as const : 'plain' as const, divider: o.divider, disabled: o.disabled, color: lt && o.fg === O0.fg ? LIGHT.fg : o.fg, chevronColor: lt && o.chev === O0.chev ? LIGHT.chev : o.chev, dividerColor: lt && o.line === O0.line ? LIGHT.line : o.line };
    return (
      <div className={`tg-stage tg-stage--${bg} ex-stage`}>
        <span className="tg-cap">{lt ? t('Светлый фон') : t('Тёмный фон')}</span>
        <div className="ex-list">
          {faq.map(([h, b], i) => <ParzExpander key={i} {...p} title={h} open={open[i]} onOpenChange={v => set(i, v)}>{b || (
            <div className="ex-set">
              <ParzToggle checked={push} onChange={setPush} label={t('Push-уведомления')} trackColor={lt ? '#d9dae1' : undefined} />
              <ParzToggle checked={sound} onChange={setSound} label={t('Звук')} trackColor={lt ? '#d9dae1' : undefined} />
              <ParzCheckbox checked={mail} onChange={setMail} label={t('Письма на почту')} />
              <ParzButton size="sm" onClick={() => set(i, false)}>{t('Сохранить')}</ParzButton>
            </div>
          )}</ParzExpander>)}
        </div>
      </div>
    );
  };

  return (
    <div className="ed">
      <aside className="ctl" aria-label={t('Настройки экспандера')}>
        <Sec title={t('Вид')}>
          <Seg label={t('Вид')} value={o.card ? 'card' : 'plain'} options={[['plain', t('Линии')], ['card', t('Карточка')]]} onChange={x => upd({ card: x === 'card' })} />
        </Sec>
        <Sec title={t('Поведение')}>
          <ParzToggle className="chk" checked={o.single} onChange={x => { upd({ single: x }); if (x) setOpen(s => { const f = s.indexOf(true); return s.map((_, j) => j === f); }); }} label={t('Открыта только одна секция')} />
          <ParzToggle className="chk" checked={o.divider} onChange={x => upd({ divider: x })} label={t('Линия между секциями')} />
          <ParzToggle className="chk" checked={o.disabled} onChange={x => upd({ disabled: x })} label={t('Отключён')} />
          <div className="btns"><button onClick={() => setOpen(s => s.map(() => true))} disabled={o.single}>{t('Раскрыть все')}</button><button onClick={() => setOpen(s => s.map(() => false))}>{t('Свернуть все')}</button></div>
          <div className="btns"><button onClick={() => setO(O0)}>{t('По умолчанию')}</button></div>
        </Sec>
        <Sec title={t('Цвета')}>
          <div className="clrs">
            <ColorField label={t('Заголовок')} value={o.fg} onChange={x => upd({ fg: x })} />
            <ColorField label={t('Стрелка')} value={o.chev} onChange={x => upd({ chev: x })} />
            <ColorField label={t('Линия')} value={o.line} onChange={x => upd({ line: x })} />
          </div>
        </Sec>
      </aside>

      <section className="stage">
        <div className="tg-stages">{panel('dark')}{panel('light')}</div>
        <p className="logo-hint">{t('Нажмите заголовок — секция плавно раскроется.')}</p>
        <div className="code">
          <div className="code-h"><b>{t('Код')}</b><button onClick={copy}>{copied ? t('Скопировано') : t('Скопировать')}</button></div>
          <pre><code>{code}</code></pre>
        </div>
      </section>
    </div>
  );
}
