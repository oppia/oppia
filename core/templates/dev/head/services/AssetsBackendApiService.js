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
  '$http', '$q', 'UrlInterpolationService', 'AudioFileObjectFactory',
  'FileDownloadRequestObjectFactory',
  function(
      $http, $q, UrlInterpolationService, AudioFileObjectFactory,
      FileDownloadRequestObjectFactory) {
    // List of filenames that have been requested for but have
    // yet to return a response.
    var _filesCurrentlyBeingRequested = [];

    var AUDIO_DOWNLOAD_URL_TEMPLATE = (
      GLOBALS.GCS_RESOURCE_BUCKET_NAME ?
        ('https://storage.googleapis.com/' + GLOBALS.GCS_RESOURCE_BUCKET_NAME +
       '/<exploration_id>/assets/audio/<filename>') :
        '/audiohandler/<exploration_id>/audio/<filename>');
    var AUDIO_UPLOAD_URL_TEMPLATE =
      '/createhandler/audioupload/<exploration_id>';

    // Map from asset filename to asset blob.
    var assetsCache = {};
    var _fetchAudio = function(
        explorationId, filename, successCallback, errorCallback) {
      var canceler = $q.defer();
      _filesCurrentlyBeingRequested.push(
        FileDownloadRequestObjectFactory.createNew(filename, canceler));
      $http({
        method: 'GET',
        responseType: 'blob',
        url: _getAudioDownloadUrl(explorationId, filename),
        timeout: canceler.promise
      }).success(function(data) {
        try {
          var audioBlob = new Blob([data]);
        } catch (exception) {
          window.BlobBuilder = window.BlobBuilder ||
                         window.WebKitBlobBuilder ||
                         window.MozBlobBuilder ||
                         window.MSBlobBuilder;
          if (exception.name === 'TypeError' && window.BlobBuilder) {
            var blobBuilder = new BlobBuilder();
            blobBuilder.append(data);
            var audioBlob = blobBuilder.getBlob('audio/*');
          } else {
            throw exception;
          }
        }
        assetsCache[filename] = audioBlob;
        successCallback(AudioFileObjectFactory.createNew(filename, audioBlob));
      }).error(function() {
        errorCallback();
      })['finally'](function() {
        _removeFromFilesCurrentlyBeingRequested(filename);
      });
    };

    var _abortAllCurrentDownloads = function() {
      _filesCurrentlyBeingRequested.forEach(function(request) {
        request.canceler.resolve();
      });
      _filesCurrentlyBeingRequested = [];
    };

    var _removeFromFilesCurrentlyBeingRequested = function(filename) {
      if (_isCurrentlyBeingRequested(filename)) {
        for (var index = 0; index <
             _filesCurrentlyBeingRequested.length; index++) {
          if (_filesCurrentlyBeingRequested[index].filename === filename) {
            _filesCurrentlyBeingRequested.splice(index, 1);
            break;
          }
        }
      }
    };

    var _saveAudio = function(
        explorationId, filename, rawAssetData, successCallback,
        errorCallback) {
      var form = new FormData();

      form.append('raw_audio_file', rawAssetData);
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
        dataType: 'text',
        dataFilter: function(data) {
          // Remove the XSSI prefix.
          var transformedData = data.substring(5);
          return JSON.parse(transformedData);
        },
      }).done(function(response) {
        if (successCallback) {
          successCallback(response);
        }
      }).fail(function(data) {
        // Remove the XSSI prefix.
        var transformedData = data.responseText.substring(5);
        var parsedResponse = angular.fromJson(transformedData);
        console.error(parsedResponse);
        if (errorCallback) {
          errorCallback(parsedResponse);
        }
      });
    };

    var _getAudioDownloadUrl = function(explorationId, filename) {
      return UrlInterpolationService.interpolateUrl(
        AUDIO_DOWNLOAD_URL_TEMPLATE, {
          exploration_id: explorationId,
          filename: filename
        });
    };

    var _getAudioUploadUrl = function(explorationId) {
      return UrlInterpolationService.interpolateUrl(AUDIO_UPLOAD_URL_TEMPLATE, {
        exploration_id: explorationId
      });
    };

    var _isCurrentlyBeingRequested = function(filename) {
      return _filesCurrentlyBeingRequested.some(function(request) {
        return request.filename === filename;
      });
    };

    var _isCached = function(filename) {
      return assetsCache.hasOwnProperty(filename);
    };

    return {
      loadAudio: function(explorationId, filename) {
        return $q(function(resolve, reject) {
          if (_isCached(filename)) {
            resolve(AudioFileObjectFactory.createNew(
              filename, assetsCache[filename]));
          } else if (!_isCurrentlyBeingRequested(filename)) {
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
      },
      getAudioDownloadUrl: function(explorationId, filename) {
        return _getAudioDownloadUrl(explorationId, filename);
      },
      abortAllCurrentDownloads: function() {
        _abortAllCurrentDownloads();
      },
      getFilesCurrentlyBeingRequested: function() {
        return _filesCurrentlyBeingRequested;
      }
    };
  }
]);
