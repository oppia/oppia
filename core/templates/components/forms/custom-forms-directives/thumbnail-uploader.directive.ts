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

require(
  'components/common-layout-directives/common-elements/' +
  'alert-message.directive.ts');

require('domain/utilities/url-interpolation.service.ts');
require('pages/exploration-player-page/services/image-preloader.service.ts');
require('services/alerts.service.ts');
require('services/context.service.ts');
require('services/csrf-token.service.ts');
require('services/image-upload-helper.service.ts');

angular.module('oppia').directive('thumbnailUploader', [
  'UrlInterpolationService', function(UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {
        disabled: '=',
        getAllowedBgColors: '&allowedBgColors',
        getAspectRatio: '&aspectRatio',
        getBgColor: '&bgColor',
        getFilename: '&filename',
        getPreviewDescription: '&previewDescription',
        getPreviewDescriptionBgColor: '&previewDescriptionBgColor',
        getPreviewFooter: '&previewFooter',
        getPreviewTitle: '&previewTitle',
        updateBgColor: '=',
        updateFilename: '='
      },
      templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
        '/components/forms/custom-forms-directives/' +
        'thumbnail-uploader.directive.html'),
      controller: ['$rootScope', '$scope', '$uibModal',
        'AlertsService', 'ContextService', 'CsrfTokenService',
        'ImageUploadHelperService',
        function($rootScope, $scope, $uibModal,
            AlertsService, ContextService, CsrfTokenService,
            ImageUploadHelperService) {
          var placeholderImageDataUrl = (
            UrlInterpolationService.getStaticImageUrl(
              '/icons/story-image-icon.png'));
          var uploadedImage = null;
          $scope.thumbnailIsLoading = false;
          // $watch is required here to update the thumbnail image
          // everytime the thumbnail filename changes (eg. draft is discarded).
          // The trusted resource url for the thumbnail should not be directly
          // bound to ngSrc because it can cause an infinite digest error.
          // eslint-disable-next-line max-len
          // https://github.com/angular/angular.js/blob/master/CHANGELOG.md#sce-
          // This watcher is triggered only if the thumbnail filename of the
          // model changes. It would change for the following operations:
          // 1. Initial render of the page containing this directive.
          // 2. When a thumbnail is uploaded.
          // 3. When a saved draft is discarded.
          $scope.$watch('getFilename()', function(filename) {
            if (filename) {
              $scope.editableThumbnailDataUrl = (
                ImageUploadHelperService
                  .getTrustedResourceUrlForThumbnailFilename(
                    $scope.getFilename(),
                    ContextService.getEntityType(),
                    ContextService.getEntityId()));
              uploadedImage = $scope.editableThumbnailDataUrl;
            } else {
              $scope.editableThumbnailDataUrl = placeholderImageDataUrl;
              uploadedImage = null;
            }
            $scope.thumbnailIsLoading = false;
          });
          $scope.showEditThumbnailModal = function() {
            if ($scope.disabled) {
              return;
            }
            var openInUploadMode = true;
            // This refers to the temporary thumbnail background
            // color used for preview.
            var tempBgColor = (
              $scope.getBgColor() ||
              $scope.getAllowedBgColors()[0]);
            var tempImageName = '';
            var uploadedImageMimeType = '';
            var dimensions = {
              height: 0,
              width: 0
            };
            var allowedBgColors = $scope.getAllowedBgColors();
            var aspectRatio = $scope.getAspectRatio();
            var getPreviewDescription = $scope.getPreviewDescription;
            var getPreviewDescriptionBgColor = (
              $scope.getPreviewDescriptionBgColor);
            var getPreviewFooter = $scope.getPreviewFooter;
            var getPreviewTitle = $scope.getPreviewTitle;

            var saveThumbnailBgColor = function(newBgColor) {
              if (newBgColor !== $scope.getBgColor()) {
                $scope.updateBgColor(newBgColor);
              }
            };

            var saveThumbnailImageData = function(imageURI, callback) {
              let resampledFile = null;
              resampledFile = (
                ImageUploadHelperService.convertImageDataToImageFile(
                  imageURI));
              if (resampledFile === null) {
                AlertsService.addWarning('Could not get resampled file.');
                return;
              }
              postImageToServer(resampledFile, callback);
            };

            var postImageToServer = function(resampledFile, callback) {
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
                  callback();
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
              backdrop: true,
              controller: [
                '$scope', '$timeout', '$uibModalInstance',
                function($scope, $timeout, $uibModalInstance) {
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
                    if (isUploadedImageSvg()) {
                      $('.oppia-thumbnail-uploader').fadeOut(function() {
                        $scope.invalidImageWarningIsShown = false;
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
                      newBgColor: tempBgColor
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
              ]
            }).result.then(function(data) {
              $scope.thumbnailIsLoading = true;
              if (openInUploadMode) {
                tempImageName = (
                  ImageUploadHelperService.generateImageFilename(
                    dimensions.height, dimensions.width, 'svg'));
                saveThumbnailImageData(data.newThumbnailDataUrl, function() {
                  uploadedImage = data.newThumbnailDataUrl;
                  $scope.updateFilename(tempImageName);
                  saveThumbnailBgColor(data.newBgColor);
                  $rootScope.$apply();
                });
              } else {
                saveThumbnailBgColor(data.newBgColor);
                $scope.thumbnailIsLoading = false;
              }
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
