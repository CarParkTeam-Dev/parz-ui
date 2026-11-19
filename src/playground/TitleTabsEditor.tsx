import { useMemo, useRef, useState, type ReactNode } from 'react';
import { ParzTitleTabs, ParzPager, ParzProvider, ParzTabs, ParzToggle, ParzButton, ParzProgress, ParzNumberFlow, ParzRuler,
  type ParzMotionPreset, type ParzTitleTabsHandle, type ParzTitleTabsItem, type ParzPagerHandle } from '../lib';
import { Sec } from './App';
import { hhmm } from './RulerEditor';
import { useT } from './i18n';

function Tabs<V extends string>({ label, value, options, onChange }: { label: string; value: V; options: [V, string][]; onChange: (v: V) => void }) {
  const t = useT();
  return <ParzTabs size="md" overflow="more" moreLabel={t('Ещё')} ariaLabel={label} value={value} onChange={onChange}
    options={options.map(([v, l]) => ({ value: v, label: l }))} />;
}

/* страницы — что угодно: здесь задачи и наши же компоненты */
type Kind = 'tasks' | 'stats' | 'settings' | 'time';
type List = { id: number; label: string; icon: string; color: string; iconColor?: string; kind: Kind; tasks: string[] };
const START: List[] = [
  { id: 1, label: 'Today', icon: 'ms:star', color: '#e8b923', iconColor: '#2a2205', kind: 'tasks', tasks: ['Release alpha', 'Results'] },
  { id: 2, label: 'Stats', icon: 'ms:bar_chart', color: '#4d9bff', kind: 'stats', tasks: [] },
  { id: 3, label: 'Settings', icon: 'ms:tune', color: '#34d27b', iconColor: '#062a14', kind: 'settings', tasks: [] },
  { id: 4, label: 'Alarm', icon: 'ms:alarm', color: '#f07a2a', kind: 'time', tasks: [] }
];
const MORE_COLORS = ['#d64fc8', '#13c2c2', '#ff453a', '#7a5cff'];

type O = { motion: ParzMotionPreset; size: 'lg' | 'md'; icons: boolean; counts: boolean; add: boolean; pager: boolean; list: boolean; reorder: boolean; more: boolean };
const O0: O = { motion: 'bouncy', size: 'lg', icons: true, counts: true, add: true, pager: true, list: true, reorder: true, more: true };

function codeFor(o: O) {
  const a = ['ref={tabs}', 'items={lists}', 'onProgress={p => pager.current?.setProgress(p)}', 'index={index}', 'onIndexChange={setIndex}', 'accentRef={page}'];
  if (o.size !== 'lg') a.push(`size='${o.size}'`);
  if (o.add) a.push('onAdd={addList}');
  if (!o.list) a.push('list={false}');
  if (o.list && o.reorder) a.push('onReorder={(from, to) => moveList(from, to)}');
  if (o.list && o.more) a.push('onItemMore={(i, anchor) => openMenu(i, anchor)}');
  const lines = [`import { useRef, useState } from 'react';`, `import { ParzProvider, ParzTitleTabs, ParzPager, ParzProgress, type ParzTitleTabsHandle, type ParzPagerHandle } from '@carparkteam/parz-ui';`, `import '@carparkteam/parz-ui/style.css';`, ``,
    `const lists = [`, `  { label: 'Today', count: 2, icon: 'ms:star', color: '#e8b923' },`, `  { label: 'Stats', icon: 'ms:bar_chart', color: '#4d9bff' },`, `];`,
    `const tabs = useRef<ParzTitleTabsHandle>(null);`, `const pager = useRef<ParzPagerHandle>(null);`, `const page = useRef<HTMLDivElement>(null);`, `const [index, setIndex] = useState(0);`, ``,
    `<ParzProvider motion='${o.motion}'>`, `  {/* список накрывает этот блок; здесь же доступен var(--parz-accent) */}`, `  <div ref={page} style={{ position: 'relative' }}>`, `    <ParzTitleTabs\n      ${a.join('\n      ')}\n    />`];
  if (o.pager) lines.push(`    <ParzPager`, `      ref={pager}`, `      index={index}`, `      onIndexChange={setIndex}`, `      onProgress={p => tabs.current?.setProgress(p)}`, ...(o.add ? [`      onRelease={p => tabs.current?.release(p)}`] : []), `    >`, `      <TaskList />                {/* любые элементы и компоненты */}`, `      <ParzProgress value={72} />`, `    </ParzPager>`);
  lines.push(`  </div>`, `</ParzProvider>`);
  return lines.join('\n');
}

