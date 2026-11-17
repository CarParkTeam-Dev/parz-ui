import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { ParzMenu, AnimoLogo, ParzToggle, ParzCheckbox, ParzSlider, ParzRange, ParzButton, ParzProgress, ParzBadge, ParzVideo, ParzTabs, ParzExpander, ParzDays, ParzAvatar, ParzAvatarGroup, ParzColorPicker, type TabItem } from '../lib';
import { MenuEditor, Seg } from './App';
import { LogoEditor } from './LogoEditor';
import { ToggleEditor } from './ToggleEditor';
import { CheckboxEditor } from './CheckboxEditor';
import { ButtonEditor } from './ButtonEditor';
import { ProgressEditor } from './ProgressEditor';
import { BadgeEditor } from './BadgeEditor';
import { SliderEditor } from './SliderEditor';
import { TabsEditor } from './TabsEditor';
import { ExpanderEditor } from './ExpanderEditor';
import { DaysEditor } from './DaysEditor';
import { AvatarEditor } from './AvatarEditor';
import { ColorEditor } from './ColorEditor';
import { VideoEditor, DEMO_CLIP, useVideoLabels, usePoster } from './VideoEditor';
import { Markdown } from './Markdown';
import { ChangelogPage } from './Changelog';
import { UpdateCheck } from './UpdateCheck';
import { ParzBrand, Splash } from './Brand';
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
import buttonEn from '../../docs/parz-button.en.md?raw';
import buttonRu from '../../docs/parz-button.ru.md?raw';
import buttonHy from '../../docs/parz-button.hy.md?raw';
import progressEn from '../../docs/parz-progress.en.md?raw';
import progressRu from '../../docs/parz-progress.ru.md?raw';
import progressHy from '../../docs/parz-progress.hy.md?raw';
import badgeEn from '../../docs/parz-badge.en.md?raw';
import badgeRu from '../../docs/parz-badge.ru.md?raw';
import badgeHy from '../../docs/parz-badge.hy.md?raw';
import videoEn from '../../docs/parz-video.en.md?raw';
import videoRu from '../../docs/parz-video.ru.md?raw';
import videoHy from '../../docs/parz-video.hy.md?raw';
import sliderEn from '../../docs/parz-slider.en.md?raw';
import sliderRu from '../../docs/parz-slider.ru.md?raw';
import sliderHy from '../../docs/parz-slider.hy.md?raw';
import tabsEn from '../../docs/parz-tabs.en.md?raw';
import tabsRu from '../../docs/parz-tabs.ru.md?raw';
import tabsHy from '../../docs/parz-tabs.hy.md?raw';
import expEn from '../../docs/parz-expander.en.md?raw';
import expRu from '../../docs/parz-expander.ru.md?raw';
import expHy from '../../docs/parz-expander.hy.md?raw';
import daysEn from '../../docs/parz-days.en.md?raw';
import daysRu from '../../docs/parz-days.ru.md?raw';
import daysHy from '../../docs/parz-days.hy.md?raw';
import avatarEn from '../../docs/parz-avatar.en.md?raw';
import avatarRu from '../../docs/parz-avatar.ru.md?raw';
import avatarHy from '../../docs/parz-avatar.hy.md?raw';
import colorEn from '../../docs/parz-color-picker.en.md?raw';
import colorRu from '../../docs/parz-color-picker.ru.md?raw';
import colorHy from '../../docs/parz-color-picker.hy.md?raw';
import changesEn from '../../CHANGELOG.md?raw';
import changesRu from '../../CHANGELOG.ru.md?raw';
import changesHy from '../../CHANGELOG.hy.md?raw';
import pkg from '../../package.json';

