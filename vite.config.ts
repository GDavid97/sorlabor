import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { pwa } from './pwa-plugin';

export default defineConfig({
  // relatív útvonalak: az app bármilyen almappából / statikus tárhelyről is működik
  base: './',
  plugins: [react(), pwa()],
  server: { open: true },
});