function Page({ l, bg }: { l: List; bg: 'dark' | 'light' }) {
  const t = useT();
  const [n, setN] = useState(1280);
  const [on, setOn] = useState([true, false, true]);
  const [time, setTime] = useState(430);
  let body: ReactNode;
  if (l.kind === 'stats') body = <>
    <div className="tt-stat"><ParzNumberFlow value={n} /><ParzButton size="sm" variant="soft" icon="ms:add" ariaLabel={t('Больше')} onClick={() => setN(x => x + Math.round(Math.random() * 400))} /></div>
    <ParzProgress value={72} label={t('Загрузка')} size="sm" accent={l.color} />
    <ParzProgress value={38} label={t('Синхронизация')} size="sm" accent={l.color} />
  </>;
  else if (l.kind === 'settings') body = [t('Уведомления'), t('Звук'), t('Тёмная тема')].map((x, i) => (
    <ParzToggle key={x} className="tt-tg" checked={on[i]} onChange={v => setOn(a => a.map((y, j) => (j === i ? v : y)))} label={x} accent={l.color} />
  ));
  else if (l.kind === 'time') body = <ParzRuler theme={bg} value={time} onChange={setTime} min={0} max={1430} step={10} formatValue={hhmm} accent={l.color} ariaLabel={t('Время')} className="tt-ruler" />;
  else body = <>
    {l.tasks.map(x => <div key={x} className="tt-task"><i />{x}</div>)}
    <div className="tt-task tt-new"><b><svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true"><path d="M5 1.5v7M1.5 5h7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg></b>{t('Новая задача')}</div>
  </>;
  return <div className="tt-card"><div className="tt-card-h"><span>{l.label}</span></div>{body}</div>;
}

function Panel({ bg, o, lists, index, setIndex, onAdd, onReorder, onMore }: {
  bg: 'dark' | 'light'; o: O; lists: List[]; index: number; setIndex: (i: number) => void; onAdd: () => void; onReorder: (f: number, to: number) => void; onMore: (i: number) => void;
}) {
  const t = useT();
  const tabs = useRef<ParzTitleTabsHandle>(null);
  const pager = useRef<ParzPagerHandle>(null);
  const page = useRef<HTMLDivElement>(null);
  const items: ParzTitleTabsItem[] = lists.map(l => ({ label: l.label, count: o.counts && l.kind === 'tasks' ? l.tasks.length : undefined, icon: o.icons ? l.icon : undefined, color: l.color, iconColor: l.iconColor }));
  return (
    <div className={`tg-stage tg-stage--${bg} tt-stage`} ref={page}>
      <span className="tg-cap">{bg === 'dark' ? t('Тёмный фон') : t('Светлый фон')}</span>
      <ParzTitleTabs ref={tabs} onProgress={p => pager.current?.setProgress(p)} theme={bg} size={o.size} items={items} index={index} onIndexChange={setIndex} accentRef={page}
        onAdd={o.add ? onAdd : undefined} addLabel={t('Добавить')} ariaLabel={t('Списки')}
        list={o.list} onReorder={o.reorder ? onReorder : undefined} onItemMore={o.more ? i => onMore(i) : undefined}
        labels={{ new: t('Новый'), reorder: t('Порядок'), done: t('Готово'), more: t('Ещё'), list: t('Все списки') }} />
      {o.pager && (
        <ParzPager ref={pager} theme={bg} index={index} onIndexChange={setIndex} onProgress={p => tabs.current?.setProgress(p)} onRelease={o.add ? p => tabs.current?.release(p) : undefined} ariaLabel={t('Списки')}>
          {lists.map(l => <Page key={l.id} l={l} bg={bg} />)}
        </ParzPager>
      )}
    </div>
  );
}

