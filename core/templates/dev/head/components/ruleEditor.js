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
      localValue: '=',
      onSelectionChange: '&'
    },
    template: '<input type="hidden">',
    controller: [
        '$scope', '$element', '$rootScope', '$filter', 'stateInteractionIdService', 'INTERACTION_SPECS',
        function($scope, $element, $rootScope, $filter, stateInteractionIdService, INTERACTION_SPECS) {

      var choices = [];
      var numberOfRuleTypes = 0;

      var ruleTypesToDescriptions = INTERACTION_SPECS[
        stateInteractionIdService.savedMemento].rule_descriptions;
      for (var ruleType in ruleTypesToDescriptions) {
        numberOfRuleTypes++;
        choices.push({
          id: ruleType,
          text: 'Answer ' + $filter('replaceInputsWithEllipses')(
            ruleTypesToDescriptions[ruleType])
        });
      }

      choices.sort(function(a, b) {
        if (a.text < b.text) {
          return -1;
        } else if (a.text > b.text) {
          return 1;
        } else {
          return 0;
        }
      });

      if (!$scope.localValue) {
        $scope.localValue = choices[choices.length - 1].id;
        $scope.onSelectionChange()($scope.localValue);
      }

      var select2Node = $element[0].firstChild;
      $(select2Node).select2({
        data: choices,
        // Suppress the search box.
        minimumResultsForSearch: -1,
        allowClear: false,
        width: '350px',
        formatSelection: function(object, container) {
          if (object.id === 'Default') {
            return (
              stateInteractionIdService.savedMemento === 'Continue' ?
              'When the button is clicked' :
              'When no other rule applies');
          } else {
            return $filter('truncateAtFirstEllipsis')(object.text);
          }
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
        $scope.onSelectionChange()(e.val);
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
      outcome: '=',
      isDefaultRule: '&',
      saveRule: '&',
      deleteRule: '&',
      isEditable: '='
    },
    templateUrl: 'inline/rule_editor',
    controller: [
      '$scope', '$rootScope', '$modal', '$timeout', 'editorContextService', 'routerService',
      'validatorsService', 'rulesService', 'explorationStatesService', 'stateInteractionIdService',
      function(
          $scope, $rootScope, $modal, $timeout, editorContextService, routerService,
          validatorsService, rulesService, explorationStatesService, stateInteractionIdService) {
        $scope.editRuleForm = {};

        $scope.answerChoices = rulesService.getAnswerChoices();
        $scope.currentInteractionId = stateInteractionIdService.savedMemento;

        var resetMementos = function() {
          $scope.ruleTypeMemento = null;
          $scope.ruleInputsMemento = null;
          $scope.ruleFeedbackMemento = null;
          $scope.ruleDestMemento = null;
        };
        resetMementos();

        $scope.ruleEditorIsOpen = false;
        $scope.openRuleEditor = function() {
          if ($scope.isEditable) {
            if (!$scope.isDefaultRule()) {
              $scope.ruleTypeMemento = angular.copy($scope.rule.rule_type);
              $scope.ruleInputsMemento = angular.copy($scope.rule.inputs);
            } else {
              $scope.ruleTypeMemento = null;
              $scope.ruleInputsMemento = null;
            }
            $scope.ruleFeedbackMemento = angular.copy($scope.outcome.feedback);
            $scope.ruleDestMemento = angular.copy($scope.outcome.dest);

            $scope.ruleEditorIsOpen = true;
            if ($scope.outcome.feedback.length === 0) {
              $scope.outcome.feedback.push('');
            }
          }
        };

        $scope.saveThisRule = function() {
          $scope.$broadcast('saveRuleDetails');
          // TODO(sll): Add more validation prior to saving.
          $scope.ruleEditorIsOpen = false;
          resetMementos();
          $scope.saveRule();
        };
        $scope.cancelThisEdit = function() {
          $scope.ruleEditorIsOpen = false;
          if (!$scope.isDefaultRule()) {
            $scope.rule.rule_type = angular.copy($scope.ruleTypeMemento);
            $scope.rule.inputs = angular.copy($scope.ruleInputsMemento);
          }
          $scope.outcome.feedback = angular.copy($scope.ruleFeedbackMemento);
          $scope.outcome.dest = angular.copy($scope.ruleDestMemento);
          resetMementos();
        };
        $scope.deleteThisRule = function() {
          $scope.deleteRule();
        };

        $scope.$on('externalSave', function() {
          if ($scope.ruleEditorIsOpen) {
            $scope.saveThisRule();
          }
        });

        $scope.$on('onInteractionIdChanged', function(evt, newInteractionId) {
          if ($scope.ruleEditorIsOpen) {
            $scope.saveThisRule();
          }
          $scope.$broadcast('updateRuleDescriptionInteractionId');
        });

        $scope.getActiveStateName = function() {
          return editorContextService.getActiveStateName();
        };

        $scope.isRuleConfusing = function() {
          return (
            $scope.outcome &&
            $scope.outcome.feedback.length === 0 &&
            $scope.outcome.dest === editorContextService.getActiveStateName());
        };

        $scope.navigateToRuleDest = function() {
          routerService.navigateToMainTab($scope.outcome.dest);
        };

        $scope.isSelfLoopWithNoFeedback = function(outcome) {
          var hasFeedback = false;
          for (var i = 0; i < outcome.feedback.length; i++) {
            if (outcome.feedback[i].length > 0) {
              hasFeedback = true;
            }
          }

          return (
            outcome.dest === editorContextService.getActiveStateName() &&
            !hasFeedback);
        };
      }
    ]
  };
}]);


