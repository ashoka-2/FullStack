import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(() => {
  // Dev proxy targets the local backend server (port 3000).
  // In dev mode, frontend makes relative requests (/api/...) that go through this proxy.
  const devBackendTarget = 'http://localhost:3000';
  return {
    plugins: [react(), tailwindcss()],
    server: {
      proxy: {
        "/api": {
          target: devBackendTarget,
          changeOrigin: true,
          secure: false,
          configure: (proxy, _options) => {
            proxy.on('error', (err, _req, res) => {
              // Gracefully handle ECONNREFUSED when backend server is restarting or offline
              if (err.code === 'ECONNREFUSED' || err.message?.includes('ECONNREFUSED')) {
                if (res && !res.headersSent && typeof res.writeHead === 'function') {
                  res.writeHead(503, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify({ error: 'Backend server unavailable' }));
                }
                return;
              }
            });
          }
        },
        "/socket.io": {
          target: devBackendTarget,
          changeOrigin: true,
          secure: false,
          ws: true,
          configure: (proxy, _options) => {
            proxy.on('error', (err, _req, res) => {
              // Gracefully handle ECONNREFUSED when socket server is offline or reconnecting
              if (err.code === 'ECONNREFUSED' || err.message?.includes('ECONNREFUSED')) {
                if (res && !res.headersSent && typeof res.writeHead === 'function') {
                  res.writeHead(503, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify({ error: 'Socket server unavailable' }));
                }
                return;
              }
            });
          }
        },
      },
    },
  };
});
