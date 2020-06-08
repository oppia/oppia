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
 * @fileoverview Controller for new topic name editor modal.
 */

require(
  'components/common-layout-directives/common-elements/' +
  'confirm-or-cancel-modal.controller.ts');

angular.module('oppia').controller('CreateNewTopicModalController', [
  '$controller', '$scope', '$uibModalInstance',
  'NewlyCreatedTopicObjectFactory', 'MAX_CHARS_IN_TOPIC_DESCRIPTION',
  'MAX_CHARS_IN_TOPIC_NAME',
  function(
      $controller, $scope, $uibModalInstance,
      NewlyCreatedTopicObjectFactory, MAX_CHARS_IN_TOPIC_DESCRIPTION,
      MAX_CHARS_IN_TOPIC_NAME) {
    $controller('ConfirmOrCancelModalController', {
      $scope: $scope,
      $uibModalInstance: $uibModalInstance
    });

    $scope.newlyCreatedTopic = (
      NewlyCreatedTopicObjectFactory.createDefault());
    $scope.MAX_CHARS_IN_TOPIC_NAME = MAX_CHARS_IN_TOPIC_NAME;
    $scope.MAX_CHARS_IN_TOPIC_DESCRIPTION = (
      MAX_CHARS_IN_TOPIC_DESCRIPTION);

    $scope.save = function() {
      $uibModalInstance.close($scope.newlyCreatedTopic);
    };
    $scope.cancel = function() {
      $uibModalInstance.dismiss('cancel');
    };
  }
]);
