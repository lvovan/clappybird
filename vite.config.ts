/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react-swc'
import type { Plugin } from 'vite'

const buildTime = Date.now()

/**
 * Vite plugin that emits version.json into the build output.
 * The file contains `{ "buildTime": <epoch_ms> }` so the running
 * app can compare its compile-time constant against the deployed version.
 */
function versionJsonPlugin(): Plugin {
  return {
    name: 'version-json',
    apply: 'build',
    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: 'version.json',
        source: JSON.stringify({ buildTime }),
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), versionJsonPlugin()],
  define: {
    __BUILD_TIME__: JSON.stringify(buildTime),
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: true,
  },
})
