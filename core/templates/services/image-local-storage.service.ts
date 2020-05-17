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
  'AlertsService', 'ImageUploadHelperService', function(
      AlertsService, ImageUploadHelperService) {
    var imagesStored = [];
    // According to https://en.wikipedia.org/wiki/Web_storage, 5MB is the
    // minimum limit, for all browsers, that can be stored in localStorage.
    var imageStorageLimit = 5 * 1024 / 100;

    return {
      getObjectUrlForImage: function(filename) {
        var urlCreator = window.URL || window.webkitURL;
        var imageBlob = ImageUploadHelperService.convertImageDataToImageFile(
          window.localStorage.getItem(filename));
        return urlCreator.createObjectURL(imageBlob);
      },

      /**
       * Saves the image data in localStorage.
       * @param {string} filename - Filename of the image.
       * @param {string} rawImage - Raw base64/URLEncoded data of the image.
       */
      saveImage: function(filename, rawImage) {
        if (imagesStored.length + 1 > imageStorageLimit) {
          // Since the service is going to be used in the create modal for
          // entities, more images can be added after entity creation, when
          // local storage would no longer be used.
          AlertsService.addInfoMessage(
            'Image storage limit reached. More images can be added after ' +
            'creation.');
          return;
        }
        window.localStorage.setItem(filename, rawImage);
        imagesStored.push(filename);
      },

      deleteImage: function(filename) {
        window.localStorage.removeItem(filename);
        var index = imagesStored.indexOf(filename);
        imagesStored.splice(index, 1);
      },

      getAndFlushStoredImagesData: function() {
        var returnData = [];
        for (var idx in imagesStored) {
          returnData.push({
            filename: imagesStored[idx],
            imageBlob: ImageUploadHelperService.convertImageDataToImageFile(
              window.localStorage.getItem(imagesStored[idx]))
          });
        }
        imagesStored.length = 0;
        return returnData;
      }
    };
  }
]);
