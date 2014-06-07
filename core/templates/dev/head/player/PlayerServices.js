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

// A simple timer service.
oppia.factory('timerService', ['$log', function($log) {
  var startTime = null;

  return {
    _getCurrentTime: function() {
      return Date.now();
    },
    resetTimer: function() {
      startTime = this._getCurrentTime();
    },
    getTimeInSecs: function() {
      if (startTime === null) {
        $log.error(
          'Tried to retrieve the elapsed time, but no start time was set.');
        return null;
      }
      return (this._getCurrentTime() - startTime) / 1000;
    }
  };
}]);

// A service that provides a number of utility functions for JS used by
// individual skins.
oppia.factory('oppiaPlayerService', [
    '$http', '$rootScope', '$modal', 'oppiaRequestCreator',
    'messengerService', 'timerService', function(
      $http, $rootScope, $modal, oppiaRequestCreator, messengerService,
      timerService) {

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

  var explorationDataUrl = (
    '/explorehandler/init/' + explorationId + (version ? '?v=' + version : ''));
  var version = GLOBALS.explorationVersion;
  var sessionId = null;
  var isLoggedIn = false;

  var currentParams = {};
  var stateHistory = [];
  var stateName = null;
  var answerIsBeingProcessed = false;

  var _updateStatus = function(newParams, newStateName, newStateHistory) {
    currentParams = newParams;
    stateName = newStateName;
    stateHistory = newStateHistory;
  };

  var _feedbackModalCtrl = ['$scope', '$modalInstance', 'isLoggedIn', function(
      $scope, $modalInstance, isLoggedIn) {
    $scope.isLoggedIn = isLoggedIn;
    $scope.isSubmitterAnonymized = false;
    $scope.relatedTo = 'state';
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
      $http.post(
        '/explorehandler/give_feedback/' + explorationId,
        oppiaRequestCreator.createRequest({
          subject: result.subject,
          feedback: result.feedback,
          include_author: !result.isSubmitterAnonymized && isLoggedIn,
          state_name: result.isStateRelated ? stateName : null
        })
      );

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

  return {
    loadInitialState: function(successCallback, errorCallback) {
      $http.get(explorationDataUrl).success(function(data) {
        isLoggedIn = data.is_logged_in;
        sessionId = data.sessionId;
        timerService.resetTimer();
        _updateStatus(data.params, data.state_name, data.state_history);
        successCallback(data);
      }).error(errorCallback);
    },
    submitAnswer: function(answer, handler, successCallback, errorCallback) {
      if (answerIsBeingProcessed) {
        return;
      }

      answerIsBeingProcessed = true;
      $http.post(
        '/explorehandler/transition/' + explorationId + '/' + encodeURIComponent(stateName),
        oppiaRequestCreator.createRequest({
          answer: answer,
          handler: handler,
          params: currentParams,
          state_history: stateHistory,
          version: version,
          session_id: sessionId,
          client_time_spent_in_secs: timerService.getTimeInSecs()
        })
      ).success(function(data) {
        answerIsBeingProcessed = false;
        messengerService.sendMessage(messengerService.STATE_TRANSITION, {
          oldStateName: stateName,
          jsonAnswer: JSON.stringify(answer),
          newStateName: data.state_name
        });

        _updateStatus(data.params, data.state_name, data.state_history);
        timerService.resetTimer();
        successCallback(data);
      })
      .error(function(data) {
        answerIsBeingProcessed = false;
        errorCallback(data);
      });
    },
    showFeedbackModal: function() {
      $modal.open({
        templateUrl: 'modals/playerFeedback',
        backdrop: 'static',
        resolve: {
          isLoggedIn: function() {
            return isLoggedIn;
          }
        },
        controller: _feedbackModalCtrl
      }).result.then(_feedbackModalCallback);
    }
  };
}]);
