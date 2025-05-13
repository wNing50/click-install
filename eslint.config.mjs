// @ts-check
import antfu from '@antfu/eslint-config'

export default antfu(
  {
    ignores: [
      // eslint ignore globs here
      'node_modules',
      'dist',
    ],
  },
  {
    rules: {
      // overrides
    },
  },
)
