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
require(
  'components/question-directives/question-misconception-editor/' +
  'question-misconception-editor.component.ts');
require('directives/angular-html-bind.directive.ts');
require('filters/parameterize-rule-description.filter.ts');
require(
  'components/question-directives/question-misconception-editor/' +
  'tag-misconception-modal.controller.ts');

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
require('services/external-save.service.ts');

import { Subscription } from 'rxjs';
import { SubtitledVariableLengthListOfRuleInputs } from
  'domain/exploration/SubtitledVariableLengthListOfRuleInputsObjectFactory';
import { AnswerGroup } from 'domain/exploration/AnswerGroupObjectFactory';
import { Rule } from 'domain/exploration/RuleObjectFactory';
import { cloneDeep } from 'lodash';

const RULE_TEMPLATES = require('interactions/rule_templates.json');

angular.module('oppia').directive('answerGroupEditor', [
  'UrlInterpolationService', function(UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {},
      bindToController: {
        addState: '=',
        displayFeedback: '=',
        getOnSaveAnswerGroupDestFn: '&onSaveAnswerGroupDest',
        getOnSaveAnswerGroupRuleTypesToSubtitledInputsFn:
          '&onSaveAnswerGroupRuleTypesToSubtitledInputs',
        getOnSaveAnswerGroupCorrectnessLabelFn: (
          '&onSaveAnswerGroupCorrectnessLabel'),
        taggedSkillMisconceptionId: '=',
        isEditable: '=',
        getOnSaveAnswerGroupFeedbackFn: '&onSaveAnswerGroupFeedback',
        onSaveTaggedMisconception: '=',
        onSaveNextContentIdIndex: '=',
        outcome: '=',
        ruleTypesToSubtitledInputs: '=',
        showMarkAllAudioAsNeedingUpdateModalIfRequired: '=',
        suppressWarnings: '&'
      },
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/components/state-directives/answer-group-editor/' +
        'answer-group-editor.directive.html'),
      controllerAs: '$ctrl',
      controller: [
        '$scope', '$rootScope', '$uibModal', 'StateInteractionIdService',
        'AlertsService', 'COMPONENT_NAME_INTERACTION_RULE_INPUTS',
        'ContextService', 'ExternalSaveService',
        'GenerateContentIdService',
        'INTERACTION_SPECS', 'StateEditorService',
        'StateNextContentIdIndexService', 'RuleObjectFactory',
        'TrainingDataEditorPanelService', 'ENABLE_ML_CLASSIFIERS',
        'ResponsesService',
        function(
            $scope, $rootScope, $uibModal, StateInteractionIdService,
            AlertsService, COMPONENT_NAME_INTERACTION_RULE_INPUTS,
            ContextService, ExternalSaveService,
            GenerateContentIdService,
            INTERACTION_SPECS, StateEditorService,
            StateNextContentIdIndexService, RuleObjectFactory,
            TrainingDataEditorPanelService, ENABLE_ML_CLASSIFIERS,
            ResponsesService) {
          var ctrl = this;
          ctrl.directiveSubscriptions = new Subscription();

          ctrl.isInQuestionMode = function() {
            return StateEditorService.isInQuestionMode();
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
              case 'MathExpressionContent':
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
              case 'SetOfAlgebraicIdentifier':
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
            ctrl.ruleTypesToSubtitledInputsMemento = cloneDeep(
              ctrl.ruleTypesToSubtitledInputs);

            // TODO(bhenning): Should use functionality in ruleEditor.js, but
            // move it to ResponsesService in StateResponses.js to properly
            // form a new rule.

            // Set the rule type to 'tempRule' until the rule is saved and
            // we know its rule type for sure.
            this.ruleTypesToSubtitledInputs.tempRule = (
              new SubtitledVariableLengthListOfRuleInputs([inputs], null));
            ctrl.changeActiveRuleType('tempRule');
            ctrl.changeActiveRuleInputIndex(0);

            ctrl.activeRule = new Rule(ruleType, inputs);
          };

          ctrl.deleteRule = function(ruleType, ruleInputIndex) {
            ctrl.ruleTypesToSubtitledInputs[ruleType].ruleInputs.splice(
              ruleInputIndex, 1);
            if (ctrl.ruleTypesToSubtitledInputs[ruleType].ruleInputs.length === 0) {
              delete ctrl.ruleTypesToSubtitledInputs[ruleType];
            }
            ctrl.activeRule = null;
            ctrl.saveRules();
          };

          ctrl.cancelActiveRuleEdit = function() {
            ctrl.ruleTypesToSubtitledInputs = angular.copy(
              ctrl.ruleTypesToSubtitledInputsMemento);
            ctrl.activeRule = null;
            ctrl.saveRules();
          };

          ctrl.saveRules = function() {
            ctrl.changeActiveRuleType(null);
            ctrl.changeActiveRuleInputIndex(-1);
            ctrl.activeRule = null;
            ctrl.ruleTypesToSubtitledInputsMemento = null;

            ctrl.getOnSaveAnswerGroupRuleTypesToSubtitledInputsFn()(
              ctrl.ruleTypesToSubtitledInputs);
          };

          ctrl.saveActiveRule = function() {
            delete ctrl.ruleTypesToSubtitledInputs.tempRule;
            const ruleType = ctrl.activeRule.type;
            const ruleInputs = ctrl.activeRule.inputs;

            if (!ctrl.ruleTypesToSubtitledInputs.hasOwnProperty(ruleType)) {
              this.ruleTypesToSubtitledInputs[ruleType] = (
                new SubtitledVariableLengthListOfRuleInputs([], null));

              const interactionId = ctrl.getCurrentInteractionId();
              const ruleIsTranslatable = RULE_TEMPLATES[interactionId][
                ruleType].translatable;
              if (ruleIsTranslatable) {
                // Assign a content_id.
                ctrl.ruleTypesToSubtitledInputs[ruleType].contentId = (
                  GenerateContentIdService.getNextStateId(
                    COMPONENT_NAME_INTERACTION_RULE_INPUTS)
                );
                StateNextContentIdIndexService.saveDisplayedValue();
                ctrl.onSaveNextContentIdIndex(
                  StateNextContentIdIndexService.displayed);
              }
            }
            ctrl.ruleTypesToSubtitledInputs[ruleType].ruleInputs.push(ruleInputs);
            ctrl.saveRules();
          };

          ctrl.changeActiveRuleType = function(newRuleType) {
            ResponsesService.changeActiveRuleType(newRuleType);
            ctrl.activeRuleType = newRuleType;
          };

          ctrl.changeActiveRuleInputIndex = function(newIndex) {
            ResponsesService.changeActiveRuleInputIndex(newIndex);
            ctrl.activeRuleInputIndex = newIndex;
          };

          ctrl.openRuleEditor = function(ruleType, ruleInputIndex, ruleInput) {
            if (!ctrl.isEditable) {
              // The rule editor may not be opened in a read-only editor view.
              return;
            }
            ctrl.ruleTypesToSubtitledInputsMemento = cloneDeep(
              ctrl.ruleTypesToSubtitledInputs);
            ctrl.changeActiveRuleType(ruleType);
            ctrl.changeActiveRuleInputIndex(ruleInputIndex);
            ctrl.activeRule = new Rule(ruleType, ruleInput);
          };

          ctrl.isRuleEditorOpen = function() {
            return ctrl.activeDisplayedRuleIndex !== -1;
          };

          ctrl.isCurrentInteractionTrainable = function() {
            var interactionId = ctrl.getCurrentInteractionId();
            if (!INTERACTION_SPECS.hasOwnProperty(interactionId)) {
              throw new Error('Invalid interaction id');
            }
            return INTERACTION_SPECS[interactionId].is_trainable;
          };

          ctrl.openTrainingDataEditor = function() {
            TrainingDataEditorPanelService.openTrainingDataEditor();
          };

          ctrl.isMLEnabled = function() {
            return ENABLE_ML_CLASSIFIERS;
          };

          ctrl.constructRule = function(ruleType, ruleInput) {
            return new Rule(ruleType, ruleInput);
          };

          ctrl.getRuleTypes = function() {
            return AnswerGroup.getRuleTypesInDisplayOrder(
              ctrl.ruleTypesToSubtitledInputs);
          };

          ctrl.hasMultipleRules = function() {
            return Object.values(ctrl.ruleTypesToSubtitledInputs).map(
              (subtitledRuleInputs: SubtitledVariableLengthListOfRuleInputs) =>
                subtitledRuleInputs.ruleInputs.length
            ).reduce((a, b) => a + b) > 1;
          };

          ctrl.$onInit = function() {
            // Updates answer choices when the interaction requires it -- e.g.,
            // the rules for multiple choice need to refer to the multiple
            // choice interaction's customization arguments.
            // TODO(sll): Remove the need for this watcher, or make it less
            // ad hoc.
            ctrl.directiveSubscriptions.add(
              ExternalSaveService.onExternalSave.subscribe(() => {
                if (ctrl.isRuleEditorOpen()) {
                  ctrl.saveRules();
                }
              })
            );
            ctrl.directiveSubscriptions.add(
              StateEditorService.onUpdateAnswerChoices.subscribe(() => {
                ctrl.answerChoices = ctrl.getAnswerChoices();
              })
            );
            ctrl.directiveSubscriptions.add(
              StateInteractionIdService.onInteractionIdChanged.subscribe(
                () => {
                  if (ctrl.isRuleEditorOpen()) {
                    ctrl.saveRules();
                  }
                  $scope.$broadcast('updateAnswerGroupInteractionId');
                  ctrl.answerChoices = ctrl.getAnswerChoices();
                }
              )
            );

            ctrl.activeRuleType = ResponsesService.getActiveRuleType();
            ctrl.activeRuleInputIndex = (
              ResponsesService.getActiveRuleInputIndex());
            ctrl.activeRule = null;

            ctrl.editAnswerGroupForm = {};
            ctrl.answerChoices = ctrl.getAnswerChoices();
          };
          ctrl.$onDestroy = function() {
            ctrl.directiveSubscriptions.unsubscribe();
          };
        }
      ]
    };
  }]);
