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
oppia.constant('GADGET_SPECS', window.GLOBALS ? GLOBALS.GADGET_SPECS : {});
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
    'extensionTagAssemblerService', 'INTERACTION_SPECS',
    function(
      $http, $rootScope, $modal, $filter, $q, messengerService,
      stopwatchProviderService, learnerParamsService, warningsData,
      oppiaHtmlEscaper, answerClassificationService, stateTransitionService,
      extensionTagAssemblerService, INTERACTION_SPECS) {
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

    el = extensionTagAssemblerService.formatCustomizationArgAttributesForElement(
      el, interactionCustomizationArgSpecs);

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

      if (newStateName) {
        $http.post(stateHitEventHandlerUrl, {
          new_state_name: newStateName,
          exploration_version: version,
          session_id: sessionId,
          client_time_spent_in_secs: stopwatch.getTimeInSecs(),
          old_params: learnerParamsService.getAllParams()
        });
      }

      // If the new state contains a terminal interaction, record a completion
      // event.
      if (!newStateName ||
          INTERACTION_SPECS[
            _exploration.states[newStateName].interaction.id].is_terminal) {
        var completeExplorationUrl = (
          '/explorehandler/exploration_complete_event/' + _explorationId);
        $http.post(completeExplorationUrl, {
          client_time_spent_in_secs: stopwatch.getTimeInSecs(),
          params: learnerParamsService.getAllParams(),
          session_id: sessionId,
          state_name: newStateName,
          version: version
        });
      }

      // Broadcast the state hit to the parent page.
      messengerService.sendMessage(messengerService.STATE_TRANSITION, {
        oldStateName: _currentStateName,
        jsonAnswer: JSON.stringify(answer),
        newStateName: newStateName ? newStateName : 'END'
      });
    }

    _updateStatus(newParams, newStateName);
    stopwatch.resetStopwatch();

    var newStateData = _exploration.states[newStateName];
    var newInteractionId = newStateData.interaction.id;

    $rootScope.$broadcast('playerStateChange');

    successCallback(
      newStateName, refreshInteraction, newFeedbackHtml,
      newQuestionHtml, newInteractionId);
  };

  var _registerMaybeLeaveEvent = function(stateName) {
    var maybeLeaveExplorationUrl = (
      '/explorehandler/exploration_maybe_leave_event/' + _explorationId);
    $http.post(maybeLeaveExplorationUrl, {
      client_time_spent_in_secs: stopwatch.getTimeInSecs(),
      params: learnerParamsService.getAllParams(),
      session_id: sessionId,
      state_name: stateName,
      version: version
    });
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
    getGadgetPanelsContents: function() {
      return angular.copy(_exploration.skin_customizations.panels_contents);
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

        var newStateName = ruleSpec.dest;

        // Compute the data for the next state. This may be null if there are
        // malformed expressions.
        var nextStateData = stateTransitionService.getNextStateData(
          ruleSpec,
          _exploration.states[newStateName],
          answer);

        if (nextStateData) {
          nextStateData['state_name'] = newStateName;
          answerIsBeingProcessed = false;
          _onStateTransitionProcessed(
            nextStateData.state_name, nextStateData.params,
            nextStateData.question_html, nextStateData.feedback_html,
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
      _registerMaybeLeaveEvent(stateHistory[stateHistory.length - 1]);
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
    '$scope', '$http', '$modal', 'oppiaHtmlEscaper',
    'oppiaPlayerService', 'embedExplorationButtonService', 'ratingService',
    function(
      $scope, $http, $modal, oppiaHtmlEscaper,
      oppiaPlayerService, embedExplorationButtonService, ratingService) {
  $scope.explorationId = oppiaPlayerService.getExplorationId();
  $scope.serverName = window.location.protocol + '//' + window.location.host;
  $scope.escapedTwitterText = oppiaHtmlEscaper.unescapedStrToEscapedStr(
    GLOBALS.SHARING_OPTIONS_TWITTER_TEXT);

  $scope.$on('playerServiceInitialized', function() {
    $scope.isLoggedIn = oppiaPlayerService.isLoggedIn();
  });
  $scope.$on('ratingServiceInitialized', function() {
    $scope.userRating = ratingService.getUserRating();
  });

  $scope.showEmbedExplorationModal = embedExplorationButtonService.showModal;

  $scope.submitUserRating = function(ratingValue) {
    $scope.userRating = ratingValue;
    ratingService.submitUserRating(ratingValue);
  };
  $scope.$on('ratingUpdated', function() {
    $scope.userRating = ratingService.getUserRating();
  });
}]);


// This directive is unusual in that it should only be invoked indirectly, as
// follows:
//
// <some-html-element popover-placement="bottom" popover-template="popover/feedback"
//                    popover-trigger="click" state-name="<[STATE_NAME]>">
// </some-html-element>
//
// The state-name argument is optional. If it is not provided, the feedback is
// assumed to apply to the exploration as a whole.
oppia.directive('feedbackPopup', ['oppiaPlayerService', function(oppiaPlayerService) {
  return {
    restrict: 'E',
    scope: {},
    templateUrl: 'components/feedback',
    controller: [
        '$scope', '$element', '$http', '$timeout', 'focusService', 'warningsData',
        function($scope, $element, $http, $timeout, focusService, warningsData) {
      $scope.feedbackText = '';
      $scope.isSubmitterAnonymized = false;
      $scope.isLoggedIn = oppiaPlayerService.isLoggedIn();
      $scope.feedbackSubmitted = false;
      // We generate a random id since there may be multiple popover elements
      // on the same page.
      $scope.feedbackPopoverId = (
        'feedbackPopover' + Math.random().toString(36).slice(2));

      focusService.setFocus($scope.feedbackPopoverId);

      var feedbackUrl = (
        '/explorehandler/give_feedback/' + oppiaPlayerService.getExplorationId());

      var getTriggerElt = function() {
        // Find the popover trigger node (the one with a popover-template
        // attribute). This is also the DOM node that contains the state name.
        // Since the popover DOM node is inserted as a sibling to the node, we
        // therefore climb up the DOM tree until we find the top-level popover
        // element. The trigger will be one of its siblings.
        //
        // If the trigger element cannot be found, a value of undefined is
        // returned. This could happen if the trigger is clicked while the
        // feedback confirmation message is being displayed.
        var elt = $element;
        var popoverChildElt = null;
        for (var i = 0; i < 10; i++) {
          elt = elt.parent();
          if (elt.attr('template')) {
            popoverChildElt = elt;
            break;
          }
        }
        if (!popoverChildElt) {
          console.log('Could not close popover element.');
          return undefined;
        }

        var popoverElt = popoverChildElt.parent();
        var triggerElt = null;
        var childElts = popoverElt.children();
        for (var i = 0; i < childElts.length; i++) {
          var childElt = $(childElts[i]);
          if (childElt.attr('popover-template')) {
            triggerElt = childElt;
            break;
          }
        }

        if (!triggerElt) {
          console.log('Could not find popover trigger.');
          return undefined;
        }

        return triggerElt;
      };

      $scope.saveFeedback = function() {
        if ($scope.feedbackText) {
          $http.post(feedbackUrl, {
            subject: '(Feedback from a learner)',
            feedback: $scope.feedbackText,
            include_author: !$scope.isSubmitterAnonymized && $scope.isLoggedIn,
            state_name: getTriggerElt().attr('state-name')
          });
        }

        $scope.feedbackSubmitted = true;
        $timeout(function() {
          var triggerElt = getTriggerElt();
          if (triggerElt) {
            triggerElt.trigger('click');
          }
        }, 2000);
      };

      $scope.closePopover = function() {
        // Closing the popover is done by clicking on the popover trigger.
        // The timeout is needed to postpone the click event to
        // the subsequent digest cycle. Otherwise, an "$apply already
        // in progress" error is raised.
        $timeout(function() {
          getTriggerElt().trigger('click');
        });
      };
    }]
  };
}]);
