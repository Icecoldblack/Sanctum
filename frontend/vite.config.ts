import path from 'node:path'
import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

const dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig(({ command, mode }) => {
  // The API address is baked in at build time. Without it the site still builds, but every API
  // call goes to the static host and fails, so a production build stops here instead.
  if (command === 'build') {
    const env = loadEnv(mode, dirname, 'VITE_')
    if (!env.VITE_API_BASE_URL?.trim()) {
      throw new Error(
        'VITE_API_BASE_URL is not set. Set it to the backend URL (e.g. https://api.example.com) in ' +
          'frontend/.env or in your host’s environment variables (Vercel: Project Settings → ' +
          'Environment Variables), then rebuild.',
      )
    }
  }

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(dirname, './src'),
      },
    },
  }
})
