basePath = '../../';

files = [
  JASMINE,
  JASMINE_ADAPTER,
  'third_party/static/angularjs-1.0.7/angular.min.js',
  'third_party/static/angularjs-1.0.7/angular-resource.min.js',
  'third_party/static/angularjs-1.0.7/angular-sanitize.min.js',
  'third_party/static/angularjs-1.0.7/angular-mocks.js',
  'third_party/static/angular-ui-0.4.0/build/*.js',
  'core/templates/dev/head/assets/js/*.js',
  'core/templates/dev/head/assets/js/services/*.js',
  'core/templates/dev/head/**/*.js',
  'core/templates/dev/head/editor/views/*.js'
];

autoWatch = true;

browsers = ['Chrome'];

// Kill the browser if it does not capture in the given timeout [ms].
captureTimeout = 60000;

junitReporter = {
  outputFile: '../test_out/unit.xml',
  suite: 'unit'
};

reporters = ['progress'];

// Exit after running tests.
singleRun = true;
