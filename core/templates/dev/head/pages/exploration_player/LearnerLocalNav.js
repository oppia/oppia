// Copyright 2014 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Controller for the local navigation in the learner view.
 */
oppia.constant(
  'FLAG_EXPLORATION_URL_TEMPLATE', '/flagexplorationhandler/<exploration_id>');

oppia.controller('LearnerLocalNav', [
  '$scope', '$modal', '$http', 'oppiaPlayerService', 'alertsService',
  'UrlInterpolationService', 'focusService', 'FLAG_EXPLORATION_URL_TEMPLATE',
  function($scope, $modal, $http, oppiaPlayerService, alertsService,
    UrlInterpolationService, focusService, FLAG_EXPLORATION_URL_TEMPLATE) {
    $scope.explorationId = oppiaPlayerService.getExplorationId();
    $scope.showLearnerSuggestionModal = function() {
      $modal.open({
        templateUrl: 'modals/learnerViewSuggestion',
        backdrop: 'static',
        resolve: {},
        controller: [
          '$scope', '$modalInstance', '$timeout', 'playerPositionService',
          'oppiaPlayerService',
          function(
              $scope, $modalInstance, $timeout, playerPositionService,
              oppiaPlayerService) {
            var stateName = playerPositionService.getCurrentStateName();
            $scope.initContent = oppiaPlayerService.getStateContentHtml(
              stateName);
            $scope.description = '';
            $scope.suggestionContent = $scope.initContent;
            $scope.showEditor = false;
            // Rte initially displays content unrendered for a split second
            $timeout(function() {
              $scope.showEditor = true;
            }, 500);

            $scope.cancelSuggestion = function() {
              $modalInstance.dismiss('cancel');
            };

            $scope.submitSuggestion = function() {
              $modalInstance.close({
                id: oppiaPlayerService.getExplorationId(),
                version: oppiaPlayerService.getExplorationVersion(),
                stateName: stateName,
                description: $scope.description,
                suggestionContent: $scope.suggestionContent
              });
            };
          }]
      }).result.then(function(result) {
        $http.post('/suggestionhandler/' + result.id, {
          exploration_version: result.version,
          state_name: result.stateName,
          description: result.description,
          suggestion_content: {
            type: 'text',
            value: result.suggestionContent
          }
        }).error(function(res) {
          alertsService.addWarning(res);
        });
        $modal.open({
          templateUrl: 'modals/learnerSuggestionSubmitted',
          backdrop: true,
          resolve: {},
          controller: [
            '$scope', '$modalInstance',
            function($scope, $modalInstance) {
              $scope.close = function() {
                $modalInstance.dismiss();
              };
            }
          ]
        });
      });
    };

    $scope.showFlagExplorationModal = function() {
      $modal.open({
        templateUrl: 'modals/flagExploration',
        backdrop: true,
        controller: [
            '$scope', '$modalInstance', 'playerPositionService',
          function($scope, $modalInstance, playerPositionService) {
            $scope.flagMessageTextareaIsShown = false;
            var stateName = playerPositionService.getCurrentStateName();

            $scope.showFlagMessageTextarea = function(value) {
              if (value) {
                $scope.flagMessageTextareaIsShown = true;
                focusService.setFocus('flagMessageTextarea');
              }
            };

            $scope.submitReport = function() {
              if ($scope.flagMessage) {
                $modalInstance.close({
                  report_type: $scope.flag,
                  report_text: $scope.flagMessage,
                  state: stateName
                });
              }
            };

            $scope.cancel = function() {
              $modalInstance.dismiss('cancel');
            };
          }
        ]
      }).result.then(function(result) {
        var flagExplorationUrl = UrlInterpolationService.interpolateUrl(
            FLAG_EXPLORATION_URL_TEMPLATE, {
              exploration_id: $scope.explorationId
            }
        );
        var report = (
          '[' + result.state + '] (' + result.report_type + ') ' +
          result.report_text);
        $http.post(flagExplorationUrl, {
          report_text: report
        }).error(function(error) {
          alertsService.addWarning(error);
        });
        $modal.open({
          templateUrl: 'modals/explorationSuccessfullyFlagged',
          backdrop: true,
          controller: [
            '$scope', '$modalInstance',
            function($scope, $modalInstance) {
              $scope.close = function() {
                $modalInstance.dismiss('cancel');
              };
            }
          ]
        });
      });
    };
  }
]);
