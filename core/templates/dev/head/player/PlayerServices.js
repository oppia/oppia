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

oppia.constant('GADGET_SPECS', GLOBALS.GADGET_SPECS);
oppia.constant('INTERACTION_SPECS', GLOBALS.INTERACTION_SPECS);

// A service that provides a number of utility functions for JS used by
// the player skin.
// Note that this service is used both in the learner and the editor views.
// The URL determines which of these it is. Some methods may need to be
// implemented differently depending on whether the skin is being played
// in the learner view, or whether it is being previewed in the editor view.
//
// TODO(sll): Make this read from a local client-side copy of the exploration
// and audit it to ensure it behaves differently for learner mode and editor
// mode. Add tests to ensure this.
oppia.factory('oppiaPlayerService', [
  '$http', '$rootScope', '$q', 'LearnerParamsService',
  'alertsService', 'answerClassificationService', 'explorationContextService',
  'PAGE_CONTEXT', 'oppiaExplorationHtmlFormatterService',
  'playerTranscriptService', 'ExplorationObjectFactory',
  'expressionInterpolationService', 'StatsReportingService',
  function(
      $http, $rootScope, $q, LearnerParamsService,
      alertsService, answerClassificationService, explorationContextService,
      PAGE_CONTEXT, oppiaExplorationHtmlFormatterService,
      playerTranscriptService, ExplorationObjectFactory,
      expressionInterpolationService, StatsReportingService) {
    var _explorationId = explorationContextService.getExplorationId();
    var _editorPreviewMode = (
      explorationContextService.getPageContext() === PAGE_CONTEXT.EDITOR);
    var _isLoggedIn = GLOBALS.userIsLoggedIn;
    var answerIsBeingProcessed = false;

    var exploration = null;
    var version = GLOBALS.explorationVersion;

    var randomFromArray = function(arr) {
      return arr[Math.floor(Math.random() * arr.length)];
    };

    // Evaluate feedback.
    var makeFeedback = function(feedbacks, envs) {
      var feedbackHtml = feedbacks.length > 0 ? feedbacks[0] : '';
      return expressionInterpolationService.processHtml(feedbackHtml, envs);
    };

    // Evaluate parameters. Returns null if any evaluation fails.
    var makeParams = function(oldParams, paramChanges, envs) {
      var newParams = angular.copy(oldParams);
      if (paramChanges.every(function(pc) {
        if (pc.generator_id === 'Copier') {
          if (!pc.customization_args.parse_with_jinja) {
            newParams[pc.name] = pc.customization_args.value;
          } else {
            var paramValue = expressionInterpolationService.processUnicode(
              pc.customization_args.value, [newParams].concat(envs));
            if (paramValue === null) {
              return false;
            }
            newParams[pc.name] = paramValue;
          }
        } else {
          // RandomSelector.
          newParams[pc.name] = randomFromArray(
            pc.customization_args.list_of_values);
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
      return expressionInterpolationService.processHtml(
        newState.content[0].value, envs);
    };

    // This should only be called when 'exploration' is non-null.
    var _loadInitialState = function(successCallback) {
      var initialState = exploration.getInitialState();

      var oldParams = LearnerParamsService.getAllParams();
      var newParams = makeParams(
        oldParams, initialState.paramChanges, [oldParams]);
      if (newParams === null) {
        alertsService.addWarning('Expression parsing error.');
        return;
      }

      var questionHtml = makeQuestion(initialState, [newParams]);
      if (questionHtml === null) {
        alertsService.addWarning('Expression parsing error.');
        return;
      }

      if (!_editorPreviewMode) {
        StatsReportingService.recordExplorationStarted(
          exploration.initStateName, newParams);
      }

      $rootScope.$broadcast('playerStateChange');
      successCallback(exploration, questionHtml, newParams);
    };

    // Initialize the parameters in the exploration as specified in the
    // exploration-level initial parameter changes list, followed by any
    // manual parameter changes (in editor preview mode).
    var initParams = function(manualParamChanges) {
      var baseParams = {};
      for (var paramName in exploration.paramSpecs) {
        // TODO(sll): This assumes all parameters are of type
        // UnicodeString. We should generalize this to other default values
        // for different types of parameters.
        baseParams[paramName] = '';
      }

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
      populateExploration: function(explorationData, manualParamChanges) {
        if (_editorPreviewMode) {
          exploration = ExplorationObjectFactory.create(explorationData);
          initParams(manualParamChanges);
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
        playerTranscriptService.init();

        if (_editorPreviewMode) {
          if (exploration) {
            _loadInitialState(successCallback);
          } else {
            alertsService.addWarning(
              'Could not initialize exploration, because it was not yet ' +
              'populated.');
          }
        } else {
          var explorationDataUrl = (
            '/explorehandler/init/' + _explorationId +
            (version ? '?v=' + version : ''));
          $http.get(explorationDataUrl).then(function(response) {
            var data = response.data;
            exploration = ExplorationObjectFactory.create(data.exploration);
            version = data.version;

            initParams([]);

            StatsReportingService.initSession(
              _explorationId, data.version, data.session_id,
              GLOBALS.collectionId);

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
      getInteractionHtml: function(stateName, labelForFocusTarget) {
        var interactionId = exploration.getInteractionId(stateName);
        if (!interactionId) {
          return null;
        }

        return oppiaExplorationHtmlFormatterService.getInteractionHtml(
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
        var oldState = exploration.getState(
          playerTranscriptService.getLastStateName());

        answerClassificationService.getMatchingClassificationResult(
          _explorationId, oldState, answer, false, interactionRulesService
        ).then(function(classificationResult) {
          if (!_editorPreviewMode) {
            StatsReportingService.recordAnswerSubmitted(
              playerTranscriptService.getLastStateName(),
              LearnerParamsService.getAllParams(),
              answer,
              classificationResult.answerGroupIndex,
              classificationResult.ruleSpecIndex);
          }

          var outcome = classificationResult.outcome;
          // If this is a return to the same state, and the resubmission trigger
          // kicks in, replace the dest, feedback and param changes with that
          // of the trigger.
          if (outcome.dest === playerTranscriptService.getLastStateName()) {
            for (var i = 0; i < oldState.interaction.fallbacks.length; i++) {
              var fallback = oldState.interaction.fallbacks[i];
              if (fallback.trigger.trigger_type == 'NthResubmission' &&
                  fallback.trigger.customization_args.num_submits.value ===
                    playerTranscriptService.getNumSubmitsForLastCard()) {
                outcome.dest = fallback.outcome.dest;
                outcome.feedback = fallback.outcome.feedback;
                outcome.param_changes = fallback.outcome.param_changes;
                break;
              }
            }
          }

          var newStateName = outcome.dest;
          var newState = exploration.getState(newStateName);

          // Compute the data for the next state.
          var oldParams = LearnerParamsService.getAllParams();
          oldParams.answer = answer;
          var feedbackHtml = makeFeedback(outcome.feedback, [oldParams]);
          if (feedbackHtml === null) {
            answerIsBeingProcessed = false;
            alertsService.addWarning('Expression parsing error.');
            return;
          }

          var newParams = (
            newState ? makeParams(
              oldParams, newState.paramChanges, [oldParams]) : oldParams);
          if (newParams === null) {
            answerIsBeingProcessed = false;
            alertsService.addWarning('Expression parsing error.');
            return;
          }

          var questionHtml = makeQuestion(newState, [newParams, {
            answer: 'answer'
          }]);
          if (questionHtml === null) {
            answerIsBeingProcessed = false;
            alertsService.addWarning('Expression parsing error.');
            return;
          }

          // TODO(sll): Remove the 'answer' key from newParams.
          newParams.answer = answer;

          answerIsBeingProcessed = false;

          var oldStateName = playerTranscriptService.getLastStateName();
          var refreshInteraction = (
            oldStateName !== newStateName ||
            exploration.isInteractionInline(oldStateName));

          if (!_editorPreviewMode) {
            StatsReportingService.recordStateTransition(
              oldStateName, newStateName, answer,
              LearnerParamsService.getAllParams());

            if (exploration.isStateTerminal(newStateName)) {
              StatsReportingService.recordExplorationCompleted(
                newStateName, LearnerParamsService.getAllParams());
            }
          }

          $rootScope.$broadcast('updateActiveStateIfInEditor', newStateName);
          $rootScope.$broadcast('playerStateChange');
          successCallback(
            newStateName, refreshInteraction, feedbackHtml, questionHtml,
            newParams);
        });
      },
      isAnswerBeingProcessed: function() {
        return answerIsBeingProcessed;
      },
      // Returns a promise for the user profile picture, or the default image if
      // user is not logged in or has not uploaded a profile picture, or the
      // player is in preview mode.
      getUserProfileImage: function() {
        var DEFAULT_PROFILE_IMAGE_PATH = '/images/avatar/user_blue_72px.png';
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
      }
    };
  }
]);
