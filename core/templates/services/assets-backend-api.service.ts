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

import { downgradeInjectable } from '@angular/upgrade/static';
import { Injectable } from '@angular/core';


import { AppConstants } from 'app.constants';
import { HttpClient } from '@angular/common/http';
import { FileDownloadRequestObjectFactory, FileDownloadRequest } from
  'domain/utilities/FileDownloadRequestObjectFactory';
import { AudioFileObjectFactory, AudioFile } from
  'domain/utilities/AudioFileObjectFactory';
import { CsrfTokenService } from
  'services/csrf-token.service';
import { Subscription } from 'rxjs';
import { ImageFileObjectFactory, ImageFile } from
  'domain/utilities/ImageFileObjectFactory';
import { UrlInterpolationService } from
  'domain/utilities/url-interpolation.service';


require('domain/utilities/AudioFileObjectFactory.ts');
require('domain/utilities/FileDownloadRequestObjectFactory.ts');
require('domain/utilities/ImageFileObjectFactory.ts');
require('domain/utilities/url-interpolation.service.ts');
require('services/csrf-token.service.ts');

const constants = require('constants.ts');


interface PendingRequestsType {
  audio: FileDownloadRequest[];
  image: FileDownloadRequest[];
}

interface AssetTypeToDownloadUrlTemplateType {
  [assetType: string]: string;
}

interface AssetsCacheType {
  [filename: string]: Blob;
}

@Injectable({
  providedIn: 'root'
})
export class AssetsBackendApiService {
  ASSET_TYPE_AUDIO: string = 'audio';
  ASSET_TYPE_IMAGE: string = 'image';
  ASSET_TYPE_THUMBNAIL: string = 'thumbnail';
  AUDIO_UPLOAD_URL_TEMPLATE: string =
    '/createhandler/audioupload/<exploration_id>';
  ASSET_TYPE_TO_DOWNLOAD_URL_TEMPLATE:
    AssetTypeToDownloadUrlTemplateType;
  _audioFilesCurrentlyBeingRequested: FileDownloadRequest[];
  _imageFilesCurrentlyBeingRequested: FileDownloadRequest[];
  assetsCache: AssetsCacheType;

  constructor(
    private http: HttpClient,
    private audioFileObjectFactory: AudioFileObjectFactory,
    private csrfTokenService: CsrfTokenService,
    private fileDownloadRequestObjectFactory:
      FileDownloadRequestObjectFactory,
    private imageFileObjectFactory: ImageFileObjectFactory,
    private urlInterpolationService: UrlInterpolationService
  ) {
    if (!Constants.DEV_MODE && !Constants.GCS_RESOURCE_BUCKET_NAME) {
      throw new Error('GCS_RESOURCE_BUCKET_NAME is not set in prod.');
    }

    // List of filenames that have been requested for but have
    // yet to return a response.
    this._audioFilesCurrentlyBeingRequested = [];
    this._imageFilesCurrentlyBeingRequested = [];


    let GCS_PREFIX = ('https://storage.googleapis.com/' +
      Constants.GCS_RESOURCE_BUCKET_NAME);
    let AUDIO_DOWNLOAD_URL_TEMPLATE = (
      (Constants.DEV_MODE ? '/assetsdevhandler' : GCS_PREFIX) +
      '/<entity_type>/<entity_id>/assets/audio/<filename>');
    let IMAGE_DOWNLOAD_URL_TEMPLATE = (
      (Constants.DEV_MODE ? '/assetsdevhandler' : GCS_PREFIX) +
      '/<entity_type>/<entity_id>/assets/image/<filename>');
    let THUMBNAIL_DOWNLOAD_URL_TEMPLATE = (
      (Constants.DEV_MODE ? '/assetsdevhandler' : GCS_PREFIX) +
      '/<entity_type>/<entity_id>/assets/thumbnail/<filename>');


    this.ASSET_TYPE_TO_DOWNLOAD_URL_TEMPLATE = {
      [this.ASSET_TYPE_AUDIO]: AUDIO_DOWNLOAD_URL_TEMPLATE,
      [this.ASSET_TYPE_IMAGE]: IMAGE_DOWNLOAD_URL_TEMPLATE,
      [this.ASSET_TYPE_THUMBNAIL]: THUMBNAIL_DOWNLOAD_URL_TEMPLATE
    };

    // Map from asset filename to asset blob.
    this.assetsCache = {};
  }

  private _fetchFile(
      entityType: string,
      entityId: string,
      filename: string,
      assetType: string,
      successCallback: (value?: Object | PromiseLike<Object>) => void,
      errorCallback: (reason?: any) => void
  ): void {
    const subscription: Subscription = this.http.get(
      this._getDownloadUrl(entityType, entityId, filename, assetType),
      {
        responseType: 'blob',
        observe: 'body'
      }
    ).subscribe(
      data => {
        const assetBlob: Blob = new Blob([data], {type: data.type});
        this.assetsCache[filename] = assetBlob;
        if (assetType === this.ASSET_TYPE_AUDIO) {
          this.audioFileObjectFactory.createNew(filename, assetBlob);
          successCallback(
            this.audioFileObjectFactory.createNew(filename, assetBlob));
        } else {
          successCallback(
            this.imageFileObjectFactory.createNew(filename, assetBlob));
        }
        this._removeFromFilesCurrentlyBeingRequested(filename, assetType);
      },
      err => {
        errorCallback(filename);
        this._removeFromFilesCurrentlyBeingRequested(filename, assetType);
      }
    );
    if (assetType === this.ASSET_TYPE_AUDIO) {
      this._audioFilesCurrentlyBeingRequested.push(
        this.fileDownloadRequestObjectFactory.createNew(
          filename, subscription)
      );
    } else {
      this._imageFilesCurrentlyBeingRequested.push(
        this.fileDownloadRequestObjectFactory.createNew(
          filename, subscription)
      );
    }
  }

