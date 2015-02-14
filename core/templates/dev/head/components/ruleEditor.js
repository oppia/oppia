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
      var numberOfRuleTypes = 0 ;
      for (var ruleType in $scope.allRuleTypes()) {
        numberOfRuleTypes++;
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

      if (numberOfRuleTypes <= 1) {
        $(select2Node).select2('enable', false);
      }

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
      saveRule: '=',
      deleteRule: '&',
      isEditable: '='
    },
    templateUrl: 'inline/rule_editor',
    controller: [
      '$scope', '$rootScope', '$modal', '$timeout', 'editorContextService', 'explorationStatesService', 'routerService',
      'validatorsService', 'rulesService', 'explorationStatesService',
      function(
          $scope, $rootScope, $modal, $timeout, editorContextService, explorationStatesService, routerService,
          validatorsService, rulesService, explorationStatesService) {
        $scope.RULE_FEEDBACK_SCHEMA = {
          type: 'list',
          items: {
            type: 'html',
            ui_config: {
              size: 'small'
            }
          },
          ui_config: {
            add_element_text: 'Add Variation'
          }
        };

        $scope.getAnswerChoices = function() {
          return rulesService.getAnswerChoices();
        };

        $scope.ruleDestMemento = null;
        $scope.ruleDescriptionMemento = null;
        $scope.ruleDefinitionMemento = null;
        $scope.ruleFeedbackMemento = null;

        $scope.ruleEditorIsOpen = false;
        $scope.openRuleEditor = function() {
          if ($scope.isEditable) {
            $scope.ruleDescriptionMemento = angular.copy($scope.rule.description);
            $scope.ruleDefinitionMemento = angular.copy($scope.rule.definition);
            $scope.ruleFeedbackMemento = angular.copy($scope.rule.feedback);
            $scope.ruleDestMemento = angular.copy($scope.rule.dest);

            $scope.ruleEditorIsOpen = true;
            if ($scope.rule.feedback.length === 0) {
              $scope.rule.feedback.push('');
            }
          }
        };

        $scope.ruleDescriptionMemento = null;
        $scope.ruleDefinitionMemento = null;
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
          $scope._createRuleDestIfNecessary();

          $scope.removeNullFeedback();
          $scope.ruleDescriptionMemento = null;
          $scope.ruleDefinitionMemento = null;
          $scope.ruleFeedbackMemento = null;
          $scope.ruleDestMemento = null;

          $scope.saveRule();
        };
        $scope.cancelThisEdit = function() {
          $scope.removeNullFeedback();
          $scope.ruleEditorIsOpen = false;
          $scope.rule.description = angular.copy($scope.ruleDescriptionMemento);
          $scope.rule.definition = angular.copy($scope.ruleDefinitionMemento);
          $scope.rule.feedback = angular.copy($scope.ruleFeedbackMemento);
          $scope.rule.dest = angular.copy($scope.ruleDestMemento);
          $scope.ruleDescriptionMemento = null;
          $scope.ruleDefinitionMemento = null;
          $scope.ruleFeedbackMemento = null;
          $scope.ruleDestMemento = null;
        };
        $scope.deleteThisRule = function() {
          $scope.cancelThisEdit();
          $scope.deleteRule();
        };

        $scope._createRuleDestIfNecessary = function() {
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

        $scope.openAddStateModal = function(rule) {
          $modal.open({
            templateUrl: 'modals/addState',
            backdrop: 'static',
            resolve: {
              isEditable: function() {
                return $scope.isEditable;
              }
            },
            controller: [
                '$scope', '$timeout', '$modalInstance', 'explorationStatesService', 'isEditable', 'focusService',
                function($scope, $timeout, $modalInstance, explorationStatesService, isEditable, focusService) {
              $scope.isEditable = isEditable;
              $scope.newStateName = '';
              $timeout(function() {
                focusService.setFocus('newStateNameInput');
              });

              $scope.isNewStateNameValid = function(newStateName) {
                return explorationStatesService.isNewStateNameValid(newStateName, false);
              }

              $scope.submit = function(newStateName) {
                $modalInstance.close(newStateName);
              };

              $scope.cancel = function() {
                $modalInstance.dismiss('cancel');
              };
            }]
          }).result.then(function(newStateName) {
            if (!explorationStatesService.isNewStateNameValid(newStateName, false)) {
              return;
            }

            $scope.reloadingDestinations = true;
            explorationStatesService.addState(newStateName, function() {
              $rootScope.$broadcast('refreshGraph');
              $timeout(function() {
                rule.dest = newStateName;
                // Reload the select2 dropdown to include the new state.
                $scope.reloadingDestinations = false;
              });
            });
          });
        };

        $scope.getActiveStateName = function() {
          return editorContextService.getActiveStateName();
        };

        $scope.isRuleConfusing = function() {
          return (
            $scope.rule.feedback.length === 0 &&
            $scope.rule.dest === editorContextService.getActiveStateName());
        };

        // Method that converts newly typed-in destination strings to text in the
        // rule destination dropdown.
        $scope.convertNewDestToText = function(term) {
          return term + ' (new)';
        };

        $scope.navigateToRuleDest = function() {
          routerService.navigateToMainTab($scope.rule.dest);
        };
      }
    ]
  };
}]);


