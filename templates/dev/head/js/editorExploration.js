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

var END_DEST = 'END';
var QN_DEST_PREFIX = 'q-';
// TODO(sll): Internationalize these.
var GUI_EDITOR_URL = '/gui';
var YAML_EDITOR_URL = '/text';

// TODO(sll): Move all strings to the top of the file, particularly
// warning messages and activeInputData.name.
// TODO(sll): console.log is not supported in IE. Fix before launch.
// TODO(sll): CSS3 selectors of the form [..] aren't supported in all browsers.

oppia.config(['$routeProvider', function($routeProvider) {
  $routeProvider.
      when(YAML_EDITOR_URL + '/:stateId',
           {templateUrl: '/templates/yaml', controller: YamlEditor}).
      when(GUI_EDITOR_URL + '/:stateId',
           {templateUrl: '/templates/gui', controller: GuiEditor}).
      when('/', {templateUrl: '/templates/gui', controller: ExplorationTab}).
      otherwise({redirectTo: '/'});
}]);

oppia.factory('explorationData', function($rootScope, $http, $resource, warningsData) {
  // Put exploration variables here.
  var explorationData = {};

  // The pathname should be: .../create/{exploration_id}[/{state_id}]
  var explorationUrl = '/create/' + pathnameArray[2];
  var Exploration = $resource('/create/:explorationId/data');

  // There should be one GET request made for Exploration when the editor page
  // is initially loaded. This results in a broadcast that will initialize the
  // relevant frontend controllers.
  // Any further GET requests will be state-specific and will be obtained by
  // calling getStateData(stateId).
  // Thereafter, any updates to the model would be PUT by calling
  // saveStateData(). This would send a PUT request to the backend to update the
  // backend model. On success, it will update the model stored here, too.

  // TODO(sll): Find a fix for multiple users editing the same exploration
  // concurrently.

  explorationData.getData = function(stateId) {
    // Retrieve data from the server.
    console.log('Retrieving exploration data from the server');
    explorationData.data = Exploration.get(
      {explorationId: pathnameArray[2]}, function() {
        explorationData.broadcastExploration();
        if (stateId) {
          explorationData.broadcastState(stateId);
        }
      }, function(errorResponse) {
        warningsData.addWarning('Server error: ' + errorResponse.error);
      });
  };

  explorationData.broadcastExploration = function() {
    console.log(explorationData);
    $rootScope.$broadcast('explorationData');
  };

  explorationData.broadcastState = function(stateId) {
    if (stateId) {
      explorationData.stateId = stateId;
    }
    console.log('Broadcasting data for state ' + explorationData.stateId);
    $rootScope.$broadcast('stateData');
  };

  explorationData.getStateData = function(stateId) {
    console.log('Getting state data for state ' + stateId);
    explorationData.stateId = stateId;
    if (stateId === undefined) {
      return;
    }
    if (stateId in explorationData.data.states) {
      return explorationData.data.states[stateId];
    } else {
      explorationData.getData(stateId);
    }
  };

  explorationData.saveStateProperty = function(stateId, property, value) {
    // Saves data locally and puts it into the backend. Sole point of
    // communication between frontend and backend.
    // TODO(sll): Implement this fully. It should update the frontend as well
    // as explorationData and the backend. Then it broadcasts a stateUpdate
    // event.
    var requestParams = {};
    if (property == 'stateName') {
      requestParams['state_name'] = value;
    }
    var request = $.param(requestParams, true);

    $http.put(
        explorationUrl + '/' + stateId + '/data',
        request,
        {headers: {'Content-Type': 'application/x-www-form-urlencoded'}}
    ).success(function(data) {
      console.log('Changes to this state were saved successfully.');
      explorationData.broadcastState($scope.stateId);
    }).error(function(data) {
      warningsData.addWarning(data.error || 'Error communicating with server.');
    });
  };

  return explorationData;
});

// Receive events from the iframed widget repository.
oppia.run(function($rootScope) {
  window.addEventListener('message', function(event) {
    console.log(event);
    $rootScope.$broadcast('message', event);
  });
});


