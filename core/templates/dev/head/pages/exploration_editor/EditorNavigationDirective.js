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

// This will be removed after translation tab will be ready.
oppia.constant('ENABLE_TRANSLATION_TAB', false);

oppia.directive('editorNavigation', [
  'UrlInterpolationService', function(UrlInterpolationService) {
    return {
      restrict: 'E',
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/exploration_editor/editor_navigation_directive.html'),
      controller: [
        '$scope', '$rootScope', '$timeout', '$uibModal',
        'RouterService', 'ExplorationRightsService',
        'ExplorationWarningsService', 'ENABLE_TRANSLATION_TAB',
        'StateEditorTutorialFirstTimeService',
        'ThreadDataService', 'siteAnalyticsService',
        'ExplorationContextService', 'WindowDimensionsService',
        function(
            $scope, $rootScope, $timeout, $uibModal,
            RouterService, ExplorationRightsService,
            ExplorationWarningsService, ENABLE_TRANSLATION_TAB,
            StateEditorTutorialFirstTimeService,
            ThreadDataService, siteAnalyticsService,
            ExplorationContextService, WindowDimensionsService) {
          $scope.popoverControlObject = {
            postTutorialHelpPopoverIsShown: false
          };
          $scope.isLargeScreen = (WindowDimensionsService.getWidth() >= 1024);

          $scope.$on('openPostTutorialHelpPopover', function() {
            if ($scope.isLargeScreen) {
              $scope.popoverControlObject.postTutorialHelpPopoverIsShown = true;
              $timeout(function() {
                $scope.popoverControlObject
                  .postTutorialHelpPopoverIsShown = false;
              }, 5000);
            } else {
              $scope.popoverControlObject
                .postTutorialHelpPopoverIsShown = false;
            }
          });

          $scope.userIsLoggedIn = GLOBALS.userIsLoggedIn;
          // This will be removed after translation tab will be ready.
          $scope.enableTranslationTab = ENABLE_TRANSLATION_TAB;s

          $scope.showUserHelpModal = function() {
            var explorationId = ExplorationContextService.getExplorationId();
            siteAnalyticsService.registerClickHelpButtonEvent(explorationId);
            var modalInstance = $uibModal.open({
              templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
                '/pages/exploration_editor/' +
                'help_modal_directive.html'),
              backdrop: true,
              controller: [
                '$scope', '$uibModalInstance',
                'siteAnalyticsService', 'ExplorationContextService',
                function(
                    $scope, $uibModalInstance,
                    siteAnalyticsService, ExplorationContextService) {
                  var explorationId = (
                    ExplorationContextService.getExplorationId());

                  $scope.beginTutorial = function() {
                    siteAnalyticsService
                      .registerOpenTutorialFromHelpCenterEvent(
                        explorationId);
                    $uibModalInstance.close();
                  };

                  $scope.goToHelpCenter = function() {
                    siteAnalyticsService.registerVisitHelpCenterEvent(
                      explorationId);
                    $uibModalInstance.dismiss('cancel');
                  };
                }
              ],
              windowClass: 'oppia-help-modal'
            });

            modalInstance.result.then(function() {
              $rootScope.$broadcast('openEditorTutorial');
            }, function() {
              StateEditorTutorialFirstTimeService.markTutorialFinished();
            });
          };

          $scope.countWarnings = ExplorationWarningsService.countWarnings;
          $scope.getWarnings = ExplorationWarningsService.getWarnings;
          $scope.hasCriticalWarnings = (
            ExplorationWarningsService.hasCriticalWarnings);

          $scope.ExplorationRightsService = ExplorationRightsService;
          $scope.getTabStatuses = RouterService.getTabStatuses;
          $scope.selectMainTab = RouterService.navigateToMainTab;
          $scope.selectTranslationTab = RouterService.navigateToTranslationTab;
          $scope.selectPreviewTab = RouterService.navigateToPreviewTab;
          $scope.selectSettingsTab = RouterService.navigateToSettingsTab;
          $scope.selectStatsTab = RouterService.navigateToStatsTab;
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
