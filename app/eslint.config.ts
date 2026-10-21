import { defineConfig, globalIgnores } from 'eslint/config'
import pluginVue from 'eslint-plugin-vue'
import tseslint from 'typescript-eslint'

export default defineConfig(
  globalIgnores(['**/dist/**', '**/dist-ssr/**', '**/coverage/**']),
  {
    name: 'app/files-to-lint',
    files: ['**/*.{vue,ts,mts,tsx}'],
    extends: [
      ...tseslint.configs.recommended.map(config => ({
        ...config,
        files: ['**/*.{vue,ts,mts,tsx}'],
      })),
      pluginVue.configs['flat/essential'],
    ],
    languageOptions: {
      parserOptions: {
        parser: tseslint.parser,
      },
    },
  },
  {
    files: ['**/*.vue'],
    rules: {
      'vue/block-lang': ['error', { script: { lang: ['ts'], allowNoLang: false } }],
    },
  },
)
