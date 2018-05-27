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
        ImagePreloaderService.addToRecentlyRequestedImageFilenames(
          $scope.filepath);
        $scope.imageUrl = '';

        var displayFromCache = function(filename) {
          AssetsBackendApiService.loadImage(
            ExplorationContextService.getExplorationId(), filename)
            .then(function(loadedImageFile) {
              var objectUrl = URL.createObjectURL(loadedImageFile.data);
              $scope.imageUrl = objectUrl;
              ImagePreloaderService.removeFromRecentlyRequestedImageFilenames(
                filename);
          });
        };

        /**
        * Called when an image file finishes loading.
        * @param {string} imageFilename - Filename of the image file that
        *                                 finished loading.
        */

        var onFinishedLoadingImage = function(imageFilename) {
          var recentlyRequestedImageFilenames = (
            ImagePreloaderService.getRecentlyRequestedImageFilenames());
          if(recentlyRequestedImageFilenames.indexOf(imageFilename) !== -1) {
            displayFromCache(imageFilename);
          }
        };

        var filename = $scope.filepath;
        // This will work for the cases whose images have been requested by the
        // preloader but haven't been downloaded till now.
        ImagePreloaderService.setImageLoadedCallback(onFinishedLoadingImage,
          filename);
        // If the image is preloaded, i.e already there in the cache then
        // display from the cache
        if (AssetsBackendApiService.isCached($scope.filepath)) {
          displayFromCache($scope.filepath);
        }
        // else [TODO] Display a loading indicator instead. For now, if the
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
