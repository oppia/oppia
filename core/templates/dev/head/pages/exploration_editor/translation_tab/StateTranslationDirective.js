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
 * @fileoverview Directive containing the exploration material to be translated.
 */

oppia.directive('stateTranslation', [
  'UrlInterpolationService', function(UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {
        isTranslationTabBusy: '='
      },
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/exploration_editor/translation_tab/' +
        'state_translation_directive.html'),
      controller: [
        '$filter', '$rootScope', '$scope',
        'ExplorationCorrectnessFeedbackService',
        'ExplorationInitStateNameService', 'ExplorationLanguageCodeService',
        'ExplorationStatesService', 'RouterService', 'StateEditorService',
        'TranslationLanguageService', 'TranslationStatusService',
        'TranslationTabActiveContentIdService',
        'TranslationTabActiveModeService', 'COMPONENT_NAME_CONTENT',
        'COMPONENT_NAME_FEEDBACK', 'COMPONENT_NAME_HINT',
        'COMPONENT_NAME_SOLUTION', 'INTERACTION_SPECS',
        'RULE_SUMMARY_WRAP_CHARACTER_COUNT',
        function(
            $filter, $rootScope, $scope,
            ExplorationCorrectnessFeedbackService,
            ExplorationInitStateNameService, ExplorationLanguageCodeService,
            ExplorationStatesService, RouterService, StateEditorService,
            TranslationLanguageService, TranslationStatusService,
            TranslationTabActiveContentIdService,
            TranslationTabActiveModeService, COMPONENT_NAME_CONTENT,
            COMPONENT_NAME_FEEDBACK, COMPONENT_NAME_HINT,
            COMPONENT_NAME_SOLUTION, INTERACTION_SPECS,
            RULE_SUMMARY_WRAP_CHARACTER_COUNT) {
          // Define tab constants.
          $scope.TAB_ID_CONTENT = COMPONENT_NAME_CONTENT;
          $scope.TAB_ID_FEEDBACK = COMPONENT_NAME_FEEDBACK;
          $scope.TAB_ID_HINTS = COMPONENT_NAME_HINT;
          $scope.TAB_ID_SOLUTION = COMPONENT_NAME_SOLUTION;

          $scope.ExplorationCorrectnessFeedbackService =
            ExplorationCorrectnessFeedbackService;

          // Activates Content tab by default.
          $scope.activatedTabId = $scope.TAB_ID_CONTENT;

          $scope.activeHintIndex = null;
          $scope.activeAnswerGroupIndex = null;
          $scope.stateContent = null;
          $scope.stateInteractionId = null;
          $scope.stateAnswerGroups = [];
          $scope.stateDefaultOutcome = null;
          $scope.stateHints = [];
          $scope.stateSolution = null;

          $scope.isVoiceoverModeActive = (
            TranslationTabActiveModeService.isVoiceoverModeActive);
          var isTranslatedTextRequired = function() {
            return (TranslationTabActiveModeService.isVoiceoverModeActive() &&
              TranslationLanguageService.getActiveLanguageCode() !== (
                ExplorationLanguageCodeService.displayed));
          };
          $scope.getRequiredHtml = function(subtitledHtml) {
            var html = null;
            if (isTranslatedTextRequired()) {
              var contentId = subtitledHtml.getContentId();
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
                html = writtenTranslation.getHtml();
              }
            } else {
              html = subtitledHtml.getHtml();
            }
            return html;
          };

          $scope.getEmptyContentMessage = function() {
            if (TranslationTabActiveModeService.isVoiceoverModeActive()) {
              return (
                'There is no text available to voice-over, add a text ' +
                'translation through translation mode.');
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

          $scope.onTabClick = function(tabId) {
            if ($scope.isTranslationTabBusy) {
              $rootScope.$broadcast('showTranslationTabBusyModal');
              return;
            }
            var activeContentId = null;
            if (tabId === $scope.TAB_ID_CONTENT) {
              activeContentId = $scope.stateContent.getContentId();
            } else if (tabId === $scope.TAB_ID_FEEDBACK) {
              $scope.activeAnswerGroupIndex = 0;
              if ($scope.stateAnswerGroups.length > 0) {
                activeContentId = (
                  $scope.stateAnswerGroups[0].outcome.feedback.getContentId());
              } else {
                activeContentId = (
                  $scope.stateDefaultOutcome.feedback.getContentId());
              }
            } else if (tabId === $scope.TAB_ID_HINTS) {
              $scope.activeHintIndex = 0;
              activeContentId = (
                $scope.stateHints[0].hintContent.getContentId());
            } else if (tabId === $scope.TAB_ID_SOLUTION) {
              activeContentId = $scope.stateSolution.explanation.getContentId();
            }
            TranslationTabActiveContentIdService.setActiveContentId(
              activeContentId);
            $scope.activatedTabId = tabId;
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
                )(defaultOutcome.feedback.getHtml());
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
                  $filter('truncate')(outcome.feedback.getHtml(), 30) :
                  $filter('convertToPlainText')(outcome.feedback.getHtml()));
            }
            return summary;
          };

          $scope.isDisabled = function(tabId) {
            if (tabId === $scope.TAB_ID_CONTENT) {
              return false;
            }
            // This is used to prevent users from adding unwanted audio for
            // default_outcome and hints in Continue and EndExploration
            // interaction.
            if (!$scope.stateInteractionId ||
              INTERACTION_SPECS[$scope.stateInteractionId].is_linear ||
              INTERACTION_SPECS[$scope.stateInteractionId].is_terminal
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
            }
          };

          $scope.changeActiveHintIndex = function(newIndex) {
            if ($scope.isTranslationTabBusy) {
              $rootScope.$broadcast('showTranslationTabBusyModal');
              return;
            }
            if ($scope.activeHintIndex === newIndex) {
              return;
            }
            $scope.activeHintIndex = newIndex;
            var activeContentId = (
              $scope.stateHints[newIndex].hintContent.getContentId());
            TranslationTabActiveContentIdService.setActiveContentId(
              activeContentId);
          };

          $scope.changeActiveAnswerGroupIndex = function(newIndex) {
            if ($scope.isTranslationTabBusy) {
              $rootScope.$broadcast('showTranslationTabBusyModal');
              return;
            }
            if ($scope.activeAnswerGroupIndex !== newIndex) {
              var activeContentId = null;
              $scope.activeAnswerGroupIndex = newIndex;
              if (newIndex === $scope.stateAnswerGroups.length) {
                activeContentId = (
                  $scope.stateDefaultOutcome.feedback.getContentId());
              } else {
                activeContentId = ($scope.stateAnswerGroups[newIndex]
                  .outcome.feedback.getContentId());
              }
              TranslationTabActiveContentIdService.setActiveContentId(
                activeContentId);
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

          $scope.getHtmlSummary = function(subtitledHtml) {
            var htmlAsPlainText = $filter(
              'formatRtePreview')(subtitledHtml.getHtml());
            return htmlAsPlainText;
          };

          $scope.$on('refreshStateTranslation', function() {
            $scope.initStateTranslation();
          });

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
            $scope.activeHintIndex = null;
            $scope.activeAnswerGroupIndex = null;
            var currentCustomizationArgs = ExplorationStatesService
              .getInteractionCustomizationArgsMemento($scope.stateName);
            $scope.answerChoices = StateEditorService.getAnswerChoices(
              $scope.stateInteractionId, currentCustomizationArgs);

            if (TranslationTabActiveModeService.isVoiceoverModeActive()) {
              $scope.needsUpdateTooltipMessage = 'Audio needs update to ' +
                'match text. Please record new audio.';
            } else {
              $scope.needsUpdateTooltipMessage = 'Translation needs update ' +
                'to match text. Please re-translate the content.';
            }
            $scope.onTabClick($scope.TAB_ID_CONTENT);
          };
          $scope.initStateTranslation();
        }
      ]
    };
  }]);
