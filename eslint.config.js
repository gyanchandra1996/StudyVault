const expo = require('eslint-config-expo/flat');

module.exports = [
  ...expo,
  {
    rules: {
      'react-hooks/set-state-in-effect': 'off',
      'react/no-unescaped-entities': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
    ignores: ['node_modules/**', '.expo/**', 'assets/**', 'dist/**'],
  },
];
