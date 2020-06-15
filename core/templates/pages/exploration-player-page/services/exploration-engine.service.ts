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

require('domain/collection/guest-collection-progress.service.ts');
require('domain/exploration/editable-exploration-backend-api.service.ts');
require('domain/exploration/ExplorationObjectFactory.ts');
require('domain/exploration/read-only-exploration-backend-api.service.ts');
require('domain/state_card/StateCardObjectFactory.ts');
require('domain/utilities/language-util.service.ts');
require('domain/utilities/url-interpolation.service.ts');
require('expressions/expression-interpolation.service.ts');
require(
  'pages/exploration-player-page/services/answer-classification.service.ts');
require('pages/exploration-player-page/services/audio-preloader.service.ts');
require(
  'pages/exploration-player-page/services/' +
  'audio-translation-language.service.ts');
require('pages/exploration-player-page/services/image-preloader.service.ts');
require('pages/exploration-player-page/services/learner-params.service.ts');
require('pages/exploration-player-page/services/number-attempts.service.ts');
require('pages/exploration-player-page/services/player-transcript.service.ts');
require(
  'pages/exploration-player-page/services/state-classifier-mapping.service.ts');
require('pages/exploration-player-page/services/stats-reporting.service.ts');
require('services/alerts.service.ts');
require('services/context.service.ts');
require('services/exploration-features-backend-api.service.ts');
require('services/exploration-html-formatter.service.ts');
require('services/user.service.ts');
require('services/contextual/url.service.ts');
require('services/contextual/window-dimensions.service.ts');
require('services/stateful/focus-manager.service.ts');

require('pages/interaction-specs.constants.ajs.ts');

