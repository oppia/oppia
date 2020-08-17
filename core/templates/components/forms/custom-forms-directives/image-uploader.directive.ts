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
 * @fileoverview Directive for uploading images.
 */

require('domain/utilities/url-interpolation.service.ts');
require('services/id-generation.service.ts');

interface ImageUploaderCustomScope extends ng.IScope {
  errorMessage?: string;
  onFileChanged?: (file: File, fileName?: string) => void;
  fileInputClassName?: string;
  getAllowedImageFormats?: () => string[];
}

angular.module('oppia').directive('imageUploader', [
  'IdGenerationService', 'UrlInterpolationService',
  function(IdGenerationService, UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {
        height: '@',
        onFileChanged: '=',
        errorMessage: '@',
        width: '@',
        getAllowedImageFormats: '&allowedImageFormats'
      },
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/components/forms/custom-forms-directives/' +
        'image-uploader.directive.html'),
      link: function(scope: ImageUploaderCustomScope, elt) {
        var onDragEnd = function(e) {
          e.preventDefault();
          $('.image-uploader-drop-area').removeClass(
            'image-uploader-is-active');
        };

        var validateUploadedFile = function(file, filename) {
          if (!file || !file.size || !file.type.match('image.*')) {
            return 'This file is not recognized as an image.';
          }

          var imageTypeMapping = {
            jpeg: {
              format: 'image/jpeg',
              fileType: /jp(e?)g$/,
              fileExtension: /\.jp(e?)g$/,
            },
            jpg: {
              format: 'image/jpg',
              fileType: /jp(e?)g$/,
              fileExtension: /\.jp(e?)g$/,
            },
            gif: {
              format: 'image/gif',
              fileType: /gif$/,
              fileExtension: /\.gif$/,
            },
            png: {
              format: 'image/png',
              fileType: /png$/,
              fileExtension: /\.png$/,
            },
            svg: {
              format: 'image/svg\\+xml',
              fileType: /svg\+xml$/,
              fileExtension: /\.svg$/,
            }
          };
          var imageHasInvalidFormat = true;
          for (var i = 0; i < scope.getAllowedImageFormats().length; i++) {
            var imageType = scope.getAllowedImageFormats()[i];
            if (!imageTypeMapping.hasOwnProperty(imageType)) {
              return (
                imageType + ' is not in the list of allowed image formats.');
            }
            if (file.type.match(imageTypeMapping[imageType].format)) {
              imageHasInvalidFormat = false;
              if (
                file.type.match(imageTypeMapping[imageType].fileType) &&
                !file.name.match(imageTypeMapping[imageType].fileExtension)) {
                return (
                  'This image format does not match the filename extension.');
              }
            }
          }

          if (imageHasInvalidFormat) {
            return 'This image format is not supported.';
          }

          const HUNDRED_KB_IN_BYTES = 100 * 1024;
          if (file.size > HUNDRED_KB_IN_BYTES) {
            var currentSizeInKb = (
              (file.size * 100 / HUNDRED_KB_IN_BYTES).toFixed(1) + '  KB');
            return 'The maximum allowed file size is 100 KB' +
              ' (' + currentSizeInKb + ' given).';
          }

          return null;
        };

        $(elt).bind('drop', function(e) {
          onDragEnd(e);
          var file = (<DragEvent>e.originalEvent).dataTransfer.files[0];
          scope.errorMessage = validateUploadedFile(file, file.name);
          if (!scope.errorMessage) {
            // Only fire this event if validations pass.
            scope.onFileChanged(file, file.name);
          }
          scope.$apply();
        });

        $(elt).bind('dragover', function(e) {
          e.preventDefault();
          $('.image-uploader-drop-area').addClass('image-uploader-is-active');
        });

        $(elt).bind('dragleave', onDragEnd);

        // If the user accidentally drops an image outside of the image-uploader
        // we want to prevent the browser from applying normal drag-and-drop
        // logic, which is to load the image in the browser tab.
        $(window).bind('dragover', function(e) {
          e.preventDefault();
        });

        $(window).bind('drop', function(e) {
          e.preventDefault();
        });

        // We generate a random class name to distinguish this input from
        // others in the DOM.
        scope.fileInputClassName = (
          'image-uploader-file-input' + IdGenerationService.generateNewId());
        angular.element(document).on(
          'change', '.' + scope.fileInputClassName, function(evt) {
            var file = (<HTMLInputElement>evt.currentTarget).files[0];
            var filename = (<HTMLInputElement>evt.target).value.split(
              /(\\|\/)/g).pop();
            scope.errorMessage = validateUploadedFile(file, filename);
            if (!scope.errorMessage) {
              // Only fire this event if validations pass.
              scope.onFileChanged(file, filename);
            }
            scope.$apply();
          }
        );
      }
    };
  }
]);
