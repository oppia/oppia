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
 * @fileoverview Controller for preview summary tile modal.
 */

require(
  'components/common-layout-directives/common-elements/' +
  'confirm-or-cancel-modal.controller.ts');

require(
  'pages/exploration-editor-page/services/exploration-category.service.ts');
require('pages/exploration-editor-page/services/exploration-title.service.ts');
require(
  'pages/exploration-editor-page/services/exploration-objective.service.ts');

angular.module('oppia').controller('PreviewSummaryTileModalController', [
  '$controller', '$scope', '$uibModalInstance', 'ExplorationCategoryService',
  'ExplorationObjectiveService', 'ExplorationTitleService', 'ALL_CATEGORIES',
  'CATEGORIES_TO_COLORS', 'DEFAULT_CATEGORY_ICON', 'DEFAULT_COLOR',
  function(
      $controller, $scope, $uibModalInstance, ExplorationCategoryService,
      ExplorationObjectiveService, ExplorationTitleService, ALL_CATEGORIES,
      CATEGORIES_TO_COLORS, DEFAULT_CATEGORY_ICON, DEFAULT_COLOR) {
    $controller('ConfirmOrCancelModalController', {
      $scope: $scope,
      $uibModalInstance: $uibModalInstance
    });

    $scope.getExplorationTitle = function() {
      return ExplorationTitleService.displayed;
    };
    $scope.getExplorationObjective = function() {
      return ExplorationObjectiveService.displayed;
    };
    $scope.getExplorationCategory = function() {
      return ExplorationCategoryService.displayed;
    };
    $scope.getThumbnailIconUrl = function() {
      var category = ExplorationCategoryService.displayed;
      if (ALL_CATEGORIES.indexOf(category) === -1) {
        category = DEFAULT_CATEGORY_ICON;
      }
      return '/subjects/' + category + '.svg';
    };
    $scope.getThumbnailBgColor = function() {
      var category = ExplorationCategoryService.displayed;
      var color = null;
      if (!CATEGORIES_TO_COLORS.hasOwnProperty(category)) {
        color = DEFAULT_COLOR;
      } else {
        color = CATEGORIES_TO_COLORS[category];
      }
      return color;
    };
  }
]);
