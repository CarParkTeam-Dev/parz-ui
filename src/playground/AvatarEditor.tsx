import { useMemo, useState } from 'react';
import { ParzTabs, ParzAvatar, ParzAvatarGroup, ParzProvider, PARZ_AVATAR_PRESETS, ParzToggle, ParzButton, type ParzMotionPreset, type ParzAvatarSize, type ParzAvatarShape, type ParzAvatarStatus } from '../lib';
import { ColorField, Sec } from './App';
import { useT } from './i18n';

const PHOTOS = PARZ_AVATAR_PRESETS;
const PEOPLE = ['Ani Petrosyan', 'Mark Lee', 'Elena Sokolova', 'David Hakobyan', 'Sara Kim', 'Aram Grigoryan', 'Lina Park', 'Tigran Avetisyan', 'Mia Novak', 'Karen Sargsyan'];
const STATUSES: ParzAvatarStatus[] = ['online', 'away', 'busy', 'offline'];

type Content = 'photo' | 'initials' | 'icon' | 'broken';
type O = {
  motion: ParzMotionPreset; content: Content; name: string; size: ParzAvatarSize; shape: ParzAvatarShape; status: 'none' | ParzAvatarStatus; pulse: boolean;
  ring: 'none' | 'new' | 'seen'; spin: boolean; count: number; clickable: boolean; editable: boolean; customColor: boolean; color: string;
  gCount: number; gMax: number; spacing: 'tight' | 'normal' | 'loose'; spread: boolean; tips: boolean; gStatus: boolean;
};
const O0: O = {
  motion: 'bouncy', content: 'photo', name: 'Ani Petrosyan', size: 'xl', shape: 'circle', status: 'online', pulse: true,
  ring: 'none', spin: true, count: 0, clickable: true, editable: true, customColor: false, color: '#5a46e8',
  gCount: 8, gMax: 5, spacing: 'normal', spread: true, tips: true, gStatus: false
};

