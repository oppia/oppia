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
 * @fileoverview Controllers for the reader's view of an exploration.
 *
 * @author sll@google.com (Sean Lip)
 */


// A service that provides a number of utility functions for JS used by
// individual skins.
oppia.factory('oppiaPlayerService', [
    '$http', '$log', '$rootScope', '$modal', 'oppiaRequestCreator', 'messengerService',
    function($http, $log, $rootScope, $modal, oppiaRequestCreator, messengerService) {
  var explorationId = null;

  // The pathname should be: .../explore/{exploration_id}
  var pathnameArray = window.location.pathname.split('/');
  for (var i = 0; i < pathnameArray.length; i++) {
    if (pathnameArray[i] === 'explore') {
      explorationId = pathnameArray[i + 1];
      break;
    }
  }

  // The following line is needed for image displaying to work, since the image URLs
  // refer to $rootScope.explorationId.
  $rootScope.explorationId = explorationId;

  var readerParams = {};
  var stateHistory = [];
  var version = GLOBALS.explorationVersion;
  var sessionId = null;
  var isLoggedIn = false;
  var clientTimeSpentInSecs = null;
  var lastStateStartTime = null;
  var stateName = null;

  var answerIsBeingProcessed = false;

  var explorationDataUrl = '/explorehandler/init/' + explorationId;
  if (version) {
    explorationDataUrl += '?v=' + version;
  }

  return {
    getExplorationId: function() {
      return explorationId;
    },
    getExplorationVersion: function() {
      return version;
    },
    getReaderParams: function() {
      return readerParams;
    },
    getStateHistory: function() {
      return stateHistory;
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
          params: readerParams,
          state_history: stateHistory,
          version: version,
          session_id: sessionId,
          client_time_spent_in_secs: (
            (new Date().getTime() - lastStateStartTime) / 1000)
        }),
        {headers: {'Content-Type': 'application/x-www-form-urlencoded'}}
      ).success(function(data) {
        answerIsBeingProcessed = false;
        messengerService.sendMessage(messengerService.STATE_TRANSITION, {
          oldStateName: stateName,
          jsonAnswer: JSON.stringify(answer),
          newStateName: data.state_name
        });

        readerParams = data.params;
        stateHistory = data.state_history;
        lastStateStartTime = new Date().getTime();
        stateName = data.state_name;
        successCallback(data);
      })
      .error(function(data) {
        answerIsBeingProcessed = false;
        errorCallback(data);
      });
    },
    loadInitialState: function(successCallback, errorCallback) {
      $http.get(explorationDataUrl).success(function(data) {
        isLoggedIn = data.is_logged_in;
        readerParams = data.params;
        stateHistory = data.state_history;
        sessionId = data.sessionId;
        lastStateStartTime = new Date().getTime();
        stateName = data.state_name;
        successCallback(data);
      }).error(function(data) {
        errorCallback(data);
      });
    },
    showFeedbackModal: function() {
      $modal.open({
        templateUrl: 'modals/readerFeedback',
        backdrop: 'static',
        resolve: {
          isLoggedIn: function() {
            return isLoggedIn;
          }
        },
        controller: [
            '$scope', '$modalInstance', 'isLoggedIn',
            function($scope, $modalInstance, isLoggedIn) {
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
        }]
      }).result.then(function(result) {
        if (result.feedback) {
          var requestMap = {
            subject: result.subject,
            feedback: result.feedback,
            include_author: !result.isSubmitterAnonymized && isLoggedIn,
          };
          if (result.isStateRelated) {
            requestMap.state_name = stateName;
          }

          $http.post(
              '/explorehandler/give_feedback/' + explorationId,
              oppiaRequestCreator.createRequest(requestMap),
              {headers: {'Content-Type': 'application/x-www-form-urlencoded'}}
          );

          $modal.open({
            templateUrl: 'modals/readerFeedbackConfirmation',
            backdrop: 'static',
            resolve: {},
            controller: ['$scope', '$modalInstance', function($scope, $modalInstance) {
              $scope.cancel = function() {
                $modalInstance.dismiss('cancel');
              };
            }]
          });
        }
      });
    }
  };
}]);
