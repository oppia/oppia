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

oppia.factory('explorationData', function($rootScope, $http, $resource, warningsData, $q) {
  // Put exploration variables here.
  var explorationData = {};

  // Valid state properties
  var validStateProperties = [
    'content',
    'interactive_widget',
    'interactive_params',
    'interactive_rulesets',
    'sticky_interactive_widget',
    'param_changes',
    'state_name',
    'unresolved_answers',
    'yaml_file'
  ];

  // The pathname should be: .../create/{exploration_id}[/{state_id}]
  var explorationUrl = '/create/' + pathnameArray[2];

  // TODO(sll): Find a fix for multiple users editing the same exploration
  // concurrently.

  // Returns a promise that supplies the data for the current exploration.
  explorationData.getData = function() {
    if (explorationData.data) {
      console.log('Found exploration data in cache.');

      var deferred = $q.defer();
      deferred.resolve(explorationData.data);
      return deferred.promise;
    } else {
      // Retrieve data from the server.
      var promise = $http.get(explorationUrl + '/data').then(
        function(response) {
          console.log('Retrieved exploration data.');

          explorationData.data = response.data;
          return response.data;
        }
      );
      return promise;
    }
  };

  // Returns a promise that supplies the data for the given state.
  explorationData.getStateData = function(stateId) {
    if (!stateId) {
      return;
    }

    console.log('Getting state data for state ' + stateId);
    explorationData.stateId = stateId;
    console.log(explorationData.data);

    if (explorationData.data && 'states' in explorationData.data &&
        stateId in explorationData.data.states) {
      var deferred = $q.defer();
      deferred.resolve(explorationData.data.states[stateId]);
      return deferred.promise;
    } else {
      return explorationData.getData().then(function(response) {
        return explorationData.data.states[stateId];
      });
    }
  };

  explorationData.getStateProperty = function(stateId, property) {
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
  };

  // Saves data for a given state to the backend, and, on a success callback,
  // updates the data for that state in the frontend.
  explorationData.saveStateData = function(stateId, propertyValueMap) {
    for (var property in propertyValueMap) {
      if (validStateProperties.indexOf(property) < 0) {
        warningsData.addWarning('Invalid property name: ' + property);
        return;
      }
    }

    console.log(propertyValueMap);
    console.log(JSON.stringify(propertyValueMap));

    $http.put(
        explorationUrl + '/' + stateId + '/data',
        $.param({payload: JSON.stringify(propertyValueMap)}, true),
        {headers: {'Content-Type': 'application/x-www-form-urlencoded'}}
    ).success(function(data) {
      warningsData.clear();
      console.log('Changes to this state were saved successfully.');
      explorationData.data['states'][stateId] = data;
    }).error(function(data) {
      warningsData.addWarning(data.error || 'Error communicating with server.');
    });
  };

  return explorationData;
});
