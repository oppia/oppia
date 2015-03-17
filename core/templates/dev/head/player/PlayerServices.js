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
 * @fileoverview Controllers for the learner's view of an exploration.
 *
 * @author sll@google.com (Sean Lip)
 */

// The conditioning on window.GLOBALS is because Karma does not appear to see GLOBALS.
oppia.constant('INTERACTION_SPECS', window.GLOBALS ? GLOBALS.INTERACTION_SPECS : {});

// A simple service that provides stopwatch instances. Each stopwatch can be
// independently reset and queried for the current time.
oppia.factory('stopwatchProviderService', ['$log', function($log) {
  var Stopwatch = function() {
    this._startTime = null;
  };

  Stopwatch.prototype = {
    _getCurrentTime: function() {
      return Date.now();
    },
    resetStopwatch: function() {
      this._startTime = this._getCurrentTime();
    },
    getTimeInSecs: function() {
      if (this._startTime === null) {
        $log.error(
          'Tried to retrieve the elapsed time, but no start time was set.');
        return null;
      }
      return (this._getCurrentTime() - this._startTime) / 1000;
    }
  };

  return {
    getInstance: function() {
      return new Stopwatch();
    }
  };
}]);

// A service that maintains the current set of parameters for the learner.
oppia.factory('learnerParamsService', ['$log', function($log) {
  var _paramDict = {};

  return {
    // TODO(sll): Forbid use of 'answer', 'choices' as possible keys.
    init: function(initParamSpecs) {
      // initParamSpecs is a dict mapping the parameter names used in the
      // exploration to their default values.
      _paramDict = angular.copy(initParamSpecs);
    },
    getValue: function(paramName) {
      if (!_paramDict.hasOwnProperty(paramName)) {
        throw 'Invalid parameter name: ' + paramName;
      } else {
        return angular.copy(_paramDict[paramName]);
      }
    },
    setValue: function(paramName, newParamValue) {
      // TODO(sll): Currently, all parameters are strings. In the future, we
      // will need to maintain information about parameter types.
      if (!_paramDict.hasOwnProperty(paramName)) {
        throw 'Cannot set unknown parameter: ' + paramName;
      } else {
        _paramDict[paramName] = String(newParamValue);
      }
    },
    getAllParams: function() {
      return angular.copy(_paramDict);
    }
  };
}]);

// A service that, given an answer, classifies it and returns the corresponding
// ruleSpec.
oppia.factory('answerClassificationService', [
    '$http', '$q', 'learnerParamsService', function($http, $q, learnerParamsService) {
  var _USE_CLIENT_SIDE_CLASSIFICATION = false;

  return {
    // Returns a promise with the corresponding ruleSpec.
    getMatchingRuleSpec: function(explorationId, expParamSpecs, oldState, handler, answer) {
      if (!_USE_CLIENT_SIDE_CLASSIFICATION) {
        var classifyUrl = '/explorehandler/classify/' + explorationId;
        return $http.post(classifyUrl, {
          exp_param_specs: expParamSpecs,
          old_state: oldState,
          handler: handler,
          params: learnerParamsService.getAllParams(),
          answer: answer
        });
      }
    }
  };
}]);

