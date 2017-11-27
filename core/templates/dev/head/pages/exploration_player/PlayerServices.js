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
oppia.factory('ExplorationPlayerService', [
  '$http', '$rootScope', '$q', 'LearnerParamsService',
  'AlertsService', 'AnswerClassificationService', 'ExplorationContextService',
  'PAGE_CONTEXT', 'ExplorationHtmlFormatterService',
  'PlayerTranscriptService', 'ExplorationObjectFactory',
  'ExpressionInterpolationService', 'StateClassifierMappingService',
  'StatsReportingService', 'UrlInterpolationService',
  'ReadOnlyExplorationBackendApiService',
  'EditableExplorationBackendApiService', 'AudioTranslationManagerService',
  'LanguageUtilService', 'NumberAttemptsService',
  function(
      $http, $rootScope, $q, LearnerParamsService,
      AlertsService, AnswerClassificationService, ExplorationContextService,
      PAGE_CONTEXT, ExplorationHtmlFormatterService,
      PlayerTranscriptService, ExplorationObjectFactory,
      ExpressionInterpolationService, StateClassifierMappingService,
      StatsReportingService, UrlInterpolationService,
      ReadOnlyExplorationBackendApiService,
      EditableExplorationBackendApiService, AudioTranslationManagerService,
      LanguageUtilService, NumberAttemptsService) {
    var _explorationId = ExplorationContextService.getExplorationId();
    var _editorPreviewMode = (
      ExplorationContextService.getPageContext() === PAGE_CONTEXT.EDITOR);
    var _isLoggedIn = GLOBALS.userIsLoggedIn;
    var answerIsBeingProcessed = false;

    var exploration = null;

    // This list may contain duplicates. A state name is added to it each time
    // the learner moves to a new card.
    var visitedStateNames = [];

    var explorationActuallyStarted = false;

    // Param changes to be used ONLY in editor preview mode.
    var manualParamChanges = null;
    var initialStateName = null;
    var version = GLOBALS.explorationVersion;

    var randomFromArray = function(arr) {
      return arr[Math.floor(Math.random() * arr.length)];
    };

    // Evaluate feedback.
    var makeFeedback = function(feedbacks, envs) {
      var feedbackHtml = feedbacks.length > 0 ? feedbacks[0] : '';
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
        visitedStateNames.push(exploration.initStateName);
      }

      $rootScope.$broadcast('playerStateChange', initialState.name);
      successCallback(exploration, questionHtml, newParams);
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

    // Ensure the transition to a terminal state properly logs the end of the
    // exploration.
    $rootScope.$on('playerStateChange', function(evt, newStateName) {
      if (!_editorPreviewMode && exploration.isStateTerminal(newStateName)) {
        StatsReportingService.recordExplorationCompleted(
          newStateName, LearnerParamsService.getAllParams());
      }
    });

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
      init: function(successCallback) {
        answerIsBeingProcessed = false;
        PlayerTranscriptService.init();

        if (_editorPreviewMode) {
          EditableExplorationBackendApiService.fetchApplyDraftExploration(
            _explorationId).then(function(data) {
              exploration = ExplorationObjectFactory.createFromBackendDict(
                data);
              exploration.setInitialStateName(initStateName);
              initParams(manualParamChanges);
              AudioTranslationManagerService.init(
                exploration.getAllAudioLanguageCodes(),
                null,
                exploration.getLanguageCode(),
                data.auto_tts_enabled);
              _loadInitialState(successCallback);
              NumberAttemptsService.reset();
            });
        } else {
          var loadedExploration = null;
          if (version) {
            loadedExploration = (
              ReadOnlyExplorationBackendApiService.loadExploration(
                _explorationId, version));
          } else {
            loadedExploration = (
              ReadOnlyExplorationBackendApiService.loadLatestExploration(
                _explorationId));
          }
          loadedExploration.then(function(data) {
            exploration = ExplorationObjectFactory.createFromBackendDict(
              data.exploration);
            version = data.version;
            initParams([]);

            StateClassifierMappingService.init(data.state_classifier_mapping);

            StatsReportingService.initSession(
              _explorationId, exploration.title,
              version, data.session_id, GLOBALS.collectionId);
            AudioTranslationManagerService.init(
              exploration.getAllAudioLanguageCodes(),
              data.preferred_audio_language_code,
              exploration.getLanguageCode(),
              data.auto_tts_enabled);

            _loadInitialState(successCallback);
            $rootScope.$broadcast('playerServiceInitialized');
          });
        }
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
      getExplorationLanguageCode: function() {
        return exploration.languageCode;
      },
      getStateContentHtml: function(stateName) {
        return exploration.getUninterpolatedContentHtml(stateName);
      },
      getStateContentAudioTranslations: function(stateName) {
        return exploration.getAudioTranslations(stateName);
      },
      getStateContentAudioTranslation: function(stateName, languageCode) {
        return exploration.getAudioTranslation(stateName, languageCode);
      },
      getAllAudioTranslations: function() {
        return exploration.getAllAudioTranslations();
      },
      isContentAudioTranslationAvailable: function(stateName) {
        return Object.keys(
          exploration.getAudioTranslations(stateName)).length > 0 ||
          AudioTranslationManagerService.isAutogeneratedAudioAllowed();
      },
      getInteractionHtml: function(stateName, labelForFocusTarget) {
        var interactionId = exploration.getInteractionId(stateName);
        if (!interactionId) {
          return null;
        }

        return ExplorationHtmlFormatterService.getInteractionHtml(
          interactionId,
          exploration.getInteractionCustomizationArgs(stateName),
          labelForFocusTarget);
      },
      getInteraction: function(stateName) {
        return exploration.getInteraction(stateName);
      },
      getRandomSuffix: function() {
        // This is a bit of a hack. When a refresh to a $scope variable happens,
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
      },
      getSolution: function(stateName) {
        return exploration.getInteraction(stateName).solution;
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
        var classificationResult = (
          AnswerClassificationService.getMatchingClassificationResult(
            _explorationId, oldStateName, oldState, answer, false,
            interactionRulesService));

        if (!_editorPreviewMode) {
          StatsReportingService.recordAnswerSubmitted(
            oldStateName,
            LearnerParamsService.getAllParams(),
            answer,
            classificationResult.answerGroupIndex,
            classificationResult.ruleIndex,
            classificationResult.classificationCategorization);
        }

        // Use angular.copy() to clone the object
        // since classificationResult.outcome points
        // at oldState.interaction.default_outcome
        var outcome = angular.copy(classificationResult.outcome);

        var newStateName = outcome.dest;
        var newState = exploration.getState(newStateName);

        // Compute the data for the next state.
        var oldParams = LearnerParamsService.getAllParams();
        oldParams.answer = answer;
        var feedbackHtml = makeFeedback(outcome.feedback, [oldParams]);
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

        oldStateName = PlayerTranscriptService.getLastStateName();
        var refreshInteraction = (
          oldStateName !== newStateName ||
          exploration.isInteractionInline(oldStateName));

        if (!_editorPreviewMode) {
          var isFirstHit = Boolean(visitedStateNames.indexOf(
            newStateName) === -1);
          if (newStateName !== oldStateName) {
            StatsReportingService.recordStateTransition(
              oldStateName, newStateName, answer,
              LearnerParamsService.getAllParams(), isFirstHit);

            StatsReportingService.recordStateCompleted(oldStateName);
            visitedStateNames.push(newStateName);

            if (oldStateName === exploration.initStateName && (
                !explorationActuallyStarted)) {
              StatsReportingService.recordExplorationActuallyStarted(
                oldStateName);
              explorationActuallyStarted = true;
            }
          }
          if (exploration.isStateTerminal(newStateName)) {
            StatsReportingService.recordStateCompleted(newStateName);
          }
        }

        $rootScope.$broadcast('updateActiveStateIfInEditor', newStateName);
        $rootScope.$broadcast('playerStateChange', newStateName);
        successCallback(
          newStateName, refreshInteraction, feedbackHtml, questionHtml,
          newParams);
      },
      isAnswerBeingProcessed: function() {
        return answerIsBeingProcessed;
      },
      // Returns a promise for the user profile picture, or the default image if
      // user is not logged in or has not uploaded a profile picture, or the
      // player is in preview mode.
      getUserProfileImage: function() {
        var DEFAULT_PROFILE_IMAGE_PATH = (
          UrlInterpolationService.getStaticImageUrl(
            '/avatar/user_blue_72px.png'));

        var deferred = $q.defer();
        if (_isLoggedIn && !_editorPreviewMode) {
          $http.get(
            '/preferenceshandler/profile_picture'
          ).then(function(response) {
            var profilePictureDataUrl = response.data.profile_picture_data_url;
            if (profilePictureDataUrl) {
              deferred.resolve(profilePictureDataUrl);
            } else {
              deferred.resolve(DEFAULT_PROFILE_IMAGE_PATH);
            }
          });
        } else {
          deferred.resolve(DEFAULT_PROFILE_IMAGE_PATH);
        }
        return deferred.promise;
      },
      recordSolutionHit: function(stateName) {
        if (!_editorPreviewMode) {
          StatsReportingService.recordSolutionHit(stateName);
        }
      }
    };
  }
]);
