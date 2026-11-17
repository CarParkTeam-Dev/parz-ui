import { useContext, useMemo, useState } from 'react';
import { ParzDays, ParzProvider, ParzToggle, type ParzMotionPreset, type ParzDaysSize } from '../lib';
import { ColorField, Sec, Seg } from './App';
import { useT, LangCtx } from './i18n';

type O = { size: ParzDaysSize; motion: ParzMotionPreset; weekday: 'narrow' | 'short'; month: boolean; today: boolean; marks: boolean; limit: boolean; weekends: boolean; disabled: boolean; todayHi: boolean; todayClr: string; sunHi: boolean; sunClr: string; picker: 'none' | 'wheels' | 'compact'; pYear: boolean; curHi: boolean; curClr: string };
const O0: O = { size: 'md', motion: 'bouncy', weekday: 'narrow', month: true, today: true, marks: true, limit: false, weekends: false, disabled: false, todayHi: true, todayClr: '#34d27b', sunHi: true, sunClr: '#ff453a', picker: 'wheels', pYear: true, curHi: true, curClr: '#34d27b' };
const LOC: Record<string, string> = { ru: 'ru-RU', en: 'en-US', hy: 'hy-AM' };
const addDays = (n: number) => { const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() + n); return d; };
const mark = (d: Date) => (d.getDate() % 5 === 0 ? true : d.getDate() % 7 === 0 ? '#4d9bff' : undefined);
const weekend = (d: Date) => d.getDay() === 0 || d.getDay() === 6;

const ymd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
function codeFor(o: O, todayLabel: string, off: Date[]) {
  const a: string[] = ['value={day}', 'onChange={(date, iso) => { setDay(date); fetch(`/api/slots?date=${iso}`); }}', `name='date'`];
  if (o.size !== 'md') a.push(`size='${o.size}'`);
  if (o.weekday !== 'narrow') a.push(`weekday='short'`);
  if (o.picker !== 'none') { a.push(`picker='${o.picker}'`); if (!o.pYear) a.push('pickerYear={false}'); }
  else if (o.month) a.push('showMonth');
  if (o.today) a.push(`todayLabel='${todayLabel}'`);
  if (o.marks) a.push('marks={d => hasEvents(d)}');
  if (o.limit) a.push('min={new Date()}', 'max={inTwoWeeks}');
  if (o.weekends) a.push('isDisabled={d => d.getDay() === 0 || d.getDay() === 6}');
  if (o.disabled) a.push('disabled');
  if (!o.todayHi) a.push('highlightToday={false}');
  else if (o.todayClr !== O0.todayClr) a.push(`todayColor='${o.todayClr}'`);
  if (o.picker === 'wheels') { if (!o.curHi) a.push('highlightCurrent={false}'); else if (o.curClr !== O0.curClr) a.push(`currentColor='${o.curClr}'`); }
  if (!o.sunHi) a.push('highlightSunday={false}');
  else if (o.sunClr !== O0.sunClr) a.push(`sundayColor='${o.sunClr}'`);
  if (off.length) a.push(`disabledDates={[${off.map(d => `new Date(${d.getFullYear()}, ${d.getMonth()}, ${d.getDate()})`).join(', ')}]}`);
  return [`import { useState } from 'react';`, `import { ParzProvider, ParzDays } from '@carparkteam/parz-ui';`, `import '@carparkteam/parz-ui/style.css';`, ``,
    `const [day, setDay] = useState(new Date());`, ``,
    `<ParzProvider motion='${o.motion}'>`, `  <ParzDays\n    ${a.join('\n    ')}\n  />`, `</ParzProvider>`].join('\n');
}

