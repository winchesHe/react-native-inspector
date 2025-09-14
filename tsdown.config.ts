import { defineConfig } from 'tsdown'

export default defineConfig([
  {
    entry: ['./src/index.ts'],
    platform: 'neutral',
    external: ['react', 'react-native'],
    dts: true,
  },
])
