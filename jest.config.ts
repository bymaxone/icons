import type { Config } from 'jest'

// jest-worker puts FORCE_COLOR=1 in a worker's environment when stdout is a terminal and
// supports-color has not been told otherwise, and Node then colours what a program spawned by
// a spec prints, so a spec comparing it with a literal reads escape codes. CI has no terminal
// and never sees it. Setting this while the config loads is early enough, because jest-worker
// reads the colour support when it starts its first worker; a later `globalSetup` is too late.
process.env.FORCE_COLOR = '0'
process.env.NO_COLOR = '1'

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
    '^@bymax-one/icons/brands/([a-z0-9-]+)$': '<rootDir>/brands/generated/$1.ts',
    '^@bymax-one/icons/flags$': '<rootDir>/flags/index.ts',
    '^@bymax-one/icons/flags/([a-z0-9-]+)$': '<rootDir>/flags/generated/$1.ts',
    '^@bymax-one/icons/icons/([a-z0-9-]+)$': '<rootDir>/icons/generated/$1/index.ts',
    '^@bymax-one/icons/grid$': '<rootDir>/grid/index.ts',
    '^@bymax-one/icons/meta$': '<rootDir>/meta/index.ts',
    '^@bymax-one/icons/native$': '<rootDir>/native/index.ts',
    '^@bymax-one/icons/native/brands$': '<rootDir>/native/brands/index.ts',
    '^@bymax-one/icons/native/brands/([a-z0-9-]+)$': '<rootDir>/native/generated/brands/$1.ts',
    '^@bymax-one/icons/native/flags$': '<rootDir>/native/flags/index.ts',
    '^@bymax-one/icons/native/flags/([a-z0-9-]+)$': '<rootDir>/native/generated/flags/$1.ts',
    '^@bymax-one/icons/native/icons/([a-z0-9-]+)$': '<rootDir>/native/generated/icons/$1/index.ts',
    '^@bymax-one/icons/native/runtime$': '<rootDir>/native/runtime/index.ts',
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
