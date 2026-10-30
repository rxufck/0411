import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base: './' — чтобы сборку можно было открыть с любого пути (GitHub Pages, папка на диске).
export default defineConfig({
  base: './',
  plugins: [react()],
});
