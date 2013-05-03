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
 * @fileoverview Controllers for an editor's main exploration page.
 *
 * @author sll@google.com (Sean Lip)
 */

var END_DEST = 'END';
var QN_DEST_PREFIX = 'q-';
var GUI_EDITOR_URL = '/gui';
var YAML_EDITOR_URL = '/text';

// TODO(sll): Move all strings to the top of the file and internationalize them.
// TODO(sll): console.log is not supported in IE.

oppia.config(['$routeProvider', function($routeProvider) {
  $routeProvider.
      when(YAML_EDITOR_URL + '/:stateId',
           {templateUrl: '/editor_views/yaml_editor', controller: YamlEditor}).
      when(GUI_EDITOR_URL + '/:stateId',
           {templateUrl: '/editor_views/gui_editor', controller: GuiEditor}).
      when('/', {templateUrl: '/editor_views/gui_editor', controller: ExplorationTab}).
      otherwise({redirectTo: '/'});
}]);

// Receive events from the iframed widget repository.
oppia.run(function($rootScope) {
  window.addEventListener('message', function(event) {
    $rootScope.$broadcast('message', event);
  });
});


function ExplorationTab($scope, explorationData) {
  // Changes the tab to the Exploration Editor view.
  $('#editorViewTab a[href="#explorationEditor"]').tab('show');
  $scope.stateId = '';
  explorationData.stateId = '';
}

