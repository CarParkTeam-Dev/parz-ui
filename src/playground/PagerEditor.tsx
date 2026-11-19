import { useMemo, useState } from 'react';
import { ParzPager, ParzProvider, ParzTabs, ParzToggle, ParzButton, ParzRuler, Icon, type ParzMotionPreset, type ParzPagerEffect } from '../lib';
import { Sec } from './App';
import { useT } from './i18n';

function Tabs<V extends string>({ label, value, options, onChange }: { label: string; value: V; options: [V, string][]; onChange: (v: V) => void }) {
  const t = useT();
  return <ParzTabs size="md" overflow="more" moreLabel={t('Ещё')} ariaLabel={label} value={value} onChange={onChange}
    options={options.map(([v, l]) => ({ value: v, label: l }))} />;
}

const SLIDES = [
  { a: '#7a5cff', b: '#3b1d8f', icon: 'ms:swipe', k: 'Свайп', s: 'Страница едет ровно за пальцем' },
  { a: '#13c2c2', b: '#0a4f6b', icon: 'ms:speed', k: 'Инерция', s: 'Бросок — на соседнюю страницу' },
  { a: '#f07a2a', b: '#8a2a12', icon: 'ms:waves', k: 'Пружина', s: 'Встаёт на место по пресету' },
  { a: '#d64fc8', b: '#5a1a6e', icon: 'ms:mouse', k: 'Колесо', s: 'Тачпад и колесо — по странице' },
  { a: '#34d27b', b: '#0d5a3a', icon: 'ms:keyboard', k: 'Клавиатура', s: 'Стрелки, Home и End' }
];
type O = { motion: ParzMotionPreset; effect: ParzPagerEffect; width: 'full' | '360' | '480'; peek: '0' | '24' | '48'; gap: '0' | '12' | '24'; dots: boolean; arrows: boolean; loop: boolean; autoplay: boolean; timer: number; wheel: boolean };
const O0: O = { motion: 'bouncy', effect: 'scale', width: '360', peek: '24', gap: '12', dots: true, arrows: true, loop: false, autoplay: false, timer: 3, wheel: true };

function codeFor(o: O) {
  const a = ['index={index}', 'onIndexChange={setIndex}'];
  if (o.effect !== 'slide') a.push(`effect='${o.effect}'`);
  if (o.width !== 'full') a.push(`pageWidth={${o.width}}`);
  if (o.peek !== '0') a.push(`peek={${o.peek}}`);
  if (o.gap !== '12') a.push(`gap={${o.gap}}`);
  if (o.dots) a.push('dots');
  if (o.arrows) a.push('arrows');
  if (o.loop) a.push('loop');
  if (o.autoplay) a.push(`autoplay={${o.timer * 1000}}`);
  if (!o.wheel) a.push('wheel={false}');
  return [`import { useState } from 'react';`, `import { ParzProvider, ParzPager } from '@carparkteam/parz-ui';`, `import '@carparkteam/parz-ui/style.css';`, ``,
    `const [index, setIndex] = useState(0);`, ``, `<ParzProvider motion='${o.motion}'>`, `  <ParzPager\n    ${a.join('\n    ')}\n  >`, `    <Card1 />`, `    <Card2 />`, `    <Card3 />`, `  </ParzPager>`, `</ParzProvider>`].join('\n');
}

function Panel({ bg, o, index, setIndex, paused }: { bg: 'dark' | 'light'; o: O; index: number; setIndex: (i: number) => void; paused: boolean }) {
  const t = useT();
  return (
    <div className={`tg-stage tg-stage--${bg} pg-stage`}>
      <span className="tg-cap">{bg === 'dark' ? t('Тёмный фон') : t('Светлый фон')}</span>
      <ParzPager theme={bg} index={index} onIndexChange={setIndex} effect={o.effect} pageWidth={o.width === 'full' ? undefined : +o.width} peek={+o.peek} gap={+o.gap} dots={o.dots} arrows={o.arrows}
        loop={o.loop} autoplay={o.autoplay ? o.timer * 1000 : undefined} paused={paused} wheel={o.wheel} ariaLabel={t('Слайды')} labels={{ prev: t('Назад'), next: t('Вперёд'), page: t('Страница {n}') }}>
        {SLIDES.map((s, i) => (
          <article key={i} className="pgr-card" style={{ background: `radial-gradient(120% 90% at 0% 0%, ${s.a}, ${s.b})`, boxShadow: `0 18px 36px -18px ${s.b}, 0 4px 10px -4px rgba(0,0,0,.35)` }}>
            <span className="pgr-card-ic"><Icon icon={s.icon} /></span>
            <span className="pgr-card-n">0{i + 1}</span>
            <b>{t(s.k)}</b>
            <small>{t(s.s)}</small>
          </article>
        ))}
      </ParzPager>
    </div>
  );
}

