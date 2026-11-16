import { useEffect, useMemo, useRef, useState } from 'react';
import { ParzProgress, ParzToggle, ParzSlider, ParzButton, Badge, type ParzProgressSize, type ParzProgressVariant, type ParzProgressLabelPosition, type ParzProgressStatus } from '../lib';
import { Seg, ColorField, Sec } from './App';
import { useT } from './i18n';

type O = {
  label: string; withLabel: boolean; pos: ParzProgressLabelPosition; status: ParzProgressStatus; morph: boolean; variant: ParzProgressVariant; size: ParzProgressSize; value: number;
  indet: boolean; showValue: boolean; celebrate: boolean; accent: string;
};
const O0: O = { label: 'Uploading', withLabel: true, pos: 'end', status: 'default', morph: false, variant: 'bar', size: 'md', value: 64, indet: false, showValue: true, celebrate: true, accent: '#6ee7a0' };

const q = (s: string) => `'${s.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
function codeFor(o: O) {
  const a: string[] = [];
  if (o.indet) a.push('indeterminate'); else a.push('value={progress}');
  if (o.variant !== 'bar') a.push(`variant=${q(o.variant)}`);
  if (o.variant === 'ring' && o.withLabel && o.pos !== 'end') a.push(`labelPosition=${q(o.pos)}`);
  if (o.size !== 'md') a.push(`size=${q(o.size)}`);
  if (o.withLabel) a.push(`label=${q(o.label)}`); else a.push(`ariaLabel=${q(o.label || 'Progress')}`);
  if (!o.showValue && !o.indet) a.push('showValue={false}');
  if (o.status !== 'default') a.push(`status=${q(o.status)}`);
  if (o.morph) a.push('successMorph');
  if (!o.celebrate) a.push('celebrate={false}');
  if (o.accent !== O0.accent) a.push(`accent=${q(o.accent)}`);
  return [`import { ParzProgress } from '@carparkteam/parz-ui';`, `import '@carparkteam/parz-ui/style.css';`, ``, `<ParzProgress`, ...a.map(x => `  ${x}`), `/>`].join('\n');
}

/* демо «загрузка файла»: прогресс идёт неровными шагами, как в жизни, — заливка перетекает между ними */
function UploadDemo({ accent, variant, size, withLabel, pos, status, showValue, celebrate, morph }: { accent: string; variant: ParzProgressVariant; size: ParzProgressSize; withLabel: boolean; pos: ParzProgressLabelPosition; status: ParzProgressStatus; showValue: boolean; celebrate: boolean; morph: boolean }) {
  const t = useT();
  const [v, setV] = useState<number | null>(null);
  const tm = useRef(0);
  useEffect(() => () => window.clearTimeout(tm.current), []);
  const step = (x: number) => {
    if (x >= 100) { setV(100); tm.current = window.setTimeout(() => setV(null), 3200); return; }
    setV(x);
    tm.current = window.setTimeout(() => step(Math.min(100, x + 8 + Math.random() * 22)), 380 + Math.random() * 420);
  };
  const go = () => { window.clearTimeout(tm.current); setV(0); tm.current = window.setTimeout(() => step(6), 250); };
  return (
    <div className="pg-demo">
      <ParzProgress variant={variant} size={size} accent={accent} value={v ?? 0} labelPosition={pos} status={morph && v === 100 ? 'success' : status} successMorph={morph} showValue={showValue} celebrate={celebrate}
        label={withLabel ? (v === 100 ? t('Готово') : t('Загрузка файла')) : undefined} ariaLabel={withLabel ? undefined : t('Загрузка файла')} />
      <ParzButton size="sm" variant="soft" accent={accent} icon="ms:upload" onClick={go} disabled={v !== null && v < 100}>{t('Загрузить')}</ParzButton>
    </div>
  );
}

export function ProgressEditor() {
  const t = useT();
  const [o, setO] = useState<O>(() => ({ ...O0, label: t('Загрузка') }));
  const [copied, setCopied] = useState(false);
  const upd = (p: Partial<O>) => setO(x => ({ ...x, ...p }));
  const code = useMemo(() => codeFor(o), [o]);
  const copy = async () => { try { await navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 1600); } catch { /* буфер недоступен */ } };

  const panel = (bg: 'dark' | 'light') => {
    // выбранное состояние — только у главного примера; остальные примеры обычные, а ниже — витрина всех состояний
    const c = { variant: o.variant, size: o.size, accent: o.accent, celebrate: o.celebrate, labelPosition: o.pos };
    return (
      <div className={`tg-stage tg-stage--${bg} pg-stage`}>
        <span className="tg-cap">{bg === 'dark' ? t('Тёмный фон') : t('Светлый фон')}</span>
        <div className={o.variant === 'ring' ? 'pg-rings' : 'pg-bars'}>
          <ParzProgress {...c} status={o.status} successMorph={o.morph} value={o.indet ? undefined : o.value} indeterminate={o.indet} showValue={o.showValue}
            label={o.withLabel ? o.label : undefined} ariaLabel={o.withLabel ? undefined : o.label || 'Progress'} />
          <ParzProgress {...c} indeterminate label={o.withLabel ? t('Подождите…') : undefined} ariaLabel={o.withLabel ? undefined : t('Подождите…')} />
        </div>
        <div className="pg-states">
          <span className="tg-cap">{t('Все состояния')}</span>
          <div className={o.variant === 'ring' ? 'pg-rings' : 'pg-bars'}>
            <ParzProgress {...c} status="success" successMorph={o.morph} value={100} celebrate={false} label={o.withLabel ? t('Готово') : undefined} ariaLabel={t('Готово')} />
            <ParzProgress {...c} status="warning" value={86} label={o.withLabel ? t('Мало места на диске') : undefined} ariaLabel={t('Мало места на диске')} />
            <ParzProgress {...c} status="error" value={42} label={o.withLabel ? t('Не удалось загрузить') : undefined} ariaLabel={t('Не удалось загрузить')} />
            <ParzProgress {...c} status="paused" value={30} label={o.withLabel ? t('Ждём сеть') : undefined} ariaLabel={t('Ждём сеть')} />
          </div>
        </div>
        <UploadDemo accent={o.accent} variant={o.variant} size={o.size} withLabel={o.withLabel} pos={o.pos} status="default" showValue={o.showValue} celebrate={o.celebrate} morph={o.morph} />
      </div>
    );
  };

  return (
    <div className="ed">
      <aside className="ctl" aria-label={t('Настройки прогресса')}>
        <Sec title={t('Подпись')}>
          <ParzToggle className="chk" checked={o.withLabel} onChange={v => upd({ withLabel: v })} label={t('Показывать подпись')} />
          {o.withLabel && o.variant === 'ring' && <div className="row"><span>{t('Подпись у кольца')}</span><Seg label={t('Подпись у кольца')} value={o.pos} options={[['end', t('Справа')], ['start', t('Слева')], ['bottom', t('Снизу')]]} onChange={v => upd({ pos: v })} /></div>}
          <label className="row"><span>{o.withLabel ? t('Текст подписи') : t('Подпись для экранного диктора')}</span><input className="txt" value={o.label} maxLength={40} onChange={e => upd({ label: e.target.value })} /></label>
        </Sec>
        <Sec title={t('Вид')}>
          <div className="row"><span>{t('Форма')}</span><Seg label={t('Форма')} value={o.variant} options={[['bar', t('Полоса')], ['ring', t('Кольцо')]]} onChange={v => upd({ variant: v })} /></div>
          <div className="row"><span>{t('Размер')}</span><Seg label={t('Размер')} value={o.size} options={[['sm', 'S'], ['md', 'M'], ['lg', 'L']]} onChange={v => upd({ size: v })} /></div>
        </Sec>
        <Sec title={t('Состояние')}>
          <Seg label={t('Состояние')} value={o.status} options={[['default', t('Обычное')], ['success', t('Успех')], ['warning', t('Внимание')], ['error', t('Ошибка')], ['paused', t('Пауза')]]} onChange={v => upd({ status: v })} />
        </Sec>
        <Sec title={t('Значение')}>
          <ParzSlider value={o.value} onChange={v => upd({ value: v })} disabled={o.indet} label={t('Прогресс')} formatValue={x => `${x}%`} />
          <div className="btns">
            {[0, 25, 50, 100].map(x => <button key={x} disabled={o.indet} onClick={() => upd({ value: x })}>{x}%</button>)}
          </div>
          <ParzToggle className="chk" checked={o.indet} onChange={v => upd({ indet: v })} label={t('Неизвестно сколько')} />
          <ParzToggle className="chk" checked={o.showValue} onChange={v => upd({ showValue: v })} disabled={o.indet} label={t('Показывать значение')} />
          <div className="pg-beta"><Badge value="beta" inline /><ParzToggle className="chk" checked={o.morph} onChange={v => upd({ morph: v })} label={t('Превращение при успехе')} ariaLabel={`${t('Превращение при успехе')} (beta)`} /></div>
          <ParzToggle className="chk" checked={o.celebrate} onChange={v => upd({ celebrate: v })} label={t('Вспышка на 100%')} />
          <div className="btns"><button onClick={() => setO({ ...O0, label: t('Загрузка') })}>{t('По умолчанию')}</button></div>
        </Sec>
        <Sec title={t('Цвета')}>
          <div className="clrs"><ColorField label={t('Акцент')} value={o.accent} onChange={v => upd({ accent: v })} /></div>
        </Sec>
      </aside>

      <section className="stage">
        <div className="tg-stages">{panel('dark')}{panel('light')}</div>
        <p className="logo-hint">{t('Меняйте значение — заливка перетекает к нему, а не прыгает. На 100% дорожка мягко вспыхивает.')}</p>
        <div className="code">
          <div className="code-h"><b>{t('Код')}</b><button onClick={copy}>{copied ? t('Скопировано') : t('Скопировать')}</button></div>
          <pre><code>{code}</code></pre>
        </div>
      </section>
    </div>
  );
}
