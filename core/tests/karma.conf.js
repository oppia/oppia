module.exports = function(config) {
  config.set({
    basePath: '../../',
    frameworks: ['jasmine'],
    files: [
      'core/tests/karma-globals.js',
      'third_party/static/jquery-2.1.1/jquery.min.js',
      'third_party/static/jqueryui-1.10.3/jquery-ui.min.js',
      'third_party/static/angularjs-1.3.13/angular.js',
      'third_party/static/angularjs-1.3.13/angular-animate.js',
      'third_party/static/angularjs-1.3.13/angular-aria.js',
      'third_party/static/angularjs-1.3.13/angular-resource.js',
      'third_party/static/angularjs-1.3.13/angular-sanitize.js',
      'third_party/static/angularjs-1.3.13/angular-mocks.js',
      'third_party/static/ui-bootstrap-0.12.0/ui-bootstrap-tpls-0.12.0.js',
      'third_party/static/ui-codemirror-0.1.2/src/ui-codemirror.js',
      'third_party/static/ui-utils-0.1.1/ui-utils.js',
      'third_party/static/ui-map-0.5.0/ui-map.js',
      'third_party/static/ui-sortable-0.12.6/src/sortable.js',
      'third_party/static/bower-material-0.6.0-rc1/angular-material.js',
      'third_party/static/hammer-js-2.0.4/hammer.js',
      'third_party/static/ng-joyride-0.1.11/ng-joyride.js',
      'third_party/static/nginfinitescroll-1.0.0/ng-infinite-scroll.min.js',
      'third_party/static/ng-img-crop-0.3.2/compile/minified/ng-img-crop.js',
      'third_party/static/textAngular-1.3.7/src/textAngular.js',
      'third_party/static/textAngular-1.3.7/src/textAngularSetup.js',
      // 'third_party/static/textAngular-1.3.7/src/textAngular-sanitize.js',
      'third_party/static/textAngular-1.3.7/dist/textAngular-rangy.min.js',
      'core/templates/dev/head/*.js',
      // Note that unexpected errors occur ("Cannot read property 'num' of
      // undefined" in MusicNotesInput.js) if the order of core/templates/...
      // and extensions/... are switched. The test framework may be flaky.
      'core/templates/dev/head/**/*.js',
      'core/templates/dev/head/components/ratings.html',
      'extensions/**/*.js',
      'extensions/interactions/**/*.html',
      'extensions/skins/**/*.html'
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
      'core/templates/dev/head/admin/!(*Spec).js': ['coverage'],
      'core/templates/dev/head/components/!(*Spec).js': ['coverage'],
      'core/templates/dev/head/css/!(*Spec).js': ['coverage'],
      'core/templates/dev/head/dashboard/!(*Spec).js': ['coverage'],
      'core/templates/dev/head/editor/!(*Spec).js': ['coverage'],
      'core/templates/dev/head/error/!(*Spec).js': ['coverage'],
      'core/templates/dev/head/expressions/!(*Spec).js': ['coverage'],
      'core/templates/dev/head/forms/!(*Spec).js': ['coverage'],
      'core/templates/dev/head/galleries/!(*Spec).js': ['coverage'],
      'core/templates/dev/head/moderator/!(*Spec).js': ['coverage'],
      'core/templates/dev/head/pages/!(*Spec).js': ['coverage'],
      'core/templates/dev/head/player/!(*Spec).js': ['coverage'],
      'core/templates/dev/head/profile/!(*Spec).js': ['coverage'],
      'core/templates/dev/head/services/!(*Spec).js': ['coverage'],
      'core/templates/dev/head/tests/!(*Spec).js': ['coverage'],
      'extensions/**/!(*Spec).js': ['coverage'],
      // Note that these files should contain only directive templates, and no
      // Jinja expressions. They should also be specified within the 'files'
      // list above.
      'core/templates/dev/head/components/ratings.html': ['ng-html2js'],
      'extensions/interactions/**/*.html': ['ng-html2js'],
      'extensions/skins/**/*.html': ['ng-html2js']
    },
    reporters: ['progress', 'coverage'],
    coverageReporter: {
      type: 'html',
      dir: '../karma_coverage_reports/'
    },
    autoWatch: true,
    browsers: ['Chrome_Travis'],
    // Kill the browser if it does not capture in the given timeout [ms].
    captureTimeout: 60000,
    // Continue running in the background after running tests.
    singleRun: true,
    customLaunchers: {
      Chrome_Travis: {
        base: 'Chrome',
        flags: ['--no-sandbox']
      }
    },
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
