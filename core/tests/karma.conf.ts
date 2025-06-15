var argv = require('yargs').positional('terminalEnabled', {
  type: 'boolean',
  default: false,
}).argv;
var path = require('path');
var webpack = require('webpack');
var generatedJs = 'third_party/generated/js/third_party.js';
if (argv.prodEnv) {
  generatedJs = 'third_party/generated/js/third_party.min.js';
}

// Here we are checking if the specs_to_run flag is provided or not. If it is
// provided, we are splitting the comma separated string into an array of
// strings. We are then creating a regex pattern to match the spec files
// provided in the specs_to_run flag. We are then using this pattern to create
// a context object which will be used in the webpack.ContextReplacementPlugin
// to only run the spec files provided in the specs_to_run flag.
var specsToRun = [];
if (argv.specs_to_run !== undefined) {
  specsToRun = argv.specs_to_run.split(',');
}

const SPECS_PATTERN =
  /^(?!.*(puppeteer-acceptance-tests|((valid|invalid)[_-][\w\d.\-])|@nodelib|openapi3-ts|@bcoe)).*((\.s|S)pec\.ts$|(?<!services_sources)\/[\w\d.\-]*(component|controller|directive|service|Factory)\.ts$)(?<!combined-tests\.spec\.ts)(?<!state-content-editor\.directive\.spec\.ts)(?<!music-notes-input\.spec\.ts)(?<!state-interaction-editor\.directive\.spec\.ts)/;

let context = SPECS_PATTERN;
if (argv.specs_to_run !== undefined) {
  context = specsToRun.reduce((context, file) => {
    if (!SPECS_PATTERN.test(file)) {
      return context;
    }
    const relativeFile = `./${file}`;
    context[relativeFile] = relativeFile;
    return context;
  }, {});
}

const webpackPlugins = [];
if (argv.specs_to_run !== undefined) {
  webpackPlugins.push(
    new webpack.ContextReplacementPlugin(
      /(:?)/,
      path.resolve(__dirname, '..', '..'),
      context
    )
  );
} else {
  webpackPlugins.push(new webpack.ContextReplacementPlugin(/(:?)/, context));
}
// Generate a random number between 0 and 999 to use as the seed for the
// frontend test execution order.
let jasmineSeed = Math.floor(Math.random() * 1000);
// eslint-disable-next-line no-console
console.log(`Seed for Frontend Test Execution Order ${jasmineSeed}`);

module.exports = function (config) {
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
        included: false,
      },
      {
        pattern: 'extensions/**/*.png',
        watched: false,
        served: true,
        included: false,
      },
      'extensions/interactions/**/*.component.html',
      'extensions/interactions/*.json',
      'core/tests/data/*.json',
    ],
    exclude: [
      'local_compiled_js/core/templates/**/*-e2e.js',
      'local_compiled_js/extensions/**/protractor.js',
      'backend_prod_files/extensions/**',
      'core/tests/puppeteer-acceptance-tests/*',
    ],
    proxies: {
      // Karma serves files under the /base directory.
      // We access files directly in our code, for example /folder/,
      // so we need to proxy the requests from /folder/ to /base/folder/.
      '/assets/': '/base/assets/',
      '/extensions/': '/base/extensions/',
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
      'core/tests/data/*.json': ['json_fixtures'],
    },
    client: {
      jasmine: {
        random: true,
        seed: jasmineSeed,
      },
    },
    crossOriginAttribute: true,
    reporters: ['progress', 'coverage-istanbul'],
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
    captureTimeout: 60000,
    browserNoActivityTimeout: 120000,
    browserDisconnectTimeout: 60000,
    browserDisconnectTolerance: 3,
    browserConsoleLogOptions: {
      level: 'log',
      format: '%b %T: %m',
      terminal: argv.terminalEnabled,
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
          '--js-flags=--max-old-space-size=4096',
        ],
      },
    },

    plugins: [
      'karma-coverage-istanbul-reporter',
      'karma-jasmine',
      'karma-chrome-launcher',
      'karma-ng-html2js-preprocessor',
      'karma-json-fixtures-preprocessor',
      'karma-coverage',
      'karma-webpack',
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
      variableName: '__fixtures__',
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
            'rich_text_components_definitions.ts',
        },
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
                  transpileOnly: true,
                },
              },
              {
                loader: path.resolve(
                  'angular-template-style-url-replacer.webpack-loader'
                ),
              },
            ],
          },
          {
            test: /\.html$/,
            exclude: /(directive|component)\.html$/,
            loader: 'underscore-template-loader',
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
              options: {esModules: true},
            },
          },
          {
            test: /\.css$/,
            use: [
              {
                loader: 'style-loader',
                options: {
                  esModule: false,
                },
              },
              {
                loader: 'css-loader',
                options: {
                  url: false,
                },
              },
            ],
          },
        ],
      },
      plugins: webpackPlugins,
    },
  });
};
