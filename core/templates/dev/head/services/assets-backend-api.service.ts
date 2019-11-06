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

import {HttpClient} from '@angular/common/http';
import {AudioFileObjectFactory} from '../domain/utilities/AudioFileObjectFactory';
import {ImageFileObjectFactory} from '../domain/utilities/ImageFileObjectFactory';
import {UrlInterpolationService} from '../domain/utilities/url-interpolation.service';
import {FileDownloadRequestObjectFactory} from '../domain/utilities/FileDownloadRequestObjectFactory';
import Constants from '../../../../../assets/constants';
import {ServicesConstants} from './services.constants';
import { Observable } from "rxjs/Rx";

import {AppConstants} from '../app.constants';
import {timeout} from "rxjs/operators";
/**
 * @fileoverview Service to serve as the interface for fetching and uploading
 * assets from Google Cloud Storage.
 */

require('domain/utilities/AudioFileObjectFactory.ts');
require('domain/utilities/FileDownloadRequestObjectFactory.ts');
require('domain/utilities/ImageFileObjectFactory.ts');
require('domain/utilities/url-interpolation.service.ts');
require('services/csrf-token.service.ts');


export class AssetsBackendApiService {
  constructor(private httpClient: HttpClient, private audioFileObjectFactory: AudioFileObjectFactory,
              private fileDownloadRequestObjectFactory: FileDownloadRequestObjectFactory,
              private csrfTokenService: CsrfTokenService, private imageFileObjectFactory: ImageFileObjectFactory,
              private urlInterpolationService: UrlInterpolationService) {}

  _audioFilesCurrentlyBeingRequested = [];
  _imageFilesCurrentlyBeingRequested = [];

  ASSET_TYPE_AUDIO = 'audio';
  ASSET_TYPE_IMAGE = 'image';

  GCS_PREFIX = ('https://storage.googleapis.com/' +
      Constants.GCS_RESOURCE_BUCKET_NAME);
  AUDIO_DOWNLOAD_URL_TEMPLATE = (
      (Constants.DEV_MODE ? '/assetsdevhandler' : this.GCS_PREFIX) +
      '/<entity_type>/<entity_id>/assets/audio/<filename>');
  IMAGE_DOWNLOAD_URL_TEMPLATE = (
      (Constants.DEV_MODE ? '/assetsdevhandler' : this.GCS_PREFIX) +
      '/<entity_type>/<entity_id>/assets/image/<filename>');

  AUDIO_UPLOAD_URL_TEMPLATE =
      '/createhandler/audioupload/<exploration_id>';

  // Map from asset filename to asset blob.
  assetsCache = {};
  _fetchFile(
      entityType, entityId, filename, assetType, successCallback,
      errorCallback) {
    let canceler = Promise.reject();
    if (assetType === this.ASSET_TYPE_AUDIO) {
      this._audioFilesCurrentlyBeingRequested.push(
        this.fileDownloadRequestObjectFactory.createNew(filename, canceler));
    } else {
      this._imageFilesCurrentlyBeingRequested.push(
        this.fileDownloadRequestObjectFactory.createNew(filename, canceler));
    }


    // $http({
    //   method: 'GET',
    //   responseType: 'blob',
    //   url: _getDownloadUrl(entityType, entityId, filename, assetType),
    //   timeout: canceler.promise
    // }).success(function(data) {
    this.httpClient.get(
      this._getDownloadUrl(entityType, entityId, filename, assetType))
      .toPromise().then((data: any) => {
        let assetBlob = null;
        try {
          if (assetType === this.ASSET_TYPE_AUDIO) {
          // Add type for audio assets. Without this, translations can
          // not be played on Safari.
            assetBlob = new Blob([data], {type: 'audio/mpeg'});
          } else {
            assetBlob = new Blob([data]);
          }
        } catch (exception) {
          window.BlobBuilder = window.BlobBuilder ||
            window.WebKitBlobBuilder ||
            window.MozBlobBuilder ||
            window.MSBlobBuilder;
          if (exception.name === 'TypeError' && window.BlobBuilder) {
            try {
              let blobBuilder = new BlobBuilder();
              blobBuilder.append(data);
              assetBlob = blobBuilder.getBlob(assetType.concat('/*'));
            } catch (e) {
              let additionalInfo = (
                '\nBlobBuilder construction error debug logs:' +
                '\nAsset type: ' + assetType +
                '\nData: ' + data
              );
              e.message += additionalInfo;
              throw e;
            }
          } else {
            let additionalInfo = (
              '\nBlob construction error debug logs:' +
              '\nAsset type: ' + assetType +
              '\nData: ' + data
            );
            exception.message += additionalInfo;
            throw exception;
          }
        }
        this.assetsCache[filename] = assetBlob;
        if (assetType === this.ASSET_TYPE_AUDIO) {
          successCallback(
            this.audioFileObjectFactory.createNew(filename, assetBlob));
        } else {
          successCallback(
            this.imageFileObjectFactory.createNew(filename, assetBlob));
        }
      })['catch'](() => {
        errorCallback(filename);
      })['finally'](() => {
        this._removeFromFilesCurrentlyBeingRequested(filename, assetType);
      });
  }



