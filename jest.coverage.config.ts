import type { Config } from 'jest'

/**
 * Aggregated Jest configuration for release-time coverage.
 *
 * Scans the whole project (`rootDir: '.'`) rather than `src/` alone so that a
 * future integration or end-to-end suite added outside `src/` is picked up by
 * the same coverage run without a second config fork. Use this for
 * release-time validation (`pnpm test:cov:all`) and CI gates. Day-to-day
 * development should still prefer the faster `pnpm test:cov`, which only
 * runs the unit suite via `jest.config.ts`.
 */
const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: '.',
  testMatch: [
    '<rootDir>/src/**/*.spec.ts',
    '<rootDir>/src/**/*.spec.tsx',
    '<rootDir>/src/**/*.test.ts'
  ],
  // This config scans the whole project (rootDir '.'), so exclude build output
  // and Stryker sandboxes: both hold copies of `src/` that share the package's
  // Haste module name, which otherwise crashes jest-haste-map with
  // "dupMap.get is not a function" on the `@bymax-one/icons` alias.
  modulePathIgnorePatterns: ['<rootDir>/dist/', '<rootDir>/.stryker-tmp/'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'json'],
  // Mirror the subpath aliases declared in tsconfig.json "paths" so tests and
  // production code resolve the same module instance; a dual-package hazard
  // would make identity checks fail across subpath boundaries.
  moduleNameMapper: {
    '^@bymax-one/icons$': '<rootDir>/src/index.ts',
    '^@bymax-one/icons/brands$': '<rootDir>/src/brands/index.ts',
    '^@bymax-one/icons/flags$': '<rootDir>/src/flags/index.ts',
    '^@bymax-one/icons/flags/([a-z0-9-]+)$': '<rootDir>/src/flags/generated/$1.ts',
    '^@bymax-one/icons/icons/([a-z0-9-]+)$': '<rootDir>/src/icons/generated/$1/index.ts',
    '^@bymax-one/icons/meta$': '<rootDir>/src/meta/index.ts',
    '^@bymax-one/icons/runtime$': '<rootDir>/src/runtime/index.ts'
  },
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: '<rootDir>/tsconfig.jest.json'
      }
    ]
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    'src/**/*.tsx',
    '!src/**/*.spec.ts',
    '!src/**/*.spec.tsx',
    '!src/**/*.test.ts',
    '!src/**/__tests__/**',
    '!src/**/index.ts',
    '!src/**/*.d.ts',
    // Written by the generator; proven by the render smoke test, not by line coverage.
    '!src/**/generated/**'
  ],
  coverageReporters: ['text', 'lcov', 'clover'],
  coverageThreshold: {
    global: {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100
    }
  },
  testTimeout: 30_000,
  maxWorkers: '50%',
  workerIdleMemoryLimit: '1GB',
  clearMocks: true,
  restoreMocks: true,
  passWithNoTests: process.env['CI'] !== 'true'
}

export default config
