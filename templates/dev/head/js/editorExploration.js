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
 * @fileoverview Angular controllers for elements on an editor's question page.
 *
 * @author sll@google.com (Sean Lip)
 */

var END_DEST = '-1';
var QN_DEST_PREFIX = 'q-';
// TODO(sll): Internationalize these.
var END_STRING = 'END';
var GUI_EDITOR_URL = '/gui'
var YAML_EDITOR_URL = '/text'

// TODO(sll): Move all strings to the top of the file, particularly
// warning messages and activeInputData.name.
// TODO(sll): console.log is not supported in IE. Fix before launch.
// TODO(sll): CSS3 selectors of the form [..] aren't supported in all browsers.

var DEFAULT_CATEGORY_NAME = 'Default';
var DEFAULT_DESTS = {
    'finite': [],
    'none': [{'category': '', 'dest': END_DEST, 'text': ''}],
    'numeric': [{'category': DEFAULT_CATEGORY_NAME, 'dest': END_DEST, 'text': ''}],
    'set': [{'category': DEFAULT_CATEGORY_NAME, 'dest': END_DEST, 'text': ''}],
    'text': [{'category': DEFAULT_CATEGORY_NAME, 'dest': END_DEST, 'text': ''}]
};
// The following list maps input views to classifiers.
var CLASSIFIER_MAPPING = {
    'int': 'numeric',
    'multiple_choice': 'finite',
    'none': 'none',
    'set': 'set',
    'text': 'text'
};
var HUMAN_READABLE_INPUT_TYPE_MAPPING = {
    'int': 'Numeric',
    'multiple_choice': 'Multiple choice',
    'none': 'none',
    'set': 'Set',
    'text': 'Free text'
};

oppia.config(['$routeProvider', function($routeProvider) {
  $routeProvider.
      when(YAML_EDITOR_URL,
           {templateUrl: '/templates/yaml', controller: YamlEditor}).
      when(YAML_EDITOR_URL + '/:stateId',
           {templateUrl: '/templates/yaml', controller: YamlEditor}).
      when(GUI_EDITOR_URL,
           {templateUrl: '/templates/gui', controller: GuiEditor}).
      when(GUI_EDITOR_URL + '/:stateId',
           {templateUrl: '/templates/gui', controller: GuiEditor}).
      otherwise({redirectTo: GUI_EDITOR_URL});
}]);


oppia.factory('explorationData', function($rootScope, $http, warningsData) {
  // Put exploration variables here.
  var explorationData = {};

  // The pathname should be: .../create/{exploration_id}[/{state_id}]
  var pathnameArray = window.location.pathname.split('/');
  var explorationId = pathnameArray[2];
  var explorationUrl = '/create/' + explorationId;

  explorationData.getData = function() {
    var obj = this;
    console.log('Getting exploration data');
    $http.get(explorationUrl + '/data').success(function(data) {
      obj.data = data;
      obj.states = data.state_list;
      obj.initState = data.init_state_id;

      obj.broadcastExploration();
    }).error(function(data) {
      warningsData.addWarning('Server error: ' + data.error);
    });
  };

  explorationData.broadcastExploration = function() {
    $rootScope.$broadcast('explorationData');
  }

  return explorationData;
});


oppia.factory('stateData', function($rootScope, $http, warningsData) {
  // Put state variables here.
  var stateData = {};

  // The pathname should be: .../create/{exploration_id}[/{state_id}]
  var pathnameArray = window.location.pathname.split('/');
  var explorationId = pathnameArray[2];
  var explorationUrl = '/create/' + explorationId;

  /**
   * Gets the data for a particular state.
   * @param {string} stateId The id of the state to get the data for.
   */
  // TODO(sll): Get this from the frontend if is already there.
  stateData.getData = function(stateId) {
    var obj = this;
    console.log('Getting state data');
    $http.post(
        explorationUrl + '/' + stateId, '',
        {headers: {'Content-Type': 'application/x-www-form-urlencoded'}}).
            success(function(data) {
              obj.data = data;
              console.log(data);
              for (var i =0 ;i < data.actions.length; i++) {
                console.log(data.actions[i].dest);
              }
              obj.stateName = data.stateName;
              obj.stateContent = data.stateContent;
              obj.inputType = data.inputType;
              obj.classifier = data.classifier;
              obj.yaml = data.yaml;

              obj.broadcastState();
            }).
            error(function(data) {
              warningsData.addWarning('Server error: ' + data.error);
            });
  };

  stateData.broadcastState = function() {
    $rootScope.$broadcast('stateData');
  }

  return stateData;
});


