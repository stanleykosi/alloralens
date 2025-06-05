/**
 * @description
 * Jest configuration file for the Next.js project.
 * This configuration leverages `next/jest` to provide defaults suitable for
 * a Next.js application, including TypeScript and SWC support.
 *
 * @see https://nextjs.org/docs/testing#setting-up-jest-with-the-rust-compiler
 * @see https://jestjs.io/docs/configuration
 */

const nextJest = require('next/jest')

// Provides the path to your Next.js app to load next.config.js and .env files in your test environment
const createJestConfig = nextJest({
  dir: './',
})

// Add any custom config to be passed to Jest
const customJestConfig = {
  // Indicates the test environment for Jest. For utility functions like math.ts, 'node' is sufficient.
  // For React components or hooks, 'jest-environment-jsdom' would be used.
  testEnvironment: 'node',

  // Automatically clear mock calls, instances, contexts and results before every test
  clearMocks: true,

  // The directory where Jest should output its coverage files
  coverageDirectory: 'coverage',

  // An array of glob patterns indicating a set of files for which coverage information should be collected
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/index.ts', // Often re-exports, less critical for direct coverage
    '!src/app/**/layout.tsx', // Layouts are structural
    '!src/app/**/page.tsx', // Pages are structural
    '!src/app/**/template.tsx', // Templates are structural
    '!src/app/**/not-found.tsx',
    '!src/app/api/**', // API routes often tested via E2E or integration tests
    '!src/middleware.ts',
    '!src/db/migrations/**', // Drizzle migrations
    '!src/db/test-connection.ts', // Test script
    '!**/node_modules/**',
  ],

  // A map from regular expressions to module names or to arrays of module names that allow to stub out resources with a single module
  moduleNameMapper: {
    // Handle CSS imports (if any in tested files, though not expected for math.ts)
    '^.+\\.(css|sass|scss)$': 'identity-obj-proxy',

    // Handle image imports
    '^.+\\.(jpg|jpeg|png|gif|webp|svg)$': '<rootDir>/__mocks__/fileMock.js',

    // Handle module aliases (important for `@/` imports)
    '^@/(.*)$': '<rootDir>/src/$1',
  },

  // Test spec file pattern
  testMatch: ['**/__tests__/**/*.[jt]s?(x)', '**/?(*.)+(spec|test).[tj]s?(x)'],

  // Indicates whether each individual test should be reported during the run
  verbose: true,
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig) 