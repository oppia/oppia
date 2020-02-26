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

require('services/context.service.ts');
require('services/csrf-token.service.ts');
require('services/image-upload-helper.service.ts');

angular.module('oppia').directive('thumbnailUploader', [
  'UrlInterpolationService', function(UrlInterpolationService) {
    return {
      restrict: 'E',
      scope: {
        disabled: '=',
        editableThumbnailDataUrl: '=',
        updateFilename: '='
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
          $scope.showEditThumbnailModal = function() {
            if ($scope.disabled) {
              return;
            }
            var tempImageName = '';

            var saveTopicThumbnailImageData = function(imageURI) {
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
                '/pages/topic-editor-page/modal-templates/' +
                'edit-topic-thumbnail-modal.template.html'),
              size: 'lg',
              backdrop: true,
              controller: [
                '$scope', '$timeout', '$uibModalInstance',
                'ImageUploadHelperService',
                function($scope, $timeout, $uibModalInstance,
                    ImageUploadHelperService) {
                  $scope.uploadedImage = null;
                  $scope.invalidImageWarningIsShown = false;
                  let cropper = null;

                  $scope.initialiseCropper = function() {
                    let thumbnailImage = (
                      <HTMLImageElement>document.getElementById(
                        'croppable-thumbnail'));
                    cropper = new Cropper(thumbnailImage, {
                      minContainerHeight: 405,
                      minContainerWidth: 720,
                      minCropBoxWidth: 180,
                      aspectRatio: 16 / 9
                    });
                  };
                  $scope.onFileChanged = function(file) {
                    tempImageName = (
                      ImageUploadHelperService.generateImageFilename(
                        150, 150, 'png'));
                    $('.oppia-thumbnail-uploader').fadeOut(function() {
                      $scope.invalidImageWarningIsShown = false;

                      var reader = new FileReader();
                      reader.onload = function(e) {
                        $scope.$apply(function() {
                          $scope.uploadedImage = (<FileReader>e.target).result;
                        });
                        $scope.initialiseCropper();
                      };
                      reader.readAsDataURL(file);
                      $timeout(function() {
                        $('.oppia-thumbnail-uploader').fadeIn();
                      }, 100);
                    });
                  };

                  $scope.reset = function() {
                    $scope.uploadedImage = null;
                  };

                  $scope.onInvalidImageLoaded = function() {
                    $scope.uploadedImage = null;
                    $scope.invalidImageWarningIsShown = true;
                  };

                  $scope.confirm = function() {
                    var croppedImageDataUrl = (cropper
                      .getCroppedCanvas()
                      .toDataURL());
                    $uibModalInstance.close(croppedImageDataUrl);
                  };

                  $scope.cancel = function() {
                    $uibModalInstance.dismiss('cancel');
                  };
                }
              ]
            }).result.then(function(newThumbnailDataUrl) {
              $scope.editableThumbnailDataUrl = newThumbnailDataUrl;
              $scope.updateFilename(tempImageName);
              saveTopicThumbnailImageData(newThumbnailDataUrl);
            });
          };
        }]
    };
  }
]);
