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
 * @fileoverview Controller for delete account modal.
 */

require(
  'components/common-layout-directives/common-elements/' +
  'confirm-or-cancel-modal.controller.ts');
require('services/user.service.ts');

angular.module('oppia').controller('DeleteAccountModalController', [
  '$controller', '$rootScope', '$scope', '$uibModalInstance',
  'UserService', function(
      $controller, $rootScope, $scope, $uibModalInstance,
      UserService) {
    $controller('ConfirmOrCancelModalController', {
      $scope: $scope,
      $uibModalInstance: $uibModalInstance
    });

    let expectedUsername = null;
    UserService.getUserInfoAsync().then(function(userInfo) {
      expectedUsername = userInfo.getUsername();
      // TODO(#8521): Remove the use of $rootScope.$apply()
      // once the controller is migrated to angular.
      $rootScope.$applyAsync();
    });

    $scope.isValid = function() {
      return $scope.username === expectedUsername;
    };
  }
]);
