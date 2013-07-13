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
 * @fileoverview Controllers for the YAML editor view.
 *
 * @author sll@google.com (Sean Lip)
 */

 function YamlEditor($scope, $routeParams, explorationData, warningsData) {
  $scope.$parent.stateId = $routeParams.stateId;

  // Initializes the YAML textarea using data from the backend.
  explorationData.getData().then(function(data) {
    var stateData = explorationData.getStateData($scope.stateId);
    $scope.yaml = stateData.yaml;
  });

  // Switch to the stateEditor tab when this controller is activated.
  $('#editorViewTab a[href="#stateEditor"]').tab('show');

  /**
   * Saves the YAML representation of a state.
   */
  $scope.saveState = function() {
    explorationData.saveStateData($scope.stateId, {'yaml_file': $scope.yaml});
  };
}

YamlEditor.$inject = ['$scope', '$routeParams', 'explorationData', 'warningsData'];
