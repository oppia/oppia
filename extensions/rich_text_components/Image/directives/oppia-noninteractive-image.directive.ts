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

require('domain/utilities/url-interpolation.service.ts');
require('pages/exploration-player-page/services/image-preloader.service.ts');
require('services/assets-backend-api.service.ts');
require('services/context.service.ts');
require('services/html-escaper.service.ts');
require('services/image-local-storage.service.ts');

angular.module('oppia').directive('oppiaNoninteractiveImage', [
  'AssetsBackendApiService', 'ContextService',
  'HtmlEscaperService', 'ImageLocalStorageService', 'ImagePreloaderService',
  'UrlInterpolationService', 'ENTITY_TYPE',
  'IMAGE_SAVE_DESTINATION_LOCAL_STORAGE', 'LOADING_INDICATOR_URL',
  function(
      AssetsBackendApiService, ContextService,
      HtmlEscaperService, ImageLocalStorageService, ImagePreloaderService,
      UrlInterpolationService, ENTITY_TYPE,
      IMAGE_SAVE_DESTINATION_LOCAL_STORAGE, LOADING_INDICATOR_URL) {
    return {
      restrict: 'E',
      scope: {},
      bindToController: {},
      template: require('./image.directive.html'),
      controllerAs: '$ctrl',
      controller: ['$attrs', function($attrs) {
        var ctrl = this;
        ctrl.$onInit = function() {
          ctrl.filepath = HtmlEscaperService.escapedJsonToObj(
            $attrs.filepathWithValue);
          ctrl.imageUrl = '';
          ctrl.loadingIndicatorUrl = UrlInterpolationService.getStaticImageUrl(
            LOADING_INDICATOR_URL);
          ctrl.isLoadingIndicatorShown = false;
          ctrl.isTryAgainShown = false;
          ctrl.dimensions = (
            ImagePreloaderService.getDimensionsOfImage(ctrl.filepath));
          ctrl.imageContainerStyle = {
            height: ctrl.dimensions.height + 'px',
            width: ctrl.dimensions.width + 'px'
          };

          // If viewing a concept card in the exploration player, don't use the
          // preloader service. Since, in that service, the image file names are
          // extracted from the state contents to be preloaded, but when
          // viewing a concept, the names are not available until the link is
          // clicked, at which point an API call is done to get the skill
          // details. So, the image file name will not be available to the
          // preloader service beforehand.
          if (
            ImagePreloaderService.inExplorationPlayer() &&
            !ContextService.getEntityType() === ENTITY_TYPE.SKILL) {
            ctrl.isLoadingIndicatorShown = true;
            // For aligning the gif to the center of it's container
            var loadingIndicatorSize = (
              (ctrl.dimensions.height < 124) ? 24 : 120);
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
            // This is the case when user is not in the exploration player. We
            // don't have loading indicator or try again for showing images in
            // this case. So we directly assign the url to the imageUrl.
            try {
              if (
                ContextService.getImageSaveDestination() ===
                IMAGE_SAVE_DESTINATION_LOCAL_STORAGE) {
                ctrl.imageUrl = ImageLocalStorageService.getObjectUrlForImage(
                  ctrl.filepath);
              } else {
                ctrl.imageUrl = AssetsBackendApiService.getImageUrlForPreview(
                  ContextService.getEntityType(), ContextService.getEntityId(),
                  ctrl.filepath);
              }
            } catch (e) {
              var additionalInfo = (
                '\nEntity type: ' + ContextService.getEntityType() +
                '\nEntity ID: ' + ContextService.getEntityId() +
                '\nFilepath: ' + ctrl.filepath);
              e.message += additionalInfo;
              throw e;
            }
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
        };
      }]
    };
  }
]);
