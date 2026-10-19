import { defineConfig } from 'vite';
import { localLibraryMiddleware } from './server/library.mjs';

export default defineConfig({
  // Do not copy public/game or public/mods into the production build.
  publicDir: false,
  plugins: [{
    name: 'local-library',
    configureServer(server) { server.middlewares.use(localLibraryMiddleware(process.cwd())); },
    configurePreviewServer(server) { server.middlewares.use(localLibraryMiddleware(process.cwd())); },
  }],
  server: { host: '127.0.0.1', port: 5317 },
  preview: { host: '127.0.0.1', port: 5317 },
  build: { target: 'es2022' },
});
