#!/usr/bin/env node
/**
 * Выпуск новой версии Parz UI одной командой.
 *
 *   npm run release -- patch            исправления          1.0.1 → 1.0.2
 *   npm run release -- minor            новые возможности    1.0.1 → 1.1.0
 *   npm run release -- major            ломающие изменения   1.1.0 → 2.0.0
 *
 * Сначала пробная версия (pre-release), потом настоящая:
 *   npm run release -- minor --beta     пробная              1.0.1 → 1.1.0-beta.0
 *   npm run release -- minor --beta     ещё одна пробная     1.1.0-beta.0 → 1.1.0-beta.1
 *   npm run release -- minor            настоящий выпуск     1.1.0-beta.1 → 1.1.0
 *
 *   добавьте --dry-run, чтобы только посмотреть, что будет, ничего не меняя
 *
 * Обычный выпуск: раздел «## Unreleased» в CHANGELOG*.md становится разделом новой версии с датой,
 * версия поднимается, пакет проверяется и собирается, делаются коммит и тег, публикация в npm (метка latest),
 * отправка на GitHub и черновик GitHub Release в браузере.
 *
 * Пробный выпуск (--beta): CHANGELOG не трогается — «Unreleased» копится до настоящего выпуска.
 * В npm он уходит с меткой next: `npm install` его НЕ ставит, попробовать можно так:
 *   npm install @carparkteam/parz-ui@next
 * На GitHub черновик открывается сразу с отметкой Pre-release. Сайт для пробных версий не перезаливаем.
 */
