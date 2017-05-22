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
oppia.directive('explorationSaveAndPublishButtons', [
  'UrlInterpolationService', function(UrlInterpolationService) {
    return {
      restrict: 'E',
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/exploration_editor/' +
        'exploration_save_and_publish_buttons_directive.html'),
      controller: [
        '$scope', 'changeListService', 'editabilityService',
        'explorationRightsService', 'explorationWarningsService',
        'explorationSaveService',
        function(
            $scope, changeListService, editabilityService,
            explorationRightsService, explorationWarningsService,
            explorationSaveService) {
          $scope.saveIsInProcess = false;
          $scope.publishIsInProcess = false;
          $scope.loadingDotsAreShown = false;

          $scope.isPrivate = function() {
            return explorationRightsService.isPrivate();
          };

          $scope.isExplorationLockedForEditing = function() {
            return changeListService.isExplorationLockedForEditing();
          };

          $scope.isEditableOutsideTutorialMode = function() {
            return editabilityService.isEditableOutsideTutorialMode();
          };

          $scope.countWarnings = function() {
            return explorationWarningsService.countWarnings();
          };

          $scope.discardChanges = function() {
            explorationSaveService.discardChanges();
          };

          $scope.getChangeListLength = function() {
            return changeListService.getChangeList().length;
          };

          $scope.isExplorationSaveable = function() {
            return explorationSaveService.isExplorationSaveable();
          };

          $scope.getPublishExplorationButtonTooltip = function() {
            if (explorationWarningsService.countWarnings() > 0) {
              return 'Please resolve the warnings before publishing.';
            } else if (changeListService.isExplorationLockedForEditing()) {
              return 'Please save your changes before publishing.';
            } else {
              return 'Publish to Oppia Library';
            }
          };

          $scope.getSaveButtonTooltip = function() {
            if (explorationWarningsService.hasCriticalWarnings() > 0) {
              return 'Please resolve the warnings.';
            } else if (explorationRightsService.isPrivate()) {
              return 'Save Draft';
            } else {
              return 'Publish Changes';
            }
          };

          showLoadingDots = function() {
            $scope.loadingDotsAreShown = true;
          };

          hideLoadingDots = function() {
            $scope.loadingDotsAreShown = false;
          };

          $scope.showPublishExplorationModal = function() {
            $scope.publishIsInProcess = true;
            $scope.loadingDotsAreShown = true;

            explorationSaveService.showPublishExplorationModal(
              showLoadingDots, hideLoadingDots)
              .then(function() {
                $scope.publishIsInProcess = false;
                $scope.loadingDotsAreShown = false;
              });
          };

          $scope.saveChanges = function() {
            $scope.saveIsInProcess = true;
            $scope.loadingDotsAreShown = true;

            explorationSaveService.saveChanges(showLoadingDots, hideLoadingDots)
              .then(function() {
                $scope.saveIsInProcess = false;
                $scope.loadingDotsAreShown = false;
              });
          };
        }
      ]
    };
  }]);
