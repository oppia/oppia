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
 * @fileoverview Controller for new subtopic title modal.
 */

require(
  'components/common-layout-directives/common-elements/' +
  'confirm-or-cancel-modal.controller.ts');

angular.module('oppia').controller('NewSubtopicTitleModalController', [
  '$controller', '$scope', '$uibModalInstance', 'subtopicTitles',
  'MAX_CHARS_IN_SUBTOPIC_TITLE',
  function(
      $controller, $scope, $uibModalInstance, subtopicTitles,
      MAX_CHARS_IN_SUBTOPIC_TITLE) {
    $controller('ConfirmOrCancelModalController', {
      $scope: $scope,
      $uibModalInstance: $uibModalInstance
    });
    $scope.MAX_CHARS_IN_SUBTOPIC_TITLE = MAX_CHARS_IN_SUBTOPIC_TITLE;
    $scope.subtopicTitle = '';
    $scope.subtopicTitles = subtopicTitles;
    $scope.errorMsg = null;

    $scope.resetErrorMsg = function() {
      $scope.errorMsg = null;
    };
    $scope.isSubtopicTitleEmpty = function(subtopicTitle) {
      return (subtopicTitle === '');
    };
    $scope.save = function(title) {
      if ($scope.subtopicTitles.indexOf(title) !== -1) {
        $scope.errorMsg = 'A subtopic with this title already exists';
        return;
      }
      $uibModalInstance.close(title);
    };
  }
]);
