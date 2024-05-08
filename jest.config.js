module.exports = {
  rootDir: './core/tests/puppeteer-acceptance-tests/spec/logged-in-user-tests',
  testMatch: ['**/?(*.)+(test).[t]s'],
  transform: {'^.+\\.ts?$': 'ts-jest'},
  testEnvironment: 'node',
  testTimeout: 3000,
  bail: 0,
};
