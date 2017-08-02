// Copyright 2017 The Oppia Authors. All Rights Reserved.
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
 * @fileoverview Service to serve as the interface for fetching and uploading
 * assets from Google Cloud Storage.
 */

oppia.factory('AssetsBackendApiService', [
  '$http', '$q', 'UrlInterpolationService',
  function(
      $http, $q, UrlInterpolationService) {
    var AUDIO_UPLOAD_URL_TEMPLATE =
      '/createhandler/audioupload/<exploration_id>';

    // Map from asset filename to asset blob.
    var assetsCache = {};
    var _fetchAudio = function(
        explorationId, filename, successCallback, errorCallback) {
      $http({
        method: 'GET',
        responseType: 'blob',
        url: _getAudioDownloadUrl(explorationId, filename),
      }).success(function(data) {
        var audioBlob = new Blob([data]);
        assetsCache[filename] = audioBlob;
        successCallback(audioBlob);
      }).error(errorCallback);
    };

    var _saveAudio = function(
        explorationId, filename, rawAssetData, successCallback,
        errorCallback) {
      var form = new FormData();
      
      form.append('raw', rawAssetData);
      form.append('payload', JSON.stringify({
        filename: filename
      }));
      form.append('csrf_token', GLOBALS.csrf_token);

      $.ajax({
        url: _getAudioUploadUrl(explorationId),
        data: form,
        processData: false,
        contentType: false,
        type: 'POST',
        dataType: 'text'
      }).done(function(response) {
        if (successCallback) {
          successCallback(response);
        }
      }).fail(function(error) {
        if (errorCallback) {
          errorCallback(error.data);
        }
      });
    };

    var _getAudioDownloadUrl = function(explorationId, filename) {
      return UrlInterpolationService.interpolateUrl(
        GLOBALS.AUDIO_URL_TEMPLATE, {
          exploration_id: explorationId,
          filename: filename
        });
    };

    var _getAudioUploadUrl = function(explorationId) {
      return UrlInterpolationService.interpolateUrl(AUDIO_UPLOAD_URL_TEMPLATE, {
        exploration_id: explorationId
      });
    };

    var _isCached = function(filename) {
      return assetsCache.hasOwnProperty(filename);
    };

    return {
      loadAudio: function(explorationId, filename) {
        return $q(function(resolve, reject) {
          if (_isCached(filename)) {
            resolve(assetsCache[filename]);
          } else {
            _fetchAudio(explorationId, filename, resolve, reject);
          }
        });
      },
      saveAudio: function(explorationId, filename, rawAssetData) {
        return $q(function(resolve, reject) {
          _saveAudio(explorationId, filename, rawAssetData, resolve, reject);
        });
      },
      isCached: function(filename) {
        return _isCached(filename);
      }
    };
  }
]);
