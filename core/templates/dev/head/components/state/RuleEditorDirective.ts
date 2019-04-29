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
 * @fileoverview Directive for the rule editor.
 */

// This directive controls an editor for selecting the type and input parameters
// to a rule. It also includes 'Cancel' and 'Save Answer' buttons which call
// respective 'onCancelRuleEdit' and 'onSaveRule' callbacks when called. These
// buttons only show up if 'isEditingRuleInline' is true.
oppia.directive('ruleEditor', [
  '$log', 'UrlInterpolationService', function($log, UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {
        isEditable: '=',
        isEditingRuleInline: '&',
        onCancelRuleEdit: '&',
        onSaveRule: '&',
        rule: '='
      },
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/components/state/rule_editor_directive.html'),
      controller: [
        '$scope', '$timeout', 'StateEditorService',
        'ValidatorsService', 'INTERACTION_SPECS',
        'ResponsesService', 'StateInteractionIdService',
        function(
            $scope, $timeout, StateEditorService,
            ValidatorsService, INTERACTION_SPECS,
            ResponsesService, StateInteractionIdService) {
          var DEFAULT_OBJECT_VALUES = GLOBALS.DEFAULT_OBJECT_VALUES;

          $scope.currentInteractionId = StateInteractionIdService.savedMemento;
          $scope.editRuleForm = {};

          // This returns the rule description string.
          var computeRuleDescriptionFragments = function() {
            if (!$scope.rule.type) {
              $scope.ruleDescriptionFragments = [];
              return '';
            }

            var ruleDescription = (
              INTERACTION_SPECS[$scope.currentInteractionId].rule_descriptions[
                $scope.rule.type]);

            var PATTERN = /\{\{\s*(\w+)\s*\|\s*(\w+)\s*\}\}/;
            var finalInputArray = ruleDescription.split(PATTERN);
            if (finalInputArray.length % 3 !== 1) {
              $log.error('Could not process rule description.');
            }

            var result = [];
            for (var i = 0; i < finalInputArray.length; i += 3) {
              result.push({
                // Omit the leading noneditable string.
                text: i !== 0 ? finalInputArray[i] : '',
                type: 'noneditable'
              });
              if (i === finalInputArray.length - 1) {
                break;
              }

              var answerChoices = ResponsesService.getAnswerChoices();

              if (answerChoices) {
                // This rule is for a multiple-choice, image-click, or item
                // selection interaction.
                // TODO(sll): Remove the need for this special case.
                if (answerChoices.length > 0) {
                  if (finalInputArray[2] === 'SetOfHtmlString') {
                    $scope.ruleDescriptionChoices = answerChoices.map(
                      function(choice) {
                        return {
                          id: choice.label,
                          val: choice.label
                        };
                      }
                    );
                    result.push({
                      type: 'checkboxes',
                      varName: finalInputArray[i + 1]
                    });
                  } else if (finalInputArray[2] === 'ListOfSetsOfHtmlStrings') {
                    $scope.ruleDescriptionChoices = answerChoices.map(
                      function(choice) {
                        return {
                          id: choice.label,
                          val: choice.label
                        };
                      }
                    );
                    result.push({
                      type: 'dropdown',
                      varName: finalInputArray[i + 1]
                    });
                  } else if (
                    finalInputArray[i + 2] === 'DragAndDropHtmlString') {
                    $scope.ruleDescriptionChoices = answerChoices.map(
                      function(choice) {
                        return {
                          id: choice.label,
                          val: choice.label
                        };
                      }
                    );
                    result.push({
                      type: 'dragAndDropHtmlStringSelect',
                      varName: finalInputArray[i + 1]
                    });
                  } else if (
                    finalInputArray[i + 2] === 'DragAndDropPositiveInt') {
                    $scope.ruleDescriptionChoices = answerChoices.map(
                      function(choice) {
                        return {
                          id: choice.label,
                          val: choice.label
                        };
                      }
                    );
                    result.push({
                      type: 'dragAndDropPositiveIntSelect',
                      varName: finalInputArray[i + 1]
                    });
                  } else {
                    $scope.ruleDescriptionChoices = answerChoices.map(
                      function(choice) {
                        return {
                          id: choice.val,
                          val: choice.label
                        };
                      }
                    );
                    result.push({
                      type: 'select',
                      varName: finalInputArray[i + 1]
                    });
                    if (!$scope.rule.inputs[finalInputArray[i + 1]]) {
                      $scope.rule.inputs[finalInputArray[i + 1]] = (
                        $scope.ruleDescriptionChoices[0].id);
                    }
                  }
                } else {
                  $scope.ruleDescriptionChoices = [];
                  result.push({
                    text: ' [Error: No choices available] ',
                    type: 'noneditable'
                  });
                }
              } else {
                result.push({
                  type: finalInputArray[i + 2],
                  varName: finalInputArray[i + 1]
                });
              }
            }

            // The following is necessary in order to ensure that the
            // object-editor HTML tags load correctly when the rule type is
            // changed. This is an issue for, e.g., the MusicNotesInput
            // interaction, where the rule inputs can sometimes be integers and
            // sometimes be lists of music notes.
            $scope.ruleDescriptionFragments = [];
            $timeout(function() {
              $scope.ruleDescriptionFragments = result;
            }, 10);

            return ruleDescription;
          };

          $scope.$on('updateAnswerGroupInteractionId', function(
              evt, newInteractionId) {
            $scope.currentInteractionId = newInteractionId;
          });

          $scope.onSelectNewRuleType = function(newRuleType) {
            var oldRuleInputs = angular.copy($scope.rule.inputs) || {};
            var oldRuleInputTypes = angular.copy($scope.rule.inputTypes) || {};

            $scope.rule.type = newRuleType;
            $scope.rule.inputs = {};
            $scope.rule.inputTypes = {};

            var tmpRuleDescription = computeRuleDescriptionFragments();
            // This provides the list of choices for the multiple-choice and
            // image-click interactions.
            var answerChoices = ResponsesService.getAnswerChoices();

            // Finds the parameters and sets them in $scope.rule.inputs.
            var PATTERN = /\{\{\s*(\w+)\s*(\|\s*\w+\s*)?\}\}/;
            while (true) {
              if (!tmpRuleDescription.match(PATTERN)) {
                break;
              }
              var varName = tmpRuleDescription.match(PATTERN)[1];
              var varType = null;
              if (tmpRuleDescription.match(PATTERN)[2]) {
                varType = tmpRuleDescription.match(PATTERN)[2].substring(1);
              }
              $scope.rule.inputTypes[varName] = varType;

              // TODO(sll): Find a more robust way of doing this. For example,
              // we could associate a particular varName with answerChoices
              // depending on the interaction. This varName would take its
              // default value from answerChoices, but other variables would
              // take their default values from the DEFAULT_OBJECT_VALUES dict.
              if (angular.equals(DEFAULT_OBJECT_VALUES[varType], [])) {
                $scope.rule.inputs[varName] = [];
              } else if (answerChoices) {
                $scope.rule.inputs[varName] = angular.copy(
                  answerChoices[0].val);
              } else {
                $scope.rule.inputs[varName] = DEFAULT_OBJECT_VALUES[varType];
              }

              tmpRuleDescription = tmpRuleDescription.replace(PATTERN, ' ');
            }

            for (var key in $scope.rule.inputs) {
              if (oldRuleInputs.hasOwnProperty(key) &&
                oldRuleInputTypes[key] === $scope.rule.inputTypes[key]) {
                $scope.rule.inputs[key] = oldRuleInputs[key];
              }
            }
          };

          $scope.cancelThisEdit = function() {
            $scope.onCancelRuleEdit();
          };

          $scope.saveThisRule = function() {
            $scope.onSaveRule();
          };

          $scope.init = function() {
            // Select a default rule type, if one isn't already selected.
            if ($scope.rule.type === null) {
              $scope.onSelectNewRuleType($scope.rule.type);
            }
            computeRuleDescriptionFragments();
          };

          $scope.init();
        }
      ]
    };
  }]);
