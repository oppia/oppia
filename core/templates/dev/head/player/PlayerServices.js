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
// individual skins.
oppia.factory('oppiaPlayerService', [
    '$http', '$rootScope', '$modal', '$filter', 'messengerService',
    'stopwatchProviderService', 'learnerParamsService', 'warningsData',
    'oppiaHtmlEscaper', function(
      $http, $rootScope, $modal, $filter, messengerService,
      stopwatchProviderService, learnerParamsService, warningsData,
      oppiaHtmlEscaper) {

  var explorationId = null;
  // The pathname should be: .../explore/{exploration_id}
  var pathnameArray = window.location.pathname.split('/');
  for (var i = 0; i < pathnameArray.length; i++) {
    if (pathnameArray[i] === 'explore') {
      explorationId = pathnameArray[i + 1];
      break;
    }
  }

  // The following line is needed for image displaying to work, since the image
  // URLs refer to $rootScope.explorationId.
  $rootScope.explorationId = explorationId;

  var version = GLOBALS.explorationVersion;
  var explorationDataUrl = (
    '/explorehandler/init/' + explorationId + (version ? '?v=' + version : ''));
  var sessionId = null;
  var isLoggedIn = false;
  var _exploration = null;

  learnerParamsService.init({});
  var stateHistory = [];
  var stateName = null;
  var answerIsBeingProcessed = false;

  var _updateStatus = function(newParams, newStateName, newStateHistory) {
    // TODO(sll): Do this more incrementally.
    learnerParamsService.init(newParams);
    stateName = newStateName;
    stateHistory = newStateHistory;
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

  var _feedbackModalCtrl = ['$scope', '$modalInstance', 'isLoggedIn', 'currentStateName', function(
      $scope, $modalInstance, isLoggedIn, currentStateName) {
    $scope.isLoggedIn = isLoggedIn;
    $scope.currentStateName = currentStateName;

    $scope.isSubmitterAnonymized = false;
    $scope.relatedTo = $scope.currentStateName === 'END' ? 'exploration' : 'state';
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
      $http.post('/explorehandler/give_feedback/' + explorationId, {
        subject: result.subject,
        feedback: result.feedback,
        include_author: !result.isSubmitterAnonymized && isLoggedIn,
        state_name: result.isStateRelated ? stateName : null
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

  return {
    loadInitialState: function(successCallback) {
      $http.get(explorationDataUrl).success(function(data) {
        _exploration = data.exploration;
        isLoggedIn = data.is_logged_in;
        sessionId = data.sessionId;
        stopwatch.resetStopwatch();
        _updateStatus(data.params, data.state_name, data.state_history);
        // TODO(sll): Restrict what is passed here to just the relevant blobs of content.
        successCallback(data);
      }).error(function(data) {
        warningsData.addWarning(
          data.error || 'There was an error loading the exploration.');
      });
    },
    getExplorationTitle: function() {
      return _exploration.title;
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
    submitAnswer: function(answer, handler, successCallback) {
      if (answerIsBeingProcessed) {
        return;
      }

      answerIsBeingProcessed = true;

      var stateTransitionUrl = '/explorehandler/transition/' + explorationId + '/' + encodeURIComponent(stateName);
      $http.post(stateTransitionUrl, {
        answer: answer,
        handler: handler,
        params: learnerParamsService.getAllParams(),
        state_history: stateHistory,
        version: version,
        session_id: sessionId,
        client_time_spent_in_secs: stopwatch.getTimeInSecs()
      }).success(function(data) {
        answerIsBeingProcessed = false;
        messengerService.sendMessage(messengerService.STATE_TRANSITION, {
          oldStateName: stateName,
          jsonAnswer: JSON.stringify(answer),
          newStateName: data.state_name
        });

        _updateStatus(data.params, data.state_name, data.state_history);
        stopwatch.resetStopwatch();
        // TODO(sll): Restrict what is passed here to just the relevant blobs of content.
        successCallback(data);
      }).error(function(data) {
        answerIsBeingProcessed = false;
        warningsData.addWarning(
          data.error || 'There was an error processing your input.');
      });
    },
    showFeedbackModal: function() {
      $modal.open({
        templateUrl: 'modals/playerFeedback',
        backdrop: 'static',
        resolve: {
          currentStateName: function() {
            return stateName;
          },
          isLoggedIn: function() {
            return isLoggedIn;
          }
        },
        controller: _feedbackModalCtrl
      }).result.then(_feedbackModalCallback);
    }
  };
}]);
