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

// TODO(sll): Move all strings to the top of the file and internationalize them.
// TODO(sll): console.log is not supported in IE.

// Receive events from the iframed widget repository.
oppia.run(['$rootScope', function($rootScope) {
  window.addEventListener('message', function(evt) {
    $rootScope.$broadcast('message', evt);
  });
}]);

function EditorExploration($scope, $http, $location, $anchorScroll, $modal, $window,
    $filter, $rootScope, explorationData, warningsData, activeInputData, oppiaRequestCreator) {

  $scope.currentlyInStateContext = function() {
    return Boolean($scope.stateName);
  };

  var CONTRIBUTE_GALLERY_PAGE = '/contribute';

  /**************************************************
  * Methods affecting the saving of explorations.
  **************************************************/

  // Temporary buffer for changes made to the exploration.
  $scope.explorationChangeList = [];
  // Stack for storing undone changes. The last element is the most recently
  // undone change.
  $scope.undoneChangeStack = [];
  // Whether or not a save action is currently in progress.
  $scope.isSaveInProgress = false;
  // Whether or not a discard action is currently in progress.
  $scope.isDiscardInProgress = false;

  // TODO(sll): Implement undo, redo functionality. Show a message on each step
  // saying what the step is doing.
  // TODO(sll): Allow the user to view the list of changes made so far, as well
  // as the list of changes in the undo stack.

  var CMD_ADD_STATE = 'add_state';
  var CMD_RENAME_STATE = 'rename_state';
  var CMD_DELETE_STATE = 'delete_state';
  var CMD_EDIT_STATE_PROPERTY = 'edit_state_property';
  var CMD_EDIT_EXPLORATION_PROPERTY = 'edit_exploration_property';

  $scope.STATE_BACKEND_NAMES_TO_FRONTEND_NAMES = {
    'widget_customization_args': 'widgetCustomizationArgs',
    'widget_id': 'widgetId',
    'widget_handlers': 'widgetHandlers',
    'widget_sticky': 'widgetSticky',
    'state_name': 'stateName',
    'content': 'content',
    'param_changes': 'stateParamChanges'
  };

  $scope.EXPLORATION_BACKEND_NAMES_TO_FRONTEND_NAMES = {
    'title': 'explorationTitle',
    'category': 'explorationCategory',
    'param_specs': 'paramSpecs',
    'param_changes': 'explorationParamChanges'
  };

  $scope.addRenameStateChange = function(newStateName, oldStateName) {
    $scope.explorationChangeList.push({
      cmd: CMD_RENAME_STATE,
      old_state_name: oldStateName,
      new_state_name: newStateName
    });
  };

  $scope.addStateChange = function(backendName, newValue, oldValue) {
    if ($rootScope.loadingMessage || angular.equals(newValue, oldValue)) {
      return;
    }

    if (!$scope.stateName) {
      warningsData.addWarning('Unexpected error: a state property was saved ' +
          'outside the context of a state. We would appreciate it if you ' +
          'reported this bug here: https://code.google.com/p/oppia/issues/list.');
      return;
    }
    if (!$scope.STATE_BACKEND_NAMES_TO_FRONTEND_NAMES.hasOwnProperty(backendName)) {
      warningsData.addWarning('Invalid state property: ' + backendName);
      return;
    }

    $scope.explorationChangeList.push({
      cmd: CMD_EDIT_STATE_PROPERTY,
      state_name: $scope.stateName,
      property_name: backendName,
      new_value: newValue,
      old_value: oldValue
    });
    $scope.undoneChangeStack = [];
  };

  /**
   * Saves a property of an exploration (e.g. title, category, etc.)
   * @param {string} backendName The backend name of the property (e.g. title, category)
   * @param {string} newValue The new value of the property
   * @param {string} oldValue The previous value of the property
   */
  $scope.addExplorationChange = function(backendName, newValue, oldValue) {
    if ($rootScope.loadingMessage || angular.equals(newValue, oldValue)) {
      return;
    }

    if (!$scope.EXPLORATION_BACKEND_NAMES_TO_FRONTEND_NAMES.hasOwnProperty(backendName)) {
      warningsData.addWarning('Invalid exploration property: ' + backendName);
      return;
    }

    $scope.explorationChangeList.push({
      cmd: CMD_EDIT_EXPLORATION_PROPERTY,
      property_name: backendName,
      new_value: newValue,
      old_value: oldValue
    });
    $scope.undoneChangeStack = [];
  };

  $scope.discardChanges = function() {
    var confirmDiscard = confirm('Do you want to discard your changes?');
    if (confirmDiscard) {
      $scope.isDiscardInProgress = true;

      // Clear both change lists.
      $scope.explorationChangeList = [];
      $scope.undoneChangeStack = [];

      $scope.initExplorationPage(function() {
        $scope.selectMainTab();

        // The $apply() is needed to call all the exploration field $watch()
        // methods before flipping isDiscardInProgress.
        $scope.$apply();
        $scope.isDiscardInProgress = false;
      });
    }
  };

  $scope.isExplorationSaveable = function() {
    return $scope.isExplorationLockedForEditing() && !$scope.isSaveInProgress;
  };

  $scope.isExplorationLockedForEditing = function() {
    return $scope.explorationChangeList.length > 0;
  };

  $scope.displaySaveReminderWarning = function() {
    warningsData.addWarning('You need to save your changes before continuing.');
  };

  $window.addEventListener('beforeunload', function(e) {
    if ($scope.isExplorationLockedForEditing()) {
      var confirmationMessage = (
          'You have unsaved changes which will be lost if you leave this page.');
      (e || $window.event).returnValue = confirmationMessage;
      return confirmationMessage;
    }
  });

  $scope.saveChanges = function() {
    $scope.changeListSummaryUrl = '/createhandler/change_list_summary/' + $scope.explorationId;

    $http.post(
      $scope.changeListSummaryUrl,
      oppiaRequestCreator.createRequest({
        change_list: $scope.explorationChangeList,
        version: explorationData.data.version
      }),
      {headers: {'Content-Type': 'application/x-www-form-urlencoded'}})
    .then(function(response) {
      var data = response.data;

      if (data.error) {
        warningsData.addWarning(data.error);
        return;
      }

      var explorationPropertyChanges = data.summary.exploration_property_changes;
      var statePropertyChanges = data.summary.state_property_changes;
      var changedStates = data.summary.changed_states;
      var addedStates = data.summary.added_states;
      var deletedStates = data.summary.deleted_states;
      var warningMessage = data.warning_message;

      var changesExist = (
        !$.isEmptyObject(explorationPropertyChanges) ||
        !$.isEmptyObject(statePropertyChanges) ||
        changedStates.length > 0 ||
        addedStates.length > 0 ||
        deletedStates.length > 0);

      if (!changesExist) {
        warningsData.addWarning('Your changes cancel each other out, ' +
          'so nothing has been saved.');
        return;
      }

      if ($scope.isPublic && warningMessage) {
        console.log(warningMessage);
        // Warnings should be fixed before an exploration is published.
        warningsData.addWarning(warningMessage);
        return;
      }

      warningsData.clear();

      var modalInstance = $modal.open({
        templateUrl: 'modals/saveExploration',
        backdrop: 'static',
        resolve: {
          explorationPropertyChanges: function() {
            return explorationPropertyChanges;
          },
          statePropertyChanges: function() {
            return statePropertyChanges;
          },
          changedStates: function() {
            return changedStates;
          },
          addedStates: function() {
            return addedStates;
          },
          deletedStates: function() {
            return deletedStates;
          },
          commitMessageIsOptional: function() {
            return !$scope.isPublic;
          }
        },
        controller: [
          '$scope', '$modalInstance', 'explorationPropertyChanges',
          'statePropertyChanges', 'changedStates', 'addedStates',
          'deletedStates', 'commitMessageIsOptional',
          function($scope, $modalInstance, explorationPropertyChanges,
                   statePropertyChanges, changedStates, addedStates,
                   deletedStates, commitMessageIsOptional) {
            $scope.explorationPropertyChanges = explorationPropertyChanges;
            $scope.statePropertyChanges = statePropertyChanges;
            $scope.changedStates = changedStates;
            $scope.addedStates = addedStates;
            $scope.deletedStates = deletedStates;
            $scope.commitMessageIsOptional = commitMessageIsOptional;

            $scope.EXPLORATION_BACKEND_NAMES_TO_HUMAN_NAMES = {
              'title': 'Title',
              'category': 'Category',
              'param_specs': 'Parameter specifications',
              'param_changes': 'Initial parameter changes'
            };

            $scope.STATE_BACKEND_NAMES_TO_HUMAN_NAMES = {
              'name': 'State name',
              'param_changes': 'Parameter changes',
              'content': 'Content',
              'widget_id': 'Interaction type',
              'widget_customization_args': 'Interaction customizations',
              'widget_sticky': 'Whether to reuse the previous interaction',
              'widget_handlers': 'Reader submission rules'
            }

            // An ordered list of state properties that determines the order in which
            // to show them in the save confirmation modal.
            // TODO(sll): Implement this fully. Currently there is no sorting.
            $scope.ORDERED_STATE_PROPERTIES = [
              'name', 'param_changes', 'content', 'widget_id',
              'widget_customization_args', 'widget_sticky', 'widget_handlers'
            ];

            $scope.explorationChangesExist = !$.isEmptyObject(
              $scope.explorationPropertyChanges);
            $scope.stateChangesExist = !$.isEmptyObject(
              $scope.statePropertyChanges);

            $scope._getLongFormPropertyChange = function(humanReadableName, changeInfo) {
              return (
                humanReadableName + ' (from \'' + changeInfo.old_value +
                '\' to \'' + changeInfo.new_value + '\')');
            };

            $scope.formatExplorationPropertyChange = function(propertyName, changeInfo) {
              if (propertyName == 'title' || propertyName == 'category') {
                return $scope._getLongFormPropertyChange(
                  $scope.EXPLORATION_BACKEND_NAMES_TO_HUMAN_NAMES[propertyName],
                  changeInfo);
              } else {
                return $scope.EXPLORATION_BACKEND_NAMES_TO_HUMAN_NAMES[propertyName];
              }
            };

            $scope.formatStatePropertyChange = function(propertyName, changeInfo) {
              if (propertyName == 'name') {
                return $scope._getLongFormPropertyChange(
                  $scope.STATE_BACKEND_NAMES_TO_HUMAN_NAMES[propertyName],
                  changeInfo);
              } else {
                return $scope.STATE_BACKEND_NAMES_TO_HUMAN_NAMES[propertyName];
              }
            };

            $scope.formatStateList = function(stateList) {
              return stateList.join('; ');
            };

            $scope.save = function(commitMessage) {
              $modalInstance.close(commitMessage);
            };
            $scope.cancel = function() {
              $modalInstance.dismiss('cancel');
              warningsData.clear();
            };
          }
        ]
      });

      modalInstance.result.then(function(commitMessage) {
        $scope.isSaveInProgress = true;

        explorationData.save(
          $scope.explorationChangeList, commitMessage, function() {
            $scope.explorationChangeList = [];
            $scope.undoneChangeStack = [];
            $scope.initExplorationPage();
            $scope.isSaveInProgress = false;
          }, function() {
            $scope.isSaveInProgress = false;
          });
      });
    });
  };

  /********************************************
  * Methods affecting the URL location hash.
  ********************************************/
  $scope.mainTabActive = false;
  $scope.statsTabActive = false;
  $scope.guiTabActive = false;

  $scope.location = $location;

  var GUI_EDITOR_URL = '/gui';
  var STATS_VIEWER_URL = '/stats';
  var firstLoad = true;

  $scope.selectMainTab = function() {
    // This is needed so that if a state id is entered in the URL,
    // the first tab does not get selected automatically, changing
    // the location to '/'.
    if (firstLoad) {
      firstLoad = false;
    } else {
      $location.path('/');
    }
  };

  $scope.selectStatsTab = function() {
    $location.path('/stats');
  };

  $scope.selectGuiTab = function() {
    $location.path('/gui/' + $scope.stateName);
  };

  $scope.$watch(function() {
    return $location.path();
  }, function(newPath, oldPath) {
    var path = newPath;
    console.log('Path is now ' + path);

    if (path.indexOf('/gui/') != -1) {
      $scope.stateName = path.substring('/gui/'.length);

      var callback = function() {
        var stateData = $scope.states[$scope.stateName];
        if (stateData === null || stateData === undefined || $.isEmptyObject(stateData)) {
          // This state does not exist. Redirect to the exploration page.
          warningsData.addWarning('State ' + $scope.stateName + ' does not exist.');
          $location.path('/');
          return;
        } else {
          $scope.guiTabActive = true;
          $scope.statsTabActive = false;
          $scope.mainTabActive = false;
          $scope.$broadcast('guiTabSelected', $scope.stateName);
          // Scroll to the relevant element (if applicable).
          // TODO(sfederwisch): Change the trigger so that there is exactly one
          // scroll action that occurs when the page finishes loading.
          setTimeout(function () {
            if ($location.hash()) {
              $anchorScroll();
            }
            if (firstLoad) {
              firstLoad = false;
            }
          }, 1000);
        }
      };

      if (!$.isEmptyObject($scope.states)) {
        callback();
      } else {
        $scope.initExplorationPage(callback);
      }
    } else if (path == STATS_VIEWER_URL) {
      $location.hash('');
      $scope.stateName = '';
      $scope.stateName = '';
      $scope.statsTabActive = true;
      $scope.mainTabActive = false;
      $scope.guiTabActive = false;
    } else {
      $location.path('/');
      $location.hash('');
      $scope.stateName = '';
      $scope.stateName = '';
      $scope.mainTabActive = true;
      $scope.guiTabActive = false;
      $scope.statsTabActive = false;
    }
  });

  /********************************************
  * Methods affecting the graph visualization.
  ********************************************/
  $scope.drawGraph = function() {
    $scope.graphData = $scope.reformatResponse(
      $scope.states, $scope.initStateName);
  };

  $scope.isEndStateReachable = function() {
    if (!$scope.graphData) {
      return true;
    }
    for (var i = 0; i < $scope.graphData.nodes.length; i++) {
      if ($scope.graphData.nodes[i].name == END_DEST) {
        return $scope.graphData.nodes[i].reachable;
      }
    }
    return true;
  };


  /**********************************************************
   * Called on initial load of the exploration editor page.
   *********************************************************/
  $rootScope.loadingMessage = 'Loading';

  // The pathname should be: .../create/{exploration_id}
  $scope.explorationId = pathnameArray[2];
  // The exploration id needs to be attached to the root scope in order for
  // the file picker widget to work. (Note that an alternative approach might
  // also be to replicate this URL-based calculation in the file picker widget.)
  $rootScope.explorationId = pathnameArray[2];
  $scope.explorationUrl = '/create/' + $scope.explorationId;
  $scope.explorationDataUrl = '/createhandler/data/' + $scope.explorationId;
  $scope.explorationDownloadUrl = '/createhandler/download/' + $scope.explorationId;
  $scope.explorationRightsUrl = '/createhandler/rights/' + $scope.explorationId;
  $scope.explorationSnapshotsUrl = '/createhandler/snapshots/' + $scope.explorationId;
  $scope.explorationStatisticsUrl = '/createhandler/statistics/' + $scope.explorationId;

  $scope.versionHistoryIsShown = false;
  $scope.explorationSnapshots = null;

  $scope.toggleVersionHistoryDisplay = function() {
    if (!$scope.versionHistoryIsShown && $scope.explorationSnapshots === null) {
      // TODO(sll): Do this on-hover rather than on-click.
      $scope.refreshVersionHistory();
    }
    $scope.versionHistoryIsShown = !$scope.versionHistoryIsShown;
  };

  // Refreshes the displayed version history log.
  $scope.refreshVersionHistory = function() {
    $http.get($scope.explorationSnapshotsUrl).then(function(response) {
      var data = response.data;

      $scope.explorationSnapshots = [];
      for (var i = 0; i < data.snapshots.length; i++) {
        $scope.explorationSnapshots.push({
          'committerId': data.snapshots[i].committer_id,
          'createdOn': data.snapshots[i].created_on,
          'commitMessage': data.snapshots[i].commit_message,
          'versionNumber': data.snapshots[i].version_number,
          'autoSummary': data.snapshots[i].auto_summary
        });
      }
    });
  };

  $scope.refreshExplorationStatistics = function() {
    $http.get($scope.explorationStatisticsUrl).then(function(response) {
      var data = response.data;

      $scope.stats = {
        'numVisits': data.num_visits,
        'numCompletions': data.num_completions,
        'stateStats': data.state_stats,
        'imp': data.imp
      };

      $scope.chartData = [
        ['', 'Completions', 'Non-completions'],
        ['', data.num_completions, data.num_visits - data.num_completions]
      ];
      $scope.chartColors = ['green', 'firebrick'];

      $scope.statsGraphOpacities = {
        legend: 'Students entering state'
      };
      for (var stateName in $scope.states) {
        var visits = $scope.stats.stateStats[stateName].firstEntryCount;
        $scope.statsGraphOpacities[stateName] = Math.max(
            visits / $scope.stats.numVisits, 0.05);
      }
      $scope.statsGraphOpacities[END_DEST] = Math.max(
          $scope.stats.numCompletions / $scope.stats.numVisits, 0.05);

      $scope.highlightStates = {
        legend: '#EE8800:Needs more feedback,brown:May be confusing'
      };
      for (var j = 0; j < data.imp.length; j++) {
        if (data.imp[j].type == 'default') {
          $scope.highlightStates[data.imp[j].state_name] = '#EE8800';
        }
        if (data.imp[j].type == 'incomplete') {
          $scope.highlightStates[data.imp[j].state_name] = 'brown';
        }
      }
    });
  };

  $scope.initializeNewActiveInput = function(newActiveInput) {
    // TODO(sll): Rework this so that in general it saves the current active
    // input, if any, first. If it is bad input, display a warning and cancel
    // the effects of the old change. But, for now, each case is handled
    // specially.
    console.log('Current Active Input: ' + activeInputData.name);

    var inputArray = newActiveInput.split('.');

    activeInputData.name = (newActiveInput || '');
    // TODO(sll): Initialize the newly displayed field.
  };

  $scope.ROLES = [
    {name: 'Manager (can edit permissions)', value: 'owner'},
    {name: 'Collaborator (can make changes)', value: 'editor'},
    {name: 'Playtester (can give feedback)', value: 'viewer'}
  ];

  // Initializes the exploration rights information using the rights dict from
  // the backend.
  $scope.initExplorationRights = function(rightsData) {
    $scope.ownerNames = rightsData.owner_names;
    $scope.editorNames = rightsData.editor_names;
    $scope.viewerNames = rightsData.viewer_names;
    $scope.isPublic = Boolean(
      rightsData.status === GLOBALS.EXPLORATION_STATUS_PUBLIC);
    $scope.isCloned = Boolean(rightsData.cloned_from);
    $scope.isCommunityOwned = rightsData.community_owned;
  };

  // Initializes the exploration page using data from the backend. Called on
  // page load.
  $scope.initExplorationPage = function(successCallback) {
    explorationData.getData().then(function(data) {
      $scope.currentUserIsAdmin = data.is_admin;
      $scope.states = angular.copy(data.states);
      $scope.explorationTitle = data.title;
      $scope.explorationCategory = data.category;
      $scope.initStateName = data.init_state_name;
      $scope.currentUser = data.user;
      $scope.paramSpecs = angular.copy(data.param_specs || {});
      $scope.explorationParamChanges = angular.copy(data.param_changes || []);

      $scope.explorationTitleMemento = data.title;
      $scope.explorationCategoryMemento = data.category;

      $scope.initExplorationRights(data.rights);

      $scope.drawGraph();

      $rootScope.loadingMessage = '';

      $scope.refreshExplorationStatistics();

      if (successCallback) {
        successCallback();
      }
    });
  };

  $scope.initExplorationPage();

  $scope.reformatResponse = function(states, initStateName) {
    var SENTINEL_DEPTH = 3000;
    var VERT_OFFSET = 20;
    var HORIZ_SPACING = 150;
    var VERT_SPACING = 100;
    var HORIZ_OFFSET = 100;
    var nodes = {};

    var state;
    nodes[END_DEST] = {
      name: END_DEST,
      depth: SENTINEL_DEPTH,
      reachable: false,
      reachableFromEnd: false
    };
    for (stateName in states) {
      nodes[stateName] = {
        name: (stateName == END_DEST ? END_DEST : stateName),
        depth: SENTINEL_DEPTH,
        reachable: false,
        reachableFromEnd: false
      };
    }
    nodes[initStateName].depth = 0;

    var maxDepth = 0;
    var seenNodes = [initStateName];
    var queue = [initStateName];
    var maxXDistPerLevel = {0: HORIZ_OFFSET};
    nodes[initStateName].y0 = VERT_OFFSET;
    nodes[initStateName].x0 = HORIZ_OFFSET;

    var handlers, ruleSpecs, h, i;

    while (queue.length > 0) {
      var currNode = queue[0];
      queue.shift();
      nodes[currNode].reachable = true;
      if (currNode in states) {
        handlers = states[currNode].widget.handlers;
        for (h = 0; h < handlers.length; h++) {
          ruleSpecs = handlers[h].rule_specs;
          for (i = 0; i < ruleSpecs.length; i++) {
            // Assign levels to nodes only when they are first encountered.
            if (seenNodes.indexOf(ruleSpecs[i].dest) == -1) {
              seenNodes.push(ruleSpecs[i].dest);
              nodes[ruleSpecs[i].dest].depth = nodes[currNode].depth + 1;
              nodes[ruleSpecs[i].dest].y0 = (nodes[currNode].depth + 1) * VERT_SPACING + VERT_OFFSET;
              if (nodes[currNode].depth + 1 in maxXDistPerLevel) {
                nodes[ruleSpecs[i].dest].x0 = maxXDistPerLevel[nodes[currNode].depth + 1] + HORIZ_SPACING;
                maxXDistPerLevel[nodes[currNode].depth + 1] += HORIZ_SPACING;
              } else {
                nodes[ruleSpecs[i].dest].x0 = HORIZ_OFFSET;
                maxXDistPerLevel[nodes[currNode].depth + 1] = HORIZ_OFFSET;
              }
              maxDepth = Math.max(maxDepth, nodes[currNode].depth + 1);
              queue.push(ruleSpecs[i].dest);
            }
          }
        }
      }
    }

    // Handle nodes that have not been visited in the forward traversal.
    var horizPositionForLastRow = HORIZ_OFFSET;
    var node;
    for (node in nodes) {
      if (nodes[node].depth == SENTINEL_DEPTH) {
        nodes[node].depth = maxDepth + 1;
        nodes[node].y0 = VERT_OFFSET + nodes[node].depth * VERT_SPACING;
        nodes[node].x0 = horizPositionForLastRow;
        horizPositionForLastRow += HORIZ_SPACING;
      }
    }

    // Assign unique IDs to each node.
    var idCount = 0;
    var nodeList = [];
    for (node in nodes) {
      var nodeMap = nodes[node];
      nodeMap['hashId'] = node;
      nodeMap['id'] = idCount;
      nodes[node]['id'] = idCount;
      idCount++;
      nodeList.push(nodeMap);
    }

    var links = [];
    for (state in states) {
      handlers = states[state].widget.handlers;
      for (h = 0; h < handlers.length; h++) {
        ruleSpecs = handlers[h].rule_specs;
        for (i = 0; i < ruleSpecs.length; i++) {
          links.push({
            source: nodeList[nodes[state].id],
            target: nodeList[nodes[ruleSpecs[i].dest].id],
            name: $filter('parameterizeRuleDescription')(ruleSpecs[i])
          });
        }
      }
    }

    // Mark nodes that are reachable from the END state via backward links.
    queue = [END_DEST];
    nodes[END_DEST].reachableFromEnd = true;
    while (queue.length > 0) {
      var currNodeId = queue[0];
      queue.shift();

      for (i = 0; i < links.length; i++) {
        if (links[i].target.hashId == currNodeId &&
            !links[i].source.reachableFromEnd) {
          links[i].source.reachableFromEnd = true;
          queue.push(links[i].source.hashId);
        }
      }
    }

    return {nodes: nodeList, links: links, initStateName: initStateName};
  };

  $scope.saveExplorationTitle = function(newValue) {
    newValue = $scope.normalizeWhitespace(newValue);
    if (!$scope.isValidEntityName(newValue, true)) {
      $scope.explorationTitle = $scope.explorationTitleMemento;
      return;
    }

    warningsData.clear();
    $scope.explorationTitle = newValue;
    $scope.addExplorationChange(
      'title', newValue, $scope.explorationTitleMemento);
    $scope.explorationTitleMemento = $scope.explorationTitle;
  }

  $scope.saveExplorationCategory = function(newValue) {
    newValue = $scope.normalizeWhitespace(newValue);
    if (!$scope.isValidEntityName(newValue, true)) {
      $scope.explorationCategory = $scope.explorationCategoryMemento;
      return;
    }

    warningsData.clear();
    $scope.explorationCategory = newValue;
    $scope.addExplorationChange(
      'category', newValue, $scope.explorationCategoryMemento);
    $scope.explorationCategoryMemento = $scope.explorationCategory;
  }

  $scope.saveExplorationParamChanges = function(newValue, oldValue) {
    $scope.addExplorationChange('param_changes', newValue, oldValue);
  };

  $scope.$watch('paramSpecs', function(newValue, oldValue) {
    if (oldValue !== undefined && !$scope.isDiscardInProgress) {
      $scope.addExplorationChange('param_specs', newValue, oldValue);
    }
  });

  $scope.addExplorationParamSpec = function(name, type, successCallback) {
    console.log("adding parameter to exploration");
    if (name in $scope.paramSpecs) {
      warningsData.addWarning(
        'Parameter ' + name + ' already exists, so it was not added.');
      return;
    }

    var oldParamSpecs = angular.copy($scope.paramSpecs);

    $scope.paramSpecs[name] = {obj_type: type};
    $scope.addExplorationChange(
      'param_specs', angular.copy($scope.paramSpecs), oldParamSpecs);
  };

  /**
   * Downloads the YAML representation of an exploration.
   */
  $scope.downloadExploration = function() {
    document.location = $scope.explorationDownloadUrl;
  };

  /********************************************
  * Methods for rights management.
  ********************************************/
  $scope.openEditRolesForm = function() {
    activeInputData.name = 'explorationMetadata.editRoles';
    $scope.newMemberEmail = '';
    $scope.newMemberRole = $scope.ROLES[0];
  };

  $scope.closeEditRolesForm = function() {
    $scope.newMemberEmail = '';
    $scope.newMemberRole = $scope.ROLES[0];
    activeInputData.clear();
  };

  $scope.editRole = function(newMemberEmail, newMemberRole) {
    activeInputData.clear();
    $scope._saveExplorationRightsChange({
      new_member_email: newMemberEmail,
      new_member_role: newMemberRole
    });
  };

  $scope._saveExplorationRightsChange = function(requestParameters) {
    requestParameters['version'] = explorationData.data.version;
    $http.put(
        $scope.explorationRightsUrl,
        oppiaRequestCreator.createRequest(requestParameters),
        {headers: {'Content-Type': 'application/x-www-form-urlencoded'}}).
            success(function(data) {
              warningsData.clear();
              $scope.initExplorationRights(data.rights);
            }).
            error(function(data) {
              warningsData.addWarning(
                data.error || 'Error communicating with server.');
            });
  };

  $scope.showPublishExplorationModal = function() {
    warningsData.clear();
    $modal.open({
      templateUrl: 'modals/publishExploration',
      backdrop: 'static',
      controller: ['$scope', '$modalInstance', function($scope, $modalInstance) {
          $scope.publish = function() {
            $modalInstance.close();
          };

          $scope.cancel = function() {
            $modalInstance.dismiss('cancel');
            warningsData.clear();
          };
        }
      ]
    }).result.then(function() {
      $scope._saveExplorationRightsChange({is_public: true});
    });
  };

  $scope.showReleaseExplorationOwnershipModal = function() {
    warningsData.clear();
    $modal.open({
      templateUrl: 'modals/releaseExplorationOwnership',
      backdrop: 'static',
      controller: ['$scope', '$modalInstance', function($scope, $modalInstance) {
          $scope.release = function() {
            $modalInstance.close();
          };

          $scope.cancel = function() {
            $modalInstance.dismiss('cancel');
            warningsData.clear();
          };
        }
      ]
    }).result.then(function() {
      $scope._saveExplorationRightsChange({is_community_owned: true});
    });
  };

  $scope.deleteExploration = function() {
    warningsData.clear();

    var modalInstance = $modal.open({
      templateUrl: 'modals/deleteExploration',
      backdrop: 'static',
      controller: ['$scope', '$modalInstance', function($scope, $modalInstance) {
        $scope.reallyDelete = function() {
          $modalInstance.close();
        };

        $scope.cancel = function() {
          $modalInstance.dismiss('cancel');
          warningsData.clear();
        };
      }]
    });

    modalInstance.result.then(function() {
      $http['delete']($scope.explorationDataUrl)
      .success(function(data) {
        $window.location = CONTRIBUTE_GALLERY_PAGE;
      });
    });
  };

  /********************************************
  * Methods for operations on states.
  ********************************************/
  $scope.isNewStateNameValid = function(newStateName) {
    return (
      $scope.isValidEntityName(newStateName) &&
      newStateName.toUpperCase() !== END_DEST &&
      !$scope.states[newStateName]);
  };

  // Adds a new state to the list of states, and updates the backend.
  $scope.addState = function(newStateName, successCallback) {
    newStateName = $scope.normalizeWhitespace(newStateName);
    if (!$scope.isValidEntityName(newStateName, true)) {
      return;
    }
    if (newStateName.toUpperCase() == END_DEST) {
      warningsData.addWarning('Please choose a state name that is not \'END\'.');
      return;
    }
    for (var stateName in $scope.states) {
      if (stateName == newStateName) {
        warningsData.addWarning('A state with this name already exists.');
        return;
      }
    }

    warningsData.clear();

    $scope.newStateTemplateUrl = '/createhandler/new_state_template/' + $scope.explorationId;
    $http.post(
      $scope.newStateTemplateUrl,
      oppiaRequestCreator.createRequest({
        state_name: newStateName
      }),
      {headers: {'Content-Type': 'application/x-www-form-urlencoded'}})
    .then(function(response) {
      var data = response.data;
      $scope.states[newStateName] = data.new_state;

      $scope.explorationChangeList.push({
        cmd: CMD_ADD_STATE,
        state_name: newStateName
      });

      $scope.drawGraph();
      $scope.newStateDesc = '';

      if (successCallback) {
        successCallback(newStateName);
      }
    });
  };

  $scope.deleteState = function(deleteStateName) {
    warningsData.clear();

    $modal.open({
      templateUrl: 'modals/deleteState',
      backdrop: 'static',
      resolve: {
        deleteStateName: function() {
          return deleteStateName;
        }
      },
      controller: [
        '$scope', '$modalInstance', 'deleteStateName',
        function($scope, $modalInstance, deleteStateName) {
          $scope.deleteStateName = deleteStateName;

          $scope.reallyDelete = function() {
            $modalInstance.close(deleteStateName);
          };

          $scope.cancel = function() {
            $modalInstance.dismiss('cancel');
            warningsData.clear();
          };
        }
      ]
    }).result.then(function(deleteStateName) {
      if (deleteStateName == $scope.initStateName) {
        warningsData.addWarning(
          'Deleting the initial state of a question is not supported. ' +
          'Perhaps edit it instead?');
        return;
      }

      if (!$scope.states[deleteStateName]) {
        warningsData.addWarning('No state with name ' + deleteStateName + ' exists.');
        return;
      }

      delete $scope.states[deleteStateName];
      for (var otherStateName in $scope.states) {
        var handlers = $scope.states[otherStateName].widget.handlers;
        for (var i = 0; i < handlers.length; i++) {
          for (var j = 0; j < handlers[i].rule_specs.length; j++) {
            if (handlers[i].rule_specs[j].dest === deleteStateName) {
              handlers[i].rule_specs[j].dest = otherStateName;
            }
          }
        }
      }

      if ($scope.stateName == deleteStateName) {
        $scope.stateName = '';
        $scope.selectMainTab();
      }

      $scope.explorationChangeList.push({
        cmd: CMD_DELETE_STATE,
        state_name: deleteStateName
      });

      $scope.drawGraph();
    });
  };
}

/**
 * Injects dependencies in a way that is preserved by minification.
 */
EditorExploration.$inject = [
  '$scope', '$http', '$location', '$anchorScroll', '$modal', '$window',
  '$filter', '$rootScope', 'explorationData', 'warningsData', 'activeInputData',
  'oppiaRequestCreator'
];
