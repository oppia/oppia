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
      getOnSaveDestFn: '&onSaveDest',
      getOnSaveFeedbackFn: '&onSaveFeedback',
      outcome: '=outcome'
    },
    templateUrl: 'components/outcomeEditor',
    controller: [
      '$scope', 'editorContextService', function($scope, editorContextService) {
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
          $scope.getOnSaveFeedbackFn()($scope.outcome);
        };

        $scope.saveThisDestination = function() {
          $scope.$broadcast('saveOutcomeDestDetails');
          $scope.destinationEditorIsOpen = false;
          $scope.outcomeDestMemento = null;
          $scope.getOnSaveDestFn()($scope.outcome);
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