type Page = 'home' | 'components' | 'menu' | 'animo' | 'toggle' | 'check' | 'button' | 'progress' | 'badge' | 'video' | 'slider' | 'range' | 'tabs' | 'expander' | 'days' | 'avatar' | 'color' | 'brand' | 'changelog';
type Cmp = 'menu' | 'animo' | 'toggle' | 'check' | 'button' | 'progress' | 'badge' | 'video' | 'slider' | 'range' | 'tabs' | 'expander' | 'days' | 'avatar' | 'color';
const CMP_TITLE: Record<Cmp, string> = { menu: 'Parz Menu', animo: 'AnimoLogo', toggle: 'Parz Toggle', check: 'Parz Checkbox', button: 'Parz Button', progress: 'Parz Progress', badge: 'Parz Badge', video: 'Parz Video', slider: 'Parz Slider', range: 'Parz Range', tabs: 'Parz Tabs', expander: 'Parz Expander', days: 'Parz Days', avatar: 'Parz Avatar', color: 'Parz Color Picker' };
const isCmp = (p: Page): p is Cmp => p in CMP_TITLE;
type View = 'editor' | 'docs';
type Route = { page: Page; view: View };
export type Go = (p: Page, v?: View) => void;
export type { Page, Lang };
const SLUG: Record<Page, string> = { home: '', components: 'components', menu: 'parz-menu', animo: 'animologo', toggle: 'parz-toggle', check: 'parz-checkbox', button: 'parz-button', progress: 'parz-progress', badge: 'parz-badge', video: 'parz-video', slider: 'parz-slider', range: 'parz-range', tabs: 'parz-tabs', expander: 'parz-expander', days: 'parz-days', avatar: 'parz-avatar', color: 'parz-color-picker', brand: 'brand', changelog: 'changelog' };
const DOCS: Record<Cmp, Record<Lang, string>> = {
  menu: { en: menuEn, ru: menuRu, hy: menuHy },
  animo: { en: logoEn, ru: logoRu, hy: logoHy },
  toggle: { en: toggleEn, ru: toggleRu, hy: toggleHy },
  check: { en: checkEn, ru: checkRu, hy: checkHy },
  button: { en: buttonEn, ru: buttonRu, hy: buttonHy },
  progress: { en: progressEn, ru: progressRu, hy: progressHy },
  badge: { en: badgeEn, ru: badgeRu, hy: badgeHy },
  video: { en: videoEn, ru: videoRu, hy: videoHy },
  slider: { en: sliderEn, ru: sliderRu, hy: sliderHy },
  range: { en: sliderEn, ru: sliderRu, hy: sliderHy },
  tabs: { en: tabsEn, ru: tabsRu, hy: tabsHy },
  expander: { en: expEn, ru: expRu, hy: expHy },
  days: { en: daysEn, ru: daysRu, hy: daysHy },
  avatar: { en: avatarEn, ru: avatarRu, hy: avatarHy },
  color: { en: colorEn, ru: colorRu, hy: colorHy }
};
const LANG_KEY = 'ltb-lang';
const WIDE_KEY = 'pz-wide';
/* «широкий просмотр»: сцена редактора занимает всё место справа от настроек; выбор запоминается */
function useWide() {
  const [wide, setWide] = useState(() => { try { return localStorage.getItem(WIDE_KEY) === '1'; } catch { return false; } });
  const setWideKeep = (v: boolean) => { setWide(v); try { localStorage.setItem(WIDE_KEY, v ? '1' : '0'); } catch { /* нет хранилища */ } };
  return { wide, setWideKeep };
}

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
  { page: 'button', view: 'editor', title: 'Parz Button', icon: 'smart_button', words: 'parz button btn cta submit action click loading ripple icon кнопка нажать отправить загрузка капля иконка կոճակ սեղմել ուղարկել բեռնում' },
  { page: 'button', view: 'docs', title: 'Parz Button', icon: 'description', words: 'parz button docs props api документация пропсы кнопка կոճակ փաստաթղթեր' },
  { page: 'progress', view: 'editor', title: 'Parz Progress', icon: 'progress_activity', words: 'parz progress bar ring loader loading upload percent spinner прогресс полоса кольцо загрузка процент индикатор спиннер առաջընթաց բեռնում տոկոս ցուցիչ' },
  { page: 'progress', view: 'docs', title: 'Parz Progress', icon: 'description', words: 'parz progress docs props api документация пропсы прогресс առաջընթաց փաստաթղթեր' },
  { page: 'badge', view: 'editor', title: 'Parz Badge', icon: 'new_releases', words: 'parz badge tag label chip counter count notification dot new beta status бейдж метка счётчик уведомления точка новое статус пометка պիտակ նշան հաշվիչ ծանուցում կետ նոր' },
  { page: 'badge', view: 'docs', title: 'Parz Badge', icon: 'description', words: 'parz badge docs props api документация пропсы бейдж метка պիտակ փաստաթղթեր' },
  { page: 'video', view: 'editor', title: 'Parz Video', icon: 'smart_display', words: 'parz video player media movie film play pause seek fullscreen volume speed видео плеер фильм ролик смотреть пауза перемотка громкость скорость полный экран տեսանյութ նվագարկիչ ֆիլմ դիտել դադար ոլորում ձայն' },
  { page: 'video', view: 'docs', title: 'Parz Video', icon: 'description', words: 'parz video player docs props api документация пропсы видео плеер տեսանյութ փաստաթղթեր' },
  { page: 'slider', view: 'editor', title: 'Parz Slider', icon: 'linear_scale', words: 'parz slider range input volume value drag ползунок слайдер громкость значение սահիչ ձայն արժեք' },
  { page: 'slider', view: 'docs', title: 'Parz Slider', icon: 'description', words: 'parz slider docs props api документация пропсы ползунок փաստաթղթեր' },
  { page: 'range', view: 'editor', title: 'Parz Range', icon: 'tune', words: 'parz range interval between price filter multi thumbs промежуток диапазон интервал цена фильтр от до несколько միջակայք գին ֆիլտր' },
  { page: 'range', view: 'docs', title: 'Parz Range', icon: 'description', words: 'parz range docs props api документация пропсы промежуток փաստաթղթեր' },
  { page: 'tabs', view: 'editor', title: 'Parz Tabs', icon: 'tab', words: 'parz tabs segmented control switch toggle group radio pill табы вкладки сегменты переключатель выбор ներդիրներ հատվածներ փոխարկիչ' },
  { page: 'tabs', view: 'docs', title: 'Parz Tabs', icon: 'description', words: 'parz tabs segmented docs props api документация пропсы табы вкладки ներդիրներ փաստաթղթեր' },
  { page: 'expander', view: 'editor', title: 'Parz Expander', icon: 'expand_more', words: 'parz expander accordion collapse collapsible details disclosure section faq экспандер аккордеон раскрыть свернуть секция вопросы ծալվող բացել փակել բաժին' },
  { page: 'expander', view: 'docs', title: 'Parz Expander', icon: 'description', words: 'parz expander accordion docs props api документация пропсы экспандер аккордеон ծալվող փաստաթղթեր' },
  { page: 'days', view: 'editor', title: 'Parz Days', icon: 'calendar_month', words: 'parz days date picker calendar day strip week schedule дата день дни календарь лента неделя выбор даты расписание ամսաթիվ օր օրեր օրացույց շաբաթ' },
  { page: 'days', view: 'docs', title: 'Parz Days', icon: 'description', words: 'parz days date docs props api документация пропсы дата календарь ամսաթիվ փաստաթղթեր' },
  { page: 'avatar', view: 'editor', title: 'Parz Avatar', icon: 'account_circle', words: 'parz avatar avatars user profile photo picture initials status online group team stack story ring аватар аватарка пользователь профиль фото инициалы статус в сети группа команда история кольцо ավատար օգտատեր պրոֆիլ լուսանկար սկզբնատառեր կարգավիճակ խումբ թիմ' },
  { page: 'avatar', view: 'docs', title: 'Parz Avatar', icon: 'description', words: 'parz avatar group docs props api документация пропсы аватар группа ավատար փաստաթղթեր' },
  { page: 'color', view: 'editor', title: 'Parz Color Picker', icon: 'palette', words: 'parz color colour picker palette hue saturation alpha opacity hex rgb hsl eyedropper swatch цвет выбор цвета палитра оттенок насыщенность прозрачность пипетка образцы գույն գունապնակ երանգ թափանցիկություն' },
  { page: 'color', view: 'docs', title: 'Parz Color Picker', icon: 'description', words: 'parz color picker docs props api документация пропсы цвет գույն փաստաթղթեր' },
  { page: 'changelog', view: 'editor', title: 'Changelog', icon: 'history', words: 'changelog what is new whats new release releases update version history что нового изменения обновление версия выпуск история ինչ նոր կա փոփոխություններ թարմացում տարբերակ' },
  { page: 'brand', view: 'editor', title: 'Parz UI', icon: 'palette', words: 'parz logos brand svg zip pack логотипы бренд логопак լոգոներ' }
];
function searchHits(q: string, lang: Lang, has: (p: Page) => boolean): Hit[] {
  const w = q.trim().toLowerCase();
  if (!w) return [];
  return INDEX.filter(h => has(h.page) && (h.title + ' ' + h.words).toLowerCase().includes(w))
    .map(h => ({ ...h, sub: tr(lang, h.page === 'brand' ? 'Логотипы' : h.page === 'changelog' ? 'Что нового' : h.page === 'components' ? 'Все компоненты' : h.view === 'docs' ? 'Документация' : 'Редактор') }));
}

