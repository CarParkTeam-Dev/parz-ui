import { useMemo, useState } from 'react';
import { ParzSlider, ParzRange, ParzToggle, RANGE_MIN_THUMBS, RANGE_MAX_THUMBS } from '../lib';
import { Seg, Range, ColorField, Sec } from './App';
import { useT } from './i18n';

type Kind = 'slider' | 'range';
type Size = 'sm' | 'md' | 'lg';
type Tip = 'auto' | 'always' | 'never';
type O = {
  min: number; max: number; step: number; count: number; minDistance: number; size: Size; tip: Tip; marks: boolean; unit: string;
  label: string; withLabel: boolean; disabled: boolean; accent: string; track: string; thumb: string;
};
const O0: O = { min: 0, max: 100, step: 1, count: 2, minDistance: 0, size: 'md', tip: 'auto', marks: false, unit: '', label: '', withLabel: true, disabled: false, accent: '#6ee7a0', track: '#2a2a30', thumb: '#ffffff' };
const LIGHT_TRACK = '#d9dae1';

/** count бегунков, равномерно по промежутку и по шагу */
const spread = (o: O) => Array.from({ length: o.count }, (_, i) => {
  const raw = o.min + ((o.max - o.min) * (i + 1)) / (o.count + 1);
  return Math.round((raw - o.min) / o.step) * o.step + o.min;
});

const q = (s: string) => `'${s.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
function codeFor(kind: Kind, o: O, label: string) {
  const name = kind === 'slider' ? 'ParzSlider' : 'ParzRange';
  const init = kind === 'slider' ? String(Math.round((o.min + o.max) / 2 / o.step) * o.step) : `[${spread(o).join(', ')}]`;
  const a: string[] = ['value={value}', 'onChange={setValue}'];
  if (o.withLabel && label) a.push(`label=${q(label)}`);
  if (o.min !== 0) a.push(`min={${o.min}}`);
  if (o.max !== 100) a.push(`max={${o.max}}`);
  if (o.step !== 1) a.push(`step={${o.step}}`);
  if (kind === 'range' && o.minDistance) a.push(`minDistance={${o.minDistance}}`);
  if (o.size !== 'md') a.push(`size=${q(o.size)}`);
  if (o.tip !== 'auto') a.push(`showValue=${q(o.tip)}`);
  if (o.marks) a.push('marks');
  if (o.unit) a.push(`formatValue={v => \`\${v}${o.unit.replace(/[`\\$]/g, '')}\`}`);
  if (o.disabled) a.push('disabled');
  if (o.accent !== O0.accent) a.push(`accent=${q(o.accent)}`);
  if (o.track !== O0.track) a.push(`trackColor=${q(o.track)}`);
  if (o.thumb !== O0.thumb) a.push(`thumbColor=${q(o.thumb)}`);
  return [`import { useState } from 'react';`, `import { ${name} } from '@parz/ui';`, `import '@parz/ui/style.css';`, ``,
    `const [value, setValue] = useState(${init});`, ``, `<${name}`, ...a.map(x => `  ${x}`), `/>`].join('\n');
}

