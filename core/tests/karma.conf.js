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
      'core/templates/dev/head/**/*.js',
      'core/templates/dev/head/**/*.html',
      'extensions/widgets/interactive/**/*.js',
      'extensions/widgets/interactive/**/*.html'
    ],
    exclude: [
      'core/templates/dev/head/**/*-e2e.js'
    ],
    preprocessors: {
      'core/templates/dev/head/**/*.js': ['coverage'],
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
    singleRun: false
  });
};
