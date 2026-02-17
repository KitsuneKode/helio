// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config')
const expoConfig = require('eslint-config-expo/flat')
const eslintPluginPrettierRecommended = require('eslint-plugin-prettier/recommended')
const eslintPluginReactNative = require('eslint-plugin-react-native')
const universeEslintConfig = require('eslint-config-universe/native')

module.exports = defineConfig([
  expoConfig,
  eslintPluginPrettierRecommended,
  {
    plugins: {
      'react-native': eslintPluginReactNative,
      universe: universeEslintConfig,
    },
    rules: {
      'react-native/no-unused-styles': 'error',
    },
    ignores: ['dist/*'],
  },
])
