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
 * @fileoverview Directive for the a multiple choice question in the simple
 * editor.
 */

oppia.directive('multipleChoiceEditor', [function() {
  return {
    restrict: 'E',
    scope: {
      getStateName: '&stateName',
      getCustomizationArgs: '&customizationArgs',
      getAnswerGroups: '&answerGroups',
      getRawDefaultOutcome: '&defaultOutcome',
      saveCustomizationArgs: '&',
      saveAnswerGroups: '&',
      saveDefaultOutcome: '&'
    },
    templateUrl: 'simpleEditorQuestions/MultipleChoiceInput',
    controller: [
      '$scope', '$timeout', 'focusService', 'SimpleEditorQuestionsDataService',
      'explorationStatesService',
      function(
          $scope, $timeout, focusService, SimpleEditorQuestionsDataService,
          explorationStatesService) {
        $scope.questionId = Math.random().toString(36).slice(2);
        $scope.getFieldId = function(index) {
          return $scope.questionId + '.' + index;
        };

        var openChoiceEditor = function(index) {
          $scope.$broadcast('openEditorHtmlField', {
            fieldId: $scope.getFieldId(index)
          });
        };

        $scope.$on('newQuestionAdded', function(evt, data) {
          if (data.stateName === $scope.getStateName()) {
            openChoiceEditor(0);
          }
        });

        $scope.getChoices = function() {
          return $scope.getCustomizationArgs().choices.value;
        };

        $scope.getDefaultOutcome = function() {
          var defaultOutcome = $scope.getRawDefaultOutcome();
          if (defaultOutcome.feedback.length === 0) {
            defaultOutcome.feedback.push('');
          }
          return defaultOutcome;
        };

        $scope.addChoice = function() {
          var newCustomizationArgs = $scope.getCustomizationArgs();
          newCustomizationArgs.choices.value.push('');
          $scope.saveCustomizationArgs({
            newValue: newCustomizationArgs
          });

          // The field needs to be initialized before the broadcast is sent.
          $timeout(function() {
            openChoiceEditor(newCustomizationArgs.choices.value.length - 1);
          });
        };

        $scope.deleteChoice = function(index) {
          if (newCustomizationArgs.choices.value.length === 1) {
            throw Error(
              'Cannot delete choice when there is only 1 choice remaining.');
          }

          var newCustomizationArgs = $scope.getCustomizationArgs();
          newCustomizationArgs.choices.value.splice(index, 1);

          // TODO(sll): Also update answer groups to remove deleted choices.
          $scope.saveCustomizationArgs({
            newValue: newCustomizationArgs
          });
        };

        $scope.saveChoice = function(index, newChoiceValue) {
          var newCustomizationArgs = $scope.getCustomizationArgs();
          newCustomizationArgs.choices.value[index] = newChoiceValue;
          $scope.saveCustomizationArgs({
            newValue: newCustomizationArgs
          });
        };

        $scope.isCorrectAnswer = function(index) {
          var answerGroups = $scope.getAnswerGroups();
          if (answerGroups.length === 0) {
            return false;
          } else {
            return answerGroups[0].rule_specs[0].inputs.x === index;
          }
        };

        $scope.selectCorrectAnswer = function(index) {
          var newAnswerGroups = $scope.getAnswerGroups();
          if (newAnswerGroups.length === 0) {
            var newStateName = (
              SimpleEditorQuestionsDataService.getNewStateName());
            explorationStatesService.addState(newStateName);

            newAnswerGroups.push({
              outcome: {
                dest: newStateName,
                feedback: [''],
                param_changes: []
              },
              rule_specs: [{
                inputs: {
                  x: index
                },
                rule_type: 'Equals'
              }]
            });
          } else {
            newAnswerGroups[0].rule_specs[0].inputs.x = index;
          }
          $scope.saveAnswerGroups({
            newValue: newAnswerGroups
          });
        };

        $scope.saveCorrectAnswerFeedback = function(newFeedback) {
          var newAnswerGroups = $scope.getAnswerGroups();
          if (newAnswerGroups.length === 0) {
            throw Error('Empty answer groups detected');
          }
          newAnswerGroups[0].outcome.feedback[0] = newFeedback;
          $scope.saveAnswerGroups({
            newValue: newAnswerGroups
          });
        };

        $scope.saveDefaultFeedback = function(newFeedback) {
          var newDefaultOutcome = $scope.getDefaultOutcome();
          newDefaultOutcome.feedback[0] = newFeedback;
          $scope.saveDefaultOutcome({
            newValue: newDefaultOutcome
          });
        };
      }
    ]
  };
}]);
