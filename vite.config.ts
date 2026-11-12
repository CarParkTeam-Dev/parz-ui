import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Площадка Parz UI для разработчиков: компоненты с редакторами и документацией + Changelog (npm run dev).
// Полный сайт dev.carpark.am/parz-ui собирается отдельно, из private-site/ (её нет в публичном репозитории).
export default defineConfig({ plugins: [react()], base: './', server: { port: 5280 }, build: { outDir: 'build' } });
