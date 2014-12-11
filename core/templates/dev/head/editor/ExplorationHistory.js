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
 * @fileoverview Controllers for the exploration history tab.
 *
 * @author sll@google.com (Sean Lip)
 */

oppia.controller('ExplorationHistory', [
    '$scope', '$http', '$location', '$log', '$modal', 'explorationData', 'versionsTreeService',
    'compareVersionsService', 'graphDataService', function(
    $scope, $http, $location, $log, $modal, explorationData, versionsTreeService,
    compareVersionsService, graphDataService) {
  $scope.explorationId = explorationData.explorationId;
  $scope.explorationAllSnapshotsUrl =
      '/createhandler/snapshots/' + $scope.explorationId;

  /* explorationSnapshots is a list of all snapshots for the exploration in
   * ascending order.
   * explorationVersionMetadata is an object whose keys are version numbers and
   * whose values are objects containing data of that revision (that is to be
   * displayed) with the keys 'committerId', 'createdOn', 'commitMessage', and
   * 'versionNumber'. It contains a maximum of 30 versions.
   * snapshotOrderArray is an array of the version numbers of the revisions to
   * be displayed on the page, in the order they are displayed in.
   * nodesData is an object whose keys are nodeIds (assigned in version
   * comparison), and whose values are an object containing 'newestStateName',
   * 'originalStateName' and 'stateProperty'.
   */
  $scope.explorationVersionMetadata = null;
  $scope.snapshotOrderArray = [];
  var explorationSnapshots = null;
  var versionTreeParents = null;
  var nodesData = null;

  $scope.$on('refreshVersionHistory', function(evt, data) {
    if (data.forceRefresh || $scope.explorationVersionMetadata === null) {
      $scope.refreshVersionHistory();
    }
  });

  // Refreshes the displayed version history log.
  $scope.refreshVersionHistory = function() {
    explorationData.getData().then(function(data) {
      var currentVersion = data.version;
      /**
       * $scope.compareVersions is an object with keys 'selectedVersion1' and
       * 'selectedVersion2', whose values are the version numbers of the
       * compared versions selected on the left and right radio buttons.
       * $scope.compareVersionMetadata is an object with keys 'earlierVersion' and
       * 'laterVersion' whose values are the metadata of the compared versions,
       * containing 'committerId', 'createdOn', 'commitMessage', and 'versionNumber'.
       * $scope.yamlStrs is an object with keys 'earlierVersion' and 'laterVersion',
       * whose values are the YAML representations of the compared versions
       */
      $scope.compareVersions = {};
      $scope.compareVersionMetadata = {};

      $scope.hideHistoryGraph = true;
      $scope.hideCompareVersionsButton = false;

      $http.get($scope.explorationAllSnapshotsUrl).then(function(response) {
        explorationSnapshots = response.data.snapshots;
        versionsTreeService.init(explorationSnapshots);

        // Re-populate snapshotOrderArray and explorationVersionMetadata when
        // history is refreshed.
        $scope.snapshotOrderArray = [];
        $scope.explorationVersionMetadata = {};
        for (var i = currentVersion - 1; i >= Math.max(0, currentVersion - 30); i--) {
          $scope.explorationVersionMetadata[explorationSnapshots[i].version_number] = {
            'committerId': explorationSnapshots[i].committer_id,
            'createdOn': explorationSnapshots[i].created_on,
            'commitMessage': explorationSnapshots[i].commit_message,
            'versionNumber': explorationSnapshots[i].version_number
          };
          $scope.snapshotOrderArray.push(explorationSnapshots[i].version_number);
        }
      });
    });
  };

  // Constants for color of nodes in diff graph
  var COLOR_ADDED = '#4EA24E';
  var COLOR_DELETED = '#DC143C';
  var COLOR_CHANGED = '#1E90FF';
  var COLOR_UNCHANGED = 'beige';
  var COLOR_RENAMED_UNCHANGED = '#FFD700';

  // Constants for names in legend
  var NODE_TYPE_ADDED = 'Added';
  var NODE_TYPE_DELETED = 'Deleted';
  var NODE_TYPE_CHANGED = 'Changed';
  var NODE_TYPE_CHANGED_RENAMED = 'Changed/renamed';
  var NODE_TYPE_RENAMED = 'Renamed';
  var NODE_TYPE_UNCHANGED = 'Unchanged';

  // Object whose keys are legend node names and whose values are 'true' or
  // false depending on whether the state property is used in the diff graph.
  // (Will be used to generate legend)
  var _stateTypeUsed = {};

  // Function to set compared version metadata, download YAML and generate
  // diff graph and legend when selection is changed
  $scope.changeCompareVersion = function(versionNumber, changedVersion) {
    $scope.diffGraphData = null;

    if ($scope.compareVersions.selectedVersion1 !== undefined &&
        $scope.compareVersions.selectedVersion2 !== undefined) {
      var earlierComparedVersion = Math.min($scope.compareVersions.selectedVersion1,
        $scope.compareVersions.selectedVersion2);
      var laterComparedVersion = Math.max($scope.compareVersions.selectedVersion1,
        $scope.compareVersions.selectedVersion2);
      $scope.compareVersionMetadata.earlierVersion =
        $scope.explorationVersionMetadata[earlierComparedVersion];
      $scope.compareVersionMetadata.laterVersion =
        $scope.explorationVersionMetadata[laterComparedVersion];

      compareVersionsService.getDiffGraphData(earlierComparedVersion,
          laterComparedVersion).then(function(response) {
        $log.info('Retrieved version comparison data');
        $log.info(response);

        var STATE_PROPERTY_ADDED = 'added';
        var STATE_PROPERTY_DELETED = 'deleted';
        var STATE_PROPERTY_CHANGED = 'changed';
        var STATE_PROPERTY_UNCHANGED = 'unchanged';
        _stateTypeUsed[NODE_TYPE_ADDED] = false;
        _stateTypeUsed[NODE_TYPE_DELETED] = false;
        _stateTypeUsed[NODE_TYPE_CHANGED] = false;
        _stateTypeUsed[NODE_TYPE_UNCHANGED] = false;
        _stateTypeUsed[NODE_TYPE_RENAMED] = false;
        _stateTypeUsed[NODE_TYPE_CHANGED_RENAMED] = false;

        var diffGraphNodes = {};
        $scope.diffGraphSecondaryLabels = {};
        $scope.diffGraphNodeColors = {};

        nodesData = response.nodes;
        nodesData[response.finalStateId] = {
          'newestStateName': END_DEST,
          'originalStateName': END_DEST,
          'stateProperty': STATE_PROPERTY_UNCHANGED
        };

        for (var nodeId in nodesData) {
          if (nodesData[nodeId].stateProperty == STATE_PROPERTY_ADDED) {
            diffGraphNodes[nodeId] = nodesData[nodeId].newestStateName;
            $scope.diffGraphNodeColors[nodeId] = COLOR_ADDED;
            _stateTypeUsed[NODE_TYPE_ADDED] = true;
          } else if (nodesData[nodeId].stateProperty == STATE_PROPERTY_DELETED) {
            diffGraphNodes[nodeId] = nodesData[nodeId].originalStateName;
            $scope.diffGraphNodeColors[nodeId] = COLOR_DELETED;
            _stateTypeUsed[NODE_TYPE_DELETED] = true;
          } else if (nodesData[nodeId].stateProperty == STATE_PROPERTY_CHANGED) {
            diffGraphNodes[nodeId] = nodesData[nodeId].originalStateName;
            $scope.diffGraphNodeColors[nodeId] = COLOR_CHANGED;
            if (nodesData[nodeId].originalStateName != nodesData[nodeId].newestStateName) {
              $scope.diffGraphSecondaryLabels[nodeId] = '(was: ' +
                nodesData[nodeId].originalStateName + ')';
              diffGraphNodes[nodeId] = nodesData[nodeId].newestStateName;
              _stateTypeUsed[NODE_TYPE_CHANGED_RENAMED] = true;
            } else {
              _stateTypeUsed[NODE_TYPE_CHANGED] = true;
            }
          } else if (nodesData[nodeId].stateProperty == STATE_PROPERTY_UNCHANGED) {
            diffGraphNodes[nodeId] = nodesData[nodeId].originalStateName;
            $scope.diffGraphNodeColors[nodeId] = COLOR_UNCHANGED;
            if (nodesData[nodeId].originalStateName != nodesData[nodeId].newestStateName) {
              $scope.diffGraphSecondaryLabels[nodeId] = '(was: ' +
                nodesData[nodeId].originalStateName + ')';
              diffGraphNodes[nodeId] = nodesData[nodeId].newestStateName;
              $scope.diffGraphNodeColors[nodeId] = COLOR_RENAMED_UNCHANGED;
              _stateTypeUsed[NODE_TYPE_RENAMED] = true;
            } else {
              _stateTypeUsed[NODE_TYPE_UNCHANGED] = true;
            }
          } else {
            throw new Error('Invalid state property.');
          }
        }

        $scope.v1InitStateId = response.v1InitStateId;

        $scope.diffGraphData = {
          'nodes': diffGraphNodes,
          'links': response.links,
          'initStateId': response.v2InitStateId,
          'finalStateId': response.finalStateId
        };

        // Generate the legend graph
        $scope.legendGraph = {
          'nodes': {},
          'links': []
        };
        var _lastUsedStateType = null;
        for (var stateProperty in _stateTypeUsed) {
          if (_stateTypeUsed[stateProperty]) {
            $scope.legendGraph.nodes[stateProperty] = stateProperty;
            if (_lastUsedStateType) {
              $scope.legendGraph.links.push({
                'source': _lastUsedStateType,
                'target': stateProperty,
                'linkProperty': 'hidden'
              });
            }
            _lastUsedStateType = stateProperty;
            if (!$scope.legendGraph.hasOwnProperty('initStateId')) {
              $scope.legendGraph['initStateId'] = stateProperty;
            }
          }
        }
        $scope.legendGraph['finalStateId'] = _lastUsedStateType;
      });
    }
  };

  $scope.DIFF_GRAPH_LINK_PROPERTY_MAPPING = {
    'added': 'stroke: #1F7D1F; stroke-opacity: 0.8; marker-end: url(#arrowhead-green)',
    'deleted': 'stroke: #B22222; stroke-opacity: 0.8; marker-end: url(#arrowhead-red)'
  };

  $scope.LEGEND_GRAPH_COLORS = {};
  $scope.LEGEND_GRAPH_COLORS[NODE_TYPE_UNCHANGED] = COLOR_UNCHANGED;
  $scope.LEGEND_GRAPH_COLORS[NODE_TYPE_ADDED] = COLOR_ADDED;
  $scope.LEGEND_GRAPH_COLORS[NODE_TYPE_DELETED] = COLOR_DELETED;
  $scope.LEGEND_GRAPH_COLORS[NODE_TYPE_CHANGED] = COLOR_CHANGED;
  $scope.LEGEND_GRAPH_COLORS[NODE_TYPE_CHANGED_RENAMED] = COLOR_CHANGED;
  $scope.LEGEND_GRAPH_COLORS[NODE_TYPE_RENAMED] = COLOR_UNCHANGED;

  $scope.LEGEND_GRAPH_SECONDARY_LABELS = {};
  $scope.LEGEND_GRAPH_SECONDARY_LABELS[NODE_TYPE_CHANGED_RENAMED] = '(was: Old name)';
  $scope.LEGEND_GRAPH_SECONDARY_LABELS[NODE_TYPE_RENAMED] = '(was: Old name)';

  $scope.LEGEND_GRAPH_LINK_PROPERTY_MAPPING = {
    'hidden': 'stroke: none; marker-end: none;'
  };

  // Check if valid versions were selected
  $scope.areCompareVersionsSelected = function() {
    return (
      $scope.compareVersions &&
      $scope.compareVersions.hasOwnProperty('selectedVersion1') &&
      $scope.compareVersions.hasOwnProperty('selectedVersion2'));
  };

  // Downloads the zip file for an exploration.
  $scope.downloadExplorationWithVersion = function(versionNumber) {
    // Note that this opens (and then immediately closes) a new tab. If we do
    // this in the same tab, the beforeunload handler is triggered.
    window.open($scope.explorationDownloadUrl + '?v=' + versionNumber, '&output_format=zip');
  };

  // Functions to show history state graph
  $scope.showHistoryGraph = function() {
    $scope.hideHistoryGraph = false;
    $scope.hideCompareVersionsButton = true;
  };

  // Functions to show modal of history diff of a state
  // stateId is the unique ID assigned to a state during calculation of state
  // graph.
  $scope.onClickStateInHistoryGraph = function(stateId) {
    if (nodesData[stateId].newestStateName !== END_DEST) {
      var oldStateName = undefined;
      if (nodesData[stateId].newestStateName != nodesData[stateId].originalStateName) {
        oldStateName = nodesData[stateId].originalStateName;
      }
      $scope.showStateDiffModal(nodesData[stateId].newestStateName,
        oldStateName, nodesData[stateId].stateProperty);
    }
  };

  // Shows a modal comparing changes on a state between 2 versions.
  // stateName is the name of the state in the newer version.
  // oldStateName is undefined if the name of the state is unchanged between
  // the 2 versions, or the name of the state in the older version if the state
  // name is changed.
  // stateProperty is whether the state is added, changed, unchanged or deleted
  $scope.showStateDiffModal = function(stateName, oldStateName, stateProperty) {
    $modal.open({
      templateUrl: 'modals/stateDiff',
      backdrop: 'static',
      windowClass: 'state-diff-modal',
      resolve: {
        stateName: function() {
          return stateName;
        },
        oldStateName: function() {
          return oldStateName;
        },
        stateProperty: function() {
          return stateProperty;
        },
        compareVersionMetadata: function() {
          return $scope.compareVersionMetadata;
        },
        explorationId: function() {
          return $scope.explorationId;
        }
      },
      controller: [
        '$scope', '$modalInstance', 'stateName', 'oldStateName',
          'compareVersionMetadata', 'explorationId', 'stateProperty',
          function(
          $scope, $modalInstance, stateName, oldStateName,
          compareVersionMetadata, explorationId, stateProperty) {
        var stateDownloadUrl = '/createhandler/download_state/' + explorationId;
        $scope.stateName = stateName;
        $scope.oldStateName = oldStateName;
        $scope.compareVersionMetadata = compareVersionMetadata;
        $scope.yamlStrs = {};

        var STATE_PROPERTY_ADDED = 'added';
        var STATE_PROPERTY_DELETED = 'deleted';

        if (oldStateName === undefined) {
          oldStateName = stateName;
        }
        if (stateProperty != STATE_PROPERTY_DELETED) {
          $http.get(stateDownloadUrl + '?v=' +
            $scope.compareVersionMetadata.laterVersion.versionNumber + '&state=' +
            stateName + '&width=50')
          .then(function(response) {
            $scope.yamlStrs['leftPane'] = response.data;
          });
        } else {
          $scope.yamlStrs['leftPane'] = '';
        }

        if (stateProperty != STATE_PROPERTY_ADDED) {
          $http.get(stateDownloadUrl + '?v=' +
            $scope.compareVersionMetadata.earlierVersion.versionNumber + '&state=' +
            oldStateName + '&width=50')
          .then(function(response) {
            $scope.yamlStrs['rightPane'] = response.data;
          });
        } else {
          $scope.yamlStrs['rightPane'] = '';
        }

        $scope.return = function() {
          $modalInstance.dismiss('cancel');
        };

        // Options for the codemirror mergeview.
        $scope.CODEMIRROR_MERGEVIEW_OPTIONS = {
          lineNumbers: true,
          readOnly: true,
          mode: 'yaml',
          viewportMargin: 20
        };
      }]
    });
  };

  $scope.showRevertExplorationModal = function(version) {
    $modal.open({
      templateUrl: 'modals/revertExploration',
      backdrop: 'static',
      resolve: {
        version: function() {
          return version;
        }
      },
      controller: ['$scope', '$modalInstance', 'version', 'explorationData',
        function($scope, $modalInstance, version, explorationData) {
          $scope.version = version;

          $scope.getExplorationUrl = function(version) {
              return '/explore/' + explorationData.explorationId + '?v=' + version;
          };

          $scope.revert = function() {
            $modalInstance.close(version);
          };

          $scope.cancel = function() {
            $modalInstance.dismiss('cancel');
            warningsData.clear();
          };
        }
      ]
    }).result.then(function(version) {
      $http.post($scope.revertExplorationUrl, {
        current_version: explorationData.data.version,
        revert_to_version: version
      }).success(function(response) {
        location.reload();
      });
    });
  };
}]);

oppia.directive('codemirrorMergeview', function() {
  return {
    restrict: 'E',
    link: function(scope, element, attrs) {
      // Require CodeMirror
      if (angular.isUndefined(window.CodeMirror)) {
        throw new Error('CodeMirror not found.');
      }

      var options, codeMirrorInstance;

      options = scope.$eval(attrs.codemirrorMergeviewOptions);

      // 'value', 'orig' are initial values of left and right pane respectively
      codeMirrorInstance = new window.CodeMirror.MergeView(
        element[0], angular.extend({value: ' ', orig: ' '}, options));

      if (!attrs.leftValue) {
        throw new Error('Left pane value is not defined.');
      }
      if (!attrs.rightValue) {
        throw new Error('Right pane value is not defined.');
      }

      // Watch for changes and set value in left pane
      scope.$watch(attrs.leftValue, function(newValue) {
        if (angular.isString(newValue)) {
          codeMirrorInstance.edit.setValue(newValue);
        }
      });

      // Watch for changes and set value in right pane
      scope.$watch(attrs.rightValue, function(newValue) {
        if (angular.isString(newValue)) {
          codeMirrorInstance.right.orig.setValue(newValue);
        }
      });
    }
  };
});
