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
 * @fileoverview Directive for the answer group editor.
 */

oppia.directive('answerGroupEditor', [
  'UrlInterpolationService', function(UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {
        isEditable: '=',
        displayFeedback: '=',
        getOnSaveAnswerGroupDestFn: '&onSaveAnswerGroupDest',
        getOnSaveAnswerGroupFeedbackFn: '&onSaveAnswerGroupFeedback',
        getOnSaveAnswerGroupRulesFn: '&onSaveAnswerGroupRules',
        getOnSaveAnswerGroupCorrectnessLabelFn: (
          '&onSaveAnswerGroupCorrectnessLabel'),
        outcome: '=',
        suppressWarnings: '&',
        rules: '='
      },
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/components/answer_group_editor_directive.html'),
      controller: [
        '$scope', 'stateInteractionIdService', 'ResponsesService',
        'EditorStateService', 'AlertsService', 'INTERACTION_SPECS',
        'RuleObjectFactory', 'TrainingDataEditorPanelService',
        function(
            $scope, stateInteractionIdService, ResponsesService,
            EditorStateService, AlertsService, INTERACTION_SPECS,
            RuleObjectFactory, TrainingDataEditorPanelService) {
          $scope.rulesMemento = null;
          $scope.activeRuleIndex = ResponsesService.getActiveRuleIndex();
          $scope.editAnswerGroupForm = {};

          $scope.getAnswerChoices = function() {
            return ResponsesService.getAnswerChoices();
          };
          $scope.answerChoices = $scope.getAnswerChoices();

          // Updates answer choices when the interaction requires it -- e.g.,
          // the rules for multiple choice need to refer to the multiple choice
          // interaction's customization arguments.
          // TODO(sll): Remove the need for this watcher, or make it less
          // ad hoc.
          $scope.$on('updateAnswerChoices', function() {
            $scope.answerChoices = $scope.getAnswerChoices();
          });

          $scope.getCurrentInteractionId = function() {
            return stateInteractionIdService.savedMemento;
          };

          $scope.$on('externalSave', function() {
            if ($scope.isRuleEditorOpen()) {
              $scope.saveRules();
            }
          });

          var getDefaultInputValue = function(varType) {
            // TODO(bhenning): Typed objects in the backend should be required
            // to provide a default value specific for their type.
            switch (varType) {
              default:
              case 'Null':
                return null;
              case 'Boolean':
                return false;
              case 'Real':
              case 'Int':
              case 'NonnegativeInt':
                return 0;
              case 'CodeString':
              case 'UnicodeString':
              case 'NormalizedString':
              case 'MathLatexString':
              case 'Html':
              case 'SanitizedUrl':
              case 'Filepath':
              case 'LogicErrorCategory':
                return '';
              case 'CodeEvaluation':
                return {
                  code: getDefaultInputValue('UnicodeString'),
                  error: getDefaultInputValue('UnicodeString'),
                  evaluation: getDefaultInputValue('UnicodeString'),
                  output: getDefaultInputValue('UnicodeString')
                };
              case 'CoordTwoDim':
                return [
                  getDefaultInputValue('Real'),
                  getDefaultInputValue('Real')];
              case 'ListOfUnicodeString':
              case 'SetOfUnicodeString':
              case 'SetOfHtmlString':
                return [];
              case 'MusicPhrase':
                return [];
              case 'CheckedProof':
                return {
                  assumptions_string: getDefaultInputValue('UnicodeString'),
                  correct: getDefaultInputValue('Boolean'),
                  proof_string: getDefaultInputValue('UnicodeString'),
                  target_string: getDefaultInputValue('UnicodeString')
                };
              case 'LogicQuestion':
                return {
                  arguments: [],
                  dummies: [],
                  top_kind_name: getDefaultInputValue('UnicodeString'),
                  top_operator_name: getDefaultInputValue('UnicodeString')
                };
              case 'Graph':
                return {
                  edges: [],
                  isDirected: getDefaultInputValue('Boolean'),
                  isLabeled: getDefaultInputValue('Boolean'),
                  isWeighted: getDefaultInputValue('Boolean'),
                  vertices: []
                };
              case 'NormalizedRectangle2D':
                return [
                  [getDefaultInputValue('Real'), getDefaultInputValue('Real')],
                  [getDefaultInputValue('Real'), getDefaultInputValue('Real')]];
              case 'ImageRegion':
                return {
                  area: getDefaultInputValue('NormalizedRectangle2D'),
                  regionType: getDefaultInputValue('UnicodeString')
                };
              case 'ImageWithRegions':
                return {
                  imagePath: getDefaultInputValue('Filepath'),
                  labeledRegions: []
                };
              case 'ClickOnImage':
                return {
                  clickPosition: [
                    getDefaultInputValue('Real'), getDefaultInputValue('Real')],
                  clickedRegions: []
                };
            }
          };

          $scope.addNewRule = function() {
            // Build an initial blank set of inputs for the initial rule.
            var interactionId = $scope.getCurrentInteractionId();
            var ruleDescriptions = (
              INTERACTION_SPECS[interactionId].rule_descriptions);
            var ruleTypes = Object.keys(ruleDescriptions);
            if (ruleTypes.length === 0) {
              // This should never happen. An interaction must have at least
              // one rule, as verified in a backend test suite:
              //   extensions.interactions.base_test.InteractionUnitTests.
              return;
            }
            var ruleType = ruleTypes[0];
            var description = ruleDescriptions[ruleType];

            var PATTERN = /\{\{\s*(\w+)\s*(\|\s*\w+\s*)?\}\}/;
            var inputs = {};
            while (description.match(PATTERN)) {
              var varName = description.match(PATTERN)[1];
              var varType = description.match(PATTERN)[2];
              if (varType) {
                varType = varType.substring(1);
              }

              inputs[varName] = getDefaultInputValue(varType);
              description = description.replace(PATTERN, ' ');
            }

            // Save the state of the rules before adding a new one (in case the
            // user cancels the addition).
            $scope.rulesMemento = angular.copy($scope.rules);

            // TODO(bhenning): Should use functionality in ruleEditor.js, but
            // move it to ResponsesService in StateResponses.js to properly
            // form a new rule.
            $scope.rules.push(RuleObjectFactory.createNew(ruleType, inputs));
            $scope.changeActiveRuleIndex($scope.rules.length - 1);
          };

          $scope.deleteRule = function(index) {
            $scope.rules.splice(index, 1);
            $scope.saveRules();

            if ($scope.rules.length === 0) {
              AlertsService.addWarning(
                'All answer groups must have at least one rule.');
            }
          };

          $scope.cancelActiveRuleEdit = function() {
            $scope.rules.splice(0, $scope.rules.length);
            for (var i = 0; i < $scope.rulesMemento.length; i++) {
              $scope.rules.push($scope.rulesMemento[i]);
            }
            $scope.saveRules();
          };

          $scope.saveRules = function() {
            $scope.changeActiveRuleIndex(-1);
            $scope.rulesMemento = null;
            $scope.getOnSaveAnswerGroupRulesFn()($scope.rules);
          };

          $scope.changeActiveRuleIndex = function(newIndex) {
            ResponsesService.changeActiveRuleIndex(newIndex);
            $scope.activeRuleIndex = ResponsesService.getActiveRuleIndex();
          };

          $scope.openRuleEditor = function(index) {
            if (!$scope.isEditable) {
              // The rule editor may not be opened in a read-only editor view.
              return;
            }
            $scope.rulesMemento = angular.copy($scope.rules);
            $scope.changeActiveRuleIndex(index);
          };

          $scope.isRuleEditorOpen = function() {
            return $scope.activeRuleIndex !== -1;
          };

          $scope.isInteractionTrainable = function() {
            var interactionId = $scope.getCurrentInteractionId();
            return INTERACTION_SPECS[interactionId].is_trainable;
          };

          $scope.openTrainingDataEditor = function() {
            TrainingDataEditorPanelService.openTrainingDataEditor(true);
          };

          $scope.$on('onInteractionIdChanged', function() {
            if ($scope.isRuleEditorOpen()) {
              $scope.saveRules();
            }
            $scope.$broadcast('updateAnswerGroupInteractionId');
            $scope.answerChoices = $scope.getAnswerChoices();
          });
        }
      ]
    };
  }]);
