// Copyright 2015 The Oppia Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

var oppiaGithubPages = angular.module('oppiaGithubPages', ['ngRoute']);
// configure our routes
oppiaGithubPages.config(['$routeProvider', function($routeProvider) {
  $routeProvider
    .when('/', {
      templateUrl: 'pages/home.html',
      controller: 'mainController',
      projectTag: 'A tool for creating interactive tutors'
    })
    .when('/wiki/Embedded', {
      templateUrl: 'pages/wiki/embedded.html',
      controller: 'embeddedController',
      projectTag: 'Embedding Your Exploration'
    })
    .when('/wiki/Customized', {
      templateUrl: 'pages/wiki/customized.html',
      controller: 'customizedController',
      projectTag: 'Customizing States'
    })
    .when('/wiki/Improve', {
      templateUrl: 'pages/wiki/improve.html',
      controller: 'improveController',
      projectTag: 'Improve The Exploration'
    })
    .when('/wiki/WhatIsOppia', {
      templateUrl: 'pages/wiki/whatIsOppia.html',
      controller: 'whatIsOppiaController',
      projectTag: 'What is Oppia?'
    })
    .when('/wiki/KeyConceptsInOppia', {
      templateUrl: 'pages/wiki/keyConcepts.html',
      controller: 'keyConceptsInOppiaController',
      projectTag: 'Key concepts in Oppia'
    })
    .when('/wiki/TheExplorationGallery', {
      templateUrl: 'pages/wiki/theExplorationGallery.html',
      controller: 'theExplorationGalleryController',
      projectTag: 'The Exploration Gallery'
    })
    .otherwise({
      redirectTo: '/'
    });
}]);

oppiaGithubPages.run(['$location', '$rootScope', function($location, $rootScope) {
  $rootScope.$on('$routeChangeSuccess', function(event, current, previous) {
    $rootScope.projectTag = current.$$route.projectTag;
    $rootScope.title = 'OppiaGithub-' + current.$$route.projectTag;
  });
}]);

// TODO:(create separate files for controllers)
oppiaGithubPages.controller('mainController', function($scope) {

});

oppiaGithubPages.controller('customizedController', function($scope) {

});

oppiaGithubPages.controller('embeddedController', function($scope) {

});

oppiaGithubPages.controller('improveController', function($scope) {

});

oppiaGithubPages.controller('whatIsOppiaController', function($scope) {

});

oppiaGithubPages.controller('keyConceptsInOppiaController', function($scope) {

});

oppiaGithubPages.controller('theExplorationGalleryController', function($scope) {

});