export function SliderEditor({ kind }: { kind: Kind }) {
  const t = useT();
  const [o, setO] = useState<O>(() => (kind === 'range' ? { ...O0, step: 5, marks: true, unit: ' ₽', min: 0, max: 100 } : O0));
  const defLabel = kind === 'slider' ? t('Громкость') : t('Цена');
  const label = o.label || defLabel;
  const [one, setOne] = useState(60);
  const [many, setMany] = useState<number[]>(() => spread(kind === 'range' ? { ...O0, step: 5 } : O0));
  const [bright, setBright] = useState(40);
  const [copied, setCopied] = useState(false);

  const upd = (p: Partial<O>) => setO(x => {
    const n = { ...x, ...p };
    if (n.max <= n.min) n.max = n.min + n.step;
    // поменяли границы, шаг или число бегунков — расставляем бегунки заново, чтобы ничего не «залипло» за краем
    if ('count' in p || 'min' in p || 'max' in p || 'step' in p) setMany(spread(n));
    if ('min' in p || 'max' in p) setOne(Math.round((n.min + n.max) / 2));
    return n;
  });
  const code = useMemo(() => codeFor(kind, o, label), [kind, o, label]);
  const copy = async () => { try { await navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 1600); } catch { /* буфер недоступен */ } };
  const fmt = o.unit ? (v: number) => `${v}${o.unit}` : undefined;

  const panel = (bg: 'dark' | 'light') => {
    const p = { min: o.min, max: o.max, step: o.step, size: o.size, showValue: o.tip, marks: o.marks, formatValue: fmt, disabled: o.disabled,
      accent: o.accent, thumbColor: o.thumb, trackColor: bg === 'light' && o.track === O0.track ? LIGHT_TRACK : o.track };
    return (
      <div className={`tg-stage sl-stage tg-stage--${bg}`}>
        <span className="tg-cap">{bg === 'dark' ? t('Тёмный фон') : t('Светлый фон')}</span>
        {kind === 'slider'
          ? <ParzSlider {...p} value={one} onChange={setOne} label={o.withLabel ? label : undefined} ariaLabel={o.withLabel ? undefined : label} />
          : <ParzRange {...p} value={many} onChange={setMany} minDistance={o.minDistance} label={o.withLabel ? label : undefined} ariaLabels={o.withLabel ? undefined : many.map((_, i) => `${label} ${i + 1}`)} />}
        {kind === 'slider' && <ParzSlider min={0} max={100} value={bright} onChange={setBright} label={t('Яркость')} formatValue={v => `${v}%`} accent={o.accent}
          trackColor={p.trackColor} thumbColor={o.thumb} size={o.size} />}
        {kind === 'range' && <ParzRange min={0} max={24} step={1} defaultValue={[9, 13, 14, 18]} fill="pairs" label={t('Рабочий день')} formatValue={v => `${v}:00`} accent={o.accent}
          trackColor={p.trackColor} thumbColor={o.thumb} size={o.size} minDistance={1} />}
      </div>
    );
  };

  return (
    <div className="ed">
      <aside className="ctl" aria-label={t('Настройки ползунка')}>
        <Sec title={t('Значения')}>
          <Range label={t('Минимум')} min={-100} max={900} step={10} value={o.min} onChange={v => upd({ min: v })} />
          <Range label={t('Максимум')} min={10} max={1000} step={10} value={o.max} onChange={v => upd({ max: v })} />
          <Range label={t('Шаг')} min={1} max={50} step={1} value={o.step} onChange={v => upd({ step: v })} />
          {kind === 'range' && <Range label={t('Сколько бегунков')} min={RANGE_MIN_THUMBS} max={RANGE_MAX_THUMBS} step={1} value={o.count} onChange={v => upd({ count: v })} />}
          {kind === 'range' && <Range label={t('Мин. расстояние между бегунками')} min={0} max={Math.max(0, Math.floor((o.max - o.min) / o.count))} step={o.step} value={o.minDistance} onChange={v => upd({ minDistance: v })} />}
          <label className="row"><span>{t('Единица после числа')}</span><input className="txt" value={o.unit} maxLength={8} placeholder=" ₽, %, км" onChange={e => upd({ unit: e.target.value })} /></label>
        </Sec>
        <Sec title={t('Подпись')}>
          <ParzToggle className="chk" checked={o.withLabel} onChange={v => upd({ withLabel: v })} label={t('Показывать подпись')} />
          <label className="row"><span>{o.withLabel ? t('Текст подписи') : t('Подпись для экранного диктора')}</span><input className="txt" value={o.label} placeholder={defLabel} maxLength={40} onChange={e => upd({ label: e.target.value })} /></label>
        </Sec>
        <Sec title={t('Вид')}>
          <Seg label={t('Размер')} value={o.size} options={[['sm', 'S'], ['md', 'M'], ['lg', 'L']]} onChange={v => upd({ size: v })} />
          <span className="sl-cap">{t('Пузырёк со значением')}</span>
          <Seg label={t('Пузырёк со значением')} value={o.tip} options={[['auto', t('Когда тянут')], ['always', t('Всегда')], ['never', t('Нет')]]} onChange={v => upd({ tip: v })} />
          <ParzToggle className="chk" checked={o.marks} onChange={v => upd({ marks: v })} label={t('Метки на каждом шаге')} />
          <ParzToggle className="chk" checked={o.disabled} onChange={v => upd({ disabled: v })} label={t('Отключён')} />
          <div className="btns"><button onClick={() => { setO(O0); setMany(spread(O0)); setOne(60); }}>{t('По умолчанию')}</button></div>
        </Sec>
        <Sec title={t('Цвета')}>
          <div className="clrs">
            <ColorField label={t('Заливка')} value={o.accent} onChange={v => upd({ accent: v })} />
            <ColorField label={t('Дорожка')} value={o.track} onChange={v => upd({ track: v })} />
            <ColorField label={t('Бегунок')} value={o.thumb} onChange={v => upd({ thumb: v })} />
          </div>
        </Sec>
      </aside>

      <section className="stage">
        <div className="tg-stages">{panel('dark')}{panel('light')}</div>
        <p className="logo-hint">{kind === 'slider'
          ? t('Тяните бегунок или нажмите на дорожку. Стрелки, PageUp/PageDown, Home и End тоже работают.')
          : t('Каждый бегунок двигается сам по себе и не перепрыгивает соседей. Нажмите на дорожку — подъедет ближайший.')}</p>
        <div className="code">
          <div className="code-h"><b>{t('Код')}</b><button onClick={copy}>{copied ? t('Скопировано') : t('Скопировать')}</button></div>
          <pre><code>{code}</code></pre>
        </div>
      </section>
    </div>
  );
}
