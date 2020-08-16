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
 * @fileoverview Directive for the Math rich-text component.
 *
 * IMPORTANT NOTE: The naming convention for customization args that are passed
 * into the directive is: the name of the parameter, followed by 'With',
 * followed by the name of the arg.
 */

require('pages/exploration-player-page/services/image-preloader.service.ts');
require('services/assets-backend-api.service.ts');
require('services/context.service.ts');
require('services/html-escaper.service.ts');
require('services/image-local-storage.service.ts');

angular.module('oppia').directive('oppiaNoninteractiveMath', [
  'AssetsBackendApiService', 'ContextService', 'HtmlEscaperService',
  'ImageLocalStorageService', 'ImagePreloaderService', 'ENTITY_TYPE',
  'IMAGE_SAVE_DESTINATION_LOCAL_STORAGE',
  function(
      AssetsBackendApiService, ContextService, HtmlEscaperService,
      ImageLocalStorageService, ImagePreloaderService, ENTITY_TYPE,
      IMAGE_SAVE_DESTINATION_LOCAL_STORAGE) {
    return {
      restrict: 'E',
      scope: {},
      bindToController: {},
      template: require('./math.directive.html'),
      controllerAs: '$ctrl',
      controller: ['$attrs', function($attrs) {
        var ctrl = this;
        ctrl.$onInit = function() {
          var mathExpressionContent = HtmlEscaperService.escapedJsonToObj(
            $attrs.mathContentWithValue);
          if (mathExpressionContent.hasOwnProperty('raw_latex')) {
            var svgFilename = mathExpressionContent.svg_filename;
            var dimensions = ImagePreloaderService.getDimensionsOfMathSvgs(
              svgFilename);
            ctrl.imageContainerStyle = {
              height: dimensions.height + 'ex',
              width: dimensions.width + 'ex',
              'vertical-align': '-' + dimensions.verticalPadding + 'ex'
            };
          }
          // If viewing a concept card in the exploration player, don't use the
          // preloader service. Since, in that service, the image file names are
          // extracted from the state contents to be preloaded, but when
          // viewing a concept, the names are not available until the link is
          // clicked, at which point an API call is done to get the skill
          // details. So, the image file name will not be available to the
          // preloader service beforehand.
          if (
            ImagePreloaderService.inExplorationPlayer() &&
            !(ContextService.getEntityType() === ENTITY_TYPE.SKILL)) {
            ImagePreloaderService.getImageUrl(svgFilename)
              .then(function(objectUrl) {
                ctrl.imageUrl = objectUrl;
              });
          } else {
            // This is the case when user is not in the exploration player. We
            // don't pre-load the images in this case. So we directly assign
            // the url to the imageUrl.
            try {
              if (
                ContextService.getImageSaveDestination() ===
                IMAGE_SAVE_DESTINATION_LOCAL_STORAGE) {
                ctrl.imageUrl = ImageLocalStorageService.getObjectUrlForImage(
                  svgFilename);
              } else {
                ctrl.imageUrl = AssetsBackendApiService.getImageUrlForPreview(
                  ContextService.getEntityType(), ContextService.getEntityId(),
                  svgFilename);
              }
            } catch (e) {
              var additionalInfo = (
                '\nEntity type: ' + ContextService.getEntityType() +
                '\nEntity ID: ' + ContextService.getEntityId() +
                '\nFilepath: ' + svgFilename);
              e.message += additionalInfo;
              throw e;
            }
          }
        };
      }]
    };
  }
]);
