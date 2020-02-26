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

require(
  'components/state-directives/outcome-editor/outcome-editor.directive.ts');
require('components/state-directives/rule-editor/rule-editor.directive.ts');
require('directives/angular-html-bind.directive.ts');
require('filters/parameterize-rule-description.filter.ts');

require('domain/utilities/url-interpolation.service.ts');
require('domain/exploration/RuleObjectFactory.ts');
require(
  'pages/exploration-editor-page/editor-tab/services/responses.service.ts');
require(
  'pages/exploration-editor-page/editor-tab/training-panel/' +
  'training-data-editor-panel.service.ts');
require(
  'components/state-editor/state-editor-properties-services/' +
  'state-editor.service.ts');
require(
  'components/state-editor/state-editor-properties-services/' +
  'state-property.service.ts');
require('services/alerts.service.ts');
require('services/context.service.ts');

angular.module('oppia').directive('answerGroupEditor', [
  'UrlInterpolationService', function(UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {},
      bindToController: {
        addState: '=',
        displayFeedback: '=',
        getOnSaveTaggedMisconception: '&onSaveTaggedMisconception',
        getOnSaveAnswerGroupDestFn: '&onSaveAnswerGroupDest',
        getOnSaveAnswerGroupFeedbackFn: '&onSaveAnswerGroupFeedback',
        getOnSaveAnswerGroupRulesFn: '&onSaveAnswerGroupRules',
        getOnSaveAnswerGroupCorrectnessLabelFn: (
          '&onSaveAnswerGroupCorrectnessLabel'),
        getTaggedSkillMisconceptionId: '&taggedSkillMisconceptionId',
        isEditable: '=',
        outcome: '=',
        rules: '=',
        showMarkAllAudioAsNeedingUpdateModalIfRequired: '=',
        suppressWarnings: '&'
      },
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/components/state-directives/answer-group-editor/' +
        'answer-group-editor.directive.html'),
      controllerAs: '$ctrl',
      controller: [
        '$scope', '$rootScope', '$uibModal', 'StateInteractionIdService',
        'AlertsService', 'ContextService', 'INTERACTION_SPECS',
        'StateEditorService', 'RuleObjectFactory',
        'TrainingDataEditorPanelService', 'ENABLE_ML_CLASSIFIERS',
        'ResponsesService',
        function(
            $scope, $rootScope, $uibModal, StateInteractionIdService,
            AlertsService, ContextService, INTERACTION_SPECS,
            StateEditorService, RuleObjectFactory,
            TrainingDataEditorPanelService, ENABLE_ML_CLASSIFIERS,
            ResponsesService) {
          var ctrl = this;
          var _getTaggedMisconceptionName = function(skillMisconceptionId) {
            if (skillMisconceptionId !== null) {
              if (typeof skillMisconceptionId === 'string' &&
                  skillMisconceptionId.split('-').length === 2) {
                var skillId = skillMisconceptionId.split('-')[0];
                var misconceptionId = skillMisconceptionId.split('-')[1];
                var misconceptions = ctrl.misconceptionsBySkill[skillId];

                for (var i = 0; i < misconceptions.length; i++) {
                  if (misconceptions[i].getId().toString() ===
                    misconceptionId) {
                    ctrl.misconceptionName = misconceptions[i].getName();
                  }
                }
              } else {
                throw Error('Expected skillMisconceptionId to be ' +
                  '<skillId>-<misconceptionId>.');
              }
            }
          };
          ctrl.isInQuestionMode = function() {
            return StateEditorService.isInQuestionMode();
          };

          ctrl.containsMisconceptions = function() {
            var containsMisconceptions = false;
            Object.keys(ctrl.misconceptionsBySkill).forEach(function(skillId) {
              if (ctrl.misconceptionsBySkill[skillId].length > 0) {
                containsMisconceptions = true;
              }
            });
            return containsMisconceptions;
          };

          ctrl.tagAnswerGroupWithMisconception = function() {
            var modalInstance = $uibModal.open({
              templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
                '/pages/topic-editor-page/modal-templates/' +
                'tag-misconception-modal.template.html'),
              backdrop: true,
              controller: [
                '$scope', '$uibModalInstance', 'StateEditorService',
                function($scope, $uibModalInstance, StateEditorService) {
                  $scope.misconceptionsBySkill =
                    StateEditorService.getMisconceptionsBySkill();
                  $scope.selectedMisconception = null;
                  $scope.selectedMisconceptionSkillId = null;
                  $scope.misconceptionFeedbackIsUsed = false;

                  $scope.selectMisconception = function(
                      misconception, skillId) {
                    $scope.selectedMisconception = angular.copy(misconception);
                    $scope.selectedMisconceptionSkillId = skillId;
                  };

                  $scope.toggleMisconceptionFeedbackUsage = function() {
                    $scope.misconceptionFeedbackIsUsed =
                      !$scope.misconceptionFeedbackIsUsed;
                  };

                  $scope.done = function() {
                    $uibModalInstance.close({
                      misconception: $scope.selectedMisconception,
                      misconceptionSkillId: $scope.selectedMisconceptionSkillId,
                      feedbackIsUsed: $scope.misconceptionFeedbackIsUsed
                    });
                  };

                  $scope.cancel = function() {
                    $uibModalInstance.dismiss('cancel');
                  };
                }
              ]
            });

            modalInstance.result.then(function(returnObject) {
              var misconception = returnObject.misconception;
              var misconceptionSkillId = returnObject.misconceptionSkillId;
              var feedbackIsUsed = returnObject.feedbackIsUsed;
              var outcome = angular.copy(ctrl.outcome);
              if (feedbackIsUsed) {
                outcome.feedback.setHtml(misconception.getFeedback());
                ctrl.getOnSaveAnswerGroupFeedbackFn()(outcome);
                $rootScope.$broadcast('externalSave');
              }
              ctrl.getOnSaveTaggedMisconception()(
                misconception.getId(), misconceptionSkillId);
              _getTaggedMisconceptionName(
                misconceptionSkillId + '-' + misconception.getId());
            }, function() {
              // Note to developers:
              // This callback is triggered when the Cancel button is clicked.
              // No further action is needed.
            });
          };

          ctrl.getAnswerChoices = function() {
            return ResponsesService.getAnswerChoices();
          };

          ctrl.getCurrentInteractionId = function() {
            return StateInteractionIdService.savedMemento;
          };

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
              case 'ListOfSetsOfHtmlStrings':
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

          ctrl.addNewRule = function() {
            // Build an initial blank set of inputs for the initial rule.
            var interactionId = ctrl.getCurrentInteractionId();
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
            ctrl.rulesMemento = angular.copy(ctrl.rules);

            // TODO(bhenning): Should use functionality in ruleEditor.js, but
            // move it to ResponsesService in StateResponses.js to properly
            // form a new rule.
            ctrl.rules.push(RuleObjectFactory.createNew(ruleType, inputs));
            ctrl.changeActiveRuleIndex(ctrl.rules.length - 1);
          };

          ctrl.deleteRule = function(index) {
            ctrl.rules.splice(index, 1);
            ctrl.saveRules();

            if (ctrl.rules.length === 0) {
              AlertsService.addWarning(
                'All answer groups must have at least one rule.');
            }
          };

          ctrl.cancelActiveRuleEdit = function() {
            ctrl.rules.splice(0, ctrl.rules.length);
            for (var i = 0; i < ctrl.rulesMemento.length; i++) {
              ctrl.rules.push(ctrl.rulesMemento[i]);
            }
            ctrl.saveRules();
          };

          ctrl.saveRules = function() {
            ctrl.changeActiveRuleIndex(-1);
            ctrl.rulesMemento = null;
            ctrl.getOnSaveAnswerGroupRulesFn()(ctrl.rules);
          };

          ctrl.changeActiveRuleIndex = function(newIndex) {
            ResponsesService.changeActiveRuleIndex(newIndex);
            ctrl.activeRuleIndex = ResponsesService.getActiveRuleIndex();
          };

          ctrl.openRuleEditor = function(index) {
            if (!ctrl.isEditable) {
              // The rule editor may not be opened in a read-only editor view.
              return;
            }
            ctrl.rulesMemento = angular.copy(ctrl.rules);
            ctrl.changeActiveRuleIndex(index);
          };

          ctrl.isRuleEditorOpen = function() {
            return ctrl.activeRuleIndex !== -1;
          };

          ctrl.isCurrentInteractionTrainable = function() {
            var interactionId = ctrl.getCurrentInteractionId();
            try {
              return INTERACTION_SPECS[interactionId].is_trainable;
            } catch (e) {
              var additionalInfo = (
                '\nUndefined interaction spec error debug logs:' +
                '\nInteraction ID: ' + interactionId +
                '\nExploration ID: ' + ContextService.getExplorationId() +
                '\nState Name: ' + StateEditorService.getActiveStateName()
              );
              e.message += additionalInfo;
              throw e;
            }
          };

          ctrl.openTrainingDataEditor = function() {
            TrainingDataEditorPanelService.openTrainingDataEditor();
          };

          ctrl.isMLEnabled = function() {
            return ENABLE_ML_CLASSIFIERS;
          };

          ctrl.$onInit = function() {
            // Updates answer choices when the interaction requires it -- e.g.,
            // the rules for multiple choice need to refer to the multiple
            // choice interaction's customization arguments.
            // TODO(sll): Remove the need for this watcher, or make it less
            // ad hoc.
            $scope.$on('updateAnswerChoices', function() {
              ctrl.answerChoices = ctrl.getAnswerChoices();
            });
            $scope.$on('externalSave', function() {
              if (ctrl.isRuleEditorOpen()) {
                ctrl.saveRules();
              }
            });
            $scope.$on('onInteractionIdChanged', function() {
              if (ctrl.isRuleEditorOpen()) {
                ctrl.saveRules();
              }
              $scope.$broadcast('updateAnswerGroupInteractionId');
              ctrl.answerChoices = ctrl.getAnswerChoices();
            });
            ctrl.rulesMemento = null;
            ctrl.activeRuleIndex = ResponsesService.getActiveRuleIndex();
            ctrl.editAnswerGroupForm = {};
            ctrl.misconceptionName = null;
            ctrl.misconceptionsBySkill =
              StateEditorService.getMisconceptionsBySkill();
            ctrl.answerChoices = ctrl.getAnswerChoices();

            _getTaggedMisconceptionName(ctrl.getTaggedSkillMisconceptionId());
          };
        }
      ]
    };
  }]);
