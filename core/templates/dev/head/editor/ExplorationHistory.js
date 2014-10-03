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
    '$scope', '$http', '$location', '$anchorScroll', 'explorationData',
    'versionsTreeService', function(
    $scope, $http, $location, $anchorScroll, explorationData, versionsTreeService) {
  $scope.explorationId = explorationData.explorationId;
  $scope.explorationAllSnapshotsUrl = '/createhandler/snapshots/' + $scope.explorationId;
  // explorationSnapshots is a list of snapshots for the displayed version history list (max 30)
  // allExplorationSnapshots is a list of all snapshots for the exploration
  $scope.explorationSnapshots = null;
  var allExplorationSnapshots = null;
  var versionTreeParents = null;

  $scope.$on('refreshVersionHistory', function(evt, data) {
    if (data.forceRefresh || $scope.explorationSnapshots === null) {
      $scope.refreshVersionHistory();
    }
  });

  // Refreshes the displayed version history log.
  $scope.refreshVersionHistory = function() {
    var currentVersion = explorationData.data.version;
    $scope.compareVersion = {};
    $scope.compareSnapshot = {};

    // Note: if initial strings are empty CodeMirror won't initialize correctly
    $scope.yamlStrV1 = ' ';
    $scope.yamlStrV2 = ' ';

    $scope.hideCodemirror = true;
    $scope.hideCompareVersionsButton = false;

    $http.get($scope.explorationAllSnapshotsUrl).then(function(response) {
      allExplorationSnapshots = response.data.snapshots;
      versionTreeParents = versionsTreeService.getVersionTree(allExplorationSnapshots);

      $scope.explorationSnapshots = [];
      for (var i = currentVersion - 1; i >= Math.max(0, currentVersion - 30); i--) {
        $scope.explorationSnapshots.push({
          'committerId': allExplorationSnapshots[i].committer_id,
          'createdOn': allExplorationSnapshots[i].created_on,
          'commitMessage': allExplorationSnapshots[i].commit_message,
          'versionNumber': allExplorationSnapshots[i].version_number
        });
      }
    });
  };

  // Functions to set snapshot and download YAML when selection is changed
  $scope.changeCompareVersion1 = function(versionNumber) {
    $scope.compareSnapshot.v1 = $scope.explorationSnapshots[
        $scope.currentVersion - $scope.compareVersion.v1];

    $http.get($scope.explorationDownloadUrl + '?v=' + $scope.compareVersion.v1 +
        '&output_format=json').then(function(response) {
      $scope.yamlStrV1 = response.data.yaml;
    });

    if (!$scope.hideCodemirror) {
      $location.hash('codemirrorMergeviewInstance');
      $anchorScroll();
    }
  };

  $scope.changeCompareVersion2 = function(versionNumber) {
    $scope.compareSnapshot.v2 = $scope.explorationSnapshots[
        $scope.currentVersion - $scope.compareVersion.v2];

    $http.get($scope.explorationDownloadUrl + '?v=' + $scope.compareVersion.v2 +
        '&output_format=json').then(function(response) {
      $scope.yamlStrV2 = response.data.yaml;
    });

    if (!$scope.hideCodemirror) {
      $location.hash('codemirrorMergeviewInstance');
      $anchorScroll();
    }
  };

  // Check if valid versions were selected
  $scope.areCompareVersionsSelected = function() {
    return (
      $scope.compareVersion &&
      $scope.compareVersion.hasOwnProperty('v1') &&
      $scope.compareVersion.hasOwnProperty('v2'));
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
    $scope.yamlStrV1 = ' ';
    $scope.yamlStrV2 = ' ';
    $http.get($scope.explorationDownloadUrl + '?v=' + $scope.compareVersion.v1 +
        '&output_format=json').then(function(response) {
      $scope.yamlStrV1 = response.data.yaml;
    });
    $http.get($scope.explorationDownloadUrl + '?v=' + $scope.compareVersion.v2 +
        '&output_format=json').then(function(response) {
      $scope.yamlStrV2 = response.data.yaml;
    });

    // Scroll to CodeMirror MergeView instance
    $location.hash('codemirrorMergeviewInstance');
    $anchorScroll();
  };

  // Options for the ui-codemirror display.
  $scope.CODEMIRROR_MERGEVIEW_OPTIONS = {
    lineNumbers: true,
    readOnly: true,
    mode: 'yaml',
    viewportMargin: 20
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
