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
 *
 * @author sll@google.com (Sean Lip)
 */

oppia.directive('ruleTypeSelector', [function() {
  return {
    restrict: 'E',
    scope: {
      allRuleTypes: '&',
      localValue: '=',
      onSelectionChange: '&'
    },
    template: '<input type="hidden">',
    controller: ['$scope', '$element', '$filter', function($scope, $element, $filter) {
      var choices = [];
      for (var ruleType in $scope.allRuleTypes()) {
        choices.push({
          id: ruleType,
          text: $filter('replaceInputsWithEllipses')(ruleType)
        });
      }

      var select2Node = $element[0].firstChild;
      $(select2Node).select2({
        data: choices,
        // Suppress the search box.
        minimumResultsForSearch: -1,
        allowClear: false,
        width: '200px',
        formatSelection: function(object, container) {
          return $filter('truncateAtFirstInput')(object.id);
        }
      });

      // Initialize the dropdown.
      $(select2Node).select2('val', $scope.localValue);

      // Update $scope.localValue when the selection changes.
      $(select2Node).on('change', function(e) {
        $scope.localValue = e.val;
        // This is needed to actually update the localValue in the containing
        // scope.
        $scope.$apply();
        $scope.onSelectionChange();
        // This is needed to propagate the change and display input fields for
        // parameterizing the rule.
        $scope.$apply();
      });
    }]
  };
}]);


