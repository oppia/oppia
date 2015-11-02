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
 *
 * @author sean@seanlip.org (Sean Lip)
 */

oppia.directive('outcomeEditor', [function() {
  return {
    restrict: 'E',
    scope: {
      isEditable: '&isEditable',
      onSaveDestFn: '&onSaveDest',
      onSaveFeedbackFn: '&onSaveFeedback',
      outcome: '=outcome'
    },
    templateUrl: 'components/outcomeEditor',
    controller: [
      '$scope', 'editorContextService', 'routerService',
      function($scope, editorContextService, routerService) {

        $scope.editOutcomeForm = {};
        $scope.feedbackEditorIsOpen = false;
        $scope.destinationEditorIsOpen = false;
        $scope.outcomeFeedbackMemento = null;
        $scope.outcomeDestMemento = null;

        var onExternalSave = function() {
          if ($scope.feedbackEditorIsOpen &&
              $scope.editOutcomeForm.editFeedbackForm.$valid) {
            $scope.saveThisFeedback();
          }
          if ($scope.destinationEditorIsOpen &&
              $scope.editOutcomeForm.editDestForm.$valid) {
            $scope.saveThisDestination();
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

        $scope.isSelfLoopWithNoFeedback = function(outcome) {
          if (!outcome) {
            return false;
          }

          var hasFeedback = outcome.feedback.some(function(feedbackItem) {
            return Boolean(feedbackItem);
          });

          return $scope.isSelfLoop(outcome) && !hasFeedback;
        };

        $scope.openFeedbackEditor = function() {
          if ($scope.isEditable()) {
            $scope.outcomeFeedbackMemento = angular.copy(
              $scope.outcome.feedback);
            $scope.feedbackEditorIsOpen = true;
            if ($scope.outcome.feedback.length === 0) {
              $scope.outcome.feedback.push('');
            }
          }
        };

        $scope.openDestinationEditor = function() {
          if ($scope.isEditable()) {
            $scope.outcomeDestMemento = angular.copy($scope.outcome.dest);
            $scope.destinationEditorIsOpen = true;
          }
        };

        $scope.saveThisFeedback = function() {
          $scope.$broadcast('saveOutcomeFeedbackDetails');
          $scope.feedbackEditorIsOpen = false;
          $scope.outcomeFeedbackMemento = null;
          $scope.onSaveFeedbackFn();
        };

        $scope.saveThisDestination = function() {
          $scope.$broadcast('saveOutcomeDestDetails');
          $scope.destinationEditorIsOpen = false;
          $scope.outcomeDestMemento = null;
          $scope.onSaveDestFn();
        };

        $scope.cancelThisFeedbackEdit = function() {
          $scope.outcome.feedback = angular.copy($scope.outcomeFeedbackMemento);
          $scope.outcomeFeedbackMemento = null;
          $scope.feedbackEditorIsOpen = false;
        };

        $scope.cancelThisDestinationEdit = function() {
          $scope.outcome.dest = angular.copy($scope.outcomeDestMemento);
          $scope.outcomeDestMemento = null;
          $scope.destinationEditorIsOpen = false;
        };
      }
    ]
  };
}]);

oppia.directive('outcomeFeedbackEditor', [function() {
  return {
    restrict: 'E',
    scope: {
      outcome: '='
    },
    templateUrl: 'rules/outcomeFeedbackEditor',
    controller: ['$scope', function($scope) {
      $scope.OUTCOME_FEEDBACK_SCHEMA = {
        type: 'html'
      };

      $scope.$on('saveOutcomeFeedbackDetails', function() {
        // Remove null feedback. If the first element of the feedback is null or
        // empty, clear the entire feedback array. This is so that if the first
        // feedback is removed all feedback is thereby removed. Only the first
        // feedback is usable and editable. This also preserves all feedback
        // entries after the first if the first is non-empty.
        var nonemptyFeedback = [];
        for (var i = 0; i < $scope.outcome.feedback.length; i++) {
          var feedbackStr = $scope.outcome.feedback[i];
          if (feedbackStr) {
            feedbackStr = feedbackStr.trim();
          }
          if (feedbackStr) {
            nonemptyFeedback.push(feedbackStr);
          }
          if (!feedbackStr && i == 0) {
            // If the first feedback is empty, copy no more feedback after.
            break;
          }
        }
        $scope.outcome.feedback = nonemptyFeedback;
      });
    }]
  };
}]);

oppia.directive('outcomeDestinationEditor', [function() {
  return {
    restrict: 'E',
    scope: {
      outcome: '='
    },
    templateUrl: 'rules/outcomeDestinationEditor',
    controller: [
      '$scope', 'editorContextService', 'explorationStatesService',
      'stateGraphArranger', 'PLACEHOLDER_OUTCOME_DEST', 'focusService',
      function(
          $scope, editorContextService, explorationStatesService,
          stateGraphArranger, PLACEHOLDER_OUTCOME_DEST, focusService) {
        $scope.$on('saveOutcomeDestDetails', function() {
          // Create new state if specified.
          if ($scope.outcome.dest == PLACEHOLDER_OUTCOME_DEST) {
            var newStateName = $scope.outcome.newStateName;
            $scope.outcome.dest = newStateName;
            delete $scope.outcome.newStateName;

            explorationStatesService.addState(newStateName, null);
          }
        });

        $scope.onDestSelectorChange = function() {
          if ($scope.outcome.dest === PLACEHOLDER_OUTCOME_DEST) {
            focusService.setFocus('newStateNameInputField');
          }
        };

        $scope.isCreatingNewState = function(outcome) {
          return outcome.dest == PLACEHOLDER_OUTCOME_DEST;
        };

        $scope.newStateNamePattern = /^[a-zA-Z0-9.\s-]+$/;
        $scope.destChoices = [];
        $scope.$watch(explorationStatesService.getStates, function() {
          var currentStateName = editorContextService.getActiveStateName();

          // This is a list of objects, each with an ID and name. These
          // represent all states, as well as an option to create a
          // new state.
          $scope.destChoices = [{
            id: currentStateName,
            text: '(try again)'
          }];

          // Arrange the remaining states based on their order in the state
          // graph.
          var lastComputedArrangement = (
            stateGraphArranger.getLastComputedArrangement());
          var allStateNames = Object.keys(explorationStatesService.getStates());

          var maxDepth = 0;
          var maxOffset = 0;
          for (var stateName in lastComputedArrangement) {
            maxDepth = Math.max(
              maxDepth, lastComputedArrangement[stateName].depth);
            maxOffset = Math.max(
              maxOffset, lastComputedArrangement[stateName].offset);
          }

          // Higher scores come later.
          var allStateScores = {};
          var unarrangedStateCount = 0;
          for (var i = 0; i < allStateNames.length; i++) {
            var stateName = allStateNames[i];
            if (lastComputedArrangement.hasOwnProperty(stateName)) {
              allStateScores[stateName] = (
                lastComputedArrangement[stateName].depth * (maxOffset + 1) +
                lastComputedArrangement[stateName].offset);
            } else {
              // States that have just been added in the rule 'create new'
              // modal are not yet included as part of lastComputedArrangement,
              // so we account for them here.
              allStateScores[stateName] = (
                (maxDepth + 1) * (maxOffset + 1) + unarrangedStateCount);
              unarrangedStateCount++;
            }
          }

          var stateNames = allStateNames.sort(function(a, b) {
            return allStateScores[a] - allStateScores[b];
          });

          for (var i = 0; i < stateNames.length; i++) {
            if (stateNames[i] !== currentStateName) {
              $scope.destChoices.push({
                id: stateNames[i],
                text: stateNames[i]
              });
            }
          }

          $scope.destChoices.push({
            id: PLACEHOLDER_OUTCOME_DEST,
            text: 'A New Card Called...'
          });
        }, true);
      }
    ]
  };
}]);
