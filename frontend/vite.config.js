import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// Prints a friendly message and checks whether the backend API is reachable
const startupMessage = (apiUrl) => ({
  name: 'luxurystay-startup-message',
  configureServer(server) {
    server.httpServer?.once('listening', () => setTimeout(async () => {
      const green = '\x1b[32m';
      const yellow = '\x1b[33m';
      const reset = '\x1b[0m';
      console.log(`\n${green}  ✔ LuxuryStay frontend is running${reset}`);
      try {
        const res = await fetch(`${apiUrl}/health`);
        const body = await res.json();
        console.log(`${green}  ✔ Connected to backend API (${apiUrl}) — database ${body.database}${reset}\n`);
      } catch {
        console.log(`${yellow}  ⚠ Backend API not reachable at ${apiUrl}. Start it with "npm run dev" inside /backend.${reset}\n`);
      }
    }, 200));
  },
});

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiUrl = env.VITE_API_URL || 'http://localhost:5000/api';
  return {
    plugins: [react(), startupMessage(apiUrl)],
    server: { port: 5173 },
  };
});
