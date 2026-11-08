import js from '@eslint/js'
import tsPlugin from '@typescript-eslint/eslint-plugin'
import tsParser from '@typescript-eslint/parser'
import prettierConfig from 'eslint-config-prettier'
import { createTypeScriptImportResolver } from 'eslint-import-resolver-typescript'
import { createNodeResolver, importX } from 'eslint-plugin-import-x'
import prettier from 'eslint-plugin-prettier'
import security from 'eslint-plugin-security'
import globals from 'globals'

// Denied packages shared by the production, scripts, and config-file rule sets.
// A Bymax-wide guard-rail: even a library that does not use crypto today must reach
// for node: builtins, never a third-party dependency, if it ever does, and never pull
// in the id/formatting/http libraries the platform already covers.
const deniedImports = [
  { name: 'crypto', message: "Use 'node:crypto' with the node: prefix instead." },
  { name: 'bcrypt', message: 'Use node:crypto scrypt instead.' },
  { name: 'argon2', message: 'Use node:crypto scrypt instead.' },
  { name: 'uuid', message: 'Use crypto.randomUUID() from node:crypto instead.' },
  { name: 'nanoid', message: 'Use crypto.randomBytes() from node:crypto instead.' },
  { name: 'crypto-js', message: 'Use node:crypto instead.' },
  { name: 'axios', message: 'Use the global fetch API instead.' },
  { name: 'moment', message: 'Use the Intl API or Date instead.' },
  { name: 'lodash', message: 'Use native Array/Object methods instead.' }
]

// The `./meta` subpath is the React-free entry: typed metadata a consumer can load
// without a renderer. A React import there would make every metadata consumer pay
// for one, so it is refused at lint time rather than noticed in a bundle report.
const metaDeniedImports = [
  ...deniedImports,
  { name: 'react', message: 'The ./meta subpath must not import React.' },
  { name: 'react/jsx-runtime', message: 'The ./meta subpath must not import React.' },
  { name: 'react-dom', message: 'The ./meta subpath must not import React.' }
]

// `paths` matches exact specifiers only, so every subpath of the two packages
// (react/jsx-dev-runtime, react-dom/server, ...) is refused by pattern.
const metaDeniedPatterns = [
  { group: ['react/*', 'react-dom/*'], message: 'The ./meta subpath must not import React.' }
]

