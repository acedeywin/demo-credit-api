/* eslint-disable no-undef */
/** @type {import('ts-jest').JestConfigWithTsJest} **/
module.exports = {
    testEnvironment: 'node',
    transform: {
        '^.+.tsx?$': ['ts-jest', {}],
    },
    testMatch: ['**/*.test.ts'], // Look for test files with `.test.ts`
    modulePathIgnorePatterns: ['<rootDir>/dist/'], // Ignore compiled files
}
