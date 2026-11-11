import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ParzMenu, AnimoLogo, ParzToggle, ParzCheckbox, ParzSlider, ParzRange, type TabItem } from '../lib';
import { MenuEditor, Seg } from './App';
import { LogoEditor } from './LogoEditor';
import { ToggleEditor } from './ToggleEditor';
import { CheckboxEditor } from './CheckboxEditor';
import { SliderEditor } from './SliderEditor';
import { Markdown } from './Markdown';
import { ChangelogPage } from './Changelog';
import { UpdateCheck } from './UpdateCheck';
import { ParzBrand, ParzLogo, Splash } from './Brand';
import { LANGS, LangCtx, tr, type Lang } from './i18n';
import menuEn from '../../docs/parz-menu.en.md?raw';
import menuRu from '../../docs/parz-menu.ru.md?raw';
import menuHy from '../../docs/parz-menu.hy.md?raw';
import logoEn from '../../docs/animologo.en.md?raw';
import logoRu from '../../docs/animologo.ru.md?raw';
import logoHy from '../../docs/animologo.hy.md?raw';
import toggleEn from '../../docs/parz-toggle.en.md?raw';
import toggleRu from '../../docs/parz-toggle.ru.md?raw';
import toggleHy from '../../docs/parz-toggle.hy.md?raw';
import checkEn from '../../docs/parz-checkbox.en.md?raw';
import checkRu from '../../docs/parz-checkbox.ru.md?raw';
import checkHy from '../../docs/parz-checkbox.hy.md?raw';
import sliderEn from '../../docs/parz-slider.en.md?raw';
import sliderRu from '../../docs/parz-slider.ru.md?raw';
import sliderHy from '../../docs/parz-slider.hy.md?raw';
import changesEn from '../../CHANGELOG.md?raw';
import changesRu from '../../CHANGELOG.ru.md?raw';
import changesHy from '../../CHANGELOG.hy.md?raw';
import pkg from '../../package.json';

type Page = 'home' | 'components' | 'menu' | 'animo' | 'toggle' | 'check' | 'slider' | 'range' | 'brand' | 'changelog';
type Cmp = 'menu' | 'animo' | 'toggle' | 'check' | 'slider' | 'range';
const CMP_TITLE: Record<Cmp, string> = { menu: 'Parz Menu', animo: 'AnimoLogo', toggle: 'Parz Toggle', check: 'Parz Checkbox', slider: 'Parz Slider', range: 'Parz Range' };
const isCmp = (p: Page): p is Cmp => p in CMP_TITLE;
type View = 'editor' | 'docs';
type Route = { page: Page; view: View };
type Go = (p: Page, v?: View) => void;
const SLUG: Record<Page, string> = { home: '', components: 'components', menu: 'parz-menu', animo: 'animologo', toggle: 'parz-toggle', check: 'parz-checkbox', slider: 'parz-slider', range: 'parz-range', brand: 'brand', changelog: 'changelog' };
const DOCS: Record<Cmp, Record<Lang, string>> = {
  menu: { en: menuEn, ru: menuRu, hy: menuHy },
  animo: { en: logoEn, ru: logoRu, hy: logoHy },
  toggle: { en: toggleEn, ru: toggleRu, hy: toggleHy },
  check: { en: checkEn, ru: checkRu, hy: checkHy },
  slider: { en: sliderEn, ru: sliderRu, hy: sliderHy },
  range: { en: sliderEn, ru: sliderRu, hy: sliderHy }
};
const LANG_KEY = 'ltb-lang';