oppia.directive('ruleEditor', ['$log', function($log) {
  return {
    restrict: 'E',
    scope: {
      rule: '=',
      answerChoices: '=',
      widgetHandlerSpecs: '=',
      isTmpRule: '&',
      saveRule: '=',
      cancelEdit: '&',
      deleteRule: '&',
      isEditable: '=',
      heading: '@',
      numRules: '&'
    },
    templateUrl: 'inline/rule_editor',
    controller: [
      '$scope', '$attrs', 'editorContextService', 'explorationStatesService', 'routerService',
      function($scope, $attrs, editorContextService, explorationStatesService, routerService) {
        $scope.RULE_FEEDBACK_SCHEMA = {
          type: 'list',
          items: {
            type: 'html',
            ui_config: {
              size: 'small'
            }
          },
          ui_config: {
            add_element_text: 'Add Feedback Option'
          }
        };

        $scope.ruleDestMemento = $scope.rule.dest;
        $scope.ruleDescriptionMemento = null;
        $scope.ruleDefinitionMemento = null;

        $scope.allRuleTypes = {};
        $scope.generateAllRuleTypes = function() {
          for (var i = 0; i < $scope.widgetHandlerSpecs.length; i++) {
            if ($scope.widgetHandlerSpecs[i].name == 'submit') {
              $scope.allRuleTypes = {};
              for (var description in $scope.widgetHandlerSpecs[i].rules) {
                $scope.allRuleTypes[description] = $scope.widgetHandlerSpecs[i].rules[description].classifier;
              }
              return;
            }
          }
        };

        $scope.ruleEditorIsOpen = false;
        $scope.openRuleEditor = function() {
          if ($scope.isEditable) {
            $scope.ruleEditorIsOpen = true;
            if ($scope.rule.feedback.length === 0) {
              $scope.rule.feedback.push('');
            }
            if ($scope.rule.description === null) {
              $scope.generateAllRuleTypes();
              for (var key in $scope.allRuleTypes) {
                $scope.rule.description = key;
                $scope.currentRuleDescription = $scope.rule.description;
                $scope.onSelectNewRuleType();
                break;
              }
            } else {
              $scope.currentRuleDescription = $scope.rule.description;
            }

            $scope.ruleDescriptionMemento = angular.copy($scope.rule.description);
            $scope.ruleDefinitionMemento = angular.copy($scope.rule.definition);
            $scope.computeRuleDescriptionFragments();
          }
        };

        $scope.removeNullFeedback = function() {
          // Remove null feedback.
          var nonemptyFeedback = [];
          for (var i = 0; i < $scope.rule.feedback.length; i++) {
            if ($scope.rule.feedback[i]) {
              nonemptyFeedback.push($scope.rule.feedback[i]);
            }
          }
          $scope.rule.feedback = nonemptyFeedback;
        };

        $scope.saveThisRule = function() {
          // TODO(sll): Add more validation prior to saving.
          $scope.ruleEditorIsOpen = false;

          // If a new state has been entered, create it.
          $scope.createRuleDestIfNecessary();

          $scope.removeNullFeedback();
          $scope.ruleDescriptionMemento = null;
          $scope.ruleDefinitionMemento = null;

          $scope.saveRule();
        };
        $scope.cancelThisEdit = function() {
          $scope.removeNullFeedback();
          $scope.ruleEditorIsOpen = false;
          $scope.ruleDescriptionMemento = null;
          $scope.ruleDefinitionMemento = null;
          $scope.cancelEdit();
        };
        $scope.deleteThisRule = function() {
          $scope.cancelThisEdit();
          $scope.deleteRule();
        };

        $scope.createRuleDestIfNecessary = function() {
          var foundInExistingStateList = false;
          for (var stateName in explorationStatesService.getStates()) {
            if (stateName === $scope.rule.dest) {
              foundInExistingStateList = true;
            }
          }

          if (!foundInExistingStateList && $scope.rule.dest !== 'END') {
            try {
              explorationStatesService.addState($scope.rule.dest);
              $scope.ruleDestMemento = $scope.rule.dest;
              $scope.destChoices.push({
                id: $scope.rule.dest,
                text: $scope.rule.dest
              });
            } catch(e) {
              $scope.rule.dest = $scope.ruleDestMemento;
              throw e;
            }
          }
        };

        $scope.$watch('widgetHandlerSpecs', function() {
          $scope.generateAllRuleTypes();
        });

        $scope.isDefaultRule = function() {
          return ($scope.rule.description === 'Default');
        };

        $scope.destChoices = [];
        $scope.$watch(explorationStatesService.getStates, function(newValue) {
          // Returns a list of objects, each with an ID and name. These
          // represent all states in alphabetical order, followed by 'END'.
          $scope.destChoices = [];
          var stateNames = Object.keys(explorationStatesService.getStates()).sort();
          stateNames.push(END_DEST);
          for (var i = 0; i < stateNames.length; i++) {
            $scope.destChoices.push({
              id: stateNames[i],
              text: stateNames[i]
            });
          }
        }, true);

        $scope.$on('externalSave', function() {
          if ($scope.ruleEditorIsOpen) {
            $scope.saveThisRule();
          }
        });

        $scope.getActiveStateName = function() {
          return editorContextService.getActiveStateName();
        };

        $scope.isRuleConfusing = function() {
          return (
            $scope.rule.feedback.length === 0 &&
            $scope.rule.dest === editorContextService.getActiveStateName());
        };

        $scope.onSelectNewRuleType = function() {
          var description = $scope.currentRuleDescription;
          $scope.rule.description = description;
          for (var desc in $scope.allRuleTypes) {
            if (desc === description) {
              $scope.rule.definition.name = $scope.allRuleTypes[desc];
              break;
            }
          }
          $scope.rule.definition.inputs = {};
          $scope.computeRuleDescriptionFragments();

          // Finds the parameters and sets them in $scope.rule.definition.inputs.
          var pattern = /\{\{\s*(\w+)\s*(\|\s*\w+\s*)?\}\}/;
          var copyOfRule = description;
          while (true) {
            if (!copyOfRule.match(pattern)) {
              break;
            }
            var varName = copyOfRule.match(pattern)[1];
            var varType = null;
            if (copyOfRule.match(pattern)[2]) {
              varType = copyOfRule.match(pattern)[2].substring(1);
            }

            if (varType == 'Set') {
              $scope.rule.definition.inputs[varName] = [];
            } else if (varType == 'NonnegativeInt') {
              // Set a default value.
              $scope.rule.definition.inputs[varName] = 0;
            } else {
              $scope.rule.definition.inputs[varName] = '';
            }

            copyOfRule = copyOfRule.replace(pattern, ' ');
          }
        };

        $scope.ruleDescriptionFragments = [];
        $scope.computeRuleDescriptionFragments = function() {
          if (!$scope.rule.description) {
            $scope.ruleDescriptionFragments = [];
            return;
          }

          var pattern = /\{\{\s*(\w+)\s*\|\s*(\w+)\s*\}\}/;

          var finalInputArray = $scope.rule.description.split(pattern);
          if (finalInputArray.length % 3 !== 1) {
            $log.error('Could not process rule description.');
          }

          var result = [];
          for (var i = 0; i < finalInputArray.length; i += 3) {
            result.push({
              type: 'noneditable',
              // Omit the leading noneditable string.
              text: i !== 0 ? finalInputArray[i] : ''
            });
            if (i == finalInputArray.length - 1) {
              break;
            }

            if ($scope.answerChoices && $scope.answerChoices.length) {
              // This rule is for a multiple-choice widget.
              // TODO(sll): Remove the need for this special case for multiple-choice
              // input.
              $scope.choices = angular.copy($scope.answerChoices);
              result.push({'type': 'select', 'varName': finalInputArray[i+1]});
            } else {
              result.push({
                'type': finalInputArray[i+2],
                'varName': finalInputArray[i+1]
              });
            }
          }
          $scope.ruleDescriptionFragments = result;
        };

        $scope.navigateToRuleDest = function() {
          routerService.navigateToMainTab($scope.rule.dest);
        };

        $scope.getExtendedChoiceArray = function(choices) {
          var result = [];
          for (var i = 0; i < choices.length; i++) {
            result.push({id: i, val: choices[i]});
          }
          return result;
        };

        if ($scope.isTmpRule()) {
          $scope.openRuleEditor();
        }
      }
    ]
  };
}]);
