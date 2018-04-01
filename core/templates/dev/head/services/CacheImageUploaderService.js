// Copyright 2018 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Service for uploading image to cache
 */

oppia.factory('CacheImageUploaderService', [
  '$sce', 'AlertsService', function($sce, AlertsService) {
    var convertImageDataToImageFile = function(dataURI) {
      // Convert base64/URLEncoded data component to raw binary data
      // held in a string.
      var byteString = atob(dataURI.split(',')[1]);

      // Separate out the mime component.
      var mime = dataURI.split(',')[0].split(':')[1].split(';')[0];

      // Write the bytes of the string to a typed array.
      var ia = new Uint8Array(byteString.length);
      for (var i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
      }

      var blob = new Blob([ia], {type: mime});
      if (blob.type.match('image') &&
          blob.size > 0) {
        return blob;
      } else {
        return null;
      }
    };

    var _generateImageFilename = function() {
      var date = new Date();
      return 'img_' +
          date.getFullYear() +
          ('0' + (date.getMonth() + 1)).slice(-2) +
          ('0' + date.getDate()).slice(-2) +
          '_' +
          ('0' + date.getHours()).slice(-2) +
          ('0' + date.getMinutes()).slice(-2) +
          ('0' + date.getSeconds()).slice(-2) +
          '_' +
          Math.random().toString(36).substr(2, 10) +
          '.' + 'png';
    };

    var generatedImageFilename;
    var imageData = {};

    var sourceUrl = function(filename, explorationId) {
      return '/imagehandler/' + explorationId + '/' + filename;
    };

    var _uploadImageToCache = function(imageData, explorationId) {
      generatedImageFilename = _generateImageFilename();
      newImageFile = convertImageDataToImageFile(imageData);

      imageData.uploadedFile = newImageFile;
      imageData.uploadedImageData = imageData;

      var form = new FormData();
      form.append('image', newImageFile);
      form.append('payload', JSON.stringify({
        filename: generatedImageFilename
      }));
      form.append('csrf_token', GLOBALS.csrf_token);

      $.ajax({
        url: '/createhandler/imageupload/' + explorationId,
        data: form,
        processData: false,
        contentType: false,
        async: false,
        type: 'POST',
        dataFilter: function(data) {
          // Remove the XSSI prefix.
          var transformedData = data.substring(5);
          return JSON.parse(transformedData);
        },
        dataType: 'text'
      }).fail(function(data) {
        var transformedData = data.responseText.substring(5);
        var parsedResponse = JSON.parse(transformedData);
        AlertsService.addWarning(
          parsedResponse.error || 'Error communicating with server.');
      });
      return sourceUrl(generatedImageFilename, explorationId);
    };

    return {
      uploadImageToCache: function(imageData, explorationId) {
        return _uploadImageToCache(imageData, explorationId);
      },
      filepath: function() {
        return generatedImageFilename;
      }
    };
  }]);
