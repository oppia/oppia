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
        '$scope', '$element', '$rootScope', '$filter',
        'stateInteractionIdService', 'INTERACTION_SPECS', 'FUZZY_RULE_TYPE',
        function($scope, $element, $rootScope, $filter,
          stateInteractionIdService, INTERACTION_SPECS, FUZZY_RULE_TYPE) {

      var choices = [];
      var numberOfRuleTypes = 0;

      var ruleTypesToDescriptions = INTERACTION_SPECS[
        stateInteractionIdService.savedMemento].rule_descriptions;
      for (var ruleType in ruleTypesToDescriptions) {
        if (ruleType == FUZZY_RULE_TYPE) {
          continue;
        }
        numberOfRuleTypes++;
        choices.push({
          id: ruleType,
          text: $filter('replaceInputsWithEllipses')(
            ruleTypesToDescriptions[ruleType])
        });
      }

      // TODO(bhenning): The order of choices should be meaningful. E.g., having
      // "is equal to" for most interactions first makes sense. They should
      // ideally be ordered based on likelihood of being used.
      choices.sort(function(a, b) {
        if (a.text < b.text) {
          return -1;
        } else if (a.text > b.text) {
          return 1;
        } else {
          return 0;
        }
      });

      // Select the first choice by default.
      if (!$scope.localValue) {
        $scope.localValue = choices[0].id;
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
          return $filter('truncateAtFirstEllipsis')(object.text);
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


// This directive controls an editor for selecting the type and input parameters
// to a rule. It also includes 'Cancel' and 'Save Answer' buttons which call
// respective 'onCancelRuleEdit' and 'onSaveRule' callbacks when called. These
// buttons only show up if 'isEditingRuleInline' is true.
oppia.directive('ruleEditor', ['$log', function($log) {
  return {
    restrict: 'E',
    scope: {
      rule: '=',
      isEditable: '=',
      isEditingRuleInline: '&',
      onCancelRuleEdit: '&',
      onSaveRule: '&'
    },
    templateUrl: 'inline/rule_editor',
    controller: [
        '$scope', '$timeout', 'editorContextService',
        'explorationStatesService', 'routerService', 'validatorsService',
        'responsesService', 'stateInteractionIdService', 'INTERACTION_SPECS',
        'FUZZY_RULE_TYPE', function(
          $scope, $timeout, editorContextService,
          explorationStatesService, routerService, validatorsService,
          responsesService, stateInteractionIdService, INTERACTION_SPECS,
          FUZZY_RULE_TYPE) {
      $scope.currentInteractionId = stateInteractionIdService.savedMemento;
      $scope.editRuleForm = {};

      // This returns the rule description string.
      var _computeRuleDescriptionFragments = function() {
        if (!$scope.rule.rule_type) {
          $scope.ruleDescriptionFragments = [];
          return '';
        }

        var ruleDescription = INTERACTION_SPECS[
          $scope.currentInteractionId].rule_descriptions[$scope.rule.rule_type];

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

          var _answerChoices = responsesService.getAnswerChoices();

          if (_answerChoices) {
            // This rule is for a multiple-choice, image-click, or item selection interaction.
            // TODO(sll): Remove the need for this special case.
            if (_answerChoices.length > 0) {
              if (finalInputArray[2] === 'SetOfHtmlString') {
                $scope.ruleDescriptionChoices = _answerChoices.map(function(choice, ind) {
                  return {
                    val: choice.label,
                    id: choice.label
                  };
                });
                result.push({'type': 'checkboxes', 'varName': finalInputArray[i + 1]});
              } else {
                $scope.ruleDescriptionChoices = _answerChoices.map(function(choice, ind) {
                  return {
                    val: choice.label,
                    id: choice.val
                  };
                });
                result.push({'type': 'select', 'varName': finalInputArray[i+1]});
                if (!$scope.rule.inputs[finalInputArray[i + 1]]) {
                  $scope.rule.inputs[finalInputArray[i + 1]] = $scope.ruleDescriptionChoices[0].id;
                }
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

        // The following is necessary in order to ensure that the object-editor
        // HTML tags load correctly when the rule type is changed. This is an
        // issue for, e.g., the MusicNotesInput interaction, where the rule
        // inputs can sometimes be integers and sometimes be lists of music
        // notes.
        $scope.ruleDescriptionFragments = [];
        $timeout(function() {
          $scope.ruleDescriptionFragments = result;
        }, 10);

        return ruleDescription;
      };

      $scope.$on('updateAnswerGroupInteractionId', function(evt, newInteractionId) {
        $scope.currentInteractionId = newInteractionId;
      });

      $scope.onSelectNewRuleType = function(newRuleType) {
        $scope.rule.rule_type = newRuleType;
        $scope.rule.inputs = {};
        var tmpRuleDescription = _computeRuleDescriptionFragments();
        // This provides the list of choices for the multiple-choice and image-click interactions.
        var _answerChoices = responsesService.getAnswerChoices();

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

          if (varType === 'SetOfHtmlString') {
            $scope.rule.inputs[varName] = [];
          } else if (_answerChoices) {
            $scope.rule.inputs[varName] = angular.copy(_answerChoices[0].val);
          } else if (varType == 'Graph') {
            $scope.rule.inputs[varName] = {
              'vertices': [],
              'edges': [],
              'isDirected': false,
              'isWeighted': false,
              'isLabeled': false
            };
          } else {
            $scope.rule.inputs[varName] = '';
          }

          tmpRuleDescription = tmpRuleDescription.replace(PATTERN, ' ');
        }
      };

      $scope.onDeleteTrainingDataEntry = function(index) {
        if ($scope.rule.rule_type === FUZZY_RULE_TYPE) {
          var trainingData = $scope.rule.inputs.training_data;
          if (index < trainingData.length) {
            trainingData.splice(index, 1);
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
        if ($scope.rule.rule_type === null) {
          $scope.onSelectNewRuleType($scope.rule.rule_type);
        }
        _computeRuleDescriptionFragments();
      };

      $scope.init();
    }]
  };
}]);

oppia.directive('fuzzyRulePanel', [function() {
  return {
    restrict: 'E',
    scope: {
      ruleInputs: '=',
      onTrainingDataDeletion: '&'
    },
    templateUrl: 'rules/fuzzyRulePanel',
    controller: [
      '$scope', '$modal', 'oppiaExplorationHtmlFormatterService',
      'stateInteractionIdService', 'stateCustomizationArgsService',
      'trainingModalService',
      function($scope, $modal, oppiaExplorationHtmlFormatterService,
          stateInteractionIdService, stateCustomizationArgsService,
          trainingModalService) {
        $scope.trainingDataHtmlList = [];
        var _trainingData = $scope.ruleInputs.training_data;
        for (var i = 0; i < _trainingData.length; i++) {
          $scope.trainingDataHtmlList.push(
            oppiaExplorationHtmlFormatterService.getShortAnswerHtml(
              _trainingData[i], stateInteractionIdService.savedMemento,
              stateCustomizationArgsService.savedMemento));
        }

        $scope.openRetrainAnswerModal = function(trainingDataIndex) {
          trainingModalService.openTrainUnresolvedAnswerModal(
            _trainingData[trainingDataIndex], false);
        };
      }
    ]
  };
}]);
