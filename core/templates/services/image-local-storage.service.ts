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

require('services/image-upload-helper.service.ts');

angular.module('oppia').factory('ImageLocalStorageService', [
  'ImageUploadHelperService', function(ImageUploadHelperService) {
    var imagesStored = [];

    return {
      getObjectUrlForImage: function(filename) {
        var urlCreator = window.URL || window.webkitURL;
        var imageBlob = ImageUploadHelperService.convertImageDataToImageFile(
          window.localStorage.getItem(filename));
        return urlCreator.createObjectURL(imageBlob);
      },

      saveImage: function(filename, imageData) {
        window.localStorage.setItem(filename, imageData);
        imagesStored.push(filename);
      },

      deleteImage: function(filename) {
        window.localStorage.removeItem(filename);
        var index = imagesStored.indexOf(filename);
        imagesStored.splice(index, 1);
      },

      getStoredImagesData: function() {
        var returnData = [];
        for (var idx in imagesStored) {
          returnData.push({
            filename: imagesStored[idx],
            imageBlob: ImageUploadHelperService.convertImageDataToImageFile(
              window.localStorage.getItem(imagesStored[idx]))
          });
        }
        return returnData;
      }
    };
  }
]);
