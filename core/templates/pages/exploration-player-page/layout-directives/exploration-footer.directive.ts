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

require('components/button-directives/hint-and-solution-buttons.directive.ts');

require('domain/summary/exploration-summary-backend-api.service.ts');
require('domain/utilities/url-interpolation.service.ts');
require('services/context.service.ts');
require('services/contextual/url.service.ts');
require('services/contextual/window-dimensions.service.ts');

angular.module('oppia').directive('explorationFooter', [
  'UrlInterpolationService', function(UrlInterpolationService) {
    return {
      restrict: 'E',
      template: require('./exploration-footer.directive.html'),
      controller: [
        '$scope', '$http', '$log', 'ContextService',
        'ExplorationSummaryBackendApiService', 'UrlService',
        'WindowDimensionsService',
        function(
            $scope, $http, $log, ContextService,
            ExplorationSummaryBackendApiService, UrlService,
            WindowDimensionsService) {
          var ctrl = this;
          $scope.getStaticImageUrl = function(imagePath) {
            return UrlInterpolationService.getStaticImageUrl(imagePath);
          };
          ctrl.$onInit = function() {
            $scope.explorationId = ContextService.getExplorationId();
            $scope.iframed = UrlService.isIframed();
            $scope.windowIsNarrow = WindowDimensionsService.isWindowNarrow();
            ctrl.resizeSubscription = WindowDimensionsService.getResizeEvent().
              subscribe(evt => {
                $scope.windowIsNarrow = (
                  WindowDimensionsService.isWindowNarrow());
                $scope.$applyAsync();
              });
            $scope.contributorNames = [];
            if (!ContextService.isInQuestionPlayerMode()) {
              ExplorationSummaryBackendApiService
                .loadPublicAndPrivateExplorationSummaries([
                  $scope.explorationId])
                .then(function(summaries) {
                  var summaryBackendObject = null;
                  if (summaries.length > 0) {
                    var contributorSummary = (
                      summaries[0].human_readable_contributors_summary);
                    $scope.contributorNames = (
                      Object.keys(contributorSummary).sort(
                        function(contributorUsername1, contributorUsername2) {
                          var commitsOfContributor1 = contributorSummary[
                            contributorUsername1].num_commits;
                          var commitsOfContributor2 = contributorSummary[
                            contributorUsername2].num_commits;
                          return commitsOfContributor2 - commitsOfContributor1;
                        })
                    );
                  }
                });
            }
          };

          ctrl.$onDestroy = function() {
            if (ctrl.resizeSubscription) {
              ctrl.resizeSubscription.unsubscribe();
            }
          };
        }
      ]
    };
  }]);
