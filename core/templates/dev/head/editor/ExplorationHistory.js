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

oppia.controller('ExplorationHistory', ['$scope', '$http', 'explorationData', function(
    $scope, $http, explorationData) {
  $scope.explorationId = explorationData.explorationId;
  $scope.explorationSnapshotsUrl = '/createhandler/snapshots/' + $scope.$parent.explorationId;
  $scope.explorationSnapshots = null;

  $scope.$on('refreshVersionHistory', function(evt, data) {
    if (data.forceRefresh || $scope.explorationSnapshots === null) {
      $scope.refreshVersionHistory();
    }
  });

  // Refreshes the displayed version history log.
  $scope.refreshVersionHistory = function() {
    $scope.currentVersion = explorationData.data.version;
    $scope.compareVersion = {
      v1: $scope.currentVersion,
      v2: $scope.currentVersion
    };

    // Note: if initial strings are empty CodeMirror won't initialize correctly
    $scope.yamlStrV1 = ' ';
    $scope.yamlStrV2 = ' ';

    $scope.hideCodemirror = true;

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

  // Downloads the zip file for an exploration.
  $scope.downloadExplorationWithVersion = function(versionNumber) {
    // Note that this opens (and then immediately closes) a new tab. If we do
    // this in the same tab, the beforeunload handler is triggered.
    window.open($scope.explorationDownloadUrl + '?v=' + versionNumber, '&output_format=zip');
  };

  // Downloads the JSON strings for explorations to be compared.
  $scope.compareExplorations = function() {
    $scope.hideCodemirror = false;
    $scope.compareSnapshot = {
      v1: $scope.explorationSnapshots[$scope.explorationSnapshots.length - $scope.compareVersion.v1],
      v2: $scope.explorationSnapshots[$scope.explorationSnapshots.length - $scope.compareVersion.v2]
    };
    $http.get($scope.explorationDownloadUrl + '?v=' + $scope.compareVersion.v1 +
        '&output_format=json').then(function(response) {
      $scope.yamlStrV1 = response.data.yaml;
    });
    $http.get($scope.explorationDownloadUrl + '?v=' + $scope.compareVersion.v2 +
        '&output_format=json').then(function(response) {
      $scope.yamlStrV2 = response.data.yaml;
    });
  };

  // Options for the ui-codemirror display.
  $scope.CODEMIRROR_MERGEVIEW_OPTIONS = {
    lineNumbers: true,
    readOnly: true,
    mode: 'yaml'
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
