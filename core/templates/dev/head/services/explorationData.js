// Copyright 2012 Google Inc. All Rights Reserved.
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
 * @fileoverview Factory for handling exploration data. All interactions with
 * the editor backend should go through this factory.
 *
 * @author sll@google.com (Sean Lip)
 */

oppia.factory('explorationData', [
  '$http', '$log', 'warningsData', '$q', 'oppiaRequestCreator',
  function($http, $log, warningsData, $q, oppiaRequestCreator) {
    // The pathname (without the hash) should be: .../create/{exploration_id}
    var explorationUrl = '/create/' + pathnameArray[2];
    var explorationDataUrl = '/createhandler/data/' + pathnameArray[2];
    var resolvedAnswersUrlPrefix = '/createhandler/resolved_answers/' + pathnameArray[2];
    var resolvedFeedbackUrlPrefix = '/createhandler/resolved_feedback/' + pathnameArray[2];

    // TODO(sll): Find a fix for multiple users editing the same exploration
    // concurrently.

    // Put exploration variables here.
    var explorationData = {
      // Returns a promise that supplies the data for the current exploration.
      getData: function() {
        if (explorationData.data) {
          $log.info('Found exploration data in cache.');

          var deferred = $q.defer();
          deferred.resolve(explorationData.data);
          return deferred.promise;
        } else {
          // Retrieve data from the server.
          return $http.get(explorationDataUrl).then(function(response) {
            $log.info('Retrieved exploration data.');
            $log.info(response.data);

            explorationData.data = response.data;
            return response.data;
          });
        }
      },

      /**
       * Saves the exploration to the backend, and, on a success callback,
       * updates the data for the updated states in the frontend.
       * @param {object} explorationChangeList Represents the change list for
       *     this save. Each element of the list is a command representing an
       *     editing action (such as add state, delete state, etc.). See the
       *     _Change class in exp_services.py for full documentation.
       * @param {string} commitMessage The user-entered commit message for this
       *     save operation.
       */
      save: function(
          explorationChangeList, commitMessage, successCallback, errorCallback) {
        $http.put(
          explorationDataUrl,
          oppiaRequestCreator.createRequest({
            change_list: explorationChangeList,
            commit_message: commitMessage,
            version: explorationData.data.version,
          }),
          {headers: {'Content-Type': 'application/x-www-form-urlencoded'}}
        ).success(function(data) {
          warningsData.clear();
          $log.info('Changes to this exploration were saved successfully.');
          explorationData.data = data;
          if (successCallback) {
            successCallback();
          }
        }).error(function(data) {
          warningsData.addWarning(data.error || 'Error communicating with server.');
          if (errorCallback) {
            errorCallback();
          }
        });
      },

      resolveAnswers: function(stateName, resolvedAnswersList) {
        $http.put(
          resolvedAnswersUrlPrefix + '/' + encodeURIComponent(stateName),
          oppiaRequestCreator.createRequest({
            resolved_answers: resolvedAnswersList
          }),
          {headers: {'Content-Type': 'application/x-www-form-urlencoded'}}
        ).error(function(data) {
          warningsData.addWarning(data.error || 'Error communicating with server.');
        });

        warningsData.clear();
      },

      resolveReaderFeedback: function(stateName, feedbackId, newStatus) {
        $http.put(
          resolvedFeedbackUrlPrefix + '/' + encodeURIComponent(stateName),
          oppiaRequestCreator.createRequest({
            feedback_id: feedbackId,
            new_status: newStatus
          }),
          {headers: {'Content-Type': 'application/x-www-form-urlencoded'}}
        ).error(function(data) {
          warningsData.addWarning(data.error || 'Error communicating with server.');
        });

        warningsData.clear();
      }
    };

    return explorationData;
  }
]);
