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

require('domain/utilities/UrlInterpolationService.ts');
require('pages/exploration-player-page/services/exploration-engine.service.ts');
require('pages/exploration-player-page/services/exploration-player-state.service.ts');
require('pages/exploration-player-page/layout-directives/feedback-popup.directive.ts');
require('pages/exploration-player-page/services/player-position.service.ts');
require(
  'pages/exploration-player-page/' +
  'suggestion-modal-for-learner-local-view/' +
  'suggestion-modal-for-learner-local-view.service.ts');
require('services/AlertsService.ts');
require('services/UserService.ts');
require('services/stateful/FocusManagerService.ts');

oppia.constant(
  'FLAG_EXPLORATION_URL_TEMPLATE', '/flagexplorationhandler/<exploration_id>');

oppia.controller('LearnerLocalNav', [
  '$http', '$rootScope', '$scope', '$uibModal', 'AlertsService',
  'ExplorationEngineService', 'ExplorationPlayerStateService',
  'FocusManagerService', 'SuggestionModalForLearnerLocalViewService',
  'UrlInterpolationService', 'UserService', 'FEEDBACK_POPOVER_PATH',
  'FLAG_EXPLORATION_URL_TEMPLATE',
  function(
      $http, $rootScope, $scope, $uibModal, AlertsService,
      ExplorationEngineService, ExplorationPlayerStateService,
      FocusManagerService, SuggestionModalForLearnerLocalViewService,
      UrlInterpolationService, UserService, FEEDBACK_POPOVER_PATH,
      FLAG_EXPLORATION_URL_TEMPLATE) {
    $scope.explorationId = ExplorationEngineService.getExplorationId();
    $scope.canEdit = GLOBALS.canEdit;
    $scope.username = '';
    $rootScope.loadingMessage = 'Loading';
    UserService.getUserInfoAsync().then(function(userInfo) {
      $scope.username = userInfo.getUsername();
      $rootScope.loadingMessage = '';
    });

    $scope.getFeedbackPopoverUrl = function() {
      return UrlInterpolationService.getDirectiveTemplateUrl(
        FEEDBACK_POPOVER_PATH);
    };

    $scope.showLearnerSuggestionModal = function() {
      SuggestionModalForLearnerLocalViewService.showSuggestionModal(
        'edit_exploration_state_content', {});
    };
    $scope.showFlagExplorationModal = function() {
      $uibModal.open({
        templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
          '/pages/exploration-player-page/templates/' +
          'flag-exploration-modal.template.html'),
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
            '/pages/exploration-player-page/templates/' +
            'exploration-successfully-flagged-modal.template.html'),
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
