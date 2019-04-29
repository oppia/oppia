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

oppia.directive('editorNavigation', [
  'UrlInterpolationService', function(UrlInterpolationService) {
    return {
      restrict: 'E',
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/exploration_editor/editor_navigation_directive.html'),
      controller: [
        '$rootScope', '$scope', '$timeout', '$uibModal', 'ContextService',
        'ExplorationFeaturesService', 'ExplorationRightsService',
        'ExplorationWarningsService', 'RouterService',
        'SiteAnalyticsService', 'StateTutorialFirstTimeService',
        'ThreadDataService', 'UserService', 'WindowDimensionsService',
        function(
            $rootScope, $scope, $timeout, $uibModal, ContextService,
            ExplorationFeaturesService, ExplorationRightsService,
            ExplorationWarningsService, RouterService,
            SiteAnalyticsService, StateTutorialFirstTimeService,
            ThreadDataService, UserService, WindowDimensionsService) {
          $scope.popoverControlObject = {
            postTutorialHelpPopoverIsShown: false
          };
          $scope.isLargeScreen = (WindowDimensionsService.getWidth() >= 1024);
          $scope.isImprovementsTabEnabled =
            ExplorationFeaturesService.isImprovementsTabEnabled;

          $scope.$on('openPostTutorialHelpPopover', function() {
            if ($scope.isLargeScreen) {
              $scope.popoverControlObject.postTutorialHelpPopoverIsShown = true;
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

          $scope.showUserHelpModal = function() {
            var explorationId = ContextService.getExplorationId();
            SiteAnalyticsService.registerClickHelpButtonEvent(explorationId);
            var EDITOR_TUTORIAL_MODE = 'editor';
            var TRANSLATION_TUTORIAL_MODE = 'translation';
            var modalInstance = $uibModal.open({
              templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
                '/pages/exploration_editor/' +
                'help_modal_directive.html'),
              backdrop: true,
              controller: [
                '$scope', '$uibModalInstance',
                'SiteAnalyticsService', 'ContextService',
                function(
                    $scope, $uibModalInstance,
                    SiteAnalyticsService, ContextService) {
                  var explorationId = (
                    ContextService.getExplorationId());

                  $scope.beginEditorTutorial = function() {
                    SiteAnalyticsService
                      .registerOpenTutorialFromHelpCenterEvent(
                        explorationId);
                    $uibModalInstance.close(EDITOR_TUTORIAL_MODE);
                  };

                  $scope.beginTranslationTutorial = function() {
                    SiteAnalyticsService
                      .registerOpenTutorialFromHelpCenterEvent(
                        explorationId);
                    $uibModalInstance.close(TRANSLATION_TUTORIAL_MODE);
                  };

                  $scope.goToHelpCenter = function() {
                    SiteAnalyticsService.registerVisitHelpCenterEvent(
                      explorationId);
                    $uibModalInstance.dismiss('cancel');
                  };
                }
              ],
              windowClass: 'oppia-help-modal'
            });

            modalInstance.result.then(function(mode) {
              if (mode === EDITOR_TUTORIAL_MODE) {
                $rootScope.$broadcast('openEditorTutorial');
              } else if (mode === TRANSLATION_TUTORIAL_MODE) {
                $rootScope.$broadcast('openTranslationTutorial');
              }
            }, function() {
            });
          };

          $scope.countWarnings = ExplorationWarningsService.countWarnings;
          $scope.getWarnings = ExplorationWarningsService.getWarnings;
          $scope.hasCriticalWarnings = (
            ExplorationWarningsService.hasCriticalWarnings);

          $scope.ExplorationRightsService = ExplorationRightsService;
          $scope.getActiveTabName = RouterService.getActiveTabName;
          $scope.selectMainTab = RouterService.navigateToMainTab;
          $scope.selectTranslationTab = RouterService.navigateToTranslationTab;
          $scope.selectPreviewTab = RouterService.navigateToPreviewTab;
          $scope.selectSettingsTab = RouterService.navigateToSettingsTab;
          $scope.selectStatsTab = RouterService.navigateToStatsTab;
          $scope.selectImprovementsTab =
            RouterService.navigateToImprovementsTab;
          $scope.selectHistoryTab = RouterService.navigateToHistoryTab;
          $scope.selectFeedbackTab = RouterService.navigateToFeedbackTab;
          $scope.getOpenThreadsCount = ThreadDataService.getOpenThreadsCount;

          WindowDimensionsService.registerOnResizeHook(function() {
            $scope.isLargeScreen = (WindowDimensionsService.getWidth() >= 1024);
          });
        }
      ]
    };
  }]);
