// Copyright 2019 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Service to display suggestion modal in learner local view.
 */

require('domain/utilities/UrlInterpolationService.ts');
require('pages/exploration-player-page/services/exploration-engine.service.ts');
require('pages/exploration-player-page/services/player-position.service.ts');
require('pages/exploration-player-page/services/player-transcript.service.ts');
require('services/AlertsService.ts');
require('services/SuggestionModalService.ts');

var oppia = require('AppInit.ts').module;

oppia.factory('SuggestionModalForExplorationPlayerService', [
  '$http', '$uibModal', 'AlertsService', 'UrlInterpolationService',
  function($http, $uibModal, AlertsService, UrlInterpolationService) {
    var _templateUrl = UrlInterpolationService.getDirectiveTemplateUrl(
      '/pages/exploration-player-page/templates/' +
      'exploration-player-suggestion-modal.directive.html'
    );

    var _showEditStateContentSuggestionModal = function() {
      $uibModal.open({
        templateUrl: _templateUrl,
        backdrop: 'static',
        resolve: {},
        controller: [
          '$scope', '$timeout', '$uibModalInstance', 'ExplorationEngineService',
          'PlayerPositionService', 'PlayerTranscriptService',
          'SuggestionModalService',
          function(
              $scope, $timeout, $uibModalInstance, ExplorationEngineService,
              PlayerPositionService, PlayerTranscriptService,
              SuggestionModalService) {
            var stateName = PlayerPositionService.getCurrentStateName();
            var displayedCard = PlayerTranscriptService.getCard(
              PlayerPositionService.getDisplayedCardIndex());
            $scope.originalHtml = displayedCard.getContentHtml();
            $scope.description = '';
            // ng-model needs to bind to a property of an object on
            // the scope (the property cannot sit directly on the scope)
            // Reference https://stackoverflow.com/q/12618342
            $scope.suggestionData = {suggestionHtml: $scope.originalHtml};
            $scope.showEditor = false;
            // Rte initially displays content unrendered for a split second
            $timeout(function() {
              $scope.showEditor = true;
            }, 500);

            $scope.cancelSuggestion = function() {
              SuggestionModalService.cancelSuggestion($uibModalInstance);
            };
            $scope.submitSuggestion = function() {
              var data = {
                target_id: ExplorationEngineService.getExplorationId(),
                version: ExplorationEngineService.getExplorationVersion(),
                stateName: stateName,
                suggestion_type: 'edit_exploration_state_content',
                target_type: 'exploration',
                description: $scope.description,
                suggestionHtml: $scope.suggestionData.suggestionHtml,
              };
              $uibModalInstance.close(data);
            };
          }],
      }).result.then(function(result) {
        var data = {
          suggestion_type: result.suggestion_type,
          target_type: result.target_type,
          target_id: result.target_id,
          target_version_at_submission: result.version,
          assigned_reviewer_id: null,
          final_reviewer_id: null,
          description: result.description,
          change: {
            cmd: 'edit_state_property',
            property_name: 'content',
            state_name: result.stateName,
            new_value: {
              html: result.suggestionHtml
            }
          }
        };
        var url = '/suggestionhandler/';

        $http.post(url, data).error(function(res) {
          AlertsService.addWarning(res);
        });
        $uibModal.open({
          templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
            '/pages/exploration-player-page/templates/' +
            'learner-suggestion-submitted-modal.template.html'),
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

    return {
      showSuggestionModal: function(suggestionType, extraParams) {
        if (suggestionType === 'edit_exploration_state_content') {
          _showEditStateContentSuggestionModal();
        }
      }
    };
  }
]);
