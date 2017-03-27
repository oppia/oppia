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
 * @fileoverview Directive for a multiple choice question in the simple editor.
 */

// NOTE TO DEVELOPERS: This is meant to be a reusable directive, so its only
// dependencies should be standard utility services. It should not have any
// concept of "state in an exploration".
oppia.directive('multipleChoiceEditor', [
  'QuestionIdService', 'AnswerGroupObjectFactory', 'RuleObjectFactory', 'StatusObjectFactory',
  function(QuestionIdService, AnswerGroupObjectFactory, RuleObjectFactory, StatusObjectFactory) {
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
      templateUrl: 'simpleEditorQuestions/MultipleChoiceInput',
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

          $scope.isCorrectAnswer = function(index) {
            var answerGroups = $scope.getAnswerGroups();
            if (answerGroups.length === 0) {
              return false;
            } else {
              return answerGroups[0].rules[0].inputs.x === index;
            }
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
              return StatusObjectFactory.createNew(
                'Found an empty field',
                false
              );
            }

            var newChoiceIndex = choiceNames.length;
            // This is the human-readable number in the choice name.
            var newChoiceNumber = choiceNames.length + 1;
            while (choiceNames.indexOf(
                '<p>Option ' + newChoiceNumber + '</p>') !== -1) {
              newChoiceNumber++;
            }

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
              return StatusObjectFactory.createNew(
                'Cannot save an empty choice',
                false
              );
            }

            var newCustomizationArgs = $scope.getCustomizationArgs();
            var choiceNames = newCustomizationArgs.choices.value;

            if (newChoiceValue === choiceNames[index]) {
              // No change has been made.
              return StatusObjectFactory.createNew(
                'No change has been made',
                false
              );
            }

            if (choiceNames.indexOf('newChoiceValue') !== -1) {
              alertsService.addWarning(
                'Cannot save: this duplicates an existing choice.');
              return StatusObjectFactory.createNew(
                'This duplicates an existing choice',
                false
              );
            }

            newCustomizationArgs.choices.value[index] = newChoiceValue;
            $scope.saveCustomizationArgs({
              newValue: newCustomizationArgs
            });
          };

          $scope.deleteChoice = function(index) {
            var newCustomizationArgs = $scope.getCustomizationArgs();
            if (newCustomizationArgs.choices.value.length === 1) {
              throw Error(
                'Cannot delete choice when there is only 1 choice remaining.');
            }

            $scope.$broadcast('discardChangesEditorHtmlField', {
              fieldId: $scope.getFieldId(index)
            });

            newCustomizationArgs.choices.value.splice(index, 1);
            $scope.saveCustomizationArgs({
              newValue: newCustomizationArgs
            });

            // Update the indexes in the answer groups, and remove answer groups
            // that correspond to deleted choices.
            var answerGroups = $scope.getAnswerGroups();
            var oldAnswerGroupsLength = answerGroups.length;
            var newAnswerGroups = [];
            for (var i = 0; i < answerGroups.length; i++) {
              if (answerGroups[i].rules[0].inputs.x < index) {
                newAnswerGroups.push(answerGroups[i]);
              } else if (answerGroups[i].rules[0].inputs.x > index) {
                answerGroups[i].rules[0].inputs.x--;
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
          };

          $scope.selectCorrectAnswer = function(index) {
            var answerGroups = $scope.getAnswerGroups();
            var newAnswerGroups = [];

            if (answerGroups.length === 0) {
              var newStateName = $scope.addState();

              // Note that we do not use the 'correct' field of the answer
              // group in explorations. Instead, 'correctness' is determined by
              // whether the answer group is the first in the list.
              newAnswerGroups.push(AnswerGroupObjectFactory.createNew([
                RuleObjectFactory.createNew('Equals', {
                  x: index
                })
              ], {
                dest: newStateName,
                feedback: [''],
                param_changes: []
              }, false));

              $scope.saveAnswerGroups({
                newValue: newAnswerGroups
              });
            } else {
              newAnswerGroups.push(answerGroups[0]);
              newAnswerGroups[0].rules[0].inputs.x = index;

              // If some other answer group has this answer, remove it.
              for (var i = 1; i < answerGroups.length; i++) {
                if (answerGroups[i].rules[0].inputs.x !== index) {
                  newAnswerGroups.push(answerGroups[i]);
                }
              }

              $scope.saveAnswerGroups({
                newValue: newAnswerGroups
              });

              // Focus on the "response to correct answer" field, since it is
              // likely to need changing.
              $scope.$broadcast('openEditorHtmlField', {
                fieldId: $scope.getFieldId('correct-response')
              });
            }
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