import { execSync, spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

const LANGS = [['en', 'CHANGELOG.md'], ['ru', 'CHANGELOG.ru.md'], ['hy', 'CHANGELOG.hy.md']];
const args = process.argv.slice(2);
const bump = args.find(a => ['patch', 'minor', 'major'].includes(a));
const beta = args.includes('--beta');
const dry = args.includes('--dry-run');

const say = m => console.log(`\x1b[32m›\x1b[0m ${m}`);
const warn = m => console.warn(`\x1b[33m! ${m}\x1b[0m`);
const fail = m => { console.error(`\x1b[31m✖ ${m}\x1b[0m`); process.exit(1); };
const sh = c => execSync(c, { encoding: 'utf8' }).trim();
const run = (c, why) => { say(why); if (spawnSync(c, { stdio: 'inherit', shell: true }).status !== 0) fail(`Не получилось: ${c}`); };

if (!bump) fail('Укажите тип выпуска: npm run release -- patch | minor | major  (+ --beta для пробной версии, --dry-run для пробы)');

// 1. Git: ветка main, всё закоммичено
const branch = sh('git rev-parse --abbrev-ref HEAD');
if (branch !== 'main') fail(`Выпускать можно только из ветки main, сейчас: ${branch}`);
const dirty = sh('git status --porcelain');
if (dirty && !dry) fail(`Есть незакоммиченные изменения — сначала git add и git commit:\n${dirty}`);

// 2. Новая версия
const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
const [core, pre] = pkg.version.split('-');
const [ma, mi, pa] = core.split('.').map(Number);
const preN = pre?.startsWith('beta.') ? Number(pre.slice(5)) : null; // текущая пробная: 1.1.0-beta.N
const target = bump === 'major' ? `${ma + 1}.0.0` : bump === 'minor' ? `${ma}.${mi + 1}.0` : `${ma}.${mi}.${pa + 1}`;
let next;
if (preN !== null) {
  // сейчас пробная версия: тип уже выбран при первой пробной — её основа и есть следующий выпуск
  next = beta ? `${core}-beta.${preN + 1}` : core;
  if (target !== core && bump) say(`Сейчас пробная ${pkg.version} — продолжаю её линию (${core}), тип «${bump}» учтён при первой пробной.`);
} else {
  next = beta ? `${target}-beta.0` : target;
}
const tag = `v${next}`;
if (sh(`git tag --list ${tag}`)) fail(`Тег ${tag} уже есть`);
const now = new Date(); // дата по местному времени, а не UTC
const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

// 3. CHANGELOG: раздел Unreleased → раздел версии (у пробной версии CHANGELOG не меняется)
const UNRELEASED = /^## Unreleased[ \t]*\r?\n([\s\S]*?)(?=^## |(?![\s\S]))/m;
const notes = {};
const updated = {};
for (const [lang, file] of LANGS) {
  const src = readFileSync(file, 'utf8');
  const m = src.match(UNRELEASED);
  if (!m) fail(`В ${file} нет раздела «## Unreleased»`);
  const body = m[1].trim();
  notes[lang] = body;
  if (lang === 'en' && !body.replace(/^###.*$/gm, '').trim()) fail('В CHANGELOG.md раздел «## Unreleased» пуст — опишите, что изменилось');
  if (!body) warn(`В ${file} раздел Unreleased пуст — перевод не обновлён`);
  if (!beta) updated[file] = src.replace(UNRELEASED, `## Unreleased\n\n## ${next} — ${date}\n\n${body ? body + '\n\n' : ''}`);
}

say(`${beta ? 'Пробный выпуск' : 'Выпуск'} ${pkg.name}: ${pkg.version} → ${next}`);
console.log(`\n${notes.en}\n`);

if (dry) {
  say('Пробный запуск (--dry-run): файлы не менялись, ничего не опубликовано.');
  say(beta
    ? `Будет: package.json → ${next}, проверка и сборка, коммит и тег ${tag}, npm publish --tag next, git push, черновик Pre-release на GitHub. CHANGELOG не меняется.`
    : `Будет: CHANGELOG → «## ${next} — ${date}», package.json → ${next}, проверка и сборка, коммит и тег ${tag}, npm publish, git push, черновик GitHub Release.`);
  if (dirty) warn('Сейчас есть незакоммиченные изменения — настоящий выпуск попросит сначала их закоммитить.');
  process.exit(0);
}

// 4. Файлы, проверка, сборка
for (const f in updated) writeFileSync(f, updated[f]);
run(`npm version ${next} --no-git-tag-version`, 'Поднимаю версию в package.json');
run('npm run typecheck', 'Проверяю типы');
run('npm run build:lib', 'Собираю пакет');

// 5. Коммит и тег
run(`git add -A && git commit -m "Release ${tag}" && git tag -a ${tag} -m "Parz UI ${tag}"`, `Коммит и тег ${tag}`);

// 6. npm: пробная — с меткой next, чтобы обычный npm install её не ставил
const pub = spawnSync(beta ? 'npm publish --tag next' : 'npm publish', { stdio: 'inherit', shell: true });
if (pub.status !== 0) {
  fail(`npm publish не прошёл. Коммит и тег ${tag} уже есть локально.\n  Исправьте причину и выполните: npm publish${beta ? ' --tag next' : ''}  затем  git push --follow-tags`);
}

// 7. GitHub
run('git push --follow-tags', 'Отправляю коммит и тег на GitHub');

// 8. Черновик GitHub Release — откроется в браузере, останется нажать «Publish release»
const repo = (pkg.repository?.url || '').replace(/^git\+/, '').replace(/\.git$/, '');
if (repo.startsWith('https://github.com/')) {
  const install = beta ? `npm install ${pkg.name}@next` : `npm update ${pkg.name}`;
  const q = new URLSearchParams({ tag, title: `Parz UI ${tag}`, body: `${notes.en}\n\n\`\`\`bash\n${install}\n\`\`\`` });
  if (beta) q.set('prerelease', '1');
  const url = `${repo}/releases/new?${q}`;
  // без командной строки: в Windows cmd обрезает адрес на символе &, и до GitHub доходил только тег
  const opener = process.platform === 'win32' ? ['rundll32', ['url.dll,FileProtocolHandler', url]]
    : process.platform === 'darwin' ? ['open', [url]] : ['xdg-open', [url]];
  spawnSync(opener[0], opener[1], { stdio: 'ignore' });
  say(`Черновик GitHub ${beta ? 'Pre-release' : 'Release'} открыт в браузере — проверьте и нажмите «Publish release».\n  Если не открылся: ${repo}/releases/new?tag=${tag}`);
}
say(beta
  ? `Готово: ${pkg.name}@${next} в npm с меткой next. Попробовать: npm install ${pkg.name}@next`
  : `Готово: ${pkg.name}@${next} в npm и на GitHub. Не забудьте собрать и залить сайт: npm run build:site`);
