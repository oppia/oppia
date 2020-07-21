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
 * @fileoverview Directive for showing Editor Navigation
 * in editor.
 */

require('domain/utilities/url-interpolation.service.ts');
require(
  'pages/exploration-editor-page/feedback-tab/services/thread-data.service.ts');
require(
  'pages/exploration-editor-page/modal-templates/help-modal.controller.ts');
require('pages/exploration-editor-page/services/exploration-rights.service.ts');
require(
  'pages/exploration-editor-page/services/exploration-warnings.service.ts');
require('pages/exploration-editor-page/services/router.service.ts');
require('services/context.service.ts');
require('services/contextual/window-dimensions.service.ts');
require('services/exploration-improvements.service.ts');
require('services/site-analytics.service.ts');
require('services/user.service.ts');

angular.module('oppia').directive('editorNavigation', () => ({
  restrict: 'E',
  template: require('./editor-navigation.directive.html'),
  controller: [
    '$q', '$rootScope', '$scope', '$timeout', '$uibModal', 'ContextService',
    'ExplorationImprovementsService', 'ExplorationRightsService',
    'ExplorationWarningsService', 'RouterService', 'SiteAnalyticsService',
    'ThreadDataService', 'UrlInterpolationService', 'UserService',
    'WindowDimensionsService',
    function(
        $q, $rootScope, $scope, $timeout, $uibModal, ContextService,
        ExplorationImprovementsService, ExplorationRightsService,
        ExplorationWarningsService, RouterService, SiteAnalyticsService,
        ThreadDataService, UrlInterpolationService, UserService,
        WindowDimensionsService) {
      var ctrl = this;
      var taskCount = 0;
      $scope.getOpenTaskCount = function() {
        return taskCount;
      };

      $scope.isImprovementsTabEnabled = false;
      $q.when(ExplorationImprovementsService.isImprovementsTabEnabledAsync())
        .then(improvementsTabIsEnabled => {
          $scope.isImprovementsTabEnabled = improvementsTabIsEnabled;
        });

      $scope.showUserHelpModal = function() {
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
        }).result.then(function(mode) {
          if (mode === EDITOR_TUTORIAL_MODE) {
            $rootScope.$broadcast('openEditorTutorial');
          } else if (mode === TRANSLATION_TUTORIAL_MODE) {
            $rootScope.$broadcast('openTranslationTutorial');
          }
        }, function() {
          // Note to developers:
          // This callback is triggered when the Cancel button is clicked.
          // No further action is needed.
        });
      };

      $scope.countWarnings = function() {
        return ExplorationWarningsService.countWarnings();
      };
      $scope.getWarnings = function() {
        return ExplorationWarningsService.getWarnings();
      };
      $scope.hasCriticalWarnings = function() {
        return ExplorationWarningsService.hasCriticalWarnings;
      };

      $scope.getActiveTabName = function() {
        return RouterService.getActiveTabName();
      };
      $scope.selectMainTab = function() {
        RouterService.navigateToMainTab();
      };
      $scope.selectTranslationTab = function() {
        RouterService.navigateToTranslationTab();
      };
      $scope.selectPreviewTab = function() {
        RouterService.navigateToPreviewTab();
      };
      $scope.selectSettingsTab = function() {
        RouterService.navigateToSettingsTab();
      };
      $scope.selectStatsTab = function() {
        RouterService.navigateToStatsTab();
      };
      $scope.selectImprovementsTab = function() {
        RouterService.navigateToImprovementsTab();
      };
      $scope.selectHistoryTab = function() {
        RouterService.navigateToHistoryTab();
      };
      $scope.selectFeedbackTab = function() {
        RouterService.navigateToFeedbackTab();
      };
      $scope.getOpenThreadsCount = function() {
        return ThreadDataService.getOpenThreadsCount();
      };

      ctrl.$onInit = function() {
        $scope.popoverControlObject = {
          postTutorialHelpPopoverIsShown: false
        };
        $scope.isLargeScreen = (WindowDimensionsService.getWidth() >= 1024);
        $scope.$on('openPostTutorialHelpPopover', function() {
          if ($scope.isLargeScreen) {
            $scope.popoverControlObject.postTutorialHelpPopoverIsShown = (
              true);
            $timeout(function() {
              $scope.popoverControlObject
                .postTutorialHelpPopoverIsShown = false;
            }, 4000);
          } else {
            $scope.popoverControlObject
              .postTutorialHelpPopoverIsShown = false;
          }
        });

        $scope.userIsLoggedIn = null;
        UserService.getUserInfoAsync().then(function(userInfo) {
          $scope.userIsLoggedIn = userInfo.isLoggedIn();
        });
        $scope.ExplorationRightsService = ExplorationRightsService;

        ctrl.resizeSubscription = WindowDimensionsService.getResizeEvent().
          subscribe(evt => {
            $scope.isLargeScreen = (
              WindowDimensionsService.getWidth() >= 1024);

            $scope.$applyAsync();
          });
      };

      ctrl.$onDestroy = function() {
        if (ctrl.resizeSubscription) {
          ctrl.resizeSubscription.unsubscribe();
        }
      };
    }
  ],
}));
