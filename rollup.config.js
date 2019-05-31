import typescript from 'rollup-plugin-typescript2';
import multiInput from 'rollup-plugin-multi-input';
import copy from 'rollup-plugin-copy-glob';

import pkg from './package.json'

const common = {
  external: [
    ...Object.keys(pkg.dependencies || {}),
    ...Object.keys(pkg.peerDependencies || {}),
  ],
}

const commonPlugins = [
  typescript({
    typescript: require('typescript'),
  }),
];

export default [
    {
      input: 'src/bin.ts',
      output: {
        dir: 'dist',
        format: 'cjs',
      },
      plugins: [
        ...commonPlugins
      ],
      ...common
  },
  {
    input: ['src/scripts/**/*.ts'],
    output: {
      format: 'cjs',
      dir: 'dist'
    },
    plugins: [ 
      multiInput(),
      copy([
        { files: 'src/**/*.json', dest: 'dist' },
        { files: 'src/**/*.yml', dest: 'dist' },
        { files: 'src/**/*.yaml', dest: 'dist' },
      ], { verbose: true, watch: false }),
      ...commonPlugins
    ],
    ...common
  }
]