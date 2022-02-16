// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Component containing the exploration material to be translated.
 */

require(
  'components/state-directives/response-header/response-header.component.ts');
require(
  'pages/exploration-editor-page/translation-tab/audio-translation-bar/' +
  'audio-translation-bar.directive.ts');
require(
  'pages/exploration-editor-page/translation-tab/state-translation-editor/' +
  'state-translation-editor.component.ts'
);

require('components/ck-editor-helpers/ck-editor-copy-content.service.ts');
require('domain/utilities/url-interpolation.service.ts');
require('filters/format-rte-preview.filter.ts');
require('filters/string-utility-filters/convert-to-plain-text.filter.ts');
require('filters/parameterize-rule-description.filter.ts');
require('filters/string-utility-filters/truncate.filter.ts');
require('filters/string-utility-filters/wrap-text-with-ellipsis.filter.ts');
require(
  'pages/exploration-editor-page/services/' +
  'exploration-correctness-feedback.service.ts');
require(
  'pages/exploration-editor-page/services/' +
  'exploration-init-state-name.service.ts');
require('pages/exploration-editor-page/services/exploration-states.service.ts');
require('pages/exploration-editor-page/services/router.service.ts');
require(
  'pages/exploration-editor-page/translation-tab/services/' +
  'translation-status.service.ts');
require(
  'pages/exploration-editor-page/translation-tab/services/' +
  'translation-tab-active-content-id.service.ts');
require(
  'components/state-editor/state-editor-properties-services/' +
  'state-editor.service.ts');
require('services/exploration-html-formatter.service.ts');

require(
  'pages/exploration-editor-page/exploration-editor-page.constants.ajs.ts');

import { Subscription } from 'rxjs';

import { SubtitledHtml } from 'domain/exploration/subtitled-html.model';
import { SubtitledUnicode } from
  'domain/exploration/SubtitledUnicodeObjectFactory';
import {
  TRANSLATION_DATA_FORMAT_HTML,
  TRANSLATION_DATA_FORMAT_UNICODE,
  TRANSLATION_DATA_FORMAT_SET_OF_NORMALIZED_STRING,
  TRANSLATION_DATA_FORMAT_SET_OF_UNICODE_STRING
} from 'domain/exploration/WrittenTranslationObjectFactory';
import { InteractionCustomizationArgs } from
  'interactions/customization-args-defs';
import { Rule } from 'domain/exploration/RuleObjectFactory';

