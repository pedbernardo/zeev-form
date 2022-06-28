import pkg from './package.json'
import { nodeResolve } from '@rollup/plugin-node-resolve'

export default {
  input: './src/index.js',
  output: [
    {
      file: pkg.module,
      format: 'esm'
    },
    {
      name: 'ZeevForm',
      file: pkg.browser,
      format: 'umd'
    }
  ],
  plugins: [nodeResolve()]
}
