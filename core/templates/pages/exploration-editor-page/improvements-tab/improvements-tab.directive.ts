// Copyright 2018 The Oppia Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Directive for the exploration improvements tab in the
 * exploration editor.
 */

require(
  'pages/exploration-editor-page/improvements-tab/' +
  'answer-details-improvement-task/answer-details-improvement-task.directive.ts'
);
require(
  'pages/exploration-editor-page/improvements-tab/' +
  'feedback-improvement-task/feedback-improvement-task.directive.ts'
);
require(
  'pages/exploration-editor-page/improvements-tab/' +
  'playthrough-improvement-task/playthrough-improvement-task.directive.ts'
);
require(
  'pages/exploration-editor-page/improvements-tab/' +
  'suggestion-improvement-task/suggestion-improvement-task.directive.ts'
);

require('domain/utilities/url-interpolation.service.ts');
require('services/improvement-task.service.ts');
require(
  'pages/exploration-editor-page/improvements-tab/services/' +
  'improvements-display.service.ts');

angular.module('oppia').directive('improvementsTab', [
  'UrlInterpolationService', function(UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {},
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/exploration-editor-page/improvements-tab/' +
        'improvements-tab.directive.html'),
      controller: [
        '$scope', 'ImprovementTaskService', 'ImprovementsDisplayService',
        function($scope, ImprovementTaskService, ImprovementsDisplayService) {
          var ctrl = this;
          var fetchedTasks = [];

          $scope.getStatusCssClass = function(status) {
            return ImprovementsDisplayService.getStatusCssClass(status);
          };

          $scope.getHumanReadableStatus = function(status) {
            return ImprovementsDisplayService.getHumanReadableStatus(status);
          };

          $scope.getTasks = function() {
            return fetchedTasks;
          };

          $scope.isTaskOpen = function(task) {
            return ImprovementsDisplayService.isOpen(task.getStatus());
          };

          $scope.isTaskShown = function(task) {
            return $scope.isTaskOpen(task) || !$scope.onlyShowOpenTasks;
          };

          $scope.getTaskTitle = function(task) {
            return task.getTitle();
          };

          $scope.isTaskObsolete = function(task) {
            return task.isObsolete();
          };

          $scope.getOpenTaskCount = function() {
            return fetchedTasks.filter($scope.isTaskOpen).length;
          };

          ctrl.$onInit = function() {
            ImprovementTaskService.fetchTasks().then(function(tasks) {
              fetchedTasks = tasks;
            });
            $scope.onlyShowOpenTasks = true;
          };
        }
      ],
    };
  }]);
