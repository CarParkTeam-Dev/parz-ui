import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
// Площадка: живой редактор + документация (npm run dev)
export default defineConfig({ plugins: [react()], base: './', server: { port: 5280 }, build: { outDir: 'site' } }); // сайт площадки — в site/, чтобы не затирать dist/ библиотеки