function EditorExploration($scope, $http, $location, $route, $routeParams,
    explorationData, warningsData, activeInputData) {

  $scope.saveStateName = function() {
    if (!$scope.isValidEntityName($scope.stateName, true))
      return;
    if ($scope.isDuplicateInput(
            $scope.states, 'name', $scope.stateId, $scope.stateName)) {
      warningsData.addWarning(
          'The name \'' + $scope.stateName + '\' is already in use.');
      return;
    }

    explorationData.saveStateData(
        $scope.stateId, {'state_name': $scope.stateName});
    activeInputData.clear();
  };


  /********************************************
  * Methods affecting the URL location hash.
  ********************************************/
  /**
   * Gets the current mode from the URL location hash, with the GUI mode being
   * the default.
   */
  $scope.getMode = function() {
    if ($location.$$url.substring(0, YAML_EDITOR_URL.length) == YAML_EDITOR_URL) {
      return YAML_EDITOR_URL.substring(1);
    } else {
      return GUI_EDITOR_URL.substring(1);
    }
  };

  /**
   * Changes the state editor mode.
   * @param {string} mode The state editor mode to switch to (currently, gui or text).
   */
  $scope.changeMode = function(mode) {
    if (mode == GUI_EDITOR_URL.substring(1)) {
      $location.path(GUI_EDITOR_URL + '/' + explorationData.stateId);
    } else if (mode == YAML_EDITOR_URL.substring(1)) {
      $location.path(YAML_EDITOR_URL + '/' + explorationData.stateId);
    } else {
      warningsData.addWarning('Error: mode ' + mode + ' doesn\'t exist.');
    }
    $scope.$apply();
  };

  // Changes the location hash when the editorView tab is changed.
  $('#editorViewTab a[data-toggle="tab"]').on('shown', function (e) {
    if (e.target.hash == '#stateEditor') {
      explorationData.getStateData(explorationData.stateId);
      $scope.changeMode($scope.getMode());
    } else if (e.target.hash == '#explorationMap') {
      $location.path('');
      explorationData.stateId = '';
      $scope.stateId = '';
      // TODO(sll): If $apply() is not called, the $scope.stateId change does
      // not propagate and the 'State Details' tab is still shown. Why?
      $scope.$apply();
    }
  });


  /**********************************************************
   * Called on initial load of the exploration editor page.
   *********************************************************/
  var explorationFullyLoaded = false;

  // The pathname should be: .../create/{exploration_id}[/{state_id}]
  $scope.explorationId = pathnameArray[2];
  $scope.explorationUrl = '/create/' + $scope.explorationId;
  $scope.explorationDataUrl = '/create/' + $scope.explorationId + '/data';

  // Initializes the exploration page using data from the backend.
  explorationData.getData().then(function(data) {
    $scope.stateId = explorationData.stateId;
    $scope.states = data.states;
    $scope.explorationImageId = data.image_id;
    $scope.explorationTitle = data.title;
    $scope.explorationCategory = data.category;
    $scope.explorationEditors = data.editors;
    $scope.initStateId = data.init_state_id;
    $scope.isPublic = data.is_public;
    $scope.currentUser = data.user;
    $scope.parameters = data.parameters || [];//TODO(yanamal): make sure this works when explorations actually have parameters

    $scope.stats = {
      'numVisits': data.num_visits,
      'numCompletions': data.num_completions,
      'stateStats': data.state_stats
    };

    $scope.chartData = [['', 'Completions', 'Non-completions'],['', data.num_completions, data.num_visits - data.num_completions]];
    $scope.chartColors = ['green', 'firebrick'];
    $scope.ruleChartColors = ['cornflowerblue', 'transparent'];

    explorationFullyLoaded = true;

    if ($scope.stateId) {
      $scope.stateName = data.name;
    }
  });

  $scope.$watch('explorationCategory', function(newValue, oldValue) {
    // Do not save on the initial data load.
    if (oldValue !== undefined) {
      $scope.saveExplorationProperty(
          'explorationCategory', 'category', newValue, oldValue);
    }
  });

  $scope.$watch('explorationTitle', function(newValue, oldValue) {
    // Do not save on the initial data load.
    if (oldValue !== undefined) {
      $scope.saveExplorationProperty(
          'explorationTitle', 'title', newValue, oldValue);
    }
  });

  //TODO: also add values list 
  $scope.addParameter = function(name, type) {
    console.log("adding parameter to exploration");
    $scope.parameters.push({name:name, type:type});
    $http.put(
        $scope.explorationDataUrl,
        $scope.createRequest({parameters: $scope.parameters}),
        {headers: {'Content-Type': 'application/x-www-form-urlencoded'}}).
            success(function(data) {
              console.log('PUT request succeeded');
            }).
            error(function(data) {
              warningsData.addWarning(
                  'Error adding parameter: ' + data.error);
              $scope.parameters.pop();
            });
  };

  $scope.openAddNewEditorForm = function() {
    activeInputData.name = 'explorationMetadata.addNewEditor';
  };

  $scope.closeAddNewEditorForm = function() {
    $scope.newEditorEmail = '';
    activeInputData.name = 'explorationMetadata';
  };


  $scope.openAddExplorationImageForm = function() {
    activeInputData.name = 'explorationMetadata.addNewImage';
  };

  $scope.closeAddExplorationImageForm = function() {
    activeInputData.name = 'explorationMetadata';
  };


  $scope.addNewEditor = function(newEditorEmail) {
    activeInputData.name = 'explorationMetadata';
    $scope.explorationEditors.push(newEditorEmail);

    $http.put(
        $scope.explorationDataUrl,
        $scope.createRequest({editors: $scope.explorationEditors}),
        {headers: {'Content-Type': 'application/x-www-form-urlencoded'}}).
            success(function(data) {
              console.log('PUT request succeeded');
            }).
            error(function(data) {
              warningsData.addWarning(
                  'Error adding collaborator: ' + data.error);
              $scope.explorationEditors.pop();
            });
  };

  /**
   * Downloads the YAML representation of an exploration.
   */
  $scope.downloadExploration = function() {
    document.location = '/create/download/' + $scope.explorationId;
  };

  $scope.makePublic = function() {
    $scope.saveExplorationProperty('isPublic', 'is_public', true, false);
  };

  $scope.deleteExplorationImage = function() {
    $scope.saveExplorationProperty(
        'explorationImageId', 'image_id', null, $scope.explorationImageId);
  };

  $scope.saveExplorationImage = function() {
    activeInputData.name = 'explorationMetadata';
    $scope.saveImage(function(data) {
      $scope.explorationImageId = data.image_id;
      $scope.saveExplorationProperty(
          'explorationImageId', 'image_id', $scope.explorationImageId, null);
    });
  };

  /**
   * Saves a property of an exploration (e.g. title, category, etc.)
   * @param {string} frontendName The frontend name of the property to save
   *     (e.g. explorationTitle, explorationCategory)
   * @param {string} backendName The backend name of the property (e.g. title, category)
   * @param {string} newValue The new value of the property
   * @param {string} oldValue The previous value of the property
   */
  $scope.saveExplorationProperty = function(frontendName, backendName, newValue, oldValue) {
    if (!explorationFullyLoaded) {
      return;
    }
    if (oldValue && !$scope.isValidEntityName($scope[frontendName], true)) {
      $scope[frontendName] = oldValue;
      return;
    }
    var requestParameters = {};
    requestParameters[backendName] = newValue;

    $http.put(
        $scope.explorationDataUrl,
        $scope.createRequest(requestParameters),
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
    if (activeInputData.name == 'stateName') {
      $scope.saveStateName();
    }

    var inputArray = newActiveInput.split('.');

    activeInputData.name = (newActiveInput || '');
    // TODO(sll): Initialize the newly displayed field.
  };

  // Adds a new state to the list of states, and updates the backend.
  $scope.addState = function(newStateName, successCallback) {
    if (!$scope.isValidEntityName(newStateName, true))
      return;
    if (newStateName.toUpperCase() == END_DEST) {
      warningsData.addWarning('Please choose a state name that is not \'END\'.');
      return;
    }
    for (var id in $scope.states) {
      if (id != $scope.stateId && $scope.states[id]['name'] == newStateName) {
        warningsData.addWarning('A state with this name already exists.');
        return;
      }
    }

    $http.post(
        $scope.explorationDataUrl,
        $scope.createRequest({state_name: newStateName}),
        {headers: {'Content-Type': 'application/x-www-form-urlencoded'}}).
            success(function(data) {
              $scope.newStateDesc = '';
              window.location = $scope.explorationUrl;
            }).error(function(data) {
              warningsData.addWarning(
                  'Server error when adding state: ' + data.error);
            });
  };

  $scope.getStateName = function(stateId) {
    return stateId ? explorationData.data.states[stateId].name : '[none]';
  };

  $scope.openDeleteStateModal = function(stateId) {
    $scope.deleteStateId = stateId;
    $scope.$apply();
    $('#deleteStateModal').modal('show');
  };

  $('#deleteStateModal').on('hidden', function() {
    $scope.deleteStateId = '';
  });

  // Deletes the state with id stateId. This action cannot be undone.
  $scope.deleteState = function(stateId) {
    if (stateId == $scope.initStateId) {
      warningsData.addWarning('Deleting the initial state of a question is not ' +
          'supported. Perhaps edit it instead?');
      return;
    }

    $http['delete']($scope.explorationUrl + '/' + stateId + '/data')
    .success(function(data) {
      window.location = $scope.explorationUrl;
    }).error(function(data) {
      warningsData.addWarning(data.error || 'Error communicating with server.');
    });
  };

  $scope.deleteExploration = function() {
    $http['delete']($scope.explorationDataUrl)
    .success(function(data) {
      window.location = '/gallery/';
    });
  };
}

/**
 * Injects dependencies in a way that is preserved by minification.
 */
EditorExploration.$inject = ['$scope', '$http', '$location', '$route',
    '$routeParams', 'explorationData', 'warningsData', 'activeInputData'];
ExplorationTab.$inject = ['$scope', 'explorationData'];
