// Copyright 2020 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Component for the Svgdiagram rich-text component.
 *
 * IMPORTANT NOTE: The naming convention for customization args that are passed
 * into the component is: the name of the parameter, followed by 'With',
 * followed by the name of the arg.
 */

require('pages/exploration-player-page/services/image-preloader.service.ts');
require('services/assets-backend-api.service.ts');
require('services/context.service.ts');
require('services/html-escaper.service.ts');
require('services/image-local-storage.service.ts');

angular.module('oppia').component('oppiaNoninteractiveSvgdiagram', {
  template: require('./svgdiagram.component.html'),
  controller: [
    '$attrs', 'AssetsBackendApiService', 'ContextService',
    'HtmlEscaperService', 'ImageLocalStorageService',
    'ImagePreloaderService', 'IMAGE_SAVE_DESTINATION_LOCAL_STORAGE',
    function($attrs, AssetsBackendApiService, ContextService,
        HtmlEscaperService, ImageLocalStorageService,
        ImagePreloaderService, IMAGE_SAVE_DESTINATION_LOCAL_STORAGE) {
      var ctrl = this;
      ctrl.$onInit = function() {
        ctrl.filename = HtmlEscaperService.escapedJsonToObj(
          $attrs.svgFilenameWithValue);
        ctrl.dimensions = (
          ImagePreloaderService.getDimensionsOfImage(ctrl.filename));
        ctrl.svgContainerStyle = {
          height: ctrl.dimensions.height + 'px',
          width: ctrl.dimensions.width + 'px'
        };
        if (
          ContextService.getImageSaveDestination() ===
          IMAGE_SAVE_DESTINATION_LOCAL_STORAGE) {
          ctrl.svgUrl = ImageLocalStorageService.getObjectUrlForImage(
            ctrl.filename);
        } else {
          ctrl.svgUrl = AssetsBackendApiService.getImageUrlForPreview(
            ContextService.getEntityType(), ContextService.getEntityId(),
            ctrl.filename);
        }

        ctrl.svgAltText = '';
        if ($attrs.altWithValue) {
          ctrl.svgAltText = HtmlEscaperService.escapedJsonToObj(
            $attrs.altWithValue);
        }
      };
    }
  ]
});
