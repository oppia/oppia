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
 * @fileoverview Controller for question player concept card modal.
 */

require(
  'components/common-layout-directives/common-elements/' +
  'confirm-or-cancel-modal.controller.ts');

require('services/contextual/url.service.ts');

angular.module('oppia').controller('QuestionPlayerConceptCardModalController', [
  '$controller', '$scope', '$uibModalInstance', '$window',
  'UrlService', 'skillIds', 'skills',
  function(
      $controller, $scope, $uibModalInstance, $window,
      UrlService, skillIds, skills) {
    $controller('ConfirmOrCancelModalController', {
      $scope: $scope,
      $uibModalInstance: $uibModalInstance
    });
    $scope.skillIds = skillIds;
    $scope.skills = skills;
    $scope.index = 0;
    $scope.modalHeader = $scope.skills[$scope.index];
    $scope.isInTestMode = true;

    $scope.isLastConceptCard = function() {
      return $scope.index === $scope.skills.length - 1;
    };

    $scope.goToNextConceptCard = function() {
      $scope.index++;
      $scope.modalHeader = $scope.skills[$scope.index];
    };

    $scope.retryTest = function() {
      var selectedSubtopics = UrlService.getUrlParams().selected_subtopic_ids;
      $window.location.replace(
        UrlService.getPathname() + '?selected_subtopic_ids=' +
        selectedSubtopics);
    };
  }
]);
