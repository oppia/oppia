basePath = '../../';

frameworks = ['ng-scenario'];

files = [
  ANGULAR_SCENARIO,
  ANGULAR_SCENARIO_ADAPTER,
	'core/templates/dev/head/**/*-e2e.js'
];

port = 8181;

autoWatch = false;

browsers = ['Chrome'];

singleRun = false;

proxies = {
	'/': 'http://localhost:8181/'
};

urlRoot = '/_karma_/';