function parseHash(): Route {
  const [p0, v] = location.hash.replace(/^#\/?/, '').split('/');
  const p = p0?.replace(/^liqui-/, 'parz-'); // старые адреса #/liqui-* продолжают работать
  const page = (Object.keys(SLUG) as Page[]).find(k => SLUG[k] === p) ?? 'home';
  return { page, view: v === 'docs' ? 'docs' : 'editor' };
}
const rkey = (r: Route) => (isCmp(r.page) ? `${r.page}/${r.view}` : r.page);

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

/** Дополнительные страницы полного сайта (главная, логотипы). В публичной площадке их нет:
 *  корень открывает список компонентов, в меню — «Компоненты» и «Изменения». */
export type SiteCtx = { lang: Lang; go: Go; revealed: boolean };
export type SiteExtras = {
  home?: (c: SiteCtx) => ReactNode;
  brand?: (c: SiteCtx) => ReactNode;
  /** Проверка обновлений на странице «Что нового». Нужна в площадке у пользователей; на нашем сайте выключаем — он всегда свежий. */
  updateCheck?: boolean;
  /** Блок в шапке «Что нового» вместо проверки обновлений (на нашем сайте — звезда на GitHub). */
  changelogTop?: (lang: Lang) => ReactNode;
};

export function Site({ extras = {} }: { extras?: SiteExtras }) {
  const has = (p: Page) => (p === 'home' ? !!extras.home : p === 'brand' ? !!extras.brand : true);
  const { wide, setWideKeep } = useWide();
  const norm = (r: Route): Route => (has(r.page) ? r : { page: 'components', view: 'editor' });
  const [lang, setLang] = useState<Lang>(() => {
    try { const v = localStorage.getItem(LANG_KEY); if (v === 'en' || v === 'ru' || v === 'hy') return v; } catch { /* нет хранилища */ }
    return 'en';
  });
  useEffect(() => { document.documentElement.lang = lang; try { localStorage.setItem(LANG_KEY, lang); } catch { /* нет хранилища */ } }, [lang]);
  const t = (k: string, v?: Record<string, string | number>) => tr(lang, k, v);

  const [route, setRoute] = useState(() => norm(parseHash()));
  useEffect(() => {
    const on = () => setRoute(norm(parseHash()));
    addEventListener('hashchange', on);
    return () => removeEventListener('hashchange', on);
  }, []);
  const go: Go = (p0, v = 'editor') => {
    const p = has(p0) ? p0 : 'components';
    const h = SLUG[p] ? `#/${SLUG[p]}${v === 'docs' ? '/docs' : ''}` : '#/';
    if (location.hash !== h) location.hash = h; else setRoute({ page: p, view: v });
  };
  const { shown, phase } = useTransition(route);
  // загрузчик — при каждом открытии или перезагрузке сайта, на любой странице; при переходах внутри сайта его нет
  const [splash, setSplash] = useState(true);
  const [revealed, setRevealed] = useState(!splash); // загрузчик ушёл — главная проигрывает свою анимацию заново, уже на виду

  const [query, setQuery] = useState('');
  const hits = useMemo(() => searchHits(query, lang, has), [query, lang]);
  const pick = (h: Hit) => { setQuery(''); go(h.page, h.view); };
  // одна строка на компонент: нажатие ведёт в редактор, кнопка справа — в документацию
  const groups = useMemo(() => {
    const m = new Map<Page, { page: Page; main: Hit; docs?: Hit }>();
    for (const h of hits) {
      const g = m.get(h.page);
      if (!g) m.set(h.page, { page: h.page, main: h, ...(h.view === 'docs' ? { docs: h } : {}) });
      else if (h.view === 'docs') g.docs = h; else { g.main = h; }
    }
    return [...m.values()];
  }, [hits]);
  // список закрывается кликом мимо него и мимо поиска, а также Esc; снова открывается, как только меняется запрос
  const [hitsOpen, setHitsOpen] = useState(true);
  const hitsRef = useRef<HTMLDivElement>(null);
  useEffect(() => { setHitsOpen(true); }, [query]);
  useEffect(() => {
    if (!query.trim()) return;
    const down = (e: PointerEvent) => {
      const el = e.target as Element;
      if (hitsRef.current?.contains(el)) return;
      // нажали в поле поиска — список возвращается; куда угодно ещё — закрывается
      setHitsOpen(!!el.closest?.('.ltb input'));
    };
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') setHitsOpen(false); };
    document.addEventListener('pointerdown', down, true); document.addEventListener('keydown', key);
    return () => { document.removeEventListener('pointerdown', down, true); document.removeEventListener('keydown', key); };
  }, [query]);
  const search = {
    searchPlaceholder: t('Поиск компонентов'), searchValue: query, onSearchChange: setQuery,
    onSearch: () => { if (hits[0]) pick(hits[0]); }
  };
  const nextLang = () => setLang(l => LANGS[(LANGS.findIndex(x => x[0] === l) + 1) % LANGS.length][0]);
  const items: TabItem[] = [
    ...(extras.home ? [{ id: 'home', label: t('Главная'), icon: 'ms:home' }] : []),
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
        {page === 'home' && extras.home?.({ lang, go, revealed })}
        {page === 'components' && <ComponentsPage lang={lang} go={go} />}
        {page === 'brand' && extras.brand?.({ lang, go, revealed })}
        {page === 'changelog' && <ChangelogPage lang={lang} source={CHANGES[lang]} install={<InstallCmd lang={lang} cmd={UPDATE} />} check={extras.updateCheck === false ? extras.changelogTop?.(lang) : <UpdateCheck lang={lang} current={pkg.version} />} footer={<Footer lang={lang} />} official={extras.updateCheck === false} />}
        {isCmp(page) && (
          <div className={`cmp${wide ? ' is-wide' : ''}`}>
            <div className="cmp-bar">
              <div className="cmp-t">
                <button className="cmp-back" onClick={() => go('components')}><span className="material-symbols-rounded" aria-hidden="true">arrow_back</span>{t('Компоненты')}</button>
                <b>{CMP_TITLE[page]}</b>
              </div>
              <div className="cmp-r">
                {v === 'editor' && <ParzToggle className="cmp-wide" size="sm" checked={wide} onChange={setWideKeep} label={t('Широкий просмотр')} />}
                <Seg label={t('Раздел')} value={v} options={[['editor', t('Редактор')], ['docs', t('Документация')]]} onChange={nv => go(page, nv)} />
              </div>
            </div>
            {v === 'editor'
              ? (page === 'menu' ? <MenuEditor lang={lang} /> : page === 'animo' ? <LogoEditor /> : page === 'toggle' ? <ToggleEditor /> : page === 'check' ? <CheckboxEditor /> : page === 'button' ? <ButtonEditor /> : page === 'progress' ? <ProgressEditor /> : page === 'badge' ? <BadgeEditor /> : page === 'video' ? <VideoEditor /> : page === 'tabs' ? <TabsEditor /> : page === 'expander' ? <ExpanderEditor /> : page === 'days' ? <DaysEditor /> : page === 'avatar' ? <AvatarEditor /> : page === 'color' ? <ColorEditor /> : <SliderEditor key={page} kind={page as 'slider' | 'range'} />)
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
          desktop={{ breakpoint: 900, logo: <ParzBrand onClick={() => go(extras.home ? 'home' : 'components')} />, search: 'expand', searchWidth: 300, searchShortcut: '/', actionsAlign: 'end', ...search }}
          mobileSearch={search}
        />

        {query.trim() && hitsOpen && (
          <div className="pz-hits" ref={hitsRef} role="listbox" aria-label={t('Поиск компонентов')}>
            <div className="pz-hits-sc">
              {groups.length ? groups.map(g => (
                <div key={g.page} className="pz-hit" role="option" aria-selected="false">
                  <button className="pz-hit-main" onMouseDown={e => e.preventDefault()} onClick={() => pick(g.main)}>
                    <span className="pz-hit-ico material-symbols-rounded" aria-hidden="true">{g.main.icon}</span>
                    <span className="pz-hit-t"><b>{g.main.title}</b><small>{g.main.sub}</small></span>
                  </button>
                  {g.docs && <button className="pz-hit-doc" onMouseDown={e => e.preventDefault()} onClick={() => pick(g.docs!)} aria-label={`${g.main.title}: ${t('Документация')}`} title={t('Документация')}>
                    <span className="material-symbols-rounded" aria-hidden="true">description</span>
                  </button>}
                </div>
              )) : <p className="pz-hit-none">{t('Ничего не нашлось')}</p>}
            </div>
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
type Cat = 'nav' | 'forms' | 'feedback' | 'media' | 'brand';
type Entry = { id: Cmp; title: string; cat: Cat; desc: string; tags: string[]; demo: (lang: Lang) => ReactNode };
/* категории каталога: у каждого компонента одна */
const CATS: [Cat, string][] = [['nav', 'Навигация'], ['forms', 'Формы'], ['feedback', 'Статус'], ['media', 'Медиа'], ['brand', 'Бренд']];
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
function ButtonDemo({ lang }: { lang: Lang }) {
  const t = (k: string) => tr(lang, k);
  const [busy, setBusy] = useState(false);
  const tm = useRef(0);
  useEffect(() => () => window.clearTimeout(tm.current), []);
  const go = () => { setBusy(true); tm.current = window.setTimeout(() => setBusy(false), 1500); };
  return (
    <div className="card-demo card-demo--button">
      <div className="bt-row">
        <ParzButton loading={busy} onClick={go} iconEnd="ms:arrow_forward">{t('Отправить')}</ParzButton>
        <ParzButton variant="glass" icon="ms:favorite" iconOnly ariaLabel={t('В избранное')} />
      </div>
      <small>{t('Нажмите')}</small>
    </div>
  );
}
function ProgressDemo({ lang }: { lang: Lang }) {
  const [v, setV] = useState(35);
  useEffect(() => {
    const id = window.setInterval(() => setV(x => (x >= 100 ? 12 : Math.min(100, x + 9 + Math.round(Math.random() * 18)))), 1100);
    return () => window.clearInterval(id);
  }, []);
  return (
    <div className="card-demo card-demo--progress">
      <div className="pg-card">
        <ParzProgress value={v} label={tr(lang, 'Загрузка файла')} />
        <div className="pg-card-rings"><ParzProgress variant="ring" value={v} accent="#7aa7ff" /><ParzProgress variant="ring" indeterminate ariaLabel={tr(lang, 'Подождите…')} /></div>
      </div>
    </div>
  );
}
function BadgeDemo({ lang }: { lang: Lang }) {
  const [n, setN] = useState(3);
  useEffect(() => {
    const id = window.setInterval(() => setN(x => (x >= 12 ? 0 : x + 1 + Math.round(Math.random() * 3))), 1300);
    return () => window.clearInterval(id);
  }, []);
  return (
    <div className="card-demo card-demo--badge">
      <div className="bd-card">
        <ParzBadge count={n} ariaLabel={tr(lang, 'Уведомления')}><ParzButton variant="glass" icon="ms:notifications" iconOnly ariaLabel={tr(lang, 'Уведомления')} /></ParzBadge>
        <ParzBadge label={tr(lang, 'Новое')} />
        <ParzBadge label="Beta" variant="soft" color="#7aa7ff" />
        <ParzBadge dot pulse color="#38c172" ariaLabel={tr(lang, 'В сети')} />
      </div>
    </div>
  );
}
function VideoDemo() {
  const labels = useVideoLabels();
  const poster = usePoster();
  return <div className="card-demo card-demo--video"><div className="vd-card"><ParzVideo src={DEMO_CLIP} poster={poster} muted loop radius={14} showSkip={false} previews={false} labels={labels} /></div></div>;
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
function TabsDemo({ lang }: { lang: Lang }) {
  const t = (k: string) => tr(lang, k);
  const [v, setV] = useState('week');
  return (
    <div className="card-demo card-demo--tabs">
      <ParzTabs size="lg" value={v} onChange={setV} ariaLabel={t('Период')} options={[{ value: 'day', label: t('День') }, { value: 'week', label: t('Неделя') }, { value: 'month', label: t('Месяц') }]} />
      <small>{t('Нажмите')}</small>
    </div>
  );
}
function ExpanderDemo({ lang }: { lang: Lang }) {
  const t = (k: string) => tr(lang, k);
  return (
    <div className="card-demo card-demo--expander">
      <div className="ex-card">
        <ParzExpander variant="card" title={t('Доставка')} defaultOpen>{t('Привезём завтра с 10 до 18.')}</ParzExpander>
        <ParzExpander variant="card" title={t('Оплата')}>{t('Картой или наличными при получении.')}</ParzExpander>
      </div>
    </div>
  );
}
const DEMO_TEAM = ['Ani Petrosyan', 'Mark Lee', 'Elena Sokolova', 'David Hakobyan', 'Sara Kim', 'Aram Grigoryan', 'Lina Park'];
function AvatarDemo({ lang }: { lang: Lang }) {
  const t = (k: string) => tr(lang, k);
  const [st, setSt] = useState<'online' | 'away' | 'busy'>('online');
  useEffect(() => { const id = window.setInterval(() => setSt(s => (s === 'online' ? 'away' : s === 'away' ? 'busy' : 'online')), 1800); return () => window.clearInterval(id); }, []);
  return (
    <div className="card-demo card-demo--avatar">
      <ParzAvatar name="Ani Petrosyan" size="lg" status={st} ring ringSpin />
      <ParzAvatarGroup max={4} ariaLabel={t('Команда')}>{DEMO_TEAM.map(n => <ParzAvatar key={n} name={n} />)}</ParzAvatarGroup>
      <small>{t('Наведите на группу')}</small>
    </div>
  );
}
function ColorDemo({ lang }: { lang: Lang }) {
  const [c, setC] = useState('#7a5cff');
  return (
    <div className="card-demo card-demo--color">
      <ParzColorPicker value={c} onChange={setC} mode="popover" label={tr(lang, 'Цвет')} />
      <small>{tr(lang, 'Нажмите на цвет')}</small>
    </div>
  );
}
function DaysDemo({ lang }: { lang: Lang }) {
  const t = (k: string) => tr(lang, k);
  return (
    <div className="card-demo card-demo--days">
      <ParzDays theme="dark" ariaLabel={t('Дата')} locale={lang === 'ru' ? 'ru-RU' : lang === 'hy' ? 'hy-AM' : 'en-US'} />
      <small>{t('Потяните')}</small>
    </div>
  );
}
export const CATALOG: Entry[] = [
  {
    id: 'menu', title: 'Parz Menu', cat: 'nav', tags: ['Navigation', 'Header', 'Search'],
    desc: 'Навигация, где подсветка перетекает каплей, кнопки пружинят, а на компьютере меню становится шапкой с поиском.',
    demo: lang => <div className="card-demo card-demo--menu"><MenuDemo lang={lang} /></div>
  },
  {
    id: 'animo', title: 'AnimoLogo', cat: 'brand', tags: ['Branding', 'Text', 'Motion'],
    desc: 'Живой логотип-надпись: буквы выплывают, ловят волну при наведении и загораются, если их удержать.',
    demo: lang => <div className="card-demo card-demo--logo"><AnimoLogo text="PARZ" size={46} /><small>{tr(lang, 'Наведите или зажмите')}</small></div>
  },
  {
    id: 'toggle', title: 'Parz Toggle', cat: 'forms', tags: ['Forms', 'Switch', 'Motion'],
    desc: 'Переключатель с жидким бегунком: он тянется, сплющивается и мягко перелетает. Можно нажать, потянуть или включить с клавиатуры.',
    demo: lang => <ToggleDemo lang={lang} />
  },
  {
    id: 'check', title: 'Parz Checkbox', cat: 'forms', tags: ['Forms', 'Checkbox', 'Motion'],
    desc: 'Флажок, в котором цвет растекается каплей, а галочка дорисовывается штрихом. Есть «частично выбрано» и состояние ошибки.',
    demo: lang => <CheckDemo lang={lang} />
  },
  {
    id: 'button', title: 'Parz Button', cat: 'forms', tags: ['Forms', 'Button', 'Motion'],
    desc: 'Кнопка, которая мягко поджимается при нажатии, а из точки касания растекается капля. Пять видов, иконки и плавная загрузка.',
    demo: lang => <ButtonDemo lang={lang} />
  },
  {
    id: 'progress', title: 'Parz Progress', cat: 'feedback', tags: ['Feedback', 'Loading', 'Motion'],
    desc: 'Прогресс, который перетекает к новому значению, а не прыгает: полоса или кольцо, режим «неизвестно сколько» и мягкая вспышка на 100%.',
    demo: lang => <ProgressDemo lang={lang} />
  },
  {
    id: 'badge', title: 'Parz Badge', cat: 'feedback', tags: ['Status', 'Counter', 'Motion'],
    desc: 'Метка или счётчик: появляется каплей, цифры перекатываются, а ширина перетекает. Можно поставить отдельно или в угол кнопки, есть точка с пульсом.',
    demo: lang => <BadgeDemo lang={lang} />
  },
  {
    id: 'video', title: 'Parz Video', cat: 'media', tags: ['Media', 'Player', 'Motion'],
    desc: 'Видеоплеер, где панель — жидкое стекло: полоса перемотки течёт плавно, значки перетекают друг в друга, а панель мягко прячется, пока вы смотрите.',
    demo: () => <VideoDemo />
  },
  {
    id: 'slider', title: 'Parz Slider', cat: 'forms', tags: ['Forms', 'Slider', 'Motion'],
    desc: 'Ползунок, у которого бегунок тянется по скорости движения, а заливка догоняет его с мягкой пружиной.',
    demo: lang => <SliderDemo lang={lang} />
  },
  {
    id: 'range', title: 'Parz Range', cat: 'forms', tags: ['Forms', 'Range', 'Filter'],
    desc: 'Ползунок промежутка: от 2 до 5 бегунков на одной дорожке — цена «от и до», часы работы и другие интервалы.',
    demo: lang => <RangeDemo lang={lang} />
  },
  {
    id: 'tabs', title: 'Parz Tabs', cat: 'nav', tags: ['Navigation', 'Segmented', 'Motion'],
    desc: 'Сегментированный переключатель: плашка выбора перетекает к новому пункту каплей — передний край уходит первым, хвост догоняет.',
    demo: lang => <TabsDemo lang={lang} />
  },
  {
    id: 'expander', title: 'Parz Expander', cat: 'nav', tags: ['Layout', 'Accordion', 'Motion'],
    desc: 'Секция, которая плавно раскрывается: высота мягко растекается, содержимое проявляется, стрелка поворачивается с лёгкой пружиной.',
    demo: lang => <ExpanderDemo lang={lang} />
  },
  {
    id: 'days', title: 'Parz Days', cat: 'forms', tags: ['Forms', 'Date', 'Motion'],
    desc: 'Лента дней под неподвижной карточкой: дни едут под ней, как колесо, по инерции, и пружинят на выбранную дату.',
    demo: lang => <DaysDemo lang={lang} />
  },
  {
    id: 'avatar', title: 'Parz Avatar', cat: 'media', tags: ['Profile', 'Group', 'Motion'],
    desc: 'Аватар с фото, инициалами или значком: фото проявляется мягко, статус появляется с пружиной, есть кольцо «историй». Группа стопкой раздвигается при наведении.',
    demo: lang => <AvatarDemo lang={lang} />
  },
  {
    id: 'color', title: 'Parz Color Picker', cat: 'forms', tags: ['Forms', 'Color', 'Motion'],
    desc: 'Выбор цвета с жидким бегунком: на скорости он вытягивается, а при нажатии перелетает пружиной. Оттенок, прозрачность, HEX / RGB / HSL, образцы и пипетка — на странице или во всплывающем окне.',
    demo: lang => <ColorDemo lang={lang} />
  }
];
export function ComponentCard({ e, lang, go, i, reveal }: { e: Entry; lang: Lang; go: Go; i: number; reveal?: boolean }) {
  const t = (k: string) => tr(lang, k);
  return (
    <article className={`card-c${reveal ? ' rv' : ''}`} style={{ '--i': i } as React.CSSProperties}>
      {e.demo(lang)}
      <div className="card-b">
        <div className="card-tags">{e.tags.map(x => <span key={x}>{x}</span>)}</div>
        <h2>{e.title}</h2>
        <p>{t(e.desc)}</p>
        <div className="card-a"><ParzButton size="sm" accent="#6ee7a0" textColor="#04130a" onClick={() => go(e.id)}>{t('Открыть редактор')}</ParzButton><ParzButton size="sm" variant="outline" accent="#e8e8ee" onClick={() => go(e.id, 'docs')}>{t('Документация')}</ParzButton></div>
      </div>
    </article>
  );
}

export const VERSION = pkg.version;
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

export function Footer({ lang }: { lang: Lang }) {
  return (
    <footer className="pz-foot">
      <span>Parz UI <a className="pz-foot-v" href="#/changelog">v{pkg.version}</a></span>
      <span><a href="#/changelog">{tr(lang, 'Что нового')}</a> · {tr(lang, 'Сделано командой')} CarPark Team &amp; Dev.CarPark · © 2026</span>
    </footer>
  );
}

const INSTALL = 'npm install @carparkteam/parz-ui';
const UPDATE = 'npm update @carparkteam/parz-ui';
export function InstallCmd({ lang, cmd = INSTALL }: { lang: Lang; cmd?: string }) {
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

function ComponentsPage({ lang, go }: { lang: Lang; go: Go }) {
  const t = (k: string, v?: Record<string, string | number>) => tr(lang, k, v);
  const [cat, setCat] = useState<'all' | Cat>('all');
  const cats = CATS.filter(([c]) => CATALOG.some(e => e.cat === c));
  const list = cat === 'all' ? CATALOG : CATALOG.filter(e => e.cat === cat);
  return (
    <main className="page comps">
      <section className="brand-h brand-h--wide">
        <h1>{t('Компоненты')}</h1>
        <p>{t('Все компоненты Parz UI. Потрогайте живое превью, откройте редактор, настройте под себя и скопируйте код.')}</p>
        <div className="comps-bar">
          <span className="comps-n">{t('{n} компонента', { n: list.length })}</span>
          <Seg label={t('Категория')} value={cat} onChange={setCat} options={[['all', t('Все'), CATALOG.length] as const, ...cats.map(([c, l]) => [c, t(l), CATALOG.filter(e => e.cat === c).length] as const)]
            .map(([c, l, n]) => [c, <span className="seg-n" key={c}>{l}<ParzBadge count={n} size="sm" variant={c === cat ? 'solid' : 'soft'} color={c === cat ? '#111114' : '#9a9aa6'} ariaLabel={String(n)} /></span>] as ['all' | Cat, ReactNode])} />
        </div>
      </section>
      <section key={cat} className="cards cards--grid cards--all" aria-label={t('Компоненты')}>
        {list.map((e, i) => <ComponentCard key={e.id} e={e} lang={lang} go={go} i={i} />)}
        {cat === 'all' && <article className="card-soon" style={{ '--i': list.length } as React.CSSProperties}>
          <span className="material-symbols-rounded" aria-hidden="true">auto_awesome</span>
          <b>{t('Скоро новые компоненты')}</b>
          <p>{t('Мы собираем следующие детали интерфейса — они появятся здесь.')}</p>
        </article>}
      </section>
      <Footer lang={lang} />
    </main>
  );
}
