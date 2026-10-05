import { fileURLToPath } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// O CLI do Tauri define TAURI_ENV_* ao rodar o Vite para o app desktop.
const desktop = Boolean(process.env.TAURI_ENV_PLATFORM)

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Mantém a saída do Rust visível no terminal do `npm run desktop`.
  clearScreen: false,
  envPrefix: ['VITE_', 'TAURI_ENV_'],
  server: {
    // Desktop: porta fixa, a mesma do devUrl em src-tauri/tauri.conf.json.
    // Web: porta atribuída pelo ambiente (ex.: preview do Claude), com 5173 como padrão.
    port: desktop ? 1420 : Number(process.env.PORT) || 5173,
    strictPort: desktop,
    watch: { ignored: ['**/src-tauri/**'] },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
