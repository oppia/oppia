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
 * @fileoverview Service for managing images in localStorage.
 */

require('services/alerts.service.ts');
require('services/image-upload-helper.service.ts');

angular.module('oppia').factory('ImageLocalStorageService', [
  '$window', 'AlertsService', 'ImageUploadHelperService', function(
      $window, AlertsService, ImageUploadHelperService) {
    var storedImageFilenames = [];
    // According to https://en.wikipedia.org/wiki/Web_storage, 5MB is the
    // minimum limit, for all browsers, per hostname, that can be stored in
    // sessionStorage and 100kB is the max size limit for uploaded images, hence
    // the limit below.
    var MAX_IMAGES_STORABLE = 5 * 1024 / 100;
    var newBgColor = null;

    return {
      getObjectUrlForImage: function(filename) {
        var urlCreator = window.URL || window.webkitURL;
        var imageBlob = ImageUploadHelperService.convertImageDataToImageFile(
          $window.sessionStorage.getItem(filename));
        return urlCreator.createObjectURL(imageBlob);
      },

      /**
       * Saves the image data in localStorage.
       * @param {string} filename - Filename of the image.
       * @param {string} rawImage - Raw base64/URLEncoded data of the image.
       */
      saveImage: function(filename, rawImage) {
        if (storedImageFilenames.length + 1 > MAX_IMAGES_STORABLE) {
          // Since the service is going to be used in the create modal for
          // entities, more images can be added after entity creation, when
          // local storage would no longer be used.
          AlertsService.addInfoMessage(
            'Image storage limit reached. More images can be added after ' +
            'creation.');
          return;
        }
        $window.sessionStorage.setItem(filename, rawImage);
        storedImageFilenames.push(filename);
      },

      deleteImage: function(filename) {
        $window.sessionStorage.removeItem(filename);
        var index = storedImageFilenames.indexOf(filename);
        storedImageFilenames.splice(index, 1);
      },

      getStoredImagesData: function() {
        var returnData = [];
        for (var idx in storedImageFilenames) {
          returnData.push({
            filename: storedImageFilenames[idx],
            imageBlob: ImageUploadHelperService.convertImageDataToImageFile(
              $window.sessionStorage.getItem(storedImageFilenames[idx]))
          });
        }
        return returnData;
      },
      setImageBgColor: function(bgColor) {
        newBgColor = bgColor;
      },
      getImageBgColor: function() {
        return newBgColor;
      },
      flushStoredImagesData: function() {
        $window.sessionStorage.clear();
        storedImageFilenames.length = 0;
        newBgColor = null;
      }
    };
  }
]);
