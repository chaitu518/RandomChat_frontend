import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Keep modulepreload injection (Vite default) so the browser prefetches
    // the JS entry chunk as early as possible.
    modulePreload: { polyfill: false },
    rollupOptions: {
      output: {
        manualChunks: {
          // Split React runtime into its own long-lived cache chunk.
          // ~40 KiB vendor chunk is cached independently of app code.
          vendor: ['react', 'react-dom'],
        },
      },
    },
  },
})
