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

oppia.constant('GADGET_SPECS', GLOBALS.GADGET_SPECS);
oppia.constant('INTERACTION_SPECS', GLOBALS.INTERACTION_SPECS);

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
    '$http', '$rootScope', '$modal', '$filter', '$q', '$log', 'messengerService',
    'stopwatchProviderService', 'learnerParamsService', 'warningsData',
    'answerClassificationService', 'extensionTagAssemblerService',
    'explorationContextService', 'PAGE_CONTEXT',
    'oppiaExplorationHtmlFormatterService', 'playerTranscriptService',
    'ExplorationObjectFactory', 'expressionInterpolationService',
    function(
      $http, $rootScope, $modal, $filter, $q, $log, messengerService,
      stopwatchProviderService, learnerParamsService, warningsData,
      answerClassificationService, extensionTagAssemblerService,
      explorationContextService, PAGE_CONTEXT,
      oppiaExplorationHtmlFormatterService, playerTranscriptService,
      ExplorationObjectFactory, expressionInterpolationService) {
  var _explorationId = explorationContextService.getExplorationId();
  var _editorPreviewMode = (
    explorationContextService.getPageContext() === PAGE_CONTEXT.EDITOR);
  var _infoCardImageUrl = null;
  var _explorationObjective = null;
  var _explorationTags = [];
  var _explorationContributorUsernames = [];
  var _explorationLastUpdatedMsec = null;
  var _viewersCount = null;
  var _currentRatings = {};

  var version = GLOBALS.explorationVersion;
  var explorationDataUrl = (
    '/explorehandler/init/' + _explorationId + (version ? '?v=' + version : ''));
  var sessionId = null;
  var _isLoggedIn = GLOBALS.userIsLoggedIn;
  var exploration = null;
  var _collection_id = GLOBALS.collectionId;

  learnerParamsService.init({});
  var answerIsBeingProcessed = false;
  var _viewerHasEditingRights = false;
  var _stopwatch = stopwatchProviderService.getInstance();

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

  var _onStateTransitionProcessed = function(
      newStateName, newParams, newQuestionHtml, newFeedbackHtml, answer,
      successCallback) {
    var oldStateName = playerTranscriptService.getLastStateName();
    var refreshInteraction = (
      oldStateName !== newStateName ||
      exploration.isInteractionInline(oldStateName));

    if (!_editorPreviewMode) {
      // Record the state hit to the event handler.
      var stateHitEventHandlerUrl = '/explorehandler/state_hit_event/' + _explorationId;

      $http.post(stateHitEventHandlerUrl, {
        new_state_name: newStateName,
        exploration_version: version,
        session_id: sessionId,
        client_time_spent_in_secs: _stopwatch.getTimeInSecs(),
        old_params: learnerParamsService.getAllParams()
      });

      // Broadcast information about the state transition to listeners.
      messengerService.sendMessage(messengerService.STATE_TRANSITION, {
        explorationVersion: version,
        oldStateName: playerTranscriptService.getLastStateName(),
        jsonAnswer: JSON.stringify(answer),
        newStateName: newStateName,
        paramValues: learnerParamsService.getAllParams()
      });

      // If the new state contains a terminal interaction, record a completion
      // event, and inform the parent page that a completion has happened.
      if (exploration.isStateTerminal(newStateName)) {
        messengerService.sendMessage(messengerService.EXPLORATION_COMPLETED, {
          explorationVersion: version,
          paramValues: learnerParamsService.getAllParams()
        });

        var completeExplorationUrl = (
          '/explorehandler/exploration_complete_event/' + _explorationId);
        $http.post(completeExplorationUrl, {
          client_time_spent_in_secs: _stopwatch.getTimeInSecs(),
          params: learnerParamsService.getAllParams(),
          session_id: sessionId,
          state_name: newStateName,
          version: version,
          collection_id: _collection_id,
        });
      }
    }

    _stopwatch.resetStopwatch();

    $rootScope.$broadcast('playerStateChange');
    successCallback(
      newStateName, refreshInteraction, newFeedbackHtml, newQuestionHtml,
      newParams);
  };

  // This should only be called when 'exploration' is non-null.
  var _loadInitialState = function(successCallback) {
    var initialState = exploration.getInitialState();

    var baseParams = {};
    for (var paramName in exploration.paramSpecs) {
      // TODO(sll): This assumes all parameters are of type UnicodeString.
      // We should generalize this to other default values for different
      // types of parameters.
      baseParams[paramName] = '';
    }

    var startingParams = makeParams(
      baseParams,
      exploration.paramChanges.concat(initialState.paramChanges),
      [baseParams]);
    if (startingParams === null) {
      warningsData.addWarning('Expression parsing error.');
      return;
    }

    var questionHtml = makeQuestion(initialState, [startingParams]);
    if (questionHtml === null) {
      warningsData.addWarning('Expression parsing error.');
      return;
    }

    if (!_editorPreviewMode) {
      // Record that the exploration was started.
      var startExplorationEventHandlerUrl = (
        '/explorehandler/exploration_start_event/' + _explorationId);
      $http.post(startExplorationEventHandlerUrl, {
        params: startingParams,
        session_id: sessionId,
        state_name: exploration.initStateName,
        version: version
      });

      // Record the state hit to the event handler.
      var stateHitEventHandlerUrl = '/explorehandler/state_hit_event/' + _explorationId;
      $http.post(stateHitEventHandlerUrl, {
        client_time_spent_in_secs: 0.0,
        exploration_version: version,
        new_state_name: exploration.initStateName,
        old_params: startingParams,
        session_id: sessionId
      });
    }

    _stopwatch.resetStopwatch();
    $rootScope.$broadcast('playerStateChange');
    successCallback(exploration, questionHtml, startingParams);
  };

  var _loadInitialInformationCardData = function() {

    // TODO(sll): move this and the summary handlers into a separate
    // exp_metadata.py controller.
    var infoCardStatisticsUrl = '/createhandler/statistics/' +  _explorationId + '/all';

    var deferredContributors = $q.defer();
    var deferredStatistics = $q.defer();

    $http({
      method: 'GET',
      url: '/explorationsummarieshandler/data',
      params: {
        stringified_exp_ids: JSON.stringify([_explorationId])
      }
    }).success(function(data) {
      _explorationObjective = data.summaries[0].objective;
      _explorationTags = data.summaries[0].tags;
      _currentRatings = data.summaries[0].ratings;
      _explorationContributorUsernames = data.summaries[0].contributor_names;
      _explorationLastUpdatedMsec = data.summaries[0].last_updated;
      deferredContributors.resolve(data);
    });

    // This is needed to get statistics of the exploration.
    $http.get(infoCardStatisticsUrl).success(function(data) {
      _viewersCount = data.num_starts;
      deferredStatistics.resolve(_viewersCount);
    });

    return $q.all([
      deferredStatistics.promise, deferredContributors.promise]);
  };

  return {
    // This should only be used in editor preview mode.
    populateExploration: function(explorationData) {
      if (_editorPreviewMode) {
        exploration = ExplorationObjectFactory.create(explorationData);
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
     * @param {function} successCallback The function to execute after the initial
     *   exploration data is successfully loaded. This function will be passed two
     *   arguments:
     *   - stateName {string}, the name of the first state
     *   - initHtml {string}, an HTML string representing the content of the first
     *       state.
     */
    init: function(successCallback) {
      answerIsBeingProcessed = false;
      learnerParamsService.init({});
      playerTranscriptService.init();

      if (_editorPreviewMode) {
        if (exploration) {
          _loadInitialState(successCallback);
        } else {
          warningsData.addWarning(
            'Could not initialize exploration, because it was not yet populated.');
        }
      } else {
        $http.get(explorationDataUrl).success(function(data) {
          exploration = ExplorationObjectFactory.create(data.exploration);
          _infoCardImageUrl = data.info_card_image_url;
          version = data.version,
          sessionId = data.session_id;
          _viewerHasEditingRights = data.can_edit;
          _loadInitialState(successCallback);
          _loadInitialInformationCardData();
          $rootScope.$broadcast('playerServiceInitialized');
          messengerService.sendMessage(messengerService.EXPLORATION_LOADED, {
            explorationVersion: version
          });
        });
      }
    },
    getExplorationId: function() {
      return _explorationId;
    },
    getInformationCardData: function() {
      return {
        currentRatings: _currentRatings,
        explorationTags: _explorationTags,
        infoCardImageUrl: _infoCardImageUrl,
        explorationObjective: _explorationObjective,
        explorationLastUpdatedMsec: _explorationLastUpdatedMsec,
        explorationContributorUsernames : _explorationContributorUsernames,
        viewersCount: _viewersCount
      };
    },
    getExplorationTitle: function() {
      return exploration.title;
    },
    getInteractionHtml: function(stateName, labelForFocusTarget) {
      return oppiaExplorationHtmlFormatterService.getInteractionHtml(
        exploration.getInteractionId(stateName),
        exploration.getInteractionCustomizationArgs(stateName),
        labelForFocusTarget);
    },
    getInteraction: function(stateName) {
      return exploration.getInteraction(stateName);
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
        var outcome = classificationResult.outcome;

        if (!_editorPreviewMode) {
          var answerRecordingUrl = (
            '/explorehandler/answer_submitted_event/' + _explorationId);
          $http.post(answerRecordingUrl, {
            answer: answer,
            params: learnerParamsService.getAllParams(),
            version: version,
            old_state_name: playerTranscriptService.getLastStateName(),
            answer_group_index: classificationResult.answerGroupIndex,
            rule_spec_index: classificationResult.ruleSpecIndex
          });
        }

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
        var oldParams = learnerParamsService.getAllParams();
        oldParams.answer = answer;
        var feedbackHtml = makeFeedback(outcome.feedback, [oldParams]);
        if (feedbackHtml === null) {
          answerIsBeingProcessed = false;
          warningsData.addWarning('Expression parsing error.');
          return;
        }

        var newParams = (
          newState ? makeParams(
            oldParams, newState.paramChanges, [oldParams]) : oldParams);
        if (newParams === null) {
          answerIsBeingProcessed = false;
          warningsData.addWarning('Expression parsing error.');
          return;
        }

        var questionHtml = makeQuestion(
          newState, [newParams, {answer: 'answer'}]);
        if (questionHtml === null) {
          answerIsBeingProcessed = false;
          warningsData.addWarning('Expression parsing error.');
          return;
        }

        // TODO(sll): Remove the 'answer' key from newParams.
        newParams.answer = answer;

        answerIsBeingProcessed = false;
        _onStateTransitionProcessed(
          newStateName, newParams, questionHtml, feedbackHtml, answer,
          successCallback);
      });
    },
    isAnswerBeingProcessed: function() {
      return answerIsBeingProcessed;
    },
    registerMaybeLeaveEvent: function() {
      var stateName = playerTranscriptService.getLastStateName();
      var maybeLeaveExplorationUrl = (
        '/explorehandler/exploration_maybe_leave_event/' + _explorationId);

      $http.post(maybeLeaveExplorationUrl, {
        client_time_spent_in_secs: _stopwatch.getTimeInSecs(),
        params: learnerParamsService.getAllParams(),
        session_id: sessionId,
        state_name: stateName,
        version: version
      });
    },
    // Returns a promise for the user profile picture, or the default image if
    // user is not logged in or has not uploaded a profile picture, or the
    // player is in preview mode.
    getUserProfileImage: function() {
      var DEFAULT_PROFILE_IMAGE_PATH = '/images/avatar/user_blue_72px.png';
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
    },
    getOppiaAvatarImageUrl: function() {
      return '/images/avatar/oppia_black_72px.png';
    },
    getInfoCardDataPromise: function() {
      return _loadInitialInformationCardData();
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
    function (
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
          if (!angular.isUndefined(elt.attr('popover-template-popup'))) {
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

oppia.controller('InformationCard', ['$scope', '$modal', function($scope, $modal) {

  $scope.showInformationCard = function() {

    var modalInstance = $modal.open({
      animation: true,
      templateUrl: 'popover/informationCard',
      windowClass: 'oppia-modal-information-card',
      controller: [
         '$scope', '$http', '$modal', '$modalInstance', 'oppiaPlayerService',
         'ratingService','oppiaHtmlEscaper', 'embedExplorationButtonService',
         'oppiaDatetimeFormatter', 'ratingComputationService',
         function ($scope, $http, $modal, $modalInstance, oppiaPlayerService,
                   ratingService, oppiaHtmlEscaper, embedExplorationButtonService,
                   oppiaDatetimeFormatter, ratingComputationService) {

        var _informationCardData = oppiaPlayerService.getInformationCardData();
        $scope.serverName = window.location.protocol + '//' + window.location.host;
        $scope.escapedTwitterText = oppiaHtmlEscaper.unescapedStrToEscapedStr(
          GLOBALS.SHARING_OPTIONS_TWITTER_TEXT);
        $scope.showEmbedExplorationModal = embedExplorationButtonService.showModal;

        // TODO(Barnabas) refactor getExplorationId() and getExplorationTitle()
        // to return promises.
        $scope.explorationId = oppiaPlayerService.getExplorationId();
        $scope.explorationCardTitle = oppiaPlayerService.getExplorationTitle();
        $scope.infoCardBackgroundImageCss = {
          'background-image': 'url('+ _informationCardData.infoCardImageUrl + ')'
        };
        $scope.explorationRatings = ratingComputationService.computeAverageRating(
          _informationCardData.currentRatings) || 'Unrated';

        var _explorationTagsSummary = function(arrayOfTags) {
          var _tagsToBeShown =[];
          var _tagsInTooltip = [];
          for (var i = 0; i < arrayOfTags.length; i++) {
            if ((_tagsToBeShown.toString() + arrayOfTags[i]).length < 45) {
              _tagsToBeShown.push(arrayOfTags[i]);
            } else {
              _tagsInTooltip.push(arrayOfTags[i]);
            }
          };
          return {
            tagsToBeShown: _tagsToBeShown,
            tagsInTooltip: _tagsInTooltip
          };
        };
        $scope.explorationTags = _explorationTagsSummary(
          _informationCardData.explorationTags);
        $scope.explorationDescription = _informationCardData.explorationObjective;
        $scope.explorationContributorUsernames = _informationCardData.explorationContributorUsernames;
        $scope.explorationLastUpdatedMsec = _informationCardData.explorationLastUpdatedMsec;
        $scope.getLocaleAbbreviatedDatetimeString = function(millisSinceEpoch) {
          return oppiaDatetimeFormatter.getLocaleAbbreviatedDatetimeString(millisSinceEpoch);
        };
        $scope.viewersCount = _informationCardData.viewersCount;
        $scope.loadingInfoCardData = true;
        $scope.failedLoadingData = false;
        oppiaPlayerService.getInfoCardDataPromise().then(function(data) {
          $scope.loadingInfoCardData = false;
        }, function() {
          $scope.failedLoadingData = true;
        });

        $scope.cancel = function() {
          $modalInstance.dismiss();
        };

      }]
    });

    modalInstance.result.then(function () {}, function () {});
  };

}]);
