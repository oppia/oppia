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
      // Uncheck all checkboxes when page is refreshed
      angular.forEach($scope.versionCheckboxArray, function(versionCheckbox) {
        versionCheckbox.selected = false;
      });
      if (data.forceRefresh || $scope.explorationVersionMetadata === null) {
        $scope.refreshVersionHistory();
      }
    });

    // Compares the two selected versions and displays the comparison results.
    $scope.compareSelectedVersions = function() {
      if ($scope.selectedVersionsArray.length === 2) {
        $scope.changeCompareVersion();
        $scope.hideHistoryGraph = false;
        $scope.compareVersionsButtonIsHidden = true;
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

    var getVersionHeader = function(versionMetadata) {
      return (
        'Revision #' + versionMetadata.versionNumber +
        ' by ' + versionMetadata.committerId +
        ' (' + versionMetadata.createdOnStr +
        ')' + (
          versionMetadata.commitMessage ?
          ': ' + versionMetadata.commitMessage : ''));
    };

    // Function to set compared version metadata, download YAML and generate
    // diff graph and legend when selection is changed
    $scope.changeCompareVersion = function() {
      $scope.diffData = null;

      var earlierComparedVersion = Math.min(
        $scope.selectedVersionsArray[0], $scope.selectedVersionsArray[1]);
      var laterComparedVersion = Math.max(
        $scope.selectedVersionsArray[0], $scope.selectedVersionsArray[1]);

      $scope.compareVersionMetadata.earlierVersion =
        $scope.explorationVersionMetadata[earlierComparedVersion];
      $scope.compareVersionMetadata.laterVersion =
        $scope.explorationVersionMetadata[laterComparedVersion];

      compareVersionsService.getDiffGraphData(earlierComparedVersion,
          laterComparedVersion).then(
        function(response) {
          $log.info('Retrieved version comparison data');
          $log.info(response);

          $scope.diffData = response;
          $scope.earlierVersionHeader = getVersionHeader(
            $scope.compareVersionMetadata.earlierVersion);
          $scope.laterVersionHeader = getVersionHeader(
            $scope.compareVersionMetadata.laterVersion);
        }
      );
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

    $scope.showRevertExplorationModal = function(version) {
      $modal.open({
        templateUrl: 'modals/revertExploration',
        backdrop: true,
        resolve: {
          version: function() {
            return version;
          }
        },
        controller: [
          '$scope', '$modalInstance', 'version', 'explorationData',
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
