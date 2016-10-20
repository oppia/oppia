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
 * @fileoverview Directive for the body of the simple editor.
 */

oppia.directive('simpleEditorBody', [function() {
  return {
    restrict: 'E',
    scope: {},
    templateUrl: 'simpleEditor/body',
    controller: [
      '$scope', '$rootScope', '$timeout', 'SimpleEditorQuestionsDataService',
      'explorationTitleService', 'explorationInitStateNameService',
      'explorationStatesService',
      function(
          $scope, $rootScope, $timeout, SimpleEditorQuestionsDataService,
          explorationTitleService, explorationInitStateNameService,
          explorationStatesService) {
        $scope.explorationTitleService = explorationTitleService;
        $scope.questions = [];

        $scope.$on('simpleEditorLoaded', function() {
          $scope.questions = (
              SimpleEditorQuestionsDataService.getQuestionsInOrder());
          $scope.initialState = explorationStatesService.getState(
            explorationInitStateNameService.savedMemento);
        });

        $scope.saveTitle = function(newTitle) {
          explorationTitleService.displayed = newTitle;
          explorationTitleService.saveDisplayedValue();
        };
        $scope.saveIntroduction = function(newHtml) {
          var initStateName = explorationInitStateNameService.savedMemento;
          explorationStatesService.saveStateContent(initStateName, [{
            type: 'text',
            value: newHtml
          }]);
          // We reload the initialState because a fresh copy of the state is
          // created in the states dict on every update.
          $scope.initialState = explorationStatesService.getState(
            explorationInitStateNameService.savedMemento);
        };

        $scope.saveCustomizationArgs = function(
            stateName, newCustomizationArgs) {
          explorationStatesService.saveInteractionCustomizationArgs(
            stateName, newCustomizationArgs);
        };
        $scope.saveAnswerGroups = function(stateName, newAnswerGroups) {
          explorationStatesService.saveInteractionAnswerGroups(
            stateName, newAnswerGroups);
        };
        $scope.saveDefaultOutcome = function(stateName, newDefaultOutcome) {
          explorationStatesService.saveInteractionDefaultOutcome(
            stateName, newDefaultOutcome);
        };
        $scope.saveBridgeText = function(stateName, newHtml) {
          explorationStatesService.saveStateContent(stateName, [{
            type: 'text',
            value: newHtml
          }]);
          // We reload the questions because a fresh copy of the state is
          // created in the states dict on every update.
          // TODO(sll): Pass this back to the questions data service? But we
          // need a way to update the questions here...
          $scope.questions = (
              SimpleEditorQuestionsDataService.getQuestionsInOrder());
        };

        // Requirement: for the last question in the list, there should be at
        // least one answer group.
        $scope.canAddNewQuestion = function() {
          if ($scope.questions.length === 0) {
            return true;
          } else {
            return $scope.questions[
              $scope.questions.length - 1].hasAnswerGroups();
          }
        };

        $scope.addNewQuestion = function() {
          // Add a new multiple-choice interaction to the latest state, and
          // re-calculate the list of questions.
          var lastStateName = (
            $scope.questions.length > 0 ?
            $scope.questions[
              $scope.questions.length - 1].getDestinationStateName() :
            explorationInitStateNameService.savedMemento);

          // TODO(sll): Abstract these default values into constants.
          explorationStatesService.saveInteractionId(
            lastStateName, 'MultipleChoiceInput');
          explorationStatesService.saveInteractionCustomizationArgs(
            lastStateName, {
              choices: {
                value: ['']
              }
            }
          );
          $scope.questions = (
              SimpleEditorQuestionsDataService.getQuestionsInOrder());
          $rootScope.$broadcast('updateSimpleEditorSidebar');

          // The new question needs to be loaded before this broadcast can have
          // any effect.
          $timeout(function() {
            $scope.$broadcast('newQuestionAdded', {
              stateName: (
                $scope.questions[$scope.questions.length - 1].getStateName())
            });
          });
        };
      }
    ]
  };
}]);
