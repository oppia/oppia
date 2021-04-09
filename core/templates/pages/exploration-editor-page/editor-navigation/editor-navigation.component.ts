// Copyright 2016 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Component for showing Editor Navigation
 * in editor.
 */

require('domain/utilities/url-interpolation.service.ts');
require(
  'pages/exploration-editor-page/feedback-tab/services/' +
  'thread-data-backend-api.service.ts');
require(
  'pages/exploration-editor-page/modal-templates/help-modal.controller.ts');
require('pages/exploration-editor-page/services/exploration-rights.service.ts');
require(
  'pages/exploration-editor-page/services/exploration-warnings.service.ts');
require('pages/exploration-editor-page/services/router.service.ts');
require('services/context.service.ts');
require('services/exploration-improvements.service.ts');
require('services/site-analytics.service.ts');
require('services/user.service.ts');
require('services/contextual/window-dimensions.service.ts');
require(
  'pages/exploration-editor-page/services/' +
   'user-exploration-permissions.service.ts');
require('pages/exploration-editor-page/services/change-list.service.ts');

import { Subscription } from 'rxjs';

angular.module('oppia').component('editorNavigation', {
  template: require('./editor-navigation.component.html'),
  controller: [
    '$q', '$rootScope', '$scope', '$timeout', '$uibModal', 'ChangeListService',
    'ContextService', 'EditabilityService',
    'ExplorationImprovementsService', 'ExplorationRightsService',
    'ExplorationSaveService',
    'ExplorationWarningsService', 'RouterService', 'SiteAnalyticsService',
    'StateTutorialFirstTimeService',
    'ThreadDataBackendApiService', 'UrlInterpolationService',
    'UserExplorationPermissionsService', 'UserService',
    'WindowDimensionsService',
    function(
        $q, $rootScope, $scope, $timeout, $uibModal, ChangeListService,
        ContextService, EditabilityService,
        ExplorationImprovementsService, ExplorationRightsService,
        ExplorationSaveService,
        ExplorationWarningsService, RouterService, SiteAnalyticsService,
        StateTutorialFirstTimeService,
        ThreadDataBackendApiService, UrlInterpolationService,
        UserExplorationPermissionsService, UserService,
        WindowDimensionsService) {
      this.directiveSubscriptions = new Subscription();
      $scope.showUserHelpModal = () => {
        var explorationId = ContextService.getExplorationId();
        SiteAnalyticsService.registerClickHelpButtonEvent(explorationId);
        var EDITOR_TUTORIAL_MODE = 'editor';
        var TRANSLATION_TUTORIAL_MODE = 'translation';
        $uibModal.open({
          templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
            '/pages/exploration-editor-page/modal-templates/' +
            'help-modal.template.html'),
          backdrop: true,
          controller: 'HelpModalController',
          windowClass: 'oppia-help-modal'
        }).result.then(mode => {
          if (mode === EDITOR_TUTORIAL_MODE) {
            StateTutorialFirstTimeService.onOpenEditorTutorial.emit();
          } else if (mode === TRANSLATION_TUTORIAL_MODE) {
            StateTutorialFirstTimeService.onOpenTranslationTutorial.emit();
          }
        }, () => {
          // Note to developers:
          // This callback is triggered when the Cancel button is clicked.
          // No further action is needed.
        });
      };

      $scope.saveIsInProcess = false;
      $scope.publishIsInProcess = false;
      $scope.loadingDotsAreShown = false;

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

      $scope.discardChanges = function() {
        ExplorationSaveService.discardChanges();
      };

      $scope.getChangeListLength = function() {
        return ChangeListService.getChangeList().length;
      };


      $scope.isExplorationSaveable = function() {
        return ExplorationSaveService.isExplorationSaveable();
      };

      $scope.showLoadingDots = function() {
        $scope.loadingDotsAreShown = true;
      };

      $scope.hideLoadingDots = function() {
        $scope.loadingDotsAreShown = false;
      };

      $scope.showPublishExplorationModal = function() {
        $scope.publishIsInProcess = true;
        $scope.loadingDotsAreShown = true;

        ExplorationSaveService.showPublishExplorationModal(
          $scope.showLoadingDots, $scope.hideLoadingDots)
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

        ExplorationSaveService.saveChanges(
          $scope.showLoadingDots, $scope.hideLoadingDots)
          .then(function() {
            $scope.saveIsInProcess = false;
            $scope.loadingDotsAreShown = false;
            $scope.$applyAsync();
          });
        $scope.$applyAsync();
      };

      $scope.toggleMobileNavOptions = function() {
        $scope.mobileNavOptionsAreShown = !$scope.mobileNavOptionsAreShown;
      };
      $scope.countWarnings = () => ExplorationWarningsService.countWarnings();
      $scope.getWarnings = () => ExplorationWarningsService.getWarnings();
      $scope.hasCriticalWarnings = (
        () => ExplorationWarningsService.hasCriticalWarnings);
      $scope.getActiveTabName = () => RouterService.getActiveTabName();
      $scope.selectMainTab = () => RouterService.navigateToMainTab();
      $scope.selectTranslationTab = (
        () => RouterService.navigateToTranslationTab());
      $scope.selectPreviewTab = () => RouterService.navigateToPreviewTab();
      $scope.selectSettingsTab = () => RouterService.navigateToSettingsTab();
      $scope.selectStatsTab = () => RouterService.navigateToStatsTab();
      $scope.selectImprovementsTab = (
        () => RouterService.navigateToImprovementsTab());
      $scope.selectHistoryTab = () => RouterService.navigateToHistoryTab();
      $scope.selectFeedbackTab = () => RouterService.navigateToFeedbackTab();
      $scope.getOpenThreadsCount = (
        () => ThreadDataBackendApiService.getOpenThreadsCount());

      this.$onInit = () => {
        $scope.ExplorationRightsService = ExplorationRightsService;

        UserExplorationPermissionsService.getPermissionsAsync()
          .then(function(permissions) {
            $scope.showPublishButton = function() {
              return permissions.canPublish && (
                ExplorationRightsService.isPrivate());
            };
          });

        this.screenIsLarge = WindowDimensionsService.getWidth() >= 1024;
        this.directiveSubscriptions.add(
          WindowDimensionsService.getResizeEvent().subscribe(evt => {
            this.screenIsLarge = WindowDimensionsService.getWidth() >= 1024;
            $scope.$applyAsync();
          })
        );
        $scope.isScreenLarge = () => this.screenIsLarge;

        this.postTutorialHelpPopoverIsShown = false;
        this.directiveSubscriptions.add(
          StateTutorialFirstTimeService.onOpenPostTutorialHelpPopover.subscribe(
            () => {
              if (this.screenIsLarge) {
                this.postTutorialHelpPopoverIsShown = true;
                $timeout(() => {
                  this.postTutorialHelpPopoverIsShown = false;
                }, 4000);
              } else {
                this.postTutorialHelpPopoverIsShown = false;
              }
            }
          )
        );

        $scope.isPostTutorialHelpPopoverShown = (
          () => this.postTutorialHelpPopoverIsShown);

        this.improvementsTabIsEnabled = false;
        $q.when(ExplorationImprovementsService.isImprovementsTabEnabledAsync())
          .then(improvementsTabIsEnabled => {
            this.improvementsTabIsEnabled = improvementsTabIsEnabled;
          });
        $scope.isImprovementsTabEnabled = () => this.improvementsTabIsEnabled;

        this.userIsLoggedIn = false;
        $q.when(UserService.getUserInfoAsync())
          .then(userInfo => {
            this.userIsLoggedIn = userInfo.isLoggedIn();
            // TODO(#8521): Remove the use of $rootScope.$apply()
            // once the controller is migrated to angular.
            $rootScope.$applyAsync();
          });
        $scope.isUserLoggedIn = () => this.userIsLoggedIn;
      };
      this.$onDestroy = function() {
        this.directiveSubscriptions.unsubscribe();
      };
    }
  ]
});
