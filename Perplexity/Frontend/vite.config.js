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
        },
        "/socket.io": {
          target: devBackendTarget,
          changeOrigin: true,
          secure: false,
          ws: true,
        },
      },
    },
  };
});
