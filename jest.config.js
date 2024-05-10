module.exports = {
  rootDir: './core/tests/puppeteer-acceptance-tests/spec',
  testMatch: ['**/?(*.)+(spec).[t]s'],
  transform: {'^.+\\.ts?$': 'ts-jest'},
  testEnvironment: 'node',
  testTimeout: 3000,
  bail: 0,
};
