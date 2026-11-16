import { useEffect, useMemo, useRef, useState } from 'react';
import { ParzButton, ParzToggle, type ParzButtonVariant, type ParzButtonSize, type ParzButtonShape } from '../lib';
import { Seg, ColorField, Sec } from './App';
import { useT } from './i18n';

type O = {
  label: string; variant: ParzButtonVariant; size: ParzButtonSize; shape: ParzButtonShape;
  icon: boolean; iconEnd: boolean; iconOnly: boolean; loading: boolean; disabled: boolean; full: boolean; ripple: boolean;
  accent: string; fg: string; customFg: boolean;
};
const O0: O = { label: 'Continue', variant: 'solid', size: 'md', shape: 'pill', icon: false, iconEnd: true, iconOnly: false, loading: false, disabled: false, full: false, ripple: true, accent: '#6ee7a0', fg: '#07140c', customFg: false };
const ICON = 'ms:bolt', ICON_END = 'ms:arrow_forward';

const q = (s: string) => `'${s.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
function codeFor(o: O) {
  const a: string[] = [];
  if (o.variant !== 'solid') a.push(`variant=${q(o.variant)}`);
  if (o.size !== 'md') a.push(`size=${q(o.size)}`);
  if (o.shape !== 'pill') a.push(`shape=${q(o.shape)}`);
  if (o.icon || o.iconOnly) a.push(`icon=${q(ICON)}`);
  if (o.iconEnd && !o.iconOnly) a.push(`iconEnd=${q(ICON_END)}`);
  if (o.iconOnly) { a.push('iconOnly'); a.push(`ariaLabel=${q(o.label || 'Button')}`); }
  if (o.loading) a.push('loading');
  if (o.disabled) a.push('disabled');
  if (o.full) a.push('fullWidth');
  if (!o.ripple) a.push('ripple={false}');
  if (o.accent !== O0.accent) a.push(`accent=${q(o.accent)}`);
  if (o.customFg) a.push(`textColor=${q(o.fg)}`);
  a.push('onClick={save}');
  const open = [`<ParzButton`, ...a.map(x => `  ${x}`)];
  const body = o.iconOnly ? [...open, `/>`] : [...open, `>`, `  ${o.label}`, `</ParzButton>`];
  return [`import { ParzButton } from '@carparkteam/parz-ui';`, `import '@carparkteam/parz-ui/style.css';`, ``, ...body].join('\n');
}

/* демо «нажми → загрузка 1,5 с → готово» */
function SaveDemo({ accent, size, shape }: { accent: string; size: ParzButtonSize; shape: ParzButtonShape }) {
  const t = useT();
  const [st, setSt] = useState<'idle' | 'busy' | 'done'>('idle');
  const tm = useRef(0);
  useEffect(() => () => window.clearTimeout(tm.current), []);
  const go = () => {
    setSt('busy');
    tm.current = window.setTimeout(() => { setSt('done'); tm.current = window.setTimeout(() => setSt('idle'), 1600); }, 1500);
  };
  return (
    <ParzButton variant="soft" accent={accent} size={size} shape={shape} loading={st === 'busy'} loadingText={t('Сохраняем')}
      icon={st === 'done' ? 'ms:check' : 'ms:cloud_upload'} onClick={st === 'idle' ? go : undefined}>
      {st === 'done' ? t('Готово') : t('Сохранить')}
    </ParzButton>
  );
}

export function ButtonEditor() {
  const t = useT();
  const [o, setO] = useState<O>(O0);
  const [copied, setCopied] = useState(false);
  const upd = (p: Partial<O>) => setO(x => ({ ...x, ...p }));
  const code = useMemo(() => codeFor(o), [o]);
  const copy = async () => { try { await navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 1600); } catch { /* буфер недоступен */ } };

  const panel = (bg: 'dark' | 'light') => {
    const c = { accent: o.accent, size: o.size, shape: o.shape, ripple: o.ripple };
    const variant = bg === 'light' && o.variant === 'glass' ? 'soft' : o.variant;
    return (
      <div className={`tg-stage tg-stage--${bg} bt-stage`}>
        <span className="tg-cap">{bg === 'dark' ? t('Тёмный фон') : t('Светлый фон')}</span>
        <div className={`bt-main${o.full ? ' is-full' : ''}`}>
          <ParzButton {...c} variant={variant} textColor={o.customFg ? o.fg : undefined}
            icon={o.icon || o.iconOnly ? ICON : undefined} iconEnd={o.iconEnd ? ICON_END : undefined} iconOnly={o.iconOnly}
            ariaLabel={o.iconOnly ? o.label || 'Button' : undefined} loading={o.loading} disabled={o.disabled} fullWidth={o.full}>
            {o.label}
          </ParzButton>
        </div>
        <div className="bt-row">
          {(['solid', 'soft', 'outline', 'ghost'] as const).map(v => <ParzButton key={v} {...c} variant={v}>{v[0].toUpperCase() + v.slice(1)}</ParzButton>)}
          {bg === 'dark' && <ParzButton {...c} variant="glass">Glass</ParzButton>}
        </div>
        <div className="bt-row">
          <SaveDemo accent={o.accent} size={o.size} shape={o.shape} />
          <ParzButton {...c} variant="outline" icon="ms:favorite" iconOnly ariaLabel={t('В избранное')} />
          <ParzButton {...c} variant="ghost" disabled>{t('Недоступно')}</ParzButton>
        </div>
      </div>
    );
  };

  return (
    <div className="ed">
      <aside className="ctl" aria-label={t('Настройки кнопки')}>
        <Sec title={t('Подпись')}>
          <label className="row"><span>{o.iconOnly ? t('Подпись для экранного диктора') : t('Текст кнопки')}</span><input className="txt" value={o.label} maxLength={40} onChange={e => upd({ label: e.target.value })} /></label>
        </Sec>
        <Sec title={t('Вид')}>
          <div className="row"><span>{t('Вариант')}</span><Seg label={t('Вариант')} value={o.variant} options={[['solid', 'Solid'], ['soft', 'Soft'], ['outline', 'Outline'], ['ghost', 'Ghost'], ['glass', 'Glass']]} onChange={v => upd({ variant: v })} /></div>
          <div className="row"><span>{t('Размер')}</span><Seg label={t('Размер')} value={o.size} options={[['sm', 'S'], ['md', 'M'], ['lg', 'L']]} onChange={v => upd({ size: v })} /></div>
          <div className="row"><span>{t('Форма')}</span><Seg label={t('Форма')} value={o.shape} options={[['pill', t('Капсула')], ['rounded', t('Скруглённая')], ['square', t('Квадратная')]]} onChange={v => upd({ shape: v })} /></div>
        </Sec>
        <Sec title={t('Иконки')}>
          <ParzToggle className="chk" checked={o.icon} onChange={v => upd({ icon: v })} disabled={o.iconOnly} label={t('Иконка слева')} />
          <ParzToggle className="chk" checked={o.iconEnd} onChange={v => upd({ iconEnd: v })} disabled={o.iconOnly} label={t('Иконка справа')} />
          <ParzToggle className="chk" checked={o.iconOnly} onChange={v => upd({ iconOnly: v })} label={t('Только иконка')} />
        </Sec>
        <Sec title={t('Состояние и поведение')}>
          <ParzToggle className="chk" checked={o.loading} onChange={v => upd({ loading: v })} label={t('Загрузка')} />
          <ParzToggle className="chk" checked={o.disabled} onChange={v => upd({ disabled: v })} label={t('Отключена')} />
          <ParzToggle className="chk" checked={o.full} onChange={v => upd({ full: v })} label={t('На всю ширину')} />
          <ParzToggle className="chk" checked={o.ripple} onChange={v => upd({ ripple: v })} label={t('Капля при нажатии')} />
          <div className="btns"><button onClick={() => setO(O0)}>{t('По умолчанию')}</button></div>
        </Sec>
        <Sec title={t('Цвета')}>
          <div className="clrs">
            <ColorField label={t('Акцент')} value={o.accent} onChange={v => upd({ accent: v })} />
            <ColorField label={t('Текст')} value={o.fg} onChange={v => upd({ fg: v, customFg: true })} />
          </div>
          {o.customFg && <div className="btns"><button onClick={() => upd({ customFg: false, fg: O0.fg })}>{t('Цвет текста по умолчанию')}</button></div>}
        </Sec>
      </aside>

      <section className="stage">
        <div className="tg-stages">{panel('dark')}{panel('light')}</div>
        <p className="logo-hint">{t('Нажмите кнопку — она поджимается, а из точки нажатия растекается капля. Работают Tab, Enter и Пробел.')}</p>
        <div className="code">
          <div className="code-h"><b>{t('Код')}</b><button onClick={copy}>{copied ? t('Скопировано') : t('Скопировать')}</button></div>
          <pre><code>{code}</code></pre>
        </div>
      </section>
    </div>
  );
}
