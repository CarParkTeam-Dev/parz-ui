import { useEffect, useMemo, useState } from 'react';
import { ParzNumberFlow, ParzProvider, ParzTabs, ParzToggle, ParzButton, type ParzMotionPreset } from '../lib';
import { Sec } from './App';
import { useT } from './i18n';

function Tabs<V extends string>({ label, value, options, onChange }: { label: string; value: V; options: [V, string][]; onChange: (v: V) => void }) {
  const t = useT();
  return <ParzTabs size="md" overflow="more" moreLabel={t('Ещё')} ariaLabel={label} value={value} onChange={onChange}
    options={options.map(([v, l]) => ({ value: v, label: l }))} />;
}

type Kind = 'counter' | 'price' | 'clock';
type O = { motion: ParzMotionPreset; kind: Kind; tabular: boolean; blur: boolean };
const O0: O = { motion: 'bouncy', kind: 'counter', tabular: true, blur: true };
const pad = (n: number) => String(n).padStart(2, '0');
const clock = () => { const d = new Date(); return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`; };

function codeFor(o: O) {
  const a: string[] = [];
  if (o.kind === 'clock') a.push(`value={time} // '14:05:09'`);
  else if (o.kind === 'price') a.push('value={price}', `locale='en-US'`, `formatOptions={{ style: 'currency', currency: 'USD' }}`);
  else a.push('value={count}');
  if (!o.tabular) a.push('tabular={false}');
  if (!o.blur) a.push('blur={0}');
  return [`import { ParzProvider, ParzNumberFlow } from '@carparkteam/parz-ui';`, `import '@carparkteam/parz-ui/style.css';`, ``,
    `<ParzProvider motion='${o.motion}'>`, `  <ParzNumberFlow\n    ${a.join('\n    ')}\n  />`, `</ParzProvider>`].join('\n');
}

export function NumberFlowEditor() {
  const t = useT();
  const [o, setO] = useState<O>(O0);
  const [count, setCount] = useState(128);
  const [price, setPrice] = useState(1249.9);
  const [time, setTime] = useState(clock);
  const [copied, setCopied] = useState(false);
  const upd = (p: Partial<O>) => setO(x => ({ ...x, ...p }));
  const code = useMemo(() => codeFor(o), [o]);
  const copy = async () => { try { await navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 1600); } catch { /* буфер недоступен */ } };
  useEffect(() => { if (o.kind !== 'clock') return; const id = window.setInterval(() => setTime(clock()), 1000); return () => window.clearInterval(id); }, [o.kind]);

  const rnd = () => (o.kind === 'price' ? setPrice(Math.round(Math.random() * 500000) / 100) : setCount(Math.round(Math.random() * 20000)));
  const add = (d: number) => (o.kind === 'price' ? setPrice(p => Math.max(0, Math.round((p + d * 10.5) * 100) / 100)) : setCount(c => c + d));
  const blur = o.blur ? 6 : 0;

  const flow = () => o.kind === 'clock' ? <ParzNumberFlow value={time} tabular={o.tabular} blur={blur} />
    : o.kind === 'price' ? <ParzNumberFlow value={price} locale="en-US" formatOptions={{ style: 'currency', currency: 'USD' }} tabular={o.tabular} blur={blur} />
    : <ParzNumberFlow value={count} tabular={o.tabular} blur={blur} />;
  const panel = (bg: 'dark' | 'light') => (
    <div className={`tg-stage tg-stage--${bg} nf-stage`}>
      <span className="tg-cap">{bg === 'dark' ? t('Тёмный фон') : t('Светлый фон')}</span>
      <div className="nf-big">{flow()}</div>
    </div>
  );

  return (
    <div className="ed">
      <aside className="ctl" aria-label={t('Настройки числа')}>
        <Sec title={t('Движение')}>
          <Tabs label={t('Движение')} value={o.motion} options={[['calm', 'Calm'], ['bouncy', 'Bouncy'], ['snappy', 'Snappy']]} onChange={x => upd({ motion: x })} />
        </Sec>
        <Sec title={t('Вид')}>
          <Tabs label={t('Пример')} value={o.kind} options={[['counter', t('Счётчик')], ['price', t('Цена')], ['clock', t('Часы')]]} onChange={x => upd({ kind: x })} />
          <ParzToggle className="chk" checked={o.tabular} onChange={x => upd({ tabular: x })} label={t('Цифры одной ширины')} />
          <ParzToggle className="chk" checked={o.blur} onChange={x => upd({ blur: x })} label={t('Размытие')} />
          {o.kind !== 'clock' && <div className="days-btns">
            <ParzButton size="sm" variant="soft" icon="ms:remove" ariaLabel={t('Меньше')} onClick={() => add(-1)} />
            <ParzButton size="sm" variant="soft" icon="ms:add" ariaLabel={t('Больше')} onClick={() => add(1)} />
            <ParzButton size="sm" variant="soft" icon="ms:casino" onClick={rnd}>{t('Случайное')}</ParzButton>
          </div>}
          <div className="days-btns"><ParzButton size="sm" variant="outline" icon="ms:restart_alt" onClick={() => { setO(O0); setCount(128); setPrice(1249.9); }}>{t('По умолчанию')}</ParzButton></div>
        </Sec>
      </aside>

      <section className="stage">
        <ParzProvider motion={o.motion}>
          <div className="tg-stages">{panel('dark')}{panel('light')}</div>
        </ParzProvider>
        <p className="logo-hint">{t('Меняется только тот знак, который стал другим: старый уезжает с размытием, новый въезжает на пружине. Число растёт — цифры едут вверх, уменьшается — вниз.')}</p>
        <div className="code">
          <div className="code-h"><b>{t('Код')}</b><button onClick={copy}>{copied ? t('Скопировано') : t('Скопировать')}</button></div>
          <pre><code>{code}</code></pre>
        </div>
      </section>
    </div>
  );
}
