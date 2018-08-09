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
 * @fileoverview Utility service for the learner's view of an exploration.
 */

oppia.constant('INTERACTION_SPECS', GLOBALS.INTERACTION_SPECS);

// A service that provides a number of utility functions for JS used by
// the player skin.
// Note that this service is used both in the learner and the editor views.
// The URL determines which of these it is. Some methods may need to be
// implemented differently depending on whether the skin is being played
// in the learner view, or whether it is being previewed in the editor view.
oppia.factory('ExplorationEngineService', [
  '$http', '$rootScope', '$q', 'AlertsService', 'AnswerClassificationService',
  'AudioPreloaderService', 'AudioTranslationLanguageService',
  'EditableExplorationBackendApiService', 'ContextService',
  'ExplorationHtmlFormatterService', 'ExplorationObjectFactory',
  'ExpressionInterpolationService', 'GuestCollectionProgressService',
  'ImagePreloaderService', 'LanguageUtilService', 'LearnerParamsService',
  'NumberAttemptsService', 'PlayerCorrectnessFeedbackEnabledService',
  'PlayerTranscriptService', 'PlaythroughService', 'INTERACTION_SPECS',
  'ReadOnlyExplorationBackendApiService', 'StateClassifierMappingService',
  'StatsReportingService', 'UrlInterpolationService', 'UserService',
  'WindowDimensionsService', 'DEFAULT_PROFILE_IMAGE_PATH',
  'ENABLE_PLAYTHROUGH_RECORDING', 'PAGE_CONTEXT',
  'WHITELISTED_COLLECTION_IDS_FOR_SAVING_GUEST_PROGRESS',
  function(
      $http, $rootScope, $q, AlertsService, AnswerClassificationService,
      AudioPreloaderService, AudioTranslationLanguageService,
      EditableExplorationBackendApiService, ContextService,
      ExplorationHtmlFormatterService, ExplorationObjectFactory,
      ExpressionInterpolationService, GuestCollectionProgressService,
      ImagePreloaderService, LanguageUtilService, LearnerParamsService,
      NumberAttemptsService, PlayerCorrectnessFeedbackEnabledService,
      PlayerTranscriptService, PlaythroughService, INTERACTION_SPECS,
      ReadOnlyExplorationBackendApiService, StateClassifierMappingService,
      StatsReportingService, UrlInterpolationService, UserService,
      WindowDimensionsService, DEFAULT_PROFILE_IMAGE_PATH,
      ENABLE_PLAYTHROUGH_RECORDING, PAGE_CONTEXT,
      WHITELISTED_COLLECTION_IDS_FOR_SAVING_GUEST_PROGRESS) {
    var _explorationId = ContextService.getExplorationId();
    var _editorPreviewMode = ContextService.isInExplorationEditorPage();
    var _isLoggedIn = GLOBALS.userIsLoggedIn;
    var answerIsBeingProcessed = false;

    var exploration = null;

    // This list may contain duplicates. A state name is added to it each time
    // the learner moves to a new card.
    var visitedStateNames = [];
    var currentStateName = null;
    var nextStateName = null;

    // Param changes to be used ONLY in editor preview mode.
    var manualParamChanges = null;
    var initialStateName = null;
    var version = GLOBALS.explorationVersion;

    var randomFromArray = function(arr) {
      return arr[Math.floor(Math.random() * arr.length)];
    };

    // Evaluate feedback.
    var makeFeedback = function(feedbackHtml, envs) {
      return ExpressionInterpolationService.processHtml(feedbackHtml, envs);
    };

    // Evaluate parameters. Returns null if any evaluation fails.
    var makeParams = function(oldParams, paramChanges, envs) {
      var newParams = angular.copy(oldParams);
      if (paramChanges.every(function(pc) {
        if (pc.generatorId === 'Copier') {
          if (!pc.customizationArgs.parse_with_jinja) {
            newParams[pc.name] = pc.customizationArgs.value;
          } else {
            var paramValue = ExpressionInterpolationService.processUnicode(
              pc.customizationArgs.value, [newParams].concat(envs));
            if (paramValue === null) {
              return false;
            }
            newParams[pc.name] = paramValue;
          }
        } else {
          // RandomSelector.
          newParams[pc.name] = randomFromArray(
            pc.customizationArgs.list_of_values);
        }
        return true;
      })) {
        // All parameters were evaluated successfully.
        return newParams;
      }
      // Evaluation of some parameter failed.
      return null;
    };

    // Evaluate question string.
    var makeQuestion = function(newState, envs) {
      return ExpressionInterpolationService.processHtml(
        newState.content.getHtml(), envs);
    };

    // This should only be called when 'exploration' is non-null.
    var _loadInitialState = function(successCallback) {
      var initialState = exploration.getInitialState();
      var oldParams = LearnerParamsService.getAllParams();
      var newParams = makeParams(
        oldParams, initialState.paramChanges, [oldParams]);
      if (newParams === null) {
        AlertsService.addWarning('Expression parsing error.');
        return;
      }

      var questionHtml = makeQuestion(initialState, [newParams]);
      if (questionHtml === null) {
        AlertsService.addWarning('Expression parsing error.');
        return;
      }

      if (!_editorPreviewMode) {
        StatsReportingService.recordExplorationStarted(
          exploration.initStateName, newParams);
      }
      currentStateName = exploration.initStateName;
      nextStateName = exploration.initStateName;
      $rootScope.$broadcast('playerStateChange', initialState.name);
      successCallback(currentStateName, questionHtml, newParams);
    };

    // Initialize the parameters in the exploration as specified in the
    // exploration-level initial parameter changes list, followed by any
    // manual parameter changes (in editor preview mode).
    var initParams = function(manualParamChanges) {
      var baseParams = {};
      exploration.paramSpecs.forEach(function(paramName, paramSpec) {
        baseParams[paramName] = paramSpec.getType().createDefaultValue();
      });

      var startingParams = makeParams(
        baseParams,
        exploration.paramChanges.concat(manualParamChanges),
        [baseParams]);

      LearnerParamsService.init(startingParams);
    };

    return {
      // This should only be used in editor preview mode. It sets the
      // exploration data from what's currently specified in the editor, and
      // also initializes the parameters to empty strings.
      initSettingsFromEditor: function(activeStateNameFromPreviewTab,
          manualParamChangesToInit) {
        if (_editorPreviewMode) {
          manualParamChanges = manualParamChangesToInit;
          initStateName = activeStateNameFromPreviewTab;
        } else {
          throw 'Error: cannot populate exploration in learner mode.';
        }
      },
      /**
       * Initializes an exploration, passing the data for the first state to
       * successCallback.
       *
       * In editor preview mode, populateExploration() must be called before
       * calling init().
       *
       * @param {function} successCallback - The function to execute after the
       *   initial exploration data is successfully loaded. This function will
       *   be passed two arguments:
       *   - stateName {string}, the name of the first state
       *   - initHtml {string}, an HTML string representing the content of the
       *       first state.
       */
      init: function(
          explorationDict, explorationVersion, preferredAudioLanguage,
          autoTtsEnabled, successCallback) {
        answerIsBeingProcessed = false;
        if (_editorPreviewMode) {
          exploration = ExplorationObjectFactory.createFromBackendDict(
            explorationDict);
          exploration.setInitialStateName(initStateName);
          visitedStateNames = [exploration.getInitialState().name];
          initParams(manualParamChanges);
          AudioTranslationLanguageService.init(
            exploration.getAllAudioLanguageCodes(),
            null,
            exploration.getLanguageCode(),
            explorationDict.auto_tts_enabled);
          AudioPreloaderService.init(exploration);
          AudioPreloaderService.kickOffAudioPreloader(initStateName);
          _loadInitialState(successCallback);
        } else {
          exploration = ExplorationObjectFactory.createFromBackendDict(
            explorationDict);
          visitedStateNames.push(exploration.getInitialState().name);
          version = explorationVersion;
          initParams([]);
          AudioTranslationLanguageService.init(
            exploration.getAllAudioLanguageCodes(),
            preferredAudioLanguage,
            exploration.getLanguageCode(),
            autoTtsEnabled);
          AudioPreloaderService.init(exploration);
          AudioPreloaderService.kickOffAudioPreloader(
            exploration.getInitialState().name);
          ImagePreloaderService.init(exploration);
          ImagePreloaderService.kickOffImagePreloader(
            exploration.getInitialState().name);
          _loadInitialState(successCallback);
        }
      },
      setCurrentStateIndex: function(index) {
        currentStateName = angular.copy(visitedStateNames[index]);
      },
      getCurrentStateName: function() {
        return currentStateName;
      },
      isCurrentStateInitial: function() {
        return currentStateName === exploration.initStateName;
      },
      recordNewCardAdded: function() {
        currentStateName = nextStateName;
      },
      getExplorationId: function() {
        return _explorationId;
      },
      getExplorationTitle: function() {
        return exploration.title;
      },
      getExplorationVersion: function() {
        return version;
      },
      getStateContentHtml: function() {
        return exploration.getUninterpolatedContentHtml(currentStateName);
      },
      getStateContentAudioTranslations: function() {
        return exploration.getAudioTranslations(currentStateName);
      },
      getStateContentAudioTranslation: function(stateName, languageCode) {
        return exploration.getAudioTranslation(stateName, languageCode);
      },
      isContentAudioTranslationAvailable: function() {
        return Object.keys(
          exploration.getAudioTranslations(currentStateName)).length > 0 ||
          AudioTranslationLanguageService.isAutogeneratedAudioAllowed();
      },
      getCurrentInteractionHtml: function(labelForFocusTarget) {
        var interactionId = exploration.getInteractionId(currentStateName);
        if (!interactionId) {
          return null;
        }

        return ExplorationHtmlFormatterService.getInteractionHtml(
          interactionId,
          exploration.getInteractionCustomizationArgs(currentStateName),
          true,
          labelForFocusTarget);
      },
      getNextInteractionHtml: function(labelForFocusTarget) {
        var interactionId = exploration.getInteractionId(nextStateName);

        return ExplorationHtmlFormatterService.getInteractionHtml(
          interactionId,
          exploration.getInteractionCustomizationArgs(nextStateName),
          true,
          labelForFocusTarget);
      },
      getCurrentInteraction: function() {
        return exploration.getInteraction(currentStateName);
      },
      isInteractionInline: function() {
        if (currentStateName === null) {
          return true;
        }
        return exploration.isInteractionInline(currentStateName);
      },
      isNextInteractionInline: function() {
        return exploration.isInteractionInline(nextStateName);
      },
      getCurrentInteractionInstructions: function() {
        return exploration.getInteractionInstructions(currentStateName);
      },
      getNextInteractionInstructions: function() {
        return exploration.getInteractionInstructions(nextStateName);
      },
      isCurrentStateTerminal: function() {
        return exploration.isStateTerminal(currentStateName);
      },
      isNextStateTerminal: function() {
        return exploration.isStateTerminal(nextStateName);
      },
      isStateShowingConceptCard: function() {
        if (currentStateName === null) {
          return true;
        }
        return false;
      },
      getAuthorRecommendedExpIds: function() {
        return exploration.getAuthorRecommendedExpIds(currentStateName);
      },
      getLanguageCode: function() {
        return exploration.getLanguageCode();
      },
      getHints: function() {
        return exploration.getInteraction(currentStateName).hints;
      },
      doesInteractionSupportHints: function() {
        return (
          !INTERACTION_SPECS[
            exploration.getInteraction(currentStateName).id].is_terminal &&
          !INTERACTION_SPECS[
            exploration.getInteraction(currentStateName).id].is_linear);
      },
      getSolution: function() {
        return exploration.getInteraction(currentStateName).solution;
      },
      getContentIdsToAudioTranslations: function() {
        return (
          exploration.getState(currentStateName).contentIdsToAudioTranslations);
      },
      isLoggedIn: function() {
        return _isLoggedIn;
      },
      isInPreviewMode: function() {
        return !!_editorPreviewMode;
      },
      submitAnswer: function(answer, interactionRulesService, successCallback) {
        if (answerIsBeingProcessed) {
          return;
        }

        answerIsBeingProcessed = true;
        var oldStateName = PlayerTranscriptService.getLastStateName();
        var oldState = exploration.getState(oldStateName);
        var contentIdsToAudioTranslations =
          oldState.contentIdsToAudioTranslations;
        var classificationResult = (
          AnswerClassificationService.getMatchingClassificationResult(
            oldStateName, oldState.interaction, answer,
            interactionRulesService));
        var answerIsCorrect = classificationResult.outcome.labelledAsCorrect;

        // Use angular.copy() to clone the object
        // since classificationResult.outcome points
        // at oldState.interaction.default_outcome
        var outcome = angular.copy(classificationResult.outcome);
        var newStateName = outcome.dest;

        if (!_editorPreviewMode) {
          var feedbackIsUseful = (
            AnswerClassificationService.isClassifiedExplicitlyOrGoesToNewState(
              oldStateName, oldState, answer,
              interactionRulesService));
          StatsReportingService.recordAnswerSubmitted(
            oldStateName,
            LearnerParamsService.getAllParams(),
            answer,
            classificationResult.answerGroupIndex,
            classificationResult.ruleIndex,
            classificationResult.classificationCategorization,
            feedbackIsUseful);

          if (ENABLE_PLAYTHROUGH_RECORDING) {
            StatsReportingService.recordAnswerSubmitAction(
              oldStateName, newStateName, oldState.interaction.id, answer,
              outcome.feedback);
          }
        }

        var refresherExplorationId = outcome.refresherExplorationId;
        var missingPrerequisiteSkillId = outcome.missingPrerequisiteSkillId;
        var newState = exploration.getState(newStateName);
        var isFirstHit = Boolean(visitedStateNames.indexOf(
          newStateName) === -1);
        if (oldStateName !== newStateName) {
          visitedStateNames.push(newStateName);
        }
        // Compute the data for the next state.
        var oldParams = LearnerParamsService.getAllParams();
        oldParams.answer = answer;
        var feedbackHtml =
          makeFeedback(outcome.feedback.getHtml(), [oldParams]);
        var feedbackContentId = outcome.feedback.getContentId();
        var feedbackAudioTranslations =
          contentIdsToAudioTranslations.getBindableAudioTranslations(
            feedbackContentId);
        if (feedbackHtml === null) {
          answerIsBeingProcessed = false;
          AlertsService.addWarning('Expression parsing error.');
          return;
        }

        var newParams = (
          newState ? makeParams(
            oldParams, newState.paramChanges, [oldParams]) : oldParams);
        if (newParams === null) {
          answerIsBeingProcessed = false;
          AlertsService.addWarning('Expression parsing error.');
          return;
        }

        var questionHtml = makeQuestion(newState, [newParams, {
          answer: 'answer'
        }]);
        if (questionHtml === null) {
          answerIsBeingProcessed = false;
          AlertsService.addWarning('Expression parsing error.');
          return;
        }

        // TODO(sll): Remove the 'answer' key from newParams.
        newParams.answer = answer;

        answerIsBeingProcessed = false;

        var refreshInteraction = (
          oldStateName !== newStateName ||
          exploration.isInteractionInline(oldStateName));
        nextStateName = newStateName;
        var onSameCard = (oldStateName === newStateName);

        $rootScope.$broadcast('updateActiveStateIfInEditor', newStateName);
        successCallback(
          newStateName, refreshInteraction, feedbackHtml,
          feedbackAudioTranslations, questionHtml, newParams,
          refresherExplorationId, missingPrerequisiteSkillId, onSameCard,
          (oldStateName === exploration.initStateName), isFirstHit);
        return answerIsCorrect;
      },
      isAnswerBeingProcessed: function() {
        return answerIsBeingProcessed;
      }
    };
  }
]);