  _abortAllCurrentDownloads(assetType) {
    if (assetType === this.ASSET_TYPE_AUDIO) {
      this._audioFilesCurrentlyBeingRequested.forEach(function(request) {
        request.canceler.resolve();
      });
      this._audioFilesCurrentlyBeingRequested = [];
    } else {
      this._imageFilesCurrentlyBeingRequested.forEach(function(request) {
        request.canceler.resolve();
      });
      this._imageFilesCurrentlyBeingRequested = [];
    }
  }

  _removeFromFilesCurrentlyBeingRequested(filename, assetType) {
    if (this._isAssetCurrentlyBeingRequested(filename, this.ASSET_TYPE_AUDIO)) {
      for (let index = 0; index <
    this._audioFilesCurrentlyBeingRequested.length; index++) {
        if (this._audioFilesCurrentlyBeingRequested[index].filename ===
            filename) {
          this._audioFilesCurrentlyBeingRequested.splice(index, 1);
          break;
        }
      }
    } else if (this._isAssetCurrentlyBeingRequested(
      filename, this.ASSET_TYPE_IMAGE)) {
      for (let index = 0; index <
    this._imageFilesCurrentlyBeingRequested.length; index++) {
        if (this._imageFilesCurrentlyBeingRequested[index].filename ===
            filename) {
          this._imageFilesCurrentlyBeingRequested.splice(index, 1);
          break;
        }
      }
    }
  }

  _saveAudio(
      explorationId, filename, rawAssetData, successCallback,
      errorCallback) {
    let form = new FormData();

    form.append('raw_audio_file', rawAssetData);
    form.append('payload', JSON.stringify({
      filename: filename
    }));
    this.csrfTokenService.getTokenAsync().then((token) => {
      form.append('csrf_token', token);
      $.ajax({
        url: this._getAudioUploadUrl(explorationId),
        data: form,
        processData: false,
        contentType: false,
        type: 'POST',
        dataType: 'text',
        dataFilter: function(data) {
        // Remove the XSSI prefix.
          let transformedData = data.substring(5);
          return JSON.parse(transformedData);
        },
      }).done(function(response) {
        if (successCallback) {
          successCallback(response);
        }
      }).fail(function(data) {
      // Remove the XSSI prefix.
        let transformedData = data.responseText.substring(5);
        let parsedResponse = angular.fromJson(transformedData);
        console.error(parsedResponse);
        if (errorCallback) {
          errorCallback(parsedResponse);
        }
      });
    });
  }

  _getDownloadUrl(entityType, entityId, filename, assetType) {
    return this.urlInterpolationService.interpolateUrl(
      (assetType === this.ASSET_TYPE_AUDIO ? this.AUDIO_DOWNLOAD_URL_TEMPLATE :
          this.IMAGE_DOWNLOAD_URL_TEMPLATE), {
        entity_id: entityId,
        entity_type: entityType,
        filename: filename
      });
  }

  _getAudioUploadUrl(explorationId) {
    return this.urlInterpolationService.interpolateUrl(
      this.AUDIO_UPLOAD_URL_TEMPLATE, {exploration_id: explorationId});
  }

  _isAssetCurrentlyBeingRequested(filename, assetType) {
    if (assetType === this.ASSET_TYPE_AUDIO) {
      return this._audioFilesCurrentlyBeingRequested.some(function(request) {
        return request.filename === filename;
      });
    } else {
      return this._imageFilesCurrentlyBeingRequested.some(function(request) {
        return request.filename === filename;
      });
    }
  }

  _isCached(filename) {
    return this.assetsCache.hasOwnProperty(filename);
  }

  loadAudio(explorationId, filename) {
    return new Promise((resolve, reject) => {
      if (this._isCached(filename)) {
        resolve(this.audioFileObjectFactory.createNew(
          filename, this.assetsCache[filename]));
      } else {
        this._fetchFile(
          AppConstants.ENTITY_TYPE.EXPLORATION, explorationId, filename,
          this.ASSET_TYPE_AUDIO, resolve, reject);
      }
    });
  }
  loadImage(entityType, entityId, filename) {
    return new Promise((resolve, reject) => {
      if (this._isCached(filename)) {
        resolve(this.imageFileObjectFactory.createNew(
          filename, this.assetsCache[filename]));
      } else {
        this._fetchFile(entityType, entityId, filename, this.ASSET_TYPE_IMAGE,
          resolve, reject);
      }
    });
  }

  saveAudio(explorationId, filename, rawAssetData) {
    return new Promise((resolve, reject) => {
      this._saveAudio(explorationId, filename, rawAssetData, resolve, reject);
    });
  }

  isCached(filename) {
    return this._isCached(filename);
  }

  getAudioDownloadUrl(entityType, entityId, filename) {
    return this._getDownloadUrl(
      entityType, entityId, filename, this.ASSET_TYPE_AUDIO);
  }

  abortAllCurrentAudioDownloads() {
    this._abortAllCurrentDownloads(this.ASSET_TYPE_AUDIO);
  }

  abortAllCurrentImageDownloads() {
    this._abortAllCurrentDownloads(this.ASSET_TYPE_IMAGE);
  }

  getAssetsFilesCurrentlyBeingRequested() {
    return { audio: this._audioFilesCurrentlyBeingRequested,
      image: this._imageFilesCurrentlyBeingRequested
    };
  }

  getImageUrlForPreview(entityType, entityId, filename) {
    return this._getDownloadUrl(
      entityType, entityId, filename, this.ASSET_TYPE_IMAGE);
  }
}
