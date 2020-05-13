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

require('domain/utilities/url-interpolation.service.ts');
require('services/csrf-token.service.ts');
require('services/image-upload-helper.service.ts');

angular.module('oppia').factory('ImageLocalStorageService', [
  'CsrfTokenService', 'ImageUploadHelperService', 'UrlInterpolationService',
  function(
      CsrfTokenService, ImageUploadHelperService, UrlInterpolationService) {
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

      postImagesToServer: function(entityType, entityId) {
        var forms = [];
        var imageUploadUrlTemplate = '/createhandler/imageupload/' +
          '<entity_type>/<entity_id>';
        CsrfTokenService.getTokenAsync().then(function(token) {
          for (var idx in imagesStored) {
            var form = new FormData();
            var imageBlob = (
              ImageUploadHelperService.convertImageDataToImageFile(
                window.localStorage.getItem(imagesStored[idx])));
            form.append('image', imageBlob);
            form.append('payload', JSON.stringify({
              filename: imagesStored[idx]
            }));
            form.append('csrf_token', token);
            $.ajax({
              url: UrlInterpolationService.interpolateUrl(
                imageUploadUrlTemplate, {
                  entity_type: entityType,
                  entity_id: entityId
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
            });
          }
          imagesStored.length = 0;
        });
      }
    };
  }
]);
