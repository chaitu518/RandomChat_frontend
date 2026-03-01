/**
 * Generates PNG favicons from public/favicon.svg
 * Run once: node scripts/generate-favicons.mjs
 *
 * Outputs:
 *   public/favicon-192x192.png   (used by Google Search + Android)
 *   public/favicon-512x512.png   (used by PWA splash / high-DPI)
 *   public/apple-touch-icon.png  (iOS home screen, 180x180)
 *   public/favicon-32x32.png     (browser tab fallback)
 */

import { Resvg } from '@resvg/resvg-js'
import { readFileSync, writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')
const svgPath = resolve(root, 'public', 'favicon.svg')
const svg = readFileSync(svgPath, 'utf-8')

const sizes = [
  { name: 'favicon-192x192.png', size: 192 },
  { name: 'favicon-512x512.png', size: 512 },
  { name: 'apple-touch-icon.png', size: 180 },
  { name: 'favicon-32x32.png',   size: 32  },
]

for (const { name, size } of sizes) {
  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width', value: size },
    background: 'transparent',
  })
  const png = resvg.render().asPng()
  const out = resolve(root, 'public', name)
  writeFileSync(out, png)
  console.log(`✓ public/${name}  (${size}x${size})`)
}

console.log('\nAll favicons generated. Commit the public/ PNG files.')