  private _removeXSSIPrefix(data: string): any {
    const transformedData: string = data.substring(5);
    const parsedResponse: any = JSON.parse(transformedData);
    return parsedResponse;
  }

  private _abortAllCurrentDownloads(assetType: string): void {
    if (assetType === this.ASSET_TYPE_AUDIO) {
      this._audioFilesCurrentlyBeingRequested.forEach(function(request) {
        request.subscription.unsubscribe();
      });
      this._audioFilesCurrentlyBeingRequested = [];
    } else {
      this._imageFilesCurrentlyBeingRequested.forEach(function(request) {
        request.subscription.unsubscribe();
      });
      this._imageFilesCurrentlyBeingRequested = [];
    }
  }

  private _removeFromFilesCurrentlyBeingRequested(
      filename: string, assetType: string): void {
    if (this._isAssetCurrentlyBeingRequested(filename, this.ASSET_TYPE_AUDIO)) {
      for (let index: number = 0; index <
           this._audioFilesCurrentlyBeingRequested.length; index++) {
        if (
          this._audioFilesCurrentlyBeingRequested[index].filename === filename
        ) {
          this._audioFilesCurrentlyBeingRequested.splice(index, 1);
          break;
        }
      }
    } else if (
      this._isAssetCurrentlyBeingRequested(filename, this.ASSET_TYPE_IMAGE)
    ) {
      for (let index: number = 0; index <
           this._imageFilesCurrentlyBeingRequested.length; index++) {
        if (
          this._imageFilesCurrentlyBeingRequested[index].filename === filename
        ) {
          this._imageFilesCurrentlyBeingRequested.splice(index, 1);
          break;
        }
      }
    }
  }

  private _saveAudio(
      explorationId: string,
      filename: string,
      rawAssetData: File,
      successCallback: (value?: Object | PromiseLike<Object>) => void,
      errorCallback: (reason?: any) => void
  ): void {
    const form: FormData = new FormData();

    form.append('raw_audio_file', rawAssetData);
    form.append('payload', JSON.stringify({
      filename: filename
    }));
    this.csrfTokenService.getTokenAsync().then(function(token: string) {
      form.append('csrf_token', token);
      $.ajax({
        url: this._getAudioUploadUrl(explorationId),
        data: form,
        processData: false,
        contentType: false,
        type: 'POST',
        dataType: 'text',
        dataFilter: this._removeXSSIPrefix,
      }).done(function(response) {
        if (successCallback) {
          successCallback(response);
        }
      }).fail(function(data) {
        // Remove the XSSI prefix.
        const parsedResponse: any = this._removeXSSIPrefix(data.responseText);
        if (errorCallback) {
          errorCallback(parsedResponse);
        }
      });
    });
  }

  private _getDownloadUrl(
      entityType: string,
      entityId: string,
      filename: string,
      assetType: string
  ): string {
    const urlTemplate: string =
      this.ASSET_TYPE_TO_DOWNLOAD_URL_TEMPLATE[assetType];
    return this.urlInterpolationService.interpolateUrl(
      urlTemplate, {
        entity_id: entityId,
        entity_type: entityType,
        filename: filename
      });
  }

  private _getAudioUploadUrl(explorationId: string): string {
    return this.urlInterpolationService.interpolateUrl(
      this.AUDIO_UPLOAD_URL_TEMPLATE,
      {exploration_id: explorationId}
    );
  }

  private _isAssetCurrentlyBeingRequested(
      filename: string, assetType: string): boolean {
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

  private _isCached(filename: string): boolean {
    return this.assetsCache.hasOwnProperty(filename);
  }

  loadAudio(explorationId: string, filename: string): Promise<AudioFile> {
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

  loadImage(
      entityType: string,
      entityId: string,
      filename: string
  ): Promise<ImageFile> {
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

  saveAudio(
      explorationId: string, filename: string,
      rawAssetData: File): Promise<string> {
    return new Promise((resolve, reject) => {
      this._saveAudio(explorationId, filename, rawAssetData, resolve, reject);
    });
  }

  isCached(filename: string): boolean {
    return this._isCached(filename);
  }

  getAudioDownloadUrl(
      entityType: string, entityId: string, filename: string): string {
    return this._getDownloadUrl(
      entityType, entityId, filename, this.ASSET_TYPE_AUDIO);
  }

  abortAllCurrentAudioDownloads(): void {
    this._abortAllCurrentDownloads(this.ASSET_TYPE_AUDIO);
  }

  abortAllCurrentImageDownloads(): void {
    this._abortAllCurrentDownloads(this.ASSET_TYPE_IMAGE);
  }

  getAssetsFilesCurrentlyBeingRequested(): PendingRequestsType {
    return {
      audio: this._audioFilesCurrentlyBeingRequested,
      image: this._imageFilesCurrentlyBeingRequested
    };
  }

  getImageUrlForPreview(
      entityType: string, entityId: string, filename: string): string {
    return this._getDownloadUrl(
      entityType, entityId, filename, this.ASSET_TYPE_IMAGE);
  }

  getThumbnailUrlForPreview(
      entityType: string, entityId: string, filename: string): string {
    return this._getDownloadUrl(
      entityType, entityId, filename, this.ASSET_TYPE_THUMBNAIL);
  }
}

angular.module('oppia').factory(
  'AssetsBackendApiService',
  downgradeInjectable(AssetsBackendApiService)
);