oppia.directive('ruleDetailsEditor', ['$log', function($log) {
  return {
    restrict: 'E',
    scope: {
      rule: '=',
      outcome: '=',
      isDefaultRule: '&'
    },
    templateUrl: 'rules/ruleDetailsEditor',
    controller: [
      '$scope', '$rootScope', '$modal', '$timeout', 'editorContextService', 'routerService',
      'validatorsService', 'rulesService', 'explorationStatesService', 'stateInteractionIdService',
      'stateGraphArranger',
      function(
          $scope, $rootScope, $modal, $timeout, editorContextService, routerService,
          validatorsService, rulesService, explorationStatesService, stateInteractionIdService,
          stateGraphArranger) {

        $scope.currentInteractionId = stateInteractionIdService.savedMemento;

        $scope.RULE_FEEDBACK_SCHEMA = {
          type: 'list',
          items: {
            type: 'html'
          },
          ui_config: {
            add_element_text: 'Add Variation'
          }
        };

        var lastSetRuleDest = $scope.outcome.dest;

        // We use a slash because this character is forbidden in a state name.
        var _PLACEHOLDER_RULE_DEST = '/';

        $scope.$on('saveRuleDetails', function() {
          // Remove null feedback.
          var nonemptyFeedback = [];
          for (var i = 0; i < $scope.outcome.feedback.length; i++) {
            if ($scope.outcome.feedback[i]) {
              nonemptyFeedback.push($scope.outcome.feedback[i]);
            }
          }
          $scope.outcome.feedback = nonemptyFeedback;
        });

        $scope.createNewDestIfNecessary = function() {
          if ($scope.outcome.dest === _PLACEHOLDER_RULE_DEST) {
            $modal.open({
              templateUrl: 'modals/addState',
              backdrop: true,
              resolve: {},
              controller: [
                  '$scope', '$timeout', '$modalInstance', 'explorationStatesService', 'focusService',
                  function($scope, $timeout, $modalInstance, explorationStatesService, focusService) {
                $scope.newStateName = '';
                $timeout(function() {
                  focusService.setFocus('newStateNameInput');
                });

                $scope.isNewStateNameValid = function(newStateName) {
                  return explorationStatesService.isNewStateNameValid(newStateName, false);
                }

                $scope.submit = function(newStateName) {
                  if (!$scope.isNewStateNameValid(newStateName, false)) {
                    return;
                  }

                  $modalInstance.close({
                    action: 'addNewState',
                    newStateName: newStateName
                  });
                };

                $scope.cancel = function() {
                  $modalInstance.close({
                    action: 'cancel'
                  });
                };
              }]
            }).result.then(function(result) {
              if (result.action === 'addNewState') {
                $scope.reloadingDestinations = true;
                explorationStatesService.addState(result.newStateName, function() {
                  $rootScope.$broadcast('refreshGraph');
                  $timeout(function() {
                    $scope.outcome.dest = result.newStateName;
                    lastSetRuleDest = $scope.outcome.dest;
                    // Reload the dropdown to include the new state.
                    $scope.reloadingDestinations = false;
                  });
                });
              } else if (result.action === 'cancel') {
                $scope.outcome.dest = lastSetRuleDest;
              } else {
                throw 'Invalid result action from add state modal: ' + result.action;
              }
            });
          } else {
            lastSetRuleDest = $scope.outcome.dest;
          }
        };

        $scope.destChoices = [];
        $scope.$watch(explorationStatesService.getStates, function(newValue) {
          var _currentStateName = editorContextService.getActiveStateName();

          // This is a list of objects, each with an ID and name. These
          // represent all states, as well as an option to create a
          // new state.
          $scope.destChoices = [{
            id: _currentStateName,
            text: _currentStateName + ' ⟳'
          }, {
            id: _PLACEHOLDER_RULE_DEST,
            text: 'Create New State...'
          }];

          // Arrange the remaining states based on their order in the state graph.
          var lastComputedArrangement = stateGraphArranger.getLastComputedArrangement();
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
            if (stateNames[i] !== _currentStateName) {
              $scope.destChoices.push({
                id: stateNames[i],
                text: stateNames[i]
              });
            }
          }
        }, true);
      }
    ]
  };
}]);