export function PagerEditor() {
  const t = useT();
  const [o, setO] = useState<O>(O0);
  const [index, setIndex] = useState(0);
  // обе ленты делят страницу — наведение на любую ставит на паузу обе
  const [paused, setPaused] = useState(false);
  const [copied, setCopied] = useState(false);
  const upd = (p: Partial<O>) => setO(x => ({ ...x, ...p }));
  const code = useMemo(() => codeFor(o), [o]);
  const copy = async () => { try { await navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 1600); } catch { /* буфер недоступен */ } };

  return (
    <div className="ed">
      <aside className="ctl" aria-label={t('Настройки страниц')}>
        <Sec title={t('Движение')}>
          <Tabs label={t('Движение')} value={o.motion} options={[['calm', 'Calm'], ['bouncy', 'Bouncy'], ['snappy', 'Snappy']]} onChange={x => upd({ motion: x })} />
        </Sec>
        <Sec title={t('Вид')}>
          <div className="rl-group">
            <div className="rl-f"><span>{t('Эффект')}</span>
              <Tabs label={t('Эффект')} value={o.effect} options={[['slide', t('Сдвиг')], ['scale', t('Масштаб')], ['tilt', t('Наклон')], ['fade', t('Растворение')]]} onChange={x => upd({ effect: x })} />
            </div>
            <div className="rl-f"><span>{t('Ширина страницы')}</span>
              <Tabs label={t('Ширина страницы')} value={o.width} options={[['full', t('Вся')], ['360', '360 px'], ['480', '480 px']]} onChange={x => upd({ width: x })} />
            </div>
            <div className="rl-f"><span>{t('Видно соседей')}</span>
              <Tabs label={t('Видно соседей')} value={o.peek} options={[['0', '0 px'], ['24', '24 px'], ['48', '48 px']]} onChange={x => upd({ peek: x })} />
            </div>
            <div className="rl-f"><span>{t('Промежуток')}</span>
              <Tabs label={t('Промежуток')} value={o.gap} options={[['0', '0 px'], ['12', '12 px'], ['24', '24 px']]} onChange={x => upd({ gap: x })} />
            </div>
            <ParzToggle className="chk" checked={o.dots} onChange={x => upd({ dots: x })} label={t('Точки')} />
            <ParzToggle className="chk" checked={o.arrows} onChange={x => upd({ arrows: x })} label={t('Стрелки')} />
            <ParzToggle className="chk" checked={o.loop} onChange={x => upd({ loop: x })} label={t('По кругу')} />
            <ParzToggle className="chk" checked={o.autoplay} onChange={x => upd({ autoplay: x })} label={t('Листать само')} />
            <div className="rl-f"><span>{o.loop ? t('Каждые — бесконечно вперёд') : t('Каждые — до последней')}</span>
              <ParzRuler className="rl-mini" value={o.timer} onChange={x => upd({ timer: x })} min={0} max={10} step={1} exclude={[0]} tickGap={24}
                formatValue={x => `${x} ${t('с')}`} ariaLabel={t('Таймер')} disabled={!o.autoplay} />
            </div>
            <ParzToggle className="chk" checked={o.wheel} onChange={x => upd({ wheel: x })} label={t('Колесо и тачпад')} />
            <div className="days-btns"><ParzButton size="sm" variant="outline" icon="ms:restart_alt" onClick={() => { setO(O0); setIndex(0); }}>{t('По умолчанию')}</ParzButton></div>
          </div>
        </Sec>
      </aside>

      <section className="stage">
        <ParzProvider motion={o.motion}>
          <div className="tg-stages" onPointerEnter={() => setPaused(true)} onPointerLeave={() => setPaused(false)}>
            <Panel bg="dark" o={o} index={index} setIndex={setIndex} paused={paused} />
            <Panel bg="light" o={o} index={index} setIndex={setIndex} paused={paused} />
          </div>
        </ParzProvider>
        <p className="logo-hint days-api">onIndexChange → <code>{index}</code></p>
        <p className="logo-hint">{t('Листайте пальцем или мышью: страница едет ровно за пальцем, после броска встаёт на соседнюю пружиной, за краем тянется с сопротивлением. Точки тянутся каплей в том же кадре.')}</p>
        <div className="code">
          <div className="code-h"><b>{t('Код')}</b><button onClick={copy}>{copied ? t('Скопировано') : t('Скопировать')}</button></div>
          <pre><code>{code}</code></pre>
        </div>
      </section>
    </div>
  );
}
