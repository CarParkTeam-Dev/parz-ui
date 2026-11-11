import { readFileSync } from 'node:fs';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

/** При сборке сайта кладёт рядом latest.json — его читает проверка обновлений на странице «Что нового».
 *  Версия берётся из package.json, дата — из раздела этой версии в CHANGELOG.md. */
function latestJson(): Plugin {
  return {
    name: 'parz-latest-json',
    apply: 'build',
    generateBundle() {
      const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
      const log = readFileSync('CHANGELOG.md', 'utf8');
      const esc = pkg.version.replace(/\./g, '\\.');
      const date = new RegExp(`^## ${esc} — (\\d{4}-\\d{2}-\\d{2})`, 'm').exec(log)?.[1] ?? new Date().toISOString().slice(0, 10);
      const data = { name: pkg.name, version: pkg.version, date, notes: 'https://dev.carpark.am/parz-ui/#/changelog' };
      this.emitFile({ type: 'asset', fileName: 'latest.json', source: JSON.stringify(data, null, 2) + '\n' });
    }
  };
}

// Площадка: живой редактор + документация (npm run dev). Сайт собирается в site/, чтобы не затирать dist/ библиотеки.
export default defineConfig({ plugins: [react(), latestJson()], base: './', server: { port: 5280 }, build: { outDir: 'site' } });
