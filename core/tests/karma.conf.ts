// Copyright 2026 The Oppia Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Karma configuration for frontend unit tests.
 *
 * This configuration uses the Angular CLI's karma builder for compilation
 * and preprocessing. The Angular CLI handles TypeScript compilation, HTML
 * template processing, and CSS processing internally via its own webpack
 * configuration.
 */

var karma = require('karma');

// Generate a random number between 0 and 999 to use as the seed for the
// frontend test execution order.
let jasmineSeed = Math.floor(Math.random() * 1000);
// eslint-disable-next-line no-console
console.log(`Seed for Frontend Test Execution Order ${jasmineSeed}`);

module.exports = function (config: InstanceType<typeof karma.Config>) {
  config.set({
    basePath: '../../',
    frameworks: ['jasmine', '@angular-devkit/build-angular'],
    plugins: [
      'karma-coverage-istanbul-reporter',
      'karma-jasmine',
      'karma-chrome-launcher',
      require('@angular-devkit/build-angular/plugins/karma'),
    ],
    client: {
      jasmine: {
        random: true,
        seed: jasmineSeed,
      },
    },
    crossOriginAttribute: true,
    reporters: ['progress', 'coverage-istanbul'],
    // Angular 11 natively uses `karma-coverage-istanbul-reporter` for code coverage
    // via the `@angular-devkit/build-angular` plugin. This configuration explicitly directs the output
    // to the parent directory to maintain compatibility with existing CI scripts.
    // Also note: In angular.json, `"sourceRoot": ""` allows the Angular CLI to discover files in `core/`
    // and `extensions/` for instrumentation, since they sit outside a standard `src/` folder.
    coverageIstanbulReporter: {
      reports: ['html', 'json', 'lcovonly'],
      dir: '../karma_coverage_reports/',
      fixWebpackSourcePaths: true,
      'report-config': {
        html: {outdir: 'html'},
      },
    },
    autoWatch: true,
    browsers: ['CI_Chrome'],
    // Kill the browser if it does not capture in the given timeout [ms].
    captureTimeout: 120000,
    browserNoActivityTimeout: 120000,
    browserDisconnectTimeout: 60000,
    browserDisconnectTolerance: 3,
    browserConsoleLogOptions: {
      level: 'log',
      format: '%b %T: %m',
      // Note: `KARMA_TERMINAL_ENABLED` is explicitly injected as a process environment
      // variable by `scripts/run_frontend_tests.py` when the `--verbose` flag is passed.
      // It is not natively provided by the Angular CLI.
      terminal: process.env.KARMA_TERMINAL_ENABLED === 'true',
    },
    // Continue running in the background after running tests.
    singleRun: true,
    customLaunchers: {
      CI_Chrome: {
        base: 'ChromeHeadless',
        // Discussion of the necessity of extra flags can be found here:
        // https://github.com/karma-runner/karma-chrome-launcher/issues/154
        // https://github.com/karma-runner/karma-chrome-launcher/issues/180
        flags: [
          '--no-sandbox',
          '--disable-gpu',
          '--disable-dev-shm-usage',
          '--js-flags=--max-old-space-size=5120',
        ],
      },
    },
  });
};