oppia.directive('ruleDescriptionEditor', ['$log', function($log) {
  return {
    restrict: 'E',
    scope: {
      currentRuleDescription: '=',
      currentRuleDefinition: '='
    },
    templateUrl: 'rules/ruleDescriptionEditor',
    controller: [
        '$scope', 'editorContextService', 'explorationStatesService', 'routerService', 'validatorsService',
        'rulesService',
        function($scope, editorContextService, explorationStatesService, routerService, validatorsService, rulesService) {

      var _generateAllRuleTypes = function() {
        var _interactionHandlerSpecs = rulesService.getInteractionHandlerSpecs();
        for (var i = 0; i < _interactionHandlerSpecs.length; i++) {
          if (_interactionHandlerSpecs[i].name == 'submit') {
            $scope.allRuleTypes = {};
            for (var description in _interactionHandlerSpecs[i].rules) {
              $scope.allRuleTypes[description] = _interactionHandlerSpecs[i].rules[description].classifier;
            }
            return;
          }
        }
      };

      var _computeRuleDescriptionFragments = function() {
        if (!$scope.currentRuleDescription) {
          $scope.ruleDescriptionFragments = [];
          return;
        }

        var pattern = /\{\{\s*(\w+)\s*\|\s*(\w+)\s*\}\}/;

        var finalInputArray = $scope.currentRuleDescription.split(pattern);
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

          var _answerChoices = rulesService.getAnswerChoices();

          if (_answerChoices && _answerChoices.length) {
            // This rule is for a multiple-choice interaction.
            // TODO(sll): Remove the need for this special case for multiple-choice
            // input.
            $scope.ruleDescriptionChoices = _answerChoices.map(function(choice, ind) {
              return {
                val: choice.label,
                id: choice.val
              };
            });

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

      $scope.onSelectNewRuleType = function() {
        $scope.currentRuleDefinition.name = $scope.allRuleTypes[$scope.currentRuleDescription];
        $scope.currentRuleDefinition.inputs = {};
        _computeRuleDescriptionFragments();

        // Finds the parameters and sets them in $scope.currentRuleDefinition.inputs.
        var pattern = /\{\{\s*(\w+)\s*(\|\s*\w+\s*)?\}\}/;
        var copyOfRule = $scope.currentRuleDescription;
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
            $scope.currentRuleDefinition.inputs[varName] = [];
          } else if (varType == 'NonnegativeInt') {
            // Set a default value.
            $scope.currentRuleDefinition.inputs[varName] = 0;
          } else if (varType == "Graph") {
            $scope.currentRuleDefinition.inputs[varName] = {
              'vertices': [],
              'edges': [],
              'isDirected': false,
              'isWeighted': false,
              'isLabeled': false
            };
          } else {
            $scope.currentRuleDefinition.inputs[varName] = '';
          }

          copyOfRule = copyOfRule.replace(pattern, ' ');
        }
      };

      _generateAllRuleTypes();
      if ($scope.currentRuleDescription === null) {
        for (var key in $scope.allRuleTypes) {
          $scope.currentRuleDescription = key;
          $scope.onSelectNewRuleType();
          break;
        }
      }

      _computeRuleDescriptionFragments();

      $scope.$watch('rulesService.interactionHandlerSpecs', function() {
        _generateAllRuleTypes();
      });
    }]
  };
}]);
