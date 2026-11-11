import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
// Сборка самого компонента в dist/ (npm run build:lib)
export default defineConfig({
  plugins: [react()],
  publicDir: false, // логотипы сайта в пакет не нужны
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    lib: { entry: 'src/lib/index.ts', formats: ['es'], fileName: () => 'parz-ui.js' },
    rollupOptions: {
      external: ['react', 'react-dom', 'react/jsx-runtime'],
      output: { assetFileNames: 'parz-ui.[ext]' }
    }
  }
});