function ExplorationTab($scope) {
  // Changes the tab to the Exploration Editor view.
  $('#editorViewTab a[href="#explorationEditor"]').tab('show');
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

    $scope.states[$scope.stateId].name = $scope.stateName;
    $scope.saveStateChange('states');
    explorationData.saveStateProperty($scope.stateId, 'stateName', $scope.stateName);
    activeInputData.clear();
  };


  /**
   * Saves a change to a state property.
   * @param {String} property The state property to be saved.
   */
  $scope.saveStateChange = function(property) {
    if (!$scope.stateId)
      return;
    activeInputData.clear();

    var requestParams = {
        state_id: $scope.stateId,
        state_name: $scope.stateName
    };
    if ($scope.interactiveWidget) {
      requestParams['interactive_widget'] = $scope.interactiveWidget.id;
    }
    if ($scope.stateContent) {
      requestParams['state_content'] = JSON.stringify($scope.stateContent);
    }
    if ($scope.interactiveParams) {
      requestParams['interactive_params'] = JSON.stringify($scope.interactiveParams);
    }
    if ($scope.interactiveRulesets) {
      requestParams['interactive_rulesets'] = JSON.stringify($scope.interactiveRulesets);
    }

    var request = $.param(requestParams, true);

    $http.put(
        $scope.explorationUrl + '/' + $scope.stateId + '/data',
        request,
        {headers: {'Content-Type': 'application/x-www-form-urlencoded'}}
    ).success(function(data) {
      console.log('Changes saved successfully.');
    }).error(function(data) {
      warningsData.addWarning(data.error || 'Error communicating with server.');
    });
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
      $location.path(GUI_EDITOR_URL + '/' + $scope.stateId);
    } else if (mode == YAML_EDITOR_URL.substring(1)) {
      $location.path(YAML_EDITOR_URL + '/' + $scope.stateId);
    } else {
      warningsData.addWarning('Error: mode ' + mode + ' doesn\'t exist.');
    }
  };

  // Changes the location hash when the editorView tab is changed.
  $('#editorViewTab a[data-toggle="tab"]').on('shown', function (e) {
    console.log(e.target.hash);
    if (e.target.hash == '#stateEditor') {
      if (!$scope.stateId) {
        $scope.stateId = $scope.initStateId;
      }
      explorationData.stateId = $scope.stateId;
      explorationData.broadcastState($scope.stateId);
      $scope.changeMode($scope.getMode());
    } else {
      $location.path('');
      explorationData.getData();
    }
  });


  /**********************************************************
   * Called on initial load of the exploration editor page.
   *********************************************************/
  var explorationFullyLoaded = false;
  $scope.stateContent = [];

  // The pathname should be: .../create/{exploration_id}[/{state_id}]
  $scope.explorationId = pathnameArray[2];
  $scope.explorationUrl = '/create/' + $scope.explorationId;

  // Initializes the exploration page using data from the backend.
  explorationData.getData();

  $scope.$on('explorationData', function() {
    var data = explorationData.data;
    $scope.stateId = explorationData.stateId;
    $scope.states = data.states;
    console.log('Data for exploration page:');
    console.log(data);
    $scope.explorationImageId = data.image_id;
    $scope.explorationTitle = data.title;
    $scope.explorationCategory = data.category;
    $scope.initStateId = data.init_state_id;
    $scope.isPublic = data.is_public;
    //$scope.parameters = data.parameters; //TODO(yanamal): get parameters from server side
    $scope.parameters = [];
    explorationFullyLoaded = true;
    if (!$scope.stateId) {
      $scope.stateId = $scope.initStateId;
    }
    if ($scope.stateId) {
      $scope.processStateData(explorationData.getStateData($scope.stateId));
    }
  });

  $scope.$watch('explorationCategory', function(newValue, oldValue) {
    console.log(explorationFullyLoaded);
    $scope.saveExplorationProperty('explorationCategory', 'category', newValue, oldValue);
  });

  $scope.$watch('explorationTitle', function(newValue, oldValue) {
    $scope.saveExplorationProperty('explorationTitle', 'title', newValue, oldValue);
  });

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
    activeInputData.clear();
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

    activeInputData.name = (newActiveInput || '');
    // TODO(sll): Initialize the newly displayed field.
  };

  // Adds a new state to the list of states, and updates the backend.
  $scope.addState = function(newStateName, changeIsInline, categoryId) {
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

    $scope.addStateLoading = true;
    $http.post(
        $scope.explorationUrl,
        'state_name=' + newStateName,
        {headers: {'Content-Type': 'application/x-www-form-urlencoded'}}).
            success(function(data) {
              $scope.addStateLoading = false;
              $scope.newStateDesc = '';
              explorationData.getData();
            }).error(function(data) {
              $scope.addStateLoading = false;
              warningsData.addWarning(
                  'Server error when adding state: ' + data.error);
            });
  };

  $scope.$on('stateData', function() {
    $scope.stateId = explorationData.stateId;
    $scope.processStateData(explorationData.getStateData($scope.stateId));
  });

  /**
   * Sets up the state editor, given its data from the backend.
   * @param {Object} data Data received from the backend about the state.
   */
  $scope.processStateData = function(data) {
    $scope.stateId = data.stateId;
    $scope.stateContent = data.content;
    $scope.stateName = data.name;

    //TODO(yanamal): actually take them from back end; change to be per-dest
    $scope.paramChanges = [];
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
      explorationData.getData();
    }).error(function(data) {
      warningsData.addWarning(data.error || 'Error communicating with server.');
    });
  };

  $scope.deleteExploration = function() {
    $http['delete']($scope.explorationUrl)
    .success(function(data) {
      window.location = '/gallery/';
    });
  };

  // logic for parameter definition interface

  // reset and/or initialize variables used for parameter input
  $scope.resetParamInput = function() {
    console.log($scope);
    activeInputData.clear();
    $scope.tmpVals = [];
    $scope.tmpName = '';
    $scope.newTmpElement = '';
  };

  $scope.resetParamInput();

  // add a new element to the list of possible starting values for the parameter being edited
  $scope.addNewTmpElement = function() {
    console.log($scope.newTmpElement);
    if ($scope.newTmpElement) {
      $scope.tmpVals.push($scope.newTmpElement);
      $scope.newTmpElement = '';
    }
  };

  /**
   * add a new parameter
   * @param {String} paramName the name of the parameter being added
   * @param {Array} paramVals list of initial values the parameter could take
   */
  $scope.addParameter = function(paramName, paramVals) {
    // Verify that the active input was the parameter input, as expected
    if (activeInputData.name != 'exploration.dummy.parameter') {
      console.log('Error: unexpected activeInputData.name ' + activeInputData.name);
    }
    //TODO(yanamal): require name and at least one starting value?
    // Add the new parameter to the list
    $scope.parameters.push({name: paramName, values: paramVals});
    console.log($scope.parameters);
    // Save the parameter property TODO(yanamal)
    // Reset and hide the input field
    $scope.resetParamInput();
  };

  /**
   * delete a  parameter
   * @param {number} index the index of the parameter to be deleted
   */
  $scope.deleteParameter = function(index) {
    $scope.parameters.splice(index, 1);
    // TODO(yanamal): save to server-side
  };
}

