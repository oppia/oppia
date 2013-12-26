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
 * @fileoverview Controllers for the reader feedback section of the
 *   state editor.
 *
 * @author sll@google.com (Sean Lip)
 */

function StateReaderFeedback($scope, warningsData, explorationData) {

  $scope.$on('stateEditorInitialized', function(evt, stateData) {
    $scope.stateName = $scope.$parent.stateName;
    $scope.initReaderFeedback();
  });

  $scope.initReaderFeedback = function() {
    if ($scope.stateName && $scope.$parent.stats &&
        $scope.$parent.stats.stateStats[$scope.stateName]) {
      $scope.stateReaderFeedback = (
        $scope.$parent.stats.stateStats[$scope.stateName].readerFeedback);
    }
  };

  $scope.initReaderFeedback();

  $scope.$watch('$parent.stats', function(newValue) {
    $scope.initReaderFeedback();
  });

  $scope.resolveReaderFeedback = function(feedbackId, newStatus) {
    explorationData.resolveReaderFeedback($scope.stateName, feedbackId, newStatus);
    $scope.stateReaderFeedback[feedbackId].deleted = true;
  };
}

StateReaderFeedback.$inject = ['$scope', 'warningsData', 'explorationData'];
