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
 * @fileoverview Utility service for the pretests for an exploration.
 */

oppia.constant('INTERACTION_SPECS', GLOBALS.INTERACTION_SPECS);

oppia.factory('PretestEngineService', [
  '$http', '$rootScope', '$q', 'AlertsService', 'AnswerClassificationService',
  'ContextService', 'ExplorationHtmlFormatterService',
  'ExpressionInterpolationService', 'INTERACTION_SPECS',
  'QuestionObjectFactory', 'INTERACTION_DISPLAY_MODE_INLINE',
  'FocusManagerService',
  function(
      $http, $rootScope, $q, AlertsService, AnswerClassificationService,
      ContextService, ExplorationHtmlFormatterService,
      ExpressionInterpolationService, INTERACTION_SPECS,
      QuestionObjectFactory, INTERACTION_DISPLAY_MODE_INLINE,
      FocusManagerService) {
    var _explorationId = ContextService.getExplorationId();

    var version = GLOBALS.explorationVersion;

    var answerIsBeingProcessed = false;

    var pretestQuestions = [];

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

    // This should only be called when 'exploration' is non-null.
    var _loadInitialQuestion = function(successCallback) {
      var initialState = pretestQuestions[0].getStateData();

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
        FocusManagerService.setFocusIfOnDesktop(nextFocusLabel);
      }
      successCallback(
        null, questionHtml, {}, interaction, interactionHtml,
        initialState.contentIdsToAudioTranslations,
        initialState.content.getContentId());
    };

    var _getCurrentStateData = function() {
      return pretestQuestions[currentIndex].getStateData();
    };

    var _getNextStateData = function() {
      return pretestQuestions[nextIndex].getStateData();
    };

    return {
      /**
       * Initializes the pretests for an exploration, passing the data for the
       * first question to successCallback.
       *
       *
       * @param {function} successCallback - The function to execute after the
       *   pretest question data is successfully loaded. This function will
       *   be passed two arguments:
       *   - initHtml {string}, an HTML string representing the content of the
       *       first state.
       */
      init: function(pretestQuestionDicts, successCallback) {
        answerIsBeingProcessed = false;
        for (var i = 0; i < pretestQuestionDicts.length; i++) {
          pretestQuestions.push(
            QuestionObjectFactory.createFromBackendDict(pretestQuestionDicts[i])
          );
        }
        _loadInitialQuestion(successCallback);
      },
      recordNewCardAdded: function() {
        currentIndex = nextIndex;
      },
      getPretestQuestionCount: function() {
        return pretestQuestions.length;
      },
      getExplorationId: function() {
        return _explorationId;
      },
      getExplorationVersion: function() {
        return version;
      },
      getNextInteractionHtml: function(labelForFocusTarget) {
        var interactionId = _getNextStateData().interaction.id;

        return ExplorationHtmlFormatterService.getInteractionHtml(
          interactionId,
          _getNextStateData().interaction.customizationArgs,
          true,
          labelForFocusTarget);
      },
      isNextInteractionInline: function() {
        var interactionId = _getNextStateData().interaction.id;
        return (
          !interactionId ||
          INTERACTION_SPECS[interactionId].display_mode ===
            INTERACTION_DISPLAY_MODE_INLINE);
      },
      getNextInteractionInstructions: function() {
        var interactionId = _getNextStateData().interaction.id;
        return (
          interactionId ? INTERACTION_SPECS[interactionId].instructions : '');
      },
      getNextInteraction: function() {
        return _getNextStateData().interaction;
      },
      isNextStateTerminal: function() {
        var interactionId = _getNextStateData().interaction.id;
        return (
          interactionId && INTERACTION_SPECS[interactionId].is_terminal);
      },
      getHints: function() {
        return _getCurrentStateData().interaction.hints;
      },
      getSolution: function() {
        return _getCurrentStateData().interaction.solution;
      },
      getLanguageCode: function() {
        return pretestQuestions[currentIndex].getLanguageCode();
      },
      getNextContentIdsToAudioTranslations: function() {
        return _getNextStateData().contentIdsToAudioTranslations;
      },
      getNextContentId: function() {
        return _getNextStateData().content.getContentId();
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
        var contentIdsToAudioTranslations =
          oldState.contentIdsToAudioTranslations;
        var classificationResult = (
          AnswerClassificationService.getMatchingClassificationResult(
            null, oldState.interaction, answer,
            interactionRulesService));
        var answerIsCorrect = classificationResult.outcome.labelledAsCorrect;

        // Use angular.copy() to clone the object
        // since classificationResult.outcome points
        // at oldState.interaction.default_outcome
        var outcome = angular.copy(classificationResult.outcome);
        // Compute the data for the next state.
        var oldParams = {};
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

        if (answerIsCorrect && (currentIndex < pretestQuestions.length - 1)) {
          newState = pretestQuestions[currentIndex + 1].getStateData();
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
        var isFinalQuestion = (nextIndex === pretestQuestions.length);
        var onSameCard = !answerIsCorrect;

        successCallback(
          nextIndex, refreshInteraction, feedbackHtml,
          feedbackAudioTranslations, questionHtml, oldParams,
          null, null, onSameCard, null, null, isFinalQuestion);
        return answerIsCorrect;
      },
      isAnswerBeingProcessed: function() {
        return answerIsBeingProcessed;
      }
    };
  }
]);