// A service that provides a number of utility functions for JS used by
// the player skin.
// Note that this service is used both in the learner and the editor views.
// The URL determines which of these it is. Some methods may need to be
// implemented differently depending on whether the skin is being played
// in the learner view, or whether it is being previewed in the editor view.
angular.module('oppia').factory('ExplorationEngineService', [
  '$rootScope', 'AlertsService', 'AnswerClassificationService',
  'AudioPreloaderService', 'AudioTranslationLanguageService', 'ContextService',
  'ExplorationFeaturesBackendApiService', 'ExplorationHtmlFormatterService',
  'ExplorationObjectFactory', 'ExpressionInterpolationService',
  'FocusManagerService', 'ImagePreloaderService', 'LearnerParamsService',
  'PlayerTranscriptService', 'ReadOnlyExplorationBackendApiService',
  'StateCardObjectFactory', 'StatsReportingService', 'UrlService',
  function(
      $rootScope, AlertsService, AnswerClassificationService,
      AudioPreloaderService, AudioTranslationLanguageService, ContextService,
      ExplorationFeaturesBackendApiService, ExplorationHtmlFormatterService,
      ExplorationObjectFactory, ExpressionInterpolationService,
      FocusManagerService, ImagePreloaderService, LearnerParamsService,
      PlayerTranscriptService, ReadOnlyExplorationBackendApiService,
      StateCardObjectFactory, StatsReportingService, UrlService) {
    var _explorationId = ContextService.getExplorationId();
    var _editorPreviewMode = ContextService.isInExplorationEditorPage();
    var _questionPlayerMode = ContextService.isInQuestionPlayerMode();
    var answerIsBeingProcessed = false;
    var alwaysAskLearnersForAnswerDetails = false;

    var exploration = null;

    // This list may contain duplicates. A state name is added to it each time
    // the learner moves to a new card.
    var visitedStateNames = [];
    var currentStateName = null;
    var nextStateName = null;

    // Param changes to be used ONLY in editor preview mode.
    var manualParamChanges = null;
    var initStateName = null;
    var version = UrlService.getExplorationVersionFromUrl();
    if (!_questionPlayerMode) {
      ReadOnlyExplorationBackendApiService
        .loadExploration(_explorationId, version)
        .then(function(exploration) {
          version = exploration.version;
        });
    }

    var randomFromArray = function(arr) {
      return arr[Math.floor(Math.random() * arr.length)];
    };

    // Evaluate feedback.
    var makeFeedback = function(feedbackHtml, envs) {
      return ExpressionInterpolationService.processHtml(feedbackHtml, envs);
    };

    var _getRandomSuffix = function() {
      // This is a bit of a hack. When a refresh to a $scope variable
      // happens,
      // AngularJS compares the new value of the variable to its previous
      // value. If they are the same, then the variable is not updated.
      // Appending a random suffix makes the new value different from the
      // previous one, and thus indirectly forces a refresh.
      var randomSuffix = '';
      var N = Math.round(Math.random() * 1000);
      for (var i = 0; i < N; i++) {
        randomSuffix += ' ';
      }
      return randomSuffix;
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
      if (newParams) {
        LearnerParamsService.init(newParams);
      }
      currentStateName = exploration.initStateName;
      nextStateName = exploration.initStateName;

      var interaction = exploration.getInteraction(exploration.initStateName);
      var nextFocusLabel = FocusManagerService.generateFocusLabel();

      var interactionId = interaction.id;
      var interactionHtml = null;

      if (interactionId) {
        interactionHtml = ExplorationHtmlFormatterService.getInteractionHtml(
          interactionId,
          exploration.getInteractionCustomizationArgs(currentStateName),
          true, nextFocusLabel);
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

      var initialCard =
        StateCardObjectFactory.createNewCard(
          currentStateName, questionHtml, interactionHtml,
          interaction, initialState.recordedVoiceovers,
          initialState.content.getContentId());
      successCallback(initialCard, nextFocusLabel);
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

    var _getNextInteractionHtml = function(labelForFocusTarget) {
      var interactionId = exploration.getInteractionId(nextStateName);

      return ExplorationHtmlFormatterService.getInteractionHtml(
        interactionId,
        exploration.getInteractionCustomizationArgs(nextStateName),
        true,
        labelForFocusTarget);
    };

    var checkAlwaysAskLearnersForAnswerDetails = function() {
      ExplorationFeaturesBackendApiService.fetchExplorationFeatures(
        _explorationId).then(function(featuresData) {
        alwaysAskLearnersForAnswerDetails = (
          featuresData.always_ask_learners_for_answer_details);
      });
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
          throw new Error('Cannot populate exploration in learner mode.');
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
            exploration.getAllVoiceoverLanguageCodes(),
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
            exploration.getAllVoiceoverLanguageCodes(),
            preferredAudioLanguage,
            exploration.getLanguageCode(),
            autoTtsEnabled);
          AudioPreloaderService.init(exploration);
          AudioPreloaderService.kickOffAudioPreloader(
            exploration.getInitialState().name);
          ImagePreloaderService.init(exploration);
          ImagePreloaderService.kickOffImagePreloader(
            exploration.getInitialState().name);
          checkAlwaysAskLearnersForAnswerDetails();
          _loadInitialState(successCallback);
        }
      },
      moveToExploration: function(successCallback) {
        _loadInitialState(successCallback);
      },
      isCurrentStateInitial: function() {
        return currentStateName === exploration.initStateName;
      },
      recordNewCardAdded: function() {
        currentStateName = nextStateName;
      },
      getState: function() {
        var stateName = PlayerTranscriptService.getLastStateName();
        return exploration.getState(stateName);
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
      getAuthorRecommendedExpIds: function() {
        return exploration.getAuthorRecommendedExpIds(currentStateName);
      },
      getLanguageCode: function() {
        return exploration.getLanguageCode();
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
        var recordedVoiceovers = oldState.recordedVoiceovers;
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

          StatsReportingService.recordAnswerSubmitAction(
            oldStateName, newStateName, oldState.interaction.id, answer,
            outcome.feedback);
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
        var feedbackAudioTranslations = (
          recordedVoiceovers.getBindableVoiceovers(feedbackContentId));
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

        var _nextFocusLabel = FocusManagerService.generateFocusLabel();
        var nextInteractionHtml = null;
        if (exploration.getInteraction(nextStateName).id) {
          nextInteractionHtml = _getNextInteractionHtml(_nextFocusLabel);
        }
        if (newParams) {
          LearnerParamsService.init(newParams);
        }

        questionHtml = questionHtml + _getRandomSuffix();
        nextInteractionHtml = nextInteractionHtml + _getRandomSuffix();

        var nextCard = StateCardObjectFactory.createNewCard(
          nextStateName, questionHtml, nextInteractionHtml,
          exploration.getInteraction(nextStateName),
          exploration.getState(nextStateName).recordedVoiceovers,
          exploration.getState(nextStateName).content.getContentId());
        successCallback(
          nextCard, refreshInteraction, feedbackHtml,
          feedbackAudioTranslations, refresherExplorationId,
          missingPrerequisiteSkillId, onSameCard, null,
          (oldStateName === exploration.initStateName), isFirstHit, false,
          _nextFocusLabel);
        return answerIsCorrect;
      },
      isAnswerBeingProcessed: function() {
        return answerIsBeingProcessed;
      },
      getAlwaysAskLearnerForAnswerDetails: function() {
        return alwaysAskLearnersForAnswerDetails;
      }
    };
  }
]);
