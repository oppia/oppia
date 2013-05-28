basePath = '../';

files = [
  JASMINE,
  JASMINE_ADAPTER,
  'third_party/static/angularjs-1.0.3/angular.min.js',
  'third_party/static/angularjs-1.0.3/angular-sanitize.min.js',
  'templates/dev/head/*.js',
  'templates/dev/head/assets/js/*.js',
  'templates/dev/head/assets/js/services/*.js',
  'templates/dev/head/components/*.js',
  'templates/dev/head/editor/*.js',
  'templates/dev/head/editor/views/*.js',
  'templates/dev/head/feedback/*.js',
  'templates/dev/head/gallery/*.js',
  'templates/dev/head/reader/*.js',
  'templates/dev/head/tests/lib/angular/angular-mocks.js',
  'templates/dev/head/tests/unit/**/*.js'
];

autoWatch = true;

browsers = ['Chrome'];

junitReporter = {
  outputFile: '../test_out/unit.xml',
  suite: 'unit'
};
