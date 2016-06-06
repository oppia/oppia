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
 */

oppia.controller('HistoryTab', [
  '$scope', '$http', '$rootScope', '$log', '$modal', 'explorationData',
  'versionsTreeService', 'compareVersionsService', 'graphDataService',
  'oppiaDatetimeFormatter',
  function(
      $scope, $http, $rootScope, $log, $modal, explorationData,
      versionsTreeService, compareVersionsService, graphDataService,
      oppiaDatetimeFormatter) {
    $scope.explorationId = explorationData.explorationId;
    $scope.explorationAllSnapshotsUrl =
        '/createhandler/snapshots/' + $scope.explorationId;

    /* Variable definitions:
     *
     * explorationSnapshots is a list of all snapshots for the exploration in
     * ascending order.
     *
     * explorationVersionMetadata is an object whose keys are version numbers
     * and whose values are objects containing data of that revision (that is
     * to be displayed) with the keys 'committerId', 'createdOn',
     * 'commitMessage', and 'versionNumber'. It contains a maximum of 30
     * versions.
     *
     * versionCheckboxArray is an array of the version numbers of the revisions
     * to be displayed on the page, in the order they are displayed in.
     *
     * nodesData is an object whose keys are nodeIds (assigned in version
     * comparison), and whose values are an object containing 'newestStateName',
     * 'originalStateName' and 'stateProperty'.
     */
    $scope.explorationVersionMetadata = null;
    $scope.versionCheckboxArray = [];
    var explorationSnapshots = null;
    var versionTreeParents = null;
    var nodesData = null;

    $scope.$on('refreshVersionHistory', function(evt, data) {
      $scope.clearAllCheckboxes();
      if (data.forceRefresh || $scope.explorationVersionMetadata === null) {
        $scope.refreshVersionHistory();
      }
    });

    // Uncheck all checkboxes when page is refreshed
    $scope.clearAllCheckboxes = function() {
      angular.forEach($scope.versionCheckboxArray, function(versionCheckbox) {
        versionCheckbox.selected = false;
      });
    };

    // Compares the two selected versions and displays the comparison results.
    $scope.compareSelectedVersions = function() {
      if ($scope.selectedVersionsArray.length === 2) {
        $scope.changeCompareVersion();
        $scope.showHistoryGraph();
      }
    };
    // Changes the checkbox selection and provides an appropriate user prompt.
    $scope.changeSelectedVersions = function(evt, versionNumber) {
      var checkbox = evt.target;
      var selectedVersionsArrayPos = $scope.selectedVersionsArray.indexOf(
        versionNumber);
      if (checkbox.checked && selectedVersionsArrayPos === -1) {
        $scope.selectedVersionsArray.push(versionNumber);
      }
      if (!checkbox.checked && selectedVersionsArrayPos !== -1) {
        $scope.selectedVersionsArray.splice(selectedVersionsArrayPos, 1);
      }

      if ($scope.selectedVersionsArray.length === 2) {
        // Disable version count prompt if two checkboxes are selected.
        $scope.versionCountPrompt = '';
      } else if (!$scope.comparisonsAreDisabled) {
        $scope.hideHistoryGraph = true;
        $scope.compareVersionsButtonIsHidden = false;

        if ($scope.selectedVersionsArray.length === 0) {
          $scope.versionCountPrompt = 'Please select any two.';
        } else if ($scope.selectedVersionsArray.length === 1) {
          $scope.versionCountPrompt = 'Please select one more.';
        }
      }
    };

    // Refreshes the displayed version history log.
    $scope.refreshVersionHistory = function() {
      $rootScope.loadingMessage = 'Loading';
      explorationData.getData().then(function(data) {
        var currentVersion = data.version;
        /**
         * $scope.compareVersionMetadata is an object with keys
         * 'earlierVersion' and 'laterVersion' whose values are the metadata
         * of the compared versions, containing 'committerId', 'createdOn',
         * 'commitMessage', and 'versionNumber'.
         *
         * $scope.yamlStrs is an object with keys 'earlierVersion' and
         * 'laterVersion', whose values are the YAML representations of the
         * compared versions
         */
        $scope.compareVersions = {};
        $scope.compareVersionMetadata = {};

        // Contains the IDs of the versions selected for comparison. Should
        // contain a maximum of two elements.
        $scope.selectedVersionsArray = [];

        $scope.hideHistoryGraph = true;

        // Disable all comparisons if there are less than two revisions in
        // total.
        $scope.comparisonsAreDisabled = (currentVersion < 2);

        $scope.compareVersionsButtonIsHidden = $scope.comparisonsAreDisabled;

        $scope.versionCountPrompt = 'Please select any 2.';

        $http.get($scope.explorationAllSnapshotsUrl).then(function(response) {
          explorationSnapshots = response.data.snapshots;
          versionsTreeService.init(explorationSnapshots);

          // Re-populate versionCheckboxArray and explorationVersionMetadata
          // when history is refreshed.
          $scope.versionCheckboxArray = [];
          $scope.explorationVersionMetadata = {};
          var lowestVersionIndex = Math.max(0, currentVersion - 30);
          for (var i = currentVersion - 1; i >= lowestVersionIndex; i--) {
            var versionNumber = explorationSnapshots[i].version_number;
            $scope.explorationVersionMetadata[versionNumber] = {
              committerId: explorationSnapshots[i].committer_id,
              createdOnStr: (
                oppiaDatetimeFormatter.getLocaleAbbreviatedDatetimeString(
                  explorationSnapshots[i].created_on_ms)),
              commitMessage: explorationSnapshots[i].commit_message,
              versionNumber: explorationSnapshots[i].version_number
            };
            $scope.versionCheckboxArray.push({
              vnum: explorationSnapshots[i].version_number,
              selected: false
            });
          }
          $rootScope.loadingMessage = '';
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
    $scope.changeCompareVersion = function() {
      $scope.diffGraphData = null;

      var earlierComparedVersion = Math.min(
        $scope.selectedVersionsArray[0], $scope.selectedVersionsArray[1]);
      var laterComparedVersion = Math.max(
        $scope.selectedVersionsArray[0], $scope.selectedVersionsArray[1]);

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
        for (var nodeId in nodesData) {
          var nodeStateProperty = nodesData[nodeId].stateProperty;
          if (nodeStateProperty === STATE_PROPERTY_ADDED) {
            diffGraphNodes[nodeId] = nodesData[nodeId].newestStateName;
            $scope.diffGraphNodeColors[nodeId] = COLOR_ADDED;
            _stateTypeUsed[NODE_TYPE_ADDED] = true;
          } else if (nodeStateProperty === STATE_PROPERTY_DELETED) {
            diffGraphNodes[nodeId] = nodesData[nodeId].originalStateName;
            $scope.diffGraphNodeColors[nodeId] = COLOR_DELETED;
            _stateTypeUsed[NODE_TYPE_DELETED] = true;
          } else if (nodeStateProperty === STATE_PROPERTY_CHANGED) {
            diffGraphNodes[nodeId] = nodesData[nodeId].originalStateName;
            $scope.diffGraphNodeColors[nodeId] = COLOR_CHANGED;
            if (nodesData[nodeId].originalStateName !=
                nodesData[nodeId].newestStateName) {
              $scope.diffGraphSecondaryLabels[nodeId] = '(was: ' +
                nodesData[nodeId].originalStateName + ')';
              diffGraphNodes[nodeId] = nodesData[nodeId].newestStateName;
              _stateTypeUsed[NODE_TYPE_CHANGED_RENAMED] = true;
            } else {
              _stateTypeUsed[NODE_TYPE_CHANGED] = true;
            }
          } else if (nodeStateProperty === STATE_PROPERTY_UNCHANGED) {
            diffGraphNodes[nodeId] = nodesData[nodeId].originalStateName;
            $scope.diffGraphNodeColors[nodeId] = COLOR_UNCHANGED;
            if (nodesData[nodeId].originalStateName !=
                nodesData[nodeId].newestStateName) {
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
          nodes: diffGraphNodes,
          links: response.links,
          initStateId: response.v2InitStateId,
          finalStateIds: response.finalStateIds
        };

        // Generate the legend graph
        $scope.legendGraph = {
          nodes: {},
          links: []
        };
        var _lastUsedStateType = null;
        for (var stateProperty in _stateTypeUsed) {
          if (_stateTypeUsed[stateProperty]) {
            $scope.legendGraph.nodes[stateProperty] = stateProperty;
            if (_lastUsedStateType) {
              $scope.legendGraph.links.push({
                source: _lastUsedStateType,
                target: stateProperty,
                linkProperty: 'hidden'
              });
            }
            _lastUsedStateType = stateProperty;
            if (!$scope.legendGraph.hasOwnProperty('initStateId')) {
              $scope.legendGraph.initStateId = stateProperty;
            }
          }
        }
        $scope.legendGraph.finalStateIds = [_lastUsedStateType];
      });
    };

    $scope.DIFF_GRAPH_LINK_PROPERTY_MAPPING = {
      added: (
        'stroke: #1F7D1F; stroke-opacity: 0.8; ' +
        'marker-end: url(#arrowhead-green)'),
      deleted: (
        'stroke: #B22222; stroke-opacity: 0.8; ' +
        'marker-end: url(#arrowhead-red)')
    };

    $scope.LEGEND_GRAPH_COLORS = {};
    $scope.LEGEND_GRAPH_COLORS[NODE_TYPE_UNCHANGED] = COLOR_UNCHANGED;
    $scope.LEGEND_GRAPH_COLORS[NODE_TYPE_ADDED] = COLOR_ADDED;
    $scope.LEGEND_GRAPH_COLORS[NODE_TYPE_DELETED] = COLOR_DELETED;
    $scope.LEGEND_GRAPH_COLORS[NODE_TYPE_CHANGED] = COLOR_CHANGED;
    $scope.LEGEND_GRAPH_COLORS[NODE_TYPE_CHANGED_RENAMED] = COLOR_CHANGED;
    $scope.LEGEND_GRAPH_COLORS[NODE_TYPE_RENAMED] = COLOR_RENAMED_UNCHANGED;

    $scope.LEGEND_GRAPH_SECONDARY_LABELS = {};
    $scope.LEGEND_GRAPH_SECONDARY_LABELS[NODE_TYPE_CHANGED_RENAMED] = (
      '(was: Old name)');
    $scope.LEGEND_GRAPH_SECONDARY_LABELS[NODE_TYPE_RENAMED] = '(was: Old name)';

    $scope.LEGEND_GRAPH_LINK_PROPERTY_MAPPING = {
      hidden: 'stroke: none; marker-end: none;'
    };

    // Check if valid versions were selected
    $scope.areCompareVersionsSelected = function() {
      return (
        $scope.compareVersions && $scope.selectedVersionsArray.length === 2);
    };

    // Check if other checkboxes should be disabled once two are selected.
    $scope.isCheckboxDisabled = function(versionNumber) {
      if ($scope.selectedVersionsArray.length === 2) {
        return ($scope.selectedVersionsArray.indexOf(versionNumber) === -1);
      }
      return false;
    };
    // Downloads the zip file for an exploration.
    $scope.downloadExplorationWithVersion = function(versionNumber) {
      // Note that this opens (and then immediately closes) a new tab. If we do
      // this in the same tab, the beforeunload handler is triggered.
      window.open(
        $scope.explorationDownloadUrl + '?v=' + versionNumber,
        '&output_format=zip');
    };

    // Functions to show history state graph
    $scope.showHistoryGraph = function() {
      $scope.hideHistoryGraph = false;
      $scope.compareVersionsButtonIsHidden = true;
    };

    // Functions to show modal of history diff of a state
    // stateId is the unique ID assigned to a state during calculation of state
    // graph.
    $scope.onClickStateInHistoryGraph = function(stateId) {
      var oldStateName = undefined;
      if (nodesData[stateId].newestStateName !=
          nodesData[stateId].originalStateName) {
        oldStateName = nodesData[stateId].originalStateName;
      }
      $scope.showStateDiffModal(nodesData[stateId].newestStateName,
        oldStateName, nodesData[stateId].stateProperty);
    };

    // Shows a modal comparing changes on a state between 2 versions.
    //
    // Arguments:
    // - stateName is the name of the state in the newer version.
    // - oldStateName is undefined if the name of the state is unchanged between
    //     the 2 versions, or the name of the state in the older version if the
    //     state name is changed.
    // - stateProperty is whether the state is added, changed, unchanged or
    //     deleted.
    $scope.showStateDiffModal = function(
        stateName, oldStateName, stateProperty) {
      $modal.open({
        templateUrl: 'modals/stateDiff',
        backdrop: true,
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
          '$scope', '$modalInstance', '$timeout', 'stateName', 'oldStateName',
          'compareVersionMetadata', 'explorationId', 'stateProperty',
          function(
              $scope, $modalInstance, $timeout, stateName, oldStateName,
              compareVersionMetadata, explorationId, stateProperty) {
            var stateDownloadUrl = (
              '/createhandler/download_state/' + explorationId);
            $scope.stateName = stateName;
            $scope.oldStateName = oldStateName;
            $scope.compareVersionMetadata = compareVersionMetadata;
            $scope.yamlStrs = {};

            var STATE_PROPERTY_ADDED = 'added';
            var STATE_PROPERTY_DELETED = 'deleted';

            if (oldStateName === undefined) {
              oldStateName = stateName;
            }
            if (stateProperty !== STATE_PROPERTY_DELETED) {
              $http.get(
                stateDownloadUrl + '?v=' +
                $scope.compareVersionMetadata.laterVersion.versionNumber +
                '&state=' + stateName + '&width=50')
              .then(function(response) {
                $scope.yamlStrs.leftPane = response.data;
              });
            } else {
              // Note: the timeout is needed or the string will be sent before
              // codemirror has fully loaded and will not be displayed.
              $timeout(function() {
                $scope.yamlStrs.leftPane = '';
              }, 200);
            }

            if (stateProperty !== STATE_PROPERTY_ADDED) {
              $http.get(
                stateDownloadUrl + '?v=' +
                $scope.compareVersionMetadata.earlierVersion.versionNumber +
                '&state=' + oldStateName + '&width=50')
              .then(function(response) {
                $scope.yamlStrs.rightPane = response.data;
              });
            } else {
              // Note: the timeout is needed or the string will be sent before
              // codemirror has fully loaded and will not be displayed.
              $timeout(function() {
                $scope.yamlStrs.rightPane = '';
              }, 200);
            }

            $scope.cancel = function() {
              $modalInstance.dismiss('cancel');
            };

            // Options for the codemirror mergeview.
            $scope.CODEMIRROR_MERGEVIEW_OPTIONS = {
              lineNumbers: true,
              readOnly: true,
              mode: 'yaml',
              viewportMargin: 20
            };
          }
        ]
      });
    };

    $scope.showRevertExplorationModal = function(version) {
      $modal.open({
        templateUrl: 'modals/revertExploration',
        backdrop: true,
        resolve: {
          version: function() {
            return version;
          }
        },
        controller: ['$scope', '$modalInstance', 'version', 'explorationData',
          function($scope, $modalInstance, version, explorationData) {
            $scope.version = version;

            $scope.getExplorationUrl = function(version) {
              return (
                '/explore/' + explorationData.explorationId + '?v=' + version);
            };

            $scope.revert = function() {
              $modalInstance.close(version);
            };

            $scope.cancel = function() {
              $modalInstance.dismiss('cancel');
            };
          }
        ]
      }).result.then(function(version) {
        $http.post($scope.revertExplorationUrl, {
          current_version: explorationData.data.version,
          revert_to_version: version
        }).then(function() {
          location.reload();
        });
      });
    };
  }
]);