export default [
  // Global ignores: only build artifacts and coverage, NOT config files.
  {
    ignores: ['node_modules/**', 'dist/**', 'coverage/**', 'reports/**', '.stryker-tmp/**']
  },

  // Base recommended config.
  js.configs.recommended,

  // TypeScript production files, including the React components (.tsx).
  {
    files: ['src/**/*.ts', 'src/**/*.tsx'],
    ignores: ['**/*.spec.ts', '**/*.spec.tsx', '**/*.test.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: import.meta.dirname,
        ecmaVersion: 2022,
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true
        }
      },
      globals: {
        ...globals.node,
        ...globals.browser
      }
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      'import-x': importX,
      prettier,
      security
    },
    settings: {
      // The dependency parser is separate from the resolver, and both are
      // required. The resolver answers where a specifier points; the parser
      // answers what that file exports. A graph rule opens each resolved
      // dependency and parses it itself, skipping in silence any extension it
      // cannot map to a parser, so without this mapping `no-cycle`, `named`
      // and `no-unused-modules` report nothing on a TypeScript project while
      // `--print-config` still shows them enabled.
      'import-x/parsers': {
        '@typescript-eslint/parser': ['.ts', '.tsx']
      },
      // An ordered array of resolver factories, not the named object of the
      // legacy `import-x/resolver` key. import-x ships only the node resolver,
      // so eslint-import-resolver-typescript stays required.
      'import-x/resolver-next': [
        createTypeScriptImportResolver({
          alwaysTryTypes: true,
          project: './tsconfig.json'
        }),
        createNodeResolver({
          extensions: ['.js', '.ts', '.tsx']
        })
      ]
    },
    rules: {
      // TypeScript, strict: zero `any`, explicit return types on exports.
      'no-undef': 'off',
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_'
        }
      ],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/explicit-function-return-type': 'error',
      '@typescript-eslint/explicit-module-boundary-types': 'error',
      '@typescript-eslint/no-non-null-assertion': 'error',
      '@typescript-eslint/consistent-type-imports': [
        'error',
        {
          prefer: 'type-imports',
          fixStyle: 'separate-type-imports'
        }
      ],
      '@typescript-eslint/no-empty-function': 'warn',

      // Code quality.
      'prefer-const': 'error',
      'no-var': 'error',
      'no-empty': ['error', { allowEmptyCatch: true }],
      'no-console': ['warn', { allow: ['warn', 'error'] }],

      // Security: block dynamic code evaluation.
      'no-eval': 'error',
      'no-new-func': 'error',
      'no-implied-eval': 'error',

      // Security: the package-wide denied-import list (see deniedImports above).
      'no-restricted-imports': ['error', { paths: deniedImports }],

      // Security plugin rules.
      'security/detect-object-injection': 'warn',
      'security/detect-non-literal-regexp': 'warn',
      'security/detect-possible-timing-attacks': 'error',

      // Import ordering: node: -> external -> internal -> parent/sibling
      'import-x/order': [
        'error',
        {
          groups: ['builtin', 'external', 'internal', ['parent', 'sibling'], 'index'],
          pathGroups: [
            {
              pattern: 'node:*',
              group: 'builtin',
              position: 'before'
            }
          ],
          pathGroupsExcludedImportTypes: ['builtin'],
          'newlines-between': 'always',
          alphabetize: {
            order: 'asc',
            caseInsensitive: true
          }
        }
      ],
      'import-x/no-cycle': 'error',
      'import-x/no-self-import': 'error',

      // Prettier reads from .prettierrc; no inline options to avoid conflicts.
      'prettier/prettier': 'warn'
    }
  },

  // The React-free metadata subpath (see metaDeniedImports above).
  {
    files: ['src/meta/**/*.ts', 'src/meta/**/*.tsx'],
    ignores: ['**/*.spec.ts', '**/*.test.ts', '**/*.spec.tsx', '**/*.test.tsx'],
    rules: {
      'no-restricted-imports': [
        'error',
        { paths: metaDeniedImports, patterns: metaDeniedPatterns }
      ],
      // no-restricted-imports does not see `import('react')` or `require('react')`.
      'no-restricted-syntax': [
        'error',
        {
          selector: 'ImportExpression[source.value=/^react(-dom)?(\\/|$)/]',
          message: 'The ./meta subpath must not import React.'
        },
        {
          selector:
            "CallExpression[callee.name='require'][arguments.0.value=/^react(-dom)?(\\/|$)/]",
          message: 'The ./meta subpath must not import React.'
        }
      ]
    }
  },

  // Node.js scripts: plain ESM, no TypeScript parser needed.
  {
    files: ['scripts/**/*.mjs', 'scripts/**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.node
      }
    },
    plugins: {
      security
    },
    rules: {
      'no-eval': 'error',
      'no-new-func': 'error',
      'no-restricted-imports': ['error', { paths: deniedImports }],
      'security/detect-object-injection': 'warn'
    }
  },

  // Config files (tsup.config.ts, jest.config.ts, etc.): TS parser, no type-aware project.
  {
    files: ['*.config.ts', '*.config.mjs', '*.config.js'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module'
      },
      globals: {
        ...globals.node
      }
    },
    plugins: {
      security
    },
    rules: {
      'no-eval': 'error',
      'no-new-func': 'error',
      'no-restricted-imports': ['error', { paths: deniedImports }],
      'security/detect-object-injection': 'warn'
    }
  },

  // Test files: TS parser, Jest + Node + browser globals, relaxed rules. Browser
  // globals are included because the component specs render into jsdom.
  {
    files: ['**/*.spec.ts', '**/*.spec.tsx', '**/*.test.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true
        }
      },
      globals: {
        ...globals.jest,
        ...globals.node,
        ...globals.browser
      }
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      'no-unused-vars': 'off',
      'no-undef': 'off',
      'no-console': 'off'
    }
  },

  // Prettier disables conflicting formatting rules; must be last.
  prettierConfig
]