/* поиск по компонентам: заголовки и слова для поиска на всех трёх языках — находится с любого */
type Hit = { page: Page; view: View; title: string; sub: string; icon: string; words: string };
const INDEX: Omit<Hit, 'sub'>[] = [
  { page: 'components', view: 'editor', title: 'Components', icon: 'grid_view', words: 'components all catalog grid компоненты все каталог կոմպոնենտներ' },
  { page: 'menu', view: 'editor', title: 'Parz Menu', icon: 'menu', words: 'parz menu tabbar navigation nav bar header drop badge меню навигация шапка капля бейдж մենյու նավիգացիա' },
  { page: 'menu', view: 'docs', title: 'Parz Menu', icon: 'description', words: 'parz menu docs props api документация пропсы փաստաթղթեր' },
  { page: 'animo', view: 'editor', title: 'AnimoLogo', icon: 'animation', words: 'animologo logo wordmark animation text логотип анимация надпись լոգո անիմացիա' },
  { page: 'animo', view: 'docs', title: 'AnimoLogo', icon: 'description', words: 'animologo logo docs props документация пропсы փաստաթղթեր' },
  { page: 'toggle', view: 'editor', title: 'Parz Toggle', icon: 'toggle_on', words: 'parz toggle switch slider checkbox on off form переключатель тумблер свитч чекбокс вкл выкл форма անջատիչ փոխարկիչ միացնել անջատել' },
  { page: 'toggle', view: 'docs', title: 'Parz Toggle', icon: 'description', words: 'parz toggle switch docs props api документация пропсы переключатель փաստաթղթեր' },
  { page: 'check', view: 'editor', title: 'Parz Checkbox', icon: 'check_box', words: 'parz checkbox check tick select all indeterminate form agree чекбокс флажок галочка выбрать все согласие форма նշիչ նշել ընտրել բոլորը' },
  { page: 'check', view: 'docs', title: 'Parz Checkbox', icon: 'description', words: 'parz checkbox docs props api документация пропсы чекбокс флажок փաստաթղթեր' },
  { page: 'slider', view: 'editor', title: 'Parz Slider', icon: 'linear_scale', words: 'parz slider range input volume value drag ползунок слайдер громкость значение սահիչ ձայն արժեք' },
  { page: 'slider', view: 'docs', title: 'Parz Slider', icon: 'description', words: 'parz slider docs props api документация пропсы ползунок փաստաթղթեր' },
  { page: 'range', view: 'editor', title: 'Parz Range', icon: 'tune', words: 'parz range interval between price filter multi thumbs промежуток диапазон интервал цена фильтр от до несколько միջակայք գին ֆիլտր' },
  { page: 'range', view: 'docs', title: 'Parz Range', icon: 'description', words: 'parz range docs props api документация пропсы промежуток փաստաթղթեր' },
  { page: 'changelog', view: 'editor', title: 'Changelog', icon: 'history', words: 'changelog what is new whats new release releases update version history что нового изменения обновление версия выпуск история ինչ նոր կա փոփոխություններ թարմացում տարբերակ' },
  { page: 'brand', view: 'editor', title: 'Parz UI', icon: 'palette', words: 'parz logos brand svg zip pack логотипы бренд логопак լոգոներ' }
];
function searchHits(q: string, lang: Lang): Hit[] {
  const w = q.trim().toLowerCase();
  if (!w) return [];
  return INDEX.filter(h => (h.title + ' ' + h.words).toLowerCase().includes(w))
    .map(h => ({ ...h, sub: tr(lang, h.page === 'brand' ? 'Логотипы' : h.page === 'changelog' ? 'Что нового' : h.page === 'components' ? 'Все компоненты' : h.view === 'docs' ? 'Документация' : 'Редактор') }));
}

