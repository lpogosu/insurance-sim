import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist/**', 'node_modules/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      eqeqeq: ['error', 'always'],
      // Бот пишет только в stderr: stdout остаётся чистым для пайпов.
      'no-console': ['error', { allow: ['error'] }],
    },
  },
);
