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
 * Directive for the EndExploration 'interaction'.
 *
 * IMPORTANT NOTE: The naming convention for customization args that are passed
 * into the directive is: the name of the parameter, followed by 'With',
 * followed by the name of the arg.
 */
oppia.directive('oppiaInteractiveEndExploration', [
  'oppiaHtmlEscaper', function(oppiaHtmlEscaper) {
    return {
      restrict: 'E',
      scope: {},
      templateUrl: 'interaction/EndExploration',
      controller: [
          '$scope', '$http', '$attrs', 'urlService',
          'explorationContextService', 'PAGE_CONTEXT',
          function(
            $scope, $http, $attrs, urlService, explorationContextService,
            PAGE_CONTEXT) {
        $scope.isIframed = urlService.isIframed();

        $scope.authorRecommendedExplorationIds = oppiaHtmlEscaper.escapedJsonToObj(
          $attrs.recommendedExplorationIdsWithValue);

        $scope.authorRecommendedExplorationSummaries = [];
        if ($scope.authorRecommendedExplorationIds.length > 0) {
          $http({
            method: 'GET',
            url: '/explorationsummarieshandler/data',
            params: {
              stringified_exp_ids: JSON.stringify($scope.authorRecommendedExplorationIds)
            }
          }).success(function(data) {
            $scope.authorRecommendedExplorationSummaries = data.summaries;
          });
        }

        var explorationId = explorationContextService.getExplorationId();
        $http({
          method: 'GET',
          url: '/explorehandler/recommendations?id=' + explorationId
        }).success(function(data) {
          var allRecommendedExplorationIds = data.exp_recommendations;
          $scope.systemRecommendedExplorationIds = [];

          var MAX_RECOMMENDATIONS = 4;

          var remainingRecommendedExplorationIds =
            angular.copy(allRecommendedExplorationIds);
          for (var i = 0; i < allRecommendedExplorationIds.length; i++) {
            var randomIndex = Math.floor(
              Math.random() * remainingRecommendedExplorationIds.length);
            var randomRecommendationId =
              remainingRecommendedExplorationIds[randomIndex];
            if ($scope.authorRecommendedExplorationIds.indexOf(randomRecommendationId) == -1) {
              $scope.systemRecommendedExplorationIds.push(randomRecommendationId);
            }
            remainingRecommendedExplorationIds.splice(randomIndex, 1);

            if ($scope.systemRecommendedExplorationIds.length >= MAX_RECOMMENDATIONS) {
              break;
            }
          }

          if ($scope.systemRecommendedExplorationIds.length > 0) {
            $http({
              method: 'GET',
              url: '/explorationsummarieshandler/data',
              params: {
                stringified_exp_ids: JSON.stringify($scope.systemRecommendedExplorationIds)
              }
            }).success(function(data) {
              $scope.systemRecommendedExplorationSummaries = data.summaries;
            });
          }
        });
      }]
    };
  }
]);

oppia.directive('oppiaResponseEndExploration', [
  'oppiaHtmlEscaper', function(oppiaHtmlEscaper) {
    return {
      restrict: 'E',
      scope: {},
      templateUrl: 'response/EndExploration',
      controller: ['$scope', '$attrs', function($scope, $attrs) {

      }]
    };
  }
]);