function parseHash(): Route {
  const [p0, v] = location.hash.replace(/^#\/?/, '').split('/');
  const p = p0?.replace(/^liqui-/, 'parz-'); // старые адреса #/liqui-* продолжают работать
  const page = (Object.keys(SLUG) as Page[]).find(k => SLUG[k] === p) ?? 'home';
  return { page, view: v === 'docs' ? 'docs' : 'editor' };
}
const rkey = (r: Route) => (isCmp(r.page) ? `${r.page}/${r.view}` : r.page);

/* логотипы из PARZ-UI-Logo-Pack: что показать и на каком фоне */
const VARIANTS: { file: string; name: string; bg: 'light' | 'dark' | 'split' }[] = [
  { file: 'parz-ui-light.svg', name: 'Light', bg: 'dark' },
  { file: 'parz-ui-dark.svg', name: 'Dark', bg: 'light' },
  { file: 'parz-ui-adaptive.svg', name: 'Adaptive', bg: 'split' },
  { file: 'parz-ui-animated.svg', name: 'Animated', bg: 'split' },
  { file: 'parz-ui.svg', name: 'Default', bg: 'split' },
  { file: 'parz-ui-icon.svg', name: 'Icon', bg: 'split' }
];

/* ---------- переход между страницами: старая уходит → скелетон → новая проявляется ---------- */
const OUT_MS = 190, LOAD_MS = 420;
const reduced = () => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
function useTransition(route: Route) {
  const [shown, setShown] = useState(route);
  const [phase, setPhase] = useState<'in' | 'out' | 'load'>('in');
  const timers = useRef<number[]>([]);
  useEffect(() => {
    if (rkey(route) === rkey(shown)) return;
    timers.current.forEach(clearTimeout);
    const swap = () => {
      setShown(route);
      document.querySelector('.page')?.scrollTo({ top: 0 });
      window.scrollTo({ top: 0 });
    };
    if (reduced()) { swap(); setPhase('in'); return; }
    setPhase('out');
    timers.current = [
      window.setTimeout(() => { swap(); setPhase('load'); }, OUT_MS),
      window.setTimeout(() => setPhase('in'), OUT_MS + LOAD_MS)
    ];
  }, [rkey(route)]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  return { shown, phase };
}

export function Site() {
  const [lang, setLang] = useState<Lang>(() => {
    try { const v = localStorage.getItem(LANG_KEY); if (v === 'en' || v === 'ru' || v === 'hy') return v; } catch { /* нет хранилища */ }
    return 'en';
  });
  useEffect(() => { document.documentElement.lang = lang; try { localStorage.setItem(LANG_KEY, lang); } catch { /* нет хранилища */ } }, [lang]);
  const t = (k: string, v?: Record<string, string | number>) => tr(lang, k, v);

  const [route, setRoute] = useState(parseHash);
  useEffect(() => {
    const on = () => setRoute(parseHash());
    addEventListener('hashchange', on);
    return () => removeEventListener('hashchange', on);
  }, []);
  const go: Go = (p, v = 'editor') => {
    const h = SLUG[p] ? `#/${SLUG[p]}${v === 'docs' ? '/docs' : ''}` : '#/';
    if (location.hash !== h) location.hash = h; else setRoute({ page: p, view: v });
  };
  const { shown, phase } = useTransition(route);
  // загрузчик — при каждом открытии или перезагрузке сайта, на любой странице; при переходах внутри сайта его нет
  const [splash, setSplash] = useState(true);
  const [revealed, setRevealed] = useState(!splash); // загрузчик ушёл — главная проигрывает свою анимацию заново, уже на виду

  const [query, setQuery] = useState('');
  const hits = searchHits(query, lang);
  const pick = (h: Hit) => { setQuery(''); go(h.page, h.view); };
  const search = {
    searchPlaceholder: t('Поиск компонентов'), searchValue: query, onSearchChange: setQuery,
    onSearch: () => { if (hits[0]) pick(hits[0]); }
  };
  const nextLang = () => setLang(l => LANGS[(LANGS.findIndex(x => x[0] === l) + 1) % LANGS.length][0]);
  const items: TabItem[] = [
    { id: 'home', label: t('Главная'), icon: 'ms:home' },
    { id: 'components', label: t('Компоненты'), icon: 'ms:grid_view', badge: CATALOG.length },
    { id: 'changelog', label: t('Изменения'), icon: 'ms:history' }
  ];
  // меню показывает, куда идём, сразу — капля не ждёт конца перехода
  const navValue = isCmp(route.page) ? 'components' : route.page;

  let view: ReactNode;
  if (phase === 'load') view = <Skeleton route={shown} />;
  else {
    const { page, view: v } = shown;
    view = (
      <div key={rkey(shown)} className={`pz-view${phase === 'out' ? ' is-out' : ' is-in'}`}>
        {page === 'home' && <Home lang={lang} go={go} revealed={revealed} />}
        {page === 'components' && <ComponentsPage lang={lang} go={go} />}
        {page === 'brand' && <BrandPage lang={lang} />}
        {page === 'changelog' && <ChangelogPage lang={lang} source={CHANGES[lang]} install={<InstallCmd lang={lang} cmd={UPDATE} />} check={<UpdateCheck lang={lang} current={pkg.version} />} footer={<Footer lang={lang} />} />}
        {isCmp(page) && (
          <div className="cmp">
            <div className="cmp-bar">
              <div className="cmp-t">
                <button className="cmp-back" onClick={() => go('components')}><span className="material-symbols-rounded" aria-hidden="true">arrow_back</span>{t('Компоненты')}</button>
                <b>{CMP_TITLE[page]}</b>
              </div>
              <Seg label={t('Раздел')} value={v} options={[['editor', t('Редактор')], ['docs', t('Документация')]]} onChange={nv => go(page, nv)} />
            </div>
            {v === 'editor'
              ? (page === 'menu' ? <MenuEditor lang={lang} /> : page === 'animo' ? <LogoEditor /> : page === 'toggle' ? <ToggleEditor /> : page === 'check' ? <CheckboxEditor /> : <SliderEditor key={page} kind={page} />)
              : <main className="docs page"><Markdown key={lang + page} source={DOCS[page][lang]} /></main>}
          </div>
        )}
      </div>
    );
  }

  return (
    <LangCtx.Provider value={lang}>
      <div className={`site site--${shown.page}`}>
        <ParzMenu
          items={items} value={navValue} onChange={id => go(id as Page)} locale={lang}
          actions={[{ id: 'lang', ariaLabel: `${t('Язык')}: ${lang.toUpperCase()}`, icon: 'ms:translate', badge: lang.toUpperCase() }]}
          onAction={nextLang}
          desktop={{ breakpoint: 900, logo: <ParzBrand onClick={() => go('home')} />, search: 'expand', searchWidth: 300, searchShortcut: '/', actionsAlign: 'end', ...search }}
          mobileSearch={search}
        />

        {query.trim() && (
          <div className="pz-hits" role="listbox" aria-label={t('Поиск компонентов')}>
            {hits.length ? hits.map(h => (
              <button key={h.page + h.view} role="option" aria-selected="false" className="pz-hit" onMouseDown={e => e.preventDefault()} onClick={() => pick(h)}>
                <span className="material-symbols-rounded" aria-hidden="true">{h.icon}</span>
                <span><b>{h.title}</b><small>{h.sub}</small></span>
              </button>
            )) : <p className="pz-hit-none">{t('Ничего не нашлось')}</p>}
          </div>
        )}
        {view}
        {lang === 'hy' && <TranslationNote lang={lang} />}
      </div>
      {splash && <Splash onLeave={() => setRevealed(true)} onDone={() => setSplash(false)} />}
    </LangCtx.Provider>
  );
}

/* ---------- скелетоны: форма будущей страницы, пока она «загружается» ---------- */
function Skeleton({ route }: { route: Route }) {
  const b = (cls: string, k?: number) => <span key={k} className={`sk ${cls}`} />;
  const cmp = isCmp(route.page);
  return (
    <div className="pz-view pz-skel" aria-busy="true" aria-live="polite">
      {cmp && <div className="cmp-bar sk-bar">{b('sk-title')}{b('sk-seg')}</div>}
      {cmp && route.view === 'editor' && (
        <div className="sk-ed">
          <div className="sk-side">{[0, 1, 2, 3, 4, 5, 6].map(i => b(i % 3 === 0 ? 'sk-h' : 'sk-line', i))}</div>
          <div className="sk-stage">{b('sk-seg')}{b('sk-device')}</div>
        </div>
      )}
      {((cmp && route.view === 'docs') || route.page === 'changelog') && (
        <div className="sk-doc">{b('sk-h1')}{[0, 1, 2, 3, 4, 5, 6, 7, 8].map(i => b(i === 4 ? 'sk-block' : 'sk-line', i))}</div>
      )}
      {!cmp && route.page !== 'changelog' && (
        <div className="sk-grid-wrap">
          {route.page === 'home' && <div className="sk-hero">{b('sk-logo')}{b('sk-h1')}{b('sk-line sk-c')}</div>}
          {route.page !== 'home' && <div className="sk-head">{b('sk-h1')}{b('sk-line')}</div>}
          <div className={`sk-grid${route.page === 'brand' ? ' sk-grid--3' : ''}`}>
            {Array.from({ length: route.page === 'brand' ? 6 : 2 }, (_, i) => (
              <div key={i} className="sk-card">{b('sk-media')}<div className="sk-card-b">{b('sk-h')}{b('sk-line')}{b('sk-line sk-short')}</div></div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- каталог: из него собираются и главная, и страница Components ---------- */
type Entry = { id: Cmp; title: string; desc: string; tags: string[]; demo: (lang: Lang) => ReactNode };
function MenuDemo({ lang }: { lang: Lang }) {
  const t = (k: string) => tr(lang, k);
  const [demo, setDemo] = useState('garage');
  const [panel, setPanel] = useState<string | null>(null);
  return (
    <ParzMenu position="static" locale={lang}
      items={[
        { id: 'garage', label: t('Гараж'), icon: 'ms:directions_car' },
        { id: 'parts', label: t('Запчасти'), icon: 'ms:settings', badge: 2 },
        { id: 'map', label: t('Карта'), icon: 'pin', badge: 'dot' }
      ]}
      value={panel ?? demo} onChange={id => { setPanel(null); setDemo(id); }}
      actions={[{ id: 'notif', ariaLabel: t('Уведомления'), icon: 'bell', badge: 'dot' }, { id: 'profile', ariaLabel: t('Профиль'), avatar: { text: 'A' } }]}
      activeAction={panel} onAction={id => setPanel(p => (p === id ? null : id))} />
  );
}
function ToggleDemo({ lang }: { lang: Lang }) {
  const [a, setA] = useState(true);
  const [b, setB] = useState(false);
  return (
    <div className="card-demo card-demo--toggle">
      <div className="tg-row">
        <ParzToggle size="lg" checked={a} onChange={setA} ariaLabel="Wi-Fi" />
        <ParzToggle size="lg" checked={b} onChange={setB} ariaLabel="Bluetooth" accent="#7aa7ff" />
      </div>
      <small>{tr(lang, 'Нажмите или потяните')}</small>
    </div>
  );
}
function CheckDemo({ lang }: { lang: Lang }) {
  const t = (k: string) => tr(lang, k);
  const [l, setL] = useState([true, false]);
  const all = l.every(Boolean), some = l.some(Boolean);
  return (
    <div className="card-demo card-demo--check">
      <div className="cb-col">
        <ParzCheckbox size="lg" checked={all} indeterminate={some && !all} onChange={v => setL([v, v])} label={t('Выбрать все')} />
        <div className="cb-sub">
          {l.map((v, i) => <ParzCheckbox key={i} checked={v} onChange={nv => setL(x => x.map((y, j) => (j === i ? nv : y)))} label={i ? t('Уведомления') : t('Фильтры')} />)}
        </div>
      </div>
    </div>
  );
}
function SliderDemo({ lang }: { lang: Lang }) {
  const [v, setV] = useState(64);
  return (
    <div className="card-demo card-demo--slider">
      <div className="sl-demo"><ParzSlider value={v} onChange={setV} size="lg" label={tr(lang, 'Громкость')} formatValue={x => `${x}%`} /></div>
      <small>{tr(lang, 'Потяните бегунок')}</small>
    </div>
  );
}
function RangeDemo({ lang }: { lang: Lang }) {
  const [v, setV] = useState([20, 70]);
  return (
    <div className="card-demo card-demo--range">
      <div className="sl-demo"><ParzRange value={v} onChange={setV} step={5} marks size="lg" accent="#7aa7ff" label={tr(lang, 'Цена')} formatValue={x => `${x * 100} ₽`} /></div>
      <small>{tr(lang, 'Потяните бегунок')}</small>
    </div>
  );
}
const CATALOG: Entry[] = [
  {
    id: 'menu', title: 'Parz Menu', tags: ['Navigation', 'Header', 'Search'],
    desc: 'Навигация, где подсветка перетекает каплей, кнопки пружинят, а на компьютере меню становится шапкой с поиском.',
    demo: lang => <div className="card-demo card-demo--menu"><MenuDemo lang={lang} /></div>
  },
  {
    id: 'animo', title: 'AnimoLogo', tags: ['Branding', 'Text', 'Motion'],
    desc: 'Живой логотип-надпись: буквы выплывают, ловят волну при наведении и загораются, если их удержать.',
    demo: lang => <div className="card-demo card-demo--logo"><AnimoLogo text="PARZ" size={46} /><small>{tr(lang, 'Наведите или зажмите')}</small></div>
  },
  {
    id: 'toggle', title: 'Parz Toggle', tags: ['Forms', 'Switch', 'Motion'],
    desc: 'Переключатель с жидким бегунком: он тянется, сплющивается и мягко перелетает. Можно нажать, потянуть или включить с клавиатуры.',
    demo: lang => <ToggleDemo lang={lang} />
  },
  {
    id: 'check', title: 'Parz Checkbox', tags: ['Forms', 'Checkbox', 'Motion'],
    desc: 'Флажок, в котором цвет растекается каплей, а галочка дорисовывается штрихом. Есть «частично выбрано» и состояние ошибки.',
    demo: lang => <CheckDemo lang={lang} />
  },
  {
    id: 'slider', title: 'Parz Slider', tags: ['Forms', 'Slider', 'Motion'],
    desc: 'Ползунок, у которого бегунок тянется по скорости движения, а заливка догоняет его с мягкой пружиной.',
    demo: lang => <SliderDemo lang={lang} />
  },
  {
    id: 'range', title: 'Parz Range', tags: ['Forms', 'Range', 'Filter'],
    desc: 'Ползунок промежутка: от 2 до 5 бегунков на одной дорожке — цена «от и до», часы работы и другие интервалы.',
    demo: lang => <RangeDemo lang={lang} />
  }
];
function ComponentCard({ e, lang, go, i }: { e: Entry; lang: Lang; go: Go; i: number }) {
  const t = (k: string) => tr(lang, k);
  return (
    <article className="card-c" style={{ '--i': i } as React.CSSProperties}>
      {e.demo(lang)}
      <div className="card-b">
        <div className="card-tags">{e.tags.map(x => <span key={x}>{x}</span>)}</div>
        <h2>{e.title}</h2>
        <p>{t(e.desc)}</p>
        <div className="card-a"><button className="pri" onClick={() => go(e.id)}>{t('Открыть редактор')}</button><button onClick={() => go(e.id, 'docs')}>{t('Документация')}</button></div>
      </div>
    </article>
  );
}

const CHANGES: Record<Lang, string> = { en: changesEn, ru: changesRu, hy: changesHy };
/* ---------- плашка: армянский перевод сделан ИИ, возможны неточности. Сворачивается в кружок, но не исчезает ---------- */
const NOTE_KEY = 'pz-hy-note';
function TranslationNote({ lang }: { lang: Lang }) {
  const t = (k: string) => tr(lang, k);
  const [open, setOpen] = useState(() => { try { return localStorage.getItem(NOTE_KEY) !== 'min'; } catch { return true; } });
  const toggle = (v: boolean) => { setOpen(v); try { localStorage.setItem(NOTE_KEY, v ? 'open' : 'min'); } catch { /* нет хранилища */ } };
  return (
    <aside className={`pz-note${open ? ' is-open' : ''}`} role="note" aria-label={t('О переводе')}>
      <button className="pz-note-dot" onClick={() => toggle(true)} aria-label={t('О переводе')} aria-expanded={open} tabIndex={open ? -1 : 0}>
        <span className="material-symbols-rounded" aria-hidden="true">translate</span>
      </button>
      <div className="pz-note-body" aria-hidden={!open}>
        <span className="pz-note-ic" aria-hidden="true"><span className="material-symbols-rounded">translate</span></span>
        <div>
          <b>{t('О переводе')}</b>
          <p>{t('Армянская версия документации может содержать ошибки перевода — некоторые термины не имеют точного перевода.')}</p>
          <p className="pz-note-ai"><span className="material-symbols-rounded" aria-hidden="true">auto_awesome</span>{t('Перевод сгенерирован с помощью CarPark AI NEO')}</p>
        </div>
        <button className="pz-note-x" onClick={() => toggle(false)} aria-label={t('Свернуть')} tabIndex={open ? 0 : -1}>
          <span className="material-symbols-rounded" aria-hidden="true">close</span>
        </button>
      </div>
    </aside>
  );
}

function Footer({ lang }: { lang: Lang }) {
  return (
    <footer className="pz-foot">
      <span>Parz UI <a className="pz-foot-v" href="#/changelog">v{pkg.version}</a></span>
      <span><a href="#/changelog">{tr(lang, 'Что нового')}</a> · {tr(lang, 'Сделано командой')} CarPark Team &amp; Dev.CarPark · © 2026</span>
    </footer>
  );
}

const INSTALL = 'npm install @carparkteam/parz-ui';
const UPDATE = 'npm update @carparkteam/parz-ui';
function InstallCmd({ lang, cmd = INSTALL }: { lang: Lang; cmd?: string }) {
  const [copied, setCopied] = useState(false);
  const t = useRef(0);
  const copy = async () => {
    // сначала мгновенное копирование прямо в момент клика, если не вышло — через Clipboard API
    const ta = document.createElement('textarea');
    ta.value = cmd; ta.setAttribute('readonly', ''); ta.style.cssText = 'position:fixed;top:0;opacity:0';
    document.body.appendChild(ta); ta.select();
    let ok = false;
    try { ok = document.execCommand('copy'); } catch { /* нет поддержки */ }
    ta.remove();
    if (!ok) { try { await navigator.clipboard.writeText(cmd); } catch { return; /* буфер недоступен */ } }
    setCopied(true); window.clearTimeout(t.current); t.current = window.setTimeout(() => setCopied(false), 1600);
  };
  return (
    <div className="hero-cmd">
      <code><span aria-hidden="true">$</span> {cmd}</code>
      <button onClick={copy} className={copied ? 'is-done' : ''} aria-label={tr(lang, 'Скопировать')}>
        <span className="material-symbols-rounded" aria-hidden="true">{copied ? 'check' : 'content_copy'}</span>
        <span className="hero-cmd-l">{copied ? tr(lang, 'Скопировано') : tr(lang, 'Скопировать')}</span>
      </button>
    </div>
  );
}

function Home({ lang, go, revealed = true }: { lang: Lang; go: Go; revealed?: boolean }) {
  const t = (k: string) => tr(lang, k);
  const [replay, setReplay] = useState(0);
  return (
    <main className="page home">
      <section className="hero">
        <button className="hero-logo" onClick={() => setReplay(r => r + 1)} aria-label={t('Повторить появление')}><ParzLogo replay={replay * 2 + (revealed ? 1 : 0)} /></button>
        <h1>{t('React-компоненты с жидкой анимацией')}</h1>
        <p>{t('Живые, упругие и плавные детали интерфейса. Каждый компонент настраивается в редакторе и сразу даёт готовый код.')}</p>
        <p className="hero-by">Crafted by <b>CarPark Team</b> &amp; <b>Dev.CarPark</b></p>
        <InstallCmd lang={lang} />
        <button className="hero-ver" onClick={() => go('changelog')}>
          <span className="hero-ver-n">v{pkg.version}</span>{t('Что нового')}<span className="material-symbols-rounded" aria-hidden="true">arrow_forward</span>
        </button>
        <div className="hero-a"><button className="pri" onClick={() => go('components')}>{t('Все компоненты')}</button><button onClick={() => go('brand')}>{t('Логотипы')}</button></div>
      </section>

      <section className="sec-h"><h2>{t('Компоненты')}</h2><button onClick={() => go('components')}>{t('Смотреть все')} <span className="material-symbols-rounded" aria-hidden="true">arrow_forward</span></button></section>
      <section className="cards" aria-label={t('Компоненты')}>
        {CATALOG.map((e, i) => <ComponentCard key={e.id} e={e} lang={lang} go={go} i={i} />)}
      </section>

      <section className="teaser">
        <div><h2>{t('Логотипы Parz UI')}</h2><p>{t('Светлый, тёмный, адаптивный, анимированный и иконка — в SVG.')}</p></div>
        <button onClick={() => go('brand')}>{t('Открыть логопак')}</button>
      </section>
      <Footer lang={lang} />
    </main>
  );
}

function ComponentsPage({ lang, go }: { lang: Lang; go: Go }) {
  const t = (k: string, v?: Record<string, string | number>) => tr(lang, k, v);
  return (
    <main className="page comps">
      <section className="brand-h">
        <h1>{t('Компоненты')}</h1>
        <p>{t('Все компоненты Parz UI. Потрогайте живое превью, откройте редактор, настройте под себя и скопируйте код.')}</p>
        <span className="comps-n">{t('{n} компонента', { n: CATALOG.length })}</span>
      </section>
      <section className="cards cards--all" aria-label={t('Компоненты')}>
        {CATALOG.map((e, i) => <ComponentCard key={e.id} e={e} lang={lang} go={go} i={i} />)}
        <article className="card-soon" style={{ '--i': CATALOG.length } as React.CSSProperties}>
          <span className="material-symbols-rounded" aria-hidden="true">auto_awesome</span>
          <b>{t('Скоро новые компоненты')}</b>
          <p>{t('Мы собираем следующие детали интерфейса — они появятся здесь.')}</p>
        </article>
      </section>
      <Footer lang={lang} />
    </main>
  );
}

function BrandPage({ lang }: { lang: Lang }) {
  const t = (k: string) => tr(lang, k);
  const [replay, setReplay] = useState(0);
  return (
    <main className="page brand-p">
      <section className="brand-h">
        <h1>{t('Логотипы Parz UI')}</h1>
        <p>{t('Все варианты из PARZ-UI-Logo-Pack. Адаптивный сам меняет цвет под светлую и тёмную тему.')}</p>
        <a className="dl" href="./brand/PARZ-UI-Logo-Pack.zip" download>{t('Скачать весь пакет (ZIP)')}</a>
      </section>
      <div className="variants">
        {VARIANTS.map((v, i) => (
          <figure key={v.file} className={`var var--${v.bg}${v.name === 'Icon' ? ' var--icon' : ''}`} style={{ '--i': i } as React.CSSProperties}>
            <div className="var-img">
              {v.name === 'Animated'
                ? <button className="var-replay" onClick={() => setReplay(r => r + 1)} aria-label={t('Повторить появление')}><img key={replay} src={`./brand/${v.file}`} alt="PARZ UI animated" /></button>
                : <img src={`./brand/${v.file}`} alt={`PARZ UI ${v.name}`} />}
            </div>
            <figcaption><span><b>{v.name}</b><small>{v.file}</small></span><a href={`./brand/${v.file}`} download>SVG</a></figcaption>
          </figure>
        ))}
      </div>
      <Footer lang={lang} />
    </main>
  );
}
