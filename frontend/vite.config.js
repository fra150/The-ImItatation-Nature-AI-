import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Dev server della SaaS. Il backend gira separato (default http://localhost:3000)
// e ha CORS abilitato, quindi il client lo chiama direttamente (vedi src/api.js).
export default defineConfig({
  plugins: [react()],
  // host: true -> ascolta su 0.0.0.0 (IPv4 + tutte le interfacce), così
  // http://localhost:5173 e http://127.0.0.1:5173 funzionano entrambi su Windows.
  server: { port: 5173, host: true },
});
