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
 * @fileoverview Directive for the header of the response tiles.
 */

oppia.directive('responseHeader', [
  'UrlInterpolationService', function(UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {
        getIndex: '&index',
        getOutcome: '&outcome',
        getSummary: '&summary',
        getShortSummary: '&shortSummary',
        isActive: '&isActive',
        getOnDeleteFn: '&onDeleteFn',
        getNumRules: '&numRules',
        isResponse: '&isResponse',
        navigateToState: '='
      },
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/components/response_header_directive.html'),
      controller: [
        '$scope', 'EditabilityService', 'EditorStateService',
        'PLACEHOLDER_OUTCOME_DEST',
        'stateInteractionIdService', 'INTERACTION_SPECS',
        function(
            $scope, EditabilityService, EditorStateService,
            PLACEHOLDER_OUTCOME_DEST,
            stateInteractionIdService, INTERACTION_SPECS) {
          $scope.EditabilityService = EditabilityService;

          $scope.getCurrentInteractionId = function() {
            return stateInteractionIdService.savedMemento;
          };

          $scope.isCorrectnessFeedbackEnabled = function() {
            return EditorStateService.getCorrectnessFeedbackEnabled();
          };
          // This returns false if the current interaction ID is null.
          $scope.isCurrentInteractionLinear = function() {
            var interactionId = $scope.getCurrentInteractionId();
            return interactionId && INTERACTION_SPECS[interactionId].is_linear;
          };

          $scope.isCorrect = function() {
            return $scope.getOutcome() && $scope.getOutcome().labelledAsCorrect;
          };

          $scope.isOutcomeLooping = function() {
            var outcome = $scope.getOutcome();
            var activeStateName = EditorStateService.getActiveStateName();
            return outcome && (outcome.dest === activeStateName);
          };

          $scope.isCreatingNewState = function() {
            var outcome = $scope.getOutcome();
            return outcome && outcome.dest === PLACEHOLDER_OUTCOME_DEST;
          };

          $scope.deleteResponse = function(evt) {
            $scope.getOnDeleteFn()($scope.getIndex(), evt);
          };
        }
      ]
    };
  }]);
