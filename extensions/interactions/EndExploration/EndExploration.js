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
          '$scope', '$http', '$attrs', '$q', 'urlService',
          'explorationContextService', 'PAGE_CONTEXT', 'EDITOR_TAB_CONTEXT',
          function(
            $scope, $http, $attrs, $q, urlService,
            explorationContextService, PAGE_CONTEXT, EDITOR_TAB_CONTEXT) {
        $scope.isIframed = urlService.isIframed();
        $scope.isInEditorPage = (
          explorationContextService.getPageContext() === PAGE_CONTEXT.EDITOR);
        $scope.isInEditorPreviewMode = $scope.isInEditorPage && (
          explorationContextService.getEditorTabContext() ===
            EDITOR_TAB_CONTEXT.PREVIEW);
        $scope.invalidExpIds = [];
        $scope.recommendedExplorationIds = [];
        $scope.recommendedExplorationSummaries = [];
        $scope.collectionId = GLOBALS.collectionId;

        var authorRecommendationsDeferred = $q.defer();
        var authorRecommendationsPromise = authorRecommendationsDeferred.promise;

        var authorRecommendedExplorationIds = oppiaHtmlEscaper.escapedJsonToObj(
          $attrs.recommendedExplorationIdsWithValue);
        if (authorRecommendedExplorationIds.length > 0) {
          $http({
            method: 'GET',
            url: '/explorationsummarieshandler/data',
            params: {
              stringified_exp_ids: JSON.stringify(authorRecommendedExplorationIds)
            }
          }).success(function(data) {
            var authorRecommendedExplorationSummaries = [];
            data.summaries.map(function(explorationSummary, index) {
              if (explorationSummary) {
                authorRecommendedExplorationSummaries.push(explorationSummary);
              } else {
                if ($scope.isInEditorPage) {
                  $scope.invalidExpIds.push(authorRecommendedExplorationIds[index]);
                }
                authorRecommendedExplorationIds.splice(index, 1);
              }
            });

            $scope.recommendedExplorationIds = authorRecommendedExplorationIds;
            $scope.recommendedExplorationSummaries = authorRecommendedExplorationSummaries;
            authorRecommendationsDeferred.resolve();
          });
        } else {
          authorRecommendationsDeferred.resolve();
        }

        if (!$scope.isInEditorPage) {
          authorRecommendationsPromise.then(function() {
            var explorationId = explorationContextService.getExplorationId();
            var collectionSuffix = '';
            if ($scope.collectionId) {
              collectionSuffix = '?collection_id=' + $scope.collectionId;
            }
            $http({
              method: 'GET',
              url: (
                '/explorehandler/recommendations/' + explorationId +
                collectionSuffix)
            }).success(function(data) {
              var allRecommendedExplorationIds = data.recommended_exp_ids;
              var systemRecommendedExplorationIds = [];

              var filteredRecommendationExplorationIds =
                  allRecommendedExplorationIds.filter(function(value) {
                return ($scope.recommendedExplorationIds.indexOf(value) == -1);
              });

              var MAX_RECOMMENDATIONS = 8;
              var maxSystemRecommendations = MAX_RECOMMENDATIONS -
                $scope.recommendedExplorationIds.length;

              var filteredRecommendationsSize = filteredRecommendationExplorationIds.length;
              for (var i = 0; i < Math.min(filteredRecommendationsSize, maxSystemRecommendations); i++) {
                var randomIndex = Math.floor(
                  Math.random() * filteredRecommendationExplorationIds.length);
                var randomRecommendationId =
                  filteredRecommendationExplorationIds[randomIndex];
                systemRecommendedExplorationIds.push(randomRecommendationId);
                filteredRecommendationExplorationIds.splice(randomIndex, 1);
              }

              if (systemRecommendedExplorationIds.length > 0) {
                $http({
                  method: 'GET',
                  url: '/explorationsummarieshandler/data',
                  params: {
                    stringified_exp_ids: JSON.stringify(systemRecommendedExplorationIds)
                  }
                }).success(function(data) {
                  $scope.recommendedExplorationIds = (
                    $scope.recommendedExplorationIds.concat(systemRecommendedExplorationIds));
                  $scope.recommendedExplorationSummaries = (
                    $scope.recommendedExplorationSummaries.concat(data.summaries));
                });
              }
            });
          });
        }
      }]
    };
  }
]);

oppia.directive('oppiaResponseEndExploration', [
  'oppiaHtmlEscaper', function(oppiaHtmlEscaper) {
    return {
      restrict: 'E',
      scope: {},
      templateUrl: 'response/EndExploration'
    };
  }
]);

oppia.directive('oppiaShortResponseEndExploration', [
  'oppiaHtmlEscaper', function(oppiaHtmlEscaper) {
    return {
      restrict: 'E',
      scope: {},
      templateUrl: 'shortResponse/EndExploration'
    };
  }
]);
