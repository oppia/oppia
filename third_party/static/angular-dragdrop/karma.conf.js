module.exports = function(config) {
  var configuration = {
    basePath: '',
    frameworks: ['jasmine'],
    files: [
      'components/jquery/dist/jquery.js',
      'components/jquery-ui/jquery-ui.min.js',
      'components/angular/angular.js',
      'components/angular-mocks/angular-mocks.js',
      'src/angular-dragdrop.js',
      'test/spec/*.js'
    ],
    singleRun: true,
    browsers: ['Chrome'],
    customLaunchers: {
      Chrome_travis_ci: {
        base: 'Chrome',
        flags: ['--no-sandbox']
      }
    }
  };

  if(process.env.TRAVIS){
    configuration.browsers = ['Chrome_travis_ci'];
  }

  config.set(configuration);
};