export function TitleTabsEditor() {
  const t = useT();
  const [o, setO] = useState<O>(O0);
  const [lists, setLists] = useState<List[]>(START);
  const [index, setIndex] = useState(0);
  const [last, setLast] = useState('');
  const [copied, setCopied] = useState(false);
  const upd = (p: Partial<O>) => setO(x => ({ ...x, ...p }));
  const code = useMemo(() => codeFor(o), [o]);
  const copy = async () => { try { await navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 1600); } catch { /* буфер недоступен */ } };
  const addList = () => {
    setLists(ls => {
      const k = Math.max(...ls.map(l => l.id)) + 1;
      return [{ id: k, label: `${t('Список')} ${k - START.length}`, icon: 'ms:folder', color: MORE_COLORS[k % MORE_COLORS.length], kind: 'tasks', tasks: [] }, ...ls];
    });
    setIndex(0); setLast('onAdd()');
  };
  // перестановка: выбранный список остаётся выбранным
  const reorder = (from: number, to: number) => {
    setLists(ls => { const a = [...ls]; const [m] = a.splice(from, 1); a.splice(to, 0, m); return a; });
    setIndex(i => (i === from ? to : from < i && i <= to ? i - 1 : to <= i && i < from ? i + 1 : i));
    setLast(`onReorder(${from}, ${to})`);
  };

  return (
    <div className="ed">
      <aside className="ctl" aria-label={t('Настройки заголовков')}>
        <Sec title={t('Движение')}>
          <Tabs label={t('Движение')} value={o.motion} options={[['calm', 'Calm'], ['bouncy', 'Bouncy'], ['snappy', 'Snappy']]} onChange={x => upd({ motion: x })} />
        </Sec>
        <Sec title={t('Вид')}>
          <div className="rl-group">
            <div className="rl-f"><span>{t('Размер')}</span>
              <Tabs label={t('Размер')} value={o.size} options={[['lg', 'LG'], ['md', 'MD']]} onChange={x => upd({ size: x })} />
            </div>
            <ParzToggle className="chk" checked={o.icons} onChange={x => upd({ icons: x })} label={t('Значки')} />
            <ParzToggle className="chk" checked={o.counts} onChange={x => upd({ counts: x })} label={t('Числа')} />
            <ParzToggle className="chk" checked={o.add} onChange={x => upd({ add: x })} label={t('Потянуть, чтобы добавить')} />
            <ParzToggle className="chk" checked={o.pager} onChange={x => upd({ pager: x })} label={t('Вместе с Parz Pager')} />
          </div>
        </Sec>
        <Sec title={t('Список поверх')}>
          <div className="rl-group">
            <ParzToggle className="chk" checked={o.list} onChange={x => upd({ list: x })} label={t('Нажатие на выбранный — открыть список')} />
            <ParzToggle className="chk" checked={o.reorder} onChange={x => upd({ reorder: x })} label={t('Порядок (onReorder)')} disabled={!o.list} />
            <ParzToggle className="chk" checked={o.more} onChange={x => upd({ more: x })} label={t('Кнопка ••• (onItemMore)')} disabled={!o.list} />
            <div className="days-btns"><ParzButton size="sm" variant="outline" icon="ms:restart_alt" onClick={() => { setO(O0); setLists(START); setIndex(0); setLast(''); }}>{t('По умолчанию')}</ParzButton></div>
          </div>
        </Sec>
      </aside>

      <section className="stage">
        <ParzProvider motion={o.motion}>
          <div className="tg-stages">
            <Panel bg="dark" o={o} lists={lists} index={index} setIndex={setIndex} onAdd={addList} onReorder={reorder} onMore={i => setLast(`onItemMore(${i})`)} />
            <Panel bg="light" o={o} lists={lists} index={index} setIndex={setIndex} onAdd={addList} onReorder={reorder} onMore={i => setLast(`onItemMore(${i})`)} />
          </div>
        </ParzProvider>
        <p className="logo-hint days-api">onIndexChange → <code>{index}</code>{last && <> · <code>{last}</code></>}</p>
        <p className="logo-hint">{t('Нажмите на выбранный заголовок — поверх блока откроется список: переход, «Новый», «Порядок» (тяните строки) и «•••». В страницах — что угодно: задачи, Parz Progress, Parz Toggle, Parz Ruler.')}</p>
        <div className="code">
          <div className="code-h"><b>{t('Код')}</b><button onClick={copy}>{copied ? t('Скопировано') : t('Скопировать')}</button></div>
          <pre><code>{code}</code></pre>
        </div>
      </section>
    </div>
  );
}
