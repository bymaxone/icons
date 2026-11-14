import type { Config } from 'jest'

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: 'src',
  testMatch: ['**/*.spec.ts', '**/*.spec.tsx', '**/*.test.ts'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'json'],
  // Mirror the subpath aliases declared in tsconfig.json "paths" so that tests
  // exercise the exact same import specifiers that consumers and the tsup
  // bundler use. Without this, tests would need relative imports while build
  // uses package specifiers, an easy source of drift.
  moduleNameMapper: {
    '^@bymax-one/icons$': '<rootDir>/index.ts',
    '^@bymax-one/icons/brands$': '<rootDir>/brands/index.ts',
    '^@bymax-one/icons/flags$': '<rootDir>/flags/index.ts',
    '^@bymax-one/icons/flags/([a-z0-9-]+)$': '<rootDir>/flags/generated/$1.ts',
    '^@bymax-one/icons/icons/([a-z0-9-]+)$': '<rootDir>/icons/generated/$1/index.ts',
    '^@bymax-one/icons/meta$': '<rootDir>/meta/index.ts',
    '^@bymax-one/icons/runtime$': '<rootDir>/runtime/index.ts'
  },
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: '<rootDir>/../tsconfig.jest.json'
      }
    ]
  },
  collectCoverageFrom: [
    '**/*.ts',
    '**/*.tsx',
    '!**/*.spec.ts',
    '!**/*.spec.tsx',
    '!**/*.test.ts',
    '!**/__tests__/**',
    '!**/index.ts',
    '!**/*.d.ts',
    // Written by the generator from the drawing sources. Their correctness is proven by
    // the render smoke test over every generated component, not by line coverage.
    '!**/generated/**'
  ],
  coverageThreshold: {
    global: {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100
    }
  },
  coverageReporters: ['text', 'lcov', 'clover'],
  // Bound peak memory: cap the worker pool at half the cores and recycle any
  // worker that grows past ~1GB. ts-jest reloads the whole module graph per
  // worker, so an unbounded pool multiplies memory (workers x module graph).
  maxWorkers: '50%',
  workerIdleMemoryLimit: '1GB',
  clearMocks: true,
  restoreMocks: true,
  // Only skip the "no tests" error in local dev; CI must always have tests.
  passWithNoTests: process.env['CI'] !== 'true'
}

export default config
