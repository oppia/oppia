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

import Cropper from 'cropperjs';

require(
  'components/common-layout-directives/common-elements/' +
  'alert-message.directive.ts');
require('cropperjs/dist/cropper.min.css');
require('domain/utilities/url-interpolation.service.ts');
require('pages/exploration-player-page/services/image-preloader.service.ts');

require('services/context.service.ts');
require('services/csrf-token.service.ts');
require('services/image-upload-helper.service.ts');

angular.module('oppia').directive('thumbnailUploader', [
  'UrlInterpolationService', function(UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {
        disabled: '=',
        getFilename: '&filename',
        updateFilename: '=',
        getBgColor: '&bgColor',
        updateBgColor: '=',
        getAllowedColors: '&allowedColors'
      },
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/components/forms/custom-forms-directives/' +
        'thumbnail-uploader.directive.html'),
      controller: ['$scope', '$uibModal',
        'AlertsService', 'ContextService', 'CsrfTokenService',
        'ImageUploadHelperService',
        function($scope, $uibModal,
            AlertsService, ContextService, CsrfTokenService,
            ImageUploadHelperService) {
          var placeholderImageUrl = '/icons/story-image-icon.png';
          var uploadedImage = null;
          $scope.imageContainerStyle = {};
          if (!$scope.getFilename()) {
            $scope.editableThumbnailDataUrl = (
              UrlInterpolationService.getStaticImageUrl(
                placeholderImageUrl));
          } else {
            $scope.editableThumbnailDataUrl = (
              ImageUploadHelperService
                .getTrustedResourceUrlForThumbnailFilename(
                  $scope.getFilename(),
                  ContextService.getEntityType(),
                  ContextService.getEntityId()));
            uploadedImage = $scope.editableThumbnailDataUrl;
            $scope.imageContainerStyle = {
              background: $scope.getBgColor()
            };
          }
          $scope.showEditThumbnailModal = function() {
            if ($scope.disabled) {
              return;
            }
            var openInUploadMode = true;
            var tempBgColor = (
              $scope.imageContainerStyle.background || $scope.getBgColor());
            var tempImageName = '';
            var uploadedImageMimeType = '';
            var dimensions = {
              height: 0,
              width: 0
            };
            var allowedColors = $scope.getAllowedColors();

            var saveThumbnailImageData = function(imageURI) {
              let resampledFile = null;
              resampledFile = (
                ImageUploadHelperService.convertImageDataToImageFile(
                  imageURI));
              if (resampledFile === null) {
                AlertsService.addWarning('Could not get resampled file.');
                return;
              }
              postImageToServer(resampledFile);
            };

            var postImageToServer = function(resampledFile) {
              let form = new FormData();
              form.append('image', resampledFile);
              form.append('payload', JSON.stringify({
                filename: tempImageName,
                filename_prefix: 'thumbnail'
              }));
              var imageUploadUrlTemplate = '/createhandler/imageupload/' +
                '<entity_type>/<entity_id>';
              CsrfTokenService.getTokenAsync().then(function(token) {
                form.append('csrf_token', token);
                $.ajax({
                  url: UrlInterpolationService.interpolateUrl(
                    imageUploadUrlTemplate, {
                      entity_type: ContextService.getEntityType(),
                      entity_id: ContextService.getEntityId()
                    }
                  ),
                  data: form,
                  processData: false,
                  contentType: false,
                  type: 'POST',
                  dataFilter: function(data) {
                    // Remove the XSSI prefix.
                    var transformedData = data.substring(5);
                    return JSON.parse(transformedData);
                  },
                  dataType: 'text'
                }).done(function(data) {
                  $scope.editableThumbnailDataUrl = (
                    ImageUploadHelperService
                      .getTrustedResourceUrlForThumbnailFilename(
                        data.filename, ContextService.getEntityType(),
                        ContextService.getEntityId()));
                }).fail(function(data) {
                  // Remove the XSSI prefix.
                  var transformedData = data.responseText.substring(5);
                  var parsedResponse = JSON.parse(transformedData);
                  AlertsService.addWarning(
                    parsedResponse.error || 'Error communicating with server.');
                });
              });
            };
            $uibModal.open({
              templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
                '/components/forms/custom-forms-directives/' +
                'edit-thumbnail-modal.template.html'),
              size: 'lg',
              backdrop: true,
              controller: [
                '$scope', '$timeout', '$uibModalInstance',
                function($scope, $timeout, $uibModalInstance) {
                  $scope.uploadedImage = uploadedImage;
                  $scope.invalidImageWarningIsShown = false;
                  $scope.invalidAspectRatioWarningIsShown = false;
                  $scope.imageSize = 0.5;
                  let cropper = null;

                  $scope.allowedColors = allowedColors;

                  var setImageDimensions = function() {
                    dimensions = {
                      height: Math.round(cropper.imageData.height),
                      width: Math.round(cropper.imageData.width)
                    };
                  };

                  var isUploadedImageSvg = function() {
                    return uploadedImageMimeType === 'image/svg+xml';
                  };

                  $scope.updateBackgroundColor = function(color) {
                    var cropperContainerElement = (
                      <HTMLElement>document.querySelector(
                        '.cropper-container'));
                    cropperContainerElement.style.background = color;
                    tempBgColor = color;
                  };

                  var initialiseCropper = function() {
                    let thumbnailImage = (
                      <HTMLImageElement>document.getElementById(
                        'croppable-thumbnail'));
                    let cropperAspectRatio = 16 / 9;
                    cropper = new Cropper(thumbnailImage, {
                      minContainerHeight: 405,
                      minContainerWidth: 720,
                      minCropBoxWidth: 180,
                      aspectRatio: cropperAspectRatio,
                      zoomOnTouch: false,
                      zoomOnWheel: false
                    });
                    document.getElementById(
                      'croppable-thumbnail').addEventListener('ready', () => {
                      let imageAspectRatio = (
                        cropper.imageData.aspectRatio.toFixed(2));
                      if (imageAspectRatio !== (
                        cropperAspectRatio.toFixed(2))) {
                        $scope.uploadedImage = null;
                        $scope.invalidAspectRatioWarningIsShown = true;
                      }
                      cropper.zoomTo($scope.imageSize);
                      cropper.clear();
                      cropper.setDragMode('none');
                      if ($scope.allowedColors) {
                        $scope.updateBackgroundColor(tempBgColor);
                      }
                    });
                    document.getElementById(
                      'croppable-thumbnail').addEventListener('crop', () => {
                      cropper.clear();
                    });
                  };
                  $scope.adjustImageSize = function() {
                    cropper.zoomTo($scope.imageSize);
                  };
                  $scope.onFileChanged = function(file) {
                    uploadedImageMimeType = file.type;
                    if (isUploadedImageSvg()) {
                      $('.oppia-thumbnail-uploader').fadeOut(function() {
                        $scope.invalidImageWarningIsShown = false;
                        $scope.invalidAspectRatioWarningIsShown = false;
                        var reader = new FileReader();
                        reader.onload = function(e) {
                          $scope.$apply(function() {
                            $scope.uploadedImage = (
                              (<FileReader>e.target).result);
                          });
                          initialiseCropper();
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
                    setImageDimensions();
                    $uibModalInstance.close({
                      newThumbnailDataUrl: $scope.uploadedImage,
                      newBgColor: tempBgColor
                    });
                  };

                  $scope.cancel = function() {
                    $uibModalInstance.dismiss('cancel');
                  };

                  if (uploadedImage) {
                    $uibModalInstance.rendered.then(() => {
                      initialiseCropper();
                      openInUploadMode = false;
                    });
                  }
                }
              ]
            }).result.then(function(data) {
              if (openInUploadMode) {
                tempImageName = (
                  ImageUploadHelperService.generateImageFilename(
                    dimensions.height, dimensions.width, 'svg'));
                uploadedImage = data.newThumbnailDataUrl;
                $scope.editableThumbnailDataUrl = data.newThumbnailDataUrl;
                $scope.updateFilename(tempImageName);
                saveThumbnailImageData(data.newThumbnailDataUrl);
              }
              if (data.newBgColor !== $scope.getBgColor()) {
                $scope.updateBgColor(data.newBgColor);
              }
              $scope.imageContainerStyle.background = data.newBgColor;
            }, function() {
              // Note to developers:
              // This callback is triggered when the Cancel button is clicked.
              // No further action is needed.
            });
          };
        }]
    };
  }
]);
