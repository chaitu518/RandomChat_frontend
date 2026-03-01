import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import type { Plugin } from 'vite'

/**
 * Converts render-blocking <link rel="stylesheet"> tags in the built HTML
 * to async (preload) equivalents so CSS never blocks the initial paint.
 * A <noscript> fallback ensures styles still load without JS.
 */
function asyncCssPlugin(): Plugin {
  return {
    name: 'async-css',
    apply: 'build',
    transformIndexHtml(html) {
      // Vite may inject `crossorigin` or other attrs; match the full tag generically.
      return html.replace(
        /<link rel="stylesheet"([^>]*)>/g,
        (_, rest) => {
          const href = (rest.match(/href="([^"]+)"/) ?? [])[1] ?? ''
          if (!href) return `<link rel="stylesheet"${rest}>`
          return (
            `<link rel="preload" href="${href}" as="style" onload="this.onload=null;this.rel='stylesheet'">` +
            `<noscript><link rel="stylesheet" href="${href}"></noscript>`
          )
        },
      )
    },
  }
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), asyncCssPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
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
