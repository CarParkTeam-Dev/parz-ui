import { useMemo, useState } from 'react';
import { ParzBadge, ParzButton, ParzToggle, type ParzBadgeVariant, type ParzBadgeSize, type ParzBadgePlacement } from '../lib';
import { Seg, ColorField, Sec } from './App';
import { useT } from './i18n';

type Mode = 'label' | 'count' | 'dot';
type O = {
  mode: Mode; label: string; count: number; max: number; icon: boolean; pulse: boolean; attach: boolean;
  variant: ParzBadgeVariant; size: ParzBadgeSize; placement: ParzBadgePlacement; color: string;
};
const O0: O = { mode: 'count', label: 'New', count: 3, max: 99, icon: false, pulse: false, attach: true, variant: 'solid', size: 'md', placement: 'top-end', color: '#ff4d5e' };
const ICON = 'ms:bolt';

const q = (s: string) => `'${s.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
function codeFor(o: O) {
  const a: string[] = [];
  if (o.mode === 'label') a.push(`label=${q(o.label)}`);
  if (o.mode === 'count') a.push('count={unread}');
  if (o.mode === 'count' && o.max !== 99) a.push(`max={${o.max}}`);
  if (o.mode === 'dot') a.push('dot');
  if (o.icon && o.mode === 'label') a.push(`icon=${q(ICON)}`);
  if (o.pulse) a.push('pulse');
  if (o.variant !== 'solid') a.push(`variant=${q(o.variant)}`);
  if (o.size !== 'md') a.push(`size=${q(o.size)}`);
  if (o.color !== O0.color) a.push(`color=${q(o.color)}`);
  if (o.attach && o.placement !== 'top-end') a.push(`placement=${q(o.placement)}`);
  if (o.mode !== 'label') a.push(`ariaLabel=${q(o.mode === 'dot' ? 'Online' : 'New messages')}`);
  const head = [`import { ParzBadge } from '@carparkteam/parz-ui';`, `import '@carparkteam/parz-ui/style.css';`, ``];
  if (!o.attach) return [...head, `<ParzBadge`, ...a.map(x => `  ${x}`), `/>`].join('\n');
  return [...head, `<ParzBadge`, ...a.map(x => `  ${x}`), `>`, `  <ParzButton icon="ms:notifications" iconOnly ariaLabel="Notifications" />`, `</ParzBadge>`].join('\n');
}

export function BadgeEditor() {
  const t = useT();
  const [o, setO] = useState<O>(() => ({ ...O0, label: t('Новое') }));
  const [copied, setCopied] = useState(false);
  const upd = (p: Partial<O>) => setO(x => ({ ...x, ...p }));
  const code = useMemo(() => codeFor(o), [o]);
  const copy = async () => { try { await navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 1600); } catch { /* буфер недоступен */ } };

  const panel = (bg: 'dark' | 'light') => {
    const c = { variant: o.variant, size: o.size, color: o.color };
    const main = (
      <ParzBadge {...c} pulse={o.pulse} placement={o.placement}
        label={o.mode === 'label' ? o.label : undefined} count={o.mode === 'count' ? o.count : undefined} max={o.max} dot={o.mode === 'dot'}
        icon={o.icon && o.mode === 'label' ? ICON : undefined}
        ariaLabel={o.mode === 'count' ? t('Новых сообщений: {n}', { n: o.count }) : o.mode === 'dot' ? t('В сети') : undefined}>
        {o.attach ? <ParzButton variant={bg === 'dark' ? 'glass' : 'soft'} accent="#8b8b96" icon="ms:notifications" iconOnly ariaLabel={t('Уведомления')} /> : undefined}
      </ParzBadge>
    );
    return (
      <div className={`tg-stage tg-stage--${bg} bd-stage`}>
        <span className="tg-cap">{bg === 'dark' ? t('Тёмный фон') : t('Светлый фон')}</span>
        <div className="bd-main">{main}</div>
        <div className="bd-row">
          <ParzBadge {...c} label={t('Новое')} />
          <ParzBadge {...c} label="Beta" color="#7aa7ff" />
          <ParzBadge {...c} icon="ms:check" label={t('Готово')} color="#38c172" />
          <ParzBadge {...c} count={12} />
          <ParzBadge {...c} count={128} />
          <ParzBadge {...c} dot pulse color="#38c172" ariaLabel={t('В сети')} />
        </div>
      </div>
    );
  };

  return (
    <div className="ed">
      <aside className="ctl" aria-label={t('Настройки бейджа')}>
        <Sec title={t('Что показывать')}>
          <Seg label={t('Что показывать')} value={o.mode} options={[['label', t('Текст')], ['count', t('Число')], ['dot', t('Точка')]]} onChange={v => upd({ mode: v })} />
          {o.mode === 'label' && <label className="row"><span>{t('Текст')}</span><input className="txt" value={o.label} maxLength={24} onChange={e => upd({ label: e.target.value })} /></label>}
          {o.mode === 'label' && <ParzToggle className="chk" checked={o.icon} onChange={v => upd({ icon: v })} label={t('Иконка')} />}
          {o.mode === 'count' && (
            <>
              <div className="btns">
                <button onClick={() => upd({ count: Math.max(0, o.count - 1) })}>−1</button>
                <button onClick={() => upd({ count: o.count + 1 })}>+1</button>
                <button onClick={() => upd({ count: o.count + 10 })}>+10</button>
                <button onClick={() => upd({ count: 0 })}>{t('Прочитано')}</button>
              </div>
              <div className="row"><span>{t('Максимум')}</span><Seg label={t('Максимум')} value={String(o.max) as '9' | '99' | '999'} options={[['9', '9+'], ['99', '99+'], ['999', '999+']]} onChange={v => upd({ max: Number(v) })} /></div>
            </>
          )}
          <ParzToggle className="chk" checked={o.pulse} onChange={v => upd({ pulse: v })} label={t('Пульс')} />
        </Sec>
        <Sec title={t('Вид')}>
          <div className="row"><span>{t('Вариант')}</span><Seg label={t('Вариант')} value={o.variant} options={[['solid', 'Solid'], ['soft', 'Soft'], ['outline', 'Outline'], ['glass', 'Glass']]} onChange={v => upd({ variant: v })} /></div>
          <div className="row"><span>{t('Размер')}</span><Seg label={t('Размер')} value={o.size} options={[['sm', 'S'], ['md', 'M'], ['lg', 'L']]} onChange={v => upd({ size: v })} /></div>
          <ParzToggle className="chk" checked={o.attach} onChange={v => upd({ attach: v })} label={t('На кнопке')} />
          {o.attach && <div className="row"><span>{t('Угол')}</span><Seg label={t('Угол')} value={o.placement} options={[['top-end', '↗'], ['top-start', '↖'], ['bottom-end', '↘'], ['bottom-start', '↙']]} onChange={v => upd({ placement: v })} /></div>}
          <div className="btns"><button onClick={() => setO({ ...O0, label: t('Новое') })}>{t('По умолчанию')}</button></div>
        </Sec>
        <Sec title={t('Цвета')}>
          <div className="clrs"><ColorField label={t('Цвет')} value={o.color} onChange={v => upd({ color: v })} /></div>
        </Sec>
      </aside>

      <section className="stage">
        <div className="tg-stages">{panel('dark')}{panel('light')}</div>
        <p className="logo-hint">{t('Меняйте число кнопками +1 и −1 — цифры перекатываются, а ширина перетекает. «Прочитано» — бейдж стягивается и исчезает.')}</p>
        <div className="code">
          <div className="code-h"><b>{t('Код')}</b><button onClick={copy}>{copied ? t('Скопировано') : t('Скопировать')}</button></div>
          <pre><code>{code}</code></pre>
        </div>
      </section>
    </div>
  );
}
