import path from 'node:path';
import process from 'node:process';
import {loadEnv} from 'vite';
import type {ConfigEnv, UserConfig} from 'vite';
import viewport from 'postcss-mobile-forever';
import autoprefixer from 'autoprefixer';
import {createVitePlugins} from './build/vite';
import {exclude, include} from './build/vite/optimize';
import {VitePWA} from 'vite-plugin-pwa';

export default ({mode}: ConfigEnv): UserConfig => {
  const root = process.cwd();
  const env = loadEnv(mode, root);

  server: {
    https: true;
  }

  VitePWA({
    registerType: 'autoUpdate', // Aggiorna automaticamente la PWA
    includeAssets: ['./public/favicon.svg'], // Asset da includere
    manifest: {
      name: 'Money Tracker',
      short_name: 'App',
      description: 'A simple money tracker app',
      theme_color: '#ffffff',
      background_color: '#ffffff',
      start_url: '/',
      display: 'standalone', // App in modalità standalone
      icons: [
        {
          src: '.public/pwa-192x192.png',
          sizes: '192x192',
          type: 'image/png',
        },
        {
          src: './public/pwa-512x512.png.png',
          sizes: '512x512',
          type: 'image/png',
        },
      ],
    },
  });

  return {
    base: env.VITE_APP_PUBLIC_PATH,
    plugins: createVitePlugins(mode),

    resolve: {
      alias: {
        '~@': path.join(__dirname, './src'),
        '@': path.join(__dirname, './src'),
        '~': path.join(__dirname, './src/assets'),
        '~root': path.join(__dirname, '.'),
      },
    },

    css: {
      postcss: {
        plugins: [
          autoprefixer(),
          // https://github.com/wswmsword/postcss-mobile-forever
          viewport({
            appSelector: '#app',
            viewportWidth: 375,
            maxDisplayWidth: 600,
            rootContainingBlockSelectorList: ['van-tabbar', 'van-popup'],
            border: true,
          }),
        ],
      },
    },

    build: {
      cssCodeSplit: false,
      chunkSizeWarningLimit: 2048,
      outDir: env.VITE_APP_OUT_DIR || 'dist',
    },

    optimizeDeps: {include, exclude},
  };
};
