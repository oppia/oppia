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
 * @fileoverview Controller for new chapter title modal.
 */

require(
  'components/common-layout-directives/common-elements/' +
  'confirm-or-cancel-modal.controller.ts');

angular.module('oppia').controller('NewChapterTitleModalController', [
  '$controller', '$scope', '$uibModalInstance', 'nodeTitles',
  'MAX_CHARS_IN_CHAPTER_TITLE',
  function(
      $controller, $scope, $uibModalInstance, nodeTitles,
      MAX_CHARS_IN_CHAPTER_TITLE) {
    $controller('ConfirmOrCancelModalController', {
      $scope: $scope,
      $uibModalInstance: $uibModalInstance
    });

    $scope.nodeTitle = '';
    $scope.nodeTitles = nodeTitles;
    $scope.errorMsg = null;
    $scope.MAX_CHARS_IN_CHAPTER_TITLE =
      MAX_CHARS_IN_CHAPTER_TITLE;

    $scope.resetErrorMsg = function() {
      $scope.errorMsg = null;
    };
    $scope.isNodeTitleEmpty = function(nodeTitle) {
      return (nodeTitle === '');
    };
    $scope.save = function(title) {
      if ($scope.nodeTitles.indexOf(title) !== -1) {
        $scope.errorMsg = 'A chapter with this title already exists';
        return;
      }
      $uibModalInstance.close(title);
    };
  }
]);
