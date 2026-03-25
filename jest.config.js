export default {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.js'],
  transform: {},
  extensionsToTreatAsEsm: ['.js'],
  setupFiles: ['./jest.setup.js'],
};
