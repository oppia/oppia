// Copyright 2017 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Directive for a checkbox question in the simple editor.
 */

// NOTE TO DEVELOPERS: This is meant to be a reusable directive, so its only
// dependencies should be standard utility services. It should not have any
// concept of "state in an exploration".
oppia.directive('checkboxEditor', [
  'QuestionIdService', 'AnswerGroupObjectFactory','OutcomeObjectFactory',
  'RuleObjectFactory', 'StatusObjectFactory', 'UrlInterpolationService',
  function(QuestionIdService, AnswerGroupObjectFactory, OutcomeObjectFactory,
    RuleObjectFactory, StatusObjectFactory, UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {
        // A unique ID that allows events to be broadcast specifically to this
        // directive.
        getUniqueId: '&uniqueId',
        getCustomizationArgs: '&customizationArgs',
        getAnswerGroups: '&answerGroups',
        getRawDefaultOutcome: '&defaultOutcome',
        saveCustomizationArgs: '&',
        saveAnswerGroups: '&',
        saveDefaultOutcome: '&',
        addState: '&'
      },
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/exploration_editor/simple_editor_tab/questions/' +
        'checkbox_editor_directive.html'),
      controller: [
        '$scope', '$timeout', 'alertsService',
        function($scope, $timeout, alertsService) {
          // Note that a questionId generated in this way may contain spaces,
          // since it is just the state name.
          $scope.questionId = $scope.getUniqueId();

          $scope.getSubfieldId = function(label) {
            return QuestionIdService.getSubfieldId($scope.questionId, label);
          };

          $scope.getFieldId = function(index) {
            return $scope.questionId + '.' + index;
          };

          var openChoiceEditor = function(index) {
            $scope.$broadcast('openEditorHtmlField', {
              fieldId: $scope.getFieldId(index)
            });
          };

          $scope.$on('newInteractionIdSelected', function(evt, data) {
            if (data.targetId === $scope.getUniqueId()) {
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

          $scope.isCorrectAnswer = function(value) {
            var answerGroups = $scope.getAnswerGroups();
            if (answerGroups.length > 0) {
              return answerGroups[0].rules[0].inputs.x.indexOf(value) !== -1;
            }
            return false;
          };

          $scope.addChoice = function() {
            var newCustomizationArgs = $scope.getCustomizationArgs();
            var choiceNames = newCustomizationArgs.choices.value;

            // If there is a currently-empty option, do nothing and focus into
            // that field instead.
            var foundEmptyField = false;
            for (var i = 0; i < choiceNames.length; i++) {
              if (!choiceNames[i]) {
                openChoiceEditor(i);
                foundEmptyField = true;
                break;
              }
            }

            if (foundEmptyField) {
              return StatusObjectFactory.createFailure(
                'Found an empty field'
              );
            }

            var newChoiceIndex = choiceNames.length;
            // This is the human-readable number in the choice name.
            var newChoiceNumber = choiceNames.length + 1;
            while (choiceNames.indexOf(
                '<p>Option ' + newChoiceNumber + '</p>') !== -1) {
              newChoiceNumber++;
            }

            newCustomizationArgs.maxAllowableSelectionCount.value++;
            newCustomizationArgs.choices.value.push(
              '<p>Option ' + newChoiceNumber + '</p>');
            $scope.saveCustomizationArgs({
              newValue: newCustomizationArgs
            });
            // The field needs to be initialized before the broadcast is sent.
            $timeout(function() {
              openChoiceEditor(newChoiceIndex);
            });
          };

          $scope.isChoiceValid = function(index, newChoiceValue) {
            var choiceNames = angular.copy(
              $scope.getCustomizationArgs().choices.value);
            choiceNames.splice(index, 1);

            return (
              Boolean(newChoiceValue) &&
              choiceNames.indexOf(newChoiceValue) === -1);
          };

          $scope.saveChoice = function(index, newChoiceValue) {
            if (!newChoiceValue) {
              alertsService.addWarning('Cannot save an empty choice.');
              return StatusObjectFactory.createFailure(
                'Cannot save an empty choice'
              );
            }

            var newCustomizationArgs = $scope.getCustomizationArgs();
            var choiceNames = newCustomizationArgs.choices.value;

            if (newChoiceValue === choiceNames[index]) {
              // No change has been made.
              return StatusObjectFactory.createFailure(
                'No change has been made'
              );
            }

            if (choiceNames.indexOf('newChoiceValue') !== -1) {
              alertsService.addWarning(
                'Cannot save: this duplicates an existing choice.');
              return StatusObjectFactory.createFailure(
                'This duplicates an existing choice'
              );
            }

            newCustomizationArgs.choices.value[index] = newChoiceValue;
            $scope.saveCustomizationArgs({
              newValue: newCustomizationArgs
            });
          };

          $scope.deleteChoice = function(value) {
            var newCustomizationArgs = $scope.getCustomizationArgs();
            if (newCustomizationArgs.choices.value.length === 1) {
              throw Error(
                'Cannot delete choice when there is only 1 remaining choice.');
            }
            var index = newCustomizationArgs.choices.value.indexOf(value);
            newCustomizationArgs.choices.value.splice(index, 1);
            newCustomizationArgs.maxAllowableSelectionCount.value =
              Math.min(
                newCustomizationArgs.maxAllowableSelectionCount.value - 1,
                newCustomizationArgs.choices.value.length);
            
            newCustomizationArgs.minAllowableSelectionCount.value =
              Math.max(
                newCustomizationArgs.minAllowableSelectionCount.value - 1, 1);

            $scope.$broadcast('discardChangesEditorHtmlField', {
              fieldId: $scope.getFieldId(index)
            });

            // Remove answer groups that contain to deleted choice.
            var answerGroups = $scope.getAnswerGroups();
            var oldAnswerGroupsLength = answerGroups.length;
            var newAnswerGroups = [];
            for (var i = 0; i < answerGroups.length; i++) {
              if (answerGroups[i].rules[0].inputs.x.indexOf(value) > -1) {
                newAnswerGroups.push(answerGroups[i]);
              }
            }

            // However, if this would result in no answer groups, instead select
            // the first choice as the correct answer. This is done in order to
            // preserve the invariant that, once a correct answer is selected,
            // there is always some correct answer selected. Otherwise, the
            // chain of questions can get broken.
            if (newAnswerGroups.length === 0 && oldAnswerGroupsLength > 0) {
              newAnswerGroups = [];
              newAnswerGroups.push(answerGroups[0]);
              newAnswerGroups[0].rules[0].inputs.x = 0;
            }

            $scope.saveAnswerGroups({
              newValue: newAnswerGroups
            });
            $scope.saveCustomizationArgs({
              newValue: newCustomizationArgs
            });
          };

          $scope.toggleCorrectAnswer = function(value) {
            var answerGroups = $scope.getAnswerGroups();
            var newAnswerGroups = [];

            if (answerGroups.length === 0) {
              var newStateName = $scope.addState();

              // Note that we do not use the 'correct' field of the answer
              // group in explorations. Instead, 'correctness' is determined by
              // whether the answer group is the first in the list.

              newAnswerGroups.push(AnswerGroupObjectFactory.createNew([
                RuleObjectFactory.createNew('Equals', {
                  x: [value]
                })
              ], OutcomeObjectFactory.createEmpty(newStateName), false));

              var newCustomizationArgs = $scope.getCustomizationArgs();
              newCustomizationArgs.maxAllowableSelectionCount.value = 1;

              $scope.saveAnswerGroups({
                newValue: newAnswerGroups
              });
            } else {
              var newCustomizationArgs = $scope.getCustomizationArgs();

              newAnswerGroups.push(answerGroups[0]);
              var index = newAnswerGroups[0].rules[0].inputs.x.length;

              if (newAnswerGroups[0].rules[0].inputs.x.indexOf(value) > -1) {
                var position = 
                  newAnswerGroups[0].rules[0].inputs.x.indexOf(value);
                newAnswerGroups[0].rules[0].inputs.x.splice(position, 1);
              } else {
                newAnswerGroups[0].rules[0].inputs.x.push(value);
                newCustomizationArgs.maxAllowableSelectionCount.value++;
              }

              // If some other answer group has this answer, remove it.
              for (var i = 1; i < answerGroups.length; i++) {
                if (answerGroups[i].rules[0].inputs.x !== index) {
                  newAnswerGroups.push(answerGroups[i]);
                }
              }

              $scope.saveAnswerGroups({
                newValue: newAnswerGroups
              });
              $scope.saveCustomizationArgs({
                newValue: newCustomizationArgs
              });
            }
            // Focus on the "response to correct answer" field, since it is
            // likely to need changing.
            $scope.$broadcast('openEditorHtmlField', {
              fieldId: $scope.getFieldId('correct-response')
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
  }
]);
