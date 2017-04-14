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

oppia.directive('editorNavigation', [function() {
  return {
    restrict: 'E',
    templateUrl: 'inline/editor_navigation_directive',
    controller: [
      '$scope', '$rootScope', '$timeout', '$modal',
      'routerService', 'explorationRightsService',
      'explorationWarningsService',
      'stateEditorTutorialFirstTimeService',
      'threadDataService', 'siteAnalyticsService',
      'explorationContextService', 'windowDimensionsService',
      function(
          $scope, $rootScope, $timeout, $modal,
          routerService, explorationRightsService,
          explorationWarningsService,
          stateEditorTutorialFirstTimeService,
          threadDataService, siteAnalyticsService,
          explorationContextService, windowDimensionsService) {
        $scope.postTutorialHelpPopoverIsShown = false;
        $scope.isLargeScreen = (windowDimensionsService.getWidth() >= 1024);

        $scope.$on('openPostTutorialHelpPopover', function() {
          if ($scope.isLargeScreen) {
            $scope.postTutorialHelpPopoverIsShown = true;
            $timeout(function() {
              $scope.postTutorialHelpPopoverIsShown = false;
            }, 5000);
          } else {
            $scope.postTutorialHelpPopoverIsShown = false;
          }
        });

        $scope.showUserHelpModal = function() {
          var explorationId = explorationContextService.getExplorationId();
          siteAnalyticsService.registerClickHelpButtonEvent(explorationId);
          var modalInstance = $modal.open({
            templateUrl: 'modals/userHelp',
            backdrop: true,
            controller: [
              '$scope', '$modalInstance',
              'siteAnalyticsService', 'explorationContextService',
              function(
                $scope, $modalInstance,
                siteAnalyticsService, explorationContextService) {
                var explorationId = (
                  explorationContextService.getExplorationId());

                $scope.beginTutorial = function() {
                  siteAnalyticsService.registerOpenTutorialFromHelpCenterEvent(
                    explorationId);
                  $modalInstance.close();
                };

                $scope.goToHelpCenter = function() {
                  siteAnalyticsService.registerVisitHelpCenterEvent(
                    explorationId);
                  $modalInstance.dismiss('cancel');
                };
              }
            ],
            windowClass: 'oppia-help-modal'
          });

          modalInstance.result.then(function() {
            $rootScope.$broadcast('openEditorTutorial');
          }, function() {
            stateEditorTutorialFirstTimeService.markTutorialFinished();
          });
        };

        $scope.countWarnings = explorationWarningsService.countWarnings;
        $scope.getWarnings = explorationWarningsService.getWarnings;
        $scope.hasCriticalWarnings = (
          explorationWarningsService.hasCriticalWarnings);

        $scope.explorationRightsService = explorationRightsService;
        $scope.getTabStatuses = routerService.getTabStatuses;
        $scope.selectMainTab = routerService.navigateToMainTab;
        $scope.selectPreviewTab = routerService.navigateToPreviewTab;
        $scope.selectSettingsTab = routerService.navigateToSettingsTab;
        $scope.selectStatsTab = routerService.navigateToStatsTab;
        $scope.selectHistoryTab = routerService.navigateToHistoryTab;
        $scope.selectFeedbackTab = routerService.navigateToFeedbackTab;
        $scope.getOpenThreadsCount = threadDataService.getOpenThreadsCount;

        windowDimensionsService.registerOnResizeHook(function() {
          $scope.isLargeScreen = (windowDimensionsService.getWidth() >= 1024);
        });
      }
    ]
  };
}]);
