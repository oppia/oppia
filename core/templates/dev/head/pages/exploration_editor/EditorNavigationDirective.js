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
        '$scope', '$rootScope', '$timeout', '$modal',
        'RouterService', 'explorationRightsService',
        'explorationWarningsService',
        'stateEditorTutorialFirstTimeService',
        'ThreadDataService', 'siteAnalyticsService',
        'ExplorationContextService', 'WindowDimensionsService',
        function(
            $scope, $rootScope, $timeout, $modal,
            RouterService, explorationRightsService,
            explorationWarningsService,
            stateEditorTutorialFirstTimeService,
            ThreadDataService, siteAnalyticsService,
            ExplorationContextService, WindowDimensionsService) {
          $scope.postTutorialHelpPopoverIsShown = false;
          $scope.isLargeScreen = (WindowDimensionsService.getWidth() >= 1024);

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

          $scope.userIsLoggedIn = GLOBALS.userIsLoggedIn;

          $scope.showUserHelpModal = function() {
            var explorationId = ExplorationContextService.getExplorationId();
            siteAnalyticsService.registerClickHelpButtonEvent(explorationId);
            var modalInstance = $modal.open({
              templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
                '/pages/exploration_editor/' +
                'help_modal_directive.html'),
              backdrop: true,
              controller: [
                '$scope', '$modalInstance',
                'siteAnalyticsService', 'ExplorationContextService',
                function(
                  $scope, $modalInstance,
                  siteAnalyticsService, ExplorationContextService) {
                  var explorationId = (
                    ExplorationContextService.getExplorationId());

                  $scope.beginTutorial = function() {
                    siteAnalyticsService
                      .registerOpenTutorialFromHelpCenterEvent(
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
          $scope.getTabStatuses = RouterService.getTabStatuses;
          $scope.selectMainTab = RouterService.navigateToMainTab;
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
