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
    // TODO(sll): Forbid use of 'answer', 'choices', 'stateSticky' as possible keys.
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
    '$http', '$rootScope', '$modal', '$filter', 'messengerService',
    'stopwatchProviderService', 'learnerParamsService', 'warningsData',
    'oppiaHtmlEscaper', 'answerClassificationService',
    function(
      $http, $rootScope, $modal, $filter, messengerService,
      stopwatchProviderService, learnerParamsService, warningsData,
      oppiaHtmlEscaper, answerClassificationService) {

  var _END_DEST = 'END';

  var _editorPreviewMode = null;
  var _explorationId = null;
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

  if (_editorPreviewMode === null) {
    throw 'No editor preview mode specified.';
  }
  if (_explorationId === null) {
    throw 'No exploration id specified.';
  }

  // The following line is needed for image displaying to work, since the image
  // URLs refer to $rootScope.explorationId.
  $rootScope.explorationId = _explorationId;

  var version = GLOBALS.explorationVersion;
  var explorationDataUrl = (
    '/explorehandler/init/' + _explorationId + (version ? '?v=' + version : ''));
  var sessionId = null;
  var isLoggedIn = false;
  var _exploration = null;

  learnerParamsService.init({});
  var stateHistory = [];
  var _currentStateName = null;
  var answerIsBeingProcessed = false;

  var _updateStatus = function(newParams, newStateName) {
    // TODO(sll): Do this more incrementally.
    learnerParamsService.init(newParams);
    _currentStateName = newStateName;
    stateHistory.push(_currentStateName);
  };

  // TODO(sll): Move this (and the corresponding code in the exploration editor) to
  // a common standalone service.
  var _getInteractiveWidgetHtml = function(widgetId, widgetCustomizationArgSpecs) {
    var el = $(
      '<oppia-interactive-' + $filter('camelCaseToHyphens')(widgetId) + '>');
    for (var caSpecName in widgetCustomizationArgSpecs) {
      var caSpecValue = widgetCustomizationArgSpecs[caSpecName].value;
      // TODO(sll): Evaluate any values here that correspond to expressions.
      el.attr(
        $filter('camelCaseToHyphens')(caSpecName) + '-with-value',
        oppiaHtmlEscaper.objToEscapedJson(caSpecValue));
    }
    return ($('<div>').append(el)).html();
  };

  var _getReaderResponseHtml = function(widgetId, answer, isSticky, choices) {
    var el = $(
      '<oppia-response-' + $filter('camelCaseToHyphens')(widgetId) + '>');
    el.attr('answer', oppiaHtmlEscaper.objToEscapedJson(answer));
    el.attr('state-sticky', oppiaHtmlEscaper.objToEscapedJson(isSticky));
    if (choices) {
      el.attr('choices', oppiaHtmlEscaper.objToEscapedJson(choices));
    }
    return ($('<div>').append(el)).html();
  };

  var _feedbackModalCtrl = ['$scope', '$modalInstance', 'isLoggedIn', 'currentStateName', function(
      $scope, $modalInstance, isLoggedIn, currentStateName) {
    $scope.isLoggedIn = isLoggedIn;
    $scope.currentStateName = currentStateName;

    $scope.isSubmitterAnonymized = false;
    $scope.relatedTo = $scope.currentStateName === _END_DEST ? 'exploration' : 'state';
    $scope.subject = '';
    $scope.feedback = '';

    $scope.submit = function(subject, feedback, relatedTo, isSubmitterAnonymized) {
      $modalInstance.close({
        subject: subject,
        feedback: feedback,
        isStateRelated: relatedTo === 'state',
        isSubmitterAnonymized: isSubmitterAnonymized
      });
    };

    $scope.cancel = function() {
      $modalInstance.dismiss('cancel');
    };
  }];

  var _feedbackModalCallback = function(result) {
    if (result.feedback) {
      $http.post('/explorehandler/give_feedback/' + _explorationId, {
        subject: result.subject,
        feedback: result.feedback,
        include_author: !result.isSubmitterAnonymized && isLoggedIn,
        state_name: result.isStateRelated ? _currentStateName : null
      });

      $modal.open({
        templateUrl: 'modals/playerFeedbackConfirmation',
        backdrop: 'static',
        controller: ['$scope', '$modalInstance', function($scope, $modalInstance) {
          $scope.cancel = function() {
            $modalInstance.dismiss('cancel');
          };
        }]
      });
    }
  };

  var stopwatch = stopwatchProviderService.getInstance();

  var _onStateTransitionProcessed = function(data, answer, handler, successCallback) {
    var oldStateName = _currentStateName;
    var newStateName = data.state_name;
    var oldStateData = _exploration.states[oldStateName];
    // NB: This may be undefined if newStateName === END_DEST.
    var newStateData = _exploration.states[newStateName];
    // TODO(sll): If the new state widget is the same as the old state widget,
    // and the new state widget is sticky, do not render the reader response.
    // The interactive widget in the frontend should take care of this.
    // TODO(sll): This special-casing is not great; we should make the
    // interface for updating the frontend more generic so that all the updates
    // happen in the same place. Perhaps in the non-sticky case we should call
    // a frontend method named appendFeedback() or similar.
    var isSticky = (
      newStateName !== _END_DEST && newStateData.widget.sticky &&
      newStateData.widget.widget_id === oldStateData.widget.widget_id);

    if (!_editorPreviewMode) {
      // Record the state hit to the event handler.
      var stateHitEventHandlerUrl = '/explorehandler/state_hit_event/' + _explorationId;
      $http.post(stateHitEventHandlerUrl, {
        new_state_name: newStateName,
        first_time: stateHistory.indexOf(newStateName) === -1,
        exploration_version: version,
        session_id: sessionId,
        client_time_spent_in_secs: stopwatch.getTimeInSecs(),
        old_params: learnerParamsService.getAllParams()
      });

      // Broadcast the state hit to the parent page.
      messengerService.sendMessage(messengerService.STATE_TRANSITION, {
        oldStateName: _currentStateName,
        jsonAnswer: JSON.stringify(answer),
        newStateName: data.state_name
      });
    }

    _updateStatus(data.params, data.state_name);
    stopwatch.resetStopwatch();

    // TODO(sll): Get rid of this special case for multiple choice.
    var oldWidgetChoices = null;
    if (_exploration.states[oldStateName].widget.customization_args.choices) {
      oldWidgetChoices = _exploration.states[oldStateName].widget.customization_args.choices.value;
    }

    var readerResponseHtml = _getReaderResponseHtml(
      _exploration.states[oldStateName].widget.widget_id, answer, isSticky, oldWidgetChoices);
    if (newStateData) {
      learnerParamsService.init(data.params);
    }

    $rootScope.$broadcast('playerStateChange');

    successCallback(
      newStateName, isSticky, data.question_html, readerResponseHtml,
      data.feedback_html);
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
     * Loads the data for the initial state of the exploration.
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
      if (_editorPreviewMode) {
        
        var initExplorationUrl = '/createhandler/init_exploration/' + _explorationId;
        $http.post(initExplorationUrl, {
          exp_param_specs: _exploration.param_specs,
          init_state: _exploration.states[_exploration.init_state_name],
          exp_param_changes: _exploration.param_changes
        }).success(function(initHtmlAndParamsData) {
          stopwatch.resetStopwatch();
          _updateStatus(initHtmlAndParamsData.params, _exploration.init_state_name);
          $rootScope.$broadcast('playerStateChange');
          successCallback({
            exploration: _exploration,
            isLoggedIn: false,
            sessionId: null,
            init_html: initHtmlAndParamsData.init_html,
            params: initHtmlAndParamsData.params,
            state_name: _exploration.init_state_name
          });
        });
      } else {
        $http.get(explorationDataUrl).success(function(data) {
          _exploration = data.exploration;
          isLoggedIn = data.is_logged_in;
          sessionId = data.session_id;
          stopwatch.resetStopwatch();
          _updateStatus(data.params, data.state_name);
          $rootScope.$broadcast('playerStateChange');
          successCallback(data.state_name, data.init_html);
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
    getInteractiveWidgetHtml: function(stateName) {
      return _getInteractiveWidgetHtml(
        _exploration.states[stateName].widget.widget_id,
        _exploration.states[stateName].widget.customization_args);
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
    isInPreviewMode: function() {
      return !!_editorPreviewMode;
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

        var nextStateDictUrl = '/explorehandler/next_state/' + _explorationId;
        var newStateName = (ruleSpec.dest !== 'END') ? ruleSpec.dest : null;
        $http.post(nextStateDictUrl, {
          exp_param_specs: angular.copy(_exploration.param_specs),
          old_state_name: _currentStateName,
          input_type: ruleSpec.inputType,
          params: learnerParamsService.getAllParams(),
          rule_spec: ruleSpec,
          new_state: newStateName ? _exploration.states[newStateName] : null,
          answer: answer
        }).success(function(data) {
          answerIsBeingProcessed = false;
          _onStateTransitionProcessed(data, answer, handler, successCallback);
        }).error(function(data) {
          answerIsBeingProcessed = false;
          warningsData.addWarning(
            data.error || 'There was an error processing your input.');
        });
      });
    },
    showFeedbackModal: function() {
      if (_editorPreviewMode) {
        warningsData.addWarning('The feedback modal is not available in preview mode.');
        return;
      }

      $modal.open({
        templateUrl: 'modals/playerFeedback',
        backdrop: 'static',
        resolve: {
          currentStateName: function() {
            return _currentStateName;
          },
          isLoggedIn: function() {
            return isLoggedIn;
          }
        },
        controller: _feedbackModalCtrl
      }).result.then(_feedbackModalCallback);
    },
    openExplorationEditorPage: function() {
      if (_editorPreviewMode) {
        warningsData.addWarning(
          'The \'Look Inside\' functionality is not available in preview mode. ' +
          'In non-preview mode, it will open the exploration editor page in a ' +
          'new tab.');
        return;
      }

      window.open('/create/' + _explorationId, '_blank');
    },
    isAnswerBeingProcessed: function() {
      return answerIsBeingProcessed;
    }
  };
}]);
