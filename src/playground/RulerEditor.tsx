import { useMemo, useState } from 'react';
import { ParzRuler, ParzProvider, ParzTabs, ParzToggle, ParzButton, ParzColorPicker, type ParzMotionPreset } from '../lib';
import { Sec } from './App';
import { useT } from './i18n';

function Tabs<V extends string>({ label, value, options, onChange }: { label: string; value: V; options: [V, string][]; onChange: (v: V) => void }) {
  const t = useT();
  return <ParzTabs size="md" overflow="more" moreLabel={t('Ещё')} ariaLabel={label} value={value} onChange={onChange}
    options={options.map(([v, l]) => ({ value: v, label: l }))} />;
}
/* поле ввода в стиле редактора */
function Field({ label, value, onChange, type = 'text', placeholder }: { label: string; value: string | number; onChange: (v: string) => void; type?: string; placeholder?: string }) {
  return (
    <label className="rl-f">
      <span>{label}</span>
      <input type={type} value={value} placeholder={placeholder} onChange={e => onChange(e.target.value)} spellCheck={false} />
    </label>
  );
}

type Kind = 'time' | 'number' | 'text';
type O = {
  motion: ParzMotionPreset; kind: Kind; gap: '12' | '16' | '20' | '24'; major: boolean; showValue: boolean; accent: string; disabled: boolean;
  tStep: '5' | '10' | '15' | '30'; tDefault: string; tExclude: string;
  nMin: number; nMax: number; nStep: number; nDefault: number; nExclude: string;
  names: string; minor: '1' | '2' | '3' | '4';
};
const O0: O = {
  motion: 'bouncy', kind: 'time', gap: '16', major: false, showValue: true, accent: '#ff453a', disabled: false,
  tStep: '10', tDefault: '07:10', tExclude: '12:00, 12:10',
  nMin: 0, nMax: 100, nStep: 1, nDefault: 50, nExclude: '13, 66',
  names: 'Ani, Mark, Elena, David, Sara, Aram, Lina', minor: '3'
};
const pad = (n: number) => String(n).padStart(2, '0');
export const hhmm = (m: number) => `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;
const toMin = (s: string) => { const m = /^(\d{1,2}):(\d{2})$/.exec(s.trim()); return m ? +m[1] * 60 + +m[2] : null; };
const list = (s: string) => s.split(',').map(x => x.trim()).filter(Boolean);

/* что передать в ParzRuler при данных настройках */
function rulerProps(o: O) {
  if (o.kind === 'time') {
    const step = +o.tStep;
    return { min: 0, max: 1440 - step, step, exclude: list(o.tExclude).map(toMin).filter((x): x is number => x != null), formatValue: hhmm, majorEvery: o.major ? 60 / step : 0, def: toMin(o.tDefault) ?? 0 };
  }
  if (o.kind === 'number') {
    const step = o.nStep > 0 ? o.nStep : 1, max = Math.max(o.nMin + step, o.nMax);
    return { min: o.nMin, max, step, exclude: list(o.nExclude).map(Number).filter(x => !Number.isNaN(x)), majorEvery: o.major ? 10 : 0, def: o.nDefault };
  }
  const names = list(o.names);
  return { labels: names.length ? names : ['—'], minorTicks: +o.minor, def: 0 };
}

function codeFor(o: O) {
  const r = rulerProps(o);
  const a: string[] = ['value={value}', 'onChange={setValue}'];
  if (o.kind === 'time') {
    a.push('min={0}', `max={${r.max}}`, `step={${r.step}}`, "formatValue={m => `${String(m / 60 | 0).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`}");
    if (r.exclude?.length) a.push(`exclude={[${r.exclude.join(', ')}]} // ${list(o.tExclude).join(', ')}`);
  } else if (o.kind === 'number') {
    a.push(`min={${r.min}}`, `max={${r.max}}`, `step={${r.step}}`);
    if (r.exclude?.length) a.push(`exclude={[${r.exclude.join(', ')}]}`);
  } else {
    a.push(`labels={[${(r.labels ?? []).map(x => `'${x.replace(/'/g, "\\'")}'`).join(', ')}]}`);
    if (o.minor !== '3') a.push(`minorTicks={${o.minor}}`);
  }
  if (o.gap !== '16' && o.kind !== 'text') a.push(`tickGap={${o.gap}}`);
  if (r.majorEvery) a.push(`majorEvery={${r.majorEvery}}`);
  if (!o.showValue) a.push('showValue={false}');
  if (o.accent !== O0.accent) a.push(`accent='${o.accent}'`);
  if (o.disabled) a.push('disabled');
  return [`import { useState } from 'react';`, `import { ParzProvider, ParzRuler } from '@carparkteam/parz-ui';`, `import '@carparkteam/parz-ui/style.css';`, ``,
    `const [value, setValue] = useState(${r.def});`, ``,
    `<ParzProvider motion='${o.motion}'>`, `  <ParzRuler\n    ${a.join('\n    ')}\n  />`, `</ParzProvider>`].join('\n');
}

