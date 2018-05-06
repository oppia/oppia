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
        '$scope', 'ChangeListService', 'EditabilityService',
        'ExplorationRightsService', 'ExplorationWarningsService',
        'ExplorationSaveService',
        function(
            $scope, ChangeListService, EditabilityService,
            ExplorationRightsService, ExplorationWarningsService,
            ExplorationSaveService) {
          $scope.saveIsInProcess = false;
          $scope.publishIsInProcess = false;
          $scope.loadingDotsAreShown = false;

          $scope.showPublishButton = function() {
            return GLOBALS.canPublish;
          }

          $scope.isPrivate = function() {
            return ExplorationRightsService.isPrivate();
          };

          $scope.isExplorationLockedForEditing = function() {
            return ChangeListService.isExplorationLockedForEditing();
          };

          $scope.isEditableOutsideTutorialMode = function() {
            return EditabilityService.isEditableOutsideTutorialMode();
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
            if (ExplorationWarningsService.countWarnings() > 0) {
              return 'Please resolve the warnings before publishing.';
            } else if (ChangeListService.isExplorationLockedForEditing()) {
              return 'Please save your changes before publishing.';
            } else {
              return 'Publish to Oppia Library';
            }
          };

          $scope.getSaveButtonTooltip = function() {
            if (ExplorationWarningsService.hasCriticalWarnings() > 0) {
              return 'Please resolve the warnings.';
            } else if (ExplorationRightsService.isPrivate()) {
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

            ExplorationSaveService.showPublishExplorationModal(
              showLoadingDots, hideLoadingDots)
              .then(function() {
                $scope.publishIsInProcess = false;
                $scope.loadingDotsAreShown = false;
              });
          };

          $scope.saveChanges = function() {
            $scope.saveIsInProcess = true;
            $scope.loadingDotsAreShown = true;

            ExplorationSaveService.saveChanges(showLoadingDots, hideLoadingDots)
              .then(function() {
                $scope.saveIsInProcess = false;
                $scope.loadingDotsAreShown = false;
              });
          };
        }
      ]
    };
  }]);
