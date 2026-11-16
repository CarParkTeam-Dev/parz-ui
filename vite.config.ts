import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { parzDefine } from './vite.shared';

// Площадка Parz UI для разработчиков: компоненты с редакторами и документацией + Changelog (npm run dev).
// Полный сайт dev.carpark.am/parz-ui собирается отдельно, из private-site/ (её нет в публичном репозитории).
export default defineConfig({ plugins: [react()], define: parzDefine, base: './', server: { port: 5280 }, build: { outDir: 'build' } });
