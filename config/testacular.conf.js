basePath = '../';

files = [
  JASMINE,
  JASMINE_ADAPTER,
  'third_party/angularjs/angular.min.js',
  'third_party/angularjs/angular-sanitize.min.js',
  'templates/dev/head/js/base.js',
  'templates/dev/head/js/*.js',
  'templates/dev/head/js/tests/lib/angular/angular-mocks.js',
  'templates/dev/head/js/tests/unit/**/*.js'
];

autoWatch = true;

browsers = ['Chrome'];

junitReporter = {
  outputFile: '../test_out/unit.xml',
  suite: 'unit'
};
