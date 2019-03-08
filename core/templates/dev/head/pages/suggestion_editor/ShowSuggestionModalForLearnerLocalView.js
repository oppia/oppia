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
 * @fileoverview Controller to show suggestion modal in learner local view.
 */

oppia.controller('ShowSuggestionModalForLearnerLocalView', [
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
  }]);
