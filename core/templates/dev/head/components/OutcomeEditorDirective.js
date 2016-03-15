// Copyright 2015 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Directives for the outcome editor.
 */

oppia.directive('outcomeEditor', [function() {
  return {
    restrict: 'E',
    scope: {
      isEditable: '&isEditable',
      displayFeedback: '=',
      getOnSaveDestFn: '&onSaveDest',
      getOnSaveFeedbackFn: '&onSaveFeedback',
      outcome: '=outcome',
      suppressWarnings: '&suppressWarnings'
    },
    templateUrl: 'components/outcomeEditor',
    controller: [
      '$scope', 'editorContextService',
      'stateInteractionIdService',
      function($scope, editorContextService,
        stateInteractionIdService) {
        $scope.editOutcomeForm = {};
        $scope.feedbackEditorIsOpen = false;
        $scope.destinationEditorIsOpen = false;
        // TODO(sll): Investigate whether this line can be removed, due to
        // $scope.savedOutcome now being set in onExternalSave().
        $scope.savedOutcome = angular.copy($scope.outcome);

        var onExternalSave = function() {
          // The reason for this guard is because, when the editor page for an
          // exploration is first opened, the 'initializeAnswerGroups' event
          // (which fires an 'externalSave' event) only fires after the
          // $scope.savedOutcome is set above. Until then, $scope.savedOutcome
          // is undefined.
          if ($scope.savedOutcome === undefined) {
            $scope.savedOutcome = angular.copy($scope.outcome);
          }

          if ($scope.feedbackEditorIsOpen) {
            if ($scope.editOutcomeForm.editFeedbackForm.$valid &&
                !$scope.invalidStateAfterFeedbackSave()) {
              $scope.saveThisFeedback();
            } else {
              $scope.cancelThisFeedbackEdit();
            }
          }

          if ($scope.destinationEditorIsOpen) {
            if ($scope.editOutcomeForm.editDestForm.$valid &&
                !$scope.invalidStateAfterDestinationSave()) {
              $scope.saveThisDestination();
            } else {
              $scope.cancelThisDestinationEdit();
            }
          }
        };

        $scope.$on('externalSave', function() {
          onExternalSave();
        });

        $scope.$on('onInteractionIdChanged', function() {
          onExternalSave();
        });

        $scope.isSelfLoop = function(outcome) {
          return (
            outcome &&
            outcome.dest === editorContextService.getActiveStateName());
        };

        $scope.getCurrentInteractionId = function() {
          return stateInteractionIdService.savedMemento;
        };

        $scope.isSelfLoopWithNoFeedback = function(outcome) {
          if (!outcome) {
            return false;
          }
          var hasFeedback = outcome.feedback.some(function(feedbackItem) {
            return Boolean(feedbackItem);
          });
          return $scope.isSelfLoop(outcome) && !hasFeedback;
        };

        $scope.invalidStateAfterFeedbackSave = function() {
          var tmpOutcome = angular.copy($scope.savedOutcome);
          tmpOutcome.feedback = angular.copy($scope.outcome.feedback);
          return $scope.isSelfLoopWithNoFeedback(tmpOutcome);
        };
        $scope.invalidStateAfterDestinationSave = function() {
          var tmpOutcome = angular.copy($scope.savedOutcome);
          tmpOutcome.dest = angular.copy($scope.outcome.dest);
          return $scope.isSelfLoopWithNoFeedback(tmpOutcome);
        };
        $scope.openFeedbackEditor = function() {
          if ($scope.isEditable()) {
            $scope.feedbackEditorIsOpen = true;
            if ($scope.outcome.feedback.length === 0) {
              $scope.outcome.feedback.push('');
            }
          }
        };

        $scope.openDestinationEditor = function() {
          if ($scope.isEditable()) {
            $scope.destinationEditorIsOpen = true;
          }
        };

        $scope.saveThisFeedback = function() {
          $scope.$broadcast('saveOutcomeFeedbackDetails');
          $scope.feedbackEditorIsOpen = false;
          $scope.savedOutcome.feedback = angular.copy($scope.outcome.feedback);
          $scope.getOnSaveFeedbackFn()($scope.savedOutcome);
        };

        $scope.saveThisDestination = function() {
          $scope.$broadcast('saveOutcomeDestDetails');
          $scope.destinationEditorIsOpen = false;
          $scope.savedOutcome.dest = angular.copy($scope.outcome.dest);
          $scope.getOnSaveDestFn()($scope.savedOutcome);
        };

        $scope.cancelThisFeedbackEdit = function() {
          $scope.outcome.feedback = angular.copy($scope.savedOutcome.feedback);
          $scope.feedbackEditorIsOpen = false;
        };

        $scope.cancelThisDestinationEdit = function() {
          $scope.outcome.dest = angular.copy($scope.savedOutcome.dest);
          $scope.destinationEditorIsOpen = false;
        };
      }
    ]
  };
}]);
