import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';
import {VitePWA} from 'vite-plugin-pwa';
import {createSpeechRouter, loadSpeechEnvironment} from './server/speech.mjs';
import {createSentenceAssessmentRouter} from './server/sentenceAssessment.mjs';
import {createWordChainRouter} from './server/wordChain.mjs';
import {createExampleGeneratorRouter} from './server/exampleGenerator.mjs';

const projectRoot = import.meta.dirname;

function speechEnvironment(mode: string) {
  const files = ['.env', '.env.local', `.env.${mode}`, `.env.${mode}.local`];
  return loadSpeechEnvironment(files.map((file) => path.join(projectRoot, file)));
}

function aiServerEnvironment(mode: string) {
  return {
    ...process.env,
    ...loadEnv(mode, projectRoot, ''),
  };
}

export default defineConfig(() => {
  return {
    build: {
      rolldownOptions: {
        output: {
          codeSplitting: {
            groups: [
              { name: 'english-vocabulary', test: /[\\/]src[\\/]data[\\/]englishDecks\.ts$/ },
              { name: 'english-card-details', test: /[\\/]English[\\/]englishEnrichment\.json$/, priority: 1 },
              { name: 'english-phrasal-verbs', test: /[\\/]English[\\/]englishPhrasalVerbs\.json$/, priority: 1 },
              { name: 'english-expansion', test: /[\\/]English[\\/]englishExpansion\.json$/, priority: 1 },
              { name: 'english-extra-vocabulary', test: /[\\/]English[\\/]englishExtraVocabulary\.json$/, priority: 1 },
            ],
          },
        },
      },
    },
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'largo-speech-api',
        configureServer(server) {
          server.middlewares.use('/api/speech', createSpeechRouter(speechEnvironment(server.config.mode)));
        },
        configurePreviewServer(server) {
          server.middlewares.use('/api/speech', createSpeechRouter(speechEnvironment(server.config.mode)));
        },
      },
      {
        name: 'largo-ai-api',
        configureServer(server) {
          const env = aiServerEnvironment(server.config.mode);
          server.middlewares.use('/api/ai/word-chain', createWordChainRouter(env));
          server.middlewares.use('/api/ai/examples', createExampleGeneratorRouter(env));
          server.middlewares.use('/api/ai', createSentenceAssessmentRouter(env));
        },
        configurePreviewServer(server) {
          const env = aiServerEnvironment(server.config.mode);
          server.middlewares.use('/api/ai/word-chain', createWordChainRouter(env));
          server.middlewares.use('/api/ai/examples', createExampleGeneratorRouter(env));
          server.middlewares.use('/api/ai', createSentenceAssessmentRouter(env));
        },
      },
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['icon.svg', 'apple-touch-icon.png', 'pwa-192x192.png', 'pwa-512x512.png', 'pwa-maskable-512x512.png', 'english-sources.txt'],
        manifest: {
          id: '/',
          name: 'Largo · Học từ và cụm từ',
          short_name: 'Largo',
          lang: 'vi',
          description: 'Học từ vựng và cụm từ tiếng Anh theo cấp độ, luyện dùng trong câu và ôn cách quãng.',
          theme_color: '#f1eff9',
          background_color: '#f1eff9',
          display: 'standalone',
          start_url: '/',
          scope: '/',
          icons: [
            {
              src: '/pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/pwa-maskable-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,jpg,woff,woff2}'],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'gstatic-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
          ],
        },
        devOptions: {
          enabled: true,
          type: 'module',
        },
      }),
      // Copies src/assets into dist/ so root-relative URLs like
      // "/src/assets/images/..." (e.g. generate_image output) still resolve
      // in production builds. Do not remove.
      {
        name: 'copy-unbundled-src-assets',
        apply: 'build',
        closeBundle(error?: Error): void {
          if (error) {
            return;
          }
          const distDir = path.resolve(projectRoot, 'dist');
          const srcAssets = path.resolve(projectRoot, 'src/assets');
          const distAssets = path.resolve(distDir, 'src/assets');
          if (fs.existsSync(distDir) && fs.existsSync(srcAssets)) {
            fs.cpSync(srcAssets, distAssets, {recursive: true, force: true});
          }
        },
      },
    ],
    resolve: {
      alias: {
        '@': projectRoot,
      },
    },
    server: {
      host: '0.0.0.0',
      port: 3000,
      allowedHosts: true,
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