oppia.directive('ruleDescriptionEditor', ['$log', function($log) {
  return {
    restrict: 'E',
    scope: {
      currentRule: '=',
      isDefaultRule: '&'
    },
    templateUrl: 'rules/ruleDescriptionEditor',
    controller: [
        '$scope', 'editorContextService', 'explorationStatesService', 'routerService', 'validatorsService',
        'rulesService', 'stateInteractionIdService', 'INTERACTION_SPECS',
        function($scope, editorContextService, explorationStatesService, routerService, validatorsService,
                 rulesService, stateInteractionIdService, INTERACTION_SPECS) {

      $scope.currentInteractionId = stateInteractionIdService.savedMemento;

      // This returns the rule description string.
      var _computeRuleDescriptionFragments = function() {
        if (!$scope.currentRule.rule_type) {
          $scope.ruleDescriptionFragments = [];
          return '';
        }

        var ruleDescription = INTERACTION_SPECS[
          $scope.currentInteractionId].rule_descriptions[$scope.currentRule.rule_type];

        var PATTERN = /\{\{\s*(\w+)\s*\|\s*(\w+)\s*\}\}/;
        var finalInputArray = ruleDescription.split(PATTERN);
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

          if (_answerChoices) {
            // This rule is for a multiple-choice or image-click interaction.
            // TODO(sll): Remove the need for this special case.
            if (_answerChoices.length > 0) {
              $scope.ruleDescriptionChoices = _answerChoices.map(function(choice, ind) {
                return {
                  val: choice.label,
                  id: choice.val
                };
              });
              result.push({'type': 'select', 'varName': finalInputArray[i+1]});
              if (!$scope.currentRule.inputs[finalInputArray[i + 1]]) {
                $scope.currentRule.inputs[finalInputArray[i + 1]] = $scope.ruleDescriptionChoices[0].id;
              }
            } else {
              $scope.ruleDescriptionChoices = [];
              result.push({'type': 'noneditable', 'text': ' [Error: No choices available] '});
            }
          } else {
            result.push({
              'type': finalInputArray[i+2],
              'varName': finalInputArray[i+1]
            });
          }
        }
        $scope.ruleDescriptionFragments = result;
        return ruleDescription;
      };

      $scope.$on('updateRuleDescriptionInteractionId', function(evt, newInteractionId) {
        $scope.currentInteractionId = newInteractionId;
      });

      $scope.onSelectNewRuleType = function(newRuleType) {
        $scope.currentRule.rule_type = newRuleType;
        $scope.currentRule.inputs = {};
        var tmpRuleDescription = _computeRuleDescriptionFragments();

        // Finds the parameters and sets them in $scope.currentRule.inputs.
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

          if (varType == 'Set') {
            $scope.currentRule.inputs[varName] = [];
          } else if (varType == 'NonnegativeInt') {
            // Set a default value.
            $scope.currentRule.inputs[varName] = 0;
          } else if (varType == "Graph") {
            $scope.currentRule.inputs[varName] = {
              'vertices': [],
              'edges': [],
              'isDirected': false,
              'isWeighted': false,
              'isLabeled': false
            };
          } else {
            $scope.currentRule.inputs[varName] = '';
          }

          tmpRuleDescription = tmpRuleDescription.replace(PATTERN, ' ');
        }
      };

      $scope.init = function() {
        // Select a default rule type, if one isn't already selected.
        if (!$scope.isDefaultRule() && $scope.currentRule.rule_type === null) {
          var ruleTypesToDescriptions = INTERACTION_SPECS[$scope.currentInteractionId].rule_descriptions;
          for (var ruleType in ruleTypesToDescriptions) {
            if ($scope.currentRule.rule_type === null || ruleType < $scope.currentRule.rule_type) {
              $scope.currentRule.rule_type = ruleType;
            }
          }
          $scope.onSelectNewRuleType($scope.currentRule.rule_type);
        }

        _computeRuleDescriptionFragments();
      };

      $scope.init();
    }]
  };
}]);
