import stylistic from '@stylistic/eslint-plugin'
import simpleImportSort from 'eslint-plugin-simple-import-sort'
import ts from 'typescript-eslint'

export default ts.config(
  {
    ignores: ['**/dist/**', 'node_modules/**', 'bun.lock', 'bun.lockb'],
  },
  ...ts.configs.recommended,
  {
    files: ['**/*.ts', '**/*.js'],
    plugins: {
      '@stylistic': stylistic,
      'simple-import-sort': simpleImportSort,
    },
    rules: {
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'off',

      // Import sorting
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',

      // Stylistic (formatting)
      '@stylistic/semi': ['error', 'never'],
      '@stylistic/quotes': ['error', 'single', { avoidEscape: true }],
      '@stylistic/indent': ['error', 2, { SwitchCase: 1 }],
      '@stylistic/comma-dangle': ['error', 'always-multiline'],
      '@stylistic/object-curly-spacing': ['error', 'always'],
      '@stylistic/arrow-spacing': 'error',
    },
  },
)