const q = (s: string) => `'${s.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
function codeFor(o: O, statusLabel: string) {
  const a: string[] = [];
  if (o.content === 'photo') a.push(`src={user.photo}`);
  if (o.content === 'broken') a.push(`src='/missing.jpg'`);
  if (o.content !== 'icon') a.push(`name=${q(o.name)}`);
  if (o.size !== 'md') a.push(`size=${q(o.size)}`);
  if (o.shape !== 'circle') a.push(`shape=${q(o.shape)}`);
  if (o.status !== 'none') { a.push(`status=${q(o.status)}`, `statusLabel=${q(statusLabel)}`); if (o.status === 'online' && !o.pulse) a.push('statusPulse={false}'); }
  if (o.ring === 'new') a.push('ring'); if (o.ring === 'seen') a.push(`ring='seen'`);
  if (o.ring === 'new' && !o.spin) a.push('ringSpin={false}');
  if (o.count > 0) a.push(`count={${o.count}}`);
  if (o.customColor) a.push(`color=${q(o.color)}`);
  if (o.editable) a.push('editable', 'onUpload={file => uploadAvatar(file)} // Promise<string> — адрес готового фото', 'onChange={v => saveAvatar(v)}');
  else if (o.clickable) a.push('onClick={openProfile}');
  const g: string[] = [`max={${o.gMax}}`];
  if (o.size !== 'md') g.push(`size=${q(o.size === 'xl' ? 'lg' : o.size)}`);
  if (o.shape !== 'circle') g.push(`shape=${q(o.shape)}`);
  if (o.spacing !== 'normal') g.push(`spacing=${q(o.spacing)}`);
  if (!o.spread) g.push('spread={false}');
  if (!o.tips) g.push('tooltips={false}');
  g.push('onMoreClick={showAll}');
  return [`import { ParzProvider, ParzAvatar, ParzAvatarGroup } from '@carparkteam/parz-ui';`, `import '@carparkteam/parz-ui/style.css';`, ``,
    `<ParzProvider motion=${q(o.motion)}>`,
    `  <ParzAvatar\n    ${a.join('\n    ')}\n  />`, ``,
    `  <ParzAvatarGroup ${g.join(' ')} ariaLabel='Team'>`,
    `    {team.map(u => <ParzAvatar key={u.id} src={u.photo} name={u.name} />)}`,
    `  </ParzAvatarGroup>`,
    `</ParzProvider>`].join('\n');
}

/* настройки — на ParzTabs: пункты своей ширины, а что не помещается — в группу «•••» */
function Tabs<V extends string>({ label, value, options, onChange }: { label: string; value: V; options: [V, string][]; onChange: (v: V) => void }) {
  const t = useT();
  return <ParzTabs size="md" overflow="more" moreLabel={t('Ещё')} ariaLabel={label} value={value} onChange={onChange}
    options={options.map(([v, l]) => ({ value: v, label: l }))} />;
}

export function AvatarEditor() {
  const t = useT();
  const [o, setO] = useState<O>(O0);
  const [photo, setPhoto] = useState(0);
  const [copied, setCopied] = useState(false);
  const [clicks, setClicks] = useState(0);
  const upd = (p: Partial<O>) => setO(x => ({ ...x, ...p }));
  const stLabel = (s: ParzAvatarStatus) => t(s === 'online' ? 'В сети' : s === 'away' ? 'Нет на месте' : s === 'busy' ? 'Не беспокоить' : 'Не в сети');
  const code = useMemo(() => codeFor(o, o.status === 'none' ? '' : stLabel(o.status)), [o, t]);
  const copy = async () => { try { await navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 1600); } catch { /* буфер недоступен */ } };
  const cycleStatus = () => upd({ status: o.status === 'none' ? 'online' : STATUSES[(STATUSES.indexOf(o.status) + 1) % STATUSES.length] });
  const labels = { title: t('Выберите аватар'), initials: t('Инициалы'), upload: t('Загрузить фото'), uploading: t('Загрузка…'), edit: t('Сменить аватар'), preset: t('Аватар {n}') };
  // загрузка «на сервер» для примера: читаем файл и ждём 2,2 с — видно размытое превью и точки
  const fakeUpload = (f: File) => new Promise<string>((ok, bad) => {
    const r = new FileReader();
    r.onload = () => window.setTimeout(() => ok(String(r.result)), 2200);
    r.onerror = () => bad(r.error);
    r.readAsDataURL(f);
  });
  const gSize: ParzAvatarSize = o.size === 'xl' ? 'lg' : o.size;

  const panel = (bg: 'dark' | 'light') => {
    const src = o.content === 'photo' ? PHOTOS[photo % PHOTOS.length] : o.content === 'broken' ? '/__missing-avatar.jpg' : undefined;
    return (
      <div className={`tg-stage tg-stage--${bg} av-stage`}>
        <span className="tg-cap">{bg === 'dark' ? t('Тёмный фон') : t('Светлый фон')}</span>
        <div className="av-main">
          <ParzAvatar theme={bg} src={src} name={o.content === 'icon' ? undefined : o.name} size={o.size} shape={o.shape}
            status={o.status === 'none' ? undefined : o.status} statusLabel={o.status === 'none' ? undefined : stLabel(o.status)} statusPulse={o.pulse}
            ring={o.ring === 'new' ? true : o.ring === 'seen' ? 'seen' : undefined} ringSpin={o.spin} count={o.count}
            color={o.customColor ? o.color : undefined} onClick={o.clickable || o.editable ? () => setClicks(c => c + 1) : undefined}
            editable={o.editable} onUpload={fakeUpload} labels={labels} />
        </div>
        <div className="av-row" aria-label={t('Размеры')}>
          {(['xs', 'sm', 'md', 'lg'] as ParzAvatarSize[]).map((s, i) => (
            <ParzAvatar key={s} theme={bg} size={s} shape={o.shape} name={PEOPLE[i + 2]} src={i % 2 ? PHOTOS[(i + 2) % PHOTOS.length] : undefined} status={STATUSES[i]} statusLabel={stLabel(STATUSES[i])} />
          ))}
          <ParzAvatar theme={bg} size="md" shape={o.shape} />
        </div>
        <ParzAvatarGroup theme={bg} size={gSize} shape={o.shape} max={o.gMax} spacing={o.spacing} spread={o.spread} tooltips={o.tips}
          onMoreClick={() => upd({ gMax: Math.min(o.gCount, o.gMax + 3) })} moreLabel={n => t('Ещё {n}', { n })} ariaLabel={t('Команда')}>
          {PEOPLE.slice(0, o.gCount).map((n, i) => (
            <ParzAvatar key={n} name={n} src={i % 3 === 2 ? undefined : PHOTOS[i % PHOTOS.length]}
              status={o.gStatus ? STATUSES[i % 4] : undefined} statusLabel={o.gStatus ? stLabel(STATUSES[i % 4]) : undefined} />
          ))}
        </ParzAvatarGroup>
      </div>
    );
  };

  return (
    <div className="ed">
      <aside className="ctl" aria-label={t('Настройки аватара')}>
        <Sec title={t('Движение')}>
          <Tabs label={t('Движение')} value={o.motion} options={[['calm', 'Calm'], ['bouncy', 'Bouncy'], ['snappy', 'Snappy']]} onChange={x => upd({ motion: x })} />
        </Sec>
        <Sec title={t('Что показывать')}>
          <Tabs label={t('Что показывать')} value={o.content} options={[['photo', t('Фото')], ['initials', t('Инициалы')], ['icon', t('Значок')], ['broken', t('Ошибка')]]} onChange={x => upd({ content: x })} />
          {o.content !== 'icon' && <label className="row"><span>{t('Имя')}</span><input className="txt" value={o.name} maxLength={40} onChange={e => upd({ name: e.target.value })} /></label>}
          {o.content === 'photo' && <div className="days-btns"><ParzButton size="sm" variant="soft" icon="ms:photo_camera" onClick={() => setPhoto(x => x + 1)}>{t('Другое фото')}</ParzButton></div>}
        </Sec>
        <Sec title={t('Вид')}>
          <div className="days-segs">
            <Tabs label={t('Размер')} value={o.size} options={[['xs', 'XS'], ['sm', 'S'], ['md', 'M'], ['lg', 'L'], ['xl', 'XL']]} onChange={x => upd({ size: x })} />
            <Tabs label={t('Форма')} value={o.shape} options={[['circle', t('Круг')], ['rounded', t('Скруглённый')], ['square', t('Квадрат')]]} onChange={x => upd({ shape: x })} />
          </div>
          <ParzToggle className="chk" checked={o.customColor} onChange={x => upd({ customColor: x })} label={t('Свой цвет инициалов')} />
          {o.customColor && <div className="clrs"><ColorField label={t('Цвет')} value={o.color} onChange={x => upd({ color: x })} /></div>}
          <ParzToggle className="chk" checked={o.editable} onChange={x => upd({ editable: x })} label={t('Можно сменить аватар')} />
          {!o.editable && <ParzToggle className="chk" checked={o.clickable} onChange={x => upd({ clickable: x })} label={t('Можно нажать')} />}
        </Sec>
        <Sec title={t('Статус и кольцо')}>
          <div className="days-segs">
            <Tabs label={t('Статус')} value={o.status} options={[['none', t('Нет')], ['online', t('В сети')], ['away', t('Нет на месте')], ['busy', t('Не беспокоить')], ['offline', t('Не в сети')]]} onChange={x => upd({ status: x })} />
          </div>
          {o.status === 'online' && <ParzToggle className="chk" checked={o.pulse} onChange={x => upd({ pulse: x })} label={t('Пульс')} />}
          <div className="days-segs">
            <Tabs label={t('Кольцо')} value={o.ring} options={[['none', t('Нет')], ['new', t('Новая история')], ['seen', t('Просмотрено')]]} onChange={x => upd({ ring: x })} />
          </div>
          {o.ring === 'new' && <ParzToggle className="chk" checked={o.spin} onChange={x => upd({ spin: x })} label={t('Градиент течёт по кругу')} />}
          <div className="btns">
            <button onClick={() => upd({ count: Math.max(0, o.count - 1) })}>−1</button>
            <button onClick={() => upd({ count: o.count + 1 })}>+1</button>
            <button onClick={() => upd({ count: 0 })}>{t('Без счётчика')}</button>
          </div>
        </Sec>
        <Sec title={t('Группа')}>
          <div className="row"><span>{t('Людей')}</span><Tabs label={t('Людей')} value={String(o.gCount) as '3' | '5' | '8' | '10'} options={[['3', '3'], ['5', '5'], ['8', '8'], ['10', '10']]} onChange={x => upd({ gCount: Number(x) })} /></div>
          <div className="row"><span>{t('Показывать')}</span><Tabs label={t('Показывать')} value={String(o.gMax) as '3' | '4' | '5' | '8'} options={[['3', '3'], ['4', '4'], ['5', '5'], ['8', '8']]} onChange={x => upd({ gMax: Number(x) })} /></div>
          <div className="row"><span>{t('Наложение')}</span><Tabs label={t('Наложение')} value={o.spacing} options={[['tight', t('Плотно')], ['normal', t('Обычно')], ['loose', t('Свободно')]]} onChange={x => upd({ spacing: x })} /></div>
          <ParzToggle className="chk" checked={o.spread} onChange={x => upd({ spread: x })} label={t('Раздвигать при наведении')} />
          <ParzToggle className="chk" checked={o.tips} onChange={x => upd({ tips: x })} label={t('Подсказки с именами')} />
          <ParzToggle className="chk" checked={o.gStatus} onChange={x => upd({ gStatus: x })} label={t('Статусы в группе')} />
          <div className="days-btns"><ParzButton size="sm" variant="outline" icon="ms:restart_alt" onClick={() => setO(O0)}>{t('По умолчанию')}</ParzButton></div>
        </Sec>
      </aside>

      <section className="stage">
        <ParzProvider motion={o.motion}>
          <div className="tg-stages">{panel('dark')}{panel('light')}</div>
        </ParzProvider>
        <div className="days-btns av-acts">
          <ParzButton size="sm" variant="soft" icon="ms:sync" onClick={cycleStatus}>{t('Сменить статус')}</ParzButton>
          {o.clickable && <span className="logo-hint">onClick × {clicks}</span>}
        </div>
        {o.editable && <p className="logo-hint">{t('Нажмите на большой аватар — откроется окно: готовые рисунки, инициалы или загрузка фото с диска.')}</p>}
        <p className="logo-hint">{t('Наведите на группу — стопка раздвинется, появятся имена. «+N» открывает ещё троих. Меняйте фото и статус — переход плавный.')}</p>
        <div className="code">
          <div className="code-h"><b>{t('Код')}</b><button onClick={copy}>{copied ? t('Скопировано') : t('Скопировать')}</button></div>
          <pre><code>{code}</code></pre>
        </div>
      </section>
    </div>
  );
}
