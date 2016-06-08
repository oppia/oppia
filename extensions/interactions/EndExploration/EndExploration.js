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
oppia.directive('oppiaInteractiveEndExploration', [function() {
  return {
    restrict: 'E',
    scope: {},
    templateUrl: 'interaction/EndExploration',
    controller: [
      '$scope', '$http', '$attrs', '$q', 'urlService',
      'explorationContextService', 'PAGE_CONTEXT', 'EDITOR_TAB_CONTEXT',
      'oppiaHtmlEscaper',
      function(
          $scope, $http, $attrs, $q, urlService,
          explorationContextService, PAGE_CONTEXT, EDITOR_TAB_CONTEXT,
          oppiaHtmlEscaper) {
        var authorRecommendedExplorationIds = (
          oppiaHtmlEscaper.escapedJsonToObj(
            $attrs.recommendedExplorationIdsWithValue));

        $scope.isIframed = urlService.isIframed();
        $scope.isInEditorPage = (
          explorationContextService.getPageContext() === PAGE_CONTEXT.EDITOR);
        $scope.isInEditorPreviewMode = $scope.isInEditorPage && (
          explorationContextService.getEditorTabContext() ===
            EDITOR_TAB_CONTEXT.PREVIEW);
        $scope.isInEditorMainTab = $scope.isInEditorPage && (
          explorationContextService.getEditorTabContext() ===
            EDITOR_TAB_CONTEXT.EDITOR);

        $scope.collectionId = GLOBALS.collectionId;
        $scope.getCollectionTitle = function() {
          return GLOBALS.collectionTitle;
        };

        $scope.errorMessage = '';

        if ($scope.isInEditorPage) {
          // Display a message if any author-recommended explorations are
          // invalid.
          var explorationId = explorationContextService.getExplorationId();
          $http.get('/explorationsummarieshandler/data', {
            params: {
              stringified_exp_ids: JSON.stringify(
                authorRecommendedExplorationIds)
            }
          }).then(function(response) {
            var data = response.data;
            var foundExpIds = [];
            data.summaries.map(function(expSummary) {
              foundExpIds.push(expSummary.id);
            });

            var missingExpIds = [];
            authorRecommendedExplorationIds.forEach(function(expId) {
              if (foundExpIds.indexOf(expId) === -1) {
                missingExpIds.push(expId);
              }
            });

            if (missingExpIds.length === 0) {
              $scope.errorMessage = '';
            } else {
              var listOfIds = missingExpIds.join('", "');
              $scope.errorMessage = (
                'Warning: exploration(s) with the IDs "' + listOfIds +
                '" will ' + 'not be shown as recommendations because they ' +
                'either do not exist, or are not publicly viewable.');
            }
          });
        }
      }
    ]
  };
}]);

oppia.directive('oppiaResponseEndExploration', [function() {
  return {
    restrict: 'E',
    scope: {},
    templateUrl: 'response/EndExploration'
  };
}]);

oppia.directive('oppiaShortResponseEndExploration', [function() {
  return {
    restrict: 'E',
    scope: {},
    templateUrl: 'shortResponse/EndExploration'
  };
}]);
