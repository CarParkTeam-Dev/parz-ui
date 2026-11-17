import { useMemo, useState } from 'react';
import { ParzColorPicker, ParzProvider, ParzTabs, ParzToggle, ParzButton, type ParzMotionPreset, type ParzColorFormat } from '../lib';
import { Sec } from './App';
import { useT } from './i18n';

/* настройки — на ParzTabs: пункты своей ширины, а что не помещается — в группу «•••» */
function Tabs<V extends string>({ label, value, options, onChange }: { label: string; value: V; options: [V, string][]; onChange: (v: V) => void }) {
  const t = useT();
  return <ParzTabs size="md" overflow="more" moreLabel={t('Ещё')} ariaLabel={label} value={value} onChange={onChange}
    options={options.map(([v, l]) => ({ value: v, label: l }))} />;
}

type O = { motion: ParzMotionPreset; mode: 'inline' | 'popover'; format: ParzColorFormat; alpha: boolean; input: boolean; swatches: boolean; dropper: boolean; disabled: boolean };
const O0: O = { motion: 'bouncy', mode: 'inline', format: 'hex', alpha: true, input: true, swatches: true, dropper: true, disabled: false };

function codeFor(o: O, label: string) {
  const a: string[] = ['value={color}', 'onChange={setColor}'];
  if (o.mode === 'popover') a.push(`mode='popover'`, `label='${label}'`);
  if (o.format !== 'hex') a.push(`format='${o.format}'`);
  if (!o.alpha) a.push('alpha={false}');
  if (!o.input) a.push('showInput={false}');
  if (!o.swatches) a.push('swatches={[]}');
  if (!o.dropper) a.push('eyeDropper={false}');
  if (o.disabled) a.push('disabled');
  return [`import { useState } from 'react';`, `import { ParzProvider, ParzColorPicker } from '@carparkteam/parz-ui';`, `import '@carparkteam/parz-ui/style.css';`, ``,
    `const [color, setColor] = useState('#7a5cff');`, ``,
    `<ParzProvider motion='${o.motion}'>`, `  <ParzColorPicker\n    ${a.join('\n    ')}\n  />`, `</ParzProvider>`].join('\n');
}

export function ColorEditor() {
  const t = useT();
  const [o, setO] = useState<O>(O0);
  const [color, setColor] = useState('#7a5cff');
  const [copied, setCopied] = useState(false);
  const upd = (p: Partial<O>) => setO(x => ({ ...x, ...p }));
  const code = useMemo(() => codeFor(o, t('Цвет')), [o, t]);
  const copy = async () => { try { await navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 1600); } catch { /* буфер недоступен */ } };
  const labels = { area: t('Насыщенность и яркость'), hue: t('Оттенок'), alpha: t('Прозрачность'), eyeDropper: t('Взять цвет с экрана'), input: t('Значение цвета'), swatch: t('Цвет {c}'), open: t('Выбрать цвет') };

  const panel = (bg: 'dark' | 'light') => (
    <div className={`tg-stage tg-stage--${bg} cp-stage`}>
      <span className="tg-cap">{bg === 'dark' ? t('Тёмный фон') : t('Светлый фон')}</span>
      <ParzColorPicker theme={bg} value={color} onChange={v => setColor(v)} mode={o.mode} label={t('Цвет')} format={o.format} onFormatChange={f => upd({ format: f })}
        alpha={o.alpha} showInput={o.input} swatches={o.swatches ? undefined : []} eyeDropper={o.dropper} disabled={o.disabled} labels={labels} ariaLabel={t('Цвет')} />
    </div>
  );

  return (
    <div className="ed">
      <aside className="ctl" aria-label={t('Настройки выбора цвета')}>
        <Sec title={t('Движение')}>
          <Tabs label={t('Движение')} value={o.motion} options={[['calm', 'Calm'], ['bouncy', 'Bouncy'], ['snappy', 'Snappy']]} onChange={x => upd({ motion: x })} />
        </Sec>
        <Sec title={t('Вид')}>
          <div className="cp-segs">
            <Tabs label={t('Где показывать')} value={o.mode} options={[['inline', t('На странице')], ['popover', t('Во всплывающем окне')]]} onChange={x => upd({ mode: x })} />
            <Tabs label={t('Формат')} value={o.format} options={[['hex', 'HEX'], ['rgb', 'RGB'], ['hsl', 'HSL']]} onChange={x => upd({ format: x })} />
          </div>
          <ParzToggle className="chk" checked={o.alpha} onChange={x => upd({ alpha: x })} label={t('Прозрачность')} />
          <ParzToggle className="chk" checked={o.input} onChange={x => upd({ input: x })} label={t('Поле ввода')} />
          <ParzToggle className="chk" checked={o.swatches} onChange={x => upd({ swatches: x })} label={t('Готовые цвета')} />
          <ParzToggle className="chk" checked={o.dropper} onChange={x => upd({ dropper: x })} label={t('Пипетка')} />
          <ParzToggle className="chk" checked={o.disabled} onChange={x => upd({ disabled: x })} label={t('Отключён')} />
          <div className="days-btns"><ParzButton size="sm" variant="outline" icon="ms:restart_alt" onClick={() => { setO(O0); setColor('#7a5cff'); }}>{t('По умолчанию')}</ParzButton></div>
        </Sec>
      </aside>

      <section className="stage">
        <ParzProvider motion={o.motion}>
          <div className="tg-stages">{panel('dark')}{panel('light')}</div>
        </ParzProvider>
        <p className="logo-hint days-api">onChange → <code>{color}</code></p>
        <p className="logo-hint">{t('Тяните бегунок быстрее — он вытягивается по движению. Нажмите в другое место поля — бегунок перелетит туда пружиной. Цвет можно вписать в HEX, RGB или HSL.')}</p>
        <div className="code">
          <div className="code-h"><b>{t('Код')}</b><button onClick={copy}>{copied ? t('Скопировано') : t('Скопировать')}</button></div>
          <pre><code>{code}</code></pre>
        </div>
      </section>
    </div>
  );
}