function InteractiveWidgetPreview($scope, $http, $compile, warningsData, explorationData) {
  var data = explorationData.getStateData($scope.stateId);

  $scope.$on('stateData', function() {
    $scope.initInteractiveWidget(explorationData.getStateData($scope.stateId));
  });

  $scope.initInteractiveWidget = function(data) {
    // Stores rules in the form of key-value pairs. For each pair, the key is the corresponding
    // action and the value has several keys:
    // - 'rule' (the raw rule string)
    // - 'inputs' (a list of parameters)
    // - 'attrs' (stuff needed to build the Python classifier code)
    // - 'dest' (the destination for this rule)
    // - 'feedback' (any feedback given for this rule)
    // - 'paramChanges' (parameter changes associated with this rule)
    $scope.interactiveRulesets = data.widget.rules;
    $scope.interactiveParams = data.widget.params;
    $http.get('/interactive_widgets/' + data.widget.id).success(
      function(widgetData) {
        $scope.addContentToIframe('interactiveWidgetPreview', widgetData.widget.raw);
        $scope.interactiveWidget = widgetData.widget;
      }
    );
  };

  if (data) {
    $scope.initInteractiveWidget(data);
  }

  $scope.selectRule = function(rule, attrs) {
    $scope.deselectAllRules();
    $scope.addRuleActionRule = rule;
    $scope.addRuleActionAttrs = attrs;
    $scope.addRuleActionDest = $scope.stateName;
  };

  $scope.deselectAllRules = function() {
    $scope.addRuleActionIndex = null;
    $scope.addRuleActionRule = null;
    $scope.addRuleActionAttrs = null;
    $scope.addRuleActionInputs = {};
    $scope.addRuleActionDest = null;
    $scope.addRuleActionFeedback = null;
  };

  $scope.openAddRuleModal = function(action) {
    $scope.addRuleModalTitle = 'Add Rule';
    $scope.addRuleAction = action;
    $scope.addRuleActionIndex = null;
  };

  $scope.openEditRuleModal = function(action, index) {
    $scope.addRuleModalTitle = 'Edit Rule';
    $scope.addRuleAction = action;

    $scope.addRuleActionIndex = index;
    var rule = $scope.interactiveRulesets[action][index];
    $scope.addRuleActionRule = rule.rule;
    $scope.addRuleActionAttrs = rule.attrs;
    $scope.addRuleActionInputs = rule.inputs;
    $scope.addRuleActionDest = rule.dest;
    $scope.addRuleActionFeedback = rule.feedback;
  };

  $('#addRuleModal').on('hide', function() {
    if ($scope.addRuleActionRule) {
      var bad = false;
      // TODO(sll): Do error-checking here.

      if (!bad) {
        var finalRuleset = {
            rule: $scope.addRuleActionRule,
            attrs: $scope.addRuleActionAttrs,
            inputs: $scope.addRuleActionInputs,
            dest: $scope.convertDestToId($scope.addRuleActionDest),
            feedback: $scope.addRuleActionFeedback
        };

        if (!$scope.interactiveRulesets.hasOwnProperty($scope.addRuleAction)) {
          $scope.interactiveRulesets[$scope.addRuleAction] = [];
        }

        var rules = $scope.interactiveRulesets[$scope.addRuleAction];

        if ($scope.addRuleActionIndex !== null) {
          rules[$scope.addRuleActionIndex] = finalRuleset;
        } else {
          rules.splice(rules.length - 1, 0, finalRuleset);
        }
        $scope.saveInteractiveWidget();
      }
    }

    $scope.addRuleAction = null;
    $scope.deselectAllRules();
  });

  $scope.swapRules = function(action, index1, index2) {
    $scope.tmpRule = $scope.interactiveRulesets[action][index1];
    $scope.interactiveRulesets[action][index1] =
        $scope.interactiveRulesets[action][index2];
    $scope.interactiveRulesets[action][index2] = $scope.tmpRule;

    $scope.saveInteractiveWidget();
  };

  $scope.deleteRule = function(action, index) {
    $scope.interactiveRulesets[action].splice(index, 1);
    $scope.saveInteractiveWidget();
  };

  $scope.convertDestToId = function(destName) {
    if (!destName) {
      warningsData.addWarning('Please choose a destination.');
      return;
    }

    var destId = '';

    var found = false;
    if (destName.toUpperCase() == END_DEST) {
      found = true;
      destId = END_DEST;
    } else {
      // Find the id in states.
      // TODO(sll): The next block of code should not be here. It is for the
      // case where the destName is actually an id.
      if (destName in $scope.states) {
        return destName;
      }

      for (var id in $scope.states) {
        if ($scope.states[id].name == destName) {
          found = true;
          destId = id;
          break;
        }
      }
    }

    // TODO(sll): Add the following code, which triggers when the dest id
    // doesn't exist.
    // if (!found) {
    //   $scope.addState(destName, true, categoryId);
    //   return;
    // }

    if (!found) {
      warningsData.addWarning('Invalid destination id.');
      // TODO(sll): This is probably not the correct thing to return.
      return destName;
    }

    return destId;
  };

  // TODO(sll): Use this in the UI.
  $scope.getDestDescription = function(dest) {
    if (!dest) {
      return 'Error: unspecified destination';
    } else if (dest == END_DEST) {
      return 'Destination: END';
    } else if (dest in $scope.states) {
      return 'Destination: ' + $scope.states[dest].name;
    } else {
      return '[Error: invalid destination]';
    }
  };

  $('#interactiveWidgetModal').on('hide', function() {
    // Reload the iframe.
    var F = $('#interactiveWidgetRepository');
    F[0].src = F[0].src;
  });

  // Receive messages from the widget repository.
  $scope.$on('message', function(event, arg) {
    $scope.addContentToIframe('interactiveWidgetPreview', arg.data.raw);
    $('#interactiveWidgetModal').modal('hide');
    console.log($scope.interactiveWidget);
    if ($scope.interactiveWidget.id != arg.data.widget.id) {
      $scope.interactiveWidget = arg.data.widget;
      $scope.interactiveParams = {};
      $scope.interactiveRulesets = {'submit': [{
          'rule': 'Default',
          'attrs': {},
          'inputs': {},
          'dest': $scope.stateId,
          'feedback': '',
          'paramChanges': []
      }]};
    }
    $scope.saveInteractiveWidget();
  });

  $scope.saveInteractiveWidget = function() {
    $scope.$parent.$parent.interactiveWidget = $scope.interactiveWidget;
    $scope.$parent.$parent.interactiveRulesets = $scope.interactiveRulesets;
    $scope.$parent.$parent.interactiveParams = $scope.interactiveParams;
    $scope.saveStateChange('interactiveWidget');
  };
}

/**
 * Injects dependencies in a way that is preserved by minification.
 */
EditorExploration.$inject = ['$scope', '$http', '$location', '$route',
    '$routeParams', 'explorationData', 'warningsData', 'activeInputData'];
ExplorationTab.$inject = ['$scope'];
InteractiveWidgetPreview.$inject = ['$scope', '$http', '$compile', 'warningsData', 'explorationData'];
