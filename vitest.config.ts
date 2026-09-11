import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    // el pool por defecto ('forks') se cuelga esperando al worker en este
    // entorno; 'threads' arranca de forma confiable.
    pool: 'threads',
  },
})