// A service that provides a number of utility functions for JS used by
// individual player skins.
// Note that this service is used both in the learner and the editor views.
// The URL determines which of these it is. Some methods may need to be
// implemented differently depending on whether the skin is being played
// in the learner view, or whether it is being previewed in the editor view.
//
// TODO(sll): Make this read from a local client-side copy of the exploration
// and audit it to ensure it behaves differently for learner mode and editor
// mode. Add tests to ensure this.
oppia.factory('oppiaPlayerService', [
    '$http', '$rootScope', '$modal', '$filter', '$q', 'messengerService',
    'stopwatchProviderService', 'learnerParamsService', 'warningsData',
    'oppiaHtmlEscaper', 'answerClassificationService', 'stateTransitionService',
    'INTERACTION_SPECS',
    function(
      $http, $rootScope, $modal, $filter, $q, messengerService,
      stopwatchProviderService, learnerParamsService, warningsData,
      oppiaHtmlEscaper, answerClassificationService, stateTransitionService,
      INTERACTION_SPECS) {
  var _END_DEST = 'END';
  var _INTERACTION_DISPLAY_MODE_INLINE = 'inline';
  var _NULL_INTERACTION_HTML = (
    '<span style="color: red;"><strong>Error</strong>: No interaction specified.</span>');

  // Note that both of these do not get set for the Karma unit tests.
  var _explorationId = null;
  var _editorPreviewMode = null;
  // The pathname should be one of the following:
  //   -   /explore/{exploration_id}
  //   -   /create/{exploration_id}
  var pathnameArray = window.location.pathname.split('/');
  for (var i = 0; i < pathnameArray.length; i++) {
    if (pathnameArray[i] === 'explore') {
      _explorationId = pathnameArray[i + 1];
      _editorPreviewMode = false;
      break;
    } else if (pathnameArray[i] === 'create') {
      _explorationId = pathnameArray[i + 1];
      _editorPreviewMode = true;
      break;
    }
  }

  var _introCardImageUrl = null;

  // The following line is needed for image displaying to work, since the image
  // URLs refer to $rootScope.explorationId.
  $rootScope.explorationId = _explorationId;

  var version = GLOBALS.explorationVersion;
  var explorationDataUrl = (
    '/explorehandler/init/' + _explorationId + (version ? '?v=' + version : ''));
  var sessionId = null;
  var _isLoggedIn = false;
  var _exploration = null;

  learnerParamsService.init({});
  var stateHistory = [];
  var _currentStateName = null;
  var answerIsBeingProcessed = false;
  var _viewerHasEditingRights = false;

  var _updateStatus = function(newParams, newStateName) {
    // TODO(sll): Do this more incrementally.
    learnerParamsService.init(newParams);
    _currentStateName = newStateName;
    stateHistory.push(_currentStateName);
  };

  // TODO(sll): Move this (and the corresponding code in the exploration editor) to
  // a common standalone service.
  var _getInteractionHtml = function(interactionId, interactionCustomizationArgSpecs, labelForFocusTarget) {
    if (!interactionId) {
      return _NULL_INTERACTION_HTML;
    }

    var el = $(
      '<oppia-interactive-' + $filter('camelCaseToHyphens')(interactionId) + '>');

    for (var caSpecName in interactionCustomizationArgSpecs) {
      var caSpecValue = interactionCustomizationArgSpecs[caSpecName].value;
      // TODO(sll): Evaluate any values here that correspond to expressions.
      el.attr(
        $filter('camelCaseToHyphens')(caSpecName) + '-with-value',
        oppiaHtmlEscaper.objToEscapedJson(caSpecValue));
    }

    if (labelForFocusTarget) {
      el.attr('label-for-focus-target', labelForFocusTarget);
    }

    return ($('<div>').append(el)).html();
  };

  var stopwatch = stopwatchProviderService.getInstance();

  var _onStateTransitionProcessed = function(
      newStateName, newParams, newQuestionHtml, newFeedbackHtml, answer,
      handler, successCallback) {
    var oldStateName = _currentStateName;
    var oldStateInteractionId = _exploration.states[oldStateName].interaction.id;

    var refreshInteraction = (
      oldStateName !== newStateName ||
      INTERACTION_SPECS[oldStateInteractionId].display_mode ===
        _INTERACTION_DISPLAY_MODE_INLINE);

    if (!_editorPreviewMode) {
      // Record the state hit to the event handler.
      var stateHitEventHandlerUrl = '/explorehandler/state_hit_event/' + _explorationId;
      $http.post(stateHitEventHandlerUrl, {
        new_state_name: newStateName,
        exploration_version: version,
        session_id: sessionId,
        client_time_spent_in_secs: stopwatch.getTimeInSecs(),
        old_params: learnerParamsService.getAllParams()
      });

      // Broadcast the state hit to the parent page.
      messengerService.sendMessage(messengerService.STATE_TRANSITION, {
        oldStateName: _currentStateName,
        jsonAnswer: JSON.stringify(answer),
        newStateName: newStateName ? newStateName : 'END'
      });
    }

    _updateStatus(newParams, newStateName);
    stopwatch.resetStopwatch();

    // NB: This may be undefined if newStateName === END_DEST.
    var newStateData = _exploration.states[newStateName];
    if (newStateData) {
      learnerParamsService.init(newParams);
    }

    // NB: This may be undefined if newStateName === END_DEST.
    var newInteractionId = newStateData ? newStateData.interaction.id : undefined;

    $rootScope.$broadcast('playerStateChange');

    successCallback(
      newStateName, refreshInteraction, newFeedbackHtml,
      newQuestionHtml, newInteractionId);
  };

  var _onInitialStateProcessed = function(initStateName, initHtml, newParams, callback) {
    stopwatch.resetStopwatch();
    _updateStatus(newParams, initStateName);
    $rootScope.$broadcast('playerStateChange');
    callback(initStateName, initHtml, _viewerHasEditingRights, _introCardImageUrl);
  };

  // This should only be called when _exploration is non-null.
  var _loadInitialState = function(successCallback) {
    var initStateName = _exploration.init_state_name;
    var initStateData = stateTransitionService.getInitStateData(
      _exploration.param_specs, _exploration.param_changes,
      _exploration.states[initStateName]);

    if (initStateData) {
      if (!_editorPreviewMode) {
        // Record that the exploration was started.
        var startExplorationEventHandlerUrl = (
          '/explorehandler/exploration_start_event/' + _explorationId);
        $http.post(startExplorationEventHandlerUrl, {
          params: initStateData.params,
          session_id: sessionId,
          state_name: initStateName,
          version: version
        });

        // Record the state hit to the event handler.
        var stateHitEventHandlerUrl = '/explorehandler/state_hit_event/' + _explorationId;
        $http.post(stateHitEventHandlerUrl, {
          client_time_spent_in_secs: 0.0,
          exploration_version: version,
          new_state_name: initStateName,
          old_params: initStateData.params,
          session_id: sessionId
        });
      }

      _onInitialStateProcessed(
        initStateName, initStateData.question_html, initStateData.params,
        successCallback);
    } else {
      warningsData.addWarning('Expression parsing error.');
    }
  };

  return {
    // This should only be used in editor preview mode.
    populateExploration: function(exploration) {
      if (_editorPreviewMode) {
        _exploration = exploration;
      } else {
        throw 'Error: cannot populate exploration in learner mode.';
      }
    },
    /**
     * Initializes an exploration, passing the data for the first state to
     * successCallback.
     *
     * In editor preview mode, populateExploration() should be called before
     * calling init().
     *
     * @param {function} successCallback The function to execute after the initial
     *   exploration data is successfully loaded. This function will be passed two
     *   arguments:
     *   - stateName {string}, the name of the first state
     *   - initHtml {string}, an HTML string representing the content of the first
     *       state.
     */
    init: function(successCallback) {
      answerIsBeingProcessed = false;

      if (_editorPreviewMode) {
        if (_exploration) {
          _introCardImageUrl = (
            '/images/gallery/exploration_background_' +
            (GLOBALS.CATEGORIES_TO_COLORS[_exploration.category] || 'teal') +
            '_large.png');
          _loadInitialState(successCallback);
        }
      } else {
        $http.get(explorationDataUrl).success(function(data) {
          _exploration = data.exploration;
          _introCardImageUrl = data.intro_card_image_url;
          version = data.version,
          _isLoggedIn = data.is_logged_in;
          sessionId = data.session_id;
          _viewerHasEditingRights = data.can_edit;
          _loadInitialState(successCallback);
          $rootScope.$broadcast('playerServiceInitialized');
        }).error(function(data) {
          warningsData.addWarning(
            data.error || 'There was an error loading the exploration.');
        });
      }
    },
    getExplorationId: function() {
      return _explorationId;
    },
    getExplorationTitle: function() {
      return _exploration.title;
    },
    getCurrentStateName: function() {
      return _currentStateName;
    },
    getInteractionHtml: function(stateName, labelForFocusTarget) {
      return _getInteractionHtml(
        _exploration.states[stateName].interaction.id,
        _exploration.states[stateName].interaction.customization_args,
        labelForFocusTarget);
    },
    isInteractionInline: function(stateName) {
      var interactionId = _exploration.states[stateName].interaction.id;
      return (
        interactionId &&
        INTERACTION_SPECS[interactionId].display_mode ===
          _INTERACTION_DISPLAY_MODE_INLINE);
    },
    isStateTerminal: function(stateName) {
      return !stateName || INTERACTION_SPECS[
        _exploration.states[stateName].interaction.id].is_terminal;
    },
    getRandomSuffix: function() {
      // This is a bit of a hack. When a refresh to a $scope variable happens,
      // AngularJS compares the new value of the variable to its previous value.
      // If they are the same, then the variable is not updated. Appending a random
      // suffix makes the new value different from the previous one, and
      // thus indirectly forces a refresh.
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
    getAnswerAsHtml: function(answer) {
      var currentInteraction = _exploration.states[_currentStateName].interaction;
      var currentInteractionId = currentInteraction.id;

      // TODO(sll): Get rid of this special case for multiple choice.
      var currentInteractionChoices = null;
      if (currentInteraction.customization_args.choices) {
        currentInteractionChoices = currentInteraction.customization_args.choices.value;
      }

      var el = $(
        '<oppia-response-' + $filter('camelCaseToHyphens')(currentInteractionId) + '>');
      el.attr('answer', oppiaHtmlEscaper.objToEscapedJson(answer));
      if (currentInteractionChoices) {
        el.attr('choices', oppiaHtmlEscaper.objToEscapedJson(currentInteractionChoices));
      }
      return ($('<div>').append(el)).html();
    },
    submitAnswer: function(answer, handler, successCallback) {
      if (answerIsBeingProcessed) {
        return;
      }

      answerIsBeingProcessed = true;
      var oldState = angular.copy(_exploration.states[_currentStateName]);

      answerClassificationService.getMatchingRuleSpec(
        _explorationId, _exploration.param_specs, oldState, handler, answer
      ).success(function(ruleSpec) {
        if (!_editorPreviewMode) {
          var answerRecordingUrl = (
            '/explorehandler/answer_submitted_event/' + _explorationId);
          $http.post(answerRecordingUrl, {
            answer: answer,
            handler: handler,
            params: learnerParamsService.getAllParams(),
            version: version,
            old_state_name: _currentStateName,
            rule_spec: ruleSpec
          });
        }

        var finished = (ruleSpec.dest === 'END');
        var newStateName = finished ? null : ruleSpec.dest;

        // Compute the client evaluation result. This may be null if there are
        // malformed expressions.
        var clientEvalResult = stateTransitionService.getNextStateData(
          ruleSpec,
          finished ? null : _exploration.states[newStateName],
          answer);

        if (clientEvalResult) {
          clientEvalResult['state_name'] = newStateName;
          answerIsBeingProcessed = false;
          _onStateTransitionProcessed(
            clientEvalResult.state_name, clientEvalResult.params,
            clientEvalResult.question_html, clientEvalResult.feedback_html,
            answer, handler, successCallback);
        } else {
          answerIsBeingProcessed = false;
          warningsData.addWarning('Expression parsing error.');
        }
      });
    },
    isAnswerBeingProcessed: function() {
      return answerIsBeingProcessed;
    },
    registerMaybeLeaveEvent: function() {
      var maybeLeaveExplorationUrl = (
        '/explorehandler/exploration_maybe_leave_event/' + _explorationId);
      $http.post(maybeLeaveExplorationUrl, {
        client_time_spent_in_secs: stopwatch.getTimeInSecs(),
        params: learnerParamsService.getAllParams(),
        session_id: sessionId,
        state_name: stateHistory[stateHistory.length - 1],
        version: version
      });
    },
    // If the feedback is exploration-scoped, 'stateName' should be null.
    openPlayerFeedbackModal: function(stateName) {
      var modalConfig = {
        templateUrl: 'modals/playerFeedback',
        backdrop: true,
        resolve: {
          stateName: function() {
            return stateName;
          }
        },
        controller: ['$scope', '$modalInstance', 'oppiaPlayerService', 'stateName', function(
            $scope, $modalInstance, oppiaPlayerService, stateName) {
          $scope.isLoggedIn = oppiaPlayerService.isLoggedIn();

          $scope.isSubmitterAnonymized = false;
          $scope.stateName = stateName;
          $scope.subject = '';
          $scope.feedback = '';

          $scope.submit = function(subject, feedback, isSubmitterAnonymized) {
            $modalInstance.close({
              subject: subject,
              feedback: feedback,
              isSubmitterAnonymized: isSubmitterAnonymized
            });
          };

          $scope.cancel = function() {
            $modalInstance.dismiss('cancel');
          };
        }]
      };

      $modal.open(modalConfig).result.then(function(result) {
        if (result.feedback) {
          $http.post('/explorehandler/give_feedback/' + _explorationId, {
            subject: result.subject,
            feedback: result.feedback,
            include_author: !result.isSubmitterAnonymized && _isLoggedIn,
            state_name: stateName
          });

          $modal.open({
            templateUrl: 'modals/playerFeedbackConfirmation',
            backdrop: true,
            controller: ['$scope', '$modalInstance', function($scope, $modalInstance) {
              $scope.cancel = function() {
                $modalInstance.dismiss('cancel');
              };
            }]
          });
        }
      });
    },
    // Returns a promise for the user profile picture, or the default image if
    // user is not logged in or has not uploaded a profile picture, or the
    // player is in preview mode.
    getUserProfileImage: function() {
      var DEFAULT_PROFILE_IMAGE_PATH = '/images/general/user_mint_48px.png';
      var deferred = $q.defer();
      if (_isLoggedIn && !_editorPreviewMode) {
        $http.get('/preferenceshandler/profile_picture').success(function(data) {
          var profilePictureDataUrl = data.profile_picture_data_url;
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
}]);


oppia.factory('ratingService', [
    '$http', '$rootScope', 'oppiaPlayerService',
    function($http, $rootScope, oppiaPlayerService) {
  var explorationId = oppiaPlayerService.getExplorationId();
  var ratingsUrl = '/explorehandler/rating/' + explorationId;
  var userRating;
  return {
    init: function(successCallback) {
      $http.get(ratingsUrl).success(function(data) {
        successCallback(data.user_rating);
        userRating = data.user_rating;
        $rootScope.$broadcast('ratingServiceInitialized');
      });
    },
    submitUserRating: function(ratingValue) {
      $http.put(ratingsUrl, {
        user_rating: ratingValue
      });
      userRating = ratingValue;
      $rootScope.$broadcast('ratingUpdated');
    },
    getUserRating: function() {
      return userRating;
    }
  };
}]);


oppia.controller('LearnerLocalNav', [
    '$scope', '$http', '$modal',
    'oppiaPlayerService', 'embedExplorationButtonService', 'ratingService',
    function(
      $scope, $http, $modal,
      oppiaPlayerService, embedExplorationButtonService, ratingService) {
  var _END_DEST = 'END';

  $scope.explorationId = oppiaPlayerService.getExplorationId();
  $scope.serverName = window.location.protocol + '//' + window.location.host;

  $scope.$on('playerServiceInitialized', function() {
    $scope.isLoggedIn = oppiaPlayerService.isLoggedIn();
  });
  $scope.$on('ratingServiceInitialized', function() {
    $scope.userRating = ratingService.getUserRating();
  })

  $scope.showEmbedExplorationModal = embedExplorationButtonService.showModal;

  $scope.showFeedbackModal = function() {
    oppiaPlayerService.openPlayerFeedbackModal(null);
  };

  $scope.submitUserRating = function(ratingValue) {
    $scope.userRating = ratingValue;
    ratingService.submitUserRating(ratingValue);
  };
  $scope.$on('ratingUpdated', function() {
    $scope.userRating = ratingService.getUserRating();
  });
}]);
