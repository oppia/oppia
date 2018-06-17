var argv = require('yargs').argv;
var prodEnv = (argv.prod_env === 'True');
var generatedJs = 'third_party/generated/js/third_party.js';
if (prodEnv) {
  generatedJs = (
    'backend_prod_files/third_party/generated/js/third_party.min.js');
}

module.exports = function(config) {
  config.set({
    basePath: '../../',
    // jasmine-jquery is used to load contents of external JSON files in tests.
    frameworks: ['jasmine-jquery', 'jasmine'],
    files: [
      'core/tests/karma-globals.js',
      // Constants must be loaded before everything else.
      'assets/constants.js',
      'assets/rich_text_components_definitions.js',
      // Since jquery,jquery-ui,angular,angular-mocks and math-expressions
      // are not bundled, they will be treated separately.
      'third_party/static/jquery-3.2.1/jquery.min.js',
      'third_party/static/jqueryui-1.12.1/jquery-ui.min.js',
      'third_party/static/angularjs-1.5.8/angular.js',
      'third_party/static/angularjs-1.5.8/angular-mocks.js',
      'third_party/static/headroom-js-0.9.4/headroom.min.js',
      'third_party/static/headroom-js-0.9.4/angular.headroom.min.js',
      'third_party/static/math-expressions-370a77/build/math-expressions.js',
      generatedJs,
      'core/templates/dev/head/*.js',
      // Note that unexpected errors occur ("Cannot read property 'num' of
      // undefined" in MusicNotesInput.js) if the order of core/templates/...
      // and extensions/... are switched. The test framework may be flaky.
      'core/templates/dev/head/**/*.js',
      'core/templates/dev/head/**/*_directive.html',
      'extensions/**/*.js',
      {
        pattern: 'extensions/**/*.png',
        watched: false,
        served: true,
        included: false
      },
      'extensions/interactions/**/*_directive.html',
      'extensions/interactions/rule_templates.json',
      {
        pattern: 'assets/i18n/**/*.json',
        watched: true,
        served: true,
        included: false
      },
      {
        pattern: 'core/tests/data/**/*.json',
        watched: false,
        served: true,
        included: false
      }
    ],
    exclude: [
      'core/templates/dev/head/**/*-e2e.js',
      'extensions/**/protractor.js',
      'backend_prod_files/extensions/**'
    ],
    proxies: {
      // Karma serves files under the /base directory.
      // We access files directly in our code, for example /folder/,
      // so we need to proxy the requests from /folder/ to /base/folder/.
      '/assets/': '/base/assets/',
      '/extensions/': '/base/extensions/'
    },
    preprocessors: {
      'core/templates/dev/head/!(*Spec).js': ['coverage'],
      'core/templates/dev/head/**/!(*Spec).js': ['coverage'],
      'extensions/!(*Spec).js': ['coverage'],
      'extensions/**/!(*Spec).js': ['coverage'],
      // Note that these files should contain only directive templates, and no
      // Jinja expressions. They should also be specified within the 'files'
      // list above.
      'core/templates/dev/head/**/*_directive.html': ['ng-html2js'],
      'extensions/interactions/**/*_directive.html': ['ng-html2js'],
      'extensions/interactions/rule_templates.json': ['json_fixtures']
    },
    reporters: ['progress', 'coverage'],
    coverageReporter: {
      reporters: [{
        type: 'html'
      }, {
        type: 'json'
      }],
      subdir: '.',
      dir: '../karma_coverage_reports/'
    },
    autoWatch: true,
    browsers: ['Chrome_Travis'],
    // Kill the browser if it does not capture in the given timeout [ms].
    captureTimeout: 60000,
    browserConsoleLogOptions: {
      level: 'log',
      format: '%b %T: %m',
      terminal: true
    },
    browserNoActivityTimeout: 60000,
    // Continue running in the background after running tests.
    singleRun: true,
    customLaunchers: {
      Chrome_Travis: {
        base: 'Chrome',
        flags: ['--no-sandbox']
      }
    },
    plugins: [
      'karma-jasmine-jquery',
      'karma-jasmine',
      'karma-chrome-launcher',
      'karma-ng-html2js-preprocessor',
      'karma-json-fixtures-preprocessor',
      'karma-coverage'
    ],
    ngHtml2JsPreprocessor: {
      moduleName: 'directiveTemplates',
      prependPrefix: '/'
    },
    jsonFixturesPreprocessor: {
      variableName: '__fixtures__'
    }
  });
};
