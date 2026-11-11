#!/usr/bin/env node
/**
 * Выпуск новой версии Parz UI одной командой.
 *
 *   npm run release -- patch            исправления          1.0.0 → 1.0.1
 *   npm run release -- minor            новые возможности    1.0.1 → 1.1.0
 *   npm run release -- major            ломающие изменения   1.1.0 → 2.0.0
 *   добавьте --dry-run, чтобы только посмотреть, что будет, ничего не меняя
 *
 * Что делает: берёт раздел «## Unreleased» из CHANGELOG*.md и превращает его в раздел новой версии с датой,
 * поднимает версию в package.json, проверяет типы и собирает пакет, делает коммит и тег vX.Y.Z,
 * публикует в npm, отправляет коммит и тег на GitHub и открывает в браузере готовый черновик GitHub Release.
 */
import { execSync, spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

const LANGS = [['en', 'CHANGELOG.md'], ['ru', 'CHANGELOG.ru.md'], ['hy', 'CHANGELOG.hy.md']];
const args = process.argv.slice(2);
const bump = args.find(a => ['patch', 'minor', 'major'].includes(a));
const dry = args.includes('--dry-run');

const say = m => console.log(`\x1b[32m›\x1b[0m ${m}`);
const fail = m => { console.error(`\x1b[31m✖ ${m}\x1b[0m`); process.exit(1); };
const sh = c => execSync(c, { encoding: 'utf8' }).trim();
const run = (c, why) => { say(why); if (spawnSync(c, { stdio: 'inherit', shell: true }).status !== 0) fail(`Не получилось: ${c}`); };

if (!bump) fail('Укажите тип выпуска: npm run release -- patch | minor | major  (и --dry-run для пробы)');

// 1. Git: ветка main, всё закоммичено
const branch = sh('git rev-parse --abbrev-ref HEAD');
if (branch !== 'main') fail(`Выпускать можно только из ветки main, сейчас: ${branch}`);
const dirty = sh('git status --porcelain');
if (dirty && !dry) fail(`Есть незакоммиченные изменения — сначала git add и git commit:\n${dirty}`);

// 2. Новая версия
const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
const [ma, mi, pa] = pkg.version.split('.').map(Number);
const next = bump === 'major' ? `${ma + 1}.0.0` : bump === 'minor' ? `${ma}.${mi + 1}.0` : `${ma}.${mi}.${pa + 1}`;
const tag = `v${next}`;
if (sh(`git tag --list ${tag}`)) fail(`Тег ${tag} уже есть`);
const date = new Date().toISOString().slice(0, 10);

// 3. CHANGELOG: раздел Unreleased → раздел версии
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
  if (!body) console.warn(`\x1b[33m! В ${file} раздел Unreleased пуст — перевод не обновлён\x1b[0m`);
  updated[file] = src.replace(UNRELEASED, `## Unreleased\n\n## ${next} — ${date}\n\n${body ? body + '\n\n' : ''}`);
}

say(`Выпуск ${pkg.name}: ${pkg.version} → ${next} (${bump})`);
console.log(`\n${notes.en}\n`);

if (dry) {
  say('Пробный запуск (--dry-run): файлы не менялись, ничего не опубликовано.');
  say(`Будет: CHANGELOG → «## ${next} — ${date}», package.json → ${next}, проверка и сборка, коммит и тег ${tag}, npm publish, git push, черновик GitHub Release.`);
  if (dirty) console.warn('\x1b[33m! Сейчас есть незакоммиченные изменения — настоящий выпуск попросит сначала их закоммитить.\x1b[0m');
  process.exit(0);
}

// 4. Файлы, проверка, сборка
for (const f in updated) writeFileSync(f, updated[f]);
run(`npm version ${next} --no-git-tag-version`, 'Поднимаю версию в package.json');
run('npm run typecheck', 'Проверяю типы');
run('npm run build:lib', 'Собираю пакет');

// 5. Коммит и тег
run(`git add -A && git commit -m "Release ${tag}" && git tag -a ${tag} -m "Parz UI ${tag}"`, `Коммит и тег ${tag}`);

// 6. npm
const pub = spawnSync('npm publish', { stdio: 'inherit', shell: true });
if (pub.status !== 0) {
  fail(`npm publish не прошёл. Коммит и тег ${tag} уже есть локально.\n  Исправьте причину и выполните: npm publish  затем  git push --follow-tags`);
}

// 7. GitHub
run('git push --follow-tags', 'Отправляю коммит и тег на GitHub');

// 8. Черновик GitHub Release — откроется в браузере, останется нажать «Publish release»
const repo = (pkg.repository?.url || '').replace(/^git\+/, '').replace(/\.git$/, '');
if (repo.startsWith('https://github.com/')) {
  const url = `${repo}/releases/new?tag=${tag}&title=${encodeURIComponent(`Parz UI ${tag}`)}&body=${encodeURIComponent(
    `${notes.en}\n\n\`\`\`bash\nnpm install ${pkg.name}@${next}\n\`\`\``)}`;
  const open = process.platform === 'win32' ? `start "" "${url}"` : process.platform === 'darwin' ? `open "${url}"` : `xdg-open "${url}"`;
  spawnSync(open, { shell: true });
  say(`Черновик GitHub Release открыт в браузере — проверьте и нажмите «Publish release».\n  ${repo}/releases`);
}
say(`Готово: ${pkg.name}@${next} в npm и на GitHub.`);
