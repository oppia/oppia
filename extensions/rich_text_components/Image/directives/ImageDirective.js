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
 * Directive for the Image rich-text component.
 *
 * IMPORTANT NOTE: The naming convention for customization args that are passed
 * into the directive is: the name of the parameter, followed by 'With',
 * followed by the name of the arg.
 */
oppia.directive('oppiaNoninteractiveImage', [
  '$rootScope', '$sce', 'HtmlEscaperService', 'ExplorationContextService',
  'UrlInterpolationService', 'ImagePreloaderService',
  'AssetsBackendApiService', function(
      $rootScope, $sce, HtmlEscaperService, ExplorationContextService,
      UrlInterpolationService, ImagePreloaderService,
      AssetsBackendApiService) {
    return {
      restrict: 'E',
      scope: {},
      templateUrl: UrlInterpolationService.getExtensionResourceUrl(
        '/rich_text_components/Image/directives/image_directive.html'),
      controller: ['$scope', '$attrs', function($scope, $attrs) {
        $scope.filepath = HtmlEscaperService.escapedJsonToObj(
          $attrs.filepathWithValue);
        $scope.imageUrl = '';

        ImagePreloaderService.getImageUrl($scope.filepath
        ).then(function(objectUrl) {
          $scope.imageUrl = objectUrl;
        });
        // [TODO] Display a loading indicator instead. For now, if the
        // image is not there in the cache alternate text will be shown

        $scope.imageCaption = '';
        if ($attrs.captionWithValue) {
          $scope.imageCaption = HtmlEscaperService.escapedJsonToObj(
            $attrs.captionWithValue);
        }
        $scope.imageAltText = '';
        if ($attrs.altWithValue) {
          $scope.imageAltText = HtmlEscaperService.escapedJsonToObj(
            $attrs.altWithValue);
        }
      }]
    };
  }
]);
