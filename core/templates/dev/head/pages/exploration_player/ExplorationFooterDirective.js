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
 * @fileoverview Directive for showing author/share footer
 * in exploration player.
 */

oppia.directive('explorationFooter', [
  'UrlInterpolationService', function(UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {
        twitterText: '@'
      },
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/exploration_player/exploration_footer_directive.html'),
      controller: [
        '$scope', '$http', '$log', 'ExplorationContextService',
        'ExplorationSummaryBackendApiService', 'WindowDimensionsService',
        'ExplorationPlayerService',
        function(
            $scope, $http, $log, ExplorationContextService,
            ExplorationSummaryBackendApiService, WindowDimensionsService,
            ExplorationPlayerService) {
          $scope.explorationId = ExplorationContextService.getExplorationId();

          $scope.getStaticImageUrl = UrlInterpolationService.getStaticImageUrl;

          $scope.windowIsNarrow = WindowDimensionsService.isWindowNarrow();
          WindowDimensionsService.registerOnResizeHook(function() {
            $scope.windowIsNarrow = WindowDimensionsService.isWindowNarrow();
            $scope.$apply();
          });

          $scope.getNumberOfCorrectAnswers = function () {
            return ExplorationPlayerService.getCorrectCount();
          };

          $scope.getClassForStarContent = function() {
            if ($scope.getNumberOfCorrectAnswers() > 9) {
              return 'star-content double-digit';
            }
            return 'star-content single-digit';
          };

          $scope.contributorNames = [];
          ExplorationSummaryBackendApiService
            .loadPublicAndPrivateExplorationSummaries([$scope.explorationId])
            .then(function(summaries) {
              var summaryBackendObject = null;
              if (summaries.length > 0) {
                var contributorSummary = (
                  summaries[0].human_readable_contributors_summary);
                $scope.contributorNames = Object.keys(contributorSummary).sort(
                  function(contributorUsername1, contributorUsername2) {
                    var commitsOfContributor1 = contributorSummary[
                      contributorUsername1].num_commits;
                    var commitsOfContributor2 = contributorSummary[
                      contributorUsername2].num_commits;
                    return commitsOfContributor2 - commitsOfContributor1;
                  });
              }
            });
        }
      ]
    };
  }]);
