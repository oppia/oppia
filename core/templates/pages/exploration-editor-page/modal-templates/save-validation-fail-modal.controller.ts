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
 * @fileoverview Controller for non strict validation fail modal.
 */
angular.module('oppia').controller('SaveValidationFailModalController', [
  '$scope', '$timeout', '$uibModalInstance', 'WindowRef',
  function(
      $scope, $timeout, $uibModalInstance, WindowRef) {
    var MSECS_TO_REFRESH = 20;
    var _refreshPage = function(delay) {
      $timeout(function() {
        WindowRef.nativeWindow.location.reload();
      }, delay);
    };

    $scope.closeAndRefresh = function() {
      $uibModalInstance.dismiss('cancel');
      _refreshPage(MSECS_TO_REFRESH);
    };
  }
]);
