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
  '$scope', '$uibModal', '$http', 'ExplorationPlayerService', 'AlertsService',
  'FocusManagerService', 'UrlInterpolationService',
  'FLAG_EXPLORATION_URL_TEMPLATE',
  function(
      $scope, $uibModal, $http, ExplorationPlayerService, AlertsService,
      FocusManagerService, UrlInterpolationService,
      FLAG_EXPLORATION_URL_TEMPLATE) {
    $scope.explorationId = ExplorationPlayerService.getExplorationId();
    $scope.canEdit = GLOBALS.canEdit;
    $scope.username = GLOBALS.username;
    $scope.showLearnerSuggestionModal = function() {
      $uibModal.open({
        templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
          '/pages/exploration_player/' +
          'learner_view_suggestion_modal_directive.html'),
        backdrop: 'static',
        resolve: {},
        controller: [
          '$scope', '$uibModalInstance', '$timeout', 'PlayerPositionService',
          'ExplorationPlayerService',
          function(
              $scope, $uibModalInstance, $timeout, PlayerPositionService,
              ExplorationPlayerService) {
            var stateName = PlayerPositionService.getCurrentStateName();
            $scope.originalHtml = ExplorationPlayerService.getStateContentHtml(
              stateName);
            $scope.description = '';
            $scope.suggestionHtml = $scope.originalHtml;
            $scope.showEditor = false;
            // Rte initially displays content unrendered for a split second
            $timeout(function() {
              $scope.showEditor = true;
            }, 500);

            $scope.cancelSuggestion = function() {
              $uibModalInstance.dismiss('cancel');
            };

            $scope.submitSuggestion = function() {
              $uibModalInstance.close({
                id: ExplorationPlayerService.getExplorationId(),
                version: ExplorationPlayerService.getExplorationVersion(),
                stateName: stateName,
                description: $scope.description,
                suggestionHtml: $scope.suggestionHtml
              });
            };
          }]
      }).result.then(function(result) {
        $http.post('/suggestionhandler/' + result.id, {
          exploration_version: result.version,
          state_name: result.stateName,
          description: result.description,
          suggestion_html: result.suggestionHtml
        }).error(function(res) {
          AlertsService.addWarning(res);
        });
        $uibModal.open({
          templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
            '/pages/exploration_player/' +
            'learner_suggestion_submitted_modal_directive.html'),
          backdrop: true,
          resolve: {},
          controller: [
            '$scope', '$uibModalInstance',
            function($scope, $uibModalInstance) {
              $scope.close = function() {
                $uibModalInstance.dismiss();
              };
            }
          ]
        });
      });
    };
    $scope.showFlagExplorationModal = function() {
      $uibModal.open({
        templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
          '/pages/exploration_player/flag_exploration_modal_directive.html'),
        backdrop: true,
        controller: [
          '$scope', '$uibModalInstance', 'PlayerPositionService',
          function($scope, $uibModalInstance, PlayerPositionService) {
            $scope.flagMessageTextareaIsShown = false;
            var stateName = PlayerPositionService.getCurrentStateName();

            $scope.showFlagMessageTextarea = function(value) {
              if (value) {
                $scope.flagMessageTextareaIsShown = true;
                FocusManagerService.setFocus('flagMessageTextarea');
              }
            };

            $scope.submitReport = function() {
              if ($scope.flagMessage) {
                $uibModalInstance.close({
                  report_type: $scope.flag,
                  report_text: $scope.flagMessage,
                  state: stateName
                });
              }
            };

            $scope.cancel = function() {
              $uibModalInstance.dismiss('cancel');
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
          AlertsService.addWarning(error);
        });
        $uibModal.open({
          templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
            '/pages/exploration_player/' +
            'exploration_successfully_flagged_modal_directive.html'),
          backdrop: true,
          controller: [
            '$scope', '$uibModalInstance',
            function($scope, $uibModalInstance) {
              $scope.close = function() {
                $uibModalInstance.dismiss('cancel');
              };
            }
          ]
        });
      });
    };
  }
]);
