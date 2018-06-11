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
  'UrlInterpolationService', 'ImagePreloaderService', 'LOADING_INDICATOR_URL',
  function(
      $rootScope, $sce, HtmlEscaperService, ExplorationContextService,
      UrlInterpolationService, ImagePreloaderService, LOADING_INDICATOR_URL) {
    return {
      restrict: 'E',
      scope: {},
      templateUrl: UrlInterpolationService.getExtensionResourceUrl(
        '/rich_text_components/Image/directives/image_directive.html'),
      controller: ['$scope', '$attrs', function($scope, $attrs) {
        $scope.filepath = HtmlEscaperService.escapedJsonToObj(
          $attrs.filepathWithValue);
        $scope.imageUrl = '';
        $scope.loadingIndicatorUrl = UrlInterpolationService.getStaticImageUrl(
          LOADING_INDICATOR_URL);
        $scope.isLoadingIndicatorShown = false;
        if (ImagePreloaderService.inExplorationPlayer()) {
          $scope.isLoadingIndicatorShown = true;
          $scope.dimensions = (
            ImagePreloaderService.getDimensionsOfImage($scope.filepath.name));
          // For aligning the gif to the center of it's container
          var loadingIndicatorSize = 120;
          if ($scope.dimensions.height < 124) {
            loadingIndicatorSize = 24;
          }
          var paddingTop = Math.max(0, (($scope.dimensions.height * 0.5) -
            (loadingIndicatorSize * 0.5)));
          $scope.loadingIndicatorContainerStyle =
          {
            'padding-top': paddingTop + 'px',
            height: $scope.dimensions.height + 'px'
          };
          $scope.loadingIndicatorStyle = {
            height: loadingIndicatorSize + 'px',
            width: loadingIndicatorSize + 'px'
          };
        }

        ImagePreloaderService.getImageUrl($scope.filepath.name)
          .then(function(objectUrl) {
            $scope.isLoadingIndicatorShown = false;
            $scope.imageUrl = objectUrl;
          });

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
