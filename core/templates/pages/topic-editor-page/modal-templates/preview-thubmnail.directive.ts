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
 * @fileoverview Directive for uploading images.
 */

require('services/image-upload-helper.service.ts');
require('services/context.service.ts');

angular.module('oppia').directive('previewThumbnail', [
  'UrlInterpolationService', function(UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {
        getBgColor: '&bgColor',
        getFilename: '&filename',
        getName: '&name',
        getDescription: '&description',
        getPreviewFooter: '&previewFooter',
        getThumbnailBgColor: '&thumbnailBgColor',
        getPreviewTitle: '&previewTitle',
      },
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/pages/topic-editor-page/modal-templates/' +
                'preview-thumbnail.directive.html'),
      controller: [
        '$rootScope', '$scope', 'ContextService', 'ImageUploadHelperService',
        function($rootScope, $scope, ContextService, ImageUploadHelperService) {
          $scope.editableThumbnailDataUrl = (
            ImageUploadHelperService
              .getTrustedResourceUrlForThumbnailFilename(
                $scope.getFilename(),
                ContextService.getEntityType(),
                ContextService.getEntityId()));
        }]
    };
  }
]);
