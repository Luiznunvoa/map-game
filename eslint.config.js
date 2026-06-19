import eslintConfigPrettier from 'eslint-config-prettier'
import ts from 'typescript-eslint'

export default ts.config(
  {
    ignores: ['**/dist/**', 'node_modules/**', 'bun.lock', 'bun.lockb'],
  },
  ...ts.configs.recommended,
  {
    files: ['**/*.ts', '**/*.js', '**/*.tsx', '**/*.jsx'],
    rules: {
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    },
  },
  eslintConfigPrettier,
)
