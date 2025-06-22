module.exports = {
  parser: '@typescript-eslint/parser',
  extends: [
    'eslint:recommended',
  ],
  plugins: ['@typescript-eslint'],
  env: {
    node: true,
    es2020: true,
    jest: true,
  },
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
  },
  rules: {
    'no-unused-vars': 'warn',
    'prefer-const': 'error',
    'no-var': 'error',
    'no-console': 'warn',
  },
  ignorePatterns: ['dist/', 'node_modules/', '*.js'],
}; 