angular.module('oppia').component('stateTranslation', {
  bindings: {
    isTranslationTabBusy: '='
  },
  template: require('./state-translation.component.html'),
  controller: [
    '$filter', '$scope', 'CkEditorCopyContentService',
    'ExplorationCorrectnessFeedbackService',
    'ExplorationHtmlFormatterService', 'ExplorationLanguageCodeService',
    'ExplorationStatesService', 'RouterService', 'StateEditorService',
    'TranslationLanguageService', 'TranslationStatusService',
    'TranslationTabActiveContentIdService',
    'TranslationTabActiveModeService', 'COMPONENT_NAME_CONTENT',
    'COMPONENT_NAME_FEEDBACK', 'COMPONENT_NAME_HINT',
    'COMPONENT_NAME_INTERACTION_CUSTOMIZATION_ARGS',
    'COMPONENT_NAME_RULE_INPUT',
    'COMPONENT_NAME_SOLUTION', 'INTERACTION_SPECS',
    'RULE_SUMMARY_WRAP_CHARACTER_COUNT',
    function(
        $filter, $scope, CkEditorCopyContentService,
        ExplorationCorrectnessFeedbackService,
        ExplorationHtmlFormatterService, ExplorationLanguageCodeService,
        ExplorationStatesService, RouterService, StateEditorService,
        TranslationLanguageService, TranslationStatusService,
        TranslationTabActiveContentIdService,
        TranslationTabActiveModeService, COMPONENT_NAME_CONTENT,
        COMPONENT_NAME_FEEDBACK, COMPONENT_NAME_HINT,
        COMPONENT_NAME_INTERACTION_CUSTOMIZATION_ARGS,
        COMPONENT_NAME_RULE_INPUT,
        COMPONENT_NAME_SOLUTION, INTERACTION_SPECS,
        RULE_SUMMARY_WRAP_CHARACTER_COUNT
    ) {
      // A map from translatable rule input types to their corresponding data
      // formats.
      var RULE_INPUT_TYPES_TO_DATA_FORMATS = {
        TranslatableSetOfNormalizedString: (
          TRANSLATION_DATA_FORMAT_SET_OF_NORMALIZED_STRING),
        TranslatableSetOfUnicodeString: (
          TRANSLATION_DATA_FORMAT_SET_OF_UNICODE_STRING),
      };

      var ctrl = this;
      ctrl.directiveSubscriptions = new Subscription();
      $scope.isVoiceoverModeActive = function() {
        return (TranslationTabActiveModeService.isVoiceoverModeActive());
      };
      var isTranslatedTextRequired = function() {
        return (
          TranslationTabActiveModeService.isVoiceoverModeActive() &&
          TranslationLanguageService.getActiveLanguageCode() !== (
            ExplorationLanguageCodeService.displayed));
      };
      $scope.getRequiredHtml = function(subtitledHtml) {
        var html = null;
        if (isTranslatedTextRequired()) {
          var contentId = subtitledHtml.contentId;
          var activeLanguageCode = (
            TranslationLanguageService.getActiveLanguageCode());
          var writtenTranslations = (
            ExplorationStatesService.getWrittenTranslationsMemento(
              $scope.stateName));
          if (writtenTranslations.hasWrittenTranslation(
            contentId, activeLanguageCode)) {
            var writtenTranslation = (
              writtenTranslations.getWrittenTranslation(
                contentId, activeLanguageCode));
            html = writtenTranslation.getTranslation();
          }
        } else {
          html = subtitledHtml.html;
        }
        return html;
      };

      $scope.getEmptyContentMessage = function() {
        if (TranslationTabActiveModeService.isVoiceoverModeActive()) {
          return (
            'The translation for this section has not been created yet. ' +
            'Switch to translation mode to add a text translation.');
        } else {
          return 'There is no text available to translate.';
        }
      };

      $scope.isActive = function(tabId) {
        return ($scope.activatedTabId === tabId);
      };

      $scope.navigateToState = function(stateName) {
        RouterService.navigateToMainTab(stateName);
      };

      $scope.onContentClick = function($event) {
        if ($scope.isCopyModeActive()) {
          $event.stopPropagation();
        }
        CkEditorCopyContentService.broadcastCopy($event.target);
      };

      $scope.isCopyModeActive = function() {
        return CkEditorCopyContentService.copyModeActive;
      };

      $scope.onTabClick = function(tabId) {
        if (ctrl.isTranslationTabBusy) {
          StateEditorService.onShowTranslationTabBusyModal.emit();
          return;
        }
        let activeContentId = null;
        let activeDataFormat = TRANSLATION_DATA_FORMAT_HTML;

        if (tabId === $scope.TAB_ID_CONTENT) {
          activeContentId = $scope.stateContent.contentId;
        } else if (tabId === $scope.TAB_ID_FEEDBACK) {
          $scope.activeAnswerGroupIndex = 0;
          if ($scope.stateAnswerGroups.length > 0) {
            activeContentId = (
              $scope.stateAnswerGroups[0].outcome.feedback.contentId);
          } else {
            activeContentId = (
              $scope.stateDefaultOutcome.feedback.contentId);
          }
        } else if (tabId === $scope.TAB_ID_HINTS) {
          $scope.activeHintIndex = 0;
          activeContentId = (
            $scope.stateHints[0].hintContent.contentId);
        } else if (tabId === $scope.TAB_ID_SOLUTION) {
          activeContentId = $scope.stateSolution.explanation.contentId;
        } else if (tabId === $scope.TAB_ID_CUSTOMIZATION_ARGS) {
          $scope.activeCustomizationArgContentIndex = 0;
          const activeContent = (
            $scope.interactionCustomizationArgTranslatableContent[0].content
          );
          activeContentId = activeContent.contentId;
          if (activeContent instanceof SubtitledUnicode) {
            activeDataFormat = TRANSLATION_DATA_FORMAT_UNICODE;
          }
        } else if (tabId === $scope.TAB_ID_RULE_INPUTS) {
          if ($scope.interactionRuleTranslatableContents.length === 0) {
            throw new Error(
              'Accessed rule input translation tab when there are no rules');
          }

          // Note that only 'TextInput' and 'SetInput' have translatable rule
          // types. The rules tab is disabled for other interactions.
          const {
            rule, inputName, contentId
          } = $scope.interactionRuleTranslatableContents[0];
          activeContentId = contentId;
          const inputType = rule.inputTypes[inputName];
          activeDataFormat = RULE_INPUT_TYPES_TO_DATA_FORMATS[inputType];
          $scope.activeRuleContentIndex = 0;
        }
        TranslationTabActiveContentIdService.setActiveContent(
          activeContentId, activeDataFormat);
        $scope.activatedTabId = tabId;
      };

      $scope.getHumanReadableRuleInputValues = function(inputValue, inputType) {
        if (inputType === 'TranslatableSetOfNormalizedString') {
          return ('[' + inputValue.normalizedStrSet.join(', ') + ']');
        } else if (inputType === 'TranslatableSetOfUnicodeString') {
          return ('[' + inputValue.unicodeStrSet.join(', ') + ']');
        } else {
          throw new Error(`The ${inputType} type is not implemented.`);
        }
      };

      $scope.summarizeDefaultOutcome = function(
          defaultOutcome, interactionId, answerGroupCount, shortenRule) {
        if (!defaultOutcome) {
          return '';
        }

        var summary = '';
        var hasFeedback = defaultOutcome.hasNonemptyFeedback();

        if (interactionId && INTERACTION_SPECS[interactionId].is_linear) {
          summary =
            INTERACTION_SPECS[interactionId].default_outcome_heading;
        } else if (answerGroupCount > 0) {
          summary = 'All other answers';
        } else {
          summary = 'All answers';
        }

        if (hasFeedback && shortenRule) {
          summary = $filter('wrapTextWithEllipsis')(
            summary, RULE_SUMMARY_WRAP_CHARACTER_COUNT);
        }
        summary = '[' + summary + '] ';

        if (hasFeedback) {
          summary +=
            $filter(
              'convertToPlainText'
            )(defaultOutcome.feedback.html);
        }
        return summary;
      };

      $scope.summarizeAnswerGroup = function(
          answerGroup, interactionId, answerChoices, shortenRule) {
        var summary = '';
        var outcome = answerGroup.outcome;
        var hasFeedback = outcome.hasNonemptyFeedback();

        if (answerGroup.rules) {
          var firstRule = $filter('convertToPlainText')(
            $filter('parameterizeRuleDescription')(
              answerGroup.rules[0], interactionId, answerChoices));
          summary = 'Answer ' + firstRule;

          if (hasFeedback && shortenRule) {
            summary = $filter('wrapTextWithEllipsis')(
              summary, RULE_SUMMARY_WRAP_CHARACTER_COUNT);
          }
          summary = '[' + summary + '] ';
        }

        if (hasFeedback) {
          summary += (
            shortenRule ?
              $filter('truncate')(outcome.feedback.html, 30) :
              $filter('convertToPlainText')(outcome.feedback.html));
        }
        return summary;
      };

      $scope.isDisabled = function(tabId) {
        if (tabId === $scope.TAB_ID_CONTENT) {
          return false;
        }
        // This is used to prevent users from adding unwanted audio for
        // default_outcome and hints in Continue and EndExploration
        // interaction. An exception is if the interaction contains
        // translatable customization arguments -- e.g. Continue
        // interaction's placeholder.
        if (
          tabId !== $scope.TAB_ID_CUSTOMIZATION_ARGS && (
            !$scope.stateInteractionId ||
            INTERACTION_SPECS[$scope.stateInteractionId].is_linear ||
            INTERACTION_SPECS[$scope.stateInteractionId].is_terminal
          )
        ) {
          return true;
        } else if (tabId === $scope.TAB_ID_FEEDBACK) {
          if (!$scope.stateDefaultOutcome) {
            return true;
          } else {
            return false;
          }
        } else if (tabId === $scope.TAB_ID_HINTS) {
          if ($scope.stateHints.length <= 0) {
            return true;
          } else {
            return false;
          }
        } else if (tabId === $scope.TAB_ID_SOLUTION) {
          if (!$scope.stateSolution) {
            return true;
          } else {
            return false;
          }
        } else if (tabId === $scope.TAB_ID_CUSTOMIZATION_ARGS) {
          return (
            $scope.interactionCustomizationArgTranslatableContent.length === 0);
        } else if (tabId === $scope.TAB_ID_RULE_INPUTS) {
          return $scope.interactionRuleTranslatableContents.length === 0;
        }
      };

      $scope.changeActiveHintIndex = function(newIndex) {
        if (ctrl.isTranslationTabBusy) {
          StateEditorService.onShowTranslationTabBusyModal.emit();
          return;
        }
        if ($scope.activeHintIndex === newIndex) {
          return;
        }
        $scope.activeHintIndex = newIndex;
        var activeContentId = (
          $scope.stateHints[newIndex].hintContent.contentId);
        TranslationTabActiveContentIdService.setActiveContent(
          activeContentId, TRANSLATION_DATA_FORMAT_HTML);
      };

      $scope.changeActiveRuleContentIndex = function(newIndex) {
        if (ctrl.isTranslationTabBusy) {
          StateEditorService.onShowTranslationTabBusyModal.emit();
          return;
        }
        if ($scope.activeRuleContentIndex === newIndex) {
          return;
        }
        const {
          rule, inputName, contentId
        } = $scope.interactionRuleTranslatableContents[newIndex];
        const activeContentId = contentId;
        const inputType = rule.inputTypes[inputName];
        const activeDataFormat = RULE_INPUT_TYPES_TO_DATA_FORMATS[inputType];
        TranslationTabActiveContentIdService.setActiveContent(
          activeContentId, activeDataFormat);
        $scope.activeRuleContentIndex = newIndex;
      };

      $scope.changeActiveCustomizationArgContentIndex = function(newIndex) {
        if (ctrl.isTranslationTabBusy) {
          StateEditorService.onShowTranslationTabBusyModal.emit();
          return;
        }
        if ($scope.activeCustomizationArgContentIndex === newIndex) {
          return;
        }
        const activeContent = (
          $scope.interactionCustomizationArgTranslatableContent[
            newIndex].content
        );
        const activeContentId = activeContent.contentId;
        let activeDataFormat = null;
        if (activeContent instanceof SubtitledUnicode) {
          activeDataFormat = TRANSLATION_DATA_FORMAT_UNICODE;
        } else if (activeContent instanceof SubtitledHtml) {
          activeDataFormat = TRANSLATION_DATA_FORMAT_HTML;
        }
        TranslationTabActiveContentIdService.setActiveContent(
          activeContentId, activeDataFormat);
        $scope.activeCustomizationArgContentIndex = newIndex;
      };

      $scope.changeActiveAnswerGroupIndex = function(newIndex) {
        if (ctrl.isTranslationTabBusy) {
          StateEditorService.onShowTranslationTabBusyModal.emit();
          return;
        }
        if ($scope.activeAnswerGroupIndex !== newIndex) {
          var activeContentId = null;
          $scope.activeAnswerGroupIndex = newIndex;
          if (newIndex === $scope.stateAnswerGroups.length) {
            activeContentId = (
              $scope.stateDefaultOutcome.feedback.contentId);
          } else {
            activeContentId = (
              $scope.stateAnswerGroups[newIndex]
                .outcome.feedback.contentId);
          }
          TranslationTabActiveContentIdService.setActiveContent(
            activeContentId, TRANSLATION_DATA_FORMAT_HTML);
        }
      };

      $scope.tabStatusColorStyle = function(tabId) {
        if (!$scope.isDisabled(tabId)) {
          var color = TranslationStatusService
            .getActiveStateComponentStatusColor(tabId);
          return {'border-top-color': color};
        }
      };

      $scope.tabNeedUpdatesStatus = function(tabId) {
        if (!$scope.isDisabled(tabId)) {
          return TranslationStatusService
            .getActiveStateComponentNeedsUpdateStatus(tabId);
        }
      };
      $scope.contentIdNeedUpdates = function(contentId) {
        return TranslationStatusService
          .getActiveStateContentIdNeedsUpdateStatus(contentId);
      };
      $scope.contentIdStatusColorStyle = function(contentId) {
        var color = TranslationStatusService
          .getActiveStateContentIdStatusColor(contentId);
        return {'border-left': '3px solid ' + color};
      };

      $scope.getSubtitledContentSummary = function(subtitledContent) {
        if (subtitledContent instanceof SubtitledHtml) {
          return $filter('formatRtePreview')(subtitledContent.html);
        } else if (subtitledContent instanceof SubtitledUnicode) {
          return subtitledContent.unicode;
        }
      };

      const getInteractionRuleTranslatableContents = (): {
        rule: Rule; inputName: string; contentId: string;
      }[] => {
        const allRules = $scope.stateAnswerGroups.map(
          answerGroup => answerGroup.rules).flat();

        const interactionRuleTranslatableContent = [];
        allRules.forEach(rule => {
          Object.keys(rule.inputs).forEach(inputName => {
            if (rule.inputTypes[inputName].indexOf('Translatable') === 0) {
              const contentId = rule.inputs[inputName].contentId;
              interactionRuleTranslatableContent.push({
                rule, inputName, contentId
              });
            }
          });
        });

        return interactionRuleTranslatableContent;
      };

      $scope.getInteractionCustomizationArgTranslatableContents = function(
          customizationArgs: InteractionCustomizationArgs
      ): { name: string; content: SubtitledUnicode|SubtitledHtml }[] {
        const translatableContents = [];

        const camelCaseToSentenceCase = (s) => {
          // Lowercase the first letter (edge case for UpperCamelCase).
          s = s.charAt(0).toLowerCase() + s.slice(1);
          // Add a space in front of capital letters.
          s = s.replace(/([A-Z])/g, ' $1');
          // Captialize first letter.
          s = s.charAt(0).toUpperCase() + s.slice(1);
          return s;
        };

        const traverseValueAndRetrieveSubtitledContent = (
            name: string,
            value: Object[] | Object,
        ): void => {
          if (value instanceof SubtitledUnicode ||
              value instanceof SubtitledHtml
          ) {
            translatableContents.push({
              name, content: value
            });
          } else if (value instanceof Array) {
            value.forEach(
              (element, index) => traverseValueAndRetrieveSubtitledContent(
                `${name} (${index})`,
                element)
            );
          } else if (value instanceof Object) {
            Object.keys(value).forEach(
              key => traverseValueAndRetrieveSubtitledContent(
                `${name} > ${camelCaseToSentenceCase(key)}`,
                value[key]
              )
            );
          }
        };

        Object.keys(customizationArgs).forEach(
          caName => traverseValueAndRetrieveSubtitledContent(
            camelCaseToSentenceCase(caName),
            customizationArgs[caName].value));

        return translatableContents;
      };

      $scope.initStateTranslation = function() {
        $scope.stateName = StateEditorService.getActiveStateName();
        $scope.stateContent = ExplorationStatesService
          .getStateContentMemento($scope.stateName);
        $scope.stateSolution = ExplorationStatesService
          .getSolutionMemento($scope.stateName);
        $scope.stateHints = ExplorationStatesService
          .getHintsMemento($scope.stateName);
        $scope.stateAnswerGroups = ExplorationStatesService
          .getInteractionAnswerGroupsMemento($scope.stateName);
        $scope.stateDefaultOutcome = ExplorationStatesService
          .getInteractionDefaultOutcomeMemento($scope.stateName);
        $scope.stateInteractionId = ExplorationStatesService
          .getInteractionIdMemento($scope.stateName);
        $scope.stateInteractionCustomizationArgs = ExplorationStatesService
          .getInteractionCustomizationArgsMemento($scope.stateName);
        $scope.activeHintIndex = null;
        $scope.activeAnswerGroupIndex = null;
        var currentCustomizationArgs = ExplorationStatesService
          .getInteractionCustomizationArgsMemento($scope.stateName);
        $scope.answerChoices = StateEditorService.getAnswerChoices(
          $scope.stateInteractionId, currentCustomizationArgs);
        $scope.interactionPreviewHtml = (
          $scope.stateInteractionId ? (
            ExplorationHtmlFormatterService.getInteractionHtml(
              $scope.stateInteractionId,
              $scope.stateInteractionCustomizationArgs, false, null, null)
          ) : '');
        $scope.interactionCustomizationArgTranslatableContent = (
          $scope.getInteractionCustomizationArgTranslatableContents(
            $scope.stateInteractionCustomizationArgs)
        );
        $scope.interactionRuleTranslatableContents = (
          getInteractionRuleTranslatableContents());

        if (TranslationTabActiveModeService.isVoiceoverModeActive()) {
          $scope.needsUpdateTooltipMessage = 'Audio needs update to ' +
            'match text. Please record new audio.';
        } else {
          $scope.needsUpdateTooltipMessage = 'Translation needs update ' +
            'to match text. Please re-translate the content.';
        }
        $scope.onTabClick($scope.TAB_ID_CONTENT);
      };
      ctrl.$onInit = function() {
        // Define tab constants.
        $scope.TAB_ID_CONTENT = COMPONENT_NAME_CONTENT;
        $scope.TAB_ID_FEEDBACK = COMPONENT_NAME_FEEDBACK;
        $scope.TAB_ID_HINTS = COMPONENT_NAME_HINT;
        $scope.TAB_ID_RULE_INPUTS = COMPONENT_NAME_RULE_INPUT;
        $scope.TAB_ID_SOLUTION = COMPONENT_NAME_SOLUTION;
        $scope.TAB_ID_CUSTOMIZATION_ARGS = (
          COMPONENT_NAME_INTERACTION_CUSTOMIZATION_ARGS);

        $scope.INTERACTION_SPECS = INTERACTION_SPECS;
        $scope.ExplorationCorrectnessFeedbackService =
          ExplorationCorrectnessFeedbackService;

        // Activates Content tab by default.
        $scope.activatedTabId = $scope.TAB_ID_CONTENT;

        $scope.activeHintIndex = null;
        $scope.activeAnswerGroupIndex = null;
        $scope.activeCustomizationArgContentIndex = null;
        $scope.activeRuleContentIndex = null;
        $scope.stateContent = null;
        $scope.stateInteractionId = null;
        $scope.stateAnswerGroups = [];
        $scope.stateDefaultOutcome = null;
        $scope.stateHints = [];
        $scope.stateSolution = null;
        ctrl.directiveSubscriptions.add(
          StateEditorService.onRefreshStateTranslation.subscribe(
            () => $scope.initStateTranslation())
        );
        $scope.initStateTranslation();
      };

      ctrl.$onDestroy = function() {
        ctrl.directiveSubscriptions.unsubscribe();
      };
    }
  ]
});