export function DaysEditor() {
  const t = useT();
  const lang = useContext(LangCtx);
  const [o, setO] = useState<O>(O0);
  const [day, setDay] = useState(() => addDays(0));
  const [copied, setCopied] = useState(false);
  const upd = (p: Partial<O>) => setO(x => ({ ...x, ...p }));
  const [off, setOff] = useState<Date[]>([]);
  const code = useMemo(() => codeFor(o, t('Сегодня'), off), [o, t, off]);
  const offDay = () => setOff(l => (l.some(d => ymd(d) === ymd(day)) ? l : [...l, day]));
  const copy = async () => { try { await navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 1600); } catch { /* буфер недоступен */ } };
  const min = o.limit ? addDays(0) : undefined, max = o.limit ? addDays(14) : undefined;

  const panel = (bg: 'dark' | 'light') => (
    <div className={`tg-stage tg-stage--${bg} days-stage`}>
      <span className="tg-cap">{bg === 'light' ? t('Светлый фон') : t('Тёмный фон')}</span>
      <ParzDays value={day} onChange={setDay} theme={bg} size={o.size} weekday={o.weekday} locale={LOC[lang]} showMonth={o.month}
        todayLabel={o.today ? t('Сегодня') : undefined} marks={o.marks ? mark : undefined} min={min} max={max}
        isDisabled={o.weekends ? weekend : undefined} disabled={o.disabled} picker={o.picker === 'none' ? undefined : o.picker} pickerYear={o.pYear} highlightToday={o.todayHi} todayColor={o.todayClr !== O0.todayClr ? o.todayClr : undefined}
        highlightCurrent={o.curHi} currentColor={o.curClr !== O0.curClr ? o.curClr : undefined} highlightSunday={o.sunHi} sundayColor={o.sunClr !== O0.sunClr ? o.sunClr : undefined} disabledDates={off} ariaLabel={t('Дата')} />
    </div>
  );

  return (
    <div className="ed">
      <aside className="ctl" aria-label={t('Настройки ленты дней')}>
        <Sec title={t('Движение')}>
          <Seg label={t('Движение')} value={o.motion} options={[['calm', 'Calm'], ['bouncy', 'Bouncy'], ['snappy', 'Snappy']]} onChange={x => upd({ motion: x as ParzMotionPreset })} />
        </Sec>
        <Sec title={t('Вид')}>
          <div className="days-segs">
            <Seg label={t('Размер')} value={o.size} options={[['sm', 'S'], ['md', 'M'], ['lg', 'L']]} onChange={x => upd({ size: x as ParzDaysSize })} />
            <Seg label={t('День недели')} value={o.weekday} options={[['narrow', t('Буква')], ['short', t('Коротко')]]} onChange={x => upd({ weekday: x as O['weekday'] })} />
            <Seg label={t('Выбор месяца и года')} value={o.picker} options={[['wheels', t('Ленты')], ['compact', t('Мини-окно')], ['none', t('Нет')]]} onChange={x => upd({ picker: x as O['picker'] })} />
          </div>
          {o.picker !== 'none' && <ParzToggle className="chk" checked={o.pYear} onChange={x => upd({ pYear: x })} label={t('Можно менять год')} />}
          {o.picker === 'none' && <ParzToggle className="chk" checked={o.month} onChange={x => upd({ month: x })} label={t('Месяц над лентой')} />}
          <ParzToggle className="chk" checked={o.today} onChange={x => upd({ today: x })} label={t('Кнопка «Сегодня»')} />
          <ParzToggle className="chk" checked={o.marks} onChange={x => upd({ marks: x })} label={t('Точки-метки')} />
          <ParzToggle className="chk" checked={o.todayHi} onChange={x => upd({ todayHi: x })} label={t('Выделять сегодня цветом')} />
          {o.todayHi && <div className="clrs"><ColorField label={t('Цвет «сегодня»')} value={o.todayClr} onChange={x => upd({ todayClr: x })} /></div>}
          {o.picker === 'wheels' && <ParzToggle className="chk" checked={o.curHi} onChange={x => upd({ curHi: x })} label={t('Выделять текущий год и месяц')} />}
          {o.picker === 'wheels' && o.curHi && <div className="clrs"><ColorField label={t('Цвет текущего года и месяца')} value={o.curClr} onChange={x => upd({ curClr: x })} /></div>}
          <ParzToggle className="chk" checked={o.sunHi} onChange={x => upd({ sunHi: x })} label={t('Выделять воскресенье цветом')} />
          {o.sunHi && <div className="clrs"><ColorField label={t('Цвет воскресенья')} value={o.sunClr} onChange={x => upd({ sunClr: x })} /></div>}
        </Sec>
        <Sec title={t('Поведение')}>
          <ParzToggle className="chk" checked={o.limit} onChange={x => upd({ limit: x })} label={t('Только ближайшие 2 недели')} />
          <ParzToggle className="chk" checked={o.weekends} onChange={x => upd({ weekends: x })} label={t('Выходные недоступны')} />
          <ParzToggle className="chk" checked={o.disabled} onChange={x => upd({ disabled: x })} label={t('Отключён')} />
          <div className="btns"><button onClick={offDay}>{t('Отключить выбранный день')}</button>{off.length > 0 && <button onClick={() => setOff([])}>{t('Вернуть дни')} ({off.length})</button>}</div>
          <div className="btns"><button onClick={() => { setO(O0); setOff([]); }}>{t('По умолчанию')}</button></div>
        </Sec>
      </aside>

      <section className="stage">
        <ParzProvider motion={o.motion}>
          <div className="tg-stages">{panel('dark')}{panel('light')}</div>
        </ParzProvider>
        <p className="logo-hint days-api">onChange → <code>{`${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`}</code></p>
        <p className="logo-hint">{t('Потяните ленту, покрутите тачпадом или нажмите день — лента пружинит под карточку.')}</p>
        <div className="code">
          <div className="code-h"><b>{t('Код')}</b><button onClick={copy}>{copied ? t('Скопировано') : t('Скопировать')}</button></div>
          <pre><code>{code}</code></pre>
        </div>
      </section>
    </div>
  );
}
