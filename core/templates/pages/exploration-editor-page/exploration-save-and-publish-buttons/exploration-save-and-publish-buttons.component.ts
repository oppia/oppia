// Copyright 2014 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Directive for the exploration save & publish buttons.
 */

require(
  'components/common-layout-directives/common-elements/' +
  'loading-dots.component.ts');

require('domain/utilities/url-interpolation.service.ts');
require('pages/exploration-editor-page/services/change-list.service.ts');
require('pages/exploration-editor-page/services/exploration-rights.service.ts');
require('pages/exploration-editor-page/services/exploration-save.service.ts');
require(
  'pages/exploration-editor-page/services/exploration-warnings.service.ts');
require(
  'pages/exploration-editor-page/services/' +
  'user-exploration-permissions.service.ts');
require('services/editability.service.ts');

angular.module('oppia').component('explorationSaveAndPublishButtons', {
  template: require('./exploration-save-and-publish-buttons.component.html'),
  controller: [
    '$scope', 'ChangeListService', 'EditabilityService',
    'ExplorationRightsService', 'ExplorationSaveService',
    'ExplorationWarningsService', 'UserExplorationPermissionsService',
    function(
        $scope, ChangeListService, EditabilityService,
        ExplorationRightsService, ExplorationSaveService,
        ExplorationWarningsService, UserExplorationPermissionsService) {
      var ctrl = this;
      $scope.isPrivate = function() {
        return ExplorationRightsService.isPrivate();
      };

      $scope.isExplorationLockedForEditing = function() {
        return ChangeListService.isExplorationLockedForEditing();
      };

      $scope.isEditableOutsideTutorialMode = function() {
        return EditabilityService.isEditableOutsideTutorialMode() ||
          EditabilityService.isTranslatable();
      };

      $scope.countWarnings = function() {
        return ExplorationWarningsService.countWarnings();
      };

      $scope.discardChanges = function() {
        ExplorationSaveService.discardChanges();
      };

      $scope.getChangeListLength = function() {
        return ChangeListService.getChangeList().length;
      };

      $scope.isExplorationSaveable = function() {
        return ExplorationSaveService.isExplorationSaveable();
      };

      $scope.getPublishExplorationButtonTooltip = function() {
        if ($scope.countWarnings() > 0) {
          return 'Please resolve the warnings before publishing.';
        } else if ($scope.isExplorationLockedForEditing()) {
          return 'Please save your changes before publishing.';
        } else {
          return 'Publish to Oppia Library';
        }
      };

      $scope.getSaveButtonTooltip = function() {
        if (ExplorationWarningsService.hasCriticalWarnings() > 0) {
          return 'Please resolve the warnings.';
        } else if ($scope.isPrivate()) {
          return 'Save Draft';
        } else {
          return 'Publish Changes';
        }
      };

      var showLoadingDots = function() {
        $scope.loadingDotsAreShown = true;
      };

      var hideLoadingDots = function() {
        $scope.loadingDotsAreShown = false;
      };

      $scope.showPublishExplorationModal = function() {
        $scope.publishIsInProcess = true;
        $scope.loadingDotsAreShown = true;

        ExplorationSaveService.showPublishExplorationModal(
          showLoadingDots, hideLoadingDots)
          .then(function() {
            $scope.publishIsInProcess = false;
            $scope.loadingDotsAreShown = false;
            $scope.$applyAsync();
          });
        $scope.$applyAsync();
      };

      $scope.saveChanges = function() {
        $scope.saveIsInProcess = true;
        $scope.loadingDotsAreShown = true;

        ExplorationSaveService.saveChanges(showLoadingDots, hideLoadingDots)
          .then(function() {
            $scope.saveIsInProcess = false;
            $scope.loadingDotsAreShown = false;
            $scope.$applyAsync();
          });
        $scope.$applyAsync();
      };
      ctrl.$onInit = function() {
        $scope.saveIsInProcess = false;
        $scope.publishIsInProcess = false;
        $scope.loadingDotsAreShown = false;

        UserExplorationPermissionsService.getPermissionsAsync()
          .then(function(permissions) {
            $scope.showPublishButton = function() {
              return permissions.canPublish && $scope.isPrivate();
            };
          });
      };
    }
  ]
});
