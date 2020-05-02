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
// Jquery import is needed here in order to spy ajax method on unit tests.
import $ from 'jquery';

require('domain/utilities/AudioFileObjectFactory.ts');
require('domain/utilities/FileDownloadRequestObjectFactory.ts');
require('domain/utilities/ImageFileObjectFactory.ts');
require('domain/utilities/url-interpolation.service.ts');
require('services/csrf-token.service.ts');

angular.module('oppia').factory('AssetsBackendApiService', [
  '$http', '$q', 'AudioFileObjectFactory', 'CsrfTokenService',
  'FileDownloadRequestObjectFactory', 'ImageFileObjectFactory',
  'UrlInterpolationService', 'DEV_MODE', 'ENTITY_TYPE',
  'GCS_RESOURCE_BUCKET_NAME',
  function(
      $http, $q, AudioFileObjectFactory, CsrfTokenService,
      FileDownloadRequestObjectFactory, ImageFileObjectFactory,
      UrlInterpolationService, DEV_MODE, ENTITY_TYPE,
      GCS_RESOURCE_BUCKET_NAME) {
    if (!DEV_MODE && !GCS_RESOURCE_BUCKET_NAME) {
      throw new Error('GCS_RESOURCE_BUCKET_NAME is not set in prod.');
    }

    // List of filenames that have been requested for but have
    // yet to return a response.
    var _audioFilesCurrentlyBeingRequested = [];
    var _imageFilesCurrentlyBeingRequested = [];

    var ASSET_TYPE_AUDIO = 'audio';
    var ASSET_TYPE_IMAGE = 'image';
    var ASSET_TYPE_THUMBNAIL = 'thumbnail';

    var GCS_PREFIX = ('https://storage.googleapis.com/' +
      GCS_RESOURCE_BUCKET_NAME);
    var AUDIO_DOWNLOAD_URL_TEMPLATE = (
      (DEV_MODE ? '/assetsdevhandler' : GCS_PREFIX) +
      '/<entity_type>/<entity_id>/assets/audio/<filename>');
    var IMAGE_DOWNLOAD_URL_TEMPLATE = (
      (DEV_MODE ? '/assetsdevhandler' : GCS_PREFIX) +
      '/<entity_type>/<entity_id>/assets/image/<filename>');
    var THUMBNAIL_DOWNLOAD_URL_TEMPLATE = (
      (DEV_MODE ? '/assetsdevhandler' : GCS_PREFIX) +
      '/<entity_type>/<entity_id>/assets/thumbnail/<filename>');

    var AUDIO_UPLOAD_URL_TEMPLATE =
      '/createhandler/audioupload/<exploration_id>';

    var ASSET_TYPE_TO_DOWNLOAD_URL_TEMPLATE = {
      [ASSET_TYPE_AUDIO]: AUDIO_DOWNLOAD_URL_TEMPLATE,
      [ASSET_TYPE_IMAGE]: IMAGE_DOWNLOAD_URL_TEMPLATE,
      [ASSET_TYPE_THUMBNAIL]: THUMBNAIL_DOWNLOAD_URL_TEMPLATE
    };

    // Map from asset filename to asset blob.
    var assetsCache = {};
    var _fetchFile = function(
        entityType, entityId, filename, assetType, successCallback,
        errorCallback) {
      var canceler = $q.defer();
      if (assetType === ASSET_TYPE_AUDIO) {
        _audioFilesCurrentlyBeingRequested.push(
          FileDownloadRequestObjectFactory.createNew(filename, canceler));
      } else {
        _imageFilesCurrentlyBeingRequested.push(
          FileDownloadRequestObjectFactory.createNew(filename, canceler));
      }

      $http({
        method: 'GET',
        responseType: 'blob',
        url: _getDownloadUrl(entityType, entityId, filename, assetType),
        timeout: canceler.promise
      }).then(function(response) {
        var assetBlob = null;
        var data = response.data;
        try {
          assetBlob = new Blob([data], {type: data.type});
        } catch (exception) {
          window.BlobBuilder = window.BlobBuilder ||
                         window.WebKitBlobBuilder ||
                         window.MozBlobBuilder ||
                         window.MSBlobBuilder;
          if (exception.name === 'TypeError' && window.BlobBuilder) {
            var blobBuilder = new BlobBuilder();
            blobBuilder.append(data);
            assetBlob = blobBuilder.getBlob(assetType.concat('/*'));
          } else {
            var additionalInfo = (
              '\nBlob construction error debug logs:' +
              '\nAsset type: ' + assetType +
              '\nData: ' + data
            );
            exception.message += additionalInfo;
            throw exception;
          }
        }
        assetsCache[filename] = assetBlob;
        if (assetType === ASSET_TYPE_AUDIO) {
          successCallback(
            AudioFileObjectFactory.createNew(filename, assetBlob));
        } else {
          successCallback(
            ImageFileObjectFactory.createNew(filename, assetBlob));
        }
      })['catch'](function() {
        errorCallback(filename);
      })['finally'](function() {
        _removeFromFilesCurrentlyBeingRequested(filename, assetType);
      });
    };

    var removeXSSIPrefix = function(data) {
      var transformedData = data.substring(5);
      var parsedResponse = JSON.parse(transformedData);
      return parsedResponse;
    };

    var _abortAllCurrentDownloads = function(assetType) {
      if (assetType === ASSET_TYPE_AUDIO) {
        _audioFilesCurrentlyBeingRequested.forEach(function(request) {
          request.canceler.resolve();
        });
        _audioFilesCurrentlyBeingRequested = [];
      } else {
        _imageFilesCurrentlyBeingRequested.forEach(function(request) {
          request.canceler.resolve();
        });
        _imageFilesCurrentlyBeingRequested = [];
      }
    };

    var _removeFromFilesCurrentlyBeingRequested = function(filename,
        assetType) {
      if (_isAssetCurrentlyBeingRequested(filename, ASSET_TYPE_AUDIO)) {
        for (var index = 0; index <
             _audioFilesCurrentlyBeingRequested.length; index++) {
          if (_audioFilesCurrentlyBeingRequested[index].filename === filename) {
            _audioFilesCurrentlyBeingRequested.splice(index, 1);
            break;
          }
        }
      } else if (_isAssetCurrentlyBeingRequested(filename, ASSET_TYPE_IMAGE)) {
        for (var index = 0; index <
             _imageFilesCurrentlyBeingRequested.length; index++) {
          if (_imageFilesCurrentlyBeingRequested[index].filename === filename) {
            _imageFilesCurrentlyBeingRequested.splice(index, 1);
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
      CsrfTokenService.getTokenAsync().then(function(token) {
        form.append('csrf_token', token);
        $.ajax({
          url: _getAudioUploadUrl(explorationId),
          data: form,
          processData: false,
          contentType: false,
          type: 'POST',
          dataType: 'text',
          dataFilter: removeXSSIPrefix,
        }).done(function(response) {
          if (successCallback) {
            successCallback(response);
          }
        }).fail(function(data) {
          // Remove the XSSI prefix.
          var parsedResponse = removeXSSIPrefix(data.responseText);
          if (errorCallback) {
            errorCallback(parsedResponse);
          }
        });
      });
    };

    var _getDownloadUrl = function(entityType, entityId, filename, assetType) {
      var urlTemplate = null;
      urlTemplate = ASSET_TYPE_TO_DOWNLOAD_URL_TEMPLATE[assetType];
      return UrlInterpolationService.interpolateUrl(
        urlTemplate, {
          entity_id: entityId,
          entity_type: entityType,
          filename: filename
        });
    };

    var _getAudioUploadUrl = function(explorationId) {
      return UrlInterpolationService.interpolateUrl(AUDIO_UPLOAD_URL_TEMPLATE, {
        exploration_id: explorationId
      });
    };

    var _isAssetCurrentlyBeingRequested = function(filename, assetType) {
      if (assetType === ASSET_TYPE_AUDIO) {
        return _audioFilesCurrentlyBeingRequested.some(function(request) {
          return request.filename === filename;
        });
      } else {
        return _imageFilesCurrentlyBeingRequested.some(function(request) {
          return request.filename === filename;
        });
      }
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
          } else {
            _fetchFile(
              ENTITY_TYPE.EXPLORATION, explorationId, filename,
              ASSET_TYPE_AUDIO, resolve, reject);
          }
        });
      },
      loadImage: function(entityType, entityId, filename) {
        return $q(function(resolve, reject) {
          if (_isCached(filename)) {
            resolve(ImageFileObjectFactory.createNew(
              filename, assetsCache[filename]));
          } else {
            _fetchFile(entityType, entityId, filename, ASSET_TYPE_IMAGE,
              resolve, reject);
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
      getAudioDownloadUrl: function(entityType, entityId, filename) {
        return _getDownloadUrl(
          entityType, entityId, filename, ASSET_TYPE_AUDIO);
      },
      abortAllCurrentAudioDownloads: function() {
        _abortAllCurrentDownloads(ASSET_TYPE_AUDIO);
      },
      abortAllCurrentImageDownloads: function() {
        _abortAllCurrentDownloads(ASSET_TYPE_IMAGE);
      },
      getAssetsFilesCurrentlyBeingRequested: function() {
        return { audio: _audioFilesCurrentlyBeingRequested,
          image: _imageFilesCurrentlyBeingRequested
        };
      },
      getImageUrlForPreview: function(entityType, entityId, filename) {
        return _getDownloadUrl(
          entityType, entityId, filename, ASSET_TYPE_IMAGE);
      },
      getThumbnailUrlForPreview: function(entityType, entityId, filename) {
        return _getDownloadUrl(
          entityType, entityId, filename, ASSET_TYPE_THUMBNAIL);
      }
    };
  }
]);
