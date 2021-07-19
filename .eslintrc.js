module.exports = {
  env: {
    commonjs: true,
    es2021: true,
    node: true
  },
  plugins: ['yaml'],
  extends: [
    'standard',
    'plugin:yaml/recommended'
  ],
  parserOptions: {
    ecmaVersion: 12
  },
  rules: {
  }
}
