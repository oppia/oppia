var argv = require('yargs').argv;
var isMinificationNeeded = (argv.minify === 'True');
var generatedJs = 'third_party/generated/js/third_party.js';
if (isMinificationNeeded) {
  generatedJs = 'third_party/generated/js/third_party.min.js';
};

module.exports = function(config) {
  config.set({
    basePath: '../../',
    frameworks: ['jasmine'],
    files: [
      'core/tests/karma-globals.js',
      // Since jquery,jquery-ui,angular,angular-mocks and math-expressions
      // are not bundled, they will be treated separately.
      'third_party/static/jquery-3.0.0/jquery.min.js',
      'third_party/static/jqueryui-1.10.3/jquery-ui.min.js',
      'third_party/static/angularjs-1.5.8/angular.js',
      'third_party/static/angularjs-1.5.8/angular-mocks.js',
      'third_party/static/math-expressions-10186a/build/math-expressions.js',
      generatedJs,
      'core/templates/dev/head/*.js',
      // Note that unexpected errors occur ("Cannot read property 'num' of
      // undefined" in MusicNotesInput.js) if the order of core/templates/...
      // and extensions/... are switched. The test framework may be flaky.
      'core/templates/dev/head/**/*.js',
      'core/templates/dev/head/components/rating_display.html',
      'extensions/**/*.js',
      'extensions/interactions/**/*.html',
      'extensions/interactions/rules.json',
      {
        pattern: 'assets/i18n/**/*.json',
        watched: true,
        served: true,
        included: false
      }
    ],
    exclude: [
      'core/templates/dev/head/**/*-e2e.js',
      'extensions/**/protractor.js'
    ],
    preprocessors: {
      'core/templates/dev/head/*.js': ['coverage'],
      // When all controllers were converted from global functions into the
      // oppia.controller() format, the syntax 'core/templates/dev/head/*/*.js'
      // and 'core/templates/dev/head/**/*.js' stopped working, and resulted in
      // "Uncaught TypeError: Cannot read property '2' of undefined" for all
      // the JS files. So we enumerate all the directories directly (which,
      // although it should give an identical result, seems to actually cause
      // no problems). Note that this only affects which files have coverage
      // statistics generated for them, and that if a directory is omitted by
      // accident, that directory will not have coverage statistics generated
      // for it, which is easily fixed.
      'core/templates/dev/head/components/!(*Spec).js': ['coverage'],
      'core/templates/dev/head/domain/**/!(*Spec).js': ['coverage'],
      'core/templates/dev/head/expressions/!(*Spec).js': ['coverage'],
      'core/templates/dev/head/forms/!(*Spec).js': ['coverage'],
      'core/templates/dev/head/pages/**/!(*Spec).js': ['coverage'],
      'core/templates/dev/head/services/!(*Spec).js': ['coverage'],
      'extensions/**/!(*Spec).js': ['coverage'],
      // Note that these files should contain only directive templates, and no
      // Jinja expressions. They should also be specified within the 'files'
      // list above.
      'core/templates/dev/head/components/rating_display.html': ['ng-html2js'],
      'extensions/interactions/**/*.html': ['ng-html2js'],
      'extensions/interactions/rules.json': ['json_fixtures']
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
      cacheIdFromPath: function(filepath) {
        return filepath;
      },
      moduleName: 'directiveTemplates'
    },
    jsonFixturesPreprocessor: {
      variableName: '__fixtures__'
    }
  });
};
