basePath = '../';

files = [
  JASMINE,
  JASMINE_ADAPTER,
  'third_party/static/angularjs-1.0.3/angular.min.js',
  'third_party/static/angularjs-1.0.3/angular-sanitize.min.js',
  'third_party/static/angularjs-1.0.3/angular-mocks.js',
  'templates/dev/head/assets/js/*.js',
  'templates/dev/head/assets/js/services/*.js',
  'templates/dev/head/**/*.js',
  'templates/dev/head/editor/views/*.js'
];

autoWatch = true;

browsers = ['Chrome'];

junitReporter = {
  outputFile: '../test_out/unit.xml',
  suite: 'unit'
};
