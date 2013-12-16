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
var NONEXISTENT_STATE = '[none]';

// TODO(sll): Move all strings to the top of the file and internationalize them.
// TODO(sll): console.log is not supported in IE.

// Receive events from the iframed widget repository.
oppia.run(function($rootScope) {
  window.addEventListener('message', function(evt) {
    $rootScope.$broadcast('message', evt);
  });
});

function EditorExploration($scope, $http, $location, $anchorScroll, $modal, $window,
    $filter, $rootScope, explorationData, warningsData, activeInputData, requestCreator) {

  $scope.currentlyInStateContext = function() {
    return Boolean($scope.stateId);
  };

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

  $scope.addStateChange = function(backendName, frontendNames, newValue, oldValue) {
    if (!$scope.stateId) {
      warningsData.addWarning('Unexpected error: a state property was saved ' +
          'outside the context of a state. We would appreciate it if you ' +
          'reported this bug here: https://code.google.com/p/oppia/issues/list.');
      return;
    }
    $scope.explorationChangeList.push({
      stateId: $scope.stateId,
      backendName: backendName,
      frontendNames: frontendNames,
      newValue: newValue,
      oldValue: oldValue
    });
    $scope.undoneChangeStack = [];
  };

  $scope.addExplorationChange = function(backendName, frontendNames, newValue, oldValue) {
    $scope.explorationChangeList.push({
      backendName: backendName,
      frontendNames: frontendNames,
      newValue: newValue,
      oldValue: oldValue
    });
    $scope.undoneChangeStack = [];
  };

  $scope.saveChanges = function(
      explorationChanges, stateChanges, commitMessage) {

    $scope.isSaveInProgress = true;
    explorationData.save(
      explorationChanges, stateChanges, commitMessage, function() {
        // Reload the exploration page, including drawing the graph.
        // TODO(sll): This takes a long time. Can we shorten it?
        $scope.explorationChangeList = [];
        $scope.initExplorationPage();
        $scope.isSaveInProgress = false;
      }, function() {
        $scope.isSaveInProgress = false;
      });
  };

  $scope.discardExplorationChanges = function() {
    var confirmDiscard = confirm('Do you want to discard your changes?');
    if (confirmDiscard) {
      $scope.isDiscardInProgress = true;

      $scope.initExplorationPage(function() {
        if ($scope.stateId) {
          $scope.initStateData();
        }

        // The $apply() is needed to call all the exploration field $watch()
        // methods before flipping isDiscardInProgress.
        $scope.$apply();
        $scope.isDiscardInProgress = false;

        // Clear both change lists.
        $scope.explorationChangeList = [];
        $scope.undoneChangeStack = [];
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

  $scope.showSaveExplorationModal = function() {
    var netExplorationChanges = $scope.getNetExplorationChanges();
    var explorationChanges = netExplorationChanges.explorationChanges;
    var stateChanges = netExplorationChanges.stateChanges;

    var changesExist = (
      !$.isEmptyObject(explorationChanges) || !$.isEmptyObject(stateChanges));
    if (!changesExist) {
      warningsData.addWarning('Your changes cancel each other out, ' +
        'so nothing has been saved.');
      return;
    }

    warningsData.clear();

    // Create the save-confirmation and commit-message request dialogue.
    if (!$scope.isPublic) {
      // For unpublished explorations no commit message is needed.
      $scope.saveChanges(explorationChanges, stateChanges, '');
    } else {
      $scope.changeSummaries = $scope.createChangeSummaries(
        explorationChanges, stateChanges);

      var modalInstance = $modal.open({
        templateUrl: 'modals/saveExploration',
        backdrop: 'static',
        resolve: {
          changeSummaries: function() {
            return $scope.changeSummaries;
          }
        },
        controller: function($scope, $modalInstance, changeSummaries) {
          $scope.changeSummary = changeSummaries['MODAL_FORMAT'];

          $scope.explorationChangesExist = !$.isEmptyObject(
            $scope.changeSummary.exploration);
          $scope.stateChangesExist = !$.isEmptyObject(
            $scope.changeSummary.states);

          $scope.publish = function(commitMessage) {
            $modalInstance.close(commitMessage);
          };
          $scope.cancel = function() {
            $modalInstance.dismiss('cancel');
            warningsData.clear();
          };
        }
      });

      modalInstance.result.then(function(commitMessage) {
        var fullCommitMessage = $scope.neatJoin(
          commitMessage, $scope.changeSummaries['VERSION_LOG_FORMAT']
        );
        $scope.saveChanges(explorationChanges, stateChanges, fullCommitMessage);
      });
    }
  };

  $scope.EXPLORATION_PROPERTY_CHANGE_SUMMARIES = {
    'title': {
      MODAL_FORMAT: function(newValue, oldValue) {
        return 'Title (from \'' + oldValue + '\' to \'' + newValue + '\')';
      },
      VERSION_LOG_FORMAT: function(newValue, oldValue) {
        return 'title';
      }
    },
    'category': {
      MODAL_FORMAT: function(newValue, oldValue) {
        return 'Category (from \'' + oldValue + '\' to \'' + newValue + '\')';
      },
      VERSION_LOG_FORMAT: function(newValue, oldValue) {
        return 'category';
      }
    },
    'param_specs': {
      MODAL_FORMAT: function(newValue, oldValue) {
        return 'Parameter specifications';
      },
      VERSION_LOG_FORMAT: function(newValue, oldValue) {
        return 'parameter specifications';
      }
    },
    'param_changes': {
      MODAL_FORMAT: function(newValue, oldValue) {
        return 'Initial parameter changes';
      },
      VERSION_LOG_FORMAT: function(newValue, oldValue) {
        return 'initial parameter changes';
      }
    }
  };

  $scope.getExplorationPropertyChangeSummary = function(
      propertyName, format, values) {
    return $scope.EXPLORATION_PROPERTY_CHANGE_SUMMARIES[propertyName][format](
      values['newValue'], values['oldValue']);
  };

  $scope.STATE_PROPERTY_CHANGE_SUMMARIES = {
    // In future these will be elaborated to describe the changes made to each
    // state property.
    'state_name': {
      MODAL_FORMAT: function(newValue, oldValue) {
        return 'State name (from \'' + oldValue + '\' to \'' + newValue + '\')';
      },
      VERSION_LOG_FORMAT: function(newValue, oldValue) {
        return 'state name';
      }
    },
    'param_changes': {
      MODAL_FORMAT: function(newValue, oldValue) {
        return 'Parameter changes';
      },
      VERSION_LOG_FORMAT: function(newValue, oldValue) {
        return 'parameter changes';
      }
    },
    'content': {
      MODAL_FORMAT: function(newValue, oldValue) {
        return 'Content';
      },
      VERSION_LOG_FORMAT: function(newValue, oldValue) {
        return 'content';
      }
    },
    'widget_id': {
      MODAL_FORMAT: function(newValue, oldValue) {
        return 'Interaction type';
      },
      VERSION_LOG_FORMAT: function(newValue, oldValue) {
        return 'interaction type';
      }
    },
    'widget_customization_args': {
      MODAL_FORMAT: function(newValue, oldValue) {
        return 'Interaction customizations';
      },
      VERSION_LOG_FORMAT: function(newValue, oldValue) {
        return 'interaction customizations';
      }
    },
    'widget_sticky': {
      MODAL_FORMAT: function(newValue, oldValue) {
        return 'Whether to reuse the previous interaction';
      },
      VERSION_LOG_FORMAT: function(newValue, oldValue) {
        return 'whether to reuse the previous interaction';
      }
    },
    'widget_handlers': {
      MODAL_FORMAT: function(newValue, oldValue) {
        return 'Reader submission rules';
      },
      VERSION_LOG_FORMAT: function(newValue, oldValue) {
        return 'reader submission rules';
      }
    }
  };

  $scope.getStatePropertyChangeSummary = function(
      propertyName, format, values) {
    return $scope.STATE_PROPERTY_CHANGE_SUMMARIES[propertyName][format](
      values['newValue'], values['oldValue']);
  };

  // Returns whether any net changes have occurred.
  $scope.getNetExplorationChanges = function() {
    // This object is keyed by the name of the property that has changed.
    var rawExplorationChanges = {};
    // This object is keyed by the state id. The value of each property is
    // another object that is keyed by the name of the property for that state
    // that has changed.
    var rawStateChanges = {};

    // Identifies the net changes made to each property.
    for (var i = 0; i < $scope.explorationChangeList.length; i++) {
      var change = $scope.explorationChangeList[i];
      if (change.stateId) {
        var stateId = change.stateId;

        if (!rawStateChanges.hasOwnProperty(stateId)) {
          rawStateChanges[stateId] = {};
        }

        if (!rawStateChanges[stateId][change.backendName]) {
          rawStateChanges[stateId][change.backendName] = {
            oldValue: change.oldValue
          };
        }
        rawStateChanges[stateId][change.backendName].newValue = change.newValue;
      } else {
        // This is a change to an exploration property.
        if (!rawExplorationChanges[change.backendName]) {
          rawExplorationChanges[change.backendName] = {
            oldValue: change.oldValue
          };
        }
        rawExplorationChanges[change.backendName].newValue = change.newValue;
      }
    }

    // Remove changes with zero net effect.
    var explorationChanges = {};
    var stateChanges = {};
    for (var key in rawExplorationChanges) {
      if (!angular.equals(rawExplorationChanges[key].newValue,
                          rawExplorationChanges[key].oldValue)) {
        explorationChanges[key] = rawExplorationChanges[key];
      }
    }

    for (var stateId in rawStateChanges) {
      var stateChangeObj = {};
      for (var key in rawStateChanges[stateId]) {
        if (!angular.equals(rawStateChanges[stateId][key].newValue,
                            rawStateChanges[stateId][key].oldValue)) {
          stateChangeObj[key] = rawStateChanges[stateId][key];
        }
      }
      if (!$.isEmptyObject(stateChangeObj)) {
        stateChanges[stateId] = stateChangeObj;
      }
    }

    return {
      explorationChanges: explorationChanges,
      stateChanges: stateChanges
    };
  };

  // An ordered list of state properties that determines the order in which
  // to show them in the save confirmation modal.
  $scope.ORDERED_STATE_PROPERTIES = [
    'state_name', 'param_changes', 'content', 'widget_id',
    'widget_customization_args', 'widget_sticky', 'widget_handlers'
  ];

  // Returns summaries of the changes to display in the save dialogue and
  // include in the version log.
  $scope.createChangeSummaries = function(explorationChanges, stateChanges) {
    // Get the most up-to-date state names.
    var latestStateNames = {};
    var stateId;
    for (stateId in stateChanges) {
      latestStateNames[stateId] = $scope.getStateName(stateId);
      if (stateChanges[stateId].hasOwnProperty('state_name')) {
        latestStateNames[stateId] = stateChanges[stateId].state_name.newValue;
      }
    }

    // Construct the summary for the save confirmation dialogue.
    var modalSummaryForExploration = {};
    for (var property in explorationChanges) {
      modalSummaryForExploration[property] = (
        $scope.getExplorationPropertyChangeSummary(
          property, 'MODAL_FORMAT', explorationChanges[property]));
    }

    var modalSummaryForStates = {};
    for (stateId in stateChanges) {
      var changes = [];
      for (var i = 0; i < $scope.ORDERED_STATE_PROPERTIES.length; i++) {
        var property = $scope.ORDERED_STATE_PROPERTIES[i];
        if (stateChanges[stateId].hasOwnProperty(property)) {
          changes.push($scope.getStatePropertyChangeSummary(
            property, 'MODAL_FORMAT', stateChanges[stateId][property]));
        }
      }
      modalSummaryForStates[latestStateNames[stateId]] = changes;
    }

    // Construct the summary to be included in the commit message for the
    // version log.
    // TODO(sll): Add corresponding code for explorationChanges.
    var versionLogSummaryForExploration = '';
    if (!$.isEmptyObject(explorationChanges)) {
      var explorationChangeStrings = [];
      for (var property in explorationChanges) {
        explorationChangeStrings.push(
          $scope.getExplorationPropertyChangeSummary(
            property, 'VERSION_LOG_FORMAT', explorationChanges[property]
          )
        );
      }

      versionLogSummaryForExploration = (
        'Exploration properties that were changed: ' +
        explorationChangeStrings.join(', '));
    }

    var versionLogSummaryForStates = '';
    if (!$.isEmptyObject(stateChanges)) {
      versionLogSummaryForStates = 'States that were changed: ';

      var stateChangeStrings = [];
      for (stateId in stateChanges) {
        var humanReadablePropertyChanges = [];
        for (var i = 0; i < $scope.ORDERED_STATE_PROPERTIES.length; i++) {
          var property = $scope.ORDERED_STATE_PROPERTIES[i];
          if (stateChanges[stateId].hasOwnProperty(property)) {
            humanReadablePropertyChanges.push(
              $scope.getStatePropertyChangeSummary(
                property, 'VERSION_LOG_FORMAT', stateChanges[stateId][property]
              )
            );
          }
        }

        stateChangeStrings.push(latestStateNames[stateId] + ' (' +
          humanReadablePropertyChanges.join(', ') + ')');
      }

      versionLogSummaryForStates += stateChangeStrings.join(', ');
    }
    var versionLogSummary = '';
    if (versionLogSummaryForExploration && versionLogSummaryForStates) {
      versionLogSummary = (
        versionLogSummaryForExploration + '; ' + versionLogSummaryForStates);
    } else {
      versionLogSummary = (
        versionLogSummaryForExploration + versionLogSummaryForStates);
    }

    if (versionLogSummary) {
      versionLogSummary += '.';
    }

    return {
      MODAL_FORMAT: {
        exploration: modalSummaryForExploration,
        states: modalSummaryForStates
      },
      VERSION_LOG_FORMAT: versionLogSummary
    };
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
    $location.path('/gui/' + $scope.stateId);
  };

  $scope.$watch(function() {
    return $location.path();
  }, function(newPath, oldPath) {
    var path = newPath;
    console.log('Path is now ' + path);

    if (path.indexOf('/gui/') != -1) {
      $scope.stateId = path.substring('/gui/'.length);
      if (!$scope.stateId) {
        $location.path('/');
        return;
      }
      $scope.initStateData();
    } else if (path == STATS_VIEWER_URL) {
      $location.hash('');
      explorationData.stateId = '';
      $scope.stateId = '';
      $scope.statsTabActive = true;
      $scope.mainTabActive = false;
      $scope.guiTabActive = false;
    } else {
      $location.path('/');
      $location.hash('');
      explorationData.stateId = '';
      $scope.stateId = '';
      $scope.mainTabActive = true;
      $scope.guiTabActive = false;
      $scope.statsTabActive = false;
    }
  });

  $scope.initStateData = function() {
    var promise = explorationData.getStateData($scope.stateId);
    if (!promise) {
      return;
    }
    promise.then(function(stateData) {
      if (!stateData) {
        // This state does not exist. Redirect to the exploration page.
        $location.path('/');
        return;
      } else {
        $scope.guiTabActive = true;
        $scope.statsTabActive = false;
        $scope.mainTabActive = false;
        $scope.$broadcast('guiTabSelected', stateData);
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
    });
  };

  /********************************************
  * Methods affecting the graph visualization.
  ********************************************/
  $scope.drawGraph = function() {
    $scope.graphData = $scope.reformatResponse(
        $scope.states, $scope.initStateId);
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
  var explorationFullyLoaded = false;

  // The pathname should be: .../create/{exploration_id}
  $scope.explorationId = pathnameArray[2];
  // The exploration id needs to be attached to the root scope in order for
  // the file picker widget to work. (Note that an alternative approach might
  // also be to replicate this URL-based calculation in the file picker widget.)
  $rootScope.explorationId = pathnameArray[2];
  $scope.explorationUrl = '/create/' + $scope.explorationId;
  $scope.explorationDataUrl = '/createhandler/data/' + $scope.explorationId;
  $scope.deleteStateUrlPrefix = '/createhandler/delete_state/' + $scope.explorationId;
  $scope.explorationDownloadUrl = '/createhandler/download/' + $scope.explorationId;
  $scope.explorationRightsUrl = '/createhandler/rights/' + $scope.explorationId;
  $scope.explorationSnapshotsUrl = '/createhandler/snapshots/' + $scope.explorationId;

  // Refreshes the displayed version history log.
  $scope.refreshVersionHistory = function() {
    $http.get($scope.explorationSnapshotsUrl).then(function(response) {
      console.log('Reloading exploration snapshots.');

      var data = response.data;

      $scope.explorationSnapshots = [];
      for (var i = 0; i < data.snapshots.length; i++) {
        $scope.explorationSnapshots.push({
          'committerId': data.snapshots[i].committer_id,
          'createdOn': data.snapshots[i].created_on,
          'commitMessage': data.snapshots[i].commit_message,
          'versionNumber': data.snapshots[i].version_number
        });
      }
    });
  };

  // Initializes the exploration page using data from the backend. Called on
  // page load.
  $scope.initExplorationPage = function(successCallback) {
    explorationData.getData().then(function(data) {
      $scope.currentUserIsAdmin = data.is_admin;
      $scope.stateId = explorationData.stateId;
      $scope.states = angular.copy(data.states);
      $scope.explorationTitle = data.title;
      $scope.explorationCategory = data.category;
      $scope.explorationEditors = data.editors;
      $scope.initStateId = data.init_state_id;
      $scope.isPublic = data.is_public;
      $scope.currentUser = data.user;
      $scope.paramSpecs = angular.copy(data.param_specs || {});
      $scope.explorationParamChanges = angular.copy(data.param_changes || []);

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
      $scope.ruleChartColors = ['cornflowerblue', 'transparent'];
  
      $scope.statsGraphOpacities = {};
      $scope.statsGraphOpacities['legend'] = 'Students entering state';
      for (var stateId in $scope.states) {
        var visits = $scope.stats.stateStats[stateId].firstEntryCount;
        $scope.statsGraphOpacities[stateId] = Math.max(
            visits / $scope.stats.numVisits, 0.05);
      }
      $scope.statsGraphOpacities[END_DEST] = Math.max(
          $scope.stats.numCompletions / $scope.stats.numVisits, 0.05);
  
      $scope.highlightStates = {};
      $scope.highlightStates['legend'] = '#EE8800:Needs more feedback,brown:May be confusing';
      for (var j = 0; j < data.imp.length; j++) {
        if (data.imp[j].type == 'default') {
          $scope.highlightStates[data.imp[j].state_id] = '#EE8800';
        }
        if (data.imp[j].type == 'incomplete') {
          $scope.highlightStates[data.imp[j].state_id] = 'brown';
        }
      }
  
      $scope.drawGraph();
      $scope.refreshVersionHistory();
  
      explorationFullyLoaded = true;

      if (successCallback) {
        successCallback();
      }
    });
  };

  $scope.initExplorationPage();

  $scope.canEditEditorList = function() {
    return (
        $scope.explorationEditors && (
            $scope.currentUser == $scope.explorationEditors[0] ||
            $scope.currentUserIsAdmin
        )
    );
  };

  $scope.reformatResponse = function(states, initStateId) {
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
    for (state in states) {
      nodes[state] = {
        name: states[state].name,
        depth: SENTINEL_DEPTH,
        reachable: false,
        reachableFromEnd: false
      };
    }
    nodes[initStateId].depth = 0;

    var maxDepth = 0;
    var seenNodes = [initStateId];
    var queue = [initStateId];
    var maxXDistPerLevel = {0: HORIZ_OFFSET};
    nodes[initStateId].y0 = VERT_OFFSET;
    nodes[initStateId].x0 = HORIZ_OFFSET;

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

    return {nodes: nodeList, links: links, initStateId: initStateId};
  };

  $scope.$watch('explorationTitle', function(newValue, oldValue) {
    // Do not save on the initial data load.
    if (oldValue !== undefined && !$scope.isDiscardInProgress) {
      $scope.saveExplorationProperty(
          'explorationTitle', 'title', newValue, oldValue);
    }
  });

  $scope.$watch('explorationCategory', function(newValue, oldValue) {
    // Do not save on the initial data load.
    if (oldValue !== undefined && !$scope.isDiscardInProgress) {
      $scope.saveExplorationProperty(
          'explorationCategory', 'category', newValue, oldValue);
    }
  });

  $scope.addExplorationParamSpec = function(name, type, successCallback) {
    console.log("adding parameter to exploration");
    if (name in $scope.paramSpecs) {
      warningsData.addWarning(
        'Parameter ' + name + ' already exists, so it was not added.');
      return;
    }

    $scope.paramSpecs[name] = {obj_type: type};
  };

  $scope.$watch('paramSpecs', function(newValue, oldValue) {
    if (oldValue !== undefined && !$scope.isDiscardInProgress) {
      $scope.saveExplorationProperty(
        'paramSpecs', 'param_specs', newValue, oldValue);
    }
  });

  $scope.openAddNewEditorForm = function() {
    activeInputData.name = 'explorationMetadata.addNewEditor';
  };

  $scope.closeAddNewEditorForm = function() {
    $scope.newEditorEmail = '';
    activeInputData.name = 'explorationMetadata';
  };

  $scope.addNewEditor = function(newEditorEmail) {
    activeInputData.name = 'explorationMetadata';
    var oldValue = angular.copy($scope.explorationEditors);
    var newValue = angular.copy(oldValue);
    newValue.push(newEditorEmail);

    $scope.saveExplorationRightsChange(
      'explorationEditors', 'editors', newValue, oldValue);
  };

  /**
   * Downloads the YAML representation of an exploration.
   */
  $scope.downloadExploration = function() {
    document.location = $scope.explorationDownloadUrl;
  };

  $scope.makePublic = function() {
    $scope.saveExplorationRightsChange('isPublic', 'is_public', true, false);
  };

  $scope.saveExplorationParamChanges = function(newValue, oldValue) {
    $scope.saveExplorationProperty(
        'explorationParamChanges', 'param_changes', newValue, oldValue);
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
    if (angular.equals(newValue, oldValue)) {
      return;
    }
    newValue = $scope.normalizeWhitespace(newValue);
    if (backendName == 'title' || backendName == 'category') {
      if (oldValue && !$scope.isValidEntityName(newValue, true)) {
        $scope[frontendName] = oldValue;
        return;
      }
    }

    if ($scope.EXPLORATION_PROPERTY_CHANGE_SUMMARIES.hasOwnProperty(backendName)) {
      // This is an exploration property and will only be saved when the
      // 'Save changes' button is clicked.
      $scope.addExplorationChange(backendName, [frontendName], newValue, oldValue);
      return;
    }
  };

  $scope.saveExplorationRightsChange = function(frontendName, backendName, newValue, oldValue) {
    var requestParameters = {
      version: explorationData.data.version
    };
    requestParameters[backendName] = newValue;

    $http.put(
        $scope.explorationRightsUrl,
        requestCreator.createRequest(requestParameters),
        {headers: {'Content-Type': 'application/x-www-form-urlencoded'}}).
            success(function(data) {
              explorationData.data.version = data.version;
            }).
            error(function(data) {
              warningsData.addWarning(
                  'Error modifying exploration rights: ' + data.error);
              // TODO(sll): Reinstate the following line without causing the
              //     $watch to trigger.
              // $scope[frontendName] = oldValue;
            });

    $scope[frontendName] = newValue;
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

  $scope.isNewStateNameValid = function(newStateName) {
    if (!$scope.isValidEntityName(newStateName) ||
        newStateName.toUpperCase() == END_DEST) {
      return false;
    }

    for (var id in $scope.states) {
      if (id != $scope.stateId && $scope.states[id]['name'] == newStateName) {
        return false;
      }
    }

    return true;
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
    for (var id in $scope.states) {
      if (id != $scope.stateId && $scope.states[id]['name'] == newStateName) {
        warningsData.addWarning('A state with this name already exists.');
        return;
      }
    }

    $http.post(
        $scope.explorationDataUrl,
        requestCreator.createRequest({
          state_name: newStateName,
          version: explorationData.data.version
        }),
        {headers: {'Content-Type': 'application/x-www-form-urlencoded'}}).
            success(function(data) {
              $scope.newStateDesc = '';
              $scope.states[data.stateData.id] = data.stateData;
              $scope.drawGraph();
              explorationData.data.version = data.version;
              if (successCallback) {
                successCallback(data.stateData.id);
              }
            }).error(function(data) {
              // TODO(sll): Actually force a refresh, since the data on the
              // page may be out of date.
              warningsData.addWarning(
                  'Server error when adding state: ' + data.error + '. ');
            });
  };

  $scope.getStateName = function(stateId) {
    return stateId ? explorationData.data.states[stateId].name : NONEXISTENT_STATE;
  };

  // Deletes the state with id stateId. This action cannot be undone.
  $scope.deleteState = function(stateId) {
    if (stateId == $scope.initStateId) {
      warningsData.addWarning('Deleting the initial state of a question is not ' +
          'supported. Perhaps edit it instead?');
      return;
    }

    if (stateId == NONEXISTENT_STATE) {
      warningsData.addWarning('No state with id ' + stateId + ' exists.');
      return;
    }

    $http['delete']($scope.deleteStateUrlPrefix + '/' + stateId)
    .success(function(data) {
      // Reloads the page.
      explorationData.data.version = data.version;
      $window.location = $scope.explorationUrl;
    }).error(function(data) {
      warningsData.addWarning(data.error || 'Error communicating with server.');
    });
  };

  $scope.deleteExploration = function() {
    $http['delete']($scope.explorationDataUrl)
    .success(function(data) {
      $window.location = '/gallery/';
    });
  };

  $scope.showPublishExplorationModal = function() {
    warningsData.clear();

    var modalInstance = $modal.open({
      templateUrl: 'modals/publishExploration',
      backdrop: 'static',
      controller: function($scope, $modalInstance) {
        $scope.publish = function() {
          $modalInstance.close();
        };

        $scope.cancel = function() {
          $modalInstance.dismiss('cancel');
          warningsData.clear();
        };
      }
    });

    modalInstance.result.then(function() {
      $scope.makePublic();
    }, function () {
      console.log('Publish exploration modal dismissed.');
    });
  };

  $scope.showDeleteExplorationModal = function() {
    warningsData.clear();

    var modalInstance = $modal.open({
      templateUrl: 'modals/deleteExploration',
      backdrop: 'static',
      controller: function($scope, $modalInstance) {
        $scope.delete = function() {
          $modalInstance.close();
        };

        $scope.cancel = function() {
          $modalInstance.dismiss('cancel');
          warningsData.clear();
        };
      }
    });

    modalInstance.result.then(function() {
      $scope.deleteExploration();
    }, function () {
      console.log('Delete exploration modal dismissed.');
    });
  };

  $scope.showDeleteStateModal = function(deleteStateId) {
    warningsData.clear();

    var modalInstance = $modal.open({
      templateUrl: 'modals/deleteState',
      backdrop: 'static',
      resolve: {
        deleteStateName: function() {
          return $scope.getStateName(deleteStateId);
        }
      },
      controller: function($scope, $modalInstance, deleteStateName) {
        $scope.deleteStateName = deleteStateName;

        $scope.delete = function() {
          $modalInstance.close({deleteStateId: deleteStateId});
        };

        $scope.cancel = function() {
          $modalInstance.dismiss('cancel');
          warningsData.clear();
        };
      }
    });

    modalInstance.result.then(function(result) {
      $scope.deleteState(result.deleteStateId);
    }, function () {
      console.log('Delete state modal dismissed.');
    });
  };
}

/**
 * Injects dependencies in a way that is preserved by minification.
 */
EditorExploration.$inject = [
  '$scope', '$http', '$location', '$anchorScroll', '$modal', '$window',
  '$filter', '$rootScope', 'explorationData', 'warningsData', 'activeInputData',
  'requestCreator'
];
