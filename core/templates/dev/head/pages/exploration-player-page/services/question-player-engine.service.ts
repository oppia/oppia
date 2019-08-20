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
 * @fileoverview Utility service for the question player for an exploration.
 */

require('domain/exploration/ReadOnlyExplorationBackendApiService.ts');
require('domain/question/QuestionObjectFactory.ts');
require('domain/state_card/StateCardObjectFactory.ts');
require('expressions/ExpressionInterpolationService.ts');
require(
  'pages/exploration-player-page/services/answer-classification.service.ts');
require('services/AlertsService.ts');
require('services/ContextService.ts');
require('services/contextual/UrlService.ts');
require('services/ExplorationHtmlFormatterService.ts');
require('services/stateful/FocusManagerService.ts');

require(
  'pages/exploration-player-page/exploration-player-page.constants.ajs.ts');
require('pages/interaction-specs.constants.ajs.ts');

angular.module('oppia').factory('QuestionPlayerEngineService', [
  'AlertsService', 'AnswerClassificationService',
  'ContextService', 'ExplorationHtmlFormatterService',
  'ExpressionInterpolationService', 'FocusManagerService',
  'QuestionObjectFactory', 'ReadOnlyExplorationBackendApiService',
  'StateCardObjectFactory', 'UrlService', 'INTERACTION_DISPLAY_MODE_INLINE',
  'INTERACTION_SPECS',
  function(
      AlertsService, AnswerClassificationService,
      ContextService, ExplorationHtmlFormatterService,
      ExpressionInterpolationService, FocusManagerService,
      QuestionObjectFactory, ReadOnlyExplorationBackendApiService,
      StateCardObjectFactory, UrlService, INTERACTION_DISPLAY_MODE_INLINE,
      INTERACTION_SPECS) {
    var _explorationId = ContextService.getExplorationId();
    var _questionPlayerMode = ContextService.isInQuestionPlayerMode();
    var version = UrlService.getExplorationVersionFromUrl();

    if (!_questionPlayerMode) {
      ReadOnlyExplorationBackendApiService
        .loadExploration(_explorationId, version)
        .then(function(exploration) {
          version = exploration.version;
        });
    }

    var answerIsBeingProcessed = false;

    var questions = [];

    var currentIndex = null;
    var nextIndex = null;

    var randomFromArray = function(arr) {
      return arr[Math.floor(Math.random() * arr.length)];
    };

    // Evaluate feedback.
    var makeFeedback = function(feedbackHtml, envs) {
      return ExpressionInterpolationService.processHtml(feedbackHtml, envs);
    };

    // Evaluate question string.
    var makeQuestion = function(newState, envs) {
      return ExpressionInterpolationService.processHtml(
        newState.content.getHtml(), envs);
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

    // This should only be called when 'exploration' is non-null.
    var _loadInitialQuestion = function(successCallback) {
      var initialState = questions[0].getStateData();

      var questionHtml = makeQuestion(initialState, []);
      if (questionHtml === null) {
        AlertsService.addWarning('Expression parsing error.');
        return;
      }

      currentIndex = 0;
      nextIndex = 0;

      var interaction = initialState.interaction;
      var nextFocusLabel = FocusManagerService.generateFocusLabel();

      var interactionId = interaction.id;
      var interactionHtml = null;

      if (interactionId) {
        interactionHtml = ExplorationHtmlFormatterService.getInteractionHtml(
          interactionId,
          interaction.customizationArgs,
          true, nextFocusLabel);
      }
      var initialCard =
        StateCardObjectFactory.createNewCard(
          null, questionHtml, interactionHtml, interaction,
          initialState.recordedVoiceovers, initialState.content.getContentId());
      successCallback(initialCard, nextFocusLabel);
    };

    var _getCurrentStateData = function() {
      return questions[currentIndex].getStateData();
    };

    var _getNextStateData = function() {
      return questions[nextIndex].getStateData();
    };

    var _getNextInteractionHtml = function(labelForFocusTarget) {
      var interactionId = _getNextStateData().interaction.id;

      return ExplorationHtmlFormatterService.getInteractionHtml(
        interactionId,
        _getNextStateData().interaction.customizationArgs,
        true,
        labelForFocusTarget);
    };

    return {
      /**
       * Initializes the question player for an exploration,
       * passing the data for the first question to successCallback.
       *
       *
       * @param {function} successCallback - The function to execute after the
       *   question data is successfully loaded. This function will
       *   be passed two arguments:
       *   - initHtml {string}, an HTML string representing the content of the
       *       first state.
       */
      init: function(questionDicts, successCallback) {
        answerIsBeingProcessed = false;
        for (var i = 0; i < questionDicts.length; i++) {
          questions.push(
            QuestionObjectFactory.createFromBackendDict(questionDicts[i])
          );
        }
        _loadInitialQuestion(successCallback);
      },
      recordNewCardAdded: function() {
        currentIndex = nextIndex;
      },
      getCurrentQuestion: function() {
        return questions[currentIndex];
      },
      getCurrentQuestionId: function() {
        return questions[currentIndex].getId();
      },
      getQuestionCount: function() {
        return questions.length;
      },
      getExplorationId: function() {
        return _explorationId;
      },
      getExplorationVersion: function() {
        return version;
      },
      getLanguageCode: function() {
        return questions[currentIndex].getLanguageCode();
      },
      isInPreviewMode: function() {
        return false;
      },
      submitAnswer: function(answer, interactionRulesService, successCallback) {
        if (answerIsBeingProcessed) {
          return;
        }

        answerIsBeingProcessed = true;
        var oldIndex = currentIndex;
        var oldState = _getCurrentStateData();
        var recordedVoiceovers = oldState.recordedVoiceovers;
        var classificationResult = (
          AnswerClassificationService.getMatchingClassificationResult(
            null, oldState.interaction, answer,
            interactionRulesService));
        var answerIsCorrect = classificationResult.outcome.labelledAsCorrect;
        var taggedSkillMisconceptionId = null;
        if (oldState.interaction.answerGroups[answer]) {
          taggedSkillMisconceptionId =
            oldState.interaction.answerGroups[answer]
              .taggedSkillMisconceptionId;
        }

        // Use angular.copy() to clone the object
        // since classificationResult.outcome points
        // at oldState.interaction.default_outcome
        var outcome = angular.copy(classificationResult.outcome);
        // Compute the data for the next state.
        var oldParams = {
          answer: answer
        };
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

        var newState = null;
        if (answerIsCorrect && (currentIndex < questions.length - 1)) {
          newState = questions[currentIndex + 1].getStateData();
        } else {
          newState = oldState;
        }

        var questionHtml = makeQuestion(newState, [oldParams, {
          answer: 'answer'
        }]);
        if (questionHtml === null) {
          answerIsBeingProcessed = false;
          AlertsService.addWarning('Expression parsing error.');
          return;
        }
        answerIsBeingProcessed = false;

        var interactionId = oldState.interaction.id;
        var interactionIsInline = (
          !interactionId ||
          INTERACTION_SPECS[interactionId].display_mode ===
            INTERACTION_DISPLAY_MODE_INLINE);
        var refreshInteraction = (
          answerIsCorrect || interactionIsInline);

        nextIndex = currentIndex + 1;
        var isFinalQuestion = (nextIndex === questions.length);
        var onSameCard = !answerIsCorrect;

        var _nextFocusLabel = FocusManagerService.generateFocusLabel();
        var nextCard = null;
        if (!isFinalQuestion) {
          var nextInteractionHtml = _getNextInteractionHtml(_nextFocusLabel);

          questionHtml = questionHtml + _getRandomSuffix();
          nextInteractionHtml = nextInteractionHtml + _getRandomSuffix();

          nextCard = StateCardObjectFactory.createNewCard(
            true, questionHtml, nextInteractionHtml,
            _getNextStateData().interaction,
            _getNextStateData().recordedVoiceovers,
            _getNextStateData().content.getContentId()
          );
        }
        successCallback(
          nextCard, refreshInteraction, feedbackHtml,
          feedbackAudioTranslations,
          null, null, onSameCard, taggedSkillMisconceptionId,
          null, null, isFinalQuestion, _nextFocusLabel);
        return answerIsCorrect;
      },
      isAnswerBeingProcessed: function() {
        return answerIsBeingProcessed;
      }
    };
  }
]);
