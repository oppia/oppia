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
 * @fileoverview Component for previewing thumbnails.
 */

require('services/image-upload-helper.service.ts');
require('services/context.service.ts');

angular.module('oppia').component('previewThumbnail', {
  bindings: {
    getBgColor: '&bgColor',
    getFilename: '&filename',
    getName: '&name',
    getDescription: '&description',
    getPreviewFooter: '&previewFooter',
    getThumbnailBgColor: '&thumbnailBgColor',
    getPreviewTitle: '&previewTitle',
  },
  template: require('./preview-thumbnail.component.html'),
  controller: [
    'ContextService', 'ImageUploadHelperService',
    function(ContextService, ImageUploadHelperService) {
      var ctrl = this;
      ctrl.$onInit = function() {
        ctrl.editableThumbnailDataUrl = (
          ImageUploadHelperService.getTrustedResourceUrlForThumbnailFilename(
            ctrl.getFilename(),
            ContextService.getEntityType(),
            ContextService.getEntityId()));
      };
    }]
});
