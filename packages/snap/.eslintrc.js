module.exports = {
  extends: ['../../.eslintrc.js'],

  globals: {
    snap: 'readonly',
    ethereum: 'readonly',
  },

  parserOptions: {
    tsconfigRootDir: __dirname,
  },

  overrides: [
    {
      files: ['snap.config.ts'],
      extends: ['@metamask/eslint-config-nodejs'],
    },

    {
      files: ['*.test.ts'],
      rules: {
        '@typescript-eslint/unbound-method': 'off',
      },
    },
  ],

  ignorePatterns: ['!.eslintrc.js', 'dist/'],

  rules: {
    'jsdoc/require-description': 'off',
    'jsdoc/require-param-description': 'off',
    'jsdoc/require-param-type': 'off',
    'jsdoc/require-returns': 'off',
    'jsdoc/require-jsdoc': 'off',
    'n/global-require': 'off',
    'n/no-sync': 'off',
    'n/no-process-env': 'off',
    'id-denylist': 'off',
    'no-restricted-syntax': 'off',
    'id-length': 'off',
    'no-negated-condition': 'off',
    'no-restricted-globals': 'off',
  },
};
