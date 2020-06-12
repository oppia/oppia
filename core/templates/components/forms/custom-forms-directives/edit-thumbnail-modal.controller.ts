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
 * @fileoverview Controller for edit thumbnail modal.
 */

require('services/image-upload-helper.service.ts');

angular.module('oppia').controller('EditThumbnailModalController', [
  '$scope', '$timeout', '$uibModalInstance', 'ImageUploadHelperService',
  'allowedBgColors', 'aspectRatio', 'dimensions', 'getPreviewDescription',
  'getPreviewDescriptionBgColor', 'getPreviewFooter', 'getPreviewTitle',
  'openInUploadMode', 'tempBgColor', 'uploadedImage', 'uploadedImageMimeType',
  function($scope, $timeout, $uibModalInstance, ImageUploadHelperService,
      allowedBgColors, aspectRatio, dimensions, getPreviewDescription,
      getPreviewDescriptionBgColor, getPreviewFooter, getPreviewTitle,
      openInUploadMode, tempBgColor, uploadedImage, uploadedImageMimeType) {
    $scope.uploadedImage = uploadedImage;
    $scope.invalidImageWarningIsShown = false;
    $scope.invalidTagsAndAttributes = {
      tags: [],
      attrs: []
    };

    $scope.allowedBgColors = allowedBgColors;
    $scope.aspectRatio = aspectRatio;
    $scope.getPreviewDescription = getPreviewDescription;
    $scope.getPreviewDescriptionBgColor = (
      getPreviewDescriptionBgColor);
    $scope.getPreviewFooter = getPreviewFooter;
    $scope.getPreviewTitle = getPreviewTitle;

    var setImageDimensions = function(height, width) {
      dimensions = {
        height: Math.round(height),
        width: Math.round(width)
      };
    };

    var isUploadedImageSvg = function() {
      return uploadedImageMimeType === 'image/svg+xml';
    };

    $scope.updateBackgroundColor = function(color) {
      var thumbnailImageElement = (
        <HTMLElement>document.querySelector(
          '.oppia-thumbnail-image'));
      thumbnailImageElement.style.background = color;
      tempBgColor = color;
    };

    $scope.onFileChanged = function(file) {
      uploadedImageMimeType = file.type;
      $scope.invalidImageWarningIsShown = false;
      $scope.invalidTagsAndAttributes = {
        tags: [],
        attrs: []
      };
      if (isUploadedImageSvg()) {
        $('.oppia-thumbnail-uploader').fadeOut(function() {
          var reader = new FileReader();
          reader.onload = function(e) {
            var imgSrc = <string>((<FileReader>e.target).result);
            $scope.$apply(function() {
              $scope.uploadedImage = (
                (<FileReader>e.target).result);
            });
            $scope.updateBackgroundColor(tempBgColor);
            var img = new Image();
            img.onload = function() {
              // Setting a default height of 300px and width of
              // 150px since most browsers use these dimensions
              // for SVG files that do not have an explicit
              // height and width defined.
              setImageDimensions(
                img.naturalHeight || 150,
                img.naturalWidth || 300);
            };
            img.src = imgSrc;
            $scope.invalidTagsAndAttributes = (
              ImageUploadHelperService.getInvalidSvgTagsAndAttrs(
                imgSrc));
            var tags = $scope.invalidTagsAndAttributes.tags;
            var attrs = $scope.invalidTagsAndAttributes.attrs;
            if (tags.length > 0 || attrs.length > 0) {
              $scope.reset();
            }
          };
          reader.readAsDataURL(file);
          $timeout(function() {
            $('.oppia-thumbnail-uploader').fadeIn();
          }, 100);
        });
      } else {
        $scope.reset();
        $scope.invalidImageWarningIsShown = true;
      }
    };

    $scope.reset = function() {
      $scope.uploadedImage = null;
      openInUploadMode = true;
    };

    $scope.onInvalidImageLoaded = function() {
      $scope.uploadedImage = null;
      $scope.invalidImageWarningIsShown = true;
    };

    $scope.confirm = function() {
      $uibModalInstance.close({
        newThumbnailDataUrl: $scope.uploadedImage,
        newBgColor: tempBgColor,
        openInUploadMode: openInUploadMode,
        dimensions: dimensions
      });
    };

    $scope.cancel = function() {
      $uibModalInstance.dismiss('cancel');
    };

    if (uploadedImage) {
      $uibModalInstance.rendered.then(() => {
        openInUploadMode = false;
        $scope.updateBackgroundColor(tempBgColor);
      });
    }
  }
]);
