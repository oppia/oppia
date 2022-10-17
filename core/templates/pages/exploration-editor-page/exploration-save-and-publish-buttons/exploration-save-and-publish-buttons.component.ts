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

import { Subscription } from 'rxjs';

require(
  'components/common-layout-directives/common-elements/' +
  'loading-dots.component.ts');

require(
  'components/common-layout-directives/common-elements/' +
  'confirm-or-cancel-modal.controller.ts');
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
require('services/internet-connectivity.service.ts');

angular.module('oppia').component('explorationSaveAndPublishButtons', {
  template: require('./exploration-save-and-publish-buttons.component.html'),
  controller: [
    '$scope', '$uibModal', 'ChangeListService',
    'EditabilityService', 'ExplorationRightsService', 'ExplorationSaveService',
    'ExplorationWarningsService', 'InternetConnectivityService',
    'UserExplorationPermissionsService',
    function(
        $scope, $uibModal, ChangeListService,
        EditabilityService, ExplorationRightsService, ExplorationSaveService,
        ExplorationWarningsService, InternetConnectivityService,
        UserExplorationPermissionsService) {
      var ctrl = this;
      ctrl.directiveSubscriptions = new Subscription();
      $scope.isPrivate = function() {
        return ExplorationRightsService.isPrivate();
      };

      $scope.isLockedByAdmin = function() {
        return EditabilityService.isLockedByAdmin();
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

      let isModalDisplayed = false;

      $scope.getChangeListLength = function() {
        var countChanges = ChangeListService.getChangeList().length;

        const MIN_CHANGES_DISPLAY_PROMPT = 50;

        if (countChanges >= MIN_CHANGES_DISPLAY_PROMPT && !isModalDisplayed &&
          !$scope.saveIsInProcess) {
          isModalDisplayed = true;
          $uibModal.open({
            template: require(
              'pages/exploration-editor-page/modal-templates/' +
              'exploration-save-prompt-modal.template.html'),
            backdrop: 'static',
            controller: 'ConfirmOrCancelModalController'
          }).result.then(function() {
            $scope.saveChanges();
          }, function() {
            // Note to developers:
            // This callback is triggered when the Cancel button is clicked.
            // No further action is needed.
          });
        }
        return ChangeListService.getChangeList().length;
      };

      $scope.isExplorationSaveable = function() {
        return ExplorationSaveService.isExplorationSaveable();
      };

      $scope.getPublishExplorationButtonTooltip = function() {
        if (!$scope.connectedToInternet) {
          return 'You can not publish the exploration when offline.';
        } else if ($scope.countWarnings() > 0) {
          return 'Please resolve the warnings before publishing.';
        } else if ($scope.isExplorationLockedForEditing()) {
          return 'Please save your changes before publishing.';
        } else {
          return 'Publish to Oppia Library';
        }
      };

      $scope.getSaveButtonTooltip = function() {
        if (!$scope.connectedToInternet) {
          return 'You can not save the exploration when offline.';
        } else if (ExplorationWarningsService.hasCriticalWarnings() > 0) {
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

      var hideLoadingAndUpdatePermission = function() {
        $scope.loadingDotsAreShown = false;
        UserExplorationPermissionsService.fetchPermissionsAsync()
          .then(function(permissions) {
            $scope.explorationCanBePublished = permissions.canPublish;
            $scope.$applyAsync();
          });
      };

      $scope.showPublishExplorationModal = function() {
        $scope.publishIsInProcess = true;
        $scope.loadingDotsAreShown = true;

        ExplorationSaveService.showPublishExplorationModal(
          showLoadingDots, hideLoadingAndUpdatePermission)
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

        ExplorationSaveService.saveChangesAsync(
          showLoadingDots, hideLoadingAndUpdatePermission)
          .then(function() {
            $scope.saveIsInProcess = false;
            $scope.loadingDotsAreShown = false;
            $scope.$applyAsync();
          }, () => {});
        $scope.$applyAsync();
      };
      ctrl.$onInit = function() {
        $scope.saveIsInProcess = false;
        $scope.publishIsInProcess = false;
        $scope.loadingDotsAreShown = false;
        $scope.explorationCanBePublished = false;
        $scope.connectedToInternet = true;

        UserExplorationPermissionsService.getPermissionsAsync()
          .then(function(permissions) {
            $scope.explorationCanBePublished = permissions.canPublish;
          });
        ctrl.directiveSubscriptions.add(
          UserExplorationPermissionsService.onUserExplorationPermissionsFetched
            .subscribe(
              () => {
                UserExplorationPermissionsService.getPermissionsAsync()
                  .then(function(permissions) {
                    $scope.explorationCanBePublished = permissions.canPublish;
                    $scope.$applyAsync();
                  });
              }
            )
        );
        ctrl.directiveSubscriptions.add(
          InternetConnectivityService.onInternetStateChange.subscribe(
            internetAccessible => {
              $scope.connectedToInternet = internetAccessible;
              $scope.$applyAsync();
            })
        );
      };

      ctrl.$onDestroy = function() {
        ctrl.directiveSubscriptions.unsubscribe();
      };
    }
  ]
});
