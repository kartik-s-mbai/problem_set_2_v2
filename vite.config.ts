import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'api-serverless-routes',
        configureServer(server) {
          server.middlewares.use(async (req, res, next) => {
            if (!req.url) return next();
            const parsed = new URL(req.url, 'http://localhost:3000');
            if (parsed.pathname === '/api/resale') {
              try {
                const { default: resaleHandler } = await import('./api/resale.js');
                const query = Object.fromEntries(parsed.searchParams.entries());
                const fakeReq = Object.assign(req, { query });
                const fakeRes = Object.assign(res, {
                  status(code: number) {
                    res.statusCode = code;
                    return fakeRes;
                  },
                  json(data: unknown) {
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify(data));
                  },
                });
                await resaleHandler(fakeReq, fakeRes);
              } catch (e) {
                next(e);
              }
              return;
            }
            if (parsed.pathname === '/api/health') {
              try {
                const { default: healthHandler } = await import('./api/health.js');
                const query = Object.fromEntries(parsed.searchParams.entries());
                const fakeReq = Object.assign(req, { query });
                const fakeRes = Object.assign(res, {
                  status(code: number) {
                    res.statusCode = code;
                    return fakeRes;
                  },
                  json(data: unknown) {
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify(data));
                  },
                });
                await healthHandler(fakeReq, fakeRes);
              } catch (e) {
                next(e);
              }
              return;
            }
            next();
          });
        },
      },
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
