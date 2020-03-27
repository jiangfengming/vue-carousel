import babel from 'rollup-plugin-babel'
import resolve from '@rollup/plugin-node-resolve'
import vue from 'rollup-plugin-vue'

export default {
  input: 'src/index.js',

  plugins: [
    resolve({
      extensions: ['.vue']
    }),

    vue(),

    babel({
      runtimeHelpers: true
    })
  ],

  output: {
    format: 'esm',
    file: 'dist/vue-carousel.js'
  },

  external: ['pan-events', 'element-resize-detector']
}
