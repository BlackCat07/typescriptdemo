import { defineConfig } from 'vitest/config'
import { resolve } from 'path'
import { fileURLToPath } from 'url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  resolve: {
    alias: { '@app': resolve(__dirname, 'src') },
  },
  test: {
    environment: 'node',
    globals: true,
  },
})
