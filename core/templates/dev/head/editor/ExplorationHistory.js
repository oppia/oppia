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

  /* displayedExplorationSnapshots is a list of snapshots (in descending order)
   * for the displayed version history list (max 30)
   * allExplorationSnapshots is a list of all snapshots for the exploration in
   * ascending order
   */
  $scope.displayedExplorationSnapshots = null;
  var allExplorationSnapshots = null;
  var versionTreeParents = null;

  $scope.$on('refreshVersionHistory', function(evt, data) {
    if (data.forceRefresh || $scope.displayedExplorationSnapshots === null) {
      $scope.refreshVersionHistory();
    }
  });

  // Refreshes the displayed version history log.
  $scope.refreshVersionHistory = function() {
    explorationData.getData().then(function(data) {
      var currentVersion = data.version;
      /**
       * $scope.comparePanesVersions is an object with keys 'leftPane' and
       * 'rightPane', whose values are the version numbers of the versions
       * displayed in the left and right codemirror panes.
       * $scope.compareSnapshot is an object with keys 'leftPane' and 'rightPane'
       * whose values are the snapshots of the compared versions.
       * $scope.yamrStrs is an object with keys 'leftPane' and 'rightPane',
       * whose values are the YAML representations of the compared versions
       */
      $scope.comparePanesVersions = {};
      $scope.compareSnapshot = {};
      // Note: if initial strings are empty CodeMirror won't initialize correctly
      $scope.yamlStrs = {
        'leftPane': ' ',
        'rightPane': ' '
      };

      $scope.hideCodemirror = true;
      $scope.hideCompareVersionsButton = false;

      $http.get($scope.explorationAllSnapshotsUrl).then(function(response) {
        allExplorationSnapshots = response.data.snapshots;
        versionsTreeService.init(allExplorationSnapshots);

        $scope.displayedExplorationSnapshots = [];
        for (var i = currentVersion - 1; i >= Math.max(0, currentVersion - 30); i--) {
          $scope.displayedExplorationSnapshots.push({
            'committerId': allExplorationSnapshots[i].committer_id,
            'createdOn': allExplorationSnapshots[i].created_on,
            'commitMessage': allExplorationSnapshots[i].commit_message,
            'versionNumber': allExplorationSnapshots[i].version_number
          });
        }
      });
    });
  };

  var COLOR_ADDED = ' #4EA24E';
  var COLOR_DELETED = '#DC143C';
  var COLOR_CHANGED = '#1E90FF';
  var COLOR_UNCHANGED = 'beige';
  var COLOR_RENAMED_UNCHANGED = '#FFD700';

  // Functions to set snapshot and download YAML when selection is changed
  $scope.diffGraphData = null;
  $scope.changeCompareVersion = function(versionNumber, changedPane) {
    $scope.compareSnapshot[changedPane] =
      $scope.displayedExplorationSnapshots[
        $scope.currentVersion - $scope.comparePanesVersions[changedPane]];

    $http.get($scope.explorationDownloadUrl + '?v=' +
        $scope.comparePanesVersions[changedPane] + '&output_format=json')
        .then(function(response) {
      $scope.yamlStrs[changedPane] = response.data.yaml;
    });

    if ($scope.comparePanesVersions.leftPane !== undefined &&
        $scope.comparePanesVersions.rightPane !== undefined) {
      var comparedVersion1 = Math.min($scope.comparePanesVersions.leftPane,
        $scope.comparePanesVersions.rightPane);
      var comparedVersion2 = Math.max($scope.comparePanesVersions.leftPane,
        $scope.comparePanesVersions.rightPane);
      compareVersionsService.getDiffGraphData(comparedVersion1,
          comparedVersion2).then(function(response) {
        $log.info('Retrieved version comparison data');
        $log.info(response);

        var STATE_PROPERTY_ADDED = 'added';
        var STATE_PROPERTY_DELETED = 'deleted';
        var STATE_PROPERTY_CHANGED = 'changed';
        var STATE_PROPERTY_UNCHANGED = 'unchanged';

        var diffGraphNodes = {};
        $scope.diffGraphSecondaryLabels = {};
        $scope.diffGraphNodeColors = {};

        var nodesData = response.nodes;
        nodesData[response.finalStateId] = {
          'newestStateName': END_DEST,
          'originalStateName': END_DEST,
          'stateProperty': STATE_PROPERTY_UNCHANGED
        };
        for (var nodeId in nodesData) {
          if (nodesData[nodeId].stateProperty == STATE_PROPERTY_ADDED) {
            diffGraphNodes[nodeId] = nodesData[nodeId].newestStateName;
            $scope.diffGraphNodeColors[nodeId] = COLOR_ADDED;
          } else if (nodesData[nodeId].stateProperty == STATE_PROPERTY_DELETED) {
            diffGraphNodes[nodeId] = nodesData[nodeId].originalStateName;
            $scope.diffGraphNodeColors[nodeId] = COLOR_DELETED;
          } else if (nodesData[nodeId].stateProperty == STATE_PROPERTY_CHANGED) {
            diffGraphNodes[nodeId] = nodesData[nodeId].originalStateName;
            $scope.diffGraphNodeColors[nodeId] = COLOR_CHANGED;
            if (nodesData[nodeId].originalStateName != nodesData[nodeId].newestStateName) {
              $scope.diffGraphSecondaryLabels[nodeId] = nodesData[nodeId].originalStateName;
              diffGraphNodes[nodeId] = nodesData[nodeId].newestStateName;
            }
          } else if (nodesData[nodeId].stateProperty == STATE_PROPERTY_UNCHANGED) {
            diffGraphNodes[nodeId] = nodesData[nodeId].originalStateName;
            $scope.diffGraphNodeColors[nodeId] = COLOR_UNCHANGED;
            if (nodesData[nodeId].originalStateName != nodesData[nodeId].newestStateName) {
              $scope.diffGraphSecondaryLabels[nodeId] = nodesData[nodeId].originalStateName;
              diffGraphNodes[nodeId] = nodesData[nodeId].newestStateName;
              $scope.diffGraphNodeColors[nodeId] = COLOR_RENAMED_UNCHANGED;
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
      });
    }
  };

  $scope.DIFF_GRAPH_LINK_PROPERTY_MAPPING = {
    'added': 'stroke: #1F7D1F; stroke-opacity: 0.8; marker-end: url(#arrowhead-green)',
    'deleted': 'stroke: #B22222; stroke-opacity: 0.8; marker-end: url(#arrowhead-red)'
  };

  // Define the legend graph
  $scope.LEGEND_GRAPH = {
    'nodes': {
      'Start state': 'Start state',
      'Added state': 'Added state',
      'Deleted state': 'Deleted state',
      'Changed state': 'Changed state',
      'Changed + renamed': 'Changed + renamed',
      'New name': 'New name',
      'END': 'END'
    },
    'links': [
      {'source': 'Start state', 'target': 'Added state', 'linkProperty': 'hidden'},
      {'source': 'Added state', 'target': 'Deleted state', 'linkProperty': 'hidden'},
      {'source': 'Deleted state', 'target': 'Changed state', 'linkProperty': 'hidden'},
      {'source': 'Changed state', 'target': 'Changed + renamed', 'linkProperty': 'hidden'},
      {'source': 'Changed + renamed', 'target': 'New name', 'linkProperty': 'hidden'},
      {'source': 'New name', 'target': 'END', 'linkProperty': 'hidden'}
    ],
    'initStateId': 'Start state',
    'finalStateId': 'END'
  };
  $scope.LEGEND_GRAPH_COLORS = {
    'Start state': COLOR_UNCHANGED,
    'Added state': COLOR_ADDED,
    'Deleted state': COLOR_DELETED,
    'Changed state': COLOR_CHANGED,
    'Changed + renamed': COLOR_CHANGED,
    'New name': COLOR_RENAMED_UNCHANGED,
    'END': COLOR_UNCHANGED
  };
  $scope.LEGEND_GRAPH_SECONDARY_LABELS = {
    'Changed + renamed': 'Old name',
    'New name': 'Old name'
  };
  $scope.LEGEND_GRAPH_LINK_PROPERTY_MAPPING = {
    'hidden': 'stroke: none; marker-end: none;'
  };

  // Check if valid versions were selected
  $scope.areCompareVersionsSelected = function() {
    return (
      $scope.comparePanesVersions &&
      $scope.comparePanesVersions.hasOwnProperty('leftPane') &&
      $scope.comparePanesVersions.hasOwnProperty('rightPane'));
  };

  // Downloads the zip file for an exploration.
  $scope.downloadExplorationWithVersion = function(versionNumber) {
    // Note that this opens (and then immediately closes) a new tab. If we do
    // this in the same tab, the beforeunload handler is triggered.
    window.open($scope.explorationDownloadUrl + '?v=' + versionNumber, '&output_format=zip');
  };

  // Function to show the CodeMirror MergeView instance
  $scope.showMergeview = function() {
    $scope.hideCodemirror = false;
    $scope.hideCompareVersionsButton = true;

    // Force refresh of codemirror
    $scope.yamlStrs.leftPane = ' ';
    $http.get($scope.explorationDownloadUrl + '?v=' + $scope.comparePanesVersions.leftPane +
        '&output_format=json').then(function(response) {
      $scope.yamlStrs.leftPane = response.data.yaml;
    });
    $scope.yamlStrs.rightPane = ' ';
    $http.get($scope.explorationDownloadUrl + '?v=' + $scope.comparePanesVersions.rightPane +
        '&output_format=json').then(function(response) {
      $scope.yamlStrs.rightPane = response.data.yaml;
    });
  };

  // Options for the ui-codemirror display.
  $scope.CODEMIRROR_MERGEVIEW_OPTIONS = {
    lineNumbers: true,
    readOnly: true,
    mode: 'yaml',
    viewportMargin: 20
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
