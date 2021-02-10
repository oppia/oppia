// Copyright 2020 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Controller for version mismatch modal.
 */

require(
  'pages/exploration-editor-page/changes-in-human-readable-form/' +
  'changes-in-human-readable-form.component.ts');

angular.module('oppia').controller('SaveVersionMismatchModalController', [
  '$log', '$scope', '$timeout', 'ExplorationDataService',
  'LostChangeObjectFactory', 'WindowRef', 'lostChanges',
  function(
      $log, $scope, $timeout, ExplorationDataService,
      LostChangeObjectFactory, WindowRef, lostChanges) {
    var MSECS_TO_REFRESH = 20;
    var _refreshPage = function(delay) {
      $timeout(function() {
        WindowRef.nativeWindow.location.reload();
      }, delay);
    };
    // When the user clicks on discard changes button, signal backend
    // to discard the draft and reload the page thereafter.
    $scope.discardChanges = function() {
      ExplorationDataService.discardDraft().then(() => {
        _refreshPage(MSECS_TO_REFRESH);
        $scope.$applyAsync();
      });
    };

    $scope.hasLostChanges = (lostChanges && lostChanges.length > 0);
    if ($scope.hasLostChanges) {
      // TODO(sll): This should also include changes to exploration
      // properties (such as the exploration title, category, etc.).
      $scope.lostChanges = lostChanges.map(
        LostChangeObjectFactory.createNew);
      $log.error('Lost changes: ' + JSON.stringify(lostChanges));
    }
  }
]);
