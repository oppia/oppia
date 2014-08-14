module.exports = function(config) {
  config.set({
    basePath: '../../',
    frameworks: ['jasmine'],
    files: [
      'third_party/static/jquery-2.0.3/jquery.min.js',
      'third_party/static/jqueryui-1.10.3/jquery-ui.min.js',
      'third_party/static/angularjs-1.2.0-rc.3/angular.js',
      'third_party/static/angularjs-1.2.0-rc.3/angular-resource.min.js',
      'third_party/static/angularjs-1.2.0-rc.3/angular-sanitize.min.js',
      'third_party/static/angularjs-1.2.0-rc.3/angular-mocks.js',
      'third_party/static/ui-bootstrap-0.10.0/ui-bootstrap-tpls-0.10.0.js',
      'third_party/static/ui-codemirror-0.1.1/src/ui-codemirror.js',
      'third_party/static/ui-utils-0.1.1/ui-utils.js',
      'third_party/static/ui-map-0.5.0/ui-map.js',
      'third_party/static/ui-sortable-0.12.6/src/sortable.js',
      'core/templates/dev/head/*.js',
      // Note that unexpected errors occur ("Cannot read property 'num' of
      // undefined" in MusicNotesInput.js) if the order of core/templates/...
      // and extensions/widgets/... are switched. The test framework may
      // be flaky.
      'core/templates/dev/head/**/*.js',
      'extensions/widgets/interactive/**/*.js',
      'extensions/widgets/interactive/**/*.html'
    ],
    exclude: [
      'core/templates/dev/head/**/*-e2e.js'
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
      'core/templates/dev/head/admin/*.js': ['coverage'],
      'core/templates/dev/head/components/*.js': ['coverage'],
      'core/templates/dev/head/css/*.js': ['coverage'],
      'core/templates/dev/head/editor/*.js': ['coverage'],
      'core/templates/dev/head/error/*.js': ['coverage'],
      'core/templates/dev/head/galleries/*.js': ['coverage'],
      'core/templates/dev/head/moderator/*.js': ['coverage'],
      'core/templates/dev/head/pages/*.js': ['coverage'],
      'core/templates/dev/head/player/*.js': ['coverage'],
      'core/templates/dev/head/profile/*.js': ['coverage'],
      'core/templates/dev/head/services/*.js': ['coverage'],
      'core/templates/dev/head/tests/*.js': ['coverage'],
      'extensions/widgets/interactive/**/*.js': ['coverage'],
      'core/templates/dev/head/**/*.html': ['ng-html2js'],
      'extensions/widgets/interactive/**/*.html': ['ng-html2js']
    },
    reporters: ['progress', 'coverage'],
    coverageReporter: {
      type: 'html',
      dir: '../karma_coverage_reports/'
    },
    autoWatch: true,
    browsers: ['Chrome'],
    // Kill the browser if it does not capture in the given timeout [ms].
    captureTimeout: 60000,
    // Continue running in the background after running tests.
    singleRun: false,
    plugins: [
      'karma-jasmine',
      'karma-chrome-launcher',
      'karma-ng-html2js-preprocessor',
      'karma-coverage'
    ],
    ngHtml2JsPreprocessor: {
      cacheIdFromPath: function(filepath) {
        return filepath;
      },
      moduleName: 'directiveTemplates'
    }
  });
};
