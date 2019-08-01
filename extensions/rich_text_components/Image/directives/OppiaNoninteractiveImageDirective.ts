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
 * @fileoverview Directive for the Image rich-text component.
 *
 * IMPORTANT NOTE: The naming convention for customization args that are passed
 * into the directive is: the name of the parameter, followed by 'With',
 * followed by the name of the arg.
 */

require('domain/utilities/UrlInterpolationService.ts');
require('pages/exploration-player-page/services/image-preloader.service.ts');
require('services/AssetsBackendApiService.ts');
require('services/ContextService.ts');
require('services/HtmlEscaperService.ts');

angular.module('oppia').directive('oppiaNoninteractiveImage', [
  'AssetsBackendApiService', 'ContextService',
  'HtmlEscaperService', 'ImagePreloaderService',
  'UrlInterpolationService', 'LOADING_INDICATOR_URL',
  function(
      AssetsBackendApiService, ContextService,
      HtmlEscaperService, ImagePreloaderService,
      UrlInterpolationService, LOADING_INDICATOR_URL) {
    return {
      restrict: 'E',
      scope: {},
      bindToController: {},
      templateUrl: UrlInterpolationService.getExtensionResourceUrl(
        '/rich_text_components/Image/directives/image_directive.html'),
      controllerAs: '$ctrl',
      controller: ['$attrs', function($attrs) {
        var ctrl = this;
        ctrl.filepath = HtmlEscaperService.escapedJsonToObj(
          $attrs.filepathWithValue);
        ctrl.imageUrl = '';
        ctrl.loadingIndicatorUrl = UrlInterpolationService.getStaticImageUrl(
          LOADING_INDICATOR_URL);
        ctrl.isLoadingIndicatorShown = false;
        ctrl.isTryAgainShown = false;

        if (ImagePreloaderService.inExplorationPlayer()) {
          ctrl.isLoadingIndicatorShown = true;
          ctrl.dimensions = (
            ImagePreloaderService.getDimensionsOfImage(ctrl.filepath));
          // For aligning the gif to the center of it's container
          var loadingIndicatorSize = (
            (ctrl.dimensions.height < 124) ? 24 : 120);
          ctrl.imageContainerStyle = {
            height: ctrl.dimensions.height + 'px'
          };
          ctrl.loadingIndicatorStyle = {
            height: loadingIndicatorSize + 'px',
            width: loadingIndicatorSize + 'px'
          };

          ctrl.loadImage = function() {
            ctrl.isLoadingIndicatorShown = true;
            ctrl.isTryAgainShown = false;
            ImagePreloaderService.getImageUrl(ctrl.filepath)
              .then(function(objectUrl) {
                ctrl.isTryAgainShown = false;
                ctrl.isLoadingIndicatorShown = false;
                ctrl.imageUrl = objectUrl;
              }, function() {
                ctrl.isTryAgainShown = true;
                ctrl.isLoadingIndicatorShown = false;
              });
          };
          ctrl.loadImage();
        } else {
          // This is the case when user is in exploration editor or in
          // preview mode. We don't have loading indicator or try again for
          // showing images in the exploration editor or in preview mode. So
          // we directly assign the url to the imageUrl.
          AssetsBackendApiService.getImageUrlForPreviewAsync(
            ContextService.getExplorationId(), ctrl.filepath).then(
            function(url) {
              ctrl.imageUrl = url;
            }
          );
        }

        ctrl.imageCaption = '';
        if ($attrs.captionWithValue) {
          ctrl.imageCaption = HtmlEscaperService.escapedJsonToObj(
            $attrs.captionWithValue);
        }
        ctrl.imageAltText = '';
        if ($attrs.altWithValue) {
          ctrl.imageAltText = HtmlEscaperService.escapedJsonToObj(
            $attrs.altWithValue);
        }
      }]
    };
  }
]);
