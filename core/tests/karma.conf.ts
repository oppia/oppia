var argv = require('yargs').positional('terminalEnabled', {
  type: 'boolean',
  'default': false
}).argv;

var generatedJs = 'third_party/generated/js/third_party.js';
if (argv.prodEnv) {
  generatedJs = (
    'third_party/generated/js/third_party.min.js');
}

// Generate a random number between 0 and 999 to use as the seed for the
// frontend test execution order.
let jasmineSeed = Math.floor(Math.random() * 1000);
// eslint-disable-next-line no-console
console.log(`Seed for Frontend Test Execution Order ${jasmineSeed}`);

module.exports = function(config) {
  config.set({
    basePath: '../../',
    frameworks: ['jasmine'],
    files: [
      // Constants must be loaded before everything else.
      // Since jquery, angular-mocks and math-expressions
      // are not bundled, they will be treated separately.
      'third_party/static/jquery-3.5.1/jquery.min.js',
      'third_party/static/angularjs-1.8.2/angular.js',
      'core/templates/karma.module.ts',
      'third_party/static/angularjs-1.8.2/angular-mocks.js',
      '/third_party/static/lamejs-1.2.0/worker-example/worker-realtime.js',
      generatedJs,
      // Note that unexpected errors occur ("Cannot read property 'num' of
      // undefined" in MusicNotesInput.js) if the order of core/templates/...
      // and extensions/... are switched. The test framework may be flaky.
      'core/templates/**/*_directive.html',
      'core/templates/**/*.directive.html',
      'core/templates/**/*.component.html',
      'core/templates/**/*.template.html',
      // This is a file that is generated on running the run_frontend_tests.py
      // script. This generated file is a combination of all the spec files
      // since Karma is unable to run tests on multiple files due to some
      // unknown reason.
      'core/templates/combined-tests.spec.ts',
      {
        pattern: 'assets/**',
        watched: false,
        served: true,
        included: false
      },
      {
        pattern: 'extensions/**/*.png',
        watched: false,
        served: true,
        included: false
      },
      'extensions/interactions/**/*.directive.html',
      'extensions/interactions/**/*.component.html',
      'extensions/interactions/*.json',
      'core/tests/data/*.json'
    ],
    exclude: [
      'local_compiled_js/core/templates/**/*-e2e.js',
      'local_compiled_js/extensions/**/protractor.js',
      'backend_prod_files/extensions/**',
      'extensions/classifiers/proto/*'
    ],
    proxies: {
      // Karma serves files under the /base directory.
      // We access files directly in our code, for example /folder/,
      // so we need to proxy the requests from /folder/ to /base/folder/.
      '/assets/': '/base/assets/',
      '/extensions/': '/base/extensions/'
    },
    preprocessors: {
      'core/templates/*.ts': ['webpack'],
      'core/templates/**/*.ts': ['webpack'],
      'extensions/**/*.ts': ['webpack'],
      // Note that these files should contain only directive templates, and no
      // Jinja expressions. They should also be specified within the 'files'
      // list above.
      'core/templates/**/*_directive.html': ['ng-html2js'],
      'core/templates/**/*.directive.html': ['ng-html2js'],
      'core/templates/**/*.component.html': ['ng-html2js'],
      'core/templates/**/*.template.html': ['ng-html2js'],
      'extensions/interactions/**/*.directive.html': ['ng-html2js'],
      'extensions/interactions/**/*.component.html': ['ng-html2js'],
      'extensions/interactions/*.json': ['json_fixtures'],
      'core/tests/data/*.json': ['json_fixtures']
    },
    client: {
      jasmine: {
        random: true,
        seed: jasmineSeed,
      },
    },
    reporters: ['progress', 'coverage-istanbul'],
    coverageIstanbulReporter: {
      reports: ['html', 'json', 'lcovonly'],
      dir: '../karma_coverage_reports/',
      fixWebpackSourcePaths: true,
      'report-config': {
        html: { outdir: 'html' }
      }
    },
    autoWatch: true,
    browsers: ['CI_Chrome'],
    // Kill the browser if it does not capture in the given timeout [ms].
    captureTimeout: 60000,
    browserNoActivityTimeout: 120000,
    browserDisconnectTimeout: 60000,
    browserDisconnectTolerance: 3,
    browserConsoleLogOptions: {
      level: 'log',
      format: '%b %T: %m',
      terminal: argv.terminalEnabled
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
          '--js-flags=--max-old-space-size=4096'
        ]
      }
    },

    plugins: [
      'karma-coverage-istanbul-reporter',
      'karma-jasmine',
      'karma-chrome-launcher',
      'karma-ng-html2js-preprocessor',
      'karma-json-fixtures-preprocessor',
      'karma-coverage',
      'karma-webpack'
    ],
    ngHtml2JsPreprocessor: {
      moduleName: 'directiveTemplates',
      // Key ngHtml2JsPreprocessor adds the html inside $templateCache,
      // the key that we use for that cache needs to be exactly the same as
      // the templateUrl in directive JS. The stripPrefix and prependPrefix are
      // used for modifying the $templateCache keys.
      // If the key starts with core/ we need to get rid of that.
      stripPrefix: 'core/',
      // Every key must start with /.
      prependPrefix: '/',
    },
    jsonFixturesPreprocessor: {
      variableName: '__fixtures__'
    },

    webpack: {
      mode: 'development',
      resolve: {
        modules: [
          'core/tests/data',
          'assets',
          'core/templates',
          'extensions',
          'node_modules',
          'third_party',
        ],
        extensions: ['.ts', '.js', '.json', '.html', '.svg', '.png'],
        alias: {
          // These both are used so that we can refer to them in imports using
          // their full path: 'assets/{{filename}}'.
          'assets/constants': 'constants.ts',
          'assets/rich_text_components_definitions':
            'rich_text_components_definitions.ts'
        }
      },
      devtool: 'inline-cheap-source-map',
      module: {
        rules: [
          {
            test: /\.ts$/,
            use: [
              'cache-loader',
              {
                loader: 'ts-loader',
                options: {
                  // Typescript checks do the type checking.
                  transpileOnly: true
                }
              },
              {
                loader: 'angular2-template-loader'
              }
            ]
          },
          {
            test: /\.html$/,
            exclude: /(directive|component)\.html$/,
            loader: 'underscore-template-loader'
          },
          {
            test: /(directive|component)\.html$/,
            loader: 'html-loader',
            options: {
              attributes: false,
            },
          },
          {
            // Exclude all the spec files from the report.
            test: /^(?!.*(s|S)pec\.ts$).*\.ts$/,
            enforce: 'post',
            use: {
              loader: 'istanbul-instrumenter-loader',
              options: { esModules: true }
            }
          },
          {
            test: /\.css$/,
            use: [
              {
                loader: 'style-loader',
                options: {
                  esModule: false
                }
              },
              {
                loader: 'css-loader',
                options: {
                  url: false,
                }
              }
            ]
          }
        ]
      }
    }
  });
};