export function RulerEditor() {
  const t = useT();
  const [o, setO] = useState<O>(O0);
  const r = useMemo(() => rulerProps(o), [o]);
  const [val, setVal] = useState<number>(() => rulerProps(O0).def);
  const [copied, setCopied] = useState(false);
  // вид или «по умолчанию» поменялись — ставим значение по умолчанию
  const upd = (p: Partial<O>) => setO(x => {
    const n = { ...x, ...p };
    if ('kind' in p || 'tDefault' in p || 'nDefault' in p || 'tStep' in p || 'nMin' in p || 'nStep' in p || 'names' in p) setVal(rulerProps(n).def);
    return n;
  });
  const code = useMemo(() => codeFor(o), [o]);
  const copy = async () => { try { await navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 1600); } catch { /* буфер недоступен */ } };

  const ruler = (bg: 'dark' | 'light') => (
    <ParzRuler key={o.kind} theme={bg} value={val} onChange={setVal} min={r.min} max={r.max} step={r.step} exclude={r.exclude} formatValue={r.formatValue}
      labels={r.labels} minorTicks={r.minorTicks} tickGap={o.kind === 'text' ? undefined : +o.gap} majorEvery={r.majorEvery}
      showValue={o.showValue} accent={o.accent} disabled={o.disabled} ariaLabel={o.kind === 'time' ? t('Время') : o.kind === 'number' ? t('Число') : t('Имя')} />
  );
  const panel = (bg: 'dark' | 'light') => (
    <div className={`tg-stage tg-stage--${bg} rl-stage`}>
      <span className="tg-cap">{bg === 'dark' ? t('Тёмный фон') : t('Светлый фон')}</span>
      {ruler(bg)}
    </div>
  );
  const shown = o.kind === 'time' ? `${val} (${hhmm(val)})` : o.kind === 'text' ? `${val} (${r.labels?.[val] ?? ''})` : String(val);

  return (
    <div className="ed">
      <aside className="ctl" aria-label={t('Настройки шкалы')}>
        <Sec title={t('Движение')}>
          <Tabs label={t('Движение')} value={o.motion} options={[['calm', 'Calm'], ['bouncy', 'Bouncy'], ['snappy', 'Snappy']]} onChange={x => upd({ motion: x })} />
        </Sec>
        <Sec title={t('Значения')}>
          <div className="rl-group">
          <Tabs label={t('Пример')} value={o.kind} options={[['time', t('Время')], ['number', t('Число')], ['text', t('Текст')]]} onChange={x => upd({ kind: x })} />
          {o.kind === 'time' && <>
            <div className="rl-f">
              <span>{t('Шаг')}</span>
              <Tabs label={t('Шаг')} value={o.tStep} options={[['5', `5 ${t('мин')}`], ['10', `10 ${t('мин')}`], ['15', `15 ${t('мин')}`], ['30', `30 ${t('мин')}`]]} onChange={x => upd({ tStep: x })} />
            </div>
            <div className="rl-fields">
              <Field label={t('По умолчанию')} value={o.tDefault} onChange={v => upd({ tDefault: v })} placeholder="07:10" />
            </div>
            <Field label={t('Исключить (через запятую)')} value={o.tExclude} onChange={v => upd({ tExclude: v })} placeholder="12:00, 12:10" />
          </>}
          {o.kind === 'number' && <>
            <div className="rl-fields">
              <Field label="min" type="number" value={o.nMin} onChange={v => upd({ nMin: +v || 0 })} />
              <Field label="max" type="number" value={o.nMax} onChange={v => upd({ nMax: +v || 0 })} />
              <Field label={t('Шаг')} type="number" value={o.nStep} onChange={v => upd({ nStep: Math.max(0, +v) || 1 })} />
              <Field label={t('По умолчанию')} type="number" value={o.nDefault} onChange={v => upd({ nDefault: +v || 0 })} />
            </div>
            <Field label={t('Исключить (через запятую)')} value={o.nExclude} onChange={v => upd({ nExclude: v })} placeholder="13, 66" />
          </>}
          {o.kind === 'text' && <>
            <Field label={t('Имена (через запятую)')} value={o.names} onChange={v => upd({ names: v })} />
            <div className="rl-f">
              <span>{t('Короткие засечки между именами')}</span>
              <Tabs label={t('Короткие засечки между именами')} value={o.minor} options={[['1', '1'], ['2', '2'], ['3', '3'], ['4', '4']]} onChange={x => upd({ minor: x })} />
            </div>
          </>}
          </div>
        </Sec>
        <Sec title={t('Вид')}>
          <div className="rl-group">
          {o.kind !== 'text' && <div className="rl-f">
            <span>{t('Шаг засечек')}</span>
            <Tabs label={t('Шаг засечек')} value={o.gap} options={[['12', '12 px'], ['16', '16 px'], ['20', '20 px'], ['24', '24 px']]} onChange={x => upd({ gap: x })} />
          </div>}
          <ParzColorPicker mode="popover" label={t('Цвет указателя')} value={o.accent} onChange={v => upd({ accent: v })} alpha={false} />
          <ParzToggle className="chk" checked={o.showValue} onChange={x => upd({ showValue: x })} label={t('Число над шкалой')} />
          {o.kind !== 'text' && <ParzToggle className="chk" checked={o.major} onChange={x => upd({ major: x })} label={o.kind === 'time' ? t('Длинные засечки на каждом часе') : t('Длинные засечки на каждом 10-м шаге')} />}
          <ParzToggle className="chk" checked={o.disabled} onChange={x => upd({ disabled: x })} label={t('Отключён')} />
          <div className="days-btns"><ParzButton size="sm" variant="outline" icon="ms:restart_alt" onClick={() => { setO(O0); setVal(rulerProps(O0).def); }}>{t('По умолчанию')}</ParzButton></div>
          </div>
        </Sec>
      </aside>

      <section className="stage">
        <ParzProvider motion={o.motion}>
          <div className="tg-stages rl-stages">{panel('dark')}{panel('light')}</div>
        </ParzProvider>
        <p className="logo-hint days-api">onChange → <code>{shown}</code></p>
        <p className="logo-hint">{t('Тяните шкалу или крутите колесо — после броска она едет по инерции и пружинит на ближайшую засечку. Исключённые значения шкала проезжает. Стрелки на клавиатуре — на шаг.')}</p>
        <div className="code">
          <div className="code-h"><b>{t('Код')}</b><button onClick={copy}>{copied ? t('Скопировано') : t('Скопировать')}</button></div>
          <pre><code>{code}</code></pre>
        </div>
      </section>
    </div>
  );
}
