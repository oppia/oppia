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

oppiaGithubPages.config(['$routeProvider', function($routeProvider) {
  $routeProvider
    .when('/', {
      templateUrl: 'pages/home.html',
      controller: 'mainController',
      projectTag: 'User Documentation'
    })
    .when('/CreatingAnExploration', {
      templateUrl: 'pages/creatingAnExploration.html',
      projectTag: 'Creating an Exploration'
    })
    .when('/Embedded', {
      templateUrl: 'pages/embedded.html',
      projectTag: 'Embedding Your Exploration'
    })
    .when('/Customized', {
      templateUrl: 'pages/customized.html',
      projectTag: 'Customizing States'
    })
    .when('/Improve', {
      templateUrl: 'pages/improve.html',
      projectTag: 'Improve The Exploration'
    })
    .when('/WhatIsOppia', {
      templateUrl: 'pages/whatIsOppia.html',
      projectTag: 'What is Oppia?'
    })
    .when('/KeyConceptsInOppia', {
      templateUrl: 'pages/keyConcepts.html',
      projectTag: 'Key concepts in Oppia'
    })
    .when('/TheExplorationGallery', {
      templateUrl: 'pages/theExplorationGallery.html',
      projectTag: 'The Exploration Gallery'
    })
    .when('/LearnerView', {
      templateUrl: 'pages/learnerView.html',
      projectTag: 'The Exploration Gallery'
    })
    .when('/PlanningYourExploration', {
      templateUrl: 'pages/planningYourExploration.html',
      projectTag: 'Planning Your Exploration'
    })
    .when('/DesignTips', {
      templateUrl: 'pages/designTips.html',
      projectTag: 'Exploration design tips'
    })
    .when('/NoninteractiveContent', {
      templateUrl: 'pages/noninteractiveContent.html',
      projectTag: 'Non-interactive content in Oppia'
    })
    .when('/Interactions', {
      templateUrl: 'pages/interactions.html',
      projectTag: 'Overview of interactions'
    })
    .when('/Rules', {
      templateUrl: 'pages/rules.html',
      projectTag: 'Rules'
    })
    .when('/Parameters', {
      templateUrl: 'pages/parameters.html',
      projectTag: 'Customizing Explorations with Parameters'
    })
    .when('/AuditAndPublishYourExploration', {
      templateUrl: 'pages/auditAndPublishYourExploration.html',
      projectTag: 'Publishing your exploration'
    })
    .when('/ExportingYourExploration', {
      templateUrl: 'pages/exportingYourExploration.html',
      projectTag: 'Exporting your exploration to a zip file'
    })
    .otherwise({
      redirectTo: '/'
    });
}]);

oppiaGithubPages.run(['$location', '$rootScope', function($location, $rootScope) {
  $rootScope.$on('$routeChangeSuccess', function(event, current, previous) {
    $rootScope.projectTag = current.$$route.projectTag;
    $rootScope.title = 'Oppia: ' + current.$$route.projectTag;
  });
}]);
