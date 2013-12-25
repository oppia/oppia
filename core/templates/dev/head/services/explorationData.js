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

oppia.factory('explorationData', ['$http', 'warningsData', '$q', function($http, warningsData, $q) {
  // Valid state properties that can be saved.
  var validStateProperties = [
    'content',
    'widget_id',
    'widget_customization_args',
    'widget_handlers',
    'widget_sticky',
    'param_changes',
    'state_name'
  ];

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
        console.log('Found exploration data in cache.');

        var deferred = $q.defer();
        deferred.resolve(explorationData.data);
        return deferred.promise;
      } else {
        // Retrieve data from the server.
        return $http.get(explorationDataUrl).then(function(response) {
          console.log('Retrieved exploration data.');
          console.log(response.data);

          explorationData.data = response.data;
          return response.data;
        });
      }
    },

    // Returns a promise that supplies the data for the given state.
    getStateData: function(stateId) {
      if (!stateId) {
        return;
      }

      console.log('Getting state data for state ' + stateId);
      explorationData.stateId = stateId;
      console.log(explorationData.data);

      if (explorationData.data && 'states' in explorationData.data &&
          stateId in explorationData.data.states) {
        var deferred = $q.defer();
        deferred.resolve(angular.copy(explorationData.data.states[stateId]));
        return deferred.promise;
      } else {
        return explorationData.getData().then(function(response) {
          return angular.copy(explorationData.data.states[stateId]);
        });
      }
    },

    getStateProperty: function(stateId, property) {
      if (!stateId) {
        return;
      }
      console.log(
          'Getting state property ' + property + ' for state ' + stateId);
      return explorationData.getStateData(stateId).then(function(stateData) {
        if (!stateData.hasOwnProperty(property)) {
          warningsData.addWarning('Invalid property name: ' + property);
          return;
        }
        return stateData[property];
      });
    },


    /**
     * Saves the exploration to the backend, and, on a success callback,
     * updates the data for the updated states in the frontend.
     * @param {object} explorationChanges Represents changes to the exploration,
     *     keyed by property name. The values are the most up-to-date values
     *     for the corresponding exploration properties.
     * @param {object} stateChanges Contains one key-value pair for each state
     *     that is modified. Each key is a state id, and each value is an
     *     object whose meaning is similar to that of explorationChanges.
     * @param {string} commitMessage The full commit message for this save
     *     operation.
     */
    save: function(explorationChanges, stateChanges, commitMessage,
        successCallback, errorCallback) {
      // TODO(sll): Update the frontend data immediately, where possible; do
      //              not wait for the server round-trip.
      // TODO(sll): Handle explorationChanges too.

      var statesForBackend = {};
      for (var stateId in stateChanges) {
        var changeMap = {};
        for (var property in stateChanges[stateId]) {
          if (validStateProperties.indexOf(property) < 0) {
            warningsData.addWarning('Invalid property name: ' + property);
            return;
          }
          changeMap[property] = stateChanges[stateId][property].newValue;
        }
        statesForBackend[stateId] = changeMap;
      }

      var propertyValueMap = {
        states: statesForBackend,
        version: explorationData.data.version,
      };

      for (var property in explorationChanges) {
        propertyValueMap[property] = explorationChanges[property].newValue;
      }

      if (commitMessage !== '') {
        propertyValueMap['commit_message'] = commitMessage;
      }

      $http.put(
          explorationDataUrl,
          $.param({
            csrf_token: GLOBALS.csrf_token,
            payload: JSON.stringify(propertyValueMap)
          }, true),
          {headers: {'Content-Type': 'application/x-www-form-urlencoded'}}
      ).success(function(data) {
        warningsData.clear();
        console.log('Changes to this exploration were saved successfully.');
        explorationData.data.version = data.version;
        for (var stateId in data.updatedStates) {
          explorationData.data.states[stateId] = data.updatedStates[stateId];
        }
        for (var property in explorationChanges) {
          explorationData.data[property] = data[property];
        }
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

    resolveAnswers: function(stateId, resolvedAnswersList) {
      $http.put(
          resolvedAnswersUrlPrefix + '/' + encodeURIComponent(stateId),
          $.param({
            csrf_token: GLOBALS.csrf_token,
            payload: JSON.stringify({'resolved_answers': resolvedAnswersList})
          }, true),
          {headers: {'Content-Type': 'application/x-www-form-urlencoded'}}
      ).error(function(data) {
        warningsData.addWarning(data.error || 'Error communicating with server.');
      });

      warningsData.clear();
    },

    resolveReaderFeedback: function(stateId, feedbackId, newStatus) {
      $http.put(
          resolvedFeedbackUrlPrefix + '/' + encodeURIComponent(stateId),
          $.param({
            csrf_token: GLOBALS.csrf_token,
            payload: JSON.stringify({'feedback_id': feedbackId, 'new_status': newStatus})
          }, true),
          {headers: {'Content-Type': 'application/x-www-form-urlencoded'}}
      ).error(function(data) {
        warningsData.addWarning(data.error || 'Error communicating with server.');
      });

      warningsData.clear();
    }
  };

  return explorationData;
}]);
