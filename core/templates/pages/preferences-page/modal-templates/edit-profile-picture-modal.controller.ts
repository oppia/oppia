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
 * @fileoverview Controller for edit profile picture modal.
 */

import Cropper from 'cropperjs';

require('cropperjs/dist/cropper.min.css');

require(
  'components/common-layout-directives/common-elements/' +
  'confirm-or-cancel-modal.controller.ts');

angular.module('oppia').controller('EditProfilePictureModalController', [
  '$controller', '$scope', '$timeout', '$uibModalInstance',
  'ALLOWED_IMAGE_FORMATS', function(
      $controller, $scope, $timeout, $uibModalInstance,
      ALLOWED_IMAGE_FORMATS) {
    $controller('ConfirmOrCancelModalController', {
      $scope: $scope,
      $uibModalInstance: $uibModalInstance
    });

    $scope.uploadedImage = null;
    $scope.croppedImageDataUrl = '';
    $scope.invalidImageWarningIsShown = false;
    $scope.allowedImageFormats = ALLOWED_IMAGE_FORMATS;
    let cropper = null;

    $scope.initialiseCropper = function() {
      let profilePicture = (
        <HTMLImageElement>document.getElementById(
          'croppable-image'));
      cropper = new Cropper(profilePicture, {
        minContainerWidth: 500,
        minContainerHeight: 350,
        aspectRatio: 1
      });
    };

    $scope.onFileChanged = function(file) {
      $('.oppia-profile-image-uploader').fadeOut(function() {
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
          $('.oppia-profile-image-uploader').fadeIn();
        }, 100);
      });
    };

    $scope.reset = function() {
      $scope.uploadedImage = null;
      $scope.croppedImageDataUrl = '';
    };

    $scope.onInvalidImageLoaded = function() {
      $scope.reset();
      $scope.invalidImageWarningIsShown = true;
    };

    $scope.confirm = function() {
      $scope.croppedImageDataUrl = (
        cropper.getCroppedCanvas({
          height: 150,
          width: 150
        }).toDataURL());
      $uibModalInstance.close($scope.croppedImageDataUrl);
    };
  }
]);
