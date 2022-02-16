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
  'components/state-directives/outcome-editor/outcome-editor.component.ts');
require('components/state-directives/rule-editor/rule-editor.component.ts');
require(
  'components/question-directives/question-misconception-editor/' +
  'question-misconception-editor.component.ts');
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
  'state-interaction-id.service');
require(
  'components/state-editor/state-editor-properties-services/' +
  'state-property.service.ts');
require('services/alerts.service.ts');
require('services/external-save.service.ts');

import isEqual from 'lodash/isEqual';

import { Subscription } from 'rxjs';

angular.module('oppia').component('answerGroupEditor', {
  bindings: {
    addState: '=',
    displayFeedback: '=',
    getOnSaveAnswerGroupDestFn: '&onSaveAnswerGroupDest',
    getOnSaveAnswerGroupRulesFn: '&onSaveAnswerGroupRules',
    getOnSaveAnswerGroupCorrectnessLabelFn: (
      '&onSaveAnswerGroupCorrectnessLabel'),
    getOnSaveNextContentIdIndex: '&onSaveNextContentIdIndex',
    taggedSkillMisconceptionId: '=',
    isEditable: '=',
    getOnSaveAnswerGroupFeedbackFn: '&onSaveAnswerGroupFeedback',
    onSaveTaggedMisconception: '=',
    outcome: '=',
    rules: '=',
    showMarkAllAudioAsNeedingUpdateModalIfRequired: '=',
    suppressWarnings: '&'
  },
  template: require('./answer-group-editor.component.html'),
  controller: [
    'AlertsService', 'ExternalSaveService', 'ResponsesService',
    'RuleObjectFactory', 'StateEditorService', 'StateInteractionIdService',
    'StateNextContentIdIndexService',
    'TrainingDataEditorPanelService', 'ENABLE_ML_CLASSIFIERS',
    'INTERACTION_SPECS',
    function(
        AlertsService, ExternalSaveService, ResponsesService,
        RuleObjectFactory, StateEditorService, StateInteractionIdService,
        StateNextContentIdIndexService,
        TrainingDataEditorPanelService, ENABLE_ML_CLASSIFIERS,
        INTERACTION_SPECS) {
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

      ctrl.getDefaultInputValue = function(varType) {
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
          case 'PositiveInt':
            return 1;
          case 'CodeString':
          case 'UnicodeString':
          case 'NormalizedString':
          case 'MathExpressionContent':
          case 'Html':
          case 'SanitizedUrl':
          case 'Filepath':
            return '';
          case 'CodeEvaluation':
            return {
              code: ctrl.getDefaultInputValue('UnicodeString'),
              error: ctrl.getDefaultInputValue('UnicodeString'),
              evaluation: ctrl.getDefaultInputValue('UnicodeString'),
              output: ctrl.getDefaultInputValue('UnicodeString')
            };
          case 'CoordTwoDim':
            return [
              ctrl.getDefaultInputValue('Real'),
              ctrl.getDefaultInputValue('Real')];
          case 'ListOfUnicodeString':
          case 'SetOfAlgebraicIdentifier':
          case 'SetOfUnicodeString':
          case 'SetOfNormalizedString':
          case 'MusicPhrase':
            return [];
          case 'CheckedProof':
            return {
              assumptions_string: ctrl.getDefaultInputValue('UnicodeString'),
              correct: ctrl.getDefaultInputValue('Boolean'),
              proof_string: ctrl.getDefaultInputValue('UnicodeString'),
              target_string: ctrl.getDefaultInputValue('UnicodeString')
            };
          case 'Graph':
            return {
              edges: [],
              isDirected: ctrl.getDefaultInputValue('Boolean'),
              isLabeled: ctrl.getDefaultInputValue('Boolean'),
              isWeighted: ctrl.getDefaultInputValue('Boolean'),
              vertices: []
            };
          case 'NormalizedRectangle2D':
            return [
              [
                ctrl.getDefaultInputValue('Real'),
                ctrl.getDefaultInputValue('Real')
              ],
              [
                ctrl.getDefaultInputValue('Real'),
                ctrl.getDefaultInputValue('Real')
              ]];
          case 'ImageRegion':
            return {
              area: ctrl.getDefaultInputValue('NormalizedRectangle2D'),
              regionType: ctrl.getDefaultInputValue('UnicodeString')
            };
          case 'ImageWithRegions':
            return {
              imagePath: ctrl.getDefaultInputValue('Filepath'),
              labeledRegions: []
            };
          case 'ClickOnImage':
            return {
              clickPosition: [
                ctrl.getDefaultInputValue('Real'),
                ctrl.getDefaultInputValue('Real')
              ],
              clickedRegions: []
            };
          case 'TranslatableSetOfNormalizedString':
            return {
              contentId: null,
              normalizedStrSet:
                ctrl.getDefaultInputValue('SetOfNormalizedString')
            };
          case 'TranslatableSetOfUnicodeString':
            return {
              contentId: null,
              normalizedStrSet:
                ctrl.getDefaultInputValue('SetOfUnicodeString')
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
        const inputTypes = {};
        while (description.match(PATTERN)) {
          var varName = description.match(PATTERN)[1];
          var varType = description.match(PATTERN)[2];
          if (varType) {
            varType = varType.substring(1);
          }

          inputTypes[varName] = varType;
          inputs[varName] = ctrl.getDefaultInputValue(varType);
          description = description.replace(PATTERN, ' ');
        }

        // Save the state of the rules before adding a new one (in case the
        // user cancels the addition).
        ctrl.rulesMemento = angular.copy(ctrl.rules);

        // TODO(bhenning): Should use functionality in ruleEditor.js, but
        // move it to ResponsesService in StateResponses.js to properly
        // form a new rule.
        const rule = RuleObjectFactory.createNew(
          ruleType, inputs, inputTypes);
        ctrl.rules.push(rule);
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
        if (ctrl.originalContentIdToContent !== undefined) {
          const updatedContentIdToContent = (
            getTranslatableRulesContentIdToContentMap()
          );
          const contentIdsWithModifiedContent = [];
          Object.keys(
            ctrl.originalContentIdToContent
          ).forEach(contentId => {
            if (
              ctrl.originalContentIdToContent.hasOwnProperty(contentId) &&
              updatedContentIdToContent.hasOwnProperty(contentId) &&
              !isEqual(
                ctrl.originalContentIdToContent[contentId],
                updatedContentIdToContent[contentId]
              )
            ) {
              contentIdsWithModifiedContent.push(contentId);
            }
          });
          ctrl.showMarkAllAudioAsNeedingUpdateModalIfRequired(
            contentIdsWithModifiedContent);
        }

        ctrl.changeActiveRuleIndex(-1);
        ctrl.rulesMemento = null;
        ctrl.getOnSaveAnswerGroupRulesFn()(ctrl.rules);
        StateNextContentIdIndexService.saveDisplayedValue();
        ctrl.getOnSaveNextContentIdIndex()(
          StateNextContentIdIndexService.displayed);
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
        ctrl.originalContentIdToContent = (
          getTranslatableRulesContentIdToContentMap()
        );
        ctrl.rulesMemento = angular.copy(ctrl.rules);
        ctrl.changeActiveRuleIndex(index);
      };

      ctrl.isRuleEditorOpen = function() {
        return ctrl.activeRuleIndex !== -1;
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

      /**
      * Extracts a mapping of content ids of translatable rules to the html
      * or unicode content found in the rule inputs.
      * @returns {Object} A Mapping of content ids (string) to content
      *   (string).
      */
      const getTranslatableRulesContentIdToContentMap = function() {
        const contentIdToContentMap = {};
        ctrl.rules.forEach(rule => {
          Object.keys(rule.inputs).forEach(ruleName => {
            const ruleInput = rule.inputs[ruleName];
            // All rules input types which are translatable are subclasses of
            // BaseTranslatableObject having dict structure with contentId
            // as a key.
            if (ruleInput && ruleInput.hasOwnProperty('contentId')) {
              contentIdToContentMap[ruleInput.contentId] = ruleInput;
            }
          });
        });
        return contentIdToContentMap;
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
              if (StateEditorService.checkCurrentRuleInputIsValid()) {
                ctrl.saveRules();
              } else {
                var messageContent = (
                  'There was an unsaved rule input which was invalid and ' +
                  'has been discarded.');
                if (!AlertsService.messages.some(messageObject => (
                  messageObject.content === messageContent))) {
                  AlertsService.addInfoMessage(messageContent);
                }
              }
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
              ctrl.answerChoices = ctrl.getAnswerChoices();
            }
          )
        );
        ctrl.rulesMemento = null;
        ctrl.activeRuleIndex = ResponsesService.getActiveRuleIndex();
        ctrl.editAnswerGroupForm = {};
        ctrl.answerChoices = ctrl.getAnswerChoices();
      };
      ctrl.$onDestroy = function() {
        ctrl.directiveSubscriptions.unsubscribe();
      };
    }
  ]
});
