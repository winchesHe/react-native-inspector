import { defineConfig } from 'tsdown'

export default defineConfig([
  {
    entry: ['./src/index.ts'],
    external: ['react', 'react-native'],
    dts: true,
    format: 'commonjs'
  },
])
