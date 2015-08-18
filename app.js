	// create the module and name it oppia
	var oppia = angular.module('oppiaApp', ['ngRoute']);

	// configure our routes
	oppia.config(['$routeProvider', function($routeProvider) {
	  $routeProvider
	    .when('/', {
	      templateUrl: 'pages/home.html',
	      controller: 'mainController',
	      project_tag: 'A tool for creating interactive tutors'
	    })

	  // route for the embedded page
	  .when('/embedded', {
	      templateUrl: 'pages/embedded.html',
	      controller: 'embeddedController',
	      project_tag: 'Embedding Your Exploration'
	    })
	    // route for the customized page
	  .when('/customized', {
	      templateUrl: 'pages/customized.html',
	      controller: 'customizedController',
	      project_tag: 'Customizing States'
	    })


	  // route for the improve page
	  .when('/improve', {
	    templateUrl: 'pages/improve.html',
	    controller: 'improveController',
	    project_tag: 'Improve The Exploration'
	  });

	}]);

	oppia.run(['$location', '$rootScope', function($location, $rootScope) {
	  $rootScope.$on('$routeChangeSuccess', function(event, current, previous) {
	    $rootScope.project_tag = current.$$route.project_tag;
	  });
	}]);

	// TODO:(create separate files for controllers)
	oppia.controller('mainController', function($scope) {


	});

	oppia.controller('customizedController', function($scope) {


	});

	oppia.controller('embeddedController', function($scope) {

	});

	oppia.controller('improveController', function($scope) {

	});
