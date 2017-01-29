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
 * @fileoverview Summary tile for collections.
 */

oppia.constant(
  'COLLECTION_VIEWER_URL', '/collection/<collection_id>');
oppia.constant(
  'COLLECTION_EDITOR_URL', '/collection_editor/create/<collection_id>');

oppia.directive('collectionSummaryTile', [function() {
  return {
    restrict: 'E',
    scope: {
      getCollectionId: '&collectionId',
      getCollectionTitle: '&collectionTitle',
      getObjective: '&objective',
      getNodeCount: '&nodeCount',
      getLastUpdatedMsec: '&lastUpdatedMsec',
      getThumbnailIconUrl: '&thumbnailIconUrl',
      getThumbnailBgColor: '&thumbnailBgColor',
      isLinkedToEditorPage: '=?isLinkedToEditorPage'
    },
    templateUrl: 'summaryTile/collection',
    controller: [
      '$scope', 'oppiaDatetimeFormatter', 'UrlInterpolationService',
      'COLLECTION_VIEWER_URL', 'COLLECTION_EDITOR_URL', function($scope,
      oppiaDatetimeFormatter, UrlInterpolationService, COLLECTION_VIEWER_URL,
      COLLECTION_EDITOR_URL) {
        $scope.DEFAULT_EMPTY_TITLE = 'Untitled';
        var targetUrl = (
          $scope.isLinkedToEditorPage ?
           COLLECTION_EDITOR_URL : COLLECTION_VIEWER_URL);

        $scope.getLastUpdatedDatetime = function() {
          return oppiaDatetimeFormatter.getLocaleAbbreviatedDatetimeString(
            $scope.getLastUpdatedMsec());
        };

        $scope.getCollectionLink = function() {
          return UrlInterpolationService.interpolateUrl(
            targetUrl, {
              collection_id: $scope.getCollectionId()
            }
          );
        };
      }
    ]
  };
}]);