// Filter that truncates long descriptors.
// TODO(sll): Strip out HTML tags before truncating.
oppia.filter('truncate', function() {
  return function(input, length, suffix) {
    if (!input)
      return '';
    if (isNaN(length))
      length = 50;
    if (suffix === undefined)
      suffix = '...';
    if (input.length <= length || input.length - suffix.length <= length)
      return input;
    else
      return String(input).substring(0, length - suffix.length) + suffix;
  }
});

// Receive events from the iframed widget repository.
oppia.run(function($rootScope) {
  window.addEventListener('message', function(event) {
    console.log(event);
    $rootScope.$broadcast('message', event);
  });
});


function EditorExploration($scope, $http, $timeout, $location, $routeParams,
    stateData, explorationData, warningsData, activeInputData) {
  $scope.getMode = function() {
    if ($location.$$url.substring(0, GUI_EDITOR_URL.length) == GUI_EDITOR_URL) {
      return GUI_EDITOR_URL.substring(1);
    } else {
      return YAML_EDITOR_URL.substring(1);
    }
  };

  /**
   * Changes the editor mode.
   */
  $scope.changeMode = function(mode) {
    if (mode == GUI_EDITOR_URL.substring(1)) {
      $location.path(GUI_EDITOR_URL + '/' + $scope.stateId);
    } else if (mode == YAML_EDITOR_URL.substring(1)) {
      $location.path(YAML_EDITOR_URL + '/' + $scope.stateId);
    } else {
      warningsData.addWarning('Error: mode ' + mode + ' doesn\'t exist.');
    }
  };

  $scope.stateContent = [];

  // The pathname should be: .../create/{exploration_id}[/{state_id}]
  var pathnameArray = window.location.pathname.split('/');
  $scope.explorationId = pathnameArray[2];
  $scope.explorationUrl = '/create/' + $scope.explorationId;

  // Initializes the exploration page using data from the backend.
  explorationData.getData();

  $scope.$on('explorationData', function() {
    var data = explorationData.data;
    $scope.states = explorationData.states;
    console.log('Data for exploration page:');
    console.log(data);
    $scope.explorationImageId = data.image_id;
    $scope.explorationTitle = data.title;
    $scope.explorationCategory = data.category;
    $scope.questions = data.exploration_list;
    $scope.initStateId = data.init_state_id;
    $scope.stateId = $routeParams.stateId || $scope.initStateId;
    $scope.isPublic = data.is_public;
    stateData.getData($scope.stateId);
  });

  $scope.$watch('explorationCategory', function(newValue, oldValue) {
    $scope.saveExplorationProperty('explorationCategory', 'category', newValue, oldValue);
  });

  $scope.$watch('explorationTitle', function(newValue, oldValue) {
    $scope.saveExplorationProperty('explorationTitle', 'title', newValue, oldValue);
  });

  /**
   * Makes this exploration public.
   */
  $scope.makePublic = function() {
    $scope.saveExplorationProperty('isPublic', 'is_public', true, false);
  };

  $scope.deleteExplorationImage = function() {
    $scope.saveExplorationProperty('explorationImageId', 'image_id', null, $scope.explorationImageId);
  };

  $scope.saveExplorationImage = function() {
    activeInputData.clear();
    $scope.saveImage(function(data) {
        $scope.explorationImageId = data.image_id;
        $scope.saveExplorationProperty('explorationImageId', 'image_id', $scope.explorationImageId, null);
    });
  };

  /**
   * Saves a property of an exploration (e.g. title, category, etc.)
   * @param {string} frontendName The frontend name of the property to save (e.g. explorationTitle, explorationCategory)
   * @param {string} backendName The backend name of the property (e.g. title, category)
   * @param {string} newValue The new value of the property
   * @param {string} oldValue The previous value of the property
   */
  $scope.saveExplorationProperty = function(frontendName, backendName, newValue, oldValue) {
    if (oldValue && !$scope.isValidEntityName($scope[frontendName], true)) {
      $scope[frontendName] = oldValue;
      return;
    }
    var requestParameters = {}
    requestParameters[backendName] = newValue;

    activeInputData.clear();

    var request = $.param(requestParameters, true);
    $http.put(
        $scope.explorationUrl,
        request,
        {headers: {'Content-Type': 'application/x-www-form-urlencoded'}}).
            success(function(data) {
              if (frontendName == 'isPublic' || frontendName == 'explorationImageId') {
                $scope[frontendName] = newValue;
              }
              console.log('PUT request succeeded');
            }).
            error(function(data) {
              warningsData.addWarning(
                  'Error modifying exploration properties: ' + data.error);
              $scope[frontendName] = oldValue;
            });
  };

  $scope.initializeNewActiveInput = function(newActiveInput) {
    // TODO(sll): Rework this so that in general it saves the current active
    // input, if any, first. If it is bad input, display a warning and cancel
    // the effects of the old change. But, for now, each case is handled
    // specially.
    console.log('Current Active Input: ' + activeInputData.name);
    console.log($scope.stateId);
    if (activeInputData.name == 'stateName') {
      $scope.saveStateName();
    }

    var inputArray = newActiveInput.split('.');
    // The format of the array is [CLASSIFIER_TYPE, CATEGORY_ID, ACTION_TYPE]
    // if the newActiveInput is a category/dest input field.
    if (inputArray.length == 3 && inputArray[1] != 'dummy') {
      var dests = $scope.states[$scope.stateId]['dests'];
      var categoryId = Number(inputArray[1]);
      if (inputArray[0] != 'none' && inputArray[0] != 'finite' &&
          inputArray[2] == 'category' &&
          dests[categoryId]['category'] == DEFAULT_CATEGORY_NAME) {
        // If the newActiveInput is a non-editable category, do not proceed.
        return;
      }
    }

    activeInputData.name = (newActiveInput || '');
    // TODO(sll): Initialize the newly displayed field.
  };

  // Adds a new state to the list of states, and updates the backend.
  $scope.addState = function(newStateName, changeIsInline, categoryId) {
    if (!$scope.isValidEntityName(newStateName, true))
      return;
    // States may not start with '[', since that label is reserved for
    // '[Chapter]', '[Question]', etc.
    if (newStateName && newStateName[0] == '[') {
      warningsData.addWarning('State names may not start with \'[\'.');
      return;
    }
    if (newStateName.toUpperCase() == 'END') {
      warningsData.addWarning('Please choose a state name that is not \'END\'.');
      return;
    }
    for (var id in $scope.states) {
      if (id != $scope.stateId && $scope.states[id]['desc'] == newStateName) {
        stateData.getData(id);
        return;
      }
    }

    $scope.addStateLoading = true;
    $http.post(
        $scope.explorationUrl,
        'state_name=' + newStateName,
        {headers: {'Content-Type': 'application/x-www-form-urlencoded'}}).
            success(function(data) {
              $scope.addStateLoading = false;
              // The 'slice' below is needed because it's necessary to clone the
              // array.
              $scope.states[data.stateId] = {
                  desc: data.stateName, dests: DEFAULT_DESTS['none'].slice()};
              $scope.saveStateChange('states');
              $scope.newStateDesc = '';
              if (changeIsInline) {
                $scope.inlineNewNoneStateDesc = '';
                $scope.inlineNewFiniteStateDesc = '';
                $scope.inlineNewNumericStateDesc = '';
                $scope.inlineNewSetStateDesc = '';
                $scope.inlineNewTextStateDesc = '';
                activeInputData.clear();

                var oldDest =
                    $scope.states[$scope.stateId].dests[categoryId].dest;

                if (categoryId < $scope.states[$scope.stateId].dests.length) {
                  $scope.states[$scope.stateId].dests[categoryId].dest =
                      data.stateId;
                } else {
                  console.log(
                      'ERROR: Invalid category id ' + String(categoryId));
                  return;
                }
                $scope.saveStateChange('states');
              } else {
                // The content creator added a state from the state list.
                stateData.getData(data.stateId);
              }
            }).error(function(data) {
              $scope.addStateLoading = false;
              warningsData.addWarning(
                  'Server error when adding state: ' + data.error);
            });
  };

  /**
   * Sets up the state editor, given its data from the backend.
   * @param {Object} data Data received from the backend about the state.
   */
  $scope.$on('stateData', function() {
    var data = stateData.data;

    var prevStateId = $scope.stateId;
    $scope.stateId = data.stateId;
    var variableList = ['stateName', 'stateContent', 'inputType', 'classifier',
                        'states'];
    for (var i = 0; i < variableList.length; ++i) {
      // Exclude 'states', because it is not returned from the backend.
      if (variableList[i] != 'states') {
        $scope[variableList[i]] = data[variableList[i]];
      }
    }
    // Update the states using the actions variable.
    $scope.states[$scope.stateId].dests = data.actions;
  });

  $scope.saveStateName = function() {
    if (!$scope.isValidEntityName($scope.stateName, true))
      return;
    if ($scope.isDuplicateInput(
            $scope.states, 'desc', $scope.stateId, $scope.stateName)) {
      warningsData.addWarning(
          'The name \'' + $scope.stateName + '\' is already in use.');
      return;
    }

    $scope.states[$scope.stateId].desc = $scope.stateName;
    editStateVertexName($scope.stateId, $scope.stateName);
    $scope.saveStateChange('states');
    $scope.saveStateChange('stateName');
    activeInputData.clear();
  };

  // Deletes the state with id stateId. This action cannot be undone.
  // TODO(sll): Add an 'Are you sure?' prompt. Later, allow undoing of the
  // deletion.
  $scope.deleteState = function(stateId) {
    if (stateId == $scope.initStateId) {
      warningsData.addWarning('Deleting the initial state of a question is not ' +
          'supported. Perhaps edit it instead?');
      return;
    }

    $http.delete(
        $scope.explorationUrl + '/' + stateId + '/data', '',
        {headers: {'Content-Type': 'application/x-www-form-urlencoded'}}
    ).success(function(data) {
      var edgesDeleted = 0;
      // Remove incoming edges from other states to this state. This must be
      // done to ensure that $scope.states stays up to date.
      for (var id in $scope.states) {
        for (var categoryIndex = 0;
             categoryIndex < $scope.states[id].dests.length;
             ++categoryIndex) {
          if ($scope.states[id].dests[categoryIndex].dest == stateId) {
            $scope.states[id].dests[categoryIndex].dest = id;
            edgesDeleted++;
          }
        }
      }
      if (edgesDeleted) {
        warningsData.addWarning(
            'The categories of some states now no longer have destinations.');
      }

      delete $scope.states[stateId];
      $scope.saveStateChange('states');
      explorationData.getData();
    }).error(function(data) {
      warningsData.addWarning(data.error || 'Error communicating with server.');
    });
  };


  /**
   * Saves a change to a state property.
   * @param {String} property The state property to be saved.
   */
  $scope.saveStateChange = function(property) {
    if (!$scope.stateId)
      return;
    activeInputData.clear();

    if ($scope.classifier != 'none' &&
        $scope.states[$scope.stateId]['dests'].length == 0) {
      warningsData.addWarning(
          'Interactive questions should have at least one category.');
      return;
    }

    // Remove null values from $scope.stateContent.
    $scope.tempstateContent = [];
    for (var i = 0; i < $scope.stateContent.length; ++i) {
      if ($scope.stateContent[i]['value'])
        $scope.tempstateContent.push($scope.stateContent[i]);
    }

    var actionsForBackend = $scope.states[$scope.stateId].dests;
    for (var ind = 0;
         ind < $scope.states[$scope.stateId]['dests'].length; ++ind) {
      actionsForBackend[ind]['category'] =
          $scope.states[$scope.stateId]['dests'][ind].category;
      actionsForBackend[ind]['dest'] =
          $scope.states[$scope.stateId]['dests'][ind].dest;
    }

    var requestParameters = {
        state_id: $scope.stateId,
        state_name: $scope.stateName,
        state_content: JSON.stringify($scope.tempstateContent),
        input_type: $scope.inputType,
        actions: JSON.stringify(actionsForBackend)
    };

    var request = $.param(requestParameters, true);
    console.log('REQUEST');
    console.log(request);

    $http.put(
        $scope.explorationUrl + '/' + $scope.stateId + '/data',
        request,
        {headers: {'Content-Type': 'application/x-www-form-urlencoded'}}
    ).success(function(data) {
      console.log('Changes saved successfully.');
      explorationData.getData();
    }).error(function(data) {
      warningsData.addWarning(data.error || 'Error communicating with server.');
    });
  };
}

/**
 * Injects dependencies in a way that is preserved by minification.
 */
EditorExploration.$inject = ['$scope', '$http', '$timeout', '$location',
    '$routeParams', 'stateData', 'explorationData', 'warningsData',
    'activeInputData'